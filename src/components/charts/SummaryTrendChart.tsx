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
import { SummaryData } from '../../types';
import { generateSummaryTrend } from '../../utils/chartHelpers';
import { ChartTooltip } from './ChartTooltip';
import { formatMoney, formatNumber } from '../../api';
import { Users, Cpu, Eye, TrendingUp, Calendar, Zap, Layers } from 'lucide-react';

interface SummaryTrendChartProps {
  data: SummaryData;
  days?: string | number;
}

type MetricMode = 'leads' | 'ai_cost' | 'traffic';
type DisplayMode = 'daily' | 'cumulative';

export const SummaryTrendChart: React.FC<SummaryTrendChartProps> = ({ data, days = 30 }) => {
  const [metricMode, setMetricMode] = useState<MetricMode>('leads');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('daily');

  const daysNum = Number(days) || 30;

  const trendData = useMemo(() => {
    return generateSummaryTrend(data, daysNum);
  }, [data, daysNum]);

  // Derived high-level stats for the active metric
  const stats = useMemo(() => {
    if (!trendData.length) {
      return { totalA: 0, totalB: 0, avgA: 0, peakA: 0, peakDate: '' };
    }

    if (metricMode === 'leads') {
      const totalLeads = trendData.reduce((acc, d) => acc + d.leads, 0);
      const totalReports = trendData.reduce((acc, d) => acc + d.reports, 0);
      const avgLeads = (totalLeads / trendData.length).toFixed(1);
      const peakItem = trendData.reduce((max, d) => (d.leads > max.leads ? d : max), trendData[0]);

      return {
        labelA: 'Новых лидов',
        valA: formatNumber(totalLeads),
        labelB: 'Отчётов',
        valB: formatNumber(totalReports),
        avgA: `${avgLeads} / день`,
        peakA: `${peakItem.leads} (${peakItem.date})`,
      };
    } else if (metricMode === 'ai_cost') {
      const totalCost = trendData.reduce((acc, d) => acc + d.cost, 0);
      const totalCalls = trendData.reduce((acc, d) => acc + d.calls, 0);
      const avgCost = (totalCost / trendData.length).toFixed(2);
      const peakItem = trendData.reduce((max, d) => (d.cost > max.cost ? d : max), trendData[0]);

      return {
        labelA: 'Расход моделей',
        valA: formatMoney(totalCost),
        labelB: 'Всего вызовов',
        valB: formatNumber(totalCalls),
        avgA: `$${avgCost} / день`,
        peakA: `$${peakItem.cost} (${peakItem.date})`,
      };
    } else {
      const totalViews = trendData.reduce((acc, d) => acc + d.views, 0);
      const totalEvents = trendData.reduce((acc, d) => acc + d.events, 0);
      const avgViews = Math.round(totalViews / trendData.length);
      const peakItem = trendData.reduce((max, d) => (d.views > max.views ? d : max), trendData[0]);

      return {
        labelA: 'Просмотры',
        valA: formatNumber(totalViews),
        labelB: 'События',
        valB: formatNumber(totalEvents),
        avgA: `${formatNumber(avgViews)} / день`,
        peakA: `${formatNumber(peakItem.views)} (${peakItem.date})`,
      };
    }
  }, [trendData, metricMode]);

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg p-5 shadow-sm transition-colors">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
              <TrendingUp className="w-3.5 h-3.5" />
            </span>
            <h3 className="font-semibold text-base text-[var(--text-main)]">
              Тренды и динамика проекта
            </h3>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {daysNum} дн.
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Интерактивный анализ прироста лидов, расхода токенов нейросетей и конверсий
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric Selector Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-md border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <button
              onClick={() => setMetricMode('leads')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all cursor-pointer font-medium ${
                metricMode === 'leads'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Лиды и отчёты</span>
            </button>

            <button
              onClick={() => setMetricMode('ai_cost')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all cursor-pointer font-medium ${
                metricMode === 'ai_cost'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>Расход ИИ ($)</span>
            </button>

            <button
              onClick={() => setMetricMode('traffic')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-all cursor-pointer font-medium ${
                metricMode === 'traffic'
                  ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Просмотры</span>
            </button>
          </div>

          {/* Daily vs Cumulative Toggle */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-md border border-slate-200/80 dark:border-slate-700/80 text-[11px]">
            <button
              onClick={() => setDisplayMode('daily')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                displayMode === 'daily'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              По дням
            </button>
            <button
              onClick={() => setDisplayMode('cumulative')}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer font-medium ${
                displayMode === 'cumulative'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Накопительно
            </button>
          </div>
        </div>
      </div>

      {/* Mini Stat Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/70 text-xs">
        <div>
          <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
            {stats.labelA}
          </span>
          <span className="font-mono font-bold text-sm text-[var(--text-main)]">
            {stats.valA}
          </span>
        </div>

        <div>
          <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
            {stats.labelB}
          </span>
          <span className="font-mono font-bold text-sm text-[var(--text-main)]">
            {stats.valB}
          </span>
        </div>

        <div>
          <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
            Среднесуточный темп
          </span>
          <span className="font-mono font-semibold text-xs text-indigo-600 dark:text-indigo-400">
            {stats.avgA}
          </span>
        </div>

        <div>
          <span className="text-slate-400 dark:text-slate-400 block text-[10px] uppercase font-semibold">
            Пиковое значение
          </span>
          <span className="font-mono font-semibold text-xs text-emerald-600 dark:text-emerald-400">
            {stats.peakA}
          </span>
        </div>
      </div>

      {/* Recharts Chart Area */}
      <div className="h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {metricMode === 'leads' ? (
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientLeads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#37a4d3" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#37a4d3" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientReports" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
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
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(val, name) =>
                      name.includes('лидов') ? `${val} чел.` : `${val} шт.`
                    }
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
                type="monotone"
                name="Новые лиды"
                dataKey={displayMode === 'daily' ? 'leads' : 'cumulativeLeads'}
                stroke="#37a4d3"
                strokeWidth={2.2}
                fillOpacity={1}
                fill="url(#gradientLeads)"
                activeDot={{ r: 5, strokeWidth: 1, stroke: '#FFFFFF' }}
              />
              <Area
                type="monotone"
                name="Отчёты"
                dataKey={displayMode === 'daily' ? 'reports' : 'cumulativeReports'}
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradientReports)"
                activeDot={{ r: 4, strokeWidth: 1, stroke: '#FFFFFF' }}
              />
            </AreaChart>
          ) : metricMode === 'ai_cost' ? (
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientCost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientCalls" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#37a4d3" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#37a4d3" stopOpacity={0.0} />
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
              {/* Left Y Axis for Cost */}
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              {/* Right Y Axis for Calls */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(val, name) =>
                      name.includes('Расход') ? `$${val.toFixed(2)}` : `${val} выз.`
                    }
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
                name="Расход ИИ ($)"
                dataKey={displayMode === 'daily' ? 'cost' : 'cumulativeCost'}
                stroke="#F59E0B"
                strokeWidth={2.4}
                fillOpacity={1}
                fill="url(#gradientCost)"
                activeDot={{ r: 5, strokeWidth: 1, stroke: '#FFFFFF' }}
              />
              <Area
                yAxisId="right"
                type="monotone"
                name="Вызовы моделей"
                dataKey="calls"
                stroke="#37a4d3"
                strokeWidth={1.8}
                fillOpacity={1}
                fill="url(#gradientCalls)"
                activeDot={{ r: 4, strokeWidth: 1, stroke: '#FFFFFF' }}
              />
            </AreaChart>
          ) : (
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284C7" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#0284C7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradientEvents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
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
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(val, name) => `${val.toLocaleString('ru-RU')} соб.`}
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
                type="monotone"
                name="Просмотры страниц"
                dataKey="views"
                stroke="#0284C7"
                strokeWidth={2.2}
                fillOpacity={1}
                fill="url(#gradientViews)"
                activeDot={{ r: 5, strokeWidth: 1, stroke: '#FFFFFF' }}
              />
              <Area
                type="monotone"
                name="Целевые события"
                dataKey="events"
                stroke="#8B5CF6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#gradientEvents)"
                activeDot={{ r: 4, strokeWidth: 1, stroke: '#FFFFFF' }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};
