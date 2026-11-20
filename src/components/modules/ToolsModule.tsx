import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Hammer,
  PackageOpen,
  Plus,
  Printer,
  RotateCcw,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import { BorrowRequest, Employee, ERPState, PrintDocument, ToolAsset } from '../../types/erp';
import { formatPHP, nextCode, nextSimpleCode, nowTimestamp, todayISO } from '../../utils/formatters';
import { StatusText } from '../StatusText';

interface ToolsModuleProps {
  state: ERPState;
  currentEmployee: Employee;
  onUpdateState: (updater: (prev: ERPState) => ERPState) => void;
  onOpenPrint: (doc: PrintDocument) => void;
}

type ToolTab = 'requests' | 'registry' | 'repairs' | 'audit';

export const ToolsModule: React.FC<ToolsModuleProps> = ({
  state,
  currentEmployee,
  onUpdateState,
  onOpenPrint,
}) => {
  const [tab, setTab] = useState<ToolTab>('requests');

  // Register tool modal
  const [showAddTool, setShowAddTool] = useState(false);
  const [toolForm, setToolForm] = useState({
    name: '',
    category: 'Power Tools',
    brandModel: '',
    serialNo: '',
    purchaseCost: '15000',
    projectId: state.projects[0]?.id || '',
  });

  // New borrow request modal
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowForm, setBorrowForm] = useState({
    toolId: '',
    projectId: state.projects[0]?.id || '',
    expectedReturnDate: todayISO(),
    purpose: '',
  });

  // Return modal with condition + photo upload
  const [returnReq, setReturnReq] = useState<BorrowRequest | null>(null);
  const [returnCond, setReturnCond] = useState<'Good' | 'Minor Damage' | 'Major Damage' | 'Missing Parts'>('Good');
  const [returnRemarks, setReturnRemarks] = useState('');
  const [damagePhoto, setDamagePhoto] = useState<string>('');

  // Disposal modal
  const [disposeTool, setDisposeTool] = useState<ToolAsset | null>(null);
  const [disposeReason, setDisposeReason] = useState('Beyond economical repair');
  const [disposeMethod, setDisposeMethod] = useState<'Scrap' | 'Auction' | 'Write-Off' | 'Donation'>('Scrap');
  const [salvageValue, setSalvageValue] = useState('0');

  const today = todayISO();

  const kpis = useMemo(() => {
    const total = state.tools.length;
    const available = state.tools.filter((t) => t.status === 'Available').length;
    const borrowed = state.tools.filter((t) => t.status === 'Borrowed').length;
    const repair = state.tools.filter((t) => t.status === 'Under Repair').length;
    const lost = state.tools.filter((t) => t.status === 'Lost').length;
    const overdue = state.borrowRequests.filter(
      (b) => b.status === 'Released' && b.expectedReturnDate < today
    );
    return { total, available, borrowed, repair, lost, overdue };
  }, [state.tools, state.borrowRequests, today]);

  const appendAudit = (
    prev: ERPState,
    tool: { id: string; assetCode: string; name: string },
    action: string,
    remarks: string
  ) => [
    {
      id: `tal-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      toolId: tool.id,
      assetCode: tool.assetCode,
      toolName: tool.name,
      action,
      actor: currentEmployee.name,
      timestamp: nowTimestamp(),
      remarks,
    },
    ...prev.toolAuditLogs,
  ];

  const handleRegisterTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolForm.name.trim()) return;
    const assetCode = nextSimpleCode(
      'RFB-TL-',
      state.tools.map((t) => t.assetCode)
    );
    const newTool: ToolAsset = {
      id: `tl-${Date.now()}`,
      assetCode,
      name: toolForm.name.trim(),
      category: toolForm.category,
      brandModel: toolForm.brandModel.trim() || 'Standard',
      serialNo: toolForm.serialNo.trim() || `SN-${Date.now().toString().slice(-6)}`,
      purchaseDate: todayISO(),
      purchaseCost: Number(toolForm.purchaseCost) || 0,
      projectId: toolForm.projectId,
      condition: 'Good',
      status: 'Available',
    };

    onUpdateState((prev) => ({
      ...prev,
      tools: [newTool, ...prev.tools],
      toolAuditLogs: appendAudit(prev, newTool, 'Asset Registered', `Added ${assetCode} to registry`),
    }));
    setShowAddTool(false);
    setToolForm({ ...toolForm, name: '', brandModel: '', serialNo: '' });
  };

  const handleCreateBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    const tool = state.tools.find((t) => t.id === borrowForm.toolId);
    if (!tool) return;
    const trNo = nextCode(
      'TR',
      state.borrowRequests.map((b) => b.trNo)
    );
    const newReq: BorrowRequest = {
      id: `br-${Date.now()}`,
      trNo,
      toolId: tool.id,
      toolAssetCode: tool.assetCode,
      toolName: tool.name,
      borrowerEmployeeId: currentEmployee.id,
      borrowerName: currentEmployee.name,
      borrowerPosition: currentEmployee.position,
      department: currentEmployee.department,
      projectId: borrowForm.projectId,
      purpose: borrowForm.purpose.trim() || 'Site operations deployment',
      requestDate: todayISO(),
      expectedReturnDate: borrowForm.expectedReturnDate,
      status: 'Pending Approval',
    };

    onUpdateState((prev) => ({
      ...prev,
      borrowRequests: [newReq, ...prev.borrowRequests],
      toolAuditLogs: appendAudit(prev, tool, 'Borrow Requested', `${trNo}: ${newReq.purpose}`),
    }));
    setShowBorrowModal(false);
  };

  const handleApproveBorrow = (br: BorrowRequest, approve: boolean) => {
    onUpdateState((prev) => ({
      ...prev,
      borrowRequests: prev.borrowRequests.map((b) =>
        b.id === br.id
          ? {
              ...b,
              status: approve ? 'Approved' : 'Rejected',
              approvedBy: currentEmployee.name,
              approvedDate: todayISO(),
            }
          : b
      ),
      toolAuditLogs: appendAudit(
        prev,
        { id: br.toolId, assetCode: br.toolAssetCode, name: br.toolName },
        approve ? 'Borrow Approved' : 'Borrow Rejected',
        `${br.trNo} ${approve ? 'approved' : 'rejected'} by ${currentEmployee.name}`
      ),
    }));
  };

  const handleReleaseBorrow = (br: BorrowRequest) => {
    onUpdateState((prev) => ({
      ...prev,
      tools: prev.tools.map((t) => (t.id === br.toolId ? { ...t, status: 'Borrowed' } : t)),
      borrowRequests: prev.borrowRequests.map((b) =>
        b.id === br.id
          ? {
              ...b,
              status: 'Released',
              releasedBy: currentEmployee.name,
              releasedByEmployeeId: currentEmployee.id,
              releaseDate: todayISO(),
              releaseCondition: 'Good — inspected prior to release',
            }
          : b
      ),
      toolAuditLogs: appendAudit(
        prev,
        { id: br.toolId, assetCode: br.toolAssetCode, name: br.toolName },
        'Released to Borrower',
        `${br.trNo} released to ${br.borrowerName}`
      ),
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setDamagePhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnReq) return;
    const isDamaged = returnCond !== 'Good';

    onUpdateState((prev) => ({
      ...prev,
      tools: prev.tools.map((t) =>
        t.id === returnReq.toolId
          ? {
              ...t,
              status: isDamaged ? 'Under Repair' : 'Available',
              condition: isDamaged ? 'Damaged' : 'Good',
            }
          : t
      ),
      borrowRequests: prev.borrowRequests.map((b) =>
        b.id === returnReq.id
          ? {
              ...b,
              status: 'Returned',
              returnedDate: todayISO(),
              returnCondition: returnCond,
              returnRemarks: returnRemarks.trim() || (isDamaged ? 'Needs workshop inspection' : 'Returned intact'),
              damagePhotoDataUrl: damagePhoto || undefined,
              receivedByCustodian: currentEmployee.name,
            }
          : b
      ),
      repairRecords: isDamaged
        ? [
            {
              id: `rep-${Date.now()}`,
              toolId: returnReq.toolId,
              assetCode: returnReq.toolAssetCode,
              toolName: returnReq.toolName,
              dateSent: todayISO(),
              technician: 'RFB Motorpool Workshop',
              issueDescription: `${returnCond}: ${returnRemarks || 'Reported upon return'}`,
              partsReplaced: 'Pending diagnostics',
              repairCost: 0,
              status: 'In Progress',
            },
            ...prev.repairRecords,
          ]
        : prev.repairRecords,
      toolAuditLogs: appendAudit(
        prev,
        { id: returnReq.toolId, assetCode: returnReq.toolAssetCode, name: returnReq.toolName },
        isDamaged ? 'Returned with Damage' : 'Returned in Good Condition',
        `${returnReq.trNo} (${returnCond}) — ${returnRemarks || 'Checked by custodian'}`
      ),
    }));

    setReturnReq(null);
    setReturnRemarks('');
    setDamagePhoto('');
  };

  const handleReportLost = (tool: ToolAsset) => {
    onUpdateState((prev) => ({
      ...prev,
      tools: prev.tools.map((t) => (t.id === tool.id ? { ...t, status: 'Lost' } : t)),
      toolAuditLogs: appendAudit(prev, tool, 'Reported Lost / Stolen', 'Flagged missing by site/warehouse'),
    }));
  };

  const handleMarkRecovered = (tool: ToolAsset) => {
    onUpdateState((prev) => ({
      ...prev,
      tools: prev.tools.map((t) => (t.id === tool.id ? { ...t, status: 'Available' } : t)),
      toolAuditLogs: appendAudit(prev, tool, 'Marked Recovered', 'Tool located and returned to Available pool'),
    }));
  };

  const handleCompleteRepair = (repId: string, toolId: string, cost: number) => {
    const tool = state.tools.find((t) => t.id === toolId);
    onUpdateState((prev) => ({
      ...prev,
      repairRecords: prev.repairRecords.map((r) =>
        r.id === repId
          ? { ...r, status: 'Completed', dateCompleted: todayISO(), repairCost: cost || r.repairCost }
          : r
      ),
      tools: prev.tools.map((t) =>
        t.id === toolId ? { ...t, status: 'Available', condition: 'Good' } : t
      ),
      toolAuditLogs: tool
        ? appendAudit(prev, tool, 'Repair Completed', `Restored to Available pool`)
        : prev.toolAuditLogs,
    }));
  };

  const handleConfirmDispose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disposeTool) return;
    onUpdateState((prev) => ({
      ...prev,
      tools: prev.tools.map((t) => (t.id === disposeTool.id ? { ...t, status: 'Disposed' } : t)),
      disposalRecords: [
        {
          id: `disp-${Date.now()}`,
          toolId: disposeTool.id,
          assetCode: disposeTool.assetCode,
          toolName: disposeTool.name,
          disposalDate: todayISO(),
          reason: disposeReason,
          method: disposeMethod,
          salvageValue: Number(salvageValue) || 0,
          approvedBy: currentEmployee.name,
        },
        ...prev.disposalRecords,
      ],
      toolAuditLogs: appendAudit(prev, disposeTool, 'Asset Disposed', `${disposeMethod}: ${disposeReason}`),
    }));
    setDisposeTool(null);
  };

  const availableTools = state.tools.filter((t) => t.status === 'Available');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">Tools &amp; Equipment Monitoring</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Asset registry, borrow/release/return lifecycle, damage &amp; repair tracking, audit trail, and printable Borrower Slips.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setBorrowForm({
                toolId: availableTools[0]?.id || '',
                projectId: state.projects[0]?.id || '',
                expectedReturnDate: todayISO(),
                purpose: '',
              });
              setShowBorrowModal(true);
            }}
            disabled={availableTools.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] disabled:opacity-40 rounded-xl shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Request Tool
          </button>
          <button
            type="button"
            onClick={() => setShowAddTool(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#123E82] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5" /> Register Asset
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Tools', val: kpis.total, color: 'text-slate-900 dark:text-slate-100' },
          { label: 'Available', val: kpis.available, color: 'text-emerald-700 dark:text-emerald-400' },
          { label: 'Borrowed', val: kpis.borrowed, color: 'text-[#2C6FE0] dark:text-blue-400' },
          { label: 'Under Repair', val: kpis.repair, color: 'text-amber-700 dark:text-amber-400' },
          { label: 'Lost / Stolen', val: kpis.lost, color: 'text-red-700 dark:text-red-400' },
          { label: 'Overdue Returns', val: kpis.overdue.length, color: 'text-red-700 dark:text-red-400' },
        ].map((k) => (
          <div key={k.label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{k.label}</div>
            <div className={`text-xl font-bold font-mono mt-1 tabular-nums ${k.color}`}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Alerts banner if overdue or lost */}
      {(kpis.overdue.length > 0 || kpis.lost > 0) && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Equipment Attention Required:</span>{' '}
            {kpis.overdue.length > 0 &&
              `${kpis.overdue.length} overdue borrow slip(s) (${kpis.overdue.map((o) => o.trNo).join(', ')}). `}
            {kpis.lost > 0 && `${kpis.lost} asset(s) currently flagged Lost/Stolen.`}
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl w-fit">
        {(
          [
            { id: 'requests', label: 'Borrow Requests' },
            { id: 'registry', label: 'Asset Registry' },
            { id: 'repairs', label: 'Repairs & Disposal' },
            { id: 'audit', label: 'Audit Trail' },
          ] as { id: ToolTab; label: string }[]
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              tab === t.id
                ? 'bg-white dark:bg-slate-900 text-[#123E82] dark:text-blue-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Borrow Requests */}
      {tab === 'requests' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
          <table className="w-full text-xs min-w-[820px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">Slip No.</th>
                <th className="px-4 py-3 text-left">Tool / Asset ID</th>
                <th className="px-4 py-3 text-left">Borrower</th>
                <th className="px-4 py-3 text-left">Project</th>
                <th className="px-4 py-3 text-left">Due Date</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.borrowRequests.map((br) => {
                const proj = state.projects.find((p) => p.id === br.projectId);
                const isPrintable = br.status === 'Approved' || br.status === 'Released' || br.status === 'Returned';
                const isOverdue = br.status === 'Released' && br.expectedReturnDate < today;
                return (
                  <tr key={br.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-semibold text-[#123E82] dark:text-blue-300">{br.trNo}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{br.toolName}</div>
                      <div className="font-mono text-[11px] text-slate-400 dark:text-slate-500">{br.toolAssetCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{br.borrowerName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{br.department}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{proj?.name || br.projectId}</td>
                    <td className={`px-4 py-3 font-mono ${isOverdue ? 'text-red-700 dark:text-red-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
                      {br.expectedReturnDate} {isOverdue ? '(Overdue)' : ''}
                    </td>
                    <td className="px-4 py-3"><StatusText status={br.status} /></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                      {br.status === 'Pending Approval' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApproveBorrow(br, true)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveBorrow(br, false)}
                            className="px-2.5 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-lg cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {br.status === 'Approved' && (
                        <button
                          type="button"
                          onClick={() => handleReleaseBorrow(br)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                        >
                          <PackageOpen className="w-3.5 h-3.5" /> Release Tool
                        </button>
                      )}
                      {br.status === 'Released' && (
                        <button
                          type="button"
                          onClick={() => {
                            setReturnReq(br);
                            setReturnCond('Good');
                            setReturnRemarks('');
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-[#123E82] hover:bg-[#0D2E63] rounded-lg cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Process Return
                        </button>
                      )}
                      {isPrintable && (
                        <button
                          type="button"
                          onClick={() => onOpenPrint({ kind: 'borrower-slip', borrowId: br.id })}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#123E82] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Slip
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Asset Registry */}
      {tab === 'registry' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
          <table className="w-full text-xs min-w-[780px]">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">Asset ID</th>
                <th className="px-4 py-3 text-left">Tool / Equipment</th>
                <th className="px-4 py-3 text-left">Brand &amp; Serial</th>
                <th className="px-4 py-3 text-left">Site</th>
                <th className="px-4 py-3 text-right">Cost</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.tools.map((t) => {
                const proj = state.projects.find((p) => p.id === t.projectId);
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-semibold text-[#123E82] dark:text-blue-300">{t.assetCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{t.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{t.category}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono">
                      {t.brandModel} · {t.serialNo}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{proj?.name || 'Main Warehouse'}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">{formatPHP(t.purchaseCost)}</td>
                    <td className="px-4 py-3"><StatusText status={t.status} /></td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                      {(t.status === 'Available' || t.status === 'Borrowed') && (
                        <button
                          type="button"
                          onClick={() => handleReportLost(t)}
                          className="px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-lg cursor-pointer"
                        >
                          Report Lost
                        </button>
                      )}
                      {t.status === 'Lost' && (
                        <button
                          type="button"
                          onClick={() => handleMarkRecovered(t)}
                          className="px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg cursor-pointer"
                        >
                          Mark Recovered
                        </button>
                      )}
                      {t.status !== 'Disposed' && (
                        <button
                          type="button"
                          onClick={() => setDisposeTool(t)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" /> Dispose
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Repairs & Disposal */}
      {tab === 'repairs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Hammer className="w-4 h-4 text-amber-600 dark:text-amber-400" /> Repair Logs
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.repairRecords.map((rep) => (
                <div key={rep.id} className="p-4 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-[#123E82] dark:text-blue-300">
                      {rep.assetCode} · {rep.toolName}
                    </span>
                    <StatusText status={rep.status} />
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">{rep.issueDescription}</div>
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span>
                      {rep.technician} · Sent {rep.dateSent}
                    </span>
                    {rep.status === 'In Progress' && (
                      <button
                        type="button"
                        onClick={() => handleCompleteRepair(rep.id, rep.toolId, 2500)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                      >
                        Mark Repaired
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100">
              Disposal Records
            </div>
            {state.disposalRecords.length === 0 ? (
              <div className="p-6 text-xs text-slate-500 dark:text-slate-400">No assets have been disposed yet.</div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.disposalRecords.map((d) => (
                  <div key={d.id} className="p-4 text-xs space-y-1">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {d.assetCode} · {d.toolName}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      {d.method} · {d.reason} · Salvage: <span className="font-mono">{formatPHP(d.salvageValue)}</span>
                    </div>
                    <div className="text-slate-400 dark:text-slate-500 font-mono">
                      {d.disposalDate} · Approved by {d.approvedBy}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {tab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">Timestamp</th>
                <th className="px-4 py-3 text-left">Asset ID</th>
                <th className="px-4 py-3 text-left">Tool</th>
                <th className="px-4 py-3 text-left">Action</th>
                <th className="px-4 py-3 text-left">Performed By</th>
                <th className="px-4 py-3 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.toolAuditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                  <td className="px-4 py-2.5 font-mono font-semibold text-[#123E82] dark:text-blue-300">{log.assetCode}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{log.toolName}</td>
                  <td className="px-4 py-2.5 font-semibold text-slate-800 dark:text-slate-200">{log.action}</td>
                  <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{log.actor}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{log.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Register Tool Modal */}
      {showAddTool && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleRegisterTool} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">Register New Tool / Equipment</h3>
              <button type="button" onClick={() => setShowAddTool(false)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tool / Equipment Name</label>
              <input
                type="text"
                value={toolForm.name}
                onChange={(e) => setToolForm({ ...toolForm, name: e.target.value })}
                placeholder="e.g. Makita Demolition Hammer"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                <input
                  type="text"
                  value={toolForm.category}
                  onChange={(e) => setToolForm({ ...toolForm, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Brand / Model</label>
                <input
                  type="text"
                  value={toolForm.brandModel}
                  onChange={(e) => setToolForm({ ...toolForm, brandModel: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Serial No.</label>
                <input
                  type="text"
                  value={toolForm.serialNo}
                  onChange={(e) => setToolForm({ ...toolForm, serialNo: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cost (₱)</label>
                <input
                  type="number"
                  value={toolForm.purchaseCost}
                  onChange={(e) => setToolForm({ ...toolForm, purchaseCost: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddTool(false)} className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer">
                Save Asset
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Borrow Request Modal */}
      {showBorrowModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleCreateBorrow} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">Request Tool Borrow</h3>
              <button type="button" onClick={() => setShowBorrowModal(false)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Available Tool</label>
              <select
                value={borrowForm.toolId}
                onChange={(e) => setBorrowForm({ ...borrowForm, toolId: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                {availableTools.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.assetCode} · {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Deployment Site</label>
                <select
                  value={borrowForm.projectId}
                  onChange={(e) => setBorrowForm({ ...borrowForm, projectId: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {state.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Return</label>
                <input
                  type="date"
                  value={borrowForm.expectedReturnDate}
                  onChange={(e) => setBorrowForm({ ...borrowForm, expectedReturnDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Purpose</label>
              <input
                type="text"
                value={borrowForm.purpose}
                onChange={(e) => setBorrowForm({ ...borrowForm, purpose: e.target.value })}
                placeholder="Task / activity at project site"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowBorrowModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer">
                Submit Borrow Request
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Return & Damage Inspection Modal */}
      {returnReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleSubmitReturn} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Process Tool Return · {returnReq.trNo}
              </h3>
              <button type="button" onClick={() => setReturnReq(null)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              {returnReq.toolAssetCode} · {returnReq.toolName} (Borrowed by {returnReq.borrowerName})
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Condition on Return</label>
              <select
                value={returnCond}
                onChange={(e) =>
                  setReturnCond(e.target.value as 'Good' | 'Minor Damage' | 'Major Damage' | 'Missing Parts')
                }
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="Good">Good (Return to Available Pool)</option>
                <option value="Minor Damage">Minor Damage (Send to Repair)</option>
                <option value="Major Damage">Major Damage (Send to Repair)</option>
                <option value="Missing Parts">Missing Parts (Send to Repair)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Inspection Remarks</label>
              <textarea
                value={returnRemarks}
                onChange={(e) => setReturnRemarks(e.target.value)}
                rows={2}
                placeholder="Describe tool condition or damage details"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Optional Damage / Condition Photo</label>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="text-xs text-slate-600 dark:text-slate-300" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setReturnReq(null)} className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer">
                Complete Return
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Disposal Modal */}
      {disposeTool && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleConfirmDispose} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">Dispose Asset · {disposeTool.assetCode}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Method</label>
                <select
                  value={disposeMethod}
                  onChange={(e) =>
                    setDisposeMethod(e.target.value as 'Scrap' | 'Auction' | 'Write-Off' | 'Donation')
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="Scrap">Scrap</option>
                  <option value="Auction">Auction</option>
                  <option value="Write-Off">Write-Off</option>
                  <option value="Donation">Donation</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Salvage Value (₱)</label>
                <input
                  type="number"
                  value={salvageValue}
                  onChange={(e) => setSalvageValue(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Disposal Reason</label>
              <input
                type="text"
                value={disposeReason}
                onChange={(e) => setDisposeReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setDisposeTool(null)} className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer">
                Confirm Disposal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
