import React from 'react';
import { Printer, X } from 'lucide-react';
import { Employee, ERPState, PrintDocument, SignatoryStamp } from '../types/erp';
import { formatPHP } from '../utils/formatters';
import { RfbLogo } from './RfbLogo';

interface PrintPreviewModalProps {
  doc: PrintDocument;
  state: ERPState;
  onClose: () => void;
}

function findEmployeeSignature(
  employees: Employee[],
  employeeId?: string,
  name?: string
): string | undefined {
  if (employeeId) {
    const byId = employees.find((e) => e.id === employeeId);
    if (byId?.signatureDataUrl) return byId.signatureDataUrl;
  }
  if (name) {
    const byName = employees.find((e) => e.name.toLowerCase() === name.toLowerCase());
    if (byName?.signatureDataUrl) return byName.signatureDataUrl;
  }
  return undefined;
}

const SigBlock: React.FC<{
  label: string;
  stamp?: SignatoryStamp;
  employees: Employee[];
}> = ({ label, stamp, employees }) => {
  const sigUrl = stamp ? findEmployeeSignature(employees, stamp.employeeId, stamp.name) : undefined;
  return (
    <div className="border border-slate-300 rounded-lg p-3 flex flex-col justify-between min-h-[120px] bg-white">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="h-12 flex items-center justify-center my-1">
        {sigUrl ? (
          <img
            src={sigUrl}
            alt={`${stamp?.name} signature`}
            className="max-h-11 max-w-full object-contain"
          />
        ) : (
          <div className="w-full border-b border-slate-400 mt-6" />
        )}
      </div>
      <div className="text-center border-t border-slate-200 pt-1.5">
        <div className="text-xs font-bold text-slate-900 leading-tight">
          {stamp?.name || '______________________'}
        </div>
        <div className="text-[10px] text-slate-500">{stamp?.position || 'Authorized Signatory'}</div>
        {stamp?.date && <div className="text-[10px] font-mono text-slate-400 mt-0.5">{stamp.date}</div>}
      </div>
    </div>
  );
};

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({ doc, state, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const renderContent = () => {
    if (doc.kind === 'pr') {
      const pr = state.purchaseRequests.find((p) => p.id === doc.prId);
      if (!pr) return <div className="p-8 text-sm text-slate-500">Purchase Request not found.</div>;
      const proj = state.projects.find((p) => p.id === pr.projectId);
      const isApproved = pr.status === 'Approved' || pr.status === 'PO Generated';

      return (
        <div className="space-y-6 text-slate-900">
          {/* Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-[#123E82] pb-4">
            <div className="flex items-center gap-3">
              <RfbLogo size="lg" showText={false} />
              <div>
                <h1 className="font-display text-xl font-extrabold text-[#123E82]">
                  RFB CONSTRUCTION CORPORATION
                </h1>
                <p className="text-xs text-slate-600">
                  General Engineering, Roads, Bridges &amp; Vertical Structures · Malaybalay City, Bukidnon
                </p>
                <p className="text-[11px] text-slate-500">
                  TIN: 009-482-119-000 · procurement@rfbconstruction.ph
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-[#2C6FE0]">
                Official Purchase Request
              </div>
              <div className="font-mono text-lg font-bold text-slate-900">{pr.prNo}</div>
              <div className="text-[11px] text-slate-500 font-mono">Date: {pr.dateCreated}</div>
            </div>
          </div>

          {/* Metadata & Stamp */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-2 text-xs flex-1">
              <div>
                <span className="text-slate-500 block">Project Site</span>
                <span className="font-semibold text-slate-900">{proj?.name || pr.projectId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Location</span>
                <span className="font-semibold text-slate-900">{proj?.location || 'Bukidnon'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Department</span>
                <span className="font-semibold text-slate-900">{pr.department}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Requisition Ref</span>
                <span className="font-mono font-semibold text-slate-900">{pr.reqNo}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Canvass Ref</span>
                <span className="font-mono font-semibold text-slate-900">{pr.canvassNo}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Canvass Savings</span>
                <span className="font-mono font-semibold text-emerald-700">{formatPHP(pr.canvassSavings)}</span>
              </div>
            </div>

            {isApproved && (
              <div className="border-4 border-emerald-600 text-emerald-700 px-4 py-1.5 rounded-lg font-display font-extrabold text-sm tracking-widest uppercase -rotate-3 select-none">
                APPROVED
              </div>
            )}
          </div>

          {/* Items Table */}
          <div>
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-[#123E82] text-white">
                  <th className="p-2.5 text-left border border-slate-300">#</th>
                  <th className="p-2.5 text-left border border-slate-300">Item Description</th>
                  <th className="p-2.5 text-left border border-slate-300">Awarded Supplier</th>
                  <th className="p-2.5 text-right border border-slate-300">Qty</th>
                  <th className="p-2.5 text-left border border-slate-300">Unit</th>
                  <th className="p-2.5 text-right border border-slate-300">Unit Cost</th>
                  <th className="p-2.5 text-right border border-slate-300">Line Total</th>
                </tr>
              </thead>
              <tbody>
                {pr.items.map((item, idx) => (
                  <tr key={`${item.materialId}-${idx}`} className="odd:bg-white even:bg-slate-50">
                    <td className="p-2.5 border border-slate-300 font-mono">{idx + 1}</td>
                    <td className="p-2.5 border border-slate-300 font-medium">{item.materialName}</td>
                    <td className="p-2.5 border border-slate-300">{item.supplierName}</td>
                    <td className="p-2.5 border border-slate-300 text-right font-mono tabular-nums">{item.qty}</td>
                    <td className="p-2.5 border border-slate-300">{item.unit}</td>
                    <td className="p-2.5 border border-slate-300 text-right font-mono tabular-nums">
                      {formatPHP(item.unitPrice)}
                    </td>
                    <td className="p-2.5 border border-slate-300 text-right font-mono font-semibold tabular-nums">
                      {formatPHP(item.qty * item.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50/70 font-bold">
                  <td colSpan={6} className="p-2.5 border border-slate-300 text-right uppercase text-[11px]">
                    Total Approved Purchase Amount
                  </td>
                  <td className="p-2.5 border border-slate-300 text-right font-mono text-sm text-[#123E82] tabular-nums">
                    {formatPHP(pr.totalAmount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4 Signatory Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <SigBlock label="Prepared By" stamp={pr.preparedBy} employees={state.employees} />
            <SigBlock label="Noted By" stamp={pr.notedBy} employees={state.employees} />
            <SigBlock
              label="Recommending Approval"
              stamp={pr.recommendingApprovalBy}
              employees={state.employees}
            />
            <SigBlock label="Approved By" stamp={pr.approvedBy} employees={state.employees} />
          </div>
        </div>
      );
    }

    if (doc.kind === 'borrower-slip') {
      const br = state.borrowRequests.find((b) => b.id === doc.borrowId);
      if (!br) return <div className="p-8 text-sm text-slate-500">Borrow request not found.</div>;
      const tool = state.tools.find((t) => t.id === br.toolId);
      const proj = state.projects.find((p) => p.id === br.projectId);
      const custodianSig = findEmployeeSignature(state.employees, br.releasedByEmployeeId, br.releasedBy);
      const borrowerSig = findEmployeeSignature(state.employees, br.borrowerEmployeeId, br.borrowerName);

      return (
        <div className="space-y-5 text-slate-900">
          {/* Header: Title/Tagline on LEFT, RFB Logo on RIGHT */}
          <div className="flex items-center justify-between border-b-2 border-[#123E82] pb-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#2C6FE0]">
                Warehouse &amp; Asset Control Form
              </div>
              <h1 className="font-display text-xl font-extrabold text-[#123E82]">
                TOOLS &amp; EQUIPMENT BORROWER SLIP
              </h1>
              <p className="text-xs text-slate-600">
                RFB Construction Corporation · Malaybalay City, Bukidnon
              </p>
              <p className="text-xs font-mono font-semibold text-slate-800 mt-1">
                Slip No: {br.trNo} · Status: {br.status}
              </p>
            </div>
            <div className="shrink-0">
              <RfbLogo size="lg" showText={true} align="right" />
            </div>
          </div>

          {/* Borrower & Tool Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-300 rounded-xl p-4 space-y-1.5 text-xs">
              <div className="font-bold text-[#123E82] uppercase text-[11px] mb-2">Borrower Details</div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Borrower Name:</span>
                <span className="font-semibold text-right">{br.borrowerName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Position / Dept:</span>
                <span className="font-medium text-right">
                  {br.borrowerPosition} · {br.department}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Project Site:</span>
                <span className="font-medium text-right">{proj?.name || br.projectId}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Purpose:</span>
                <span className="font-medium text-right">{br.purpose}</span>
              </div>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 space-y-1.5 text-xs">
              <div className="font-bold text-[#123E82] uppercase text-[11px] mb-2">Equipment &amp; Release Info</div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Asset ID:</span>
                <span className="font-mono font-bold text-right">{br.toolAssetCode}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Tool / Equipment:</span>
                <span className="font-semibold text-right">{br.toolName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Brand / Serial No.:</span>
                <span className="font-mono text-right">
                  {tool?.brandModel || '—'} · {tool?.serialNo || '—'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Release / Due Date:</span>
                <span className="font-mono text-right">
                  {br.releaseDate || br.requestDate} → {br.expectedReturnDate}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Condition at Release:</span>
                <span className="font-medium text-right">{br.releaseCondition || tool?.condition || 'Good'}</span>
              </div>
            </div>
          </div>

          {/* Return Acknowledgement */}
          <div className="border border-slate-300 rounded-xl p-4 text-xs space-y-2">
            <div className="font-bold text-[#123E82] uppercase text-[11px]">Return Acknowledgement</div>
            {br.status === 'Returned' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 block">Date Returned</span>
                  <span className="font-mono font-semibold">{br.returnedDate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Return Condition</span>
                  <span className="font-semibold">{br.returnCondition}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Checked By</span>
                  <span className="font-semibold">{br.receivedByCustodian}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Remarks</span>
                  <span>{br.returnRemarks || 'No issues'}</span>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 pt-3 text-slate-600">
                <div>Date Returned: _____________________</div>
                <div>Condition: [ ] Good  [ ] Damaged</div>
                <div>Inspected By: _____________________</div>
              </div>
            )}
          </div>

          {/* E-Signature Blocks */}
          <div className="grid grid-cols-2 gap-6 pt-2">
            <div className="border border-slate-300 rounded-lg p-3.5 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-500">Released By (Warehouse Custodian)</div>
              <div className="h-14 flex items-center justify-center my-1">
                {custodianSig ? (
                  <img src={custodianSig} alt="Custodian Signature" className="max-h-12 object-contain" />
                ) : (
                  <div className="w-4/5 border-b border-slate-400 mt-8" />
                )}
              </div>
              <div className="text-xs font-bold">{br.releasedBy || 'Ramil Torres'}</div>
              <div className="text-[10px] text-slate-500">Warehouse Custodian · {br.releaseDate || 'Pending Release'}</div>
            </div>

            <div className="border border-slate-300 rounded-lg p-3.5 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-500">Received By (Borrower)</div>
              <div className="h-14 flex items-center justify-center my-1">
                {borrowerSig ? (
                  <img src={borrowerSig} alt="Borrower Signature" className="max-h-12 object-contain" />
                ) : (
                  <div className="w-4/5 border-b border-slate-400 mt-8" />
                )}
              </div>
              <div className="text-xs font-bold">{br.borrowerName}</div>
              <div className="text-[10px] text-slate-500">{br.borrowerPosition} · {br.requestDate}</div>
            </div>
          </div>
        </div>
      );
    }

    if (doc.kind === 'doc-slip') {
      const isReq = doc.docType === 'Requisition';
      const req = isReq
        ? state.requisitions.find((r) => r.id === doc.refId)
        : undefined;
      const cnv = !isReq ? state.canvasses.find((c) => c.id === doc.refId) : undefined;
      const linkedReq = cnv ? state.requisitions.find((r) => r.id === cnv.reqId) : req;
      const proj = state.projects.find((p) => p.id === (req?.projectId || cnv?.projectId));

      const trackingNo = req?.reqNo || cnv?.canvassNo || doc.refId;
      const category = req?.category || cnv?.category || 'Construction Materials';
      const dateStr = req?.dateRequested || cnv?.dateOpened || '';
      const status = req?.status || cnv?.status || '';

      return (
        <div className="space-y-5 text-slate-900">
          <div className="flex items-start justify-between border-b-2 border-[#123E82] pb-4">
            <div className="flex items-center gap-3">
              <RfbLogo size="lg" showText={false} />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#2C6FE0]">
                  Document Control &amp; Routing Slip
                </div>
                <h1 className="font-display text-lg font-extrabold text-[#123E82]">
                  RFB CONSTRUCTION SYSTEM — TRACKING SLIP
                </h1>
                <p className="text-xs text-slate-500">Malaybalay City, Bukidnon · Electronic Logbook Replacement</p>
              </div>
            </div>
            <div className="text-right">
              <div className="font-mono text-base font-bold text-slate-900">{trackingNo}</div>
              <div className="text-xs text-slate-500">{doc.docType} · {status}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
            <div>
              <span className="text-slate-500 block">Transaction Type</span>
              <span className="font-semibold">{doc.docType}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Category</span>
              <span className="font-semibold">{category}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Project / Office</span>
              <span className="font-semibold">{proj?.name || '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Date Logged</span>
              <span className="font-mono font-semibold">{dateStr}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Routing Path</span>
              <span className="font-semibold">
                {linkedReq?.department || 'Operations'} → Procurement &amp; Canvassing Office
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Prepared / Requested By</span>
              <span className="font-semibold">{req?.requestedBy || cnv?.preparedBy || '—'}</span>
            </div>
          </div>

          {linkedReq && (
            <table className="w-full text-xs border-collapse border border-slate-300">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 text-left border border-slate-300">#</th>
                  <th className="p-2 text-left border border-slate-300">Item Description</th>
                  <th className="p-2 text-right border border-slate-300">Qty</th>
                  <th className="p-2 text-left border border-slate-300">Unit</th>
                </tr>
              </thead>
              <tbody>
                {linkedReq.items.map((it, idx) => (
                  <tr key={`${it.materialId}-${idx}`}>
                    <td className="p-2 border border-slate-300 font-mono">{idx + 1}</td>
                    <td className="p-2 border border-slate-300">{it.materialName}</td>
                    <td className="p-2 border border-slate-300 text-right font-mono">{it.qty}</td>
                    <td className="p-2 border border-slate-300">{it.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Physical Signature Section for Paper Receiver */}
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#123E82]">
              Physical Receiving Acknowledgement (Sign on Printed Copy)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-xs">
              <div>
                <div className="border-b border-slate-500 h-8" />
                <div className="text-slate-600 mt-1 font-medium">Received By (Printed Name)</div>
              </div>
              <div>
                <div className="border-b border-slate-500 h-8" />
                <div className="text-slate-600 mt-1 font-medium">Signature</div>
              </div>
              <div>
                <div className="border-b border-slate-500 h-8" />
                <div className="text-slate-600 mt-1 font-medium">Date &amp; Time Received</div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Report printout
    return (
      <div className="space-y-5 text-slate-900">
        <div className="flex items-start justify-between border-b-2 border-[#123E82] pb-4">
          <div className="flex items-center gap-3">
            <RfbLogo size="lg" showText={false} />
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#2C6FE0]">
                {doc.moduleName} Management Report
              </div>
              <h1 className="font-display text-xl font-extrabold text-[#123E82]">{doc.title}</h1>
              <p className="text-xs text-slate-500">
                RFB Construction Corporation · Bukidnon · Period: {doc.periodLabel}
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div>Generated: {new Date().toLocaleDateString('en-PH')}</div>
            <div className="font-semibold">By: {doc.generatedBy}</div>
          </div>
        </div>

        <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-slate-600">
          Filters applied: <span className="font-medium text-slate-900">{doc.filtersSummary}</span>
        </div>

        {doc.summaryCards.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {doc.summaryCards.map((c) => (
              <div key={c.label} className="border border-slate-200 rounded-lg p-3">
                <div className="text-[11px] text-slate-500">{c.label}</div>
                <div className="text-sm font-bold font-mono text-slate-900 mt-0.5">{c.value}</div>
              </div>
            ))}
          </div>
        )}

        <table className="w-full text-xs border-collapse border border-slate-300">
          <thead>
            <tr className="bg-[#123E82] text-white">
              {doc.columns.map((col) => (
                <th key={col} className="p-2 text-left border border-slate-300">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doc.rows.length === 0 ? (
              <tr>
                <td colSpan={doc.columns.length} className="p-4 text-center text-slate-500">
                  No matching records for the selected period and filters.
                </td>
              </tr>
            ) : (
              doc.rows.map((row, idx) => (
                <tr key={idx} className="odd:bg-white even:bg-slate-50">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2 border border-slate-300 font-mono text-[11px]">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4 print-only-container overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col print-sheet">
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 no-print">
          <div className="text-sm font-semibold text-slate-900">Print &amp; Export Preview</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              aria-label="Close Print Preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">{renderContent()}</div>
      </div>
    </div>
  );
};
