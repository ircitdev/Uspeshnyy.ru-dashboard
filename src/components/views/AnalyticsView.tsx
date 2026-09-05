import React from 'react';
import { AnalyticsData } from '../../types';
import { MetricCard } from '../MetricCard';
import { formatNumber, calculateDelta } from '../../api';
import {
  Users,
  Eye,
  Search,
  Globe,
  Compass,
  Target,
  Clock,
  Layers,
} from 'lucide-react';
import { AnalyticsTrafficChart } from '../charts/AnalyticsTrafficChart';
import { AnalyticsSourcesChart } from '../charts/AnalyticsSourcesChart';
import { AnalyticsGoalsChart } from '../charts/AnalyticsGoalsChart';

interface AnalyticsViewProps {
  data: AnalyticsData;
  days?: string | number;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ data, days = 30 }) => {
  const metrika = data.metrika || {
    visits: 0,
    visits_prev: 0,
    users: 0,
    users_prev: 0,
    bounce: 0,
    dur: 0,
    sources: [],
    pages: [],
    goals: [],
  };

  const webmaster = data.webmaster || {
    in_search: 0,
    excluded: 0,
    queries_total: 0,
    queries: [],
    problems: [],
  };

  const visitsDelta = calculateDelta(metrika.visits, metrika.visits_prev);
  const usersDelta = calculateDelta(metrika.users, metrika.users_prev);

  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Визиты (Яндекс.Метрика)"
          value={formatNumber(metrika.visits)}
          subtext={`Пред. период: ${formatNumber(metrika.visits_prev || 0)}`}
          delta={visitsDelta}
          icon={<Eye className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
        />
        <MetricCard
          label="Уникальные посетители"
          value={formatNumber(metrika.users)}
          subtext={`Пред. период: ${formatNumber(metrika.users_prev || 0)}`}
          delta={usersDelta}
          icon={<Users className="w-4 h-4 text-slate-700 dark:text-slate-300" />}
        />
        <MetricCard
          label="Отказы / Время на сайте"
          value={`${metrika.bounce}% / ${formatDuration(metrika.dur)}`}
          subtext="Глубина и качество вовлечения"
          icon={<Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
        />
        <MetricCard
          label="Страниц в поиске (Вебмастер)"
          value={formatNumber(webmaster.in_search)}
          subtext={`Исключено: ${webmaster.excluded} стр.`}
          icon={<Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
        />
      </div>

      {/* Main Interactive Recharts Traffic Trend */}
      <AnalyticsTrafficChart metrika={metrika} days={days} />

      {/* Two columns: Recharts Channels Chart and Recharts Goals Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalyticsSourcesChart sources={metrika.sources} />
        <AnalyticsGoalsChart goals={metrika.goals} />
      </div>

      {/* Two columns: Top Pages and Search Queries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg overflow-hidden shadow-sm transition-colors">
          <div className="p-4 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-semibold text-sm text-[var(--text-main)]">
                Популярные страницы
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              {metrika.pages.length} стр.
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-[var(--border-subtle)] text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Страница / Раздел</th>
                  <th className="py-3 px-4 text-right">Просмотров</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {metrika.pages.map((p, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {p.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[var(--text-main)]">
                      {formatNumber(p.n)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Search Queries from Webmaster */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg overflow-hidden shadow-sm transition-colors">
          <div className="p-4 border-b border-[var(--border-subtle)] bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-semibold text-sm text-[var(--text-main)]">
                Поисковые запросы Яндекса
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Всего: {formatNumber(webmaster.queries_total)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-[var(--border-subtle)] text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Запрос</th>
                  <th className="py-3 px-4 text-right">Показы</th>
                  <th className="py-3 px-4 text-right">Клики</th>
                  <th className="py-3 px-4 text-right">CTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {webmaster.queries.map((q, idx) => {
                  const ctr = ((q.clicks / (q.shows || 1)) * 100).toFixed(1);
                  return (
                    <tr
                      key={idx}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {q.q}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 dark:text-slate-400">
                        {formatNumber(q.shows)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--text-main)]">
                        {formatNumber(q.clicks)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400 font-medium">
                        {ctr}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
