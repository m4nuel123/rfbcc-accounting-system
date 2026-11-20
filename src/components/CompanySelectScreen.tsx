import React, { useState } from 'react';
import { ArrowRight, LogOut, MapPin, Moon, ShieldCheck, Sun } from 'lucide-react';
import { Company, Employee, SafeUserAccount } from '../types/erp';

interface CompanySelectScreenProps {
  user: SafeUserAccount;
  employee: Employee | null;
  availableCompanies: Company[];
  onSelectCompany: (companyId: string) => Promise<void>;
  onLogout: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const CompanySelectScreen: React.FC<CompanySelectScreenProps> = ({
  user,
  employee,
  availableCompanies,
  onSelectCompany,
  onLogout,
  darkMode,
  onToggleDarkMode,
}) => {
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleChoose = async (companyId: string) => {
    setError('');
    setSelectingId(companyId);
    try {
      await onSelectCompany(companyId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to enter company workspace.');
      setSelectingId(null);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden p-6 sm:p-10 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Authenticated as {employee?.name || user.username} · {user.roleLabel}
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              Select Construction Company Workspace
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Only companies authorized for your account are shown below. Data, approvals, and ledgers remain strictly isolated per company.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              <span>{darkMode ? 'Light' : 'Dark'}</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:text-red-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        {/* Assigned Company Cards */}
        <div
          className={`grid gap-6 ${
            availableCompanies.length === 1 ? 'grid-cols-1 max-w-xl mx-auto' : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          {availableCompanies.map((company) => {
            const access = user.companyAccess.find((a) => a.companyId === company.id);
            const isRbi = company.code === 'RBI';
            const isLoading = selectingId === company.id;
            const roleText = access?.roleLabel || (user.isAdmin ? 'Super Administrator' : user.roleLabel);
            const moduleCount = user.isAdmin ? 11 : access?.allowedModules.length || 0;
            const permCount = user.isAdmin ? 10 : access?.permissions.length || 0;

            return (
              <div
                key={company.id}
                className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden bg-white dark:bg-slate-950/60 ${
                  isRbi
                    ? 'border-emerald-200/90 dark:border-emerald-900/70 hover:border-[#113E2B] dark:hover:border-emerald-500'
                    : 'border-blue-200/90 dark:border-blue-900/70 hover:border-[#123E82] dark:hover:border-blue-500'
                }`}
              >
                {/* Company Accent Banner Header */}
                <div
                  className="p-6 text-white flex items-center gap-4"
                  style={{
                    background: isRbi
                      ? 'linear-gradient(135deg, #113E2B 0%, #195E40 100%)'
                      : 'linear-gradient(135deg, #123E82 0%, #2C6FE0 100%)',
                  }}
                >
                  <div className="w-16 h-16 rounded-2xl bg-white p-2 shrink-0 flex items-center justify-center shadow-sm">
                    <img
                      src={company.logoUrl}
                      alt={`${company.name} Logo`}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-mono uppercase tracking-wider text-white/80">
                      {company.code} Entity Workspace
                    </div>
                    <h2 className="font-display text-lg font-bold text-white truncate">{company.name}</h2>
                    <div className="text-xs text-white/85 truncate">{company.legalName}</div>
                  </div>
                </div>

                {/* Details & Action */}
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {company.tagline}
                    </p>
                    <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-slate-400" />
                        <span>{company.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>
                          Role: <strong className="text-slate-800 dark:text-slate-200">{roleText}</strong>
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                      {moduleCount} Modules Enabled · {permCount} Action Permissions
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={Boolean(selectingId)}
                    onClick={() => handleChoose(company.id)}
                    style={{
                      backgroundColor: company.themePrimary,
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold text-white rounded-xl hover:opacity-95 disabled:opacity-60 transition-opacity cursor-pointer"
                  >
                    <span>{isLoading ? 'Loading Isolated Workspace...' : `Enter ${company.code} Dashboard`}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
