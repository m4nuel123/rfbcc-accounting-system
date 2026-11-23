import React, { useState } from 'react';
import { Award, FileSpreadsheet, Plus, Printer, X } from 'lucide-react';
import {
  Canvass,
  CanvassQuote,
  Company,
  Employee,
  ERPState,
  PermissionId,
  PrintDocument,
  PurchaseRequestItem,
} from '../../types/erp';
import { formatPHP, nextCode, todayISO } from '../../utils/formatters';
import { StatusText } from '../StatusText';

interface CanvassingModuleProps {
  state: ERPState;
  currentEmployee: Employee;
  activeCompany: Company;
  can: (perm: PermissionId) => boolean;
  onUpdateState: (updater: (prev: ERPState) => ERPState) => void;
  onOpenPrint: (doc: PrintDocument) => void;
}

export const CanvassingModule: React.FC<CanvassingModuleProps> = ({
  state,
  currentEmployee,
  activeCompany,
  can,
  onUpdateState,
  onOpenPrint,
}) => {
  const [activeCanvassId, setActiveCanvassId] = useState<string | null>(null);
  const [quoteSupplierId, setQuoteSupplierId] = useState(state.suppliers[0]?.id || '');
  const [quoteMaterialId, setQuoteMaterialId] = useState('');
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteLeadDays, setQuoteLeadDays] = useState('3');
  const [quoteRemarks, setQuoteRemarks] = useState('Delivered on site');

  // Nested "+ Add New Supplier..." modal
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupForm, setNewSupForm] = useState({ name: '', contact: '', terms: 'Net 30', category: 'Construction' });

  const canCreate = can('create_transactions');
  const canEdit = can('edit_transactions');
  const canProcess = can('process_transactions') || canCreate;
  const canModifyQuotes = canCreate || canEdit || canProcess;
  const canPrint = can('print_documents') || can('export_reports') || canModifyQuotes;
  const docPrefix = (code: string) => (activeCompany.code === 'RFB' ? code : `${activeCompany.code}-${code}`);

  const activeCanvass = state.canvasses.find((c) => c.id === activeCanvassId) || null;
  const activeReq = activeCanvass
    ? state.requisitions.find((r) => r.id === activeCanvass.reqId) || null
    : null;

  const openCanvassModal = (cnv: Canvass) => {
    const req = state.requisitions.find((r) => r.id === cnv.reqId);
    setActiveCanvassId(cnv.id);
    setQuoteSupplierId(state.suppliers[0]?.id || '');
    setQuoteMaterialId(req?.items[0]?.materialId || '');
    setQuotePrice(String(req?.items[0]?.estUnitPrice || ''));
  };

  const handleSupplierChange = (val: string) => {
    if (val === '__ADD_NEW__') {
      if (!canCreate) return;
      setShowAddSupplier(true);
      return;
    }
    setQuoteSupplierId(val);
  };

  const handleSaveNewSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate || !newSupForm.name.trim()) return;
    const newId = `sup-${Date.now()}`;
    onUpdateState((prev) => ({
      ...prev,
      suppliers: [
        ...prev.suppliers,
        {
          id: newId,
          companyId: activeCompany.id,
          name: newSupForm.name.trim(),
          contact: newSupForm.contact.trim() || '0917-000-0000',
          address: activeCompany.address,
          terms: newSupForm.terms.trim() || 'Net 30',
          category: newSupForm.category,
          rating: 4.5,
        },
      ],
    }));
    setQuoteSupplierId(newId);
    setNewSupForm({ name: '', contact: '', terms: 'Net 30', category: 'Construction' });
    setShowAddSupplier(false);
  };

  const handleAddQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModifyQuotes || !activeCanvass || !quoteSupplierId || !quoteMaterialId) return;
    const sup = state.suppliers.find((s) => s.id === quoteSupplierId);
    const price = Number(quotePrice);
    if (!sup || !Number.isFinite(price) || price <= 0) return;

    const newQuote: CanvassQuote = {
      id: `q-${Date.now()}`,
      supplierId: sup.id,
      supplierName: sup.name,
      materialId: quoteMaterialId,
      unitPrice: price,
      leadTimeDays: Number(quoteLeadDays) || 3,
      remarks: quoteRemarks,
    };

    onUpdateState((prev) => ({
      ...prev,
      canvasses: prev.canvasses.map((c) =>
        c.id === activeCanvass.id ? { ...c, quotes: [...c.quotes, newQuote] } : c
      ),
    }));
    setQuotePrice('');
  };

  const handlePickWinner = (canvassId: string, materialId: string, quoteId: string) => {
    if (!canModifyQuotes) return;
    onUpdateState((prev) => ({
      ...prev,
      canvasses: prev.canvasses.map((c) =>
        c.id === canvassId
          ? {
              ...c,
              quotes: c.quotes.map((q) =>
                q.materialId === materialId ? { ...q, isWinner: q.id === quoteId } : q
              ),
            }
          : c
      ),
    }));
  };

  const handleAutoAwardAndCreatePR = (cnv: Canvass) => {
    if (!canProcess) return;
    const req = state.requisitions.find((r) => r.id === cnv.reqId);
    if (!req) return;

    const prItems: PurchaseRequestItem[] = [];
    let estTotal = 0;
    let awardedTotal = 0;

    for (const rItem of req.items) {
      const matQuotes = cnv.quotes.filter((q) => q.materialId === rItem.materialId);
      if (matQuotes.length === 0) return;
      const chosen =
        matQuotes.find((q) => q.isWinner) ||
        [...matQuotes].sort((a, b) => a.unitPrice - b.unitPrice)[0];
      estTotal += rItem.qty * rItem.estUnitPrice;
      awardedTotal += rItem.qty * chosen.unitPrice;
      prItems.push({
        materialId: rItem.materialId,
        materialName: rItem.materialName,
        unit: rItem.unit,
        qty: rItem.qty,
        unitPrice: chosen.unitPrice,
        supplierId: chosen.supplierId,
        supplierName: chosen.supplierName,
      });
    }

    const prNo = nextCode(
      docPrefix('PR'),
      state.purchaseRequests.map((p) => p.prNo)
    );

    onUpdateState((prev) => ({
      ...prev,
      canvasses: prev.canvasses.map((c) =>
        c.id === cnv.id ? { ...c, status: 'PR Created' } : c
      ),
      requisitions: prev.requisitions.map((r) =>
        r.id === req.id ? { ...r, status: 'PR Generated' } : r
      ),
      purchaseRequests: [
        {
          id: `pr-${Date.now()}`,
          companyId: activeCompany.id,
          prNo,
          canvassId: cnv.id,
          canvassNo: cnv.canvassNo,
          reqNo: req.reqNo,
          projectId: req.projectId,
          department: req.department,
          dateCreated: todayISO(),
          status: 'Pending Note',
          totalAmount: awardedTotal,
          canvassSavings: Math.max(0, estTotal - awardedTotal),
          items: prItems,
          preparedBy: {
            employeeId: currentEmployee.id,
            name: currentEmployee.name,
            position: currentEmployee.position,
            date: todayISO(),
          },
        },
        ...prev.purchaseRequests,
      ],
    }));

    setActiveCanvassId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">Supplier Canvassing</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {activeCompany.name} ({activeCompany.code}) supplier quotations comparison, dynamic supplier onboarding, and PR generation.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-xs">
        <table className="w-full text-xs min-w-[760px]">
          <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Canvass No.</th>
              <th className="px-4 py-3 text-left font-semibold">Req Ref</th>
              <th className="px-4 py-3 text-left font-semibold">Project / Office</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-right font-semibold">Quotes</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {state.canvasses.map((cnv) => {
              const proj = state.projects.find((p) => p.id === cnv.projectId);
              return (
                <tr key={cnv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-semibold brand-text-primary">{cnv.canvassNo}</td>
                  <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{cnv.reqNo}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{proj?.name || cnv.projectId}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{cnv.category}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-slate-100 tabular-nums">{cnv.quotes.length}</td>
                  <td className="px-4 py-3"><StatusText status={cnv.status} /></td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                    {canPrint && (
                      <button
                        type="button"
                        onClick={() => onOpenPrint({ kind: 'doc-slip', docType: 'Canvass', refId: cnv.id })}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Slip
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => openCanvassModal(cnv)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold brand-btn-primary rounded-lg cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      {cnv.status === 'Open' && canModifyQuotes ? 'Encode Quotes' : 'View Abstract'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Encode Quotes & Award Modal */}
      {activeCanvass && activeReq && (
        <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl overflow-hidden my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                  Abstract of Canvass · {activeCanvass.canvassNo}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Requisition {activeReq.reqNo} · {activeReq.purpose}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveCanvassId(null)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {activeCanvass.status === 'Open' && canModifyQuotes && (
                <form onSubmit={handleAddQuote} className="brand-soft-surface border border-slate-200/80 dark:border-slate-700 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
                    <select
                      value={quoteSupplierId}
                      onChange={(e) => handleSupplierChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {state.suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                      {canCreate && (
                        <option value="__ADD_NEW__" className="font-bold">
                          + Add New Supplier…
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Item</label>
                    <select
                      value={quoteMaterialId}
                      onChange={(e) => setQuoteMaterialId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    >
                      {activeReq.items.map((it) => (
                        <option key={it.materialId} value={it.materialId}>
                          {it.materialName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Unit Price (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={quotePrice}
                      onChange={(e) => setQuotePrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                      required
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Days</label>
                    <input
                      type="number"
                      value={quoteLeadDays}
                      onChange={(e) => setQuoteLeadDays(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                    <input
                      type="text"
                      value={quoteRemarks}
                      onChange={(e) => setQuoteRemarks(e.target.value)}
                      placeholder="Terms / delivery"
                      className="w-full px-2.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div className="sm:col-span-10" />
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold brand-btn-primary rounded-lg cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Quote
                    </button>
                  </div>
                </form>
              )}

              {/* Comparison per item */}
              <div className="space-y-4">
                {activeReq.items.map((rItem) => {
                  const quotes = activeCanvass.quotes
                    .filter((q) => q.materialId === rItem.materialId)
                    .sort((a, b) => a.unitPrice - b.unitPrice);
                  const lowestId = quotes[0]?.id;

                  return (
                    <div key={rItem.materialId} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/80 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {rItem.materialName} · {rItem.qty} {rItem.unit}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          Budget Est: {formatPHP(rItem.estUnitPrice)}/{rItem.unit}
                        </span>
                      </div>

                      {quotes.length === 0 ? (
                        <div className="p-4 text-xs text-slate-500 dark:text-slate-400">
                          No supplier quotations encoded yet for this item.
                        </div>
                      ) : (
                        <table className="w-full text-xs">
                          <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                            <tr>
                              <th className="px-4 py-2 text-left">Supplier</th>
                              <th className="px-4 py-2 text-right">Unit Price</th>
                              <th className="px-4 py-2 text-right">Extended Total</th>
                              <th className="px-4 py-2 text-center">Lead Time</th>
                              <th className="px-4 py-2 text-right">Selection</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {quotes.map((q) => {
                              const isSelected = q.isWinner || (!quotes.some((x) => x.isWinner) && q.id === lowestId);
                              return (
                                <tr key={q.id} className={isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/30' : ''}>
                                  <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                                    {q.supplierName}
                                    {q.id === lowestId && (
                                      <span className="ml-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                                        Lowest Offer
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-mono text-slate-800 dark:text-slate-200 tabular-nums">
                                    {formatPHP(q.unitPrice)}
                                  </td>
                                  <td className="px-4 py-2.5 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                    {formatPHP(q.unitPrice * rItem.qty)}
                                  </td>
                                  <td className="px-4 py-2.5 text-center font-mono text-slate-700 dark:text-slate-300">{q.leadTimeDays}d</td>
                                  <td className="px-4 py-2.5 text-right">
                                    {activeCanvass.status === 'Open' && canModifyQuotes ? (
                                      <button
                                        type="button"
                                        onClick={() => handlePickWinner(activeCanvass.id, rItem.materialId, q.id)}
                                        className={`px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                                          isSelected
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                      >
                                        {isSelected ? 'Selected' : 'Select'}
                                      </button>
                                    ) : (
                                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                        {q.isWinner ? 'Awarded' : '—'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}
                    </div>
                  );
                })}
              </div>

              {activeCanvass.status === 'Open' && canProcess && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Each requested item requires at least 1 quote before generating Purchase Request.
                  </span>
                  <button
                    type="button"
                    disabled={activeReq.items.some(
                      (it) => !activeCanvass.quotes.some((q) => q.materialId === it.materialId)
                    )}
                    onClick={() => handleAutoAwardAndCreatePR(activeCanvass)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold brand-btn-primary disabled:opacity-40 rounded-lg cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    Award Winners &amp; Generate PR
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nested Modal: + Add New Supplier */}
      {showAddSupplier && canCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-display text-sm font-bold brand-text-primary">+ Add New {activeCompany.code} Supplier</h4>
              <button
                type="button"
                onClick={() => setShowAddSupplier(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNewSupplier} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Supplier Name</label>
                <input
                  type="text"
                  value={newSupForm.name}
                  onChange={(e) => setNewSupForm({ ...newSupForm, name: e.target.value })}
                  placeholder="e.g. Caraga Hardware & Aggregates"
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact No.</label>
                  <input
                    type="text"
                    value={newSupForm.contact}
                    onChange={(e) => setNewSupForm({ ...newSupForm, contact: e.target.value })}
                    placeholder="0917-xxx-xxxx"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Terms</label>
                  <input
                    type="text"
                    value={newSupForm.terms}
                    onChange={(e) => setNewSupForm({ ...newSupForm, terms: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold brand-btn-primary rounded-lg cursor-pointer"
                >
                  Save &amp; Select Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
