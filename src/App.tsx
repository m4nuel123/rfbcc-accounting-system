import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  ClipboardList,
  Database,
  FileBarChart2,
  FileCheck,
  FileSpreadsheet,
  LayoutDashboard,
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
import { LoginScreen } from './components/LoginScreen';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { RfbLogo } from './components/RfbLogo';
import { AccountingModule } from './components/modules/AccountingModule';
import { CanvassingModule } from './components/modules/CanvassingModule';
import { DashboardModule } from './components/modules/DashboardModule';
import { DocumentTrackerModule } from './components/modules/DocumentTrackerModule';
import { MasterDataModule } from './components/modules/MasterDataModule';
import { OrdersModule } from './components/modules/OrdersModule';
import { PurchasingModule } from './components/modules/PurchasingModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { RequisitionsModule } from './components/modules/RequisitionsModule';
import { ToolsModule } from './components/modules/ToolsModule';
import { VouchersModule } from './components/modules/VouchersModule';
import { INITIAL_ERP_STATE } from './utils/erpConfig';
import { ERPState, ModuleId, PrintDocument, UserAccount } from './types/erp';
import { todayISO } from './utils/formatters';

const STORAGE_KEY = 'rfb_construction_erp_v1';
const THEME_STORAGE_KEY = 'rfb_theme';

interface NavDef {
  id: ModuleId;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const NAV_ITEMS: NavDef[] = [
  { id: 'dashboard', label: 'Dashboard (BI)', icon: LayoutDashboard },
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

export default function App() {
  const [state, setState] = useState<ERPState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved) as ERPState;
    } catch {
      // ignore storage errors
    }
    return INITIAL_ERP_STATE;
  });

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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, darkMode ? 'dark' : 'light');
    } catch {
      // ignore storage errors
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Auth session intentionally lives only in memory (resets on reload for security)
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [printDoc, setPrintDoc] = useState<PrintDocument | null>(null);

  // Topbar search & notifications
  const [globalQuery, setGlobalQuery] = useState('');
  const [showNotifs, setShowNotifs] = useState(false);

  const updateState = (updater: (prev: ERPState) => ERPState) => {
    setState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota issues
      }
      return next;
    });
  };

  const allowedNavItems = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.isAdmin) return NAV_ITEMS;
    return NAV_ITEMS.filter((n) => currentUser.allowedModules.includes(n.id));
  }, [currentUser]);

  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    const firstModule = user.isAdmin
      ? 'dashboard'
      : user.allowedModules[0] || 'requisitions';
    setActiveModule(firstModule);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setGlobalQuery('');
    setShowNotifs(false);
  };

  const currentEmployee = useMemo(() => {
    if (!currentUser) return state.employees[0];
    return (
      state.employees.find((e) => e.id === currentUser.employeeId) ||
      state.employees[0]
    );
  }, [currentUser, state.employees]);

  // Real pending notifications scoped to user's accessible modules
  const notifications = useMemo(() => {
    if (!currentUser) return [];
    const canSee = (m: ModuleId) => currentUser.isAdmin || currentUser.allowedModules.includes(m);
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
      const unpaid = state.vouchers.filter((v) => v.status === 'Pending Approval' || v.status === 'Approved');
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

    return items;
  }, [currentUser, state]);

  // Global quick search results across accessible modules
  const searchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q || !currentUser) return [];
    const canSee = (m: ModuleId) => currentUser.isAdmin || currentUser.allowedModules.includes(m);
    const hits: { label: string; sub: string; module: ModuleId }[] = [];

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
          hits.push({ label: p.prNo, sub: `Purchase Request · ${p.status}`, module: 'purchasing' });
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
  }, [globalQuery, currentUser, state]);

  if (!currentUser) {
    return (
      <LoginScreen
        users={state.users}
        employees={state.employees}
        onLogin={handleLogin}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
    );
  }

  const initials = currentEmployee.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <DashboardModule
            state={state}
            currentUser={currentUser}
            userName={currentEmployee.name.split(' ')[0]}
            onNavigate={setActiveModule}
          />
        );
      case 'requisitions':
        return (
          <RequisitionsModule
            state={state}
            currentEmployee={currentEmployee}
            onUpdateState={updateState}
            onOpenPrint={setPrintDoc}
          />
        );
      case 'canvassing':
        return (
          <CanvassingModule
            state={state}
            currentEmployee={currentEmployee}
            onUpdateState={updateState}
            onOpenPrint={setPrintDoc}
          />
        );
      case 'purchasing':
        return (
          <PurchasingModule
            state={state}
            currentEmployee={currentEmployee}
            onUpdateState={updateState}
            onOpenPrint={setPrintDoc}
          />
        );
      case 'orders':
        return (
          <OrdersModule
            state={state}
            currentEmployee={currentEmployee}
            onUpdateState={updateState}
          />
        );
      case 'vouchers':
        return (
          <VouchersModule
            state={state}
            currentEmployee={currentEmployee}
            onUpdateState={updateState}
          />
        );
      case 'accounting':
        return (
          <AccountingModule
            state={state}
            currentEmployee={currentEmployee}
            onUpdateState={updateState}
          />
        );
      case 'tools':
        return (
          <ToolsModule
            state={state}
            currentEmployee={currentEmployee}
            onUpdateState={updateState}
            onOpenPrint={setPrintDoc}
          />
        );
      case 'docTracker':
        return (
          <DocumentTrackerModule
            state={state}
            onOpenPrint={setPrintDoc}
          />
        );
      case 'reports':
        return (
          <ReportsModule
            state={state}
            currentEmployee={currentEmployee}
            onOpenPrint={setPrintDoc}
          />
        );
      case 'masterData':
        return (
          <MasterDataModule
            state={state}
            currentUser={currentUser}
            onUpdateState={updateState}
          />
        );
    }
  };

  return (
    <div className="min-h-screen p-2 sm:p-4 lg:p-6 flex items-stretch justify-center">
      {/* Floating Rounded Shell */}
      <div className="w-full max-w-[1440px] bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-blue-100/80 dark:border-slate-800 flex overflow-hidden min-h-[calc(100vh-3rem)] no-print">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col justify-between bg-slate-50/70 dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-5">
          <div className="space-y-6">
            <div className="px-1">
              <RfbLogo size="md" showText={true} />
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
                        ? 'bg-blue-50 text-[#123E82] dark:bg-blue-950/60 dark:text-blue-300'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        active ? 'text-[#2C6FE0] dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="px-2 text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              RFB Construction Corp.
              <br />
              P-1 A Brgy. Doongan, Butuan City, Agusan Del Norte
            </div>
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
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <RfbLogo size="sm" showText={true} />
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
                            ? 'bg-blue-50 text-[#123E82] dark:bg-blue-950/60 dark:text-blue-300'
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
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 rounded-xl"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </aside>
          </div>
        )}

        {/* Right Main Content Column */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC] dark:bg-slate-950">
          {/* Clean Topbar */}
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Working Global Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={globalQuery}
                  onChange={(e) => setGlobalQuery(e.target.value)}
                  placeholder="Jump to REQ, PR, PO, DV, supplier, or tool..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-[#2C6FE0]/25 focus:border-[#2C6FE0]"
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
                        className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/60 dark:hover:bg-slate-800/80 flex items-center justify-between text-xs cursor-pointer"
                      >
                        <span className="font-mono font-semibold text-[#123E82] dark:text-blue-300">{hit.label}</span>
                        <span className="text-slate-500 dark:text-slate-400 truncate ml-3">{hit.sub}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {/* Dark / Light Theme Toggle */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-[#123E82] dark:hover:text-white transition-colors cursor-pointer"
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
                  className="relative p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-[#123E82] dark:hover:text-white transition-colors cursor-pointer"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#2C6FE0] text-white text-[10px] font-mono font-bold flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl z-30 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                      <span>Pending Action Items</span>
                      <span className="font-mono text-[#2C6FE0] dark:text-blue-400">{notifications.length}</span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-xs text-slate-500 dark:text-slate-400">
                          All caught up! No pending actions.
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
                            className="w-full text-left px-4 py-2.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-blue-50/60 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          >
                            {n.text}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Avatar + Name + Role */}
              <div className="flex items-center gap-2.5 pl-2.5 border-l border-slate-200 dark:border-slate-800">
                <div className="w-9 h-9 rounded-full bg-[#123E82] text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block leading-tight">
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {currentEmployee.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {currentUser.roleLabel}
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main Module Viewport */}
          <main className="flex-1 p-5 sm:p-8 overflow-y-auto">{renderActiveModule()}</main>
        </div>
      </div>

      {/* Universal Print Preview Modal (Official PR Form, Borrower Slip, Document Tracking Slip, Reports) */}
      {printDoc && (
        <PrintPreviewModal
          doc={printDoc}
          state={state}
          onClose={() => setPrintDoc(null)}
        />
      )}
    </div>
  );
}
