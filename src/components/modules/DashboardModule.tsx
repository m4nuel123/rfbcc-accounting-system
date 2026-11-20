import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  ClipboardCheck,
  Database,
  DollarSign,
  FileSpreadsheet,
  Plus,
  TrendingDown,
  Wrench,
} from 'lucide-react';
import { SQL_WAREHOUSE_SCHEMA } from '../../utils/erpConfig';
import { ERPState, ModuleId, UserAccount } from '../../types/erp';
import { formatCompactPHP, formatPHP, getGreeting } from '../../utils/formatters';
import { BudgetVsActualChart, CategoryDonutChart, MonthlyTrendChart } from '../Charts';

interface DashboardModuleProps {
  state: ERPState;
  currentUser: UserAccount;
  userName: string;
  onNavigate: (module: ModuleId) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  state,
  currentUser,
  userName,
  onNavigate,
}) => {
  const [showSqlWarehouse, setShowSqlWarehouse] = useState(false);

  const canAccess = (m: ModuleId) => currentUser.isAdmin || currentUser.allowedModules.includes(m);

  const metrics = useMemo(() => {
    const totalBudget = state.projects.reduce((s, p) => s + p.budget, 0);
    const totalPOSpend = state.purchaseOrders
      .filter((po) => po.status !== 'Cancelled')
      .reduce((s, po) => s + po.totalAmount, 0);
    const totalSavings = state.purchaseRequests
      .filter((pr) => pr.status !== 'Rejected')
      .reduce((s, pr) => s + pr.canvassSavings, 0);
    const pendingPRs = state.purchaseRequests.filter(
      (pr) =>
        pr.status === 'Pending Note' ||
        pr.status === 'For Recommending Approval' ||
        pr.status === 'For Final Approval'
    ).length;
    const unpaidVouchers = state.vouchers.filter((v) => v.status === 'Pending Approval' || v.status === 'Approved');
    const unpaidTotal = unpaidVouchers.reduce((s, v) => s + v.invoiceAmount, 0);
    const toolsBorrowed = state.tools.filter((t) => t.status === 'Borrowed').length;
    const toolsRepairOrLost = state.tools.filter((t) => t.status === 'Under Repair' || t.status === 'Lost').length;

    const projectSeries = state.projects.map((p) => {
      const actual = state.purchaseOrders
        .filter((po) => po.projectId === p.id && po.status !== 'Cancelled')
        .reduce((s, po) => s + po.totalAmount, 0);
      return {
        name: p.name,
        type: p.type,
        budget: p.budget,
        actual,
      };
    });

    const catMap = new Map<string, number>();
    for (const po of state.purchaseOrders.filter((p) => p.status !== 'Cancelled')) {
      for (const it of po.items) {
        const mat = state.materials.find((m) => m.id === it.materialId);
        const cat = mat?.category || 'Other Supplies';
        catMap.set(cat, (catMap.get(cat) || 0) + it.qty * it.unitPrice);
      }
    }
    const palette = ['#2C6FE0', '#123E82', '#0EA5E9', '#6366F1', '#10B981'];
    const categoryDonut = Array.from(catMap.entries()).map(([label, value], i) => ({
      label,
      value,
      color: palette[i % palette.length],
    }));

    const supplierSpend = state.suppliers
      .map((sup) => {
        const total = state.purchaseOrders
          .filter((po) => po.supplierId === sup.id && po.status !== 'Cancelled')
          .reduce((s, po) => s + po.totalAmount, 0);
        const count = state.purchaseOrders.filter((po) => po.supplierId === sup.id).length;
        return { ...sup, total, count };
      })
      .sort((a, b) => b.total - a.total);

    const monthTotals = new Map<string, number>();
    for (const po of state.purchaseOrders.filter((p) => p.status !== 'Cancelled')) {
      const m = po.dateIssued.slice(0, 7);
      monthTotals.set(m, (monthTotals.get(m) || 0) + po.totalAmount);
    }
    const trendData = Array.from(monthTotals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({ month, amount }));

    const utilizationPct = totalBudget > 0 ? Math.round((totalPOSpend / totalBudget) * 1000) / 10 : 0;

    return {
      totalBudget,
      totalPOSpend,
      utilizationPct,
      totalSavings,
      pendingPRs,
      unpaidTotal,
      unpaidCount: unpaidVouchers.length,
      toolsBorrowed,
      toolsRepairOrLost,
      projectSeries,
      categoryDonut,
      supplierSpend,
      trendData,
    };
  }, [state]);

  return (
    <div className="space-y-6">
      {/* Greeting Header + Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            {getGreeting()}, {userName}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            RFB Construction Executive Business Intelligence · Bukidnon Operations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowSqlWarehouse((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#123E82] bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            {showSqlWarehouse ? 'Hide DW Star Schema' : 'SQL Data Warehouse'}
          </button>

          {canAccess('requisitions') && (
            <button
              type="button"
              onClick={() => onNavigate('requisitions')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Requisition
            </button>
          )}
          {canAccess('vouchers') && (
            <button
              type="button"
              onClick={() => onNavigate('vouchers')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <DollarSign className="w-3.5 h-3.5 text-[#2C6FE0]" />
              Record Payment
            </button>
          )}
          {canAccess('reports') && (
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#2C6FE0]" />
              Generate Report
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Total Procurement Spend</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {formatCompactPHP(metrics.totalPOSpend)}
              </div>
              <div className="text-xs text-slate-500 mt-1.5 font-mono tabular-nums">
                {metrics.utilizationPct}% of {formatCompactPHP(metrics.totalBudget)} budget
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2C6FE0] flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Canvass Savings YTD</div>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1 tabular-nums">
                {formatPHP(metrics.totalSavings)}
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                Across {state.purchaseRequests.length} Purchase Requests
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Accounts Payable Unpaid</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {formatPHP(metrics.unpaidTotal)}
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {metrics.unpaidCount} pending disbursement · {metrics.pendingPRs} PRs awaiting sign-off
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-medium text-slate-500">Tools &amp; Fleet Status</div>
              <div className="text-xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
                {state.tools.length} Assets
              </div>
              <div className="text-xs text-slate-500 mt-1.5">
                {metrics.toolsBorrowed} borrowed · {metrics.toolsRepairOrLost} repair/lost alerts
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Optional SQL Data Warehouse Star Schema Explorer */}
      {showSqlWarehouse && (
        <div className="bg-white rounded-2xl border border-blue-200 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-base font-bold text-[#123E82]">
                SQL Data Warehouse — Star Schema &amp; Live Fact Aggregates
              </h2>
              <p className="text-xs text-slate-500">
                OLTP transactions automatically roll up into dimensional fact metrics for project cost &amp; supplier BI.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Facts: {state.purchaseOrders.length} POs · {state.vouchers.length} DVs · {state.journalEntries.length} JEs
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70">
              <div className="text-xs font-bold text-slate-800 mb-2">Star Schema Dimensional Model</div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <div className="font-mono font-semibold text-[#123E82]">fact_procurement</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">date_key, project_key, supplier_key, total_spend, canvass_savings</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <div className="font-mono font-semibold text-[#123E82]">fact_vouchers_gl</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">dv_no, po_no, three_way_match, payable_amt, paid_amt</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <div className="font-mono font-semibold text-slate-700">dim_project</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Bukidnon Road, Pulangi Bridge, Civic Building, Head Office</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-2.5">
                  <div className="font-mono font-semibold text-slate-700">dim_supplier &amp; dim_material</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{state.suppliers.length} suppliers · {state.materials.length} items</div>
                </div>
              </div>
            </div>

            <pre className="bg-slate-900 text-blue-100 rounded-xl p-4 text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed">
              {SQL_WAREHOUSE_SCHEMA}
            </pre>
          </div>
        </div>
      )}

      {/* Primary BI Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Budget vs Actual Spend</h2>
              <p className="text-xs text-slate-500">Bukidnon active project allocations vs PO commitments</p>
            </div>
          </div>
          <BudgetVsActualChart data={metrics.projectSeries} />
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="mb-4">
            <h2 className="font-display text-base font-bold text-slate-900">Spend by Material Category</h2>
            <p className="text-xs text-slate-500">Distribution across road, bridge, building &amp; ICT</p>
          </div>
          <CategoryDonutChart
            data={metrics.categoryDonut}
            centerLabel={formatCompactPHP(metrics.totalPOSpend)}
          />
        </div>
      </div>

      {/* Second BI Row: Monthly Trend + Top Suppliers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="mb-3">
            <h2 className="font-display text-base font-bold text-slate-900">Monthly Procurement Trend</h2>
            <p className="text-xs text-slate-500">Cumulative PO spend velocity by month</p>
          </div>
          <MonthlyTrendChart data={metrics.trendData} />
        </div>

        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900">Top Suppliers Ranking</h2>
              <p className="text-xs text-slate-500">Awarded contract volume across Bukidnon vendors</p>
            </div>
            {canAccess('reports') && (
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className="text-xs font-semibold text-[#2C6FE0] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                Full Report <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-3">
            {metrics.supplierSpend.slice(0, 5).map((sup, i) => {
              const topMax = Math.max(1, metrics.supplierSpend[0]?.total || 1);
              const pct = Math.round((sup.total / topMax) * 100);
              return (
                <div key={sup.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 truncate pr-3">
                      {i + 1}. {sup.name}
                    </span>
                    <span className="font-mono font-semibold text-slate-900 shrink-0 tabular-nums">
                      {formatPHP(sup.total)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2C6FE0] rounded-full"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
