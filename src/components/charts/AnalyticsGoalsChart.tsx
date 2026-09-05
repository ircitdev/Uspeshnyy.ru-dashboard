import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AnalyticsGoal } from '../../types';
import { ChartTooltip } from './ChartTooltip';
import { Target, TrendingUp } from 'lucide-react';
import { formatNumber } from '../../api';

interface AnalyticsGoalsChartProps {
  goals: AnalyticsGoal[];
}

export const AnalyticsGoalsChart: React.FC<AnalyticsGoalsChartProps> = ({ goals }) => {
  const chartData = (goals || []).map((g) => {
    // Shorten label for clean XAxis display
    let shortName = g.name;
    if (shortName.includes('Telegram')) shortName = 'В Telegram-бота';
    else if (shortName.includes('аудит')) shortName = 'Запуск аудита';
    else if (shortName.includes('консультацию')) shortName = 'Заявка на созвон';
    else if (shortName.includes('рассылку')) shortName = 'Подписка';

    const deltaPct = g.prev
      ? (((g.n - g.prev) / g.prev) * 100).toFixed(1)
      : null;

    return {
      fullName: g.name,
      name: shortName,
      current: g.n,
      prev: g.prev || 0,
      delta: deltaPct,
    };
  });

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg overflow-hidden shadow-sm transition-colors flex flex-col justify-between">
      <div className="p-4 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h4 className="font-semibold text-sm text-[var(--text-main)]">
            Сравнение конверсий по целям
          </h4>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Период vs Пред.
        </span>
      </div>

      <div className="p-4">
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#94A3B8"
                strokeOpacity={0.2}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickLine={false}
                axisLine={{ stroke: '#CBD5E1', strokeOpacity: 0.4 }}
                interval={0}
                angle={-12}
                textAnchor="end"
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#64748B' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => formatNumber(v)}
              />
              <Tooltip
                content={
                  <ChartTooltip
                    formatter={(val, name) => `${val.toLocaleString('ru-RU')} конв.`}
                  />
                }
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="square"
                wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
              />
              <Bar
                name="Текущий период"
                dataKey="current"
                fill="#37a4d3"
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
              <Bar
                name="Пред. период"
                dataKey="prev"
                fill="#94A3B8"
                opacity={0.65}
                radius={[4, 4, 0, 0]}
                maxBarSize={36}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footnote with goal delta highlights */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[var(--border-subtle)]">
          {chartData.slice(0, 4).map((g, idx) => (
            <div key={idx} className="text-[11px] flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400 truncate max-w-[110px]">
                {g.name}:
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                +{g.delta}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
