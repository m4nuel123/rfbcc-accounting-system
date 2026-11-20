import React, { useMemo, useState } from 'react';
import { Download, FileBarChart2, Printer } from 'lucide-react';
import { Employee, ERPState, PrintDocument } from '../../types/erp';
import {
  downloadCSV,
  formatPHP,
  getPeriodRange,
  isWithinRange,
  PeriodPreset,
} from '../../utils/formatters';

interface ReportsModuleProps {
  state: ERPState;
  currentEmployee: Employee;
  onOpenPrint: (doc: PrintDocument) => void;
}

type ReportCategory = 'Accounting' | 'Canvassing' | 'Purchasing' | 'Vouchers' | 'Tools & Equipment';

const REPORT_CATALOG: Record<ReportCategory, string[]> = {
  Accounting: [
    'Income Statement',
    'Balance Sheet',
    'Cash Flow Statement',
    'General Ledger',
    'Trial Balance',
    'Budget vs Actual',
    'Expense Analysis',
    'Revenue Analysis',
    'Accounts Payable Report',
    'Accounts Receivable Report',
  ],
  Canvassing: [
    'Canvass Request Report',
    'Supplier Quotation Report',
    'Supplier Comparison Report',
    'Winning Supplier Report',
    'Supplier Performance Report',
    'Pending Canvass Requests',
    'Approved Canvass Requests',
  ],
  Purchasing: [
    'Purchase Request (PR) Report',
    'Purchase Order (PO) Report',
    'Supplier Purchase History',
    'Procurement Summary',
    'Pending Purchase Orders',
    'Delivered Purchase Orders',
    'Cancelled Purchase Orders',
    'Top Suppliers',
    'Top Purchased Items',
  ],
  Vouchers: [
    'Voucher Register',
    'Paid Voucher Report',
    'Unpaid Voucher Report',
    'Cancelled Voucher Report',
    'Due Voucher Report',
    'Voucher by Department',
    'Voucher by Supplier',
    'Voucher Payment History',
  ],
  'Tools & Equipment': [
    'Inventory Summary',
    'Borrowed / Released Tools',
    'Overdue Returns',
    'Damage Report',
    'Repair History',
    'Disposal Report',
    'Employee Tool History',
  ],
};

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  state,
  currentEmployee,
  onOpenPrint,
}) => {
  const [moduleCat, setModuleCat] = useState<ReportCategory>('Purchasing');
  const [reportName, setReportName] = useState<string>(REPORT_CATALOG.Purchasing[0]);
  const [period, setPeriod] = useState<PeriodPreset>('Yearly');
  const [customStart, setCustomStart] = useState('2026-01-01');
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10));
  const [projectFilter, setProjectFilter] = useState('All');
  const [supplierFilter, setSupplierFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const handleCategoryChange = (cat: ReportCategory) => {
    setModuleCat(cat);
    setReportName(REPORT_CATALOG[cat][0]);
  };

  const generated = useMemo(() => {
    const { start, end, label: periodLabel } = getPeriodRange(period, customStart, customEnd);
    const projName = (pid?: string) => state.projects.find((p) => p.id === pid)?.name || 'General';

    let columns: string[] = [];
    let rows: (string | number)[][] = [];
    let summaryCards: { label: string; value: string }[] = [];

    if (moduleCat === 'Accounting') {
      const jeInPeriod = state.journalEntries.filter(
        (j) =>
          isWithinRange(j.date, start, end) &&
          (projectFilter === 'All' || j.projectId === projectFilter)
      );

      if (reportName === 'General Ledger') {
        columns = ['JE No.', 'Date', 'Ref', 'Account', 'Description', 'Debit', 'Credit'];
        for (const je of jeInPeriod) {
          for (const l of je.lines) {
            rows.push([
              je.jeNo,
              je.date,
              je.reference,
              `${l.accountCode} ${l.accountName}`,
              je.description,
              l.debit > 0 ? formatPHP(l.debit) : '—',
              l.credit > 0 ? formatPHP(l.credit) : '—',
            ]);
          }
        }
        const totDr = jeInPeriod.reduce((s, j) => s + j.lines.reduce((x, l) => x + l.debit, 0), 0);
        summaryCards = [
          { label: 'Journal Entries', value: String(jeInPeriod.length) },
          { label: 'Total Debits', value: formatPHP(totDr) },
        ];
      } else if (reportName === 'Budget vs Actual') {
        columns = ['Project Code', 'Project Name', 'Type', 'Approved Budget', 'Actual Spend', 'Remaining', 'Utilization'];
        const projs = state.projects.filter((p) => projectFilter === 'All' || p.id === projectFilter);
        rows = projs.map((p) => {
          const actual = state.purchaseOrders
            .filter((po) => po.projectId === p.id && po.status !== 'Cancelled' && isWithinRange(po.dateIssued, start, end))
            .reduce((s, po) => s + po.totalAmount, 0);
          const pct = p.budget > 0 ? ((actual / p.budget) * 100).toFixed(1) : '0.0';
          return [p.code, p.name, p.type, formatPHP(p.budget), formatPHP(actual), formatPHP(p.budget - actual), `${pct}%`];
        });
        summaryCards = [
          { label: 'Total Budget', value: formatPHP(projs.reduce((s, p) => s + p.budget, 0)) },
        ];
      } else if (reportName === 'Accounts Payable Report') {
        const unpaid = state.vouchers.filter(
          (v) =>
            (v.status === 'Pending Approval' || v.status === 'Approved') &&
            isWithinRange(v.dateCreated, start, end) &&
            (supplierFilter === 'All' || v.supplierId === supplierFilter)
        );
        columns = ['DV No.', 'Supplier', 'Invoice', 'Due Date', 'Status', 'Payable Amount'];
        rows = unpaid.map((v) => [v.dvNo, v.supplierName, v.invoiceNo, v.dueDate, v.status, formatPHP(v.invoiceAmount)]);
        summaryCards = [
          { label: 'Unpaid Vouchers', value: String(unpaid.length) },
          { label: 'Total Payable', value: formatPHP(unpaid.reduce((s, v) => s + v.invoiceAmount, 0)) },
        ];
      } else if (reportName === 'Income Statement' || reportName === 'Revenue Analysis' || reportName === 'Expense Analysis') {
        const rev = jeInPeriod.reduce(
          (s, j) => s + j.lines.filter((l) => l.accountCode.startsWith('4')).reduce((x, l) => x + l.credit - l.debit, 0),
          0
        );
        const exp = jeInPeriod.reduce(
          (s, j) => s + j.lines.filter((l) => l.accountCode.startsWith('5')).reduce((x, l) => x + l.debit - l.credit, 0),
          0
        );
        columns = ['Account Code', 'Account Name', 'Category', 'Net Amount'];
        rows = state.accounts
          .filter((a) => a.type === 'Revenue' || a.type === 'Expense')
          .map((a) => {
            const net = jeInPeriod.reduce(
              (s, j) =>
                s +
                j.lines
                  .filter((l) => l.accountCode === a.code)
                  .reduce((x, l) => x + (a.type === 'Revenue' ? l.credit - l.debit : l.debit - l.credit), 0),
              0
            );
            return [a.code, a.name, a.type, formatPHP(net)];
          });
        summaryCards = [
          { label: 'Total Revenue', value: formatPHP(rev) },
          { label: 'Total Expenses', value: formatPHP(exp) },
          { label: 'Net Income', value: formatPHP(rev - exp) },
        ];
      } else {
        // Trial Balance / Balance Sheet / Cash Flow / AR fallback
        columns = ['Code', 'Account Title', 'Type', 'Debit', 'Credit'];
        rows = state.accounts.map((a) => {
          const dr = jeInPeriod.reduce((s, j) => s + j.lines.filter((l) => l.accountCode === a.code).reduce((x, l) => x + l.debit, 0), 0);
          const cr = jeInPeriod.reduce((s, j) => s + j.lines.filter((l) => l.accountCode === a.code).reduce((x, l) => x + l.credit, 0), 0);
          return [a.code, a.name, a.type, formatPHP(dr), formatPHP(cr)];
        });
        summaryCards = [{ label: 'Accounts Listed', value: String(rows.length) }];
      }
    } else if (moduleCat === 'Canvassing') {
      const cnvs = state.canvasses.filter(
        (c) =>
          isWithinRange(c.dateOpened, start, end) &&
          (projectFilter === 'All' || c.projectId === projectFilter) &&
          (statusFilter === 'All' || c.status === statusFilter)
      );
      if (reportName === 'Supplier Quotation Report' || reportName === 'Supplier Comparison Report') {
        columns = ['Canvass No.', 'Item', 'Supplier', 'Unit Price', 'Lead Time', 'Awarded'];
        for (const c of cnvs) {
          for (const q of c.quotes) {
            if (supplierFilter !== 'All' && q.supplierId !== supplierFilter) continue;
            const mat = state.materials.find((m) => m.id === q.materialId);
            rows.push([
              c.canvassNo,
              mat?.name || q.materialId,
              q.supplierName,
              formatPHP(q.unitPrice),
              `${q.leadTimeDays} days`,
              q.isWinner ? 'YES' : 'No',
            ]);
          }
        }
      } else if (reportName === 'Winning Supplier Report' || reportName === 'Supplier Performance Report') {
        columns = ['Supplier', 'Quotes Submitted', 'Quotes Won', 'Win Rate'];
        rows = state.suppliers
          .filter((s) => supplierFilter === 'All' || s.id === supplierFilter)
          .map((s) => {
            const allQ = cnvs.flatMap((c) => c.quotes).filter((q) => q.supplierId === s.id);
            const won = allQ.filter((q) => q.isWinner).length;
            const rate = allQ.length > 0 ? `${Math.round((won / allQ.length) * 100)}%` : '0%';
            return [s.name, allQ.length, won, rate];
          });
      } else {
        const filtered =
          reportName === 'Pending Canvass Requests'
            ? cnvs.filter((c) => c.status === 'Open')
            : reportName === 'Approved Canvass Requests'
            ? cnvs.filter((c) => c.status !== 'Open')
            : cnvs;
        columns = ['Canvass No.', 'Req Ref', 'Project', 'Category', 'Date Opened', 'Quotes', 'Status'];
        rows = filtered.map((c) => [c.canvassNo, c.reqNo, projName(c.projectId), c.category, c.dateOpened, c.quotes.length, c.status]);
      }
      summaryCards = [{ label: 'Records Matched', value: String(rows.length) }];
    } else if (moduleCat === 'Purchasing') {
      if (reportName === 'Purchase Request (PR) Report') {
        const prs = state.purchaseRequests.filter(
          (p) =>
            isWithinRange(p.dateCreated, start, end) &&
            (projectFilter === 'All' || p.projectId === projectFilter) &&
            (statusFilter === 'All' || p.status === statusFilter)
        );
        columns = ['PR No.', 'Project', 'Prepared By', 'Approved By', 'Savings', 'Total Amount', 'Status'];
        rows = prs.map((p) => [
          p.prNo,
          projName(p.projectId),
          p.preparedBy.name,
          p.approvedBy?.name || 'Pending',
          formatPHP(p.canvassSavings),
          formatPHP(p.totalAmount),
          p.status,
        ]);
        summaryCards = [
          { label: 'Total PRs', value: String(prs.length) },
          { label: 'Total PR Value', value: formatPHP(prs.reduce((s, p) => s + p.totalAmount, 0)) },
          { label: 'Canvass Savings', value: formatPHP(prs.reduce((s, p) => s + p.canvassSavings, 0)) },
        ];
      } else if (reportName === 'Top Suppliers') {
        columns = ['Rank', 'Supplier', 'PO Count', 'Total Awarded Spend'];
        const ranked = state.suppliers
          .map((s) => {
            const pos = state.purchaseOrders.filter(
              (po) => po.supplierId === s.id && po.status !== 'Cancelled' && isWithinRange(po.dateIssued, start, end)
            );
            return { name: s.name, count: pos.length, total: pos.reduce((sum, p) => sum + p.totalAmount, 0) };
          })
          .sort((a, b) => b.total - a.total);
        rows = ranked.map((r, i) => [i + 1, r.name, r.count, formatPHP(r.total)]);
        summaryCards = [{ label: 'Active Suppliers', value: String(ranked.filter((r) => r.count > 0).length) }];
      } else if (reportName === 'Top Purchased Items') {
        columns = ['Item', 'Unit', 'Total Qty Ordered', 'Total Spend'];
        const itemMap = new Map<string, { name: string; unit: string; qty: number; total: number }>();
        for (const po of state.purchaseOrders.filter((p) => p.status !== 'Cancelled' && isWithinRange(p.dateIssued, start, end))) {
          for (const it of po.items) {
            const cur = itemMap.get(it.materialId) || { name: it.materialName, unit: it.unit, qty: 0, total: 0 };
            cur.qty += it.qty;
            cur.total += it.qty * it.unitPrice;
            itemMap.set(it.materialId, cur);
          }
        }
        const sorted = Array.from(itemMap.values()).sort((a, b) => b.total - a.total);
        rows = sorted.map((it) => [it.name, it.unit, it.qty, formatPHP(it.total)]);
        summaryCards = [{ label: 'Unique Items', value: String(sorted.length) }];
      } else {
        const pos = state.purchaseOrders.filter((po) => {
          if (!isWithinRange(po.dateIssued, start, end)) return false;
          if (projectFilter !== 'All' && po.projectId !== projectFilter) return false;
          if (supplierFilter !== 'All' && po.supplierId !== supplierFilter) return false;
          if (reportName === 'Pending Purchase Orders') return po.status === 'Issued';
          if (reportName === 'Delivered Purchase Orders') return po.status === 'Delivered';
          if (reportName === 'Cancelled Purchase Orders') return po.status === 'Cancelled';
          return statusFilter === 'All' || po.status === statusFilter;
        });
        columns = ['PO No.', 'PR Ref', 'Project', 'Supplier', 'Date Issued', 'Total Amount', 'Status'];
        rows = pos.map((po) => [po.poNo, po.prNo, projName(po.projectId), po.supplierName, po.dateIssued, formatPHP(po.totalAmount), po.status]);
        summaryCards = [
          { label: 'Purchase Orders', value: String(pos.length) },
          { label: 'Total PO Spend', value: formatPHP(pos.reduce((s, p) => s + p.totalAmount, 0)) },
        ];
      }
    } else if (moduleCat === 'Vouchers') {
      const dvs = state.vouchers.filter((v) => {
        if (!isWithinRange(v.dateCreated, start, end)) return false;
        if (projectFilter !== 'All' && v.projectId !== projectFilter) return false;
        if (supplierFilter !== 'All' && v.supplierId !== supplierFilter) return false;
        if (reportName === 'Paid Voucher Report' || reportName === 'Voucher Payment History') return v.status === 'Paid';
        if (reportName === 'Unpaid Voucher Report') return v.status === 'Pending Approval' || v.status === 'Approved';
        if (reportName === 'Cancelled Voucher Report') return v.status === 'Cancelled';
        if (reportName === 'Due Voucher Report') return (v.status === 'Pending Approval' || v.status === 'Approved') && v.dueDate <= new Date().toISOString().slice(0, 10);
        return statusFilter === 'All' || v.status === statusFilter;
      });
      columns = ['DV No.', 'PO / Invoice', 'Supplier', 'Dept', 'Date', 'Due Date', 'Amount', 'Status'];
      rows = dvs.map((v) => [v.dvNo, `${v.poNo} / ${v.invoiceNo}`, v.supplierName, v.department, v.dateCreated, v.dueDate, formatPHP(v.invoiceAmount), v.status]);
      summaryCards = [
        { label: 'Vouchers Count', value: String(dvs.length) },
        { label: 'Total Amount', value: formatPHP(dvs.reduce((s, v) => s + v.invoiceAmount, 0)) },
      ];
    } else {
      // Tools & Equipment
      if (reportName === 'Inventory Summary') {
        columns = ['Asset ID', 'Tool / Equipment', 'Category', 'Project Site', 'Cost', 'Status'];
        rows = state.tools
          .filter((t) => projectFilter === 'All' || t.projectId === projectFilter)
          .map((t) => [t.assetCode, t.name, t.category, projName(t.projectId), formatPHP(t.purchaseCost), t.status]);
        summaryCards = [{ label: 'Total Assets', value: String(rows.length) }];
      } else if (reportName === 'Repair History') {
        columns = ['Asset ID', 'Tool', 'Date Sent', 'Technician', 'Issue', 'Cost', 'Status'];
        rows = state.repairRecords.map((r) => [r.assetCode, r.toolName, r.dateSent, r.technician, r.issueDescription, formatPHP(r.repairCost), r.status]);
      } else if (reportName === 'Disposal Report') {
        columns = ['Asset ID', 'Tool', 'Date', 'Method', 'Reason', 'Salvage Value', 'Approved By'];
        rows = state.disposalRecords.map((d) => [d.assetCode, d.toolName, d.disposalDate, d.method, d.reason, formatPHP(d.salvageValue), d.approvedBy]);
      } else {
        const brs = state.borrowRequests.filter((b) => {
          if (reportName === 'Borrowed / Released Tools') return b.status === 'Released';
          if (reportName === 'Overdue Returns') return b.status === 'Released' && b.expectedReturnDate < new Date().toISOString().slice(0, 10);
          if (reportName === 'Damage Report') return b.returnCondition && b.returnCondition !== 'Good';
          return true;
        });
        columns = ['Slip No.', 'Asset ID', 'Tool', 'Borrower', 'Release Date', 'Due Date', 'Status'];
        rows = brs.map((b) => [b.trNo, b.toolAssetCode, b.toolName, b.borrowerName, b.releaseDate || '—', b.expectedReturnDate, b.status]);
        summaryCards = [{ label: 'Tool Logs', value: String(rows.length) }];
      }
    }

    return { columns, rows, summaryCards, periodLabel };
  }, [state, moduleCat, reportName, period, customStart, customEnd, projectFilter, supplierFilter, statusFilter]);

  const filtersSummary = `Period: ${generated.periodLabel} · Project: ${
    projectFilter === 'All' ? 'All' : state.projects.find((p) => p.id === projectFilter)?.name
  } · Supplier: ${
    supplierFilter === 'All' ? 'All' : state.suppliers.find((s) => s.id === supplierFilter)?.name
  }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Management Reports Center</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            41 pre-built MIS &amp; financial reports across Monthly, Quarterly, Semi-Annual, Yearly, and Custom date ranges.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              downloadCSV(
                `RFB_${reportName.replace(/\s+/g, '_')}.csv`,
                generated.columns,
                generated.rows
              )
            }
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            type="button"
            onClick={() =>
              onOpenPrint({
                kind: 'report',
                title: reportName,
                moduleName: moduleCat,
                periodLabel: generated.periodLabel,
                filtersSummary,
                generatedBy: `${currentEmployee.name} (${currentEmployee.position})`,
                columns: generated.columns,
                rows: generated.rows,
                summaryCards: generated.summaryCards,
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-xl shadow-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> Print / Export PDF
          </button>
        </div>
      </div>

      {/* Report Builder Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
          {(Object.keys(REPORT_CATALOG) as ReportCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                moduleCat === cat ? 'bg-white text-[#123E82] shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">Report Type</label>
            <select
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white font-medium"
            >
              {REPORT_CATALOG[moduleCat].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodPreset)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Quarterly">Quarterly</option>
              <option value="Semi-Annual">Semi-Annual</option>
              <option value="Yearly">Yearly</option>
              <option value="Custom">Custom Date Range</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Project</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Projects</option>
              {state.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier</label>
            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="All">All Suppliers</option>
              {state.suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {period === 'Custom' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="All">All Statuses</option>
                <option value="Approved">Approved</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Live Preview Summary Cards */}
      {generated.summaryCards.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {generated.summaryCards.map((c) => (
            <div key={c.label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-500">{c.label}</div>
              <div className="text-lg font-bold font-mono text-[#123E82] mt-1 tabular-nums">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <FileBarChart2 className="w-4 h-4 text-[#2C6FE0]" />
            <span>
              {moduleCat} · {reportName} ({generated.periodLabel})
            </span>
          </div>
          <span className="text-slate-400 font-mono">{generated.rows.length} rows</span>
        </div>
        <table className="w-full text-xs min-w-[720px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              {generated.columns.map((col) => (
                <th key={col} className="px-4 py-3 text-left font-semibold">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {generated.rows.length === 0 ? (
              <tr>
                <td colSpan={generated.columns.length} className="p-6 text-center text-slate-500">
                  No matching records found for the selected filters.
                </td>
              </tr>
            ) : (
              generated.rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/70">
                  {r.map((cell, cIdx) => (
                    <td key={cIdx} className="px-4 py-2.5 font-mono text-[11px] text-slate-800">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
