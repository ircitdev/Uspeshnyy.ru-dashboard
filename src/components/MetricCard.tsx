import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { MetricAnomaly } from '../types';

interface MetricCardProps {
  label: string;
  value: string | React.ReactNode;
  subtext?: string;
  delta?: {
    text: string;
    direction: 'up' | 'down' | 'flat';
  };
  isAlert?: boolean;
  anomalyAlert?: MetricAnomaly;
  sparklineData?: number[];
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  delta,
  isAlert,
  anomalyAlert,
  sparklineData,
  icon,
  className = '',
  onClick,
}) => {
  const isDanger = isAlert || anomalyAlert?.type === 'danger';
  const isWarning = anomalyAlert?.type === 'warning';
  const isInfoAlert = anomalyAlert?.type === 'info';

  return (
    <div
      onClick={onClick}
      className={`relative bg-white dark:bg-slate-900 p-6 border rounded-lg shadow-sm transition-all duration-200 flex flex-col justify-between ${
        isDanger
          ? 'border-rose-400 dark:border-rose-700 bg-rose-50/40 dark:bg-rose-950/20 shadow-rose-100/50'
          : isWarning
          ? 'border-amber-400 dark:border-amber-700 bg-amber-50/30 dark:bg-amber-950/20 shadow-amber-100/50'
          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md'
      } ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div>
        {/* Top row: Label, Anomaly badge, and Icon */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold truncate">
                {label}
              </p>
              {anomalyAlert && (
                <span
                  title={anomalyAlert.description}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase animate-pulse ${
                    isDanger
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-300 dark:border-rose-700'
                      : isWarning
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700'
                      : 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {anomalyAlert.badge}
                </span>
              )}
            </div>
          </div>
          {icon && (
            <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 flex-shrink-0">
              {icon}
            </div>
          )}
        </div>

        {/* Metric Value */}
        <h3
          className={`text-3xl font-light my-1 tracking-tight ${
            isDanger
              ? 'text-rose-600 dark:text-rose-400 font-normal'
              : isWarning
              ? 'text-amber-700 dark:text-amber-400 font-normal'
              : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          {value}
        </h3>

        {/* Anomaly Real-time Alert Note */}
        {anomalyAlert && (
          <div
            className={`mt-1.5 p-1.5 rounded text-[11px] leading-tight flex items-start gap-1.5 border ${
              isDanger
                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                : isWarning
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                : 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300'
            }`}
          >
            {isDanger ? (
              <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5 text-rose-600" />
            ) : isWarning ? (
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 text-amber-600" />
            ) : (
              <Info className="w-3 h-3 flex-shrink-0 mt-0.5 text-indigo-600" />
            )}
            <span className="truncate" title={anomalyAlert.description}>
              {anomalyAlert.description}
            </span>
          </div>
        )}
      </div>

      {/* Sparkline if provided */}
      {sparklineData && sparklineData.length >= 2 && (
        <div className="my-2 h-7 w-full">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 100 24" preserveAspectRatio="none">
            {(() => {
              const max = Math.max(...sparklineData, 1);
              const min = Math.min(...sparklineData, 0);
              const range = max - min || 1;
              const n = sparklineData.length;
              const points = sparklineData
                .map((v, i) => {
                  const x = (i / (n - 1)) * 100;
                  const y = 22 - ((v - min) / range) * 20;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(' L');
              return (
                <>
                  <defs>
                    <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#37a4d3" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#37a4d3" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  <path
                    d={`M${points}`}
                    fill="none"
                    stroke="#37a4d3"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              );
            })()}
          </svg>
        </div>
      )}

      {/* Bottom row: Delta & Subtext */}
      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 dark:text-slate-500 truncate">{subtext || '—'}</span>

        {delta && (
          <p
            className={`font-medium flex items-center gap-1 flex-shrink-0 ${
              delta.direction === 'up'
                ? 'text-emerald-600'
                : delta.direction === 'down'
                ? 'text-rose-600'
                : 'text-slate-500'
            }`}
          >
            {delta.direction === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {delta.direction === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            {delta.direction === 'flat' && <Minus className="w-3.5 h-3.5" />}
            <span>{delta.text}</span>
          </p>
        )}
      </div>
    </div>
  );
};
