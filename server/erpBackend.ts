import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import {
  AccountStatus,
  AuditLogEntry,
  Company,
  EmploymentStatus,
  ERPState,
  ModuleId,
  PermissionId,
  SafeUserAccount,
  UserAccount,
  UserCompanyAccess,
} from '../src/types/erp';
import {
  ALL_MODULE_IDS,
  ALL_PERMISSION_IDS,
  INITIAL_ERP_STATE,
} from '../src/utils/erpConfig';

const SESSION_SECRET = process.env.ERP_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const DB_FILE_PATH = process.env.VERCEL
  ? '/tmp/rfb-rbi-erp-db-v3.json'
  : path.join(process.cwd(), '.data', 'erp-db-v3.json');
const LEGACY_DB_FILE_PATH = process.env.VERCEL
  ? '/tmp/rfb-rbi-erp-db-v2.json'
  : path.join(process.cwd(), '.data', 'erp-db-v2.json');

interface SessionPayload {
  sid: string;
  uid: string;
  cid: string | null;
  iat: number;
  exp: number;
}

interface AuthedRequest extends Request {
  session?: SessionPayload;
  user?: UserAccount;
  activeCompany?: Company;
  activeAccess?: UserCompanyAccess;
}

const revokedSessionIds = new Set<string>();
const userInvalidatedBefore = new Map<string, number>();

function nowTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64, { N: 16384, r: 8, p: 1 }).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

function verifyPassword(plain: string, storedHash?: string): boolean {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const [, salt, expectedHex] = parts;
  if (!salt || !expectedHex) return false;
  try {
    const derived = crypto.scryptSync(plain, salt, 64, { N: 16384, r: 8, p: 1 });
    const expected = Buffer.from(expectedHex, 'hex');
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function normalizeUserRecord(raw: UserAccount): UserAccount {
  const passwordHash =
    raw.passwordHash && raw.passwordHash.startsWith('scrypt$')
      ? raw.passwordHash
      : hashPassword(raw.password || raw.username);

  return {
    id: raw.id,
    username: raw.username,
    passwordHash,
    employeeCode: raw.employeeCode || `EMP-${raw.username.toUpperCase().slice(0, 6)}`,
    fullName: raw.fullName || raw.username,
    department: raw.department || 'Operations',
    position: raw.position || raw.roleLabel || 'Staff',
    employeeId: raw.employeeId || '',
    roleLabel: raw.roleLabel || raw.position || 'Staff',
    isAdmin: Boolean(raw.isAdmin),
    accountStatus: raw.accountStatus || 'Active',
    employmentStatus: raw.employmentStatus || 'Regular',
    mustChangePassword: Boolean(raw.mustChangePassword),
    dateCreated: raw.dateCreated || todayISO(),
    lastLogin: raw.lastLogin,
    createdBy: raw.createdBy || 'System Setup',
    updatedBy: raw.updatedBy || 'System Setup',
    updatedAt: raw.updatedAt,
    passwordUpdatedAt: raw.passwordUpdatedAt,
    allowedModules: Array.isArray(raw.allowedModules) ? raw.allowedModules : [],
    companyAccess: Array.isArray(raw.companyAccess) ? raw.companyAccess : [],
  };
}

function cloneInitialState(): ERPState {
  const seed = JSON.parse(JSON.stringify(INITIAL_ERP_STATE)) as ERPState;
  seed.users = seed.users.map(normalizeUserRecord);
  return seed;
}

function loadDatabase(): ERPState {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<ERPState>;
      if (parsed && Array.isArray(parsed.companies) && Array.isArray(parsed.users) && parsed.companies.length >= 2) {
        const base = cloneInitialState();
        return {
          ...base,
          ...parsed,
          users: parsed.users.map(normalizeUserRecord),
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : base.auditLogs,
        };
      }
    }

    // Preserve existing business transactions from v2 if upgrading for the first time
    if (fs.existsSync(LEGACY_DB_FILE_PATH)) {
      const rawLegacy = fs.readFileSync(LEGACY_DB_FILE_PATH, 'utf8');
      const parsedLegacy = JSON.parse(rawLegacy) as Partial<ERPState>;
      if (parsedLegacy && Array.isArray(parsedLegacy.companies) && parsedLegacy.companies.length >= 2) {
        const base = cloneInitialState();
        const existingEmpIds = new Set(base.employees.map((e) => e.id));
        const mergedEmployees = [
          ...base.employees,
          ...(Array.isArray(parsedLegacy.employees)
            ? parsedLegacy.employees.filter((e) => !existingEmpIds.has(e.id))
            : []),
        ];
        return {
          ...base,
          ...parsedLegacy,
          employees: mergedEmployees,
          users: base.users,
          auditLogs: Array.isArray(parsedLegacy.auditLogs) ? parsedLegacy.auditLogs : base.auditLogs,
        };
      }
    }
  } catch {
    // Fallback to clean seed
  }
  return cloneInitialState();
}

let db: ERPState = loadDatabase();

function persistDatabase() {
  try {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db), 'utf8');
  } catch {
    // Read-only filesystem fallback — keep state in memory
  }
}

function signToken(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(body).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.uid || !parsed.exp || Date.now() > parsed.exp) return null;
    if (revokedSessionIds.has(parsed.sid)) return null;
    const minIat = userInvalidatedBefore.get(parsed.uid);
    if (minIat && (parsed.iat || 0) < minIat) return null;
    return parsed;
  } catch {
    return null;
  }
}

function sanitizeUser(u: UserAccount): SafeUserAccount {
  return {
    id: u.id,
    username: u.username,
    employeeCode: u.employeeCode,
    fullName: u.fullName,
    department: u.department,
    position: u.position,
    employeeId: u.employeeId,
    roleLabel: u.roleLabel,
    isAdmin: u.isAdmin,
    accountStatus: u.accountStatus,
    employmentStatus: u.employmentStatus,
    mustChangePassword: u.mustChangePassword,
    dateCreated: u.dateCreated,
    lastLogin: u.lastLogin,
    createdBy: u.createdBy,
    updatedBy: u.updatedBy,
    updatedAt: u.updatedAt,
    passwordUpdatedAt: u.passwordUpdatedAt,
    allowedModules: u.allowedModules,
    companyAccess: u.companyAccess,
  };
}

function getEffectiveAccess(user: UserAccount, companyId: string): UserCompanyAccess | null {
  if (user.accountStatus !== 'Active') return null;
  const assigned = user.companyAccess.find((a) => a.companyId === companyId);
  if (user.isAdmin) {
    return (
      assigned || {
        companyId,
        roleLabel: user.roleLabel || 'System Administrator',
        allowedModules: ALL_MODULE_IDS,
        permissions: ALL_PERMISSION_IDS,
      }
    );
  }
  return assigned || null;
}

function getAssignedCompanies(user: UserAccount): Company[] {
  if (user.accountStatus !== 'Active') return [];
  if (user.isAdmin) {
    return db.companies.filter((c) => c.isActive);
  }
  const ids = new Set(user.companyAccess.map((a) => a.companyId));
  return db.companies.filter((c) => c.isActive && ids.has(c.id));
}

function hasPerm(access: UserCompanyAccess, user: UserAccount, perm: PermissionId): boolean {
  return user.isAdmin || access.permissions.includes(perm);
}

function hasModule(access: UserCompanyAccess, user: UserAccount, mod: ModuleId): boolean {
  return user.isAdmin || access.allowedModules.includes(mod);
}

function appendAudit(
  user: UserAccount,
  company: Company | null,
  action: string,
  module: AuditLogEntry['module'],
  details: string,
  targetId?: string
) {
  const emp = db.employees.find((e) => e.id === user.employeeId);
  const entry: AuditLogEntry = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    username: user.username,
    userName: user.fullName || emp?.name || user.username,
    companyId: company?.id || 'system',
    companyCode: company?.code || 'SYS',
    companyName: company?.name || 'Central Auth',
    action,
    module,
    targetId,
    details,
    timestamp: nowTimestamp(),
  };
  db.auditLogs = [entry, ...db.auditLogs].slice(0, 600);
}

function buildCompanyScopedState(user: UserAccount, access: UserCompanyAccess, companyId: string): ERPState {
  const canManageUsers = hasPerm(access, user, 'manage_users');
  const canManageCompanies = hasPerm(access, user, 'manage_companies');

  const safeUsers: UserAccount[] = canManageUsers
    ? db.users.map((u) => sanitizeUser(u) as UserAccount)
    : [];

  return {
    companies: canManageCompanies ? db.companies : getAssignedCompanies(user),
    projects: db.projects.filter((r) => r.companyId === companyId),
    suppliers: db.suppliers.filter((r) => r.companyId === companyId),
    materials: db.materials.filter((r) => r.companyId === companyId),
    employees: db.employees.filter((r) => r.companyId === companyId),
    users: safeUsers,
    requisitions: db.requisitions.filter((r) => r.companyId === companyId),
    canvasses: db.canvasses.filter((r) => r.companyId === companyId),
    purchaseRequests: db.purchaseRequests.filter((r) => r.companyId === companyId),
    purchaseOrders: db.purchaseOrders.filter((r) => r.companyId === companyId),
    receivingReports: db.receivingReports.filter((r) => r.companyId === companyId),
    vouchers: db.vouchers.filter((r) => r.companyId === companyId),
    accounts: db.accounts.filter((r) => r.companyId === companyId),
    journalEntries: db.journalEntries.filter((r) => r.companyId === companyId),
    tools: db.tools.filter((r) => r.companyId === companyId),
    borrowRequests: db.borrowRequests.filter((r) => r.companyId === companyId),
    toolAuditLogs: db.toolAuditLogs.filter((r) => r.companyId === companyId),
    repairRecords: db.repairRecords.filter((r) => r.companyId === companyId),
    disposalRecords: db.disposalRecords.filter((r) => r.companyId === companyId),
    auditLogs: db.auditLogs.filter((r) => r.companyId === companyId || (user.isAdmin && r.companyId === 'system')),
  };
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const session = verifyToken(token);
  if (!session) {
    res.status(401).json({ error: 'Invalid or expired session token' });
    return;
  }
  const user = db.users.find((u) => u.id === session.uid);
  if (!user) {
    res.status(401).json({ error: 'Account no longer exists' });
    return;
  }
  if (user.accountStatus !== 'Active') {
    res.status(403).json({
      error: `Account is ${user.accountStatus}. Access disabled; contact a System Administrator.`,
    });
    return;
  }
  req.session = session;
  req.user = user;
  next();
}

function requireActiveCompany(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.session || !req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  if (req.user.mustChangePassword) {
    res.status(403).json({ error: 'Password change required before accessing company workspaces.' });
    return;
  }
  const companyId = req.session.cid;
  if (!companyId) {
    res.status(403).json({ error: 'No active company selected. Please select a company first.' });
    return;
  }
  const company = db.companies.find((c) => c.id === companyId && c.isActive);
  if (!company) {
    res.status(403).json({ error: 'Selected company is inactive or not found.' });
    return;
  }
  const access = getEffectiveAccess(req.user, companyId);
  if (!access) {
    res.status(403).json({ error: 'Forbidden: User is not assigned to this company.' });
    return;
  }
  req.activeCompany = company;
  req.activeAccess = access;
  next();
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#';
  const bytes = crypto.randomBytes(10);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += chars[bytes[i] % chars.length];
  }
  return out;
}

type ScopedCollectionKey =
  | 'projects'
  | 'suppliers'
  | 'materials'
  | 'employees'
  | 'requisitions'
  | 'canvasses'
  | 'purchaseRequests'
  | 'purchaseOrders'
  | 'receivingReports'
  | 'vouchers'
  | 'accounts'
  | 'journalEntries'
  | 'tools'
  | 'borrowRequests'
  | 'toolAuditLogs'
  | 'repairRecords'
  | 'disposalRecords';

const COLLECTION_MODULE_MAP: Record<ScopedCollectionKey, { module: ModuleId; label: string }> = {
  projects: { module: 'masterData', label: 'Project' },
  suppliers: { module: 'masterData', label: 'Supplier' },
  materials: { module: 'masterData', label: 'Material' },
  employees: { module: 'masterData', label: 'Employee' },
  requisitions: { module: 'requisitions', label: 'Requisition' },
  canvasses: { module: 'canvassing', label: 'Canvass' },
  purchaseRequests: { module: 'purchasing', label: 'Purchase Request' },
  purchaseOrders: { module: 'orders', label: 'Purchase Order' },
  receivingReports: { module: 'orders', label: 'Receiving Report' },
  vouchers: { module: 'vouchers', label: 'Disbursement Voucher' },
  accounts: { module: 'accounting', label: 'Chart Account' },
  journalEntries: { module: 'accounting', label: 'Journal Entry' },
  tools: { module: 'tools', label: 'Tool Asset' },
  borrowRequests: { module: 'tools', label: 'Borrow Request' },
  toolAuditLogs: { module: 'tools', label: 'Tool Audit Log' },
  repairRecords: { module: 'tools', label: 'Tool Repair' },
  disposalRecords: { module: 'tools', label: 'Tool Disposal' },
};

function getItemKey(col: ScopedCollectionKey, item: Record<string, unknown>): string {
  if (col === 'accounts') return String(item.code || '');
  return String(item.id || '');
}

function getReadableRef(item: Record<string, unknown>): string {
  return String(
    item.prNo ||
      item.poNo ||
      item.dvNo ||
      item.reqNo ||
      item.canvassNo ||
      item.rrNo ||
      item.jeNo ||
      item.trNo ||
      item.assetCode ||
      item.code ||
      item.name ||
      item.id ||
      ''
  );
}

export function createErpBackendRouter() {
  const router = express.Router();
  router.use(express.json({ limit: '6mb' }));

  router.get('/health', (_req, res) => {
    res.json({ ok: true, companies: db.companies.length, users: db.users.length, timestamp: nowTimestamp() });
  });

  // Public account directory for LoginScreen helper — NEVER exposes real or changed passwords
  router.get('/auth/demo-directory', (_req, res) => {
    const directory = db.users
      .filter((u) => u.accountStatus === 'Active')
      .map((u) => {
        const emp = db.employees.find((e) => e.id === u.employeeId);
        const companies = getAssignedCompanies(u).map((c) => ({ id: c.id, code: c.code, name: c.name }));
        // Only surface username hint when temporary initial setup password still matches username
        const initialSetupOnly = Boolean(u.mustChangePassword && verifyPassword(u.username, u.passwordHash));
        return {
          id: u.id,
          username: u.username,
          employeeName: u.fullName || emp?.name || u.username,
          department: u.department,
          position: u.position,
          roleLabel: u.roleLabel,
          isAdmin: u.isAdmin,
          mustChangePassword: u.mustChangePassword,
          initialSetupTempMatchesUsername: initialSetupOnly,
          companies,
        };
      });
    res.json({ users: directory });
  });

  router.post('/auth/login', (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required.' });
      return;
    }

    const found = db.users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!found || !verifyPassword(password, found.passwordHash)) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    if (found.accountStatus !== 'Active') {
      appendAudit(
        found,
        null,
        'Blocked Login Attempt',
        'auth',
        `Login denied because account status is ${found.accountStatus}`
      );
      persistDatabase();
      res.status(403).json({
        error: `This account is currently ${found.accountStatus}. Please contact a System Administrator.`,
      });
      return;
    }

    const availableCompanies = getAssignedCompanies(found);
    if (availableCompanies.length === 0) {
      res.status(403).json({ error: 'No active companies are assigned to your account. Contact Administrator.' });
      return;
    }

    found.lastLogin = nowTimestamp();

    const sid = crypto.randomBytes(16).toString('hex');
    const token = signToken({
      sid,
      uid: found.id,
      cid: null,
      iat: Date.now(),
      exp: Date.now() + 12 * 60 * 60 * 1000,
    });

    const emp = db.employees.find((e) => e.id === found.employeeId) || null;
    appendAudit(
      found,
      null,
      'User Login',
      'auth',
      `Authenticated centralized session (${availableCompanies.map((c) => c.code).join(', ')} assigned)${
        found.mustChangePassword ? ' · password change required' : ''
      }`
    );
    persistDatabase();

    res.json({
      token,
      user: sanitizeUser(found),
      availableCompanies,
      employee: emp,
      mustChangePassword: Boolean(found.mustChangePassword),
    });
  });

  // Self-service or forced first-login password change
  router.post('/auth/change-password', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const { currentPassword, newPassword, confirmPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    };

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ error: 'Current password, new password, and confirmation are required.' });
      return;
    }
    if (!verifyPassword(currentPassword, user.passwordHash)) {
      res.status(401).json({ error: 'Current password is incorrect.' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'New password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'New password and confirmation do not match.' });
      return;
    }
    if (newPassword.toLowerCase() === user.username.toLowerCase()) {
      res.status(400).json({ error: 'New password cannot be the same as your username.' });
      return;
    }
    if (verifyPassword(newPassword, user.passwordHash)) {
      res.status(400).json({ error: 'New password must be different from your temporary/current password.' });
      return;
    }

    user.passwordHash = hashPassword(newPassword);
    user.mustChangePassword = false;
    user.passwordUpdatedAt = nowTimestamp();
    user.updatedBy = user.username;
    user.updatedAt = nowTimestamp();

    const comp = req.session?.cid ? db.companies.find((c) => c.id === req.session!.cid) || null : null;
    appendAudit(
      user,
      comp,
      'Password Changed',
      'auth',
      `User ${user.username} updated their password cleanly`
    );
    persistDatabase();

    res.json({
      ok: true,
      user: sanitizeUser(user),
    });
  });

  router.post('/auth/select-company', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const session = req.session!;
    const { companyId } = req.body as { companyId?: string };

    if (user.mustChangePassword) {
      res.status(403).json({ error: 'You must change your temporary password before entering a company workspace.' });
      return;
    }

    if (!companyId) {
      res.status(400).json({ error: 'companyId is required.' });
      return;
    }

    const company = db.companies.find((c) => c.id === companyId && c.isActive);
    if (!company) {
      res.status(404).json({ error: 'Company not found or inactive.' });
      return;
    }

    const access = getEffectiveAccess(user, companyId);
    if (!access) {
      appendAudit(
        user,
        company,
        'Unauthorized Company Access Attempt',
        'company',
        `Blocked attempt to access ${company.code} without assignment`,
        companyId
      );
      persistDatabase();
      res.status(403).json({ error: `Access denied: You are not authorized to access ${company.name}.` });
      return;
    }

    const isSwitch = Boolean(session.cid && session.cid !== companyId);
    const updatedToken = signToken({
      sid: session.sid,
      uid: user.id,
      cid: companyId,
      iat: session.iat || Date.now(),
      exp: Date.now() + 12 * 60 * 60 * 1000,
    });

    appendAudit(
      user,
      company,
      isSwitch ? 'Company Switched' : 'Company Selected',
      'company',
      `${isSwitch ? 'Switched active workspace to' : 'Entered workspace'} ${company.name} (${company.code}) as ${access.roleLabel}`,
      company.id
    );
    persistDatabase();

    const emp = db.employees.find((e) => e.id === user.employeeId) || null;
    const scopedState = buildCompanyScopedState(user, access, companyId);

    res.json({
      token: updatedToken,
      activeCompany: company,
      activeAccess: access,
      employee: emp,
      state: scopedState,
    });
  });

  router.post('/auth/logout', requireAuth, (req: AuthedRequest, res: Response) => {
    const session = req.session!;
    const user = req.user!;
    revokedSessionIds.add(session.sid);
    const comp = session.cid ? db.companies.find((c) => c.id === session.cid) || null : null;
    appendAudit(user, comp, 'User Logout', 'auth', 'Session terminated by user');
    persistDatabase();
    res.json({ ok: true });
  });

  router.get('/erp/state', requireAuth, requireActiveCompany, (req: AuthedRequest, res: Response) => {
    const scoped = buildCompanyScopedState(req.user!, req.activeAccess!, req.activeCompany!.id);
    res.json({
      activeCompany: req.activeCompany,
      activeAccess: req.activeAccess,
      state: scoped,
    });
  });

  router.get('/erp/audit-logs', requireAuth, requireActiveCompany, (req: AuthedRequest, res: Response) => {
    const companyId = req.activeCompany!.id;
    res.json({
      auditLogs: db.auditLogs.filter(
        (l) => l.companyId === companyId || (req.user!.isAdmin && l.companyId === 'system')
      ),
    });
  });

  // =========================================================================
  // ADMIN USER MANAGEMENT, RBAC & PASSWORD ADMINISTRATION ENDPOINTS
  // =========================================================================
  router.post('/erp/users', requireAuth, requireActiveCompany, (req: AuthedRequest, res: Response) => {
    const actor = req.user!;
    const access = req.activeAccess!;
    const company = req.activeCompany!;

    if (!hasPerm(access, actor, 'manage_users')) {
      res.status(403).json({ error: 'Forbidden: Missing manage_users permission.' });
      return;
    }

    const body = req.body as Partial<UserAccount> & { temporaryPassword?: string };
    const username = (body.username || '').trim().toLowerCase();
    const fullName = (body.fullName || '').trim();
    const tempPass = (body.temporaryPassword || body.password || '').trim();

    if (!username || !fullName || !tempPass) {
      res.status(400).json({ error: 'Username, Employee Name, and Temporary Password are required.' });
      return;
    }
    if (tempPass.length < 6) {
      res.status(400).json({ error: 'Temporary password must be at least 6 characters.' });
      return;
    }
    if (db.users.some((u) => u.username.toLowerCase() === username)) {
      res.status(409).json({ error: `Username "${username}" already exists.` });
      return;
    }

    const isAdmin = Boolean(body.isAdmin);
    const companyAccess: UserCompanyAccess[] = isAdmin
      ? db.companies.map((c) => ({
          companyId: c.id,
          roleLabel: body.roleLabel?.trim() || 'System Administrator',
          allowedModules: ALL_MODULE_IDS,
          permissions: ALL_PERMISSION_IDS,
        }))
      : Array.isArray(body.companyAccess)
        ? body.companyAccess
        : [];

    if (!isAdmin && companyAccess.length === 0) {
      res.status(400).json({ error: 'Assign at least one company (RFB, RBI, or both).' });
      return;
    }

    let employeeId = (body.employeeId || '').trim();
    if (!employeeId) {
      const targetCompanyId = companyAccess[0]?.companyId || company.id;
      const empId = `emp-${Date.now()}`;
      const targetComp = db.companies.find((c) => c.id === targetCompanyId) || company;
      const domain = targetComp.email.split('@')[1] || 'rfbconstruction.ph';
      db.employees.push({
        id: empId,
        companyId: targetCompanyId,
        name: fullName,
        position: body.position?.trim() || body.roleLabel?.trim() || 'Staff',
        department: body.department?.trim() || 'Operations',
        email: `${username}@${domain}`,
      });
      employeeId = empId;
    }

    const mergedModules = Array.from(new Set(companyAccess.flatMap((a) => a.allowedModules)));
    const created: UserAccount = {
      id: `usr-${Date.now()}`,
      username,
      passwordHash: hashPassword(tempPass),
      employeeCode: (body.employeeCode || '').trim() || `EMP-${username.toUpperCase().slice(0, 6)}`,
      fullName,
      department: (body.department || '').trim() || 'Operations',
      position: (body.position || '').trim() || body.roleLabel?.trim() || 'Staff',
      employeeId,
      roleLabel: (body.roleLabel || '').trim() || (body.position || '').trim() || 'Staff',
      isAdmin,
      accountStatus: (body.accountStatus as AccountStatus) || 'Active',
      employmentStatus: (body.employmentStatus as EmploymentStatus) || 'Regular',
      mustChangePassword: body.mustChangePassword !== false,
      dateCreated: todayISO(),
      createdBy: actor.username,
      updatedBy: actor.username,
      updatedAt: nowTimestamp(),
      allowedModules: isAdmin ? ALL_MODULE_IDS : mergedModules,
      companyAccess,
    };

    db.users.push(created);
    appendAudit(
      actor,
      company,
      'Created User Account',
      'masterData',
      `Created user ${created.username} (${created.fullName} · ${created.companyAccess
        .map((a) => db.companies.find((c) => c.id === a.companyId)?.code || a.companyId)
        .join(' + ')})`,
      created.username
    );
    persistDatabase();

    res.status(201).json({
      ok: true,
      user: sanitizeUser(created),
      state: buildCompanyScopedState(actor, access, company.id),
    });
  });

  router.put('/erp/users/:id', requireAuth, requireActiveCompany, (req: AuthedRequest, res: Response) => {
    const actor = req.user!;
    const access = req.activeAccess!;
    const company = req.activeCompany!;

    if (!hasPerm(access, actor, 'manage_users')) {
      res.status(403).json({ error: 'Forbidden: Missing manage_users permission.' });
      return;
    }

    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const body = req.body as Partial<UserAccount>;
    const nextUsername = body.username ? body.username.trim().toLowerCase() : target.username;
    if (
      nextUsername !== target.username &&
      db.users.some((u) => u.id !== target.id && u.username.toLowerCase() === nextUsername)
    ) {
      res.status(409).json({ error: `Username "${nextUsername}" is already taken.` });
      return;
    }

    const isAdmin = body.isAdmin !== undefined ? Boolean(body.isAdmin) : target.isAdmin;
    if (target.id === actor.id && !isAdmin && actor.isAdmin) {
      res.status(400).json({ error: 'Cannot remove System Administrator privileges from your own active session.' });
      return;
    }

    const companyAccess: UserCompanyAccess[] = isAdmin
      ? db.companies.map((c) => ({
          companyId: c.id,
          roleLabel: body.roleLabel?.trim() || target.roleLabel || 'System Administrator',
          allowedModules: ALL_MODULE_IDS,
          permissions: ALL_PERMISSION_IDS,
        }))
      : Array.isArray(body.companyAccess)
        ? body.companyAccess
        : target.companyAccess;

    const mergedModules = Array.from(new Set(companyAccess.flatMap((a) => a.allowedModules)));

    target.username = nextUsername;
    target.fullName = body.fullName?.trim() || target.fullName;
    target.employeeCode = body.employeeCode?.trim() || target.employeeCode;
    target.department = body.department?.trim() || target.department;
    target.position = body.position?.trim() || target.position;
    target.roleLabel = body.roleLabel?.trim() || target.roleLabel;
    target.employeeId = body.employeeId !== undefined ? body.employeeId : target.employeeId;
    target.isAdmin = isAdmin;
    target.accountStatus = (body.accountStatus as AccountStatus) || target.accountStatus;
    target.employmentStatus = (body.employmentStatus as EmploymentStatus) || target.employmentStatus;
    target.allowedModules = isAdmin ? ALL_MODULE_IDS : mergedModules;
    target.companyAccess = companyAccess;
    target.updatedBy = actor.username;
    target.updatedAt = nowTimestamp();

    // Sync linked Employee details if present
    if (target.employeeId) {
      const emp = db.employees.find((e) => e.id === target.employeeId);
      if (emp) {
        emp.name = target.fullName;
        emp.position = target.position;
        emp.department = target.department;
      }
    }

    appendAudit(
      actor,
      company,
      'Updated User & RBAC',
      'masterData',
      `Updated ${target.username} (${target.fullName}) · Role: ${target.roleLabel} · Companies: ${companyAccess
        .map((a) => db.companies.find((c) => c.id === a.companyId)?.code || a.companyId)
        .join(' + ')}`,
      target.username
    );
    persistDatabase();

    res.json({
      ok: true,
      user: sanitizeUser(target),
      state: buildCompanyScopedState(actor, access, company.id),
    });
  });

  router.post('/erp/users/:id/reset-password', requireAuth, requireActiveCompany, (req: AuthedRequest, res: Response) => {
    const actor = req.user!;
    const access = req.activeAccess!;
    const company = req.activeCompany!;

    if (!hasPerm(access, actor, 'manage_users')) {
      res.status(403).json({ error: 'Forbidden: Missing manage_users permission.' });
      return;
    }

    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }

    const { temporaryPassword, generateRandom, forceChange } = req.body as {
      temporaryPassword?: string;
      generateRandom?: boolean;
      forceChange?: boolean;
    };

    const nextTemp = generateRandom ? generateTempPassword() : (temporaryPassword || '').trim();
    if (!nextTemp || nextTemp.length < 6) {
      res.status(400).json({ error: 'Temporary password must be at least 6 characters.' });
      return;
    }

    target.passwordHash = hashPassword(nextTemp);
    target.mustChangePassword = forceChange !== false;
    target.passwordUpdatedAt = nowTimestamp();
    target.updatedBy = actor.username;
    target.updatedAt = nowTimestamp();

    if (target.id !== actor.id) {
      userInvalidatedBefore.set(target.id, Date.now());
    }

    appendAudit(
      actor,
      company,
      'Admin Password Reset',
      'masterData',
      `Reset password for ${target.username} (${target.fullName}); force change on next login = ${
        target.mustChangePassword ? 'Yes' : 'No'
      }`,
      target.username
    );
    persistDatabase();

    res.json({
      ok: true,
      temporaryPassword: nextTemp,
      user: sanitizeUser(target),
      state: buildCompanyScopedState(actor, access, company.id),
    });
  });

  router.post('/erp/users/:id/status', requireAuth, requireActiveCompany, (req: AuthedRequest, res: Response) => {
    const actor = req.user!;
    const access = req.activeAccess!;
    const company = req.activeCompany!;

    if (!hasPerm(access, actor, 'manage_users')) {
      res.status(403).json({ error: 'Forbidden: Missing manage_users permission.' });
      return;
    }

    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }
    if (target.id === actor.id) {
      res.status(400).json({ error: 'You cannot deactivate or suspend your own active administrator account.' });
      return;
    }

    const { accountStatus, employmentStatus, clearCompanyAccess } = req.body as {
      accountStatus?: AccountStatus;
      employmentStatus?: EmploymentStatus;
      clearCompanyAccess?: boolean;
    };

    if (!accountStatus || !['Active', 'Inactive', 'Resigned', 'Suspended'].includes(accountStatus)) {
      res.status(400).json({ error: 'Invalid accountStatus.' });
      return;
    }

    const prevStatus = target.accountStatus;
    target.accountStatus = accountStatus;
    if (employmentStatus) {
      target.employmentStatus = employmentStatus;
    } else if (accountStatus === 'Resigned') {
      target.employmentStatus = 'Resigned';
    } else if (accountStatus === 'Active') {
      target.employmentStatus = 'Regular';
    }
    if (clearCompanyAccess) {
      target.companyAccess = [];
      target.allowedModules = [];
    }
    target.updatedBy = actor.username;
    target.updatedAt = nowTimestamp();

    if (accountStatus !== 'Active') {
      userInvalidatedBefore.set(target.id, Date.now());
    }

    appendAudit(
      actor,
      company,
      `User Account ${accountStatus}`,
      'masterData',
      `Changed ${target.username} (${target.fullName}) status from ${prevStatus} to ${accountStatus}${
        clearCompanyAccess ? ' and removed company access' : ''
      }. Historical transactions preserved.`,
      target.username
    );
    persistDatabase();

    res.json({
      ok: true,
      user: sanitizeUser(target),
      state: buildCompanyScopedState(actor, access, company.id),
    });
  });

  router.delete('/erp/users/:id', requireAuth, requireActiveCompany, (req: AuthedRequest, res: Response) => {
    const actor = req.user!;
    const access = req.activeAccess!;
    const company = req.activeCompany!;

    if (!hasPerm(access, actor, 'manage_users') || (!actor.isAdmin && !hasPerm(access, actor, 'delete_transactions'))) {
      res.status(403).json({ error: 'Forbidden: Missing permission to delete user accounts.' });
      return;
    }

    const target = db.users.find((u) => u.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'User account not found.' });
      return;
    }
    if (target.id === actor.id) {
      res.status(400).json({ error: 'You cannot delete your own active administrator account.' });
      return;
    }

    db.users = db.users.filter((u) => u.id !== target.id);
    userInvalidatedBefore.set(target.id, Date.now());

    appendAudit(
      actor,
      company,
      'Deleted User Account',
      'masterData',
      `Removed login account ${target.username} (${target.fullName}). All historical transactions and audit records preserved.`,
      target.username
    );
    persistDatabase();

    res.json({
      ok: true,
      state: buildCompanyScopedState(actor, access, company.id),
    });
  });

  // Direct REST read endpoint with strict company isolation
  router.get('/erp/records/:collection', requireAuth, requireActiveCompany, (req: AuthedRequest, res: Response) => {
    const col = req.params.collection as ScopedCollectionKey;
    if (!(col in COLLECTION_MODULE_MAP)) {
      res.status(404).json({ error: 'Unknown resource collection' });
      return;
    }
    const meta = COLLECTION_MODULE_MAP[col];
    if (!hasModule(req.activeAccess!, req.user!, meta.module) || !hasPerm(req.activeAccess!, req.user!, 'view_transactions')) {
      res.status(403).json({ error: `Forbidden: Missing ${meta.module} view permission` });
      return;
    }
    const companyId = req.activeCompany!.id;
    const items = (db[col] as unknown as Array<{ companyId: string }>).filter((r) => r.companyId === companyId);
    res.json({ items });
  });

  // Direct REST delete endpoint enforcing IDOR + delete_transactions
  router.delete('/erp/records/:collection/:id', requireAuth, requireActiveCompany, (req: AuthedRequest, res: Response) => {
    const col = req.params.collection as ScopedCollectionKey;
    if (!(col in COLLECTION_MODULE_MAP)) {
      res.status(404).json({ error: 'Unknown resource collection' });
      return;
    }
    const meta = COLLECTION_MODULE_MAP[col];
    if (!hasModule(req.activeAccess!, req.user!, meta.module) || !hasPerm(req.activeAccess!, req.user!, 'delete_transactions')) {
      res.status(403).json({ error: 'Forbidden: Missing delete_transactions permission' });
      return;
    }

    const companyId = req.activeCompany!.id;
    const list = db[col] as unknown as Array<Record<string, unknown>>;
    const ownMatch = list.find((r) => r.companyId === companyId && getItemKey(col, r) === req.params.id);
    const foreignMatch = !ownMatch ? list.find((r) => getItemKey(col, r) === req.params.id) : undefined;
    if (!ownMatch && !foreignMatch) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    if (!ownMatch && foreignMatch) {
      appendAudit(req.user!, req.activeCompany!, 'Cross-Company IDOR Blocked', meta.module, `Blocked DELETE on ${col}/${req.params.id} belonging to ${String(foreignMatch.companyId)}`, req.params.id);
      persistDatabase();
      res.status(403).json({ error: 'Forbidden: Cross-company access blocked' });
      return;
    }

    (db[col] as unknown as Array<Record<string, unknown>>) = list.filter(
      (r) => !(r.companyId === companyId && getItemKey(col, r) === req.params.id)
    );
    appendAudit(req.user!, req.activeCompany!, `Deleted ${meta.label}`, meta.module, `Removed ${getReadableRef(ownMatch!)}`, req.params.id);
    persistDatabase();
    res.json({ ok: true });
  });

  // Validated transactional commit endpoint enforcing backend RBAC, Company Isolation, and IDOR checks
  router.post('/erp/commit', requireAuth, requireActiveCompany, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const access = req.activeAccess!;
    const company = req.activeCompany!;
    const companyId = company.id;
    const incoming = req.body?.state as Partial<ERPState> | undefined;

    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ error: 'Invalid state payload' });
      return;
    }

    const pendingAudits: Array<{ action: string; module: AuditLogEntry['module']; targetId?: string; details: string }> = [];

    // 1. Validate Companies updates (requires manage_companies)
    if (Array.isArray(incoming.companies) && incoming.companies.length > 0) {
      const canManageComp = hasPerm(access, user, 'manage_companies');
      const baselineCompanies = canManageComp ? db.companies : getAssignedCompanies(user);
      const prevMap = new Map(baselineCompanies.map((c) => [c.id, c]));
      const changed =
        incoming.companies.length !== baselineCompanies.length ||
        incoming.companies.some((c) => JSON.stringify(c) !== JSON.stringify(prevMap.get(c.id)));
      if (changed) {
        if (!canManageComp) {
          res.status(403).json({ error: 'Forbidden: Missing manage_companies permission.' });
          return;
        }
        pendingAudits.push({
          action: 'Updated Companies Configuration',
          module: 'masterData',
          details: `Updated company registry (${incoming.companies.length} companies)`,
        });
      }
    }

    // 2. Validate Users & RBAC updates if passed through commit (always preserves passwordHash)
    let nextUsersMerged: UserAccount[] | null = null;
    if (Array.isArray(incoming.users) && incoming.users.length > 0) {
      const prevMap = new Map(db.users.map((u) => [u.id, u]));
      const prevSafeMap = new Map(db.users.map((u) => [u.id, sanitizeUser(u)]));
      const normalizedIncomingUsers = incoming.users.map((u) => {
        const existing = prevMap.get(u.id);
        const passwordHash =
          u.password && u.password !== '••••••••'
            ? hashPassword(u.password)
            : existing?.passwordHash || hashPassword(u.username);
        return normalizeUserRecord({
          ...existing,
          ...u,
          passwordHash,
          password: undefined,
        });
      });

      const changed =
        normalizedIncomingUsers.length !== db.users.length ||
        normalizedIncomingUsers.some(
          (u) => JSON.stringify(sanitizeUser(u)) !== JSON.stringify(prevSafeMap.get(u.id))
        );

      if (changed) {
        if (!hasPerm(access, user, 'manage_users')) {
          res.status(403).json({ error: 'Forbidden: Missing manage_users permission.' });
          return;
        }
        nextUsersMerged = normalizedIncomingUsers;
        pendingAudits.push({
          action: 'Updated User RBAC Access',
          module: 'masterData',
          details: `Modified user accounts & per-company permissions (${normalizedIncomingUsers.length} users)`,
        });
      }
    }

    // 3. Validate all company-scoped collections
    const scopedKeys = Object.keys(COLLECTION_MODULE_MAP) as ScopedCollectionKey[];
    const stagedScoped: Partial<Record<ScopedCollectionKey, Array<Record<string, unknown>>>> = {};

    for (const col of scopedKeys) {
      const incomingList = incoming[col] as unknown as Array<Record<string, unknown>> | undefined;
      if (!Array.isArray(incomingList)) continue;

      const meta = COLLECTION_MODULE_MAP[col];
      const dbAll = db[col] as unknown as Array<Record<string, unknown>>;
      const dbCompanyItems = dbAll.filter((r) => r.companyId === companyId);
      const dbOtherItems = dbAll.filter((r) => r.companyId !== companyId);

      // IDOR / Cross-company check
      for (const item of incomingList) {
        if (item.companyId && item.companyId !== companyId) {
          appendAudit(user, company, 'Cross-Company Injection Blocked', meta.module, `Attempted to write ${col} record with companyId=${String(item.companyId)}`);
          persistDatabase();
          res.status(403).json({ error: `Forbidden: Cross-company write blocked on ${col}` });
          return;
        }
        if (col !== 'accounts') {
          const key = getItemKey(col, item);
          const foreignMatch = dbOtherItems.find((r) => getItemKey(col, r) === key);
          if (foreignMatch) {
            appendAudit(user, company, 'Cross-Company IDOR Blocked', meta.module, `Attempted to overwrite foreign ${col} record ${key}`);
            persistDatabase();
            res.status(403).json({ error: `Forbidden: Record ${key} belongs to another company` });
            return;
          }
        }
      }

      const stampedList = incomingList.map((item) => ({ ...item, companyId }));

      const prevMap = new Map(dbCompanyItems.map((r) => [getItemKey(col, r), r]));
      const nextMap = new Map(stampedList.map((r) => [getItemKey(col, r), r]));

      // Detect deletions
      for (const [key, prevItem] of prevMap.entries()) {
        if (!nextMap.has(key)) {
          if (!hasPerm(access, user, 'delete_transactions')) {
            res.status(403).json({ error: `Forbidden: Missing delete_transactions permission to remove ${meta.label}` });
            return;
          }
          pendingAudits.push({
            action: `Deleted ${meta.label}`,
            module: meta.module,
            targetId: getReadableRef(prevItem),
            details: `Removed ${meta.label} ${getReadableRef(prevItem)}`,
          });
        }
      }

      // Detect additions
      for (const [key, nextItem] of nextMap.entries()) {
        if (!prevMap.has(key)) {
          const contextualAllowed =
            (col === 'suppliers' && (hasModule(access, user, 'canvassing') || hasModule(access, user, 'masterData'))) ||
            (col === 'materials' && (hasModule(access, user, 'requisitions') || hasModule(access, user, 'masterData'))) ||
            (col === 'journalEntries' && (hasModule(access, user, 'accounting') || hasModule(access, user, 'orders') || hasModule(access, user, 'vouchers') || hasModule(access, user, 'tools'))) ||
            (col === 'purchaseOrders' && (hasModule(access, user, 'purchasing') || hasModule(access, user, 'orders'))) ||
            (col === 'purchaseRequests' && (hasModule(access, user, 'canvassing') || hasModule(access, user, 'purchasing'))) ||
            (col === 'canvasses' && (hasModule(access, user, 'requisitions') || hasModule(access, user, 'canvassing'))) ||
            hasModule(access, user, meta.module);

          if (!contextualAllowed || !hasPerm(access, user, 'create_transactions')) {
            res.status(403).json({ error: `Forbidden: Missing create_transactions permission for ${meta.label}` });
            return;
          }
          pendingAudits.push({
            action: `Created ${meta.label}`,
            module: meta.module,
            targetId: getReadableRef(nextItem),
            details: `Created ${meta.label} ${getReadableRef(nextItem)}`,
          });
        } else {
          const prevItem = prevMap.get(key)!;
          if (JSON.stringify(prevItem) !== JSON.stringify(nextItem)) {
            const prevStatus = String((prevItem as Record<string, unknown>).status || '');
            const nextStatus = String((nextItem as Record<string, unknown>).status || '');

            const isRejectionTransition =
              prevStatus !== nextStatus &&
              (
                (col === 'purchaseRequests' && nextStatus === 'Rejected') ||
                (col === 'vouchers' && nextStatus === 'Cancelled') ||
                (col === 'borrowRequests' && nextStatus === 'Rejected')
              );

            const isApprovalTransition =
              prevStatus !== nextStatus &&
              (
                (col === 'purchaseRequests' && ['For Recommending Approval', 'For Final Approval', 'Approved'].includes(nextStatus)) ||
                (col === 'vouchers' && nextStatus === 'Approved') ||
                (col === 'borrowRequests' && nextStatus === 'Approved')
              );

            if (isRejectionTransition) {
              if (!hasPerm(access, user, 'reject_transactions') && !hasPerm(access, user, 'approve_transactions')) {
                res.status(403).json({ error: `Forbidden: Missing reject_transactions permission for ${meta.label}` });
                return;
              }
              pendingAudits.push({
                action: `${meta.label} ${nextStatus}`,
                module: meta.module,
                targetId: getReadableRef(nextItem),
                details: `Transitioned ${getReadableRef(nextItem)} from ${prevStatus} to ${nextStatus}`,
              });
            } else if (isApprovalTransition) {
              if (!hasPerm(access, user, 'approve_transactions')) {
                res.status(403).json({ error: `Forbidden: Missing approve_transactions permission for ${meta.label}` });
                return;
              }
              pendingAudits.push({
                action: `${meta.label} ${nextStatus}`,
                module: meta.module,
                targetId: getReadableRef(nextItem),
                details: `Transitioned ${getReadableRef(nextItem)} from ${prevStatus} to ${nextStatus}`,
              });
            } else {
              const editContextualAllowed =
                (col === 'requisitions' && (hasModule(access, user, 'requisitions') || hasModule(access, user, 'canvassing'))) ||
                (col === 'canvasses' && hasModule(access, user, 'canvassing')) ||
                (col === 'purchaseRequests' && hasModule(access, user, 'purchasing')) ||
                (col === 'purchaseOrders' && hasModule(access, user, 'orders')) ||
                (col === 'vouchers' && hasModule(access, user, 'vouchers')) ||
                (col === 'tools' && hasModule(access, user, 'tools')) ||
                (col === 'borrowRequests' && hasModule(access, user, 'tools')) ||
                (col === 'employees' && hasModule(access, user, 'masterData')) ||
                hasModule(access, user, meta.module);

              const hasActionPerm =
                hasPerm(access, user, 'edit_transactions') ||
                hasPerm(access, user, 'create_transactions') ||
                hasPerm(access, user, 'process_transactions') ||
                hasPerm(access, user, 'submit_transactions');

              if (!editContextualAllowed || !hasActionPerm) {
                res.status(403).json({ error: `Forbidden: Missing edit/process permission for ${meta.label}` });
                return;
              }
              pendingAudits.push({
                action: `Updated ${meta.label}`,
                module: meta.module,
                targetId: getReadableRef(nextItem),
                details:
                  prevStatus !== nextStatus
                    ? `Updated ${getReadableRef(nextItem)} status (${prevStatus} → ${nextStatus})`
                    : `Modified ${meta.label} ${getReadableRef(nextItem)}`,
              });
            }
          }
        }
      }

      stagedScoped[col] = [...dbOtherItems, ...stampedList];
    }

    // Apply all validated commits atomically
    if (Array.isArray(incoming.companies) && hasPerm(access, user, 'manage_companies')) {
      db.companies = incoming.companies;
    }
    if (nextUsersMerged) {
      db.users = nextUsersMerged;
    }
    for (const [col, merged] of Object.entries(stagedScoped)) {
      if (merged) {
        (db as unknown as Record<string, unknown>)[col] = merged;
      }
    }

    for (const a of pendingAudits) {
      appendAudit(user, company, a.action, a.module, a.details, a.targetId);
    }
    persistDatabase();

    const scoped = buildCompanyScopedState(user, access, companyId);
    res.json({ ok: true, state: scoped });
  });

  return router;
}
