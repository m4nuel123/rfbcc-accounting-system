import React from 'react';
import { formatCompactPHP, formatPHP } from '../utils/formatters';

interface BudgetProjectDatum {
  name: string;
  type: string;
  budget: number;
  actual: number;
}

export const BudgetVsActualChart: React.FC<{ data: BudgetProjectDatum[] }> = ({ data }) => {
  const maxVal = Math.max(1, ...data.flatMap((d) => [d.budget, d.actual]));
  const chartW = 540;
  const chartH = 220;
  const padL = 56;
  const padR = 16;
  const padT = 18;
  const padB = 42;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;
  const groupW = innerW / Math.max(1, data.length);
  const barW = Math.min(24, groupW * 0.28);

  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible" role="img" aria-label="Budget vs Actual Spend by Project">
        {ticks.map((t) => {
          const y = padT + innerH * (1 - t);
          return (
            <g key={t}>
              <line
                x1={padL}
                y1={y}
                x2={chartW - padR}
                y2={y}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeDasharray={t === 0 ? undefined : '3 3'}
              />
              <text x={padL - 8} y={y + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono">
                {formatCompactPHP(maxVal * t)}
              </text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const cx = padL + groupW * i + groupW / 2;
          const bH = (d.budget / maxVal) * innerH;
          const aH = (d.actual / maxVal) * innerH;
          const shortName = d.name.length > 18 ? `${d.name.slice(0, 16)}…` : d.name;
          return (
            <g key={d.name}>
              <rect
                x={cx - barW - 3}
                y={padT + innerH - bH}
                width={barW}
                height={Math.max(2, bH)}
                rx={4}
                className="fill-slate-300 dark:fill-slate-700"
              >
                <title>{`${d.name} Budget: ${formatPHP(d.budget)}`}</title>
              </rect>
              <rect
                x={cx + 3}
                y={padT + innerH - aH}
                width={barW}
                height={Math.max(2, aH)}
                rx={4}
                fill="#2C6FE0"
              >
                <title>{`${d.name} Actual: ${formatPHP(d.actual)}`}</title>
              </rect>
              <text x={cx} y={chartH - 18} textAnchor="middle" className="fill-slate-600 dark:fill-slate-300 text-[10px] font-medium">
                {shortName}
              </text>
              <text x={cx} y={chartH - 5} textAnchor="middle" className="fill-slate-400 dark:fill-slate-500 text-[9px]">
                {d.type}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-end gap-5 mt-2 text-xs text-slate-600 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-slate-300 dark:bg-slate-700 inline-block" />
          Approved Budget
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-xs bg-[#2C6FE0] inline-block" />
          Actual Spend
        </span>
      </div>
    </div>
  );
};

interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

export const CategoryDonutChart: React.FC<{ data: DonutDatum[]; centerLabel: string }> = ({
  data,
  centerLabel,
}) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 172;
  const r = 60;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let cumulative = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Spend by Category">
          <circle cx={cx} cy={cy} r={r} fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="22" />
          {total > 0 &&
            data.map((d) => {
              const frac = d.value / total;
              const dash = frac * circumference;
              const offset = -cumulative * circumference;
              cumulative += frac;
              return (
                <circle
                  key={d.label}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth="22"
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={offset}
                  transform={`rotate(-90 ${cx} ${cy})`}
                >
                  <title>{`${d.label}: ${formatPHP(d.value)}`}</title>
                </circle>
              );
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Total Spend</span>
          <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100">{centerLabel}</span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2.5">
        {data.map((d) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
          return (
            <div key={d.label} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-slate-700 dark:text-slate-300 truncate">{d.label}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 font-mono tabular-nums">
                <span className="text-slate-900 dark:text-slate-100 font-semibold">{formatCompactPHP(d.value)}</span>
                <span className="text-slate-400 dark:text-slate-500 w-9 text-right">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface TrendDatum {
  month: string;
  amount: number;
}

export const MonthlyTrendChart: React.FC<{ data: TrendDatum[] }> = ({ data }) => {
  const maxVal = Math.max(1, ...data.map((d) => d.amount));
  const w = 520;
  const h = 180;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 30;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const points = data.map((d, idx) => {
    const x = padL + (data.length <= 1 ? innerW / 2 : (idx / (data.length - 1)) * innerW);
    const y = padT + innerH - (d.amount / maxVal) * innerH;
    return { x, y, ...d };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${padT + innerH} L ${points[0].x} ${padT + innerH} Z`
      : '';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto overflow-visible" role="img" aria-label="Monthly Procurement Trend">
      <defs>
        <linearGradient id="trendAreaBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2C6FE0" stopOpacity="0.24" />
          <stop offset="100%" stopColor="#2C6FE0" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t) => {
        const y = padT + innerH * (1 - t);
        return (
          <g key={t}>
            <line
              x1={padL}
              y1={y}
              x2={w - padR}
              y2={y}
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeDasharray={t === 0 ? undefined : '3 3'}
            />
            <text x={padL - 8} y={y + 4} textAnchor="end" className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono">
              {formatCompactPHP(maxVal * t)}
            </text>
          </g>
        );
      })}
      {areaPath && <path d={areaPath} fill="url(#trendAreaBlue)" />}
      {linePath && <path d={linePath} fill="none" stroke="#2C6FE0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}
      {points.map((p) => (
        <g key={p.month}>
          <circle
            cx={p.x}
            cy={p.y}
            r={4}
            className="fill-white dark:fill-slate-900 stroke-[#123E82] dark:stroke-blue-400"
            strokeWidth="2"
          >
            <title>{`${p.month}: ${formatPHP(p.amount)}`}</title>
          </circle>
          <text x={p.x} y={h - 8} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400 text-[10px] font-medium">
            {p.month}
          </text>
        </g>
      ))}
    </svg>
  );
};
