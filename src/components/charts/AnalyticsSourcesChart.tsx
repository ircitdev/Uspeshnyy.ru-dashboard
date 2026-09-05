import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { AnalyticsSource } from '../../types';
import { ChartTooltip } from './ChartTooltip';
import { Users } from 'lucide-react';
import { formatNumber } from '../../api';

interface AnalyticsSourcesChartProps {
  sources: AnalyticsSource[];
}

const SOURCE_COLORS = [
  '#37a4d3', // Brand Blue (Поиск)
  '#06B6D4', // Cyan (Прямые)
  '#10B981', // Emerald (Соцсети / Telegram)
  '#F59E0B', // Amber (Внутренние / блог)
  '#8B5CF6', // Purple (Реклама)
];

export const AnalyticsSourcesChart: React.FC<AnalyticsSourcesChartProps> = ({ sources }) => {
  const totalVisits = (sources || []).reduce((acc, s) => acc + (s.n || 0), 0);

  const chartData = (sources || []).map((s, idx) => {
    // Shorten channel name
    let shortName = s.name;
    if (shortName.includes('поисковых')) shortName = 'Поиск Яндекса';
    else if (shortName.includes('Прямые')) shortName = 'Прямые заходы';
    else if (shortName.includes('социальных') || shortName.includes('мессенджеров')) shortName = 'Соцсети и TG';
    else if (shortName.includes('Внутренние') || shortName.includes('блога')) shortName = 'Блог и статьи';
    else if (shortName.includes('Рекламные')) shortName = 'Реклама';

    const sharePct = totalVisits ? ((s.n / totalVisits) * 100).toFixed(1) : '0';

    return {
      fullName: s.name,
      name: shortName,
      visits: s.n,
      share: sharePct,
      color: SOURCE_COLORS[idx % SOURCE_COLORS.length],
    };
  });

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg overflow-hidden shadow-sm transition-colors flex flex-col justify-between">
      <div className="p-4 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="font-semibold text-sm text-[var(--text-main)]">
            Распределение источников трафика
          </h4>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {sources.length} каналов
        </span>
      </div>

      <div className="p-4">
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#94A3B8"
                strokeOpacity={0.2}
                horizontal={false}
              />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatNumber(v)}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748B' }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1', strokeOpacity: 0.4 }}
                width={105}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(val, name) => `${val.toLocaleString('ru-RU')} виз.`}
                  />
                }
              />
              <Bar dataKey="visits" name="Визиты" radius={[0, 4, 4, 0]} maxBarSize={18}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / share tags */}
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-[var(--border-subtle)]">
          {chartData.map((s, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate max-w-[95px]">{s.name}:</span>
              <span className="font-mono font-bold">{s.share}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
