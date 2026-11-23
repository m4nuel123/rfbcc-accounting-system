import React, { useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Lock, LogOut, ShieldCheck, X } from 'lucide-react';
import { SafeUserAccount } from '../types/erp';
import { apiChangePassword } from '../utils/apiClient';

interface ChangePasswordScreenProps {
  token: string;
  user: SafeUserAccount;
  forced: boolean;
  onSuccess: (updatedUser: SafeUserAccount) => void;
  onCancelOrLogout: () => void;
}

export const ChangePasswordScreen: React.FC<ChangePasswordScreenProps> = ({
  token,
  user,
  forced,
  onSuccess,
  onCancelOrLogout,
}) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (newPassword.toLowerCase() === user.username.toLowerCase()) {
      setError('Temporary username password cannot be reused as your permanent password.');
      return;
    }
    if (!confirmChecked) {
      setError('Please confirm that you want to update your account password.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiChangePassword(token, {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      onSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={
        forced
          ? 'min-h-screen w-full flex items-center justify-center p-4 sm:p-8'
          : 'fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4'
      }
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#123E82] dark:text-blue-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
                {forced ? 'Password Change Required' : 'Change Account Password'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user.fullName} (@{user.username}) · {user.roleLabel}
              </p>
            </div>
          </div>

          {!forced && (
            <button
              type="button"
              onClick={onCancelOrLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {forced && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            For security across Accounting and Purchasing transactions, you must replace your temporary password before entering{' '}
            <strong>RFB</strong> or <strong>RBI</strong> workspaces.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {forced ? 'Temporary / Current Password' : 'Current Password'}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current or temporary password"
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C6FE0]/25"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrent((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Toggle visibility"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              New Password (minimum 8 characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a strong private password"
                className="w-full pl-10 pr-10 py-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C6FE0]/25"
                required
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Toggle visibility"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirm New Password
            </label>
            <div className="relative">
              <CheckCircle2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showNew ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C6FE0]/25"
                required
              />
            </div>
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none pt-1">
            <input
              type="checkbox"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
              className="mt-0.5"
            />
            <span>I confirm updating my password and understand that my previous temporary password will no longer work.</span>
          </label>

          {error && (
            <div className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-2.5">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            {forced ? (
              <button
                type="button"
                onClick={onCancelOrLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancelOrLogout}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 px-4 brand-btn-primary disabled:opacity-60 text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              {submitting ? 'Saving Password...' : 'Save New Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
