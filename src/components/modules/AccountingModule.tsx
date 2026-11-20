import React, { useMemo, useState } from 'react';
import { BookOpen, Plus, Scale, X } from 'lucide-react';
import { Employee, ERPState } from '../../types/erp';
import { formatPHP, nextCode, todayISO } from '../../utils/formatters';

interface AccountingModuleProps {
  state: ERPState;
  currentEmployee: Employee;
  onUpdateState: (updater: (prev: ERPState) => ERPState) => void;
}

type AccTab = 'gl' | 'trial' | 'apAging' | 'coa';

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  state,
  currentEmployee,
  onUpdateState,
}) => {
  const [tab, setTab] = useState<AccTab>('gl');
  const [showNewJe, setShowNewJe] = useState(false);
  const [jeDesc, setJeDesc] = useState('');
  const [jeRef, setJeRef] = useState('');
  const [debitCode, setDebitCode] = useState('1010');
  const [creditCode, setCreditCode] = useState('4010');
  const [amount, setAmount] = useState('');

  const trialBalance = useMemo(() => {
    const totals = new Map<string, { debit: number; credit: number }>();
    for (const acc of state.accounts) {
      totals.set(acc.code, { debit: 0, credit: 0 });
    }
    for (const je of state.journalEntries) {
      for (const l of je.lines) {
        const cur = totals.get(l.accountCode) || { debit: 0, credit: 0 };
        cur.debit += l.debit;
        cur.credit += l.credit;
        totals.set(l.accountCode, cur);
      }
    }

    const rows = state.accounts.map((acc) => {
      const t = totals.get(acc.code) || { debit: 0, credit: 0 };
      const net = t.debit - t.credit;
      return {
        ...acc,
        debitBal: net > 0 ? net : 0,
        creditBal: net < 0 ? Math.abs(net) : 0,
      };
    });

    const totalDebit = rows.reduce((s, r) => s + r.debitBal, 0);
    const totalCredit = rows.reduce((s, r) => s + r.creditBal, 0);
    return { rows, totalDebit, totalCredit };
  }, [state.accounts, state.journalEntries]);

  const apAging = useMemo(() => {
    const today = new Date();
    return state.vouchers
      .filter((v) => v.status === 'Pending Approval' || v.status === 'Approved')
      .map((v) => {
        const due = new Date(v.dueDate);
        const daysPast = Math.floor((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        const bucket =
          daysPast <= 0 ? 'Current' : daysPast <= 30 ? '1–30 Days' : daysPast <= 60 ? '31–60 Days' : '60+ Days';
        return { ...v, daysPast: Math.max(0, daysPast), bucket };
      });
  }, [state.vouchers]);

  const handlePostJE = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0 || debitCode === creditCode) return;
    const dAcc = state.accounts.find((a) => a.code === debitCode);
    const cAcc = state.accounts.find((a) => a.code === creditCode);
    if (!dAcc || !cAcc) return;

    const jeNo = nextCode(
      'JE',
      state.journalEntries.map((j) => j.jeNo)
    );

    onUpdateState((prev) => ({
      ...prev,
      journalEntries: [
        {
          id: `je-${Date.now()}`,
          jeNo,
          date: todayISO(),
          reference: jeRef.trim() || 'MANUAL',
          description: jeDesc.trim() || 'Manual Journal Entry',
          postedBy: currentEmployee.name,
          lines: [
            { accountCode: dAcc.code, accountName: dAcc.name, debit: amt, credit: 0 },
            { accountCode: cAcc.code, accountName: cAcc.name, debit: 0, credit: amt },
          ],
        },
        ...prev.journalEntries,
      ],
    }));

    setShowNewJe(false);
    setJeDesc('');
    setJeRef('');
    setAmount('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">Accounting &amp; General Ledger</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Double-entry general ledger auto-posted from receiving &amp; vouchers, live Trial Balance, and AP aging.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewJe(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-xl shadow-xs cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" /> Post Journal Entry
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl w-fit">
        {(
          [
            { id: 'gl', label: 'General Ledger' },
            { id: 'trial', label: 'Trial Balance' },
            { id: 'apAging', label: 'AP Aging' },
            { id: 'coa', label: 'Chart of Accounts' },
          ] as { id: AccTab; label: string }[]
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

      {/* General Ledger */}
      {tab === 'gl' && (
        <div className="space-y-4">
          {state.journalEntries.map((je) => (
            <div key={je.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-[#2C6FE0] dark:text-blue-400" />
                  <span className="font-mono font-bold text-[#123E82] dark:text-blue-300">{je.jeNo}</span>
                  <span className="font-medium text-slate-900 dark:text-slate-100">{je.description}</span>
                </div>
                <div className="font-mono text-slate-500 dark:text-slate-400">
                  {je.date} · Ref: {je.reference} · Posted by {je.postedBy}
                </div>
              </div>
              <table className="w-full text-xs">
                <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-2 text-left">Account Code</th>
                    <th className="px-5 py-2 text-left">Account Title</th>
                    <th className="px-5 py-2 text-right">Debit</th>
                    <th className="px-5 py-2 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {je.lines.map((l, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-2 font-mono text-[#123E82] dark:text-blue-300">{l.accountCode}</td>
                      <td className={`px-5 py-2 ${l.credit > 0 ? 'pl-10 text-slate-600 dark:text-slate-400' : 'font-medium text-slate-900 dark:text-slate-100'}`}>
                        {l.accountName}
                      </td>
                      <td className="px-5 py-2 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {l.debit > 0 ? formatPHP(l.debit) : '—'}
                      </td>
                      <td className="px-5 py-2 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                        {l.credit > 0 ? formatPHP(l.credit) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Trial Balance */}
      {tab === 'trial' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Scale className="w-4 h-4 text-[#2C6FE0] dark:text-blue-400" /> Trial Balance
            </div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              {Math.abs(trialBalance.totalDebit - trialBalance.totalCredit) < 0.01
                ? 'Balanced (DR = CR)'
                : 'Out of Balance'}
            </span>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Account Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-right">Debit Balance</th>
                <th className="px-4 py-3 text-right">Credit Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {trialBalance.rows.map((r) => (
                <tr key={r.code} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-mono text-[#123E82] dark:text-blue-300">{r.code}</td>
                  <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{r.name}</td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">{r.type}</td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {r.debitBal > 0 ? formatPHP(r.debitBal) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {r.creditBal > 0 ? formatPHP(r.creditBal) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-blue-50/70 dark:bg-blue-950/50 font-bold border-t border-slate-200 dark:border-slate-800">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right uppercase text-[11px] text-slate-700 dark:text-slate-200">
                  Total
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#123E82] dark:text-blue-300 tabular-nums">
                  {formatPHP(trialBalance.totalDebit)}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#123E82] dark:text-blue-300 tabular-nums">
                  {formatPHP(trialBalance.totalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* AP Aging */}
      {tab === 'apAging' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">DV No.</th>
                <th className="px-4 py-3 text-left">Supplier</th>
                <th className="px-4 py-3 text-left">Due Date</th>
                <th className="px-4 py-3 text-left">Aging Bucket</th>
                <th className="px-4 py-3 text-right">Unpaid Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {apAging.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 dark:text-slate-400">
                    All approved vouchers are currently settled.
                  </td>
                </tr>
              ) : (
                apAging.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-semibold text-[#123E82] dark:text-blue-300">{v.dvNo}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{v.supplierName}</td>
                    <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">{v.dueDate}</td>
                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">{v.bucket}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {formatPHP(v.invoiceAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Chart of Accounts */}
      {tab === 'coa' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 text-left">Account Code</th>
                <th className="px-4 py-3 text-left">Account Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Normal Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.accounts.map((a) => (
                <tr key={a.code} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-semibold text-[#123E82] dark:text-blue-300">{a.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{a.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.type}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{a.normalBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Journal Entry Modal */}
      {showNewJe && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handlePostJE} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">Post Manual Journal Entry</h3>
              <button type="button" onClick={() => setShowNewJe(false)} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Reference</label>
                <input
                  type="text"
                  value={jeRef}
                  onChange={(e) => setJeRef(e.target.value)}
                  placeholder="PB-2026-002"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (₱)</label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
              <input
                type="text"
                value={jeDesc}
                onChange={(e) => setJeDesc(e.target.value)}
                placeholder="e.g. Progress Billing Collection"
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg placeholder:text-slate-400 dark:placeholder:text-slate-500"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Debit Account</label>
                <select
                  value={debitCode}
                  onChange={(e) => setDebitCode(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {state.accounts.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} · {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Credit Account</label>
                <select
                  value={creditCode}
                  onChange={(e) => setCreditCode(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                >
                  {state.accounts.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} · {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowNewJe(false)} className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 text-xs font-semibold text-white bg-[#2C6FE0] hover:bg-[#1E56B8] rounded-lg cursor-pointer">
                Post Entry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
