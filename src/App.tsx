import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeftRight,
  Bell,
  BookOpen,
  Building2,
  Check,
  ChevronDown,
  ClipboardList,
  Database,
  FileBarChart2,
  FileCheck,
  FileSpreadsheet,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Moon,
  Receipt,
  Search,
  ShoppingCart,
  Sun,
  Truck,
  Wrench,
  X,
} from 'lucide-react';
import { ChangePasswordScreen } from './components/ChangePasswordScreen';
import { CompanySelectScreen } from './components/CompanySelectScreen';
import { LoginScreen } from './components/LoginScreen';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { RfbLogo } from './components/RfbLogo';
import { AccountingModule } from './components/modules/AccountingModule';
import { CanvassingModule } from './components/modules/CanvassingModule';
import { DashboardModule } from './components/modules/DashboardModule';
import { DocumentTrackerModule } from './components/modules/DocumentTrackerModule';
import { MasterDataModule } from './components/modules/MasterDataModule';
import { OrdersModule } from './components/modules/OrdersModule';
import { ProjectManagementModule } from './components/modules/ProjectManagementModule';
import { PurchasingModule } from './components/modules/PurchasingModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { RequisitionsModule } from './components/modules/RequisitionsModule';
import { ToolsModule } from './components/modules/ToolsModule';
import { VouchersModule } from './components/modules/VouchersModule';
import {
  Company,
  Employee,
  ERPState,
  LoginResponse,
  ModuleId,
  PermissionId,
  PrintDocument,
  SafeUserAccount,
  UserCompanyAccess,
} from './types/erp';
import { apiCommitState, apiLogout, apiSelectCompany } from './utils/apiClient';
import { todayISO } from './utils/formatters';

const THEME_STORAGE_KEY = 'rfb_theme';

interface NavDef {
  id: ModuleId;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavDef[] = [
  { id: 'dashboard', label: 'Dashboard (BI)', icon: LayoutDashboard },
  { id: 'projects', label: 'Project Management', icon: FolderKanban },
  { id: 'requisitions', label: 'Requisitions', icon: ClipboardList },
  { id: 'canvassing', label: 'Canvassing', icon: FileSpreadsheet },
  { id: 'purchasing', label: 'Purchasing', icon: ShoppingCart },
  { id: 'orders', label: 'Orders & Receiving', icon: Truck },
  { id: 'vouchers', label: 'Vouchers (DV)', icon: Receipt },
  { id: 'accounting', label: 'Accounting / GL', icon: BookOpen },
  { id: 'tools', label: 'Tools & Equipment', icon: Wrench },
  { id: 'docTracker', label: 'Document Tracker', icon: FileCheck },
  { id: 'reports', label: 'Reports', icon: FileBarChart2 },
  { id: 'masterData', label: 'Master Data', icon: Database },
];

const ALL_NAV_MODULE_IDS = new Set<ModuleId>(NAV_ITEMS.map((n) => n.id));

function isManagementRole(user: SafeUserAccount, access?: UserCompanyAccess | null): boolean {
  if (user.isAdmin) return true;
  const labels = `${user.position || ''} ${user.roleLabel || ''} ${access?.roleLabel || ''}`;
  return /(head|vice president|\bvp\b|administrator)/i.test(labels);
}

function readModuleFromUrl(): ModuleId | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const qMod = params.get('module') as ModuleId | null;
    if (qMod && ALL_NAV_MODULE_IDS.has(qMod)) return qMod;
    const pathSeg = window.location.pathname.replace(/^\/+|\/+$/g, '') as ModuleId;
    if (pathSeg && ALL_NAV_MODULE_IDS.has(pathSeg)) return pathSeg;
  } catch {
    // ignore URL parsing errors
  }
  return null;
}

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark') return true;
      if (savedTheme === 'light') return false;
      return document.documentElement.classList.contains('dark');
    } catch {
      return false;
    }
  });

  // Centralized Auth & Multi-Company Session State (in memory for strict security)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SafeUserAccount | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [activeAccess, setActiveAccess] = useState<UserCompanyAccess | null>(null);
  const [sessionEmployee, setSessionEmployee] = useState<Employee | null>(null);
  const [state, setState] = useState<ERPState | null>(null);

  const stateRef = useRef<ERPState | null>(null);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const [activeModule, setActiveModule] = useState<ModuleId>(() => readModuleFromUrl() || 'dashboard');
  const [urlRequestedModule, setUrlRequestedModule] = useState<ModuleId | null>(() => readModuleFromUrl());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [printDoc, setPrintDoc] = useState<PrintDocument | null>(null);
  const [globalQuery, setGlobalQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [switchingCompany, setSwitchingCompany] = useState(false);
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [syncError, setSyncError] = useState('');

  useEffect(() => {
    const onPopState = () => {
      const requested = readModuleFromUrl();
      if (requested) {
        setUrlRequestedModule(requested);
        setActiveModule(requested);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [darkMode]);

  useEffect(() => {
    const code = activeCompany?.code === 'RBI' ? 'RBI' : 'RFB';
    document.documentElement.dataset.company = code;

    const iconHref =
      activeCompany?.logoUrl ||
      (code === 'RBI' ? '/assets/aistudio/image_d9fd67be.png' : '/assets/aistudio/rfb-logo.png');

    for (const id of ['app-favicon', 'app-shortcut-icon', 'app-apple-icon']) {
      const link = document.getElementById(id) as HTMLLinkElement | null;
      if (link && link.getAttribute('href') !== iconHref) {
        link.href = iconHref;
      }
    }

    document.title = activeCompany
      ? `${activeCompany.name} (${activeCompany.code}) — Accounting, Purchasing & BI`
      : 'RFB & RBI Construction ERP — Multi-Company Accounting, Purchasing & BI';
  }, [activeCompany]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const handleLoginSuccess = (payload: LoginResponse) => {
    setAuthToken(payload.token);
    setCurrentUser(payload.user);
    setRequirePasswordChange(Boolean(payload.mustChangePassword));
    setAvailableCompanies(payload.availableCompanies);
    setSessionEmployee(payload.employee);
    setActiveCompany(null);
    setActiveAccess(null);
    setState(null);
    stateRef.current = null;
    setSyncError('');
  };

  const handleSelectCompany = useCallback(
    async (companyId: string) => {
      if (!authToken || !currentUser) return;
      setSwitchingCompany(true);
      setSyncError('');
      setShowCompanyMenu(false);
      setShowNotifs(false);
      setGlobalQuery('');
      setPrintDoc(null);

      try {
        const res = await apiSelectCompany(authToken, companyId);
        if (res.token) {
          setAuthToken(res.token);
        }
        setActiveCompany(res.activeCompany);
        setActiveAccess(res.activeAccess);
        setSessionEmployee(res.employee);
        setState(res.state);
        stateRef.current = res.state;

        // Refresh companies list from committed state if present
        if (res.state.companies?.length) {
          if (currentUser.isAdmin) {
            setAvailableCompanies(res.state.companies.filter((c) => c.isActive));
          } else {
            const assignedIds = new Set(currentUser.companyAccess.map((ca) => ca.companyId));
            setAvailableCompanies(
              res.state.companies.filter((c) => c.isActive && assignedIds.has(c.id))
            );
          }
        }

        const canDash =
          isManagementRole(currentUser, res.activeAccess) &&
          (currentUser.isAdmin ||
            (res.activeAccess.allowedModules.includes('dashboard') &&
              res.activeAccess.permissions.includes('view_dashboard')));

        const canProj =
          isManagementRole(currentUser, res.activeAccess) &&
          (currentUser.isAdmin || res.activeAccess.allowedModules.includes('projects'));

        const nextAllowed = (currentUser.isAdmin
          ? NAV_ITEMS.map((n) => n.id)
          : res.activeAccess.allowedModules
        ).filter((m) => (m !== 'dashboard' || canDash) && (m !== 'projects' || canProj));

        setActiveModule((prev) => {
          const requested = urlRequestedModule || readModuleFromUrl();
          if ((requested === 'dashboard' && !canDash) || (requested === 'projects' && !canProj)) {
            // Preserve requested module so Access Denied 403 UI blocks manual URL navigation cleanly
            return requested;
          }
          if (requested && nextAllowed.includes(requested)) return requested;
          if (nextAllowed.includes(prev)) return prev;
          if (canDash && nextAllowed.includes('dashboard')) return 'dashboard';
          return nextAllowed[0] || 'requisitions';
        });
      } finally {
        setSwitchingCompany(false);
      }
    },
    [authToken, currentUser, urlRequestedModule]
  );

  const handleExitToCompanySelector = () => {
    setActiveCompany(null);
    setActiveAccess(null);
    setState(null);
    stateRef.current = null;
    setShowCompanyMenu(false);
    setShowNotifs(false);
    setGlobalQuery('');
    setPrintDoc(null);
    setSyncError('');
  };

  const handleLogout = async () => {
    if (authToken) {
      await apiLogout(authToken);
    }
    setAuthToken(null);
    setCurrentUser(null);
    setAvailableCompanies([]);
    setActiveCompany(null);
    setActiveAccess(null);
    setSessionEmployee(null);
    setState(null);
    stateRef.current = null;
    setGlobalQuery('');
    setShowNotifs(false);
    setShowCompanyMenu(false);
    setRequirePasswordChange(false);
    setPrintDoc(null);
    setSyncError('');
  };

  const updateState = useCallback(
    (updater: (prev: ERPState) => ERPState) => {
      const prevSnapshot = stateRef.current;
      if (!prevSnapshot || !authToken) return;

      const nextSnapshot = updater(prevSnapshot);
      stateRef.current = nextSnapshot;
      setState(nextSnapshot);
      setSyncError('');

      apiCommitState(authToken, nextSnapshot)
        .then((res) => {
          stateRef.current = res.state;
          setState(res.state);

          // Keep active company branding & switcher synced if companies/RBAC were edited
          if (activeCompany && res.state.companies?.length) {
            const updatedCurrent = res.state.companies.find((c) => c.id === activeCompany.id);
            if (updatedCurrent) {
              setActiveCompany(updatedCurrent);
            }
            if (currentUser) {
              if (currentUser.isAdmin) {
                setAvailableCompanies(res.state.companies.filter((c) => c.isActive));
              } else {
                const updatedSelf = res.state.users.find((u) => u.id === currentUser.id);
                if (updatedSelf) {
                  setCurrentUser(updatedSelf);
                  const assignedIds = new Set(updatedSelf.companyAccess.map((ca) => ca.companyId));
                  setAvailableCompanies(
                    res.state.companies.filter((c) => c.isActive && assignedIds.has(c.id))
                  );
                }
              }
            }
          }
        })
        .catch((err) => {
          // Revert optimistic state on server rejection (e.g., 403 Forbidden or IDOR)
          stateRef.current = prevSnapshot;
          setState(prevSnapshot);
          setSyncError(
            err instanceof Error
              ? err.message
              : 'Server rejected this change due to company isolation or permission rules.'
          );
        });
    },
    [authToken, activeCompany, currentUser]
  );

  const can = useCallback(
    (perm: PermissionId): boolean => {
      if (!currentUser) return false;
      if (currentUser.isAdmin) return true;
      if (!activeAccess) return false;
      return activeAccess.permissions.includes(perm);
    },
    [currentUser, activeAccess]
  );

  const canAccessDashboard = useMemo(() => {
    if (!currentUser || !activeAccess) return false;
    if (!isManagementRole(currentUser, activeAccess)) return false;
    return (
      currentUser.isAdmin ||
      (activeAccess.allowedModules.includes('dashboard') &&
        activeAccess.permissions.includes('view_dashboard'))
    );
  }, [currentUser, activeAccess]);

  const canAccessProjects = useMemo(() => {
    if (!currentUser || !activeAccess) return false;
    if (!isManagementRole(currentUser, activeAccess)) return false;
    return currentUser.isAdmin || activeAccess.allowedModules.includes('projects');
  }, [currentUser, activeAccess]);

  const allowedNavItems = useMemo(() => {
    if (!currentUser || !activeAccess) return [];
    const base = currentUser.isAdmin
      ? NAV_ITEMS
      : NAV_ITEMS.filter((n) => activeAccess.allowedModules.includes(n.id));
    return base.filter(
      (n) =>
        (n.id !== 'dashboard' || canAccessDashboard) &&
        (n.id !== 'projects' || canAccessProjects)
    );
  }, [currentUser, activeAccess, canAccessDashboard, canAccessProjects]);

  const allowedModuleIds = useMemo(
    () => allowedNavItems.map((n) => n.id),
    [allowedNavItems]
  );

  // Sync module state with URL query (?module=...) while preserving unauthorized URL checks
  useEffect(() => {
    if (!activeCompany || !currentUser || !activeAccess) return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.get('module') !== activeModule) {
        url.searchParams.set('module', activeModule);
        window.history.replaceState(null, '', `${url.pathname}${url.search}`);
      }
    } catch {
      // ignore URL sync errors
    }
  }, [activeModule, activeCompany, currentUser, activeAccess]);

  const currentEmployee: Employee = useMemo(() => {
    const companyId = activeCompany?.id || 'comp-rfb';
    if (state && currentUser?.employeeId) {
      const fromCompany = state.employees.find((e) => e.id === currentUser.employeeId);
      if (fromCompany) return fromCompany;
    }
    if (sessionEmployee) return sessionEmployee;
    if (state && state.employees.length > 0) return state.employees[0];
    return {
      id: currentUser?.employeeId || currentUser?.id || 'emp-system',
      companyId,
      name: currentUser?.username || 'Authorized User',
      position: activeAccess?.roleLabel || currentUser?.roleLabel || 'Staff',
      department: 'Operations',
      email: activeCompany?.email || 'erp@construction.ph',
    };
  }, [state, currentUser, sessionEmployee, activeCompany, activeAccess]);

  // Company-isolated pending notifications scoped to user's accessible modules
  const notifications = useMemo(() => {
    if (!currentUser || !activeAccess || !state) return [];
    const canSee = (m: ModuleId) => {
      if (m === 'projects' && !canAccessProjects) return false;
      if (m === 'dashboard' && !canAccessDashboard) return false;
      return currentUser.isAdmin || activeAccess.allowedModules.includes(m);
    };
    const items: { id: string; text: string; module: ModuleId }[] = [];
    const today = todayISO();

    if (canSee('purchasing')) {
      const pendingPRs = state.purchaseRequests.filter(
        (p) =>
          p.status === 'Pending Note' ||
          p.status === 'For Recommending Approval' ||
          p.status === 'For Final Approval'
      );
      for (const pr of pendingPRs) {
        items.push({
          id: `notif-pr-${pr.id}`,
          text: `${pr.prNo} awaiting signatory (${pr.status})`,
          module: 'purchasing',
        });
      }
    }

    if (canSee('canvassing')) {
      const openCnvs = state.canvasses.filter((c) => c.status === 'Open');
      for (const c of openCnvs) {
        items.push({
          id: `notif-cnv-${c.id}`,
          text: `${c.canvassNo} open for supplier quotations`,
          module: 'canvassing',
        });
      }
    }

    if (canSee('vouchers')) {
      const unpaid = state.vouchers.filter(
        (v) => v.status === 'Pending Approval' || v.status === 'Approved'
      );
      for (const v of unpaid) {
        items.push({
          id: `notif-dv-${v.id}`,
          text: `${v.dvNo} (${v.supplierName}) · ${v.status}`,
          module: 'vouchers',
        });
      }
    }

    if (canSee('tools')) {
      const overdue = state.borrowRequests.filter(
        (b) => b.status === 'Released' && b.expectedReturnDate < today
      );
      for (const b of overdue) {
        items.push({
          id: `notif-br-${b.id}`,
          text: `Overdue tool return: ${b.trNo} (${b.toolName})`,
          module: 'tools',
        });
      }
    }

    if (canSee('projects')) {
      for (const prj of state.projects) {
        if (
          prj.status !== 'Completed' &&
          prj.status !== 'Cancelled' &&
          prj.targetCompletionDate &&
          prj.targetCompletionDate < today
        ) {
          items.push({
            id: `notif-proj-${prj.id}`,
            text: `Overdue project: ${prj.code} (${prj.name})`,
            module: 'projects',
          });
        }
      }
    }

    return items;
  }, [currentUser, activeAccess, state]);

  // Company-isolated global quick search across accessible modules
  const searchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q || !currentUser || !activeAccess || !state) return [];
    const canSee = (m: ModuleId) => {
      if (m === 'projects' && !canAccessProjects) return false;
      if (m === 'dashboard' && !canAccessDashboard) return false;
      return currentUser.isAdmin || activeAccess.allowedModules.includes(m);
    };
    const hits: { label: string; sub: string; module: ModuleId }[] = [];

    if (canSee('projects')) {
      for (const prj of state.projects) {
        if (
          prj.code.toLowerCase().includes(q) ||
          prj.name.toLowerCase().includes(q) ||
          prj.location.toLowerCase().includes(q)
        ) {
          hits.push({ label: prj.code, sub: `${prj.name} · ${prj.status}`, module: 'projects' });
        }
      }
    }
    if (canSee('requisitions')) {
      for (const r of state.requisitions) {
        if (r.reqNo.toLowerCase().includes(q) || r.purpose.toLowerCase().includes(q)) {
          hits.push({ label: r.reqNo, sub: `${r.category} · ${r.status}`, module: 'requisitions' });
        }
      }
    }
    if (canSee('purchasing')) {
      for (const p of state.purchaseRequests) {
        if (p.prNo.toLowerCase().includes(q) || p.reqNo.toLowerCase().includes(q)) {
          hits.push({
            label: p.prNo,
            sub: `Purchase Request · ${p.status}`,
            module: 'purchasing',
          });
        }
      }
    }
    if (canSee('orders')) {
      for (const o of state.purchaseOrders) {
        if (o.poNo.toLowerCase().includes(q) || o.supplierName.toLowerCase().includes(q)) {
          hits.push({ label: o.poNo, sub: `${o.supplierName} · ${o.status}`, module: 'orders' });
        }
      }
    }
    if (canSee('vouchers')) {
      for (const v of state.vouchers) {
        if (v.dvNo.toLowerCase().includes(q) || v.supplierName.toLowerCase().includes(q)) {
          hits.push({ label: v.dvNo, sub: `Voucher · ${v.status}`, module: 'vouchers' });
        }
      }
    }
    if (canSee('tools')) {
      for (const t of state.tools) {
        if (t.assetCode.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)) {
          hits.push({ label: t.assetCode, sub: `${t.name} · ${t.status}`, module: 'tools' });
        }
      }
    }
    return hits.slice(0, 7);
  }, [globalQuery, currentUser, activeAccess, state]);

  // Step 1: Login Gate
  if (!authToken || !currentUser) {
    return (
      <LoginScreen
        onLoginSuccess={handleLoginSuccess}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  // Step 1B: Forced Password Change Gate (disabled during beta test; controlled by backend response)
  if (requirePasswordChange) {
    return (
      <ChangePasswordScreen
        token={authToken}
        user={currentUser}
        forced={true}
        onSuccess={(updated) => {
          setCurrentUser(updated);
          setRequirePasswordChange(false);
        }}
        onCancelOrLogout={handleLogout}
      />
    );
  }

  // Step 2: Company Selection Gate
  if (!activeCompany || !activeAccess || !state) {
    return (
      <>
        <CompanySelectScreen
          user={currentUser}
          employee={sessionEmployee}
          availableCompanies={availableCompanies}
          onSelectCompany={handleSelectCompany}
          onOpenChangePassword={() => setShowChangePasswordModal(true)}
          onLogout={handleLogout}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
        {showChangePasswordModal && (
          <ChangePasswordScreen
            token={authToken}
            user={currentUser}
            forced={false}
            onSuccess={(updated) => {
              setCurrentUser(updated);
              setShowChangePasswordModal(false);
            }}
            onCancelOrLogout={() => setShowChangePasswordModal(false)}
          />
        )}
      </>
    );
  }

  const initials = currentEmployee.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  const canSwitchCompany = availableCompanies.length > 1;
  const activeRoleLabel = activeAccess.roleLabel || currentUser.roleLabel;
  const isModuleAllowed =
    activeModule === 'dashboard'
      ? canAccessDashboard
      : activeModule === 'projects'
        ? canAccessProjects
        : currentUser.isAdmin || activeAccess.allowedModules.includes(activeModule);

  const renderActiveModule = () => {
    if (!isModuleAllowed) {
      const fallbackModule = allowedNavItems[0]?.id;
      return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center max-w-lg mx-auto mt-10 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-300 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            {activeModule === 'dashboard'
              ? '403 — Executive Dashboard Access Restricted'
              : activeModule === 'projects'
                ? '403 — Project Management Access Restricted'
                : `Module Restricted for ${activeCompany.code}`}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {activeModule === 'dashboard'
              ? 'Only System Administrators, Department Heads, and Vice Presidents are authorized to view the Management Dashboard.'
              : activeModule === 'projects'
                ? 'Only System Administrators, Department Heads, and Vice Presidents are authorized to access Project Management.'
                : `Your assigned role (${activeRoleLabel}) inside ${activeCompany.name} does not grant access to this module.`}
          </p>
          {fallbackModule && (
            <button
              type="button"
              onClick={() => setActiveModule(fallbackModule)}
              className="px-4 py-2 text-xs font-semibold brand-btn-primary rounded-xl cursor-pointer"
            >
              Go to {allowedNavItems[0].label}
            </button>
          )}
        </div>
      );
    }

    switch (activeModule) {
      case 'dashboard':
        return (
          <DashboardModule
            authToken={authToken}
            currentUser={currentUser}
            activeCompany={activeCompany}
            activeAccess={activeAccess}
            can={can}
            allowedModules={allowedModuleIds}
            userName={currentEmployee.name.split(' ')[0]}
            onNavigate={setActiveModule}
          />
        );
      case 'projects':
        return (
          <ProjectManagementModule
            state={state}
            authToken={authToken}
            currentUser={currentUser}
            activeCompany={activeCompany}
            activeAccess={activeAccess}
            currentEmployee={currentEmployee}
            can={can}
            onSyncServerState={(nextState) => {
              stateRef.current = nextState;
              setState(nextState);
            }}
          />
        );
      case 'requisitions':
        return (
          <RequisitionsModule
            state={state}
            currentEmployee={currentEmployee}
            activeCompany={activeCompany}
            can={can}
            onUpdateState={updateState}
            onOpenPrint={setPrintDoc}
          />
        );
      case 'canvassing':
        return (
          <CanvassingModule
            state={state}
            currentEmployee={currentEmployee}
            activeCompany={activeCompany}
            can={can}
            onUpdateState={updateState}
            onOpenPrint={setPrintDoc}
          />
        );
      case 'purchasing':
        return (
          <PurchasingModule
            state={state}
            currentEmployee={currentEmployee}
            activeCompany={activeCompany}
            can={can}
            onUpdateState={updateState}
            onOpenPrint={setPrintDoc}
          />
        );
      case 'orders':
        return (
          <OrdersModule
            state={state}
            currentEmployee={currentEmployee}
            activeCompany={activeCompany}
            can={can}
            onUpdateState={updateState}
          />
        );
      case 'vouchers':
        return (
          <VouchersModule
            state={state}
            currentEmployee={currentEmployee}
            activeCompany={activeCompany}
            can={can}
            onUpdateState={updateState}
          />
        );
      case 'accounting':
        return (
          <AccountingModule
            state={state}
            currentEmployee={currentEmployee}
            activeCompany={activeCompany}
            can={can}
            onUpdateState={updateState}
          />
        );
      case 'tools':
        return (
          <ToolsModule
            state={state}
            currentEmployee={currentEmployee}
            activeCompany={activeCompany}
            can={can}
            onUpdateState={updateState}
            onOpenPrint={setPrintDoc}
          />
        );
      case 'docTracker':
        return (
          <DocumentTrackerModule
            state={state}
            activeCompany={activeCompany}
            onOpenPrint={setPrintDoc}
          />
        );
      case 'reports':
        return (
          <ReportsModule
            state={state}
            authToken={authToken}
            currentUser={currentUser}
            activeAccess={activeAccess}
            currentEmployee={currentEmployee}
            activeCompany={activeCompany}
            can={can}
            onOpenPrint={setPrintDoc}
          />
        );
      case 'masterData':
        return (
          <MasterDataModule
            state={state}
            authToken={authToken}
            currentUser={currentUser}
            activeCompany={activeCompany}
            can={can}
            onUpdateState={updateState}
            onSyncServerState={(nextState) => {
              stateRef.current = nextState;
              setState(nextState);
              const updatedSelf = nextState.users.find((u) => u.id === currentUser.id);
              if (updatedSelf) {
                setCurrentUser(updatedSelf);
                if (updatedSelf.isAdmin) {
                  setAvailableCompanies(nextState.companies.filter((c) => c.isActive));
                } else {
                  const assignedIds = new Set(updatedSelf.companyAccess.map((ca) => ca.companyId));
                  setAvailableCompanies(
                    nextState.companies.filter((c) => c.isActive && assignedIds.has(c.id))
                  );
                }
              }
            }}
          />
        );
    }
  };

  return (
    <div className="min-h-screen p-2 sm:p-4 lg:p-6 flex items-stretch justify-center">
      {/* Floating Rounded Shell */}
      <div
        className="w-full max-w-[1440px] bg-white dark:bg-slate-900 rounded-3xl shadow-xl border flex overflow-hidden min-h-[calc(100vh-3rem)] no-print"
        style={{ borderColor: 'var(--brand-shell-border)' }}
      >
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between bg-slate-50/70 dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-5">
          <div className="space-y-6">
            <div className="px-1">
              <RfbLogo company={activeCompany} size="md" showText={true} />
            </div>

            <nav className="space-y-1">
              {allowedNavItems.map((item) => {
                const Icon = item.icon;
                const active = activeModule === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'brand-soft-surface'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'brand-text-accent' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
            <div className="px-2 text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              <div className="font-semibold text-slate-600 dark:text-slate-300">
                {activeCompany.legalName}
              </div>
              <div>{activeCompany.address}</div>
            </div>

            {canSwitchCompany && (
              <button
                type="button"
                onClick={handleExitToCompanySelector}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold brand-soft-surface hover:opacity-90 rounded-xl transition-opacity cursor-pointer"
              >
                <ArrowLeftRight className="w-4 h-4 shrink-0" />
                <span>Switch Company</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Mobile Drawer Sidebar */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden flex">
            <div className="fixed inset-0 bg-slate-900/50" onClick={() => setMobileMenuOpen(false)} />
            <aside className="relative w-64 bg-white dark:bg-slate-900 h-full p-5 flex flex-col justify-between shadow-2xl z-10 border-r border-slate-200 dark:border-slate-800">
              <div className="space-y-5 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <RfbLogo company={activeCompany} size="sm" showText={true} />
                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <nav className="space-y-1">
                  {allowedNavItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveModule(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                          active
                            ? 'brand-soft-surface'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                {canSwitchCompany && (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleExitToCompanySelector();
                    }}
                    className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold brand-soft-surface rounded-xl"
                  >
                    <ArrowLeftRight className="w-4 h-4" /> Switch Company
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 rounded-xl"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Right Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-slate-950">
          {/* Clean Topbar */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 max-w-md min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Working Company-Isolated Global Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={globalQuery}
                  onChange={(e) => setGlobalQuery(e.target.value)}
                  placeholder={`Search ${activeCompany.code} REQ, PR, PO, DV, tool...`}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                />
                {searchResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-30 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                    {searchResults.map((hit, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setActiveModule(hit.module);
                          setGlobalQuery('');
                        }}
                        className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span className="font-mono font-semibold brand-text-primary">{hit.label}</span>
                        <span className="text-slate-500 dark:text-slate-400 truncate ml-3">{hit.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* Active Company Indicator & Instant Switcher (no re-login) */}
              <div className="relative">
                {canSwitchCompany ? (
                  <button
                    type="button"
                    disabled={switchingCompany}
                    onClick={() => setShowCompanyMenu((v) => !v)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-100 transition-colors cursor-pointer"
                    title="Switch active company workspace without re-login"
                  >
                    <img
                      src={activeCompany.logoUrl}
                      alt={activeCompany.code}
                      className="w-5 h-5 object-contain shrink-0"
                    />
                    <span className="font-mono font-bold brand-text-primary">{activeCompany.code}</span>
                    <span className="hidden md:inline text-slate-600 dark:text-slate-300 truncate max-w-[130px]">
                      {activeCompany.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100">
                    <img
                      src={activeCompany.logoUrl}
                      alt={activeCompany.code}
                      className="w-5 h-5 object-contain shrink-0"
                    />
                    <span className="font-mono font-bold brand-text-primary">{activeCompany.code}</span>
                    <span className="hidden md:inline text-slate-600 dark:text-slate-300">
                      {activeCompany.name}
                    </span>
                  </div>
                )}

                {showCompanyMenu && canSwitchCompany && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> Switch Company
                      </span>
                      <span>No Re-Login</span>
                    </div>
                    <div className="p-1.5 space-y-1">
                      {availableCompanies.map((comp) => {
                        const isCurrent = comp.id === activeCompany.id;
                        return (
                          <button
                            key={comp.id}
                            type="button"
                            disabled={switchingCompany || isCurrent}
                            onClick={() => handleSelectCompany(comp.id)}
                            className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                              isCurrent
                                ? 'brand-soft-surface font-semibold'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={comp.logoUrl}
                                alt={comp.name}
                                className="w-7 h-7 object-contain shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-bold truncate">{comp.name}</div>
                                <div className="text-[11px] opacity-75 truncate">{comp.legalName}</div>
                              </div>
                            </div>
                            {isCurrent && <Check className="w-4 h-4 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Self-Service Password Change */}
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(true)}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label="Change Password"
                title="Change Password"
              >
                <KeyRound className="w-4 h-4" />
              </button>

              {/* Dark / Light Theme Toggle */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Functional Notification Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifs((v) => !v)}
                  className="relative p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full brand-btn-primary text-[10px] font-mono font-bold flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                      <span>{activeCompany.code} Pending Actions</span>
                      <span className="font-mono brand-text-accent">{notifications.length}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-xs text-slate-500 dark:text-slate-400">
                          All caught up! No pending actions in {activeCompany.name}.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              setActiveModule(n.module);
                              setShowNotifs(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            {n.text}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar + Name + Company-Scoped Role */}
              <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200 dark:border-slate-800">
                <div className="w-9 h-9 rounded-full brand-btn-dark font-display font-bold text-xs flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {currentEmployee.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {activeRoleLabel}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Backend Sync / Permission Rejection Banner */}
          {syncError && (
            <div className="mx-5 sm:mx-8 mt-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-red-700 dark:text-red-300">
              <div className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{syncError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSyncError('')}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50"
                aria-label="Dismiss alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Main Module Viewport */}
          <main className="flex-1 p-5 sm:p-8 overflow-y-auto">{renderActiveModule()}</main>
        </div>
      </div>

      {/* Universal Print Preview Modal */}
      {printDoc && (
        <PrintPreviewModal
          doc={printDoc}
          state={state}
          activeCompany={activeCompany}
          onClose={() => setPrintDoc(null)}
        />
      )}

      {/* Voluntary Change Password Modal */}
      {showChangePasswordModal && (
        <ChangePasswordScreen
          token={authToken}
          user={currentUser}
          forced={false}
          onSuccess={(updated) => {
            setCurrentUser(updated);
            setShowChangePasswordModal(false);
          }}
          onCancelOrLogout={() => setShowChangePasswordModal(false)}
        />
      )}
    </div>
  );
}
