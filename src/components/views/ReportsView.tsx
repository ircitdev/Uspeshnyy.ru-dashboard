import React, { useState, useMemo, useEffect } from 'react';
import { ReportsResponse, ReportItem } from '../../types';
import { MetricCard } from '../MetricCard';
import { formatNumber, formatMoney } from '../../api';
import {
  Search,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight,
  X,
  User,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ReportsViewProps {
  data: ReportsResponse;
  initialSearchQuery?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ data, initialSearchQuery }) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [selectedKind, setSelectedKind] = useState<string>('all');
  const [inspectReport, setInspectReport] = useState<ReportItem | null>(null);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const reports = data.rows || [];

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        (r.who && r.who.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.id && r.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.username && r.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.url && r.url.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchKind = selectedKind === 'all' || r.kind === selectedKind;

      return matchSearch && matchKind;
    });
  }, [reports, searchQuery, selectedKind]);

  const uniqueKinds = useMemo(() => {
    const set = new Set<string>();
    reports.forEach((r) => {
      if (r.kind) set.add(r.kind);
    });
    return Array.from(set);
  }, [reports]);

  // Average cost
  const avgCostRub =
    reports.length > 0
      ? reports.reduce((acc, curr) => acc + (curr.cost_rub || 0), 0) / reports.length
      : 0;

  return (
    <div className="space-y-6">
      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          label="Всего отчётов"
          value={formatNumber(data.total)}
          subtext="Вся база сгенерированных отчётов"
          icon={<FileText className="w-4 h-4 text-indigo-600" />}
        />
        <MetricCard
          label="В текущей выборке"
          value={formatNumber(reports.length)}
          subtext="За выбранный период"
          icon={<Calendar className="w-4 h-4 text-slate-700" />}
        />
        <MetricCard
          label="Средняя себестоимость"
          value={`${avgCostRub.toFixed(2)} ₽`}
          subtext={`Курс ЦБ: ${data.usd_rate.toFixed(2)} ₽/USD`}
          icon={<Layers className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по имени, сайту, @username или ID отчёта..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        {/* Kind selector pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedKind('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
              selectedKind === 'all'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Все ({reports.length})
          </button>
          {uniqueKinds.map((k) => (
            <button
              key={k}
              onClick={() => setSelectedKind(k)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                selectedKind === k
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Data Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Получатель / Сайт</th>
                <th className="py-3.5 px-4">Тип отчёта</th>
                <th className="py-3.5 px-4">Пользователь</th>
                <th className="py-3.5 px-4">Дата</th>
                <th className="py-3.5 px-4 text-center">Оценка</th>
                <th className="py-3.5 px-4 text-right">Себестоимость</th>
                <th className="py-3.5 px-4 text-center">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Отчёты не найдены по текущему фильтру
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr
                    key={report.id}
                    className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                    onClick={() => setInspectReport(report)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="truncate max-w-[200px]">{report.who}</span>
                      </div>
                      {report.url && (
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-[220px]">
                          {report.url}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {report.kind}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-700 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{report.username ? `@${report.username}` : 'Анонимно'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {new Date(report.created * 1000).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      {report.score !== undefined ? (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            report.score >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : report.score >= 60
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {report.score}/100
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {report.cost_rub ? `${report.cost_rub.toFixed(2)} ₽` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-2">
                        {report.link && (
                          <a
                            href={report.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
                            title="Открыть публичный отчёт"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => setInspectReport(report)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                          title="Детали"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Report Modal */}
      {inspectReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-lg shadow-2xl p-6 text-slate-900">
            <button
              onClick={() => setInspectReport(null)}
              className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">{inspectReport.who}</h3>
                <p className="text-xs font-mono text-slate-500">ID: {inspectReport.id}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Тип отчёта</span>
                  <span className="font-semibold text-slate-800">{inspectReport.kind}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Себестоимость</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {inspectReport.cost_rub ? `${inspectReport.cost_rub.toFixed(2)} ₽` : '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Оценка качества</span>
                  <span className="font-medium text-slate-800">{inspectReport.score || 0}/100</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Расход USD</span>
                  <span className="font-medium text-slate-800 font-mono">
                    {inspectReport.spend ? formatMoney(inspectReport.spend.cost) : '—'}
                  </span>
                </div>
              </div>

              {inspectReport.summary && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Резюме аудита
                  </span>
                  <p className="text-slate-700 leading-relaxed">{inspectReport.summary}</p>
                </div>
              )}

              {inspectReport.spend && inspectReport.spend.models && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md space-y-1.5">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Задействованные модели
                  </span>
                  <div className="space-y-1">
                    {inspectReport.spend.models.map((m, i) => (
                      <div key={i} className="flex justify-between font-mono text-[11px]">
                        <span className="text-slate-600">{m.provider}</span>
                        <span className="text-indigo-600">{m.model}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inspectReport.link && (
                <a
                  href={inspectReport.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs transition-colors shadow-sm"
                >
                  <span>Открыть веб-версию отчёта</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
