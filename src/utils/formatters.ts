import { Requisition } from '../types/erp';

export function formatPHP(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function formatCompactPHP(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  if (Math.abs(safe) >= 1_000_000) {
    return `₱${(safe / 1_000_000).toFixed(2)}M`;
  }
  if (Math.abs(safe) >= 1_000) {
    return `₱${(safe / 1_000).toFixed(1)}K`;
  }
  return formatPHP(safe);
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowTimestamp(): string {
  const d = new Date();
  return `${d.toISOString().slice(0, 10)} ${d.toTimeString().slice(0, 5)}`;
}

export function nextCode(prefix: string, existingCodes: string[], pad = 4): string {
  const year = new Date().getFullYear();
  const fullPrefix = `${prefix}-${year}-`;
  let max = 0;
  for (const code of existingCodes) {
    if (code.startsWith(fullPrefix)) {
      const n = parseInt(code.slice(fullPrefix.length), 10);
      if (!Number.isNaN(n) && n > max) max = n;
    } else if (code.startsWith(prefix)) {
      const match = code.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!Number.isNaN(n) && n > max) max = n;
      }
    }
  }
  return `${fullPrefix}${String(max + 1).padStart(pad, '0')}`;
}

export function nextSimpleCode(prefix: string, existingCodes: string[], pad = 4): string {
  let max = 0;
  for (const code of existingCodes) {
    if (code.startsWith(prefix)) {
      const match = code.match(/(\d+)$/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (!Number.isNaN(n) && n > max) max = n;
      }
    }
  }
  return `${prefix}${String(max + 1).padStart(pad, '0')}`;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export type PeriodPreset =
  | 'Daily'
  | 'Weekly'
  | 'Monthly'
  | 'Quarterly'
  | 'Semi-Annual'
  | 'Yearly'
  | 'Custom';

export function getPeriodRange(
  preset: PeriodPreset,
  customStart?: string,
  customEnd?: string
): { start: string; end: string; label: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const startD = new Date(now);

  switch (preset) {
    case 'Daily':
      return { start: end, end, label: `Daily (${end})` };
    case 'Weekly':
      startD.setDate(now.getDate() - 7);
      return { start: startD.toISOString().slice(0, 10), end, label: 'Weekly (Last 7 Days)' };
    case 'Monthly':
      startD.setDate(1);
      return {
        start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`,
        end,
        label: `Monthly (${now.toLocaleString('en-US', { month: 'long', year: 'numeric' })})`,
      };
    case 'Quarterly': {
      const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
      return {
        start: `${now.getFullYear()}-${String(qStartMonth + 1).padStart(2, '0')}-01`,
        end,
        label: `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`,
      };
    }
    case 'Semi-Annual': {
      const hStartMonth = now.getMonth() < 6 ? 0 : 6;
      return {
        start: `${now.getFullYear()}-${String(hStartMonth + 1).padStart(2, '0')}-01`,
        end,
        label: `H${now.getMonth() < 6 ? 1 : 2} ${now.getFullYear()} (Semi-Annual)`,
      };
    }
    case 'Yearly':
      return {
        start: `${now.getFullYear()}-01-01`,
        end: `${now.getFullYear()}-12-31`,
        label: `FY ${now.getFullYear()} (Annual)`,
      };
    case 'Custom': {
      const s = customStart || `${now.getFullYear()}-01-01`;
      const e = customEnd || end;
      return { start: s, end: e, label: `${s} to ${e}` };
    }
  }
}

export function isWithinRange(dateStr: string | undefined, start: string, end: string): boolean {
  if (!dateStr) return true;
  const d = dateStr.slice(0, 10);
  return d >= start && d <= end;
}

export function findDuplicateRequisitions(
  projectId: string,
  materialIds: string[],
  existingReqs: Requisition[],
  excludeReqId?: string
): Requisition[] {
  const matSet = new Set(materialIds);
  return existingReqs.filter((req) => {
    if (req.id === excludeReqId) return false;
    if (req.status === 'Cancelled') return false;
    if (req.projectId !== projectId) return false;
    return req.items.some((it) => matSet.has(it.materialId));
  });
}

export function downloadCSV(filename: string, columns: string[], rows: (string | number)[][]) {
  const escape = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [columns.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
