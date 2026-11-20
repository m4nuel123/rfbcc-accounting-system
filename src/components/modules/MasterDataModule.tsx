import React, { useMemo, useState } from 'react';
import { Building2, Check, Database, History, PenTool, Plus, Shield, Trash2, Users } from 'lucide-react';
import {
  ALL_MODULES,
  ALL_MODULE_IDS,
  ALL_PERMISSIONS,
  ALL_PERMISSION_IDS,
  SQL_WAREHOUSE_SCHEMA,
} from '../../utils/erpConfig';
import {
  Company,
  Employee,
  ERPState,
  ItemGroup,
  ModuleId,
  PermissionId,
  ProjectType,
  SafeUserAccount,
  UserAccount,
  UserCompanyAccess,
} from '../../types/erp';
import { formatPHP } from '../../utils/formatters';
import { SignaturePadModal } from '../SignaturePadModal';
import { StatusText } from '../StatusText';

interface MasterDataModuleProps {
  state: ERPState;
  currentUser: SafeUserAccount;
  activeCompany: Company;
  can: (perm: PermissionId) => boolean;
  onUpdateState: (updater: (prev: ERPState) => ERPState) => void;
}

type Tab = 'employees' | 'projects' | 'suppliers' | 'materials' | 'users' | 'companies' | 'auditLogs' | 'schema';

const DEFAULT_MODULES_BY_PRESET: Record<string, { modules: ModuleId[]; perms: PermissionId[]; label: string }> = {
  combined: {
    label: 'Accounting + Purchasing',
    modules: ['dashboard', 'requisitions', 'canvassing', 'purchasing', 'orders', 'vouchers', 'accounting', 'docTracker', 'reports'],
    perms: ['view_dashboard', 'view_transactions', 'create_transactions', 'edit_transactions', 'approve_transactions', 'generate_reports', 'export_reports'],
  },
  purchasing: {
    label: 'Purchasing Only',
    modules: ['dashboard', 'requisitions', 'canvassing', 'purchasing', 'orders', 'docTracker'],
    perms: ['view_dashboard', 'view_transactions', 'create_transactions', 'edit_transactions'],
  },
  accounting: {
    label: 'Accounting Only',
    modules: ['dashboard', 'vouchers', 'accounting', 'reports'],
    perms: ['view_dashboard', 'view_transactions', 'create_transactions', 'edit_transactions', 'approve_transactions', 'generate_reports', 'export_reports'],
  },
  fullAdmin: {
    label: 'Company Admin',
    modules: ALL_MODULE_IDS,
    perms: ALL_PERMISSION_IDS,
  },
};

export const MasterDataModule: React.FC<MasterDataModuleProps> = ({
  state,
  currentUser,
  activeCompany,
  can,
  onUpdateState,
}) => {
  const [tab, setTab] = useState<Tab>('employees');
  const [sigEmployee, setSigEmployee] = useState<Employee | null>(null);

  const canCreate = can('create_transactions');
  const canEdit = can('edit_transactions');
  const canDelete = can('delete_transactions');
  const canManageUsers = currentUser.isAdmin || can('manage_users');
  const canManageCompanies = currentUser.isAdmin || can('manage_companies');

  // Quick add forms
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
    department: 'Field Operations',
    email: '',
  });

  // Multi-company RBAC user creation & editor state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<{
    username: string;
    password: string;
    employeeId: string;
    roleLabel: string;
    isAdmin: boolean;
    companyAccess: UserCompanyAccess[];
  }>({
    username: '',
    password: '',
    employeeId: state.employees[0]?.id || '',
    roleLabel: '',
    isAdmin: false,
    companyAccess: [
      {
        companyId: activeCompany.id,
        roleLabel: 'Purchasing Officer',
        allowedModules: DEFAULT_MODULES_BY_PRESET.purchasing.modules,
        permissions: DEFAULT_MODULES_BY_PRESET.purchasing.perms,
      },
    ],
  });

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
    setNewEmp({ name: '', position: '', department: 'Field Operations', email: '' });
  };

  const toggleUserCompany = (compId: string) => {
    setUserForm((prev) => {
      const exists = prev.companyAccess.some((a) => a.companyId === compId);
      if (exists) {
        return {
          ...prev,
          companyAccess: prev.companyAccess.filter((a) => a.companyId !== compId),
        };
      }
      return {
        ...prev,
        companyAccess: [
          ...prev.companyAccess,
          {
            companyId: compId,
            roleLabel: prev.roleLabel.trim() || 'Staff User',
            allowedModules: DEFAULT_MODULES_BY_PRESET.purchasing.modules,
            permissions: DEFAULT_MODULES_BY_PRESET.purchasing.perms,
          },
        ],
      };
    });
  };

  const updateCompanyAccessField = (
    compId: string,
    updater: (cur: UserCompanyAccess) => UserCompanyAccess
  ) => {
    setUserForm((prev) => ({
      ...prev,
      companyAccess: prev.companyAccess.map((a) => (a.companyId === compId ? updater(a) : a)),
    }));
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setUserForm({
      username: '',
      password: '',
      employeeId: state.employees[0]?.id || '',
      roleLabel: '',
      isAdmin: false,
      companyAccess: [
        {
          companyId: activeCompany.id,
          roleLabel: 'Purchasing Officer',
          allowedModules: DEFAULT_MODULES_BY_PRESET.purchasing.modules,
          permissions: DEFAULT_MODULES_BY_PRESET.purchasing.perms,
        },
      ],
    });
  };

  const startEditUser = (u: UserAccount) => {
    setEditingUserId(u.id);
    setUserForm({
      username: u.username,
      password: '',
      employeeId: u.employeeId,
      roleLabel: u.roleLabel,
      isAdmin: u.isAdmin,
      companyAccess: u.companyAccess.map((a) => ({
        ...a,
        allowedModules: [...a.allowedModules],
        permissions: [...a.permissions],
      })),
    });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers || !userForm.username.trim()) return;
    if (!editingUserId && !userForm.password.trim()) return;

    const normalizedAccess: UserCompanyAccess[] = userForm.isAdmin
      ? state.companies.map((c) => ({
          companyId: c.id,
          roleLabel: 'Super Administrator',
          allowedModules: ALL_MODULE_IDS,
          permissions: ALL_PERMISSION_IDS,
        }))
      : userForm.companyAccess;

    const mergedModules = Array.from(new Set(normalizedAccess.flatMap((a) => a.allowedModules)));

    if (editingUserId) {
      onUpdateState((prev) => ({
        ...prev,
        users: prev.users.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                username: userForm.username.trim(),
                password: userForm.password.trim() ? userForm.password : u.password,
                employeeId: userForm.employeeId || u.employeeId,
                roleLabel: userForm.roleLabel.trim() || u.roleLabel,
                isAdmin: userForm.isAdmin,
                allowedModules: userForm.isAdmin ? ALL_MODULE_IDS : mergedModules,
                companyAccess: normalizedAccess,
              }
            : u
        ),
      }));
      resetUserForm();
      return;
    }

    if (state.users.some((u) => u.username.toLowerCase() === userForm.username.trim().toLowerCase())) {
      return;
    }

    onUpdateState((prev) => ({
      ...prev,
      users: [
        ...prev.users,
        {
          id: `usr-${Date.now()}`,
          username: userForm.username.trim(),
          password: userForm.password,
          employeeId: userForm.employeeId || prev.employees[0]?.id || '',
          roleLabel: userForm.roleLabel.trim() || 'Multi-Company Staff',
          isAdmin: userForm.isAdmin,
          allowedModules: userForm.isAdmin ? ALL_MODULE_IDS : mergedModules,
          companyAccess: normalizedAccess,
        },
      ],
    }));
    resetUserForm();
  };

  const handleDeleteUser = (userId: string) => {
    if (!canManageUsers) return;
    onUpdateState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
    }));
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
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">Master Data &amp; RBAC Administration</h1>
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
            <form onSubmit={handleAddEmployee} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
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
            <form onSubmit={handleAddProject} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
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
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatPHP(p.budget)}</td>
                    <td className="px-4 py-3"><StatusText status={p.status} /></td>
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
            <form onSubmit={handleAddSupplier} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
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
            <form onSubmit={handleAddMaterial} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
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
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatPHP(m.standardCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Multi-Company RBAC User Management */}
      {tab === 'users' && canManageUsers && (
        <div className="space-y-5">
          <form onSubmit={handleSaveUser} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
                <Users className="w-4 h-4 brand-text-accent" />
                {editingUserId ? `Edit User & Multi-Company RBAC (${userForm.username})` : 'Create Multi-Company User Account'}
              </div>
              {editingUserId && (
                <button
                  type="button"
                  onClick={resetUserForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 cursor-pointer"
                >
                  Cancel Editing
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Username</label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="e.g. elena"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {editingUserId ? 'New Password (optional)' : 'Password'}
                </label>
                <input
                  type="text"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUserId ? 'Leave blank to keep' : 'Assign password'}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                  required={!editingUserId}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Linked Employee ({activeCompany.code})</label>
                <select
                  value={userForm.employeeId}
                  onChange={(e) => setUserForm({ ...userForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {state.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.position})
                    </option>
                  ))}
                  {!state.employees.some((e) => e.id === userForm.employeeId) && userForm.employeeId && (
                    <option value={userForm.employeeId}>Linked ID: {userForm.employeeId}</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Global Role Label</label>
                <input
                  type="text"
                  value={userForm.roleLabel}
                  onChange={(e) => setUserForm({ ...userForm, roleLabel: e.target.value })}
                  placeholder="e.g. Purchasing Specialist"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mr-1">Assigned Companies:</span>
                {state.companies.map((c) => {
                  const checked = userForm.isAdmin || userForm.companyAccess.some((a) => a.companyId === c.id);
                  return (
                    <label
                      key={c.id}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border cursor-pointer ${
                        checked
                          ? 'brand-soft-outline font-semibold'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={userForm.isAdmin}
                        onChange={() => toggleUserCompany(c.id)}
                      />
                      {c.name} ({c.code})
                    </label>
                  );
                })}
              </div>

              <label className="inline-flex items-center gap-1.5 text-xs font-semibold brand-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={userForm.isAdmin}
                  onChange={(e) => setUserForm({ ...userForm, isAdmin: e.target.checked })}
                />
                Super Administrator (All Companies &amp; Permissions)
              </label>
            </div>

            {!userForm.isAdmin && userForm.companyAccess.length > 0 && (
              <div className="space-y-4">
                {userForm.companyAccess.map((access) => {
                  const comp = state.companies.find((c) => c.id === access.companyId);
                  if (!comp) return null;
                  return (
                    <div key={comp.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-950/50 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: comp.themePrimary }} />
                          <span>{comp.name} ({comp.code}) Access Matrix</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">Presets:</span>
                          {Object.entries(DEFAULT_MODULES_BY_PRESET).map(([key, preset]) => (
                            <button
                              key={key}
                              type="button"
                              onClick={() =>
                                updateCompanyAccessField(comp.id, (cur) => ({
                                  ...cur,
                                  roleLabel: preset.label,
                                  allowedModules: preset.modules,
                                  permissions: preset.perms,
                                }))
                              }
                              className="px-2 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                            Role in {comp.code}
                          </label>
                          <input
                            type="text"
                            value={access.roleLabel}
                            onChange={(e) =>
                              updateCompanyAccessField(comp.id, (cur) => ({ ...cur, roleLabel: e.target.value }))
                            }
                            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Allowed Modules</div>
                        <div className="flex flex-wrap gap-1.5">
                          {ALL_MODULES.map((m) => {
                            const active = access.allowedModules.includes(m.id);
                            return (
                              <label
                                key={m.id}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg border cursor-pointer ${
                                  active
                                    ? 'brand-soft-outline font-semibold'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={active}
                                  onChange={() =>
                                    updateCompanyAccessField(comp.id, (cur) => ({
                                      ...cur,
                                      allowedModules: active
                                        ? cur.allowedModules.filter((x) => x !== m.id)
                                        : [...cur.allowedModules, m.id],
                                    }))
                                  }
                                />
                                {m.label}
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Granular Action Permissions</div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
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
                                    updateCompanyAccessField(comp.id, (cur) => ({
                                      ...cur,
                                      permissions: has
                                        ? cur.permissions.filter((x) => x !== p.id)
                                        : [...cur.permissions, p.id],
                                    }))
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
              </div>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold brand-btn-primary rounded-lg cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" /> {editingUserId ? 'Update User & RBAC' : 'Create User Account'}
            </button>
          </form>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-xs min-w-[780px]">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Username</th>
                  <th className="px-4 py-3 text-left font-semibold">Role</th>
                  <th className="px-4 py-3 text-left font-semibold">Assigned Companies &amp; Access</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.users.map((u) => {
                  const emp = state.employees.find((e) => e.id === u.employeeId);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold brand-text-primary">{u.username}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{emp?.name || 'Cross-entity account'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 font-medium">{u.roleLabel}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 space-y-1">
                        {u.isAdmin ? (
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Super Admin — All Companies, Modules &amp; Permissions
                          </span>
                        ) : (
                          u.companyAccess.map((a) => {
                            const comp = state.companies.find((c) => c.id === a.companyId);
                            return (
                              <div key={a.companyId} className="text-[11px]">
                                <strong className="text-slate-800 dark:text-slate-200">{comp?.code || a.companyId}:</strong>{' '}
                                {a.allowedModules.length} modules · {a.permissions.length} perms ({a.roleLabel})
                              </div>
                            );
                          })
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={() => startEditUser(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium brand-soft-surface rounded-lg cursor-pointer"
                        >
                          Edit RBAC
                        </button>
                        {u.username !== 'admin' && canDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
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
                <div key={comp.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
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

          <form onSubmit={handleCreateCompany} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3">
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
              <span>{activeCompany.name} ({activeCompany.code}) Security &amp; Transaction Audit Trail</span>
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
                      <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{log.timestamp}</td>
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
    </div>
  );
};
