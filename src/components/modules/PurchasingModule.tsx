import React, { useState } from 'react';
import { Check, FileCheck2, Printer, XCircle } from 'lucide-react';
import {
  Company,
  Employee,
  ERPState,
  PermissionId,
  PrintDocument,
  PurchaseOrder,
  PurchaseRequest,
} from '../../types/erp';
import { formatPHP, nextCode, todayISO } from '../../utils/formatters';
import { StatusText } from '../StatusText';

interface PurchasingModuleProps {
  state: ERPState;
  currentEmployee: Employee;
  activeCompany: Company;
  can: (perm: PermissionId) => boolean;
  onUpdateState: (updater: (prev: ERPState) => ERPState) => void;
  onOpenPrint: (doc: PrintDocument) => void;
}

export const PurchasingModule: React.FC<PurchasingModuleProps> = ({
  state,
  currentEmployee,
  activeCompany,
  can,
  onUpdateState,
  onOpenPrint,
}) => {
  const [rejectPrId, setRejectPrId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const canApprove = can('approve_transactions');
  const canCreate = can('create_transactions');
  const docPrefix = (code: string) => (activeCompany.code === 'RFB' ? code : `${activeCompany.code}-${code}`);

  const advanceSignatory = (pr: PurchaseRequest) => {
    if (!canApprove) return;
    const stamp = {
      employeeId: currentEmployee.id,
      name: currentEmployee.name,
      position: currentEmployee.position,
      date: todayISO(),
    };

    onUpdateState((prev) => ({
      ...prev,
      purchaseRequests: prev.purchaseRequests.map((item) => {
        if (item.id !== pr.id) return item;
        if (item.status === 'Pending Note') {
          return { ...item, status: 'For Recommending Approval', notedBy: stamp };
        }
        if (item.status === 'For Recommending Approval') {
          return { ...item, status: 'For Final Approval', recommendingApprovalBy: stamp };
        }
        if (item.status === 'For Final Approval') {
          return { ...item, status: 'Approved', approvedBy: stamp };
        }
        return item;
      }),
    }));
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canApprove || !rejectPrId) return;
    onUpdateState((prev) => ({
      ...prev,
      purchaseRequests: prev.purchaseRequests.map((p) =>
        p.id === rejectPrId
          ? { ...p, status: 'Rejected', rejectionReason: rejectReason || 'Returned by approver' }
          : p
      ),
    }));
    setRejectPrId(null);
    setRejectReason('');
  };

  const handleGeneratePO = (pr: PurchaseRequest) => {
    if (!canCreate || pr.status !== 'Approved') return;
    const bySupplier = new Map<string, typeof pr.items>();
    for (const it of pr.items) {
      const list = bySupplier.get(it.supplierId) || [];
      list.push(it);
      bySupplier.set(it.supplierId, list);
    }

    const existingCodes = state.purchaseOrders.map((o) => o.poNo);
    const createdPOs: PurchaseOrder[] = [];
    const expected = new Date();
    expected.setDate(expected.getDate() + 5);
    const expectedStr = expected.toISOString().slice(0, 10);

    for (const [supId, items] of bySupplier.entries()) {
      const poNo = nextCode(docPrefix('PO'), [...existingCodes, ...createdPOs.map((c) => c.poNo)]);
      const total = items.reduce((s, it) => s + it.qty * it.unitPrice, 0);
      createdPOs.push({
        id: `po-${Date.now()}-${supId}`,
        companyId: activeCompany.id,
        poNo,
        prId: pr.id,
        prNo: pr.prNo,
        projectId: pr.projectId,
        supplierId: supId,
        supplierName: items[0].supplierName,
        dateIssued: todayISO(),
        expectedDate: expectedStr,
        totalAmount: total,
        status: 'Issued',
        items,
      });
    }

    onUpdateState((prev) => ({
      ...prev,
      purchaseRequests: prev.purchaseRequests.map((p) =>
        p.id === pr.id ? { ...p, status: 'PO Generated' } : p
      ),
      purchaseOrders: [...createdPOs, ...prev.purchaseOrders],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
          Purchasing &amp; 4-Step Approval Workflow
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {activeCompany.name} ({activeCompany.code}) chain: Prepared → Noted By → Recommending Approval → Approved. POs generate once Approved.
        </p>
      </div>

      {/* Approval Chain Legend */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded-xl brand-soft-surface">
          <div className="font-bold">1. Prepared By</div>
          <div className="opacity-85">Purchasing Officer (post-canvass)</div>
        </div>
        <div className="p-2.5 rounded-xl brand-soft-surface">
          <div className="font-bold">2. Noted By</div>
          <div className="opacity-85">Project Engineer review</div>
        </div>
        <div className="p-2.5 rounded-xl brand-soft-surface">
          <div className="font-bold">3. Recommending Approval</div>
          <div className="opacity-85">Finance / Procurement Lead</div>
        </div>
        <div className="p-2.5 rounded-xl brand-soft-surface">
          <div className="font-bold">4. Approved</div>
          <div className="opacity-85">General Manager / Head</div>
        </div>
      </div>

      {/* PR Cards */}
      <div className="space-y-4">
        {state.purchaseRequests.map((pr) => {
          const proj = state.projects.find((p) => p.id === pr.projectId);
          const isPrintable = pr.status === 'Approved' || pr.status === 'PO Generated';

          return (
            <div key={pr.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold brand-text-primary">{pr.prNo}</span>
                    <StatusText status={pr.status} />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {proj?.name} · Canvass: <span className="font-mono">{pr.canvassNo}</span> · Req:{' '}
                    <span className="font-mono">{pr.reqNo}</span> · Savings:{' '}
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{formatPHP(pr.canvassSavings)}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-right mr-2">
                    <div className="text-[11px] text-slate-400 dark:text-slate-500">Total PR Amount</div>
                    <div className="font-mono text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {formatPHP(pr.totalAmount)}
                    </div>
                  </div>

                  {canApprove && pr.status === 'Pending Note' && (
                    <button
                      type="button"
                      onClick={() => advanceSignatory(pr)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold brand-btn-primary rounded-xl cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Noted
                    </button>
                  )}
                  {canApprove && pr.status === 'For Recommending Approval' && (
                    <button
                      type="button"
                      onClick={() => advanceSignatory(pr)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold brand-btn-primary rounded-xl cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Recommending Approval
                    </button>
                  )}
                  {canApprove && pr.status === 'For Final Approval' && (
                    <button
                      type="button"
                      onClick={() => advanceSignatory(pr)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Final Approve
                    </button>
                  )}
                  {canApprove &&
                    (pr.status === 'Pending Note' ||
                      pr.status === 'For Recommending Approval' ||
                      pr.status === 'For Final Approval') && (
                    <button
                      type="button"
                      onClick={() => setRejectPrId(pr.id)}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-xl cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  )}

                  {canCreate && pr.status === 'Approved' && (
                    <button
                      type="button"
                      onClick={() => handleGeneratePO(pr)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold brand-btn-dark hover:opacity-90 rounded-xl cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" /> Generate PO
                    </button>
                  )}

                  {isPrintable && (
                    <button
                      type="button"
                      onClick={() => onOpenPrint({ kind: 'pr', prId: pr.id })}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold brand-soft-surface hover:opacity-90 rounded-xl cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Form
                    </button>
                  )}
                </div>
              </div>

              {/* 4-Step Signatory Status Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                {[
                  { label: 'Prepared By', stamp: pr.preparedBy },
                  { label: 'Noted By', stamp: pr.notedBy },
                  { label: 'Recommending Approval', stamp: pr.recommendingApprovalBy },
                  { label: 'Approved By', stamp: pr.approvedBy },
                ].map((step) => (
                  <div
                    key={step.label}
                    className={`p-2.5 rounded-xl border ${
                      step.stamp
                        ? 'brand-soft-outline'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500">{step.label}</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 truncate">
                      {step.stamp?.name || 'Pending'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      {step.stamp ? `${step.stamp.position} · ${step.stamp.date}` : 'Awaiting sign-off'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Reject Reason Modal */}
      {rejectPrId && canApprove && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={handleReject} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">Reject Purchase Request</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reason for Rejection</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="State reason (e.g. re-canvass required or budget hold)"
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectPrId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg cursor-pointer"
              >
                Confirm Reject
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
