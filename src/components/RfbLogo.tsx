import React from 'react';

interface RfbLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  align?: 'left' | 'right';
}

export const RfbLogo: React.FC<RfbLogoProps> = ({
  size = 'md',
  showText = true,
  align = 'left',
}) => {
  const dim = size === 'sm' ? 32 : size === 'lg' ? 48 : 38;

  const mark = (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
      aria-label="RFB Construction Emblem"
    >
      <defs>
        <linearGradient id="rfbBlueGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#123E82" />
          <stop offset="100%" stopColor="#2C6FE0" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="44" height="44" rx="11" fill="url(#rfbBlueGrad)" />
      {/* Structural bridge arch & girder lines */}
      <path
        d="M11 34V18L24 11L37 18V34"
        stroke="#FFFFFF"
        strokeWidth="2.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 34V22.5L24 18L32 22.5V34"
        stroke="#93C5FD"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 34H39"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="21.5" y="25" width="5" height="9" rx="1" fill="#FFFFFF" />
    </svg>
  );

  if (!showText) return mark;

  return (
    <div
      className={`flex items-center gap-2.5 ${
        align === 'right' ? 'flex-row-reverse text-right' : 'flex-row text-left'
      }`}
    >
      {mark}
      <div className="leading-tight">
        <div className="font-display font-bold text-[#123E82] tracking-tight text-base whitespace-nowrap">
          RFB Construction
        </div>
        <div className="text-[11px] font-medium text-slate-500 whitespace-nowrap">
          Bukidnon · ERP &amp; BI
        </div>
      </div>
    </div>
  );
};
