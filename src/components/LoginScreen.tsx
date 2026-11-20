import React, { useState } from 'react';
import { ChevronDown, ChevronUp, KeyRound, Lock, ShieldCheck, User } from 'lucide-react';
import { Employee, UserAccount } from '../types/erp';
import { RfbLogo } from './RfbLogo';

interface LoginScreenProps {
  users: UserAccount[];
  employees: Employee[];
  onLogin: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, employees, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const found = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password
    );
    if (!found) {
      setError('Invalid username or password. Check credentials or view demo accounts below.');
      return;
    }
    onLogin(found);
  };

  const handleQuickFill = (u: UserAccount) => {
    setUsername(u.username);
    setPassword(u.password);
    setError('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl border border-blue-100/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left brand panel */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#123E82] via-[#1B52AA] to-[#2C6FE0] text-white p-8 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-3 mb-8">
              <RfbLogo size="md" showText={false} />
              <div className="leading-tight">
                <div className="font-display font-bold text-sm text-white">RFB Construction</div>
                <div className="text-[11px] text-blue-100">Malaybalay City, Bukidnon</div>
              </div>
            </div>

            <h1 className="font-display text-2xl font-bold tracking-tight leading-snug text-balance">
              Enterprise Procurement, Accounting &amp; BI System
            </h1>
            <p className="mt-3 text-sm text-blue-100/90 leading-relaxed">
              Role-based operational workspace for Requisitions, Canvassing, 4-Step Purchasing Approval, Vouchering, General Ledger, and Tools Monitoring.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/15 space-y-2.5 text-xs text-blue-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-200 shrink-0" />
              <span>Session resets on reload for audit accountability</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-200 shrink-0" />
              <span>Modules strictly scoped per assigned user role</span>
            </div>
          </div>
        </div>

        {/* Right sign-in panel */}
        <div className="lg:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h2 className="font-display text-xl font-bold text-slate-900">Sign in to RFB System</h2>
            <p className="text-sm text-slate-500 mt-1">Enter your assigned username and password to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin, maria, juan"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C6FE0]/25 focus:border-[#2C6FE0]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C6FE0]/25 focus:border-[#2C6FE0]"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#2C6FE0] hover:bg-[#1E56B8] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </form>

          {/* Expandable Demo Accounts Helper */}
          <div className="mt-6 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setShowDemo((v) => !v)}
              className="w-full flex items-center justify-between text-xs font-semibold text-[#123E82] hover:text-[#2C6FE0] py-1 cursor-pointer"
            >
              <span>View demo accounts ({users.length} roles)</span>
              {showDemo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemo && (
              <div className="mt-3 max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                {users.map((u) => {
                  const emp = employees.find((e) => e.id === u.employeeId);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickFill(u)}
                      className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50/70 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {emp?.name || u.username} · <span className="text-[#123E82]">{u.roleLabel}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          Modules: {u.isAdmin ? 'All Modules' : u.allowedModules.join(', ')}
                        </div>
                      </div>
                      <div className="shrink-0 font-mono text-[11px] text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        {u.username} / {u.password}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
