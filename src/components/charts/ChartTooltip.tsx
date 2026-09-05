import React from 'react';

export interface TooltipItem {
  name: string;
  value: number;
  color?: string;
  unit?: string;
  prefix?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey?: string;
    payload?: any;
  }>;
  label?: string;
  formatter?: (val: number, name: string) => string;
  sublabel?: string;
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  formatter,
  sublabel,
}) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-3 shadow-xl backdrop-blur-xs min-w-[160px] text-xs font-sans transition-all">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5 mb-2">
        <span className="font-semibold text-[var(--text-main)] text-[11px]">
          {label}
        </span>
        {sublabel && (
          <span className="text-[10px] text-slate-400 font-mono">
            {sublabel}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {payload.map((item, idx) => {
          const displayVal = formatter
            ? formatter(item.value, item.name)
            : item.value.toLocaleString('ru-RU');

          return (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-xs flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-slate-600 dark:text-slate-300 truncate">
                  {item.name}:
                </span>
              </div>
              <span className="font-mono font-bold text-[var(--text-main)] ml-auto">
                {displayVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
