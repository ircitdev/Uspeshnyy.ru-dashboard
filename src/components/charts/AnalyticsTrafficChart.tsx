import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { MetrikaData } from '../../types';
import { generateAnalyticsTrafficTrend } from '../../utils/chartHelpers';
import { ChartTooltip } from './ChartTooltip';
import { formatNumber } from '../../api';
import { Eye, Users, Activity, TrendingUp, GitCompare, ArrowUpRight } from 'lucide-react';

interface AnalyticsTrafficChartProps {
  metrika: MetrikaData;
  days?: string | number;
}

export const AnalyticsTrafficChart: React.FC<AnalyticsTrafficChartProps> = ({
  metrika,
  days = 30,
}) => {
  const [showBounce, setShowBounce] = useState<boolean>(false);
  const [comparePrev, setComparePrev] = useState<boolean>(true);
  const daysNum = Number(days) || 30;

  const trendData = useMemo(() => {
    return generateAnalyticsTrafficTrend(metrika, daysNum);
  }, [metrika, daysNum]);

  const stats = useMemo(() => {
    if (!trendData.length) {
      return { totalVisits: 0, totalUsers: 0, avgVisits: 0, peakItem: null, prevTotalVisits: 0, visitsGrowthPct: 0 };
    }
    const totalVisits = trendData.reduce((acc, d) => acc + d.visits, 0);
    const prevTotalVisits = trendData.reduce((acc, d) => acc + (d.prevVisits || 0), 0);
    const totalUsers = trendData.reduce((acc, d) => acc + d.users, 0);
    const avgVisits = Math.round(totalVisits / trendData.length);
    const peakItem = trendData.reduce(
      (max, d) => (d.visits > max.visits ? d : max),
      trendData[0]
    );

    const visitsGrowthPct =
      prevTotalVisits > 0
        ? Number((((totalVisits - prevTotalVisits) / prevTotalVisits) * 100).toFixed(1))
        : 0;

    return {
      totalVisits,
      prevTotalVisits,
      totalUsers,
      avgVisits,
      peakItem,
      visitsGrowthPct,
    };
  }, [trendData]);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              <Eye className="w-3.5 h-3.5" />
            </span>
            <h3 className="font-semibold text-base text-[var(--text-main)]">
              Динамика трафика (Яндекс.Метрика)
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {daysNum} дн.
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Распределение сессий, уникальных посетителей и контроль показателей отказов
          </p>
        </div>

        {/* Toggle options */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setComparePrev((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
              comparePrev
                ? 'bg-[#37a4d3]/10 text-[#37a4d3] border-[#37a4d3]/40 shadow-2xs font-semibold'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900'
            }`}
            title="Отобразить вторую линию графика для сравнения с предыдущим аналогичным периодом"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Сравнить с пред. периодом</span>
          </button>

          <button
            type="button"
            onClick={() => setShowBounce((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-all cursor-pointer ${
              showBounce
                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 shadow-2xs'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Отказы (%)</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/70 text-xs">
        <div>
          <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
            Визиты (сессии)
          </span>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-mono font-bold text-sm text-[var(--text-main)]">
              {formatNumber(stats.totalVisits)}
            </span>
            {comparePrev && (
              <span
                className={`text-[11px] font-mono font-semibold ${
                  stats.visitsGrowthPct >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'
                }`}
              >
                {stats.visitsGrowthPct >= 0 ? `+${stats.visitsGrowthPct}%` : `${stats.visitsGrowthPct}%`}
              </span>
            )}
          </div>
        </div>

        <div>
          <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
            Уникальные пользователи
          </span>
          <span className="font-mono font-bold text-sm text-[var(--text-main)]">
            {formatNumber(stats.totalUsers)}
          </span>
        </div>

        <div>
          <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
            {comparePrev ? 'Пред. период (визиты)' : 'Среднесуточный трафик'}
          </span>
          <span className="font-mono font-semibold text-xs text-indigo-600 dark:text-indigo-400">
            {comparePrev
              ? `${formatNumber(stats.prevTotalVisits)} виз.`
              : `~${formatNumber(stats.avgVisits)} / день`}
          </span>
        </div>

        <div>
          <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
            Пик посещаемости
          </span>
          <span className="font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
            {stats.peakItem ? `${formatNumber(stats.peakItem.visits)} (${stats.peakItem.date})` : '—'}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#37a4d3" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#37a4d3" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradientUsers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#94A3B8"
              strokeOpacity={0.2}
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={{ stroke: '#CBD5E1', strokeOpacity: 0.4 }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 11, fill: '#64748B' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
            />
            {showBounce && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 50]}
                tick={{ fontSize: 11, fill: '#F43F5E' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
              />
            )}
            <Tooltip
              content={
                <ChartTooltip
                  formatter={(val, name) => {
                    if (name.includes('Отказы')) return `${val}%`;
                    return `${Number(val).toLocaleString('ru-RU')} виз.`;
                  }}
                />
              }
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              name="Визиты (текущий период)"
              dataKey="visits"
              stroke="#37a4d3"
              strokeWidth={2.4}
              fillOpacity={1}
              fill="url(#gradientVisits)"
              activeDot={{ r: 5, strokeWidth: 1, stroke: '#FFFFFF' }}
            />
            <Area
              yAxisId="left"
              type="monotone"
              name="Посетители"
              dataKey="users"
              stroke="#06B6D4"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#gradientUsers)"
              activeDot={{ r: 4, strokeWidth: 1, stroke: '#FFFFFF' }}
            />
            {comparePrev && (
              <Line
                yAxisId="left"
                type="monotone"
                name="Визиты (пред. период)"
                dataKey="prevVisits"
                stroke="#94A3B8"
                strokeWidth={2.2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, stroke: '#94A3B8', strokeWidth: 1 }}
              />
            )}
            {showBounce && (
              <Line
                yAxisId="right"
                type="monotone"
                name="Отказы (%)"
                dataKey="bounceRate"
                stroke="#F43F5E"
                strokeWidth={1.8}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
