import React, { useState } from 'react';
import { PackageCheck, Truck, X } from 'lucide-react';
import { Employee, ERPState, PurchaseOrder } from '../../types/erp';
import { formatPHP, nextCode, todayISO } from '../../utils/formatters';
import { StatusText } from '../StatusText';

interface OrdersModuleProps {
  state: ERPState;
  currentEmployee: Employee;
  onUpdateState: (updater: (prev: ERPState) => ERPState) => void;
}

export const OrdersModule: React.FC<OrdersModuleProps> = ({
  state,
  currentEmployee,
  onUpdateState,
}) => {
  const [receivePo, setReceivePo] = useState<PurchaseOrder | null>(null);
  const [invoiceNo, setInvoiceNo] = useState('');
  const [drNo, setDrNo] = useState('');
  const [notes, setNotes] = useState('All items inspected and verified complete');

  const openReceive = (po: PurchaseOrder) => {
    setReceivePo(po);
    setInvoiceNo(`SI-${Math.floor(10000 + Math.random() * 89999)}`);
    setDrNo(`DR-${Math.floor(1000 + Math.random() * 8999)}`);
    setNotes('Complete delivery verified at site warehouse');
  };

  const handleConfirmReceive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receivePo) return;

    const rrNo = nextCode(
      'RR',
      state.receivingReports.map((r) => r.rrNo)
    );
    const jeNo = nextCode(
      'JE',
      state.journalEntries.map((j) => j.jeNo)
    );

    const newRR = {
      id: `rr-${Date.now()}`,
      rrNo,
      poId: receivePo.id,
      poNo: receivePo.poNo,
      projectId: receivePo.projectId,
      supplierId: receivePo.supplierId,
      supplierName: receivePo.supplierName,
      invoiceNo: invoiceNo.trim() || 'SI-0000',
      deliveryReceiptNo: drNo.trim() || 'DR-0000',
      dateReceived: todayISO(),
      receivedBy: currentEmployee.name,
      receivedAmount: receivePo.totalAmount,
      conditionNotes: notes,
    };

    const newJE = {
      id: `je-${Date.now()}`,
      jeNo,
      date: todayISO(),
      reference: rrNo,
      projectId: receivePo.projectId,
      description: `Accrual for ${receivePo.poNo} delivery — ${receivePo.supplierName}`,
      postedBy: currentEmployee.name,
      lines: [
        {
          accountCode: '5010',
          accountName: 'Direct Project Materials Cost',
          debit: receivePo.totalAmount,
          credit: 0,
        },
        {
          accountCode: '2010',
          accountName: 'Accounts Payable - Suppliers',
          debit: 0,
          credit: receivePo.totalAmount,
        },
      ],
    };

    onUpdateState((prev) => ({
      ...prev,
      purchaseOrders: prev.purchaseOrders.map((po) =>
        po.id === receivePo.id ? { ...po, status: 'Delivered' } : po
      ),
      receivingReports: [newRR, ...prev.receivingReports],
      journalEntries: [newJE, ...prev.journalEntries],
    }));

    setReceivePo(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Purchase Orders &amp; Receiving</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track issued POs, record physical deliveries (RR), and auto-post material accruals to the General Ledger.
        </p>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2 text-sm font-bold text-slate-900">
          <Truck className="w-4 h-4 text-[#2C6FE0]" />
          Purchase Orders
        </div>
        <table className="w-full text-xs min-w-[760px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">PO No.</th>
              <th className="px-4 py-3 text-left font-semibold">PR Ref</th>
              <th className="px-4 py-3 text-left font-semibold">Supplier</th>
              <th className="px-4 py-3 text-left font-semibold">Project</th>
              <th className="px-4 py-3 text-right font-semibold">Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.purchaseOrders.map((po) => {
              const proj = state.projects.find((p) => p.id === po.projectId);
              return (
                <tr key={po.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono font-semibold text-[#123E82]">{po.poNo}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{po.prNo}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{po.supplierName}</td>
                  <td className="px-4 py-3 text-slate-600">{proj?.name || po.projectId}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                    {formatPHP(po.totalAmount)}
                  </td>
                  <td className="px-4 py-3"><StatusText status={po.status} /></td>
                  <td className="px-4 py-3 text-right">
                    {po.status === 'Issued' && (
                      <button
                        type="button"
                        onClick={() => openReceive(po)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        Receive Delivery
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Receiving Reports */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
        <div className="px-5 py-3.5 border-b border-slate-100 text-sm font-bold text-slate-900">
          Receiving Reports (RR)
        </div>
        <table className="w-full text-xs min-w-[740px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">RR No.</th>
              <th className="px-4 py-3 text-left font-semibold">PO Ref</th>
              <th className="px-4 py-3 text-left font-semibold">DR / Invoice</th>
              <th className="px-4 py-3 text-left font-semibold">Supplier</th>
              <th className="px-4 py-3 text-left font-semibold">Received By</th>
              <th className="px-4 py-3 text-right font-semibold">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.receivingReports.map((rr) => (
              <tr key={rr.id}>
                <td className="px-4 py-3 font-mono font-semibold text-[#123E82]">{rr.rrNo}</td>
                <td className="px-4 py-3 font-mono text-slate-600">{rr.poNo}</td>
                <td className="px-4 py-3 font-mono text-slate-600">
                  {rr.deliveryReceiptNo} / {rr.invoiceNo}
                </td>
                <td className="px-4 py-3 font-medium text-slate-900">{rr.supplierName}</td>
                <td className="px-4 py-3 text-slate-600">
                  {rr.receivedBy} · <span className="font-mono">{rr.dateReceived}</span>
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums">
                  {formatPHP(rr.receivedAmount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Receive Delivery Modal */}
      {receivePo && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Receive Delivery · {receivePo.poNo}
                </h3>
                <p className="text-xs text-slate-500">{receivePo.supplierName}</p>
              </div>
              <button
                type="button"
                onClick={() => setReceivePo(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmReceive} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Receipt No.</label>
                  <input
                    type="text"
                    value={drNo}
                    onChange={(e) => setDrNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier Invoice No.</label>
                  <input
                    type="text"
                    value={invoiceNo}
                    onChange={(e) => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Inspection &amp; Condition Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                />
              </div>
              <div className="bg-blue-50/70 rounded-xl p-3 text-xs text-[#123E82] flex justify-between">
                <span>Accrual to post to GL:</span>
                <span className="font-mono font-bold">{formatPHP(receivePo.totalAmount)}</span>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReceivePo(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer"
                >
                  Confirm Receipt &amp; Post GL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
