import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileBarChart2,
  FolderKanban,
  Lock,
  PauseCircle,
} from 'lucide-react';
import {
  Company,
  DashboardProjectMetrics,
  DashboardSummaryResponse,
  ModuleId,
  PermissionId,
  ProjectStatus,
  SafeUserAccount,
  UserCompanyAccess,
} from '../../types/erp';
import { apiFetchDashboardSummary } from '../../utils/apiClient';
import { formatCompactPHP, formatPHP, getGreeting } from '../../utils/formatters';
import { BudgetVsActualChart } from '../Charts';
import { StatusText } from '../StatusText';

interface DashboardModuleProps {
  authToken: string;
  currentUser: SafeUserAccount;
  activeCompany: Company;
  activeAccess: UserCompanyAccess;
  can: (perm: PermissionId) => boolean;
  allowedModules: ModuleId[];
  userName: string;
  onNavigate: (module: ModuleId) => void;
}

const STATUS_BAR_COLORS: Record<ProjectStatus, string> = {
  Planning: '#64748B',
  'Not Yet Started': '#94A3B8',
  Ongoing: '#2563EB',
  'On Hold': '#D97706',
  Completed: '#059669',
  Cancelled: '#DC2626',
};

function isManagementUser(user: SafeUserAccount, access: UserCompanyAccess): boolean {
  if (user.isAdmin) return true;
  const labels = `${user.position || ''} ${user.roleLabel || ''} ${access.roleLabel || ''}`;
  return /(head|vice president|\bvp\b|administrator)/i.test(labels);
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  authToken,
  currentUser,
  activeCompany,
  activeAccess,
  can,
  allowedModules,
  userName,
  onNavigate,
}) => {
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deniedError, setDeniedError] = useState('');
  const [viewMode, setViewMode] = useState<'consolidated' | 'active'>('consolidated');

  const isMgmt = useMemo(
    () => isManagementUser(currentUser, activeAccess),
    [currentUser, activeAccess]
  );
  const canViewDashboard = isMgmt && (currentUser.isAdmin || can('view_dashboard'));
  const canAccess = (m: ModuleId) => currentUser.isAdmin || allowedModules.includes(m);

  useEffect(() => {
    let cancelled = false;
    if (!canViewDashboard) {
      setLoading(false);
      setDeniedError('Dashboard access is restricted to System Administrators, Department Heads, and Vice Presidents.');
      return;
    }

    setLoading(true);
    setDeniedError('');
    apiFetchDashboardSummary(authToken)
      .then((res) => {
        if (!cancelled) {
          setSummary(res);
          if (!res.isConsolidatedAvailable) {
            setViewMode('active');
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setDeniedError(err instanceof Error ? err.message : 'Unable to load dashboard summary.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authToken, activeCompany.id, canViewDashboard]);

  if (!canViewDashboard || deniedError) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 max-w-xl mx-auto text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl brand-soft-surface flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
          Executive Dashboard Restricted
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {deniedError ||
            `Your role in ${activeCompany.name} does not grant Executive Dashboard access. Use your assigned sidebar modules below.`}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {allowedModules
            .filter((m) => m !== 'dashboard')
            .map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onNavigate(m)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl brand-btn-primary cursor-pointer capitalize"
              >
                Open {m}
              </button>
            ))}
        </div>
      </div>
    );
  }

  const activeMetrics: DashboardProjectMetrics | null = summary
    ? viewMode === 'consolidated' && summary.isConsolidatedAvailable
      ? summary.consolidatedSummary
      : summary.activeSummary
    : null;

  return (
    <div className="space-y-6">
      {/* Executive Header + Scope Switch + Management Actions Only */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {viewMode === 'consolidated' && summary?.isConsolidatedAvailable
              ? 'Consolidated RFB & RBI Executive Project Portfolio & Budget Monitoring'
              : `${activeCompany.name} (${activeCompany.code}) Executive Project Portfolio & Management Overview`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {summary?.isConsolidatedAvailable && (
            <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('consolidated')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'consolidated'
                    ? 'bg-white dark:bg-slate-900 brand-text-primary shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                RFB + RBI Consolidated
              </button>
              <button
                type="button"
                onClick={() => setViewMode('active')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'active'
                    ? 'bg-white dark:bg-slate-900 brand-text-primary shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {activeCompany.code} Only
              </button>
            </div>
          )}

          {canAccess('projects') && (
            <button
              type="button"
              onClick={() => onNavigate('projects')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold brand-btn-primary rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FolderKanban className="w-3.5 h-3.5" />
              Project Management
            </button>
          )}

          {canAccess('reports') && can('generate_reports') && (
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileBarChart2 className="w-3.5 h-3.5 brand-text-accent" />
              Management Reports
            </button>
          )}
        </div>
      </div>

      {loading || !activeMetrics ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center text-xs text-slate-500 dark:text-slate-400">
          Loading executive project intelligence...
        </div>
      ) : (
        <>
          {/* 6 Project Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3.5">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Total Projects</span>
                <FolderKanban className="w-4 h-4 brand-text-accent" />
              </div>
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">
                {activeMetrics.totalProjects}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                {formatCompactPHP(activeMetrics.totalBudget)} budget
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Ongoing Projects</span>
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="font-display text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1.5 tabular-nums">
                {activeMetrics.ongoingProjects}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 tabular-nums">
                Avg {activeMetrics.avgProgress}% completion
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Completed Projects</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="font-display text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1.5 tabular-nums">
                {activeMetrics.completedProjects}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Delivered &amp; closed
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Not Yet Started</span>
                <Calendar className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1.5 tabular-nums">
                {activeMetrics.notYetStartedProjects}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                +{activeMetrics.planningProjects} in Planning
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>On Hold Projects</span>
                <PauseCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="font-display text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1.5 tabular-nums">
                {activeMetrics.onHoldProjects}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Paused / awaiting clearance
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Delayed / Overdue</span>
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              </div>
              <div className="font-display text-2xl font-bold text-red-700 dark:text-red-400 mt-1.5 tabular-nums">
                {activeMetrics.delayedProjects}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Target completion passed
              </div>
            </div>
          </div>

          {/* Project Performance Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    Project Budget vs Committed Cost
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Approved project allocations compared against committed project expenditures ({formatCompactPHP(activeMetrics.totalActualSpend)} / {formatCompactPHP(activeMetrics.totalBudget)})
                  </p>
                </div>
              </div>
              <BudgetVsActualChart
                data={activeMetrics.projectBudgetSeries.slice(0, 8).map((p) => ({
                  name: p.companyCode ? `${p.code}` : p.name,
                  type: `${p.progress}% · ${p.status}`,
                  budget: p.budget,
                  actual: p.actual,
                }))}
                accentColor={activeCompany.themeAccent}
              />
            </div>

            <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                    Project Status Distribution
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Portfolio breakdown across all project lifecycle stages
                  </p>
                </div>
                <span className="font-mono text-xs font-bold brand-text-primary tabular-nums">
                  {activeMetrics.avgProgress}% Avg
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {activeMetrics.statusBreakdown.map((item) => {
                  const pct =
                    activeMetrics.totalProjects > 0
                      ? Math.round((item.count / activeMetrics.totalProjects) * 100)
                      : 0;
                  return (
                    <div key={item.status} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{item.status}</span>
                        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {item.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${item.count > 0 ? Math.max(6, pct) : 0}%`,
                            backgroundColor: STATUS_BAR_COLORS[item.status],
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Multi-Company Consolidated Comparison (Visible when assigned RFB + RBI) */}
          {summary && summary.companyComparisons.length > 1 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Building2 className="w-4 h-4 brand-text-accent" />
                    Multi-Company Project Portfolio Comparison (RFB &amp; RBI)
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Consolidated project counts, progress velocity, overdue alerts, and budget commitment across your assigned companies.
                  </p>
                </div>
                {canAccess('projects') && (
                  <button
                    type="button"
                    onClick={() => onNavigate('projects')}
                    className="text-xs font-semibold brand-text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    Manage All Projects <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Company</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Ongoing</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Completed</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Overdue</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Avg Progress</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Approved Budget</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Committed Spend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {summary.companyComparisons.map((c) => (
                      <tr key={c.companyId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                          <span className="font-mono font-bold brand-text-primary mr-2">{c.companyCode}</span>
                          {c.companyName}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">{c.totalProjects}</td>
                        <td className="px-4 py-3 text-right font-mono text-blue-700 dark:text-blue-400 font-semibold tabular-nums">
                          {c.ongoingProjects}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-700 dark:text-emerald-400 font-semibold tabular-nums">
                          {c.completedProjects}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-red-700 dark:text-red-400 font-semibold tabular-nums">
                          {c.delayedProjects}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">{c.avgProgress}%</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">{formatPHP(c.totalBudget)}</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">{formatPHP(c.actualSpend)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Delayed / Overdue Projects Watchlist */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  Schedule Monitoring &amp; Delayed / Overdue Projects
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Projects past target completion date while still incomplete (stored status remains preserved for audit accuracy).
                </p>
              </div>
              {canAccess('projects') && (
                <button
                  type="button"
                  onClick={() => onNavigate('projects')}
                  className="text-xs font-semibold brand-text-accent hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Open Project Registry <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeMetrics.overdueProjects.length === 0 ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-xs text-emerald-800 dark:text-emerald-200">
                All active projects are currently within their target completion schedules.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Code</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Project</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Company</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Project Manager</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Target Date</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Status</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Progress</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Schedule Variance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeMetrics.overdueProjects.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold brand-text-primary">{p.code}</td>
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">{p.name}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{p.companyCode}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{p.manager}</td>
                        <td className="px-4 py-3 font-mono text-red-700 dark:text-red-400 font-semibold">{p.targetCompletionDate}</td>
                        <td className="px-4 py-3">
                          <StatusText status={p.status} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">{p.progress}%</td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-red-700 dark:text-red-400 tabular-nums">
                          {p.daysOverdue}d overdue
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
