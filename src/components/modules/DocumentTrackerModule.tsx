import React, { useMemo, useState } from 'react';
import { AlertTriangle, FileCheck, Printer, Search } from 'lucide-react';
import { ERPState, ItemGroup, PrintDocument } from '../../types/erp';
import { findDuplicateRequisitions } from '../../utils/formatters';
import { StatusText } from '../StatusText';

interface DocumentTrackerModuleProps {
  state: ERPState;
  onOpenPrint: (doc: PrintDocument) => void;
}

export const DocumentTrackerModule: React.FC<DocumentTrackerModuleProps> = ({
  state,
  onOpenPrint,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Requisition' | 'Canvass'>('All');
  const [catFilter, setCatFilter] = useState<'All' | ItemGroup>('All');
  const [projFilter, setProjFilter] = useState('All');

  const records = useMemo(() => {
    const reqRows = state.requisitions.map((r) => {
      const dupes = findDuplicateRequisitions(
        r.projectId,
        r.items.map((it) => it.materialId),
        state.requisitions,
        r.id
      );
      return {
        id: r.id,
        trackingNo: r.reqNo,
        docType: 'Requisition' as const,
        category: r.category,
        projectId: r.projectId,
        actor: r.requestedBy,
        date: r.dateRequested,
        status: r.status,
        summary: r.items.map((it) => `${it.qty} ${it.unit} ${it.materialName}`).join(', '),
        possibleDuplicate: dupes.length > 0,
      };
    });

    const cnvRows = state.canvasses.map((c) => ({
      id: c.id,
      trackingNo: c.canvassNo,
      docType: 'Canvass' as const,
      category: c.category,
      projectId: c.projectId,
      actor: c.preparedBy,
      date: c.dateOpened,
      status: c.status,
      summary: `Linked to ${c.reqNo} · ${c.quotes.length} supplier quote(s)`,
      possibleDuplicate: false,
    }));

    return [...reqRows, ...cnvRows].sort((a, b) => b.date.localeCompare(a.date));
  }, [state.requisitions, state.canvasses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (typeFilter !== 'All' && r.docType !== typeFilter) return false;
      if (catFilter !== 'All' && r.category !== catFilter) return false;
      if (projFilter !== 'All' && r.projectId !== projFilter) return false;
      if (
        q &&
        !r.trackingNo.toLowerCase().includes(q) &&
        !r.summary.toLowerCase().includes(q) &&
        !r.actor.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [records, search, typeFilter, catFilter, projFilter]);

  const duplicateCount = records.filter((r) => r.possibleDuplicate).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Document Tracker (Electronic Logbook)</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Unified tracking log of all Requisitions &amp; Canvass transactions across Construction, ICT, and Office Supplies. Print routing slips for physical receiver signature.
        </p>
      </div>

      {/* Live Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-500">Total Logged Transactions</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">{records.length}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-[#2C6FE0] flex items-center justify-center">
            <FileCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-500">Requisitions / Canvasses</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-0.5 tabular-nums">
              {state.requisitions.length} / {state.canvasses.length}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-xs text-slate-500">Possible Duplicates Flagged</div>
            <div className={`text-xl font-bold font-mono mt-0.5 tabular-nums ${duplicateCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {duplicateCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracking no., item, person..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'All' | 'Requisition' | 'Canvass')}
          className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
        >
          <option value="All">All Document Types</option>
          <option value="Requisition">Requisition Only</option>
          <option value="Canvass">Canvass Only</option>
        </select>
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value as 'All' | ItemGroup)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
        >
          <option value="All">All Categories</option>
          <option value="Construction Materials">Construction Materials</option>
          <option value="ICT Equipment">ICT Equipment</option>
          <option value="General Supplies">General Supplies</option>
        </select>
        <select
          value={projFilter}
          onChange={(e) => setProjFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
        >
          <option value="All">All Projects / Offices</option>
          {state.projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-x-auto shadow-xs">
        <table className="w-full text-xs min-w-[820px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Tracking No.</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Project / Office</th>
              <th className="px-4 py-3 text-left">Summary</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Print Slip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((rec) => {
              const proj = state.projects.find((p) => p.id === rec.projectId);
              return (
                <tr key={`${rec.docType}-${rec.id}`} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-mono font-semibold text-[#123E82] whitespace-nowrap">
                    {rec.trackingNo}
                    {rec.possibleDuplicate && (
                      <span className="ml-2 text-[10px] font-sans font-bold text-amber-700">
                        (Possible Duplicate)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{rec.docType}</td>
                  <td className="px-4 py-3 text-slate-600">{rec.category}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{proj?.name || rec.projectId}</td>
                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{rec.summary}</td>
                  <td className="px-4 py-3 font-mono text-slate-600">{rec.date}</td>
                  <td className="px-4 py-3"><StatusText status={rec.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPrint({ kind: 'doc-slip', docType: rec.docType, refId: rec.id })
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#123E82] bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" /> Slip
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
