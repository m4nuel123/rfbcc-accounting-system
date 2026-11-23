import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  Copy,
  Database,
  Edit3,
  History,
  KeyRound,
  PenTool,
  Plus,
  Search,
  Shield,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import {
  ALL_MODULES,
  ALL_MODULE_IDS,
  ALL_PERMISSIONS,
  ALL_PERMISSION_IDS,
  SQL_WAREHOUSE_SCHEMA,
  STANDARD_DEPARTMENTS,
  STANDARD_POSITIONS,
} from '../../utils/erpConfig';
import {
  AccountStatus,
  Company,
  Employee,
  EmploymentStatus,
  ERPState,
  ItemGroup,
  ModuleId,
  PermissionId,
  ProjectType,
  SafeUserAccount,
  UserCompanyAccess,
} from '../../types/erp';
import {
  apiAdminCreateUser,
  apiAdminDeleteUser,
  apiAdminResetPassword,
  apiAdminUpdateUser,
  apiAdminUpdateUserStatus,
} from '../../utils/apiClient';
import { formatPHP } from '../../utils/formatters';
import { SignaturePadModal } from '../SignaturePadModal';
import { StatusText } from '../StatusText';

interface MasterDataModuleProps {
  state: ERPState;
  authToken: string;
  currentUser: SafeUserAccount;
  activeCompany: Company;
  can: (perm: PermissionId) => boolean;
  onUpdateState: (updater: (prev: ERPState) => ERPState) => void;
  onSyncServerState: (state: ERPState) => void;
}

type Tab =
  | 'employees'
  | 'projects'
  | 'suppliers'
  | 'materials'
  | 'users'
  | 'companies'
  | 'auditLogs'
  | 'schema';

interface RbacPreset {
  key: string;
  label: string;
  department: string;
  position: string;
  modules: ModuleId[];
  perms: PermissionId[];
}

const RBAC_PRESETS: RbacPreset[] = [
  {
    key: 'engMonitoring',
    label: 'Engineering Monitoring',
    department: 'Engineering',
    position: 'Engineering Monitoring',
    modules: ['dashboard', 'requisitions', 'docTracker'],
    perms: ['view_dashboard', 'view_transactions', 'create_transactions', 'edit_transactions', 'submit_transactions'],
  },
  {
    key: 'engStaff',
    label: 'Engineering Staff',
    department: 'Engineering',
    position: 'Engineering Staff',
    modules: ['dashboard', 'requisitions', 'docTracker', 'tools'],
    perms: ['view_dashboard', 'view_transactions', 'create_transactions', 'edit_transactions', 'submit_transactions', 'process_transactions', 'print_documents'],
  },
  {
    key: 'purchasingHead',
    label: 'Purchasing / Canvassing Head',
    department: 'Purchasing / Canvassing',
    position: 'Purchasing / Canvassing Head',
    modules: ['dashboard', 'requisitions', 'canvassing', 'purchasing', 'orders', 'docTracker', 'reports'],
    perms: [
      'view_dashboard',
      'view_transactions',
      'create_transactions',
      'edit_transactions',
      'submit_transactions',
      'process_transactions',
      'approve_transactions',
      'reject_transactions',
      'print_documents',
      'generate_reports',
      'export_reports',
    ],
  },
  {
    key: 'purchasingStaff',
    label: 'Purchasing / Canvassing Staff',
    department: 'Purchasing / Canvassing',
    position: 'Purchasing / Canvassing Staff',
    modules: ['dashboard', 'requisitions', 'canvassing', 'purchasing', 'orders', 'docTracker'],
    perms: ['view_dashboard', 'view_transactions', 'create_transactions', 'edit_transactions', 'submit_transactions', 'process_transactions', 'print_documents'],
  },
  {
    key: 'motorpoolStaff',
    label: 'Motorpool Purchasing Staff',
    department: 'Motorpool / Purchasing',
    position: 'Purchasing / Canvassing Staff – Motorpool',
    modules: ['dashboard', 'requisitions', 'canvassing', 'purchasing', 'orders', 'tools', 'docTracker'],
    perms: ['view_dashboard', 'view_transactions', 'create_transactions', 'edit_transactions', 'submit_transactions', 'process_transactions', 'print_documents'],
  },
  {
    key: 'accountingHead',
    label: 'Accounting Head',
    department: 'Accounting',
    position: 'Accounting Head',
    modules: ['dashboard', 'vouchers', 'accounting', 'docTracker', 'reports'],
    perms: [
      'view_dashboard',
      'view_transactions',
      'create_transactions',
      'edit_transactions',
      'submit_transactions',
      'process_transactions',
      'approve_transactions',
      'reject_transactions',
      'print_documents',
      'generate_reports',
      'export_reports',
    ],
  },
  {
    key: 'accountingStaff',
    label: 'Accounting Voucher Staff',
    department: 'Accounting',
    position: 'Accounting Voucher Staff',
    modules: ['dashboard', 'vouchers', 'accounting', 'docTracker'],
    perms: ['view_dashboard', 'view_transactions', 'create_transactions', 'edit_transactions', 'submit_transactions', 'process_transactions', 'print_documents'],
  },
  {
    key: 'financeVp',
    label: 'Finance Vice President',
    department: 'Finance & Executive',
    position: 'Finance Vice President',
    modules: ['dashboard', 'requisitions', 'canvassing', 'purchasing', 'orders', 'vouchers', 'accounting', 'docTracker', 'reports'],
    perms: ['view_dashboard', 'view_transactions', 'approve_transactions', 'reject_transactions', 'print_documents', 'generate_reports', 'export_reports'],
  },
  {
    key: 'companyAdmin',
    label: 'Full Company Access',
    department: 'IT & Systems Administration',
    position: 'System Administrator',
    modules: ALL_MODULE_IDS,
    perms: ALL_PERMISSION_IDS,
  },
];

const STATUS_BADGE_STYLES: Record<AccountStatus, string> = {
  Active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  Inactive: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
  Resigned: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  Suspended: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800',
};

export const MasterDataModule: React.FC<MasterDataModuleProps> = ({
  state,
  authToken,
  currentUser,
  activeCompany,
  can,
  onUpdateState,
  onSyncServerState,
}) => {
  const [tab, setTab] = useState<Tab>('employees');
  const [sigEmployee, setSigEmployee] = useState<Employee | null>(null);

  const canCreate = can('create_transactions');
  const canEdit = can('edit_transactions');
  const canDelete = can('delete_transactions');
  const canManageUsers = currentUser.isAdmin || can('manage_users');
  const canManageCompanies = currentUser.isAdmin || can('manage_companies');

  // Quick add forms for Projects / Suppliers / Materials / Employees
  const [newProj, setNewProj] = useState({
    name: '',
    type: 'Road' as ProjectType,
    location: 'Butuan City, Agusan Del Norte',
    budget: '5000000',
    manager: state.employees[0]?.name || 'Project Engineer',
  });
  const [newSup, setNewSup] = useState({
    name: '',
    contact: '',
    address: 'Butuan City, Agusan Del Norte',
    terms: 'Net 30',
    category: 'Construction',
  });
  const [newMat, setNewMat] = useState({
    name: '',
    group: 'Construction Materials' as ItemGroup,
    category: 'Road Materials',
    unit: 'Bag',
    standardCost: '300',
  });
  const [newEmp, setNewEmp] = useState({
    name: '',
    position: '',
    department: 'Engineering',
    email: '',
  });

  // =========================================================================
  // ENTERPRISE USER MANAGEMENT & RBAC ADMINISTRATION STATE
  // =========================================================================
  const [userSearch, setUserSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<'ALL' | 'RFB' | 'RBI' | 'BOTH'>('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [posFilter, setPosFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AccountStatus>('ALL');

  const [userBanner, setUserBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submittingUserAction, setSubmittingUserAction] = useState(false);

  // Add / Edit User Modal
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<{
    fullName: string;
    employeeCode: string;
    username: string;
    temporaryPassword: string;
    forceChange: boolean;
    department: string;
    position: string;
    roleLabel: string;
    isAdmin: boolean;
    accountStatus: AccountStatus;
    employmentStatus: EmploymentStatus;
    employeeId: string;
    companyAccess: UserCompanyAccess[];
  }>({
    fullName: '',
    employeeCode: '',
    username: '',
    temporaryPassword: '',
    forceChange: true,
    department: 'Purchasing / Canvassing',
    position: 'Purchasing / Canvassing Staff',
    roleLabel: 'Purchasing / Canvassing Staff',
    isAdmin: false,
    accountStatus: 'Active',
    employmentStatus: 'Regular',
    employeeId: '',
    companyAccess: [],
  });
  const [userFormError, setUserFormError] = useState('');

  // Permissions Matrix Modal
  const [permModalUser, setPermModalUser] = useState<SafeUserAccount | null>(null);
  const [permDraftAdmin, setPermDraftAdmin] = useState(false);
  const [permDraftAccess, setPermDraftAccess] = useState<UserCompanyAccess[]>([]);
  const [permDraftError, setPermDraftError] = useState('');

  // Password Reset Modal
  const [resetModalUser, setResetModalUser] = useState<SafeUserAccount | null>(null);
  const [resetMode, setResetMode] = useState<'custom' | 'random'>('custom');
  const [resetCustomPw, setResetCustomPw] = useState('');
  const [resetConfirmPw, setResetConfirmPw] = useState('');
  const [resetForceChange, setResetForceChange] = useState(true);
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [resetError, setResetError] = useState('');
  const [issuedTempPw, setIssuedTempPw] = useState<string | null>(null);
  const [copiedTempPw, setCopiedTempPw] = useState(false);

  // Status / Soft Deactivation Modal
  const [statusModalUser, setStatusModalUser] = useState<SafeUserAccount | null>(null);
  const [nextAccountStatus, setNextAccountStatus] = useState<AccountStatus>('Inactive');
  const [nextEmploymentStatus, setNextEmploymentStatus] = useState<EmploymentStatus>('Resigned');
  const [clearCompaniesOnDeactivate, setClearCompaniesOnDeactivate] = useState(false);
  const [statusConfirmed, setStatusConfirmed] = useState(false);
  const [statusError, setStatusError] = useState('');

  // Delete User Confirmation Modal
  const [deleteModalUser, setDeleteModalUser] = useState<SafeUserAccount | null>(null);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Company edit / create state
  const [companyDrafts, setCompanyDrafts] = useState<Record<string, Company>>({});
  const [newCompany, setNewCompany] = useState({
    code: '',
    name: '',
    legalName: '',
    tagline: '',
    address: 'P-1 A Brgy. Doongan, Butuan City, Agusan Del Norte',
    tin: '',
    email: '',
    themePrimary: '#123E82',
    themeAccent: '#2C6FE0',
  });

  // Audit logs search
  const [auditSearch, setAuditSearch] = useState('');

  const filteredAuditLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    if (!q) return state.auditLogs;
    return state.auditLogs.filter(
      (l) =>
        l.action.toLowerCase().includes(q) ||
        l.userName.toLowerCase().includes(q) ||
        l.username.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q)
    );
  }, [state.auditLogs, auditSearch]);

  const userSummary = useMemo(() => {
    const total = state.users.length;
    const active = state.users.filter((u) => u.accountStatus === 'Active').length;
    const inactive = state.users.filter((u) => u.accountStatus !== 'Active').length;
    const pendingPw = state.users.filter((u) => u.mustChangePassword).length;
    return { total, active, inactive, pendingPw };
  }, [state.users]);

  const distinctUserDepts = useMemo(
    () => Array.from(new Set([...STANDARD_DEPARTMENTS, ...state.users.map((u) => u.department).filter(Boolean)])),
    [state.users]
  );

  const distinctUserPositions = useMemo(
    () => Array.from(new Set([...STANDARD_POSITIONS, ...state.users.map((u) => u.position).filter(Boolean)])),
    [state.users]
  );

  const distinctUserRoles = useMemo(
    () => Array.from(new Set(state.users.map((u) => u.roleLabel).filter(Boolean))),
    [state.users]
  );

  const getCompanyScope = (u: SafeUserAccount): 'RFB' | 'RBI' | 'BOTH' | 'NONE' => {
    if (u.isAdmin) return 'BOTH';
    const codes = new Set(
      u.companyAccess.map((a) => state.companies.find((c) => c.id === a.companyId)?.code || a.companyId)
    );
    const hasRfb = codes.has('RFB');
    const hasRbi = codes.has('RBI');
    if (hasRfb && hasRbi) return 'BOTH';
    if (hasRfb) return 'RFB';
    if (hasRbi) return 'RBI';
    return 'NONE';
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return state.users.filter((u) => {
      if (statusFilter !== 'ALL' && u.accountStatus !== statusFilter) return false;
      if (deptFilter !== 'ALL' && u.department !== deptFilter) return false;
      if (posFilter !== 'ALL' && u.position !== posFilter) return false;
      if (roleFilter !== 'ALL' && u.roleLabel !== roleFilter) return false;

      if (companyFilter !== 'ALL') {
        const scope = getCompanyScope(u);
        if (companyFilter === 'RFB' && scope !== 'RFB' && scope !== 'BOTH') return false;
        if (companyFilter === 'RBI' && scope !== 'RBI' && scope !== 'BOTH') return false;
        if (companyFilter === 'BOTH' && scope !== 'BOTH') return false;
      }

      if (q) {
        const hay = `${u.fullName} ${u.username} ${u.employeeCode} ${u.department} ${u.position} ${u.roleLabel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [state.users, state.companies, userSearch, companyFilter, deptFilter, posFilter, roleFilter, statusFilter]);

  const handleSaveSignature = (employeeId: string, dataUrl: string) => {
    if (!canEdit && !canCreate) return;
    onUpdateState((prev) => ({
      ...prev,
      employees: prev.employees.map((e) =>
        e.id === employeeId ? { ...e, signatureDataUrl: dataUrl || undefined } : e
      ),
    }));
    setSigEmployee(null);
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !newProj.name.trim()) return;
    const id = `proj-${Date.now()}`;
    const code = `${activeCompany.code}-PRJ-${String(state.projects.length + 1).padStart(2, '0')}`;
    onUpdateState((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id,
          companyId: activeCompany.id,
          code,
          name: newProj.name.trim(),
          type: newProj.type,
          location: newProj.location.trim() || activeCompany.address,
          budget: Number(newProj.budget) || 0,
          status: 'Active',
          startDate: new Date().toISOString().slice(0, 10),
          manager: newProj.manager,
        },
      ],
    }));
    setNewProj({ ...newProj, name: '' });
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !newSup.name.trim()) return;
    onUpdateState((prev) => ({
      ...prev,
      suppliers: [
        ...prev.suppliers,
        {
          id: `sup-${Date.now()}`,
          companyId: activeCompany.id,
          name: newSup.name.trim(),
          contact: newSup.contact.trim() || '0917-000-0000',
          address: newSup.address.trim() || activeCompany.address,
          terms: newSup.terms,
          category: newSup.category,
          rating: 4.5,
        },
      ],
    }));
    setNewSup({ ...newSup, name: '', contact: '' });
  };

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !newMat.name.trim()) return;
    const code = `${activeCompany.code}-MAT-${String(state.materials.length + 1).padStart(3, '0')}`;
    onUpdateState((prev) => ({
      ...prev,
      materials: [
        ...prev.materials,
        {
          id: `mat-${Date.now()}`,
          companyId: activeCompany.id,
          code,
          name: newMat.name.trim(),
          group: newMat.group,
          category: newMat.category,
          unit: newMat.unit,
          standardCost: Number(newMat.standardCost) || 0,
        },
      ],
    }));
    setNewMat({ ...newMat, name: '' });
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !newEmp.name.trim()) return;
    const domain = activeCompany.email.split('@')[1] || 'rfbconstruction.ph';
    onUpdateState((prev) => ({
      ...prev,
      employees: [
        ...prev.employees,
        {
          id: `emp-${Date.now()}`,
          companyId: activeCompany.id,
          name: newEmp.name.trim(),
          position: newEmp.position.trim() || 'Staff',
          department: newEmp.department,
          email: newEmp.email.trim() || `staff@${domain}`,
        },
      ],
    }));
    setNewEmp({ name: '', position: '', department: 'Engineering', email: '' });
  };

  // =========================================================================
  // USER MODAL HELPERS
  // =========================================================================
  const openAddUserModal = () => {
    setEditingUserId(null);
    setUserFormError('');
    const defaultPreset = RBAC_PRESETS.find((p) => p.key === 'purchasingStaff')!;
    setUserForm({
      fullName: '',
      employeeCode: `EMP-${activeCompany.code}-${String(state.users.length + 1).padStart(3, '0')}`,
      username: '',
      temporaryPassword: '',
      forceChange: true,
      department: defaultPreset.department,
      position: defaultPreset.position,
      roleLabel: defaultPreset.label,
      isAdmin: false,
      accountStatus: 'Active',
      employmentStatus: 'Regular',
      employeeId: '',
      companyAccess: [
        {
          companyId: activeCompany.id,
          roleLabel: defaultPreset.label,
          allowedModules: [...defaultPreset.modules],
          permissions: [...defaultPreset.perms],
        },
      ],
    });
    setUserModalOpen(true);
  };

  const openEditUserModal = (u: SafeUserAccount) => {
    setEditingUserId(u.id);
    setUserFormError('');
    setUserForm({
      fullName: u.fullName,
      employeeCode: u.employeeCode,
      username: u.username,
      temporaryPassword: '',
      forceChange: u.mustChangePassword,
      department: u.department,
      position: u.position,
      roleLabel: u.roleLabel,
      isAdmin: u.isAdmin,
      accountStatus: u.accountStatus,
      employmentStatus: u.employmentStatus,
      employeeId: u.employeeId,
      companyAccess: u.companyAccess.map((a) => ({
        ...a,
        allowedModules: [...a.allowedModules],
        permissions: [...a.permissions],
      })),
    });
    setUserModalOpen(true);
  };

  const applyPresetToUserForm = (preset: RbacPreset) => {
    setUserForm((prev) => ({
      ...prev,
      department: preset.department,
      position: preset.position,
      roleLabel: preset.label,
      companyAccess: prev.companyAccess.map((a) => ({
        ...a,
        roleLabel: preset.label,
        allowedModules: [...preset.modules],
        permissions: [...preset.perms],
      })),
    }));
  };

  const setUserFormCompaniesMode = (mode: 'RFB' | 'RBI' | 'BOTH') => {
    const rfbComp = state.companies.find((c) => c.code === 'RFB');
    const rbiComp = state.companies.find((c) => c.code === 'RBI');
    const targets: Company[] = [];
    if ((mode === 'RFB' || mode === 'BOTH') && rfbComp) targets.push(rfbComp);
    if ((mode === 'RBI' || mode === 'BOTH') && rbiComp) targets.push(rbiComp);

    const template =
      userForm.companyAccess[0] || {
        companyId: activeCompany.id,
        roleLabel: userForm.roleLabel || userForm.position || 'Staff',
        allowedModules: RBAC_PRESETS[3].modules,
        permissions: RBAC_PRESETS[3].perms,
      };

    setUserForm((prev) => ({
      ...prev,
      isAdmin: false,
      companyAccess: targets.map((c) => {
        const existing = prev.companyAccess.find((a) => a.companyId === c.id);
        return (
          existing || {
            companyId: c.id,
            roleLabel: prev.roleLabel || template.roleLabel,
            allowedModules: [...template.allowedModules],
            permissions: [...template.permissions],
          }
        );
      }),
    }));
  };

  const handleSaveUserModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserFormError('');
    const username = userForm.username.trim().toLowerCase();
    const fullName = userForm.fullName.trim();
    if (!username || !fullName) {
      setUserFormError('Employee Name and Username are required.');
      return;
    }
    if (!editingUserId && userForm.temporaryPassword.trim().length < 6) {
      setUserFormError('Temporary Password must be at least 6 characters.');
      return;
    }
    if (!userForm.isAdmin && userForm.companyAccess.length === 0) {
      setUserFormError('Assign at least one company (RFB, RBI, or RFB + RBI).');
      return;
    }

    setSubmittingUserAction(true);
    try {
      const payload = {
        username,
        fullName,
        employeeCode: userForm.employeeCode.trim() || `EMP-${username.toUpperCase().slice(0, 6)}`,
        department: userForm.department,
        position: userForm.position,
        roleLabel: userForm.roleLabel.trim() || userForm.position,
        isAdmin: userForm.isAdmin,
        accountStatus: userForm.accountStatus,
        employmentStatus: userForm.employmentStatus,
        employeeId: userForm.employeeId || undefined,
        mustChangePassword: userForm.forceChange,
        temporaryPassword: editingUserId ? undefined : userForm.temporaryPassword.trim(),
        companyAccess: userForm.isAdmin
          ? state.companies.map((c) => ({
              companyId: c.id,
              roleLabel: userForm.roleLabel.trim() || 'System Administrator',
              allowedModules: ALL_MODULE_IDS,
              permissions: ALL_PERMISSION_IDS,
            }))
          : userForm.companyAccess,
      };

      const res = editingUserId
        ? await apiAdminUpdateUser(authToken, editingUserId, payload)
        : await apiAdminCreateUser(authToken, payload);

      onSyncServerState(res.state);
      setUserModalOpen(false);
      setUserBanner({
        type: 'success',
        text: editingUserId
          ? `Updated user ${res.user.fullName} (@${res.user.username}) and synced RBAC permissions.`
          : `Created user ${res.user.fullName} (@${res.user.username}). User will be prompted to set a private password on 1st login.`,
      });
    } catch (err) {
      setUserFormError(err instanceof Error ? err.message : 'Unable to save user account.');
    } finally {
      setSubmittingUserAction(false);
    }
  };

  // =========================================================================
  // PERMISSIONS MATRIX MODAL HELPERS
  // =========================================================================
  const openPermissionsModal = (u: SafeUserAccount) => {
    setPermModalUser(u);
    setPermDraftAdmin(u.isAdmin);
    setPermDraftAccess(
      u.companyAccess.map((a) => ({
        ...a,
        allowedModules: [...a.allowedModules],
        permissions: [...a.permissions],
      }))
    );
    setPermDraftError('');
  };

  const togglePermCompany = (compId: string) => {
    setPermDraftAccess((prev) => {
      const exists = prev.some((a) => a.companyId === compId);
      if (exists) return prev.filter((a) => a.companyId !== compId);
      const base = prev[0] || {
        roleLabel: permModalUser?.roleLabel || 'Staff',
        allowedModules: RBAC_PRESETS[3].modules,
        permissions: RBAC_PRESETS[3].perms,
      };
      return [
        ...prev,
        {
          companyId: compId,
          roleLabel: base.roleLabel,
          allowedModules: [...base.allowedModules],
          permissions: [...base.permissions],
        },
      ];
    });
  };

  const handleSavePermissionsMatrix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!permModalUser) return;
    setPermDraftError('');
    if (!permDraftAdmin && permDraftAccess.length === 0) {
      setPermDraftError('Select at least one company or enable System Administrator.');
      return;
    }

    setSubmittingUserAction(true);
    try {
      const res = await apiAdminUpdateUser(authToken, permModalUser.id, {
        isAdmin: permDraftAdmin,
        companyAccess: permDraftAdmin
          ? state.companies.map((c) => ({
              companyId: c.id,
              roleLabel: permModalUser.roleLabel || 'System Administrator',
              allowedModules: ALL_MODULE_IDS,
              permissions: ALL_PERMISSION_IDS,
            }))
          : permDraftAccess,
      });
      onSyncServerState(res.state);
      setPermModalUser(null);
      setUserBanner({
        type: 'success',
        text: `Updated RBAC permissions & company assignments for ${res.user.fullName} (@${res.user.username}).`,
      });
    } catch (err) {
      setPermDraftError(err instanceof Error ? err.message : 'Unable to update permissions.');
    } finally {
      setSubmittingUserAction(false);
    }
  };

  // =========================================================================
  // PASSWORD RESET MODAL HELPERS
  // =========================================================================
  const openResetPasswordModal = (u: SafeUserAccount) => {
    setResetModalUser(u);
    setResetMode('custom');
    setResetCustomPw('');
    setResetConfirmPw('');
    setResetForceChange(true);
    setResetConfirmed(false);
    setResetError('');
    setIssuedTempPw(null);
    setCopiedTempPw(false);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setResetError('');

    if (resetMode === 'custom') {
      if (resetCustomPw.trim().length < 6) {
        setResetError('Temporary password must be at least 6 characters.');
        return;
      }
      if (resetCustomPw !== resetConfirmPw) {
        setResetError('Temporary password and confirmation do not match.');
        return;
      }
    }
    if (!resetConfirmed) {
      setResetError('Please confirm resetting this user password.');
      return;
    }

    setSubmittingUserAction(true);
    try {
      const res = await apiAdminResetPassword(authToken, resetModalUser.id, {
        generateRandom: resetMode === 'random',
        temporaryPassword: resetMode === 'custom' ? resetCustomPw.trim() : undefined,
        forceChange: resetForceChange,
      });
      onSyncServerState(res.state);
      setIssuedTempPw(res.temporaryPassword);
      setUserBanner({
        type: 'success',
        text: `Issued new temporary password for ${res.user.fullName} (@${res.user.username}).`,
      });
    } catch (err) {
      setResetError(err instanceof Error ? err.message : 'Failed to reset password.');
    } finally {
      setSubmittingUserAction(false);
    }
  };

  // =========================================================================
  // DEACTIVATE / REACTIVATE MODAL HELPERS
  // =========================================================================
  const openStatusModal = (u: SafeUserAccount) => {
    setStatusModalUser(u);
    const defaultNext: AccountStatus = u.accountStatus === 'Active' ? 'Inactive' : 'Active';
    setNextAccountStatus(defaultNext);
    setNextEmploymentStatus(defaultNext === 'Active' ? 'Regular' : 'Resigned');
    setClearCompaniesOnDeactivate(false);
    setStatusConfirmed(false);
    setStatusError('');
  };

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusModalUser) return;
    setStatusError('');
    if (!statusConfirmed) {
      setStatusError('Please check the confirmation box before applying this account status change.');
      return;
    }

    setSubmittingUserAction(true);
    try {
      const res = await apiAdminUpdateUserStatus(authToken, statusModalUser.id, {
        accountStatus: nextAccountStatus,
        employmentStatus: nextEmploymentStatus,
        clearCompanyAccess: nextAccountStatus !== 'Active' && clearCompaniesOnDeactivate,
      });
      onSyncServerState(res.state);
      setStatusModalUser(null);
      setUserBanner({
        type: 'success',
        text: `${res.user.fullName} (@${res.user.username}) status updated to ${res.user.accountStatus}. Historical records remain intact.`,
      });
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to update account status.');
    } finally {
      setSubmittingUserAction(false);
    }
  };

  // =========================================================================
  // DELETE USER MODAL HELPERS
  // =========================================================================
  const openDeleteModal = (u: SafeUserAccount) => {
    setDeleteModalUser(u);
    setDeleteConfirmed(false);
    setDeleteError('');
  };

  const handleConfirmDeleteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteModalUser) return;
    setDeleteError('');
    if (!deleteConfirmed) {
      setDeleteError('Please check the confirmation box to remove this user login.');
      return;
    }

    setSubmittingUserAction(true);
    try {
      const res = await apiAdminDeleteUser(authToken, deleteModalUser.id);
      onSyncServerState(res.state);
      const removedName = deleteModalUser.fullName;
      setDeleteModalUser(null);
      setUserBanner({
        type: 'success',
        text: `Removed login account for ${removedName}. Historical accounting, purchasing, and audit records were preserved.`,
      });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Unable to delete user account.');
    } finally {
      setSubmittingUserAction(false);
    }
  };

  const handleSaveCompany = (company: Company) => {
    if (!canManageCompanies) return;
    const draft = companyDrafts[company.id] || company;
    onUpdateState((prev) => ({
      ...prev,
      companies: prev.companies.map((c) => (c.id === company.id ? draft : c)),
    }));
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageCompanies || !newCompany.code.trim() || !newCompany.name.trim()) return;
    const code = newCompany.code.trim().toUpperCase();
    const created: Company = {
      id: `comp-${code.toLowerCase()}-${Date.now()}`,
      code,
      name: newCompany.name.trim(),
      legalName: newCompany.legalName.trim() || newCompany.name.trim().toUpperCase(),
      tagline: newCompany.tagline.trim() || 'Construction & Engineering Operations',
      address: newCompany.address.trim() || activeCompany.address,
      tin: newCompany.tin.trim() || '000-000-000-000',
      email: newCompany.email.trim() || `info@${code.toLowerCase()}.ph`,
      logoUrl: '/assets/aistudio/rfb-logo.png',
      themePrimary: newCompany.themePrimary,
      themeAccent: newCompany.themeAccent,
      isActive: true,
    };
    onUpdateState((prev) => ({
      ...prev,
      companies: [...prev.companies, created],
    }));
    setNewCompany({
      code: '',
      name: '',
      legalName: '',
      tagline: '',
      address: 'P-1 A Brgy. Doongan, Butuan City, Agusan Del Norte',
      tin: '',
      email: '',
      themePrimary: '#123E82',
      themeAccent: '#2C6FE0',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
          Master Data &amp; RBAC Administration
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {activeCompany.name} ({activeCompany.code}) projects, suppliers, catalog, e-signatures, multi-company user permissions, and audit logs.
        </p>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl w-fit">
        {(
          [
            { id: 'employees', label: 'Employees & E-Signatures' },
            { id: 'projects', label: 'Projects' },
            { id: 'suppliers', label: 'Suppliers' },
            { id: 'materials', label: 'Items Catalog' },
            ...(canManageUsers ? [{ id: 'users', label: 'User Accounts (RBAC)' }] : []),
            ...(canManageCompanies ? [{ id: 'companies', label: 'Companies' }] : []),
            { id: 'auditLogs', label: 'Audit Logs' },
            { id: 'schema', label: 'SQL DW Schema' },
          ] as { id: Tab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === t.id
                ? 'bg-white dark:bg-slate-900 brand-text-primary shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Employees & E-Signatures */}
      {tab === 'employees' && (
        <div className="space-y-5">
          {canCreate && (
            <form
              onSubmit={handleAddEmployee}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  placeholder="e.g. Engr. Marco Dizon"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Position</label>
                <input
                  type="text"
                  value={newEmp.position}
                  onChange={(e) => setNewEmp({ ...newEmp, position: e.target.value })}
                  placeholder="Site Engineer"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <input
                  type="text"
                  value={newEmp.department}
                  onChange={(e) => setNewEmp({ ...newEmp, department: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={newEmp.email}
                  onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                  placeholder={activeCompany.email}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold brand-btn-primary rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Employee
              </button>
            </form>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Employee Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Position</th>
                  <th className="px-4 py-3 text-left font-semibold">Department</th>
                  <th className="px-4 py-3 text-left font-semibold">E-Signature</th>
                  <th className="px-4 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{emp.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{emp.position}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{emp.department}</td>
                    <td className="px-4 py-3">
                      {emp.signatureDataUrl ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={emp.signatureDataUrl}
                            alt={`${emp.name} signature`}
                            className="h-8 w-24 object-contain border border-slate-200 dark:border-slate-700 rounded bg-white p-0.5"
                          />
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">Captured</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">Not captured yet</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(canEdit || canCreate) && (
                        <button
                          type="button"
                          onClick={() => setSigEmployee(emp)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold brand-soft-surface hover:opacity-90 rounded-lg cursor-pointer"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          {emp.signatureDataUrl ? 'Edit Signature' : 'Capture Signature'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Projects */}
      {tab === 'projects' && (
        <div className="space-y-5">
          {canCreate && (
            <form
              onSubmit={handleAddProject}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
            >
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProj.name}
                  onChange={(e) => setNewProj({ ...newProj, name: e.target.value })}
                  placeholder={`e.g. ${activeCompany.code} Bypass Road Expansion`}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                <select
                  value={newProj.type}
                  onChange={(e) => setNewProj({ ...newProj, type: e.target.value as ProjectType })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="Road">Road</option>
                  <option value="Bridge">Bridge</option>
                  <option value="Building">Building</option>
                  <option value="Administrative">Administrative</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Approved Budget (₱)</label>
                <input
                  type="number"
                  value={newProj.budget}
                  onChange={(e) => setNewProj({ ...newProj, budget: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold brand-btn-primary rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Project
              </button>
            </form>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Code</th>
                  <th className="px-4 py-3 text-left font-semibold">Project Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Type</th>
                  <th className="px-4 py-3 text-left font-semibold">Location</th>
                  <th className="px-4 py-3 text-right font-semibold">Budget</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.projects.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-semibold brand-text-primary">{p.code}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.type}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{p.location}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatPHP(p.budget)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusText status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers */}
      {tab === 'suppliers' && (
        <div className="space-y-5">
          {canCreate && (
            <form
              onSubmit={handleAddSupplier}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
            >
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier Name</label>
                <input
                  type="text"
                  value={newSup.name}
                  onChange={(e) => setNewSup({ ...newSup, name: e.target.value })}
                  placeholder="Supplier company name"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact No.</label>
                <input
                  type="text"
                  value={newSup.contact}
                  onChange={(e) => setNewSup({ ...newSup, contact: e.target.value })}
                  placeholder="0917-xxx-xxxx"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Terms</label>
                <input
                  type="text"
                  value={newSup.terms}
                  onChange={(e) => setNewSup({ ...newSup, terms: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold brand-btn-primary rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Supplier
              </button>
            </form>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Supplier</th>
                  <th className="px-4 py-3 text-left font-semibold">Category</th>
                  <th className="px-4 py-3 text-left font-semibold">Address</th>
                  <th className="px-4 py-3 text-left font-semibold">Contact</th>
                  <th className="px-4 py-3 text-left font-semibold">Terms</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{s.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.category}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{s.address}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{s.contact}</td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{s.terms}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Items Catalog */}
      {tab === 'materials' && (
        <div className="space-y-5">
          {canCreate && (
            <form
              onSubmit={handleAddMaterial}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
            >
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Item / Material Name</label>
                <input
                  type="text"
                  value={newMat.name}
                  onChange={(e) => setNewMat({ ...newMat, name: e.target.value })}
                  placeholder="Item description"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Group</label>
                <select
                  value={newMat.group}
                  onChange={(e) => setNewMat({ ...newMat, group: e.target.value as ItemGroup })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="Construction Materials">Construction Materials</option>
                  <option value="ICT Equipment">ICT Equipment</option>
                  <option value="General Supplies">General Supplies</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit / Std Cost (₱)</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={newMat.unit}
                    onChange={(e) => setNewMat({ ...newMat, unit: e.target.value })}
                    placeholder="Unit"
                    className="w-1/2 px-2.5 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                  <input
                    type="number"
                    value={newMat.standardCost}
                    onChange={(e) => setNewMat({ ...newMat, standardCost: e.target.value })}
                    className="w-1/2 px-2.5 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold brand-btn-primary rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </form>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Code</th>
                  <th className="px-4 py-3 text-left font-semibold">Item Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Group</th>
                  <th className="px-4 py-3 text-left font-semibold">Unit</th>
                  <th className="px-4 py-3 text-right font-semibold">Standard Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.materials.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-semibold brand-text-primary">{m.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{m.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.group}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{m.unit}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatPHP(m.standardCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Enterprise Multi-Company RBAC User Management */}
      {tab === 'users' && canManageUsers && (
        <div className="space-y-5">
          {/* Summary KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Total User Accounts
              </div>
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                {userSummary.total}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Active Accounts
              </div>
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                {userSummary.active}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Inactive / Resigned / Suspended
              </div>
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                {userSummary.inactive}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                1st-Login Password Pending
              </div>
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                {userSummary.pendingPw}
              </div>
            </div>
          </div>

          {userBanner && (
            <div
              className={`rounded-2xl border px-4 py-3 flex items-center justify-between gap-3 text-xs ${
                userBanner.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
              }`}
            >
              <span className="font-medium">{userBanner.text}</span>
              <button
                type="button"
                onClick={() => setUserBanner(null)}
                className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Search, Multi-Facet Filters & Add User CTA */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search employee name, @username, employee ID, department..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              <button
                type="button"
                onClick={openAddUserModal}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold brand-btn-primary rounded-xl shadow-xs cursor-pointer whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-4 h-4" /> Add User Account
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">
                  Company Access
                </label>
                <select
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value as 'ALL' | 'RFB' | 'RBI' | 'BOTH')}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="ALL">All Companies</option>
                  <option value="RFB">RFB Access</option>
                  <option value="RBI">RBI Access</option>
                  <option value="BOTH">RFB + RBI (Both)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">
                  Department
                </label>
                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="ALL">All Departments</option>
                  {distinctUserDepts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">
                  Position
                </label>
                <select
                  value={posFilter}
                  onChange={(e) => setPosFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="ALL">All Positions</option>
                  {distinctUserPositions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">
                  System Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="ALL">All Roles</option>
                  {distinctUserRoles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 mb-1">
                  Account Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'ALL' | AccountStatus)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Enterprise User Directory Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-xs min-w-[1050px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Employee &amp; Account</th>
                  <th className="px-4 py-3 text-left font-semibold">Department / Position</th>
                  <th className="px-4 py-3 text-left font-semibold">Company Assignment &amp; RBAC</th>
                  <th className="px-4 py-3 text-left font-semibold">Status &amp; Security</th>
                  <th className="px-4 py-3 text-left font-semibold">Audit Metadata</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No user accounts match the active search or filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const scope = getCompanyScope(u);
                    const isSelf = u.id === currentUser.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 align-top">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{u.fullName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5 font-mono text-[11px]">
                            <span className="font-semibold brand-text-primary">@{u.username}</span>
                            <span className="text-slate-400">·</span>
                            <span className="text-slate-500 dark:text-slate-400">{u.employeeCode}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{u.position}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{u.department}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Role: {u.roleLabel}</div>
                        </td>

                        <td className="px-4 py-3 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {scope === 'BOTH' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800">
                                RFB + RBI
                              </span>
                            )}
                            {scope === 'RFB' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-[#123E82] border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
                                RFB Only
                              </span>
                            )}
                            {scope === 'RBI' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-[#113E2B] border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                                RBI Only
                              </span>
                            )}
                            {scope === 'NONE' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                                No Company Access
                              </span>
                            )}
                            {u.isAdmin && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
                                Super Admin
                              </span>
                            )}
                          </div>
                          {!u.isAdmin && u.companyAccess.length > 0 && (
                            <div className="space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                              {u.companyAccess.map((a) => {
                                const cCode =
                                  state.companies.find((c) => c.id === a.companyId)?.code || a.companyId;
                                return (
                                  <div key={a.companyId}>
                                    <strong className="text-slate-700 dark:text-slate-300">{cCode}:</strong>{' '}
                                    {a.allowedModules.length} modules · {a.permissions.length} perms
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 space-y-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
                              STATUS_BADGE_STYLES[u.accountStatus]
                            }`}
                          >
                            {u.accountStatus}
                          </span>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Emp: {u.employmentStatus}
                          </div>
                          {u.mustChangePassword ? (
                            <div className="text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                              Temp PW (Beta Active)
                            </div>
                          ) : (
                            <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                              Password Updated
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-0.5">
                          <div>Created: {u.dateCreated || '—'}</div>
                          <div>Last Login: {u.lastLogin || 'Never'}</div>
                          <div>
                            By: {u.updatedBy || u.createdBy || 'system'}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex flex-wrap justify-end gap-1.5 max-w-[260px]">
                            <button
                              type="button"
                              onClick={() => openEditUserModal(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg cursor-pointer"
                            >
                              <Edit3 className="w-3 h-3" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => openPermissionsModal(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold brand-soft-surface hover:opacity-90 rounded-lg cursor-pointer"
                            >
                              <Shield className="w-3 h-3" /> Permissions
                            </button>
                            <button
                              type="button"
                              onClick={() => openResetPasswordModal(u)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 dark:text-amber-300 rounded-lg cursor-pointer"
                            >
                              <KeyRound className="w-3 h-3" /> Reset PW
                            </button>
                            {!isSelf && (
                              <button
                                type="button"
                                onClick={() => openStatusModal(u)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-lg cursor-pointer ${
                                  u.accountStatus === 'Active'
                                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}
                              >
                                {u.accountStatus === 'Active' ? (
                                  <>
                                    <UserX className="w-3 h-3" /> Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3 h-3" /> Reactivate
                                  </>
                                )}
                              </button>
                            )}
                            {!isSelf && (currentUser.isAdmin || canDelete) && (
                              <button
                                type="button"
                                onClick={() => openDeleteModal(u)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 rounded-lg cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Companies Management */}
      {tab === 'companies' && canManageCompanies && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {state.companies.map((comp) => {
              const draft = companyDrafts[comp.id] || comp;
              return (
                <div
                  key={comp.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1.5 flex items-center justify-center shrink-0">
                        <img src={comp.logoUrl} alt={comp.name} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold" style={{ color: draft.themePrimary }}>
                          {draft.code} Entity
                        </div>
                        <div className="font-display font-bold text-slate-900 dark:text-slate-100">{draft.name}</div>
                      </div>
                    </div>
                    <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={draft.isActive}
                        onChange={(e) =>
                          setCompanyDrafts((prev) => ({
                            ...prev,
                            [comp.id]: { ...draft, isActive: e.target.checked },
                          }))
                        }
                      />
                      Active
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Display Name</label>
                      <input
                        type="text"
                        value={draft.name}
                        onChange={(e) =>
                          setCompanyDrafts((prev) => ({ ...prev, [comp.id]: { ...draft, name: e.target.value } }))
                        }
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">TIN</label>
                      <input
                        type="text"
                        value={draft.tin}
                        onChange={(e) =>
                          setCompanyDrafts((prev) => ({ ...prev, [comp.id]: { ...draft, tin: e.target.value } }))
                        }
                        className="w-full px-3 py-1.5 font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Address</label>
                      <input
                        type="text"
                        value={draft.address}
                        onChange={(e) =>
                          setCompanyDrafts((prev) => ({ ...prev, [comp.id]: { ...draft, address: e.target.value } }))
                        }
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSaveCompany(comp)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold brand-btn-primary rounded-lg cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Save Company Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleCreateCompany}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3"
          >
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Building2 className="w-4 h-4 brand-text-accent" /> Register Additional Group Entity
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <input
                type="text"
                value={newCompany.code}
                onChange={(e) => setNewCompany({ ...newCompany, code: e.target.value })}
                placeholder="Code (e.g. RCI)"
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                required
              />
              <input
                type="text"
                value={newCompany.name}
                onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                placeholder="Company Name"
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                required
              />
              <input
                type="text"
                value={newCompany.legalName}
                onChange={(e) => setNewCompany({ ...newCompany, legalName: e.target.value })}
                placeholder="Registered Legal Name"
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold brand-btn-primary rounded-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Company
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Company-Scoped Audit Logs */}
      {tab === 'auditLogs' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
              <History className="w-4 h-4 brand-text-accent" />
              <span>
                {activeCompany.name} ({activeCompany.code}) Security &amp; Transaction Audit Trail
              </span>
            </div>
            <input
              type="text"
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              placeholder="Filter audit action, user, details..."
              className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg w-64"
            />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-xs min-w-[760px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Timestamp</th>
                  <th className="px-4 py-3 text-left font-semibold">Company</th>
                  <th className="px-4 py-3 text-left font-semibold">User</th>
                  <th className="px-4 py-3 text-left font-semibold">Module</th>
                  <th className="px-4 py-3 text-left font-semibold">Action</th>
                  <th className="px-4 py-3 text-left font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-500 dark:text-slate-400">
                      No audit entries match your filter.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="px-4 py-2.5 font-mono font-semibold brand-text-primary">{log.companyCode}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-medium text-slate-900 dark:text-slate-100">{log.userName}</span>{' '}
                        <span className="font-mono text-[11px] text-slate-400">({log.username})</span>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{log.module}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">{log.action}</td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SQL Schema Tab */}
      {tab === 'schema' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold brand-text-primary">
            <Database className="w-4 h-4" />
            Multi-Company Construction ERP — SQL OLTP, RBAC &amp; Data Warehouse DDL
          </div>
          <pre className="bg-slate-900 dark:bg-slate-950 text-blue-100 border border-slate-800 rounded-xl p-5 text-xs font-mono overflow-x-auto leading-relaxed">
            {SQL_WAREHOUSE_SCHEMA}
          </pre>
        </div>
      )}

      {sigEmployee && (
        <SignaturePadModal
          employee={sigEmployee}
          onClose={() => setSigEmployee(null)}
          onSave={handleSaveSignature}
        />
      )}

      {/* =================================================================== */}
      {/* MODAL 1: ADD / EDIT USER ACCOUNT                                    */}
      {/* =================================================================== */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveUserModal}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl p-6 space-y-4 my-auto"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-base font-display font-bold text-slate-900 dark:text-slate-100">
                <Users className="w-4 h-4 brand-text-accent" />
                {editingUserId ? `Edit User Account (@${userForm.username})` : 'Add New Organizational User'}
              </div>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Department / Position Template Strip */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Quick Department &amp; Position RBAC Templates:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {RBAC_PRESETS.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPresetToUserForm(preset)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-md cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee Name *</label>
                <input
                  type="text"
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  placeholder="e.g. Maria Santos"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employee ID *</label>
                <input
                  type="text"
                  value={userForm.employeeCode}
                  onChange={(e) => setUserForm({ ...userForm, employeeCode: e.target.value })}
                  placeholder="EMP-RFB-005"
                  className="w-full px-3 py-2 font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Username * <span className="text-[10px] font-normal text-slate-400">(use rfb* or rbi* for single-company)</span>
                </label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="e.g. rfbmaria or juan"
                  className="w-full px-3 py-2 font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  required
                />
              </div>
              {!editingUserId ? (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Temporary Password *
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={userForm.temporaryPassword}
                      onChange={(e) => setUserForm({ ...userForm, temporaryPassword: e.target.value })}
                      placeholder="Min 6 chars (e.g. username)"
                      className="flex-1 px-3 py-2 font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setUserForm((prev) => ({
                          ...prev,
                          temporaryPassword: prev.username.trim().toLowerCase() || 'TempPass2026!',
                        }))
                      }
                      className="px-2.5 py-2 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer whitespace-nowrap"
                    >
                      = Username
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Status</label>
                  <select
                    value={userForm.accountStatus}
                    onChange={(e) => setUserForm({ ...userForm, accountStatus: e.target.value as AccountStatus })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Resigned">Resigned</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                <select
                  value={userForm.department}
                  onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {STANDARD_DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Position</label>
                <select
                  value={userForm.position}
                  onChange={(e) =>
                    setUserForm({ ...userForm, position: e.target.value, roleLabel: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  {STANDARD_POSITIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">System Role Label</label>
                <input
                  type="text"
                  value={userForm.roleLabel}
                  onChange={(e) => setUserForm({ ...userForm, roleLabel: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employment Status</label>
                <select
                  value={userForm.employmentStatus}
                  onChange={(e) =>
                    setUserForm({ ...userForm, employmentStatus: e.target.value as EmploymentStatus })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="Regular">Regular</option>
                  <option value="Probationary">Probationary</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>

            {/* Company Access Assignment */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Company Access Assignment:</span>
                <label className="inline-flex items-center gap-1.5 font-semibold brand-text-primary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userForm.isAdmin}
                    onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                  />
                  System Administrator (RFB + RBI Full Access)
                </label>
              </div>

              {!userForm.isAdmin && (
                <div className="flex flex-wrap gap-2">
                  {[
                    { mode: 'RFB' as const, label: 'RFB Construction Only' },
                    { mode: 'RBI' as const, label: 'RBI Construction Only' },
                    { mode: 'BOTH' as const, label: 'Both RFB & RBI' },
                  ].map((opt) => {
                    const codes = userForm.companyAccess.map(
                      (a) => state.companies.find((c) => c.id === a.companyId)?.code
                    );
                    const isSelected =
                      (opt.mode === 'RFB' && codes.length === 1 && codes[0] === 'RFB') ||
                      (opt.mode === 'RBI' && codes.length === 1 && codes[0] === 'RBI') ||
                      (opt.mode === 'BOTH' && codes.includes('RFB') && codes.includes('RBI'));
                    return (
                      <button
                        key={opt.mode}
                        type="button"
                        onClick={() => setUserFormCompaniesMode(opt.mode)}
                        className={`px-3 py-1.5 rounded-lg border font-semibold cursor-pointer ${
                          isSelected
                            ? 'brand-soft-outline'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {!editingUserId && (
                <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={userForm.forceChange}
                    onChange={(e) => setUserForm({ ...userForm, forceChange: e.target.checked })}
                  />
                  <span>Force user to change temporary password on 1st login (Recommended)</span>
                </label>
              )}
            </div>

            {userFormError && (
              <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-2">
                {userFormError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingUserAction}
                className="px-4 py-2 text-xs font-semibold brand-btn-primary disabled:opacity-60 rounded-xl cursor-pointer"
              >
                {submittingUserAction ? 'Saving...' : editingUserId ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: GRANULAR PERMISSIONS & COMPANY MATRIX MODAL                */}
      {/* =================================================================== */}
      {permModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSavePermissionsMatrix}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl p-6 space-y-5 my-auto max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-base font-display font-bold text-slate-900 dark:text-slate-100">
                  <Shield className="w-4 h-4 brand-text-accent" />
                  RBAC Permissions Matrix — {permModalUser.fullName} (@{permModalUser.username})
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {permModalUser.department} · {permModalUser.position}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPermModalUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Assigned Companies:</span>
                {state.companies.map((c) => {
                  const active = permDraftAdmin || permDraftAccess.some((a) => a.companyId === c.id);
                  return (
                    <label
                      key={c.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer ${
                        active
                          ? 'brand-soft-outline font-semibold'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={active}
                        disabled={permDraftAdmin}
                        onChange={() => togglePermCompany(c.id)}
                      />
                      {c.name} ({c.code})
                    </label>
                  );
                })}
              </div>

              <label className="inline-flex items-center gap-1.5 font-semibold brand-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={permDraftAdmin}
                  onChange={(e) => setPermDraftAdmin(e.target.checked)}
                />
                System Administrator (Full Access)
              </label>
            </div>

            {!permDraftAdmin &&
              permDraftAccess.map((access) => {
                const comp = state.companies.find((c) => c.id === access.companyId);
                if (!comp) return null;
                return (
                  <div
                    key={comp.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/40 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: comp.themePrimary }} />
                        <span>
                          {comp.name} ({comp.code}) Permissions
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {RBAC_PRESETS.map((preset) => (
                          <button
                            key={preset.key}
                            type="button"
                            onClick={() =>
                              setPermDraftAccess((prev) =>
                                prev.map((a) =>
                                  a.companyId === comp.id
                                    ? {
                                        ...a,
                                        roleLabel: preset.label,
                                        allowedModules: [...preset.modules],
                                        permissions: [...preset.perms],
                                      }
                                    : a
                                )
                              )
                            }
                            className="px-2 py-1 text-[10px] font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Allowed Modules in {comp.code}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_MODULES.map((m) => {
                          const has = access.allowedModules.includes(m.id);
                          return (
                            <label
                              key={m.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg border cursor-pointer ${
                                has
                                  ? 'brand-soft-outline font-semibold'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={has}
                                onChange={() =>
                                  setPermDraftAccess((prev) =>
                                    prev.map((a) =>
                                      a.companyId === comp.id
                                        ? {
                                            ...a,
                                            allowedModules: has
                                              ? a.allowedModules.filter((x) => x !== m.id)
                                              : [...a.allowedModules, m.id],
                                          }
                                        : a
                                    )
                                  )
                                }
                              />
                              {m.label}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                        Granular Action Permissions in {comp.code}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-1.5">
                        {ALL_PERMISSIONS.map((p) => {
                          const has = access.permissions.includes(p.id);
                          return (
                            <label
                              key={p.id}
                              title={p.description}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] rounded-lg border cursor-pointer ${
                                has
                                  ? 'brand-soft-outline font-semibold'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={has}
                                onChange={() =>
                                  setPermDraftAccess((prev) =>
                                    prev.map((a) =>
                                      a.companyId === comp.id
                                        ? {
                                            ...a,
                                            permissions: has
                                              ? a.permissions.filter((x) => x !== p.id)
                                              : [...a.permissions, p.id],
                                          }
                                        : a
                                    )
                                  )
                                }
                              />
                              <span className="truncate">{p.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}

            {permDraftError && (
              <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-2">
                {permDraftError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPermModalUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingUserAction}
                className="px-4 py-2 text-xs font-semibold brand-btn-primary disabled:opacity-60 rounded-xl cursor-pointer"
              >
                {submittingUserAction ? 'Saving Matrix...' : 'Save RBAC Matrix'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: ADMIN PASSWORD RESET / TEMPORARY PASSWORD GENERATOR        */}
      {/* =================================================================== */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleResetPasswordSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-600" /> Admin Password Reset
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {resetModalUser.fullName} (@{resetModalUser.username}) · {resetModalUser.employeeCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetModalUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {issuedTempPw ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-4 space-y-2">
                  <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                    Temporary Password Issued (One-Time Display)
                  </div>
                  <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                      {issuedTempPw}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(issuedTempPw).catch(() => undefined);
                        setCopiedTempPw(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> {copiedTempPw ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    Stored securely as a cryptographic hash only. Provide this temporary password directly to the employee.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="w-full py-2 text-xs font-semibold brand-btn-primary rounded-xl cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setResetMode('custom')}
                    className={`py-2 px-3 rounded-xl border font-semibold cursor-pointer ${
                      resetMode === 'custom'
                        ? 'brand-soft-outline'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Custom Temp Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setResetMode('random')}
                    className={`py-2 px-3 rounded-xl border font-semibold cursor-pointer ${
                      resetMode === 'random'
                        ? 'brand-soft-outline'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Auto-Generate Random
                  </button>
                </div>

                {resetMode === 'custom' ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        New Temporary Password (min 6 characters)
                      </label>
                      <input
                        type="password"
                        value={resetCustomPw}
                        onChange={(e) => setResetCustomPw(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Confirm Temporary Password
                      </label>
                      <input
                        type="password"
                        value={resetConfirmPw}
                        onChange={(e) => setResetConfirmPw(e.target.value)}
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 text-xs text-slate-600 dark:text-slate-300">
                    A cryptographically random temporary password will be generated and hashed immediately upon confirmation.
                  </div>
                )}

                <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetForceChange}
                    onChange={(e) => setResetForceChange(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>Force user to change password on next login</span>
                </label>

                <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resetConfirmed}
                    onChange={(e) => setResetConfirmed(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span>I confirm resetting this account password and invalidating any prior active sessions.</span>
                </label>

                {resetError && (
                  <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-2">
                    {resetError}
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingUserAction}
                    className="px-4 py-2 text-xs font-semibold brand-btn-primary disabled:opacity-60 rounded-xl cursor-pointer"
                  >
                    {submittingUserAction ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: ACCOUNT STATUS / SOFT DEACTIVATION                         */}
      {/* =================================================================== */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleStatusSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Update Account &amp; Employment Status
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {statusModalUser.fullName} (@{statusModalUser.username}) · {statusModalUser.employeeCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {nextAccountStatus !== 'Active' && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 p-3.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Are you sure you want to deactivate this user? The user will no longer be able to log in, but historical transactions will remain in the system.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Status</label>
                <select
                  value={nextAccountStatus}
                  onChange={(e) => {
                    const st = e.target.value as AccountStatus;
                    setNextAccountStatus(st);
                    if (st === 'Resigned') setNextEmploymentStatus('Resigned');
                    if (st === 'Active') setNextEmploymentStatus('Regular');
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Employment Status</label>
                <select
                  value={nextEmploymentStatus}
                  onChange={(e) => setNextEmploymentStatus(e.target.value as EmploymentStatus)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="Regular">Regular</option>
                  <option value="Probationary">Probationary</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Transferred">Transferred</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>

            {nextAccountStatus !== 'Active' && (
              <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={clearCompaniesOnDeactivate}
                  onChange={(e) => setClearCompaniesOnDeactivate(e.target.checked)}
                  className="mt-0.5"
                />
                <span>Also remove RFB / RBI company assignments from this account</span>
              </label>
            )}

            <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={statusConfirmed}
                onChange={(e) => setStatusConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span>Confirm updating account status to {nextAccountStatus}.</span>
            </label>

            {statusError && (
              <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-2">
                {statusError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingUserAction}
                className="px-4 py-2 text-xs font-semibold brand-btn-primary disabled:opacity-60 rounded-xl cursor-pointer"
              >
                {submittingUserAction ? 'Updating...' : 'Apply Status Change'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: DELETE USER ACCOUNT CONFIRMATION                           */}
      {/* =================================================================== */}
      {deleteModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmDeleteUser}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-display text-base font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Remove User Login Account
              </h3>
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 p-3.5 text-xs text-red-800 dark:text-red-200 space-y-1.5">
              <p>
                You are about to remove login access for <strong>{deleteModalUser.fullName}</strong> (@
                {deleteModalUser.username}).
              </p>
              <p>
                All historical accounting, purchasing, voucher, requisition, and audit trail records linked to this user will remain permanently preserved.
              </p>
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={deleteConfirmed}
                onChange={(e) => setDeleteConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              <span>I confirm removing this user login account.</span>
            </label>

            {deleteError && (
              <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-2">
                {deleteError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingUserAction}
                className="px-4 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-60 rounded-xl cursor-pointer"
              >
                {submittingUserAction ? 'Removing...' : 'Confirm Delete User'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
