import React, { useState } from 'react';
import { Check, CheckCircle2, CreditCard, Plus, X, XCircle } from 'lucide-react';
import { DisbursementVoucher, Employee, ERPState } from '../../types/erp';
import { formatPHP, nextCode, todayISO } from '../../utils/formatters';
import { StatusText } from '../StatusText';

interface VouchersModuleProps {
  state: ERPState;
  currentEmployee: Employee;
  onUpdateState: (updater: (prev: ERPState) => ERPState) => void;
}

export const VouchersModule: React.FC<VouchersModuleProps> = ({
  state,
  currentEmployee,
  onUpdateState,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [selectedRrId, setSelectedRrId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [remarks, setRemarks] = useState('');

  // Payment modal
  const [payDv, setPayDv] = useState<DisbursementVoucher | null>(null);
  const [payMethod, setPayMethod] = useState<'Check' | 'Bank Transfer' | 'Cash'>('Check');
  const [payRef, setPayRef] = useState('');

  // RRs that don't yet have an active (non-cancelled) DV
  const eligibleRRs = state.receivingReports.filter(
    (rr) => !state.vouchers.some((v) => v.rrId === rr.id && v.status !== 'Cancelled')
  );

  const openCreateModal = () => {
    const first = eligibleRRs[0];
    setSelectedRrId(first?.id || '');
    setInvoiceAmount(first ? String(first.receivedAmount) : '');
    setRemarks('');
    setShowCreate(true);
  };

  const handleCreateDV = (e: React.FormEvent) => {
    e.preventDefault();
    const rr = state.receivingReports.find((r) => r.id === selectedRrId);
    const po = rr ? state.purchaseOrders.find((p) => p.id === rr.poId) : undefined;
    if (!rr || !po) return;

    const invAmt = Number(invoiceAmount) || rr.receivedAmount;
    const matched = Math.abs(po.totalAmount - rr.receivedAmount) < 0.01 && Math.abs(rr.receivedAmount - invAmt) < 0.01;
    const dvNo = nextCode(
      'DV',
      state.vouchers.map((v) => v.dvNo)
    );
    const pr = state.purchaseRequests.find((p) => p.id === po.prId);

    const newDV: DisbursementVoucher = {
      id: `dv-${Date.now()}`,
      dvNo,
      poId: po.id,
      poNo: po.poNo,
      rrId: rr.id,
      rrNo: rr.rrNo,
      projectId: po.projectId,
      supplierId: po.supplierId,
      supplierName: po.supplierName,
      department: pr?.department || currentEmployee.department,
      invoiceNo: rr.invoiceNo,
      poAmount: po.totalAmount,
      rrAmount: rr.receivedAmount,
      invoiceAmount: invAmt,
      threeWayMatched: matched,
      dateCreated: todayISO(),
      dueDate,
      status: 'Pending Approval',
      preparedBy: currentEmployee.name,
      remarks: remarks.trim() || `3-way match payment for ${po.poNo}`,
    };

    onUpdateState((prev) => ({
      ...prev,
      vouchers: [newDV, ...prev.vouchers],
    }));
    setShowCreate(false);
  };

  const handleApproveDV = (dvId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      vouchers: prev.vouchers.map((v) =>
        v.id === dvId
          ? {
              ...v,
              status: 'Approved',
              approvedBy: currentEmployee.name,
              dateApproved: todayISO(),
            }
          : v
      ),
    }));
  };

  const handleCancelDV = (dvId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      vouchers: prev.vouchers.map((v) =>
        v.id === dvId ? { ...v, status: 'Cancelled' } : v
      ),
    }));
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDv) return;
    const ref = payRef.trim() || `CHK-${Math.floor(100000 + Math.random() * 899999)}`;
    const jeNo = nextCode(
      'JE',
      state.journalEntries.map((j) => j.jeNo)
    );

    const newJE = {
      id: `je-${Date.now()}`,
      jeNo,
      date: todayISO(),
      reference: payDv.dvNo,
      projectId: payDv.projectId,
      description: `Disbursement settlement for ${payDv.dvNo} (${payMethod} ${ref})`,
      postedBy: currentEmployee.name,
      lines: [
        {
          accountCode: '2010',
          accountName: 'Accounts Payable - Suppliers',
          debit: payDv.invoiceAmount,
          credit: 0,
        },
        {
          accountCode: '1010',
          accountName: 'Cash in Bank - Operating',
          debit: 0,
          credit: payDv.invoiceAmount,
        },
      ],
    };

    onUpdateState((prev) => ({
      ...prev,
      vouchers: prev.vouchers.map((v) =>
        v.id === payDv.id
          ? {
              ...v,
              status: 'Paid',
              paidDate: todayISO(),
              paymentMethod: payMethod,
              paymentRef: ref,
            }
          : v
      ),
      journalEntries: [newJE, ...prev.journalEntries],
    }));
    setPayDv(null);
    setPayRef('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">Disbursement Vouchers (DV)</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            3-Way Match verification (PO + Receiving Report + Supplier Invoice), approval chain, and GL payment posting.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          disabled={eligibleRRs.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] disabled:opacity-40 rounded-xl shadow-xs cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Voucher (3-Way Match)
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
        <table className="w-full text-xs min-w-[820px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">DV No.</th>
              <th className="px-4 py-3 text-left font-semibold">PO / RR / Invoice</th>
              <th className="px-4 py-3 text-left font-semibold">Supplier</th>
              <th className="px-4 py-3 text-center font-semibold">3-Way Match</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Due Date</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {state.vouchers.map((dv) => (
              <tr key={dv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-mono font-semibold text-[#123E82] dark:text-blue-300">{dv.dvNo}</td>
                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                  {dv.poNo} · {dv.rrNo} · {dv.invoiceNo}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{dv.supplierName}</td>
                <td className="px-4 py-3 text-center">
                  {dv.threeWayMatched ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">Variance</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {formatPHP(dv.invoiceAmount)}
                </td>
                <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{dv.dueDate}</td>
                <td className="px-4 py-3">
                  <StatusText status={dv.status} />
                  {dv.paymentRef && (
                    <div className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                      {dv.paymentMethod}: {dv.paymentRef}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                  {dv.status === 'Pending Approval' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApproveDV(dv.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelDV(dv.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-lg cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Cancel
                      </button>
                    </>
                  )}
                  {dv.status === 'Approved' && (
                    <button
                      type="button"
                      onClick={() => {
                        setPayDv(dv);
                        setPayRef(`CHK-${Math.floor(100000 + Math.random() * 899999)}`);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create 3-Way Match Voucher Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">Create 3-Way Match Voucher</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateDV} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Receiving Report (RR)</label>
                <select
                  value={selectedRrId}
                  onChange={(e) => {
                    const rr = state.receivingReports.find((r) => r.id === e.target.value);
                    setSelectedRrId(e.target.value);
                    if (rr) setInvoiceAmount(String(rr.receivedAmount));
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {eligibleRRs.map((rr) => (
                    <option key={rr.id} value={rr.id}>
                      {rr.rrNo} · {rr.poNo} · {rr.supplierName} ({formatPHP(rr.receivedAmount)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier Invoice Amount (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Voucher payment particulars"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer"
                >
                  Create Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Paid Modal */}
      {payDv && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <form onSubmit={handleConfirmPayment} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
              Record Payment · {payDv.dvNo}
            </h3>
            <div className="bg-slate-50 dark:bg-slate-800/70 rounded-xl p-3 text-xs flex justify-between">
              <span className="text-slate-600 dark:text-slate-300">{payDv.supplierName}</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatPHP(payDv.invoiceAmount)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as 'Check' | 'Bank Transfer' | 'Cash')}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  <option value="Check">Check</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Check / Ref No.</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayDv(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer"
              >
                Confirm Payment &amp; Post GL
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
