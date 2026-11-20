import React, { useState } from 'react';
import { AlertTriangle, Plus, Printer, Send, Trash2, X } from 'lucide-react';
import { Employee, ERPState, ItemGroup, PrintDocument, Requisition, RequisitionItem } from '../../types/erp';
import { findDuplicateRequisitions, formatPHP, nextCode, todayISO } from '../../utils/formatters';
import { StatusText } from '../StatusText';

interface RequisitionsModuleProps {
  state: ERPState;
  currentEmployee: Employee;
  onUpdateState: (updater: (prev: ERPState) => ERPState) => void;
  onOpenPrint: (doc: PrintDocument) => void;
}

const ITEM_GROUPS: ItemGroup[] = ['Construction Materials', 'ICT Equipment', 'General Supplies'];

export const RequisitionsModule: React.FC<RequisitionsModuleProps> = ({
  state,
  currentEmployee,
  onUpdateState,
  onOpenPrint,
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [filterCat, setFilterCat] = useState<'All' | ItemGroup>('All');
  const [projectId, setProjectId] = useState(state.projects[0]?.id || '');
  const [category, setCategory] = useState<ItemGroup>('Construction Materials');
  const [dateNeeded, setDateNeeded] = useState(todayISO());
  const [purpose, setPurpose] = useState('');
  const [lineItems, setLineItems] = useState<RequisitionItem[]>([
    {
      materialId: state.materials[0]?.id || '',
      materialName: state.materials[0]?.name || '',
      unit: state.materials[0]?.unit || 'Bag',
      qty: 10,
      estUnitPrice: state.materials[0]?.standardCost || 250,
    },
  ]);

  // Nested "+ Add New Item..." modal state
  const [addItemForRow, setAddItemForRow] = useState<number | null>(null);
  const [newItemForm, setNewItemForm] = useState({
    name: '',
    group: 'Construction Materials' as ItemGroup,
    category: 'General',
    unit: 'Piece',
    standardCost: '500',
  });

  // Duplicate warning modal state
  const [duplicateMatches, setDuplicateMatches] = useState<Requisition[] | null>(null);

  const handleSelectMaterial = (rowIdx: number, val: string) => {
    if (val === '__ADD_NEW__') {
      setNewItemForm({
        name: '',
        group: category,
        category: category === 'ICT Equipment' ? 'Computing' : category === 'General Supplies' ? 'Office' : 'Construction',
        unit: 'Piece',
        standardCost: '500',
      });
      setAddItemForRow(rowIdx);
      return;
    }
    const mat = state.materials.find((m) => m.id === val);
    if (!mat) return;
    setLineItems((prev) =>
      prev.map((it, i) =>
        i === rowIdx
          ? {
              ...it,
              materialId: mat.id,
              materialName: mat.name,
              unit: mat.unit,
              estUnitPrice: mat.standardCost,
            }
          : it
      )
    );
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name.trim() || addItemForRow === null) return;
    const newId = `mat-${Date.now()}`;
    const newCode = `MAT-${String(state.materials.length + 1).padStart(3, '0')}`;
    const cost = Number(newItemForm.standardCost) || 0;
    const created = {
      id: newId,
      code: newCode,
      name: newItemForm.name.trim(),
      group: newItemForm.group,
      category: newItemForm.category.trim() || 'General',
      unit: newItemForm.unit.trim() || 'Piece',
      standardCost: cost,
    };

    onUpdateState((prev) => ({
      ...prev,
      materials: [...prev.materials, created],
    }));

    setLineItems((prev) =>
      prev.map((it, i) =>
        i === addItemForRow
          ? {
              ...it,
              materialId: created.id,
              materialName: created.name,
              unit: created.unit,
              estUnitPrice: created.standardCost,
            }
          : it
      )
    );
    setAddItemForRow(null);
  };

  const commitRequisition = () => {
    const reqNo = nextCode(
      'REQ',
      state.requisitions.map((r) => r.reqNo)
    );
    const newReq: Requisition = {
      id: `req-${Date.now()}`,
      reqNo,
      projectId,
      department: currentEmployee.department,
      category,
      requestedBy: currentEmployee.name,
      dateRequested: todayISO(),
      dateNeeded,
      purpose: purpose.trim() || `${category} request`,
      status: 'For Canvassing',
      items: lineItems.filter((it) => it.materialId && it.qty > 0),
    };

    onUpdateState((prev) => ({
      ...prev,
      requisitions: [newReq, ...prev.requisitions],
    }));

    setDuplicateMatches(null);
    setShowCreate(false);
    setPurpose('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = lineItems.filter((it) => it.materialId && it.qty > 0);
    if (validItems.length === 0) return;

    const dupes = findDuplicateRequisitions(
      projectId,
      validItems.map((it) => it.materialId),
      state.requisitions
    );

    if (dupes.length > 0) {
      setDuplicateMatches(dupes);
      return;
    }
    commitRequisition();
  };

  const handleOpenCanvass = (req: Requisition) => {
    const alreadyExists = state.canvasses.some((c) => c.reqId === req.id);
    if (alreadyExists) return;
    const canvassNo = nextCode(
      'CNV',
      state.canvasses.map((c) => c.canvassNo)
    );
    onUpdateState((prev) => ({
      ...prev,
      requisitions: prev.requisitions.map((r) =>
        r.id === req.id ? { ...r, status: 'For Canvassing' } : r
      ),
      canvasses: [
        {
          id: `cnv-${Date.now()}`,
          canvassNo,
          reqId: req.id,
          reqNo: req.reqNo,
          projectId: req.projectId,
          category: req.category,
          dateOpened: todayISO(),
          preparedBy: currentEmployee.name,
          status: 'Open',
          quotes: [],
        },
        ...prev.canvasses,
      ],
    }));
  };

  const filteredReqs =
    filterCat === 'All'
      ? state.requisitions
      : state.requisitions.filter((r) => r.category === filterCat);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Material &amp; Supply Requisitions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Construction materials, ICT equipment, and general supplies with automatic duplicate detection.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-xl shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          New Requisition
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
        {(['All', ...ITEM_GROUPS] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilterCat(cat)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              filterCat === cat
                ? 'bg-white text-[#123E82] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Requisitions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="w-full text-xs min-w-[780px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Req No.</th>
              <th className="px-4 py-3 text-left font-semibold">Category</th>
              <th className="px-4 py-3 text-left font-semibold">Project / Office</th>
              <th className="px-4 py-3 text-left font-semibold">Items Summary</th>
              <th className="px-4 py-3 text-right font-semibold">Est. Amount</th>
              <th className="px-4 py-3 text-left font-semibold">Requested By</th>
              <th className="px-4 py-3 text-left font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReqs.map((req) => {
              const proj = state.projects.find((p) => p.id === req.projectId);
              const totalEst = req.items.reduce((s, it) => s + it.qty * it.estUnitPrice, 0);
              const hasCanvass = state.canvasses.some((c) => c.reqId === req.id);
              return (
                <tr key={req.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono font-semibold text-[#123E82] whitespace-nowrap">
                    {req.reqNo}
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{req.category}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{proj?.name || req.projectId}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{req.dateRequested}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs">
                    {req.items.map((it) => `${it.qty} ${it.unit} ${it.materialName}`).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums whitespace-nowrap">
                    {formatPHP(totalEst)}
                  </td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{req.requestedBy}</td>
                  <td className="px-4 py-3">
                    <StatusText status={req.status} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPrint({ kind: 'doc-slip', docType: 'Requisition', refId: req.id })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Slip
                    </button>
                    {!hasCanvass && req.status !== 'Cancelled' && (
                      <button
                        type="button"
                        onClick={() => handleOpenCanvass(req)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#123E82] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Open Canvass
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* New Requisition Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden my-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">Create New Requisition</h3>
                <p className="text-xs text-slate-500">
                  Requested by {currentEmployee.name} ({currentEmployee.department})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project / Office</label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {state.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ItemGroup)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {ITEM_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Needed</label>
                  <input
                    type="date"
                    value={dateNeeded}
                    onChange={(e) => setDateNeeded(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Purpose / Justification</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Describe project phase or office requirement"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Requested Items</span>
                  <button
                    type="button"
                    onClick={() =>
                      setLineItems((prev) => [
                        ...prev,
                        {
                          materialId: state.materials[0]?.id || '',
                          materialName: state.materials[0]?.name || '',
                          unit: state.materials[0]?.unit || 'Piece',
                          qty: 1,
                          estUnitPrice: state.materials[0]?.standardCost || 0,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#2C6FE0] hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Line
                  </button>
                </div>

                {lineItems.map((it, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <div className="col-span-6">
                      <select
                        value={it.materialId}
                        onChange={(e) => handleSelectMaterial(idx, e.target.value)}
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        {ITEM_GROUPS.map((grp) => (
                          <optgroup key={grp} label={grp}>
                            {state.materials
                              .filter((m) => m.group === grp)
                              .map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name} ({m.unit})
                                </option>
                              ))}
                          </optgroup>
                        ))}
                        <option value="__ADD_NEW__" className="font-bold text-[#123E82]">
                          + Add New Item…
                        </option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) =>
                          setLineItems((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, qty: Math.max(1, Number(e.target.value)) } : row
                            )
                          )
                        }
                        className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-lg font-mono text-right bg-white"
                      />
                    </div>
                    <div className="col-span-3 text-right font-mono text-xs text-slate-700 tabular-nums">
                      {formatPHP(it.qty * it.estUnitPrice)}
                    </div>
                    <div className="col-span-1 text-right">
                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer"
                >
                  Submit Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal-on-top-of-modal: + Add New Item */}
      {addItemForRow !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <h4 className="font-display text-sm font-bold text-[#123E82]">+ Add New Item to Catalog</h4>
              <button
                type="button"
                onClick={() => setAddItemForRow(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNewItem} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material / Item Name</label>
                <input
                  type="text"
                  value={newItemForm.name}
                  onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  placeholder="e.g. Galvanized Tie Wire #16"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Group</label>
                  <select
                    value={newItemForm.group}
                    onChange={(e) => setNewItemForm({ ...newItemForm, group: e.target.value as ItemGroup })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {ITEM_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={newItemForm.unit}
                    onChange={(e) => setNewItemForm({ ...newItemForm, unit: e.target.value })}
                    placeholder="Roll, Bag, Unit"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Unit Cost (₱)</label>
                <input
                  type="number"
                  value={newItemForm.standardCost}
                  onChange={(e) => setNewItemForm({ ...newItemForm, standardCost: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAddItemForRow(null)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer"
                >
                  Save &amp; Select Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Detection Warning Modal */}
      {duplicateMatches && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-amber-300 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-amber-50 border-b border-amber-200 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="font-display text-sm font-bold text-amber-950">Possible Duplicate Requisition Detected</h4>
                <p className="text-xs text-amber-800">
                  Existing open request(s) on the same project already include one or more of these items.
                </p>
              </div>
            </div>
            <div className="p-6 space-y-3">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {duplicateMatches.map((d) => (
                  <div key={d.id} className="border border-slate-200 rounded-xl p-3 text-xs bg-slate-50">
                    <div className="flex items-center justify-between font-semibold text-slate-900">
                      <span className="font-mono text-[#123E82]">{d.reqNo}</span>
                      <span>{d.dateRequested} · {d.status}</span>
                    </div>
                    <div className="text-slate-600 mt-1">
                      Items: {d.items.map((it) => `${it.qty} ${it.unit} ${it.materialName}`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDuplicateMatches(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Go Back &amp; Review
                </button>
                <button
                  type="button"
                  onClick={commitRequisition}
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg cursor-pointer"
                >
                  Proceed Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
