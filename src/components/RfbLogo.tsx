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
  const dim = size === 'sm' ? 36 : size === 'lg' ? 52 : 40;

  const mark = (
    <img
      src="/assets/aistudio/rfb-logo.png"
      alt="RFB Construction Emblem"
      width={dim}
      height={dim}
      style={{ width: dim, height: dim }}
      className="shrink-0 object-contain"
      referrerPolicy="no-referrer"
    />
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
        <div className="font-display font-bold text-[#123E82] dark:text-blue-300 tracking-tight text-base whitespace-nowrap">
          RFB Construction
        </div>
        <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
          Butuan City · ERP &amp; BI
        </div>
      </div>
    </div>
  );
};
