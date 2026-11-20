import React, { useEffect, useState } from 'react';
import { Building2, ChevronDown, ChevronUp, KeyRound, Lock, Moon, ShieldCheck, Sun, User } from 'lucide-react';
import { LoginResponse } from '../types/erp';
import { apiLogin, DemoDirectoryEntry, fetchDemoDirectory } from '../utils/apiClient';

interface LoginScreenProps {
  onLoginSuccess: (payload: LoginResponse) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  darkMode,
  onToggleDarkMode,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [demoUsers, setDemoUsers] = useState<DemoDirectoryEntry[]>([]);

  useEffect(() => {
    fetchDemoDirectory()
      .then(setDemoUsers)
      .catch(() => setDemoUsers([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = await apiLogin(username.trim(), password);
      onLoginSuccess(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (entry: DemoDirectoryEntry) => {
    setUsername(entry.username);
    setPassword(entry.passwordHint);
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left centralized group brand panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#123E82] via-[#134263] to-[#113E2B] text-white p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-7">
              <div className="flex items-center -space-x-2">
                <div className="w-11 h-11 rounded-xl bg-white p-1.5 shadow-sm flex items-center justify-center">
                  <img
                    src="/assets/aistudio/rfb-logo.png"
                    alt="RFB Construction Emblem"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="w-11 h-11 rounded-xl bg-white p-1.5 shadow-sm flex items-center justify-center ring-2 ring-[#113E2B]/40">
                  <img
                    src="/assets/aistudio/image_d9fd67be.png"
                    alt="RBI Construction Emblem"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
              <div className="leading-tight">
                <div className="font-display font-bold text-sm text-white">RFB &amp; RBI Group ERP</div>
                <div className="text-[11px] text-slate-200/90">P-1 A Brgy. Doongan, Butuan City</div>
              </div>
            </div>

            <h1 className="font-display text-2xl font-bold tracking-tight leading-snug text-balance">
              Multi-Company Accounting, Purchasing &amp; BI Portal
            </h1>
            <p className="mt-3 text-sm text-slate-100/85 leading-relaxed">
              One centralized application for <strong className="text-white">RFB Construction</strong> and{' '}
              <strong className="text-emerald-200">RBI Construction (Rodnet Builders Inc.)</strong> with strict company isolation and role-based permissions.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/15 space-y-2.5 text-xs text-slate-100/90">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Select your assigned company workspace after login</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-200 shrink-0" />
              <span>Server-verified RBAC permissions &amp; audit logging</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-200 shrink-0" />
              <span>Strict zero-leak data isolation across RFB and RBI</span>
            </div>
          </div>
        </div>

        {/* Right sign-in panel */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center relative">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="absolute top-6 right-6 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-[#123E82]" />}
            <span>{darkMode ? 'Light' : 'Dark'}</span>
          </button>

          <div className="mb-6 pr-20">
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">Centralized System Sign In</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Sign in once to view and access the construction companies assigned to your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, user_c, user_a, user_b, user_d"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C6FE0]/25 focus:border-[#2C6FE0]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C6FE0]/25 focus:border-[#2C6FE0]"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-[#123E82] hover:bg-[#0E3168] disabled:opacity-60 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {submitting ? 'Authenticating...' : 'Continue to Company Selection'}
            </button>
          </form>

          {/* Expandable Demo Accounts Helper */}
          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4">
            <button
              type="button"
              onClick={() => setShowDemo((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#123E82] dark:text-blue-300 hover:text-[#2C6FE0] dark:hover:text-blue-200 py-1 cursor-pointer"
            >
              <span>View demo accounts ({demoUsers.length} multi-company roles)</span>
              {showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemo && (
              <div className="mt-3 max-h-56 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {demoUsers.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickFill(u)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/70 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {u.employeeName} · <span className="text-[#123E82] dark:text-blue-300">{u.roleLabel}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Assigned Companies: {u.companies.map((c) => c.code).join(' + ') || 'None'}
                      </div>
                    </div>
                    <div className="shrink-0 font-mono text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      {u.username} / {u.passwordHint}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
