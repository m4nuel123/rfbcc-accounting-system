import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, BookOpen, Plus, Scale, Wallet, X } from 'lucide-react';
import { Company, Employee, ERPState, PermissionId } from '../../types/erp';
import { formatPHP, nextCode, todayISO } from '../../utils/formatters';

interface AccountingModuleProps {
  state: ERPState;
  currentEmployee: Employee;
  activeCompany: Company;
  can: (perm: PermissionId) => boolean;
  onUpdateState: (updater: (prev: ERPState) => ERPState) => void;
}

type AccTab = 'gl' | 'cashAr' | 'trial' | 'apAging' | 'coa';

export const AccountingModule: React.FC<AccountingModuleProps> = ({
  state,
  currentEmployee,
  activeCompany,
  can,
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

  const cashArSummary = useMemo(() => {
    let cashIn = 0;
    let cashOut = 0;
    let arBilled = 0;
    let arCollected = 0;
    let expensesTotal = 0;

    const cashReceipts: { id: string; jeNo: string; date: string; ref: string; desc: string; amount: number }[] = [];
    const cashDisbursements: { id: string; jeNo: string; date: string; ref: string; desc: string; amount: number }[] = [];
    const arEntries: { id: string; jeNo: string; date: string; ref: string; desc: string; billed: number; collected: number }[] = [];
    const expenseEntries: { id: string; jeNo: string; date: string; ref: string; account: string; desc: string; amount: number }[] = [];

    for (const je of state.journalEntries) {
      for (const l of je.lines) {
        if (l.accountCode === '1010') {
          if (l.debit > 0) {
            cashIn += l.debit;
            cashReceipts.push({ id: `${je.id}-in`, jeNo: je.jeNo, date: je.date, ref: je.reference, desc: je.description, amount: l.debit });
          }
          if (l.credit > 0) {
            cashOut += l.credit;
            cashDisbursements.push({ id: `${je.id}-out`, jeNo: je.jeNo, date: je.date, ref: je.reference, desc: je.description, amount: l.credit });
          }
        }
        if (l.accountCode === '1100') {
          arBilled += l.debit;
          arCollected += l.credit;
          arEntries.push({
            id: `${je.id}-ar`,
            jeNo: je.jeNo,
            date: je.date,
            ref: je.reference,
            desc: je.description,
            billed: l.debit,
            collected: l.credit,
          });
        }
        if (l.accountCode.startsWith('5')) {
          const netExp = l.debit - l.credit;
          expensesTotal += netExp;
          if (netExp > 0) {
            expenseEntries.push({
              id: `${je.id}-${l.accountCode}`,
              jeNo: je.jeNo,
              date: je.date,
              ref: je.reference,
              account: `${l.accountCode} ${l.accountName}`,
              desc: je.description,
              amount: netExp,
            });
          }
        }
      }
    }

    return {
      cashBalance: cashIn - cashOut,
      cashIn,
      cashOut,
      arOutstanding: Math.max(0, arBilled - arCollected),
      expensesTotal,
      cashReceipts,
      cashDisbursements,
      arEntries,
      expenseEntries,
    };
  }, [state.journalEntries]);

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

  const openPresetModal = (preset: 'billing' | 'receipt' | 'expense') => {
    if (preset === 'billing') {
      setDebitCode('1100');
      setCreditCode('4010');
      setJeRef('PB-2026-002');
      setJeDesc('Progress Billing recognized on active construction contract');
    } else if (preset === 'receipt') {
      setDebitCode('1010');
      setCreditCode('1100');
      setJeRef('OR-2026-0115');
      setJeDesc('Cash Receipt collection against Progress Billing AR');
    } else {
      setDebitCode('5030');
      setCreditCode('1010');
      setJeRef('EXP-2026-004');
      setJeDesc('Direct cash disbursement for site & administrative operating expense');
    }
    setAmount('');
    setShowNewJe(true);
  };

  const handlePostJE = (e: React.FormEvent) => {
    e.preventDefault();
    if (!can('create_transactions')) return;
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0 || debitCode === creditCode) return;
    const dAcc = state.accounts.find((a) => a.code === debitCode);
    const cAcc = state.accounts.find((a) => a.code === creditCode);
    if (!dAcc || !cAcc) return;

    const jePrefix = activeCompany.code === 'RFB' ? 'JE' : `${activeCompany.code}-JE`;
    const jeNo = nextCode(
      jePrefix,
      state.journalEntries.map((j) => j.jeNo)
    );

    onUpdateState((prev) => ({
      ...prev,
      journalEntries: [
        {
          id: `je-${Date.now()}`,
          companyId: activeCompany.id,
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
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Accounting &amp; General Ledger
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {activeCompany.name} ({activeCompany.code}) double-entry GL, Accounts Receivable, Cash Receipts, Cash Disbursement, Expenses &amp; AP Aging.
          </p>
        </div>

        {can('create_transactions') && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openPresetModal('receipt')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl cursor-pointer whitespace-nowrap"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" /> Record Cash Receipt
            </button>
            <button
              type="button"
              onClick={() => {
                setJeDesc('');
                setJeRef('');
                setAmount('');
                setDebitCode('1010');
                setCreditCode('4010');
                setShowNewJe(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold brand-btn-primary rounded-xl shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Post Journal Entry
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl w-fit">
        {(
          [
            { id: 'gl', label: 'General Ledger' },
            { id: 'cashAr', label: 'AR, Cash Receipts & Expenses' },
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
                ? 'bg-white dark:bg-slate-900 brand-text-primary shadow-xs'
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
                  <BookOpen className="w-4 h-4 brand-text-accent" />
                  <span className="font-mono font-bold brand-text-primary">{je.jeNo}</span>
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
                      <td className="px-5 py-2 font-mono brand-text-primary">{l.accountCode}</td>
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

      {/* AR, Cash Receipts, Cash Disbursement & Expenses */}
      {tab === 'cashAr' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Cash in Bank Balance</span>
                <Wallet className="w-4 h-4 brand-text-accent" />
              </div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                {formatPHP(cashArSummary.cashBalance)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Cash Receipts Inflow</span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-lg font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
                {formatPHP(cashArSummary.cashIn)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Cash Disbursements</span>
                <ArrowUpRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="text-lg font-bold font-mono text-slate-900 dark:text-slate-100 mt-1 tabular-nums">
                {formatPHP(cashArSummary.cashOut)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
              <div className="text-xs text-slate-500 dark:text-slate-400">Accounts Receivable (Open)</div>
              <div className="text-lg font-bold font-mono brand-text-primary mt-1 tabular-nums">
                {formatPHP(cashArSummary.arOutstanding)}
              </div>
            </div>
          </div>

          {can('create_transactions') && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openPresetModal('billing')}
                className="px-3.5 py-2 text-xs font-semibold brand-soft-surface rounded-xl cursor-pointer"
              >
                + Record Progress Billing (AR)
              </button>
              <button
                type="button"
                onClick={() => openPresetModal('receipt')}
                className="px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl cursor-pointer"
              >
                + Record Cash Receipt
              </button>
              <button
                type="button"
                onClick={() => openPresetModal('expense')}
                className="px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 rounded-xl cursor-pointer"
              >
                + Record Direct Expense / Disbursement
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Accounts Receivable */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-slate-100">
                Accounts Receivable Ledger (Progress Billings &amp; Collections)
              </div>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Ref / Date</th>
                    <th className="px-4 py-2.5 text-left">Description</th>
                    <th className="px-4 py-2.5 text-right">Billed (DR)</th>
                    <th className="px-4 py-2.5 text-right">Collected (CR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cashArSummary.arEntries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-5 text-center text-slate-500 dark:text-slate-400">
                        No receivable billings posted yet.
                      </td>
                    </tr>
                  ) : (
                    cashArSummary.arEntries.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2.5 font-mono">
                          <div className="font-semibold brand-text-primary">{r.ref}</div>
                          <div className="text-[11px] text-slate-400">{r.date}</div>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{r.desc}</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-slate-900 dark:text-slate-100">
                          {r.billed > 0 ? formatPHP(r.billed) : '—'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                          {r.collected > 0 ? formatPHP(r.collected) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Operating & Material Expenses */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-900 dark:text-slate-100">
                <span>Recorded Project &amp; Operating Expenses</span>
                <span className="font-mono brand-text-primary">{formatPHP(cashArSummary.expensesTotal)}</span>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-2.5 text-left">JE / Date</th>
                    <th className="px-4 py-2.5 text-left">Expense Account</th>
                    <th className="px-4 py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cashArSummary.expenseEntries.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-5 text-center text-slate-500 dark:text-slate-400">
                        No expense entries posted yet.
                      </td>
                    </tr>
                  ) : (
                    cashArSummary.expenseEntries.map((ex) => (
                      <tr key={ex.id}>
                        <td className="px-4 py-2.5 font-mono">
                          <div className="font-semibold brand-text-primary">{ex.jeNo}</div>
                          <div className="text-[11px] text-slate-400">{ex.date}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{ex.account}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{ex.desc}</div>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {formatPHP(ex.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Trial Balance */}
      {tab === 'trial' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
              <Scale className="w-4 h-4 brand-text-accent" /> {activeCompany.code} Trial Balance
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
                  <td className="px-4 py-2.5 font-mono brand-text-primary">{r.code}</td>
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
            <tfoot className="brand-soft-surface font-bold border-t border-slate-200 dark:border-slate-800">
              <tr>
                <td colSpan={3} className="px-4 py-3 text-right uppercase text-[11px]">
                  Total
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
                  {formatPHP(trialBalance.totalDebit)}
                </td>
                <td className="px-4 py-3 text-right font-mono tabular-nums">
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
                    All approved {activeCompany.code} vouchers are currently settled.
                  </td>
                </tr>
              ) : (
                apAging.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-semibold brand-text-primary">{v.dvNo}</td>
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
                  <td className="px-4 py-3 font-mono font-semibold brand-text-primary">{a.code}</td>
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
      {showNewJe && can('create_transactions') && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 dark:bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handlePostJE} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Post {activeCompany.code} Journal Entry
              </h3>
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
              <button type="submit" className="px-4 py-2 text-xs font-semibold brand-btn-primary rounded-lg cursor-pointer">
                Post Entry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
