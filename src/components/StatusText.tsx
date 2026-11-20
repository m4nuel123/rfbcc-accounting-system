import React from 'react';
import { AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';

interface StatusTextProps {
  status: string;
}

export const StatusText: React.FC<StatusTextProps> = ({ status }) => {
  const s = status.toLowerCase();

  if (
    s.includes('approved') ||
    s === 'paid' ||
    s === 'delivered' ||
    s === 'available' ||
    s === 'returned' ||
    s === 'completed' ||
    s === 'po generated' ||
    s === 'pr generated' ||
    s === 'pr created' ||
    s === 'awarded' ||
    s === 'active' ||
    s === 'good'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (s.includes('reject') || s === 'cancelled' || s === 'lost' || s === 'disposed' || s === 'overdue') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-700 dark:text-red-400 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (s.includes('repair') || s.includes('damage') || s === 'borrowed' || s === 'released' || s === 'partially delivered') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400 whitespace-nowrap">
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap">
      <Clock className="w-3.5 h-3.5 shrink-0" />
      <span>{status}</span>
    </span>
  );
};
