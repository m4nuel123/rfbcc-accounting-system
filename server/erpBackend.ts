import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import {
  AuditLogEntry,
  Company,
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

const SESSION_SECRET = process.env.ERP_SESSION_SECRET || 'rfb-rbi-erp-hmac-secret-2026';
const DB_FILE_PATH = process.env.VERCEL
  ? '/tmp/rfb-rbi-erp-db-v2.json'
  : path.join(process.cwd(), '.data', 'erp-db-v2.json');

interface SessionPayload {
  sid: string;
  uid: string;
  cid: string | null;
  exp: number;
}

interface AuthedRequest extends Request {
  session?: SessionPayload;
  user?: UserAccount;
  activeCompany?: Company;
  activeAccess?: UserCompanyAccess;
}

const revokedSessionIds = new Set<string>();

function nowTimestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function cloneInitialState(): ERPState {
  return JSON.parse(JSON.stringify(INITIAL_ERP_STATE)) as ERPState;
}

function loadDatabase(): ERPState {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as Partial<ERPState>;
      if (parsed && Array.isArray(parsed.companies) && Array.isArray(parsed.users) && parsed.companies.length >= 2) {
        return {
          ...cloneInitialState(),
          ...parsed,
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : cloneInitialState().auditLogs,
        };
      }
    }
  } catch {
    // Fallback to clean seed if corrupted
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
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.uid || !parsed.exp || Date.now() > parsed.exp) return null;
    if (revokedSessionIds.has(parsed.sid)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function sanitizeUser(u: UserAccount): SafeUserAccount {
  return {
    id: u.id,
    username: u.username,
    employeeId: u.employeeId,
    roleLabel: u.roleLabel,
    isAdmin: u.isAdmin,
    allowedModules: u.allowedModules,
    companyAccess: u.companyAccess,
  };
}

function getEffectiveAccess(user: UserAccount, companyId: string): UserCompanyAccess | null {
  const assigned = user.companyAccess.find((a) => a.companyId === companyId);
  if (user.isAdmin) {
    return (
      assigned || {
        companyId,
        roleLabel: user.roleLabel || 'Administrator',
        allowedModules: ALL_MODULE_IDS,
        permissions: ALL_PERMISSION_IDS,
      }
    );
  }
  return assigned || null;
}

function getAssignedCompanies(user: UserAccount): Company[] {
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
    userName: emp?.name || user.username,
    companyId: company?.id || 'system',
    companyCode: company?.code || 'SYS',
    companyName: company?.name || 'Central Auth',
    action,
    module,
    targetId,
    details,
    timestamp: nowTimestamp(),
  };
  db.auditLogs = [entry, ...db.auditLogs].slice(0, 500);
}

function buildCompanyScopedState(user: UserAccount, access: UserCompanyAccess, companyId: string): ERPState {
  const canManageUsers = hasPerm(access, user, 'manage_users');
  const canManageCompanies = hasPerm(access, user, 'manage_companies');

  const safeUsers: UserAccount[] = canManageUsers
    ? db.users.map((u) => ({
        ...u,
        password: '••••••••',
      }))
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
    auditLogs: db.auditLogs.filter((r) => r.companyId === companyId),
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
  req.session = session;
  req.user = user;
  next();
}

function requireActiveCompany(req: AuthedRequest, res: Response, next: NextFunction) {
  if (!req.session || !req.user) {
    res.status(401).json({ error: 'Authentication required' });
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
    res.json({ ok: true, companies: db.companies.length, timestamp: nowTimestamp() });
  });

  // Public demo catalog for LoginScreen quick-fill helper (returns non-sensitive usernames/roles/companies only)
  router.get('/auth/demo-directory', (_req, res) => {
    const directory = db.users.map((u) => {
      const emp = db.employees.find((e) => e.id === u.employeeId);
      const companies = getAssignedCompanies(u).map((c) => ({ id: c.id, code: c.code, name: c.name }));
      return {
        id: u.id,
        username: u.username,
        passwordHint: u.password,
        employeeName: emp?.name || u.username,
        roleLabel: u.roleLabel,
        isAdmin: u.isAdmin,
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
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );
    if (!found) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    const availableCompanies = getAssignedCompanies(found);
    if (availableCompanies.length === 0) {
      res.status(403).json({ error: 'No active companies are assigned to your account. Contact Administrator.' });
      return;
    }

    const sid = crypto.randomBytes(16).toString('hex');
    const token = signToken({
      sid,
      uid: found.id,
      cid: null,
      exp: Date.now() + 12 * 60 * 60 * 1000,
    });

    const emp = db.employees.find((e) => e.id === found.employeeId) || null;
    appendAudit(
      found,
      null,
      'User Login',
      'auth',
      `Authenticated centralized session (${availableCompanies.map((c) => c.code).join(', ')} assigned)`
    );
    persistDatabase();

    res.json({
      token,
      user: sanitizeUser(found),
      availableCompanies,
      employee: emp,
    });
  });

  router.post('/auth/select-company', requireAuth, (req: AuthedRequest, res: Response) => {
    const user = req.user!;
    const session = req.session!;
    const { companyId } = req.body as { companyId?: string };

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
      auditLogs: db.auditLogs.filter((l) => l.companyId === companyId),
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

    // 2. Validate Users & RBAC updates (requires manage_users)
    let nextUsersMerged: UserAccount[] | null = null;
    if (Array.isArray(incoming.users) && incoming.users.length > 0) {
      const prevMap = new Map(db.users.map((u) => [u.id, u]));
      // Preserve real passwords if masked as '••••••••'
      const normalizedIncomingUsers = incoming.users.map((u) => {
        const existing = prevMap.get(u.id);
        if (existing && (!u.password || u.password === '••••••••')) {
          return { ...u, password: existing.password };
        }
        return u;
      });
      const changed =
        normalizedIncomingUsers.length !== db.users.length ||
        normalizedIncomingUsers.some((u) => JSON.stringify(u) !== JSON.stringify(prevMap.get(u.id)));
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

      // Stamp companyId on all incoming company records
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
          // Allow auxiliary supplier/material creation from canvassing/requisitions if user has create_transactions in those modules
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
            const isApprovalTransition =
              prevStatus !== nextStatus &&
              (
                (col === 'purchaseRequests' && ['For Recommending Approval', 'For Final Approval', 'Approved', 'Rejected'].includes(nextStatus)) ||
                (col === 'vouchers' && ['Approved', 'Cancelled'].includes(nextStatus)) ||
                (col === 'borrowRequests' && ['Approved', 'Rejected'].includes(nextStatus))
              );

            if (isApprovalTransition) {
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

              // Note: Signing PR/generating PO/receiving or editing needs edit or create permission
              if (!editContextualAllowed || (!hasPerm(access, user, 'edit_transactions') && !hasPerm(access, user, 'create_transactions'))) {
                res.status(403).json({ error: `Forbidden: Missing edit_transactions permission for ${meta.label}` });
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
