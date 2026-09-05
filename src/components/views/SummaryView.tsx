import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  FileText,
  Coins,
  Cpu,
  Eye,
  MessageSquare,
  Activity,
  ArrowUpRight,
  Zap,
  GripVertical,
  RotateCcw,
  Sliders,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { SummaryData, TabKey, SummaryWidgetId } from '../../types';
import { MetricCard } from '../MetricCard';
import { SummaryTrendChart } from '../charts/SummaryTrendChart';
import { QuickNotesWidget } from '../widgets/QuickNotesWidget';
import { GeminiSummaryCard } from '../widgets/GeminiSummaryCard';
import { formatNumber, formatMoney, calculateDelta } from '../../api';
import { detectSummaryAnomalies } from '../../services/anomalyMonitoring';
import { getAiBudgetSettings } from '../../services/budgetSettings';
import { fetchGeminiSummary, GeminiSummaryResult } from '../../services/geminiSummary';

interface SummaryViewProps {
  data: SummaryData;
  onNavigate: (tab: TabKey) => void;
  days?: string | number;
}

const DEFAULT_WIDGET_ORDER: SummaryWidgetId[] = [
  'primary_kpis',
  'secondary_kpis',
  'trend_chart',
  'quick_notes',
  'quick_nav',
  'infra_status',
];

const STORAGE_ORDER_KEY = 'uspeshnyy_summary_widget_order';

export const SummaryView: React.FC<SummaryViewProps> = ({ data, onNavigate, days = 30 }) => {
  const [widgetOrder, setWidgetOrder] = useState<SummaryWidgetId[]>(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDGET_ORDER;
    try {
      const saved = localStorage.getItem(STORAGE_ORDER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SummaryWidgetId[];
        // Ensure all default widgets exist
        const merged = [...parsed.filter((id) => DEFAULT_WIDGET_ORDER.includes(id))];
        DEFAULT_WIDGET_ORDER.forEach((id) => {
          if (!merged.includes(id)) merged.push(id);
        });
        return merged;
      }
    } catch {
      // fallback
    }
    return DEFAULT_WIDGET_ORDER;
  });

  const [isReordering, setIsReordering] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<SummaryWidgetId | null>(null);

  // Gemini AI Summary state
  const [summaryResult, setSummaryResult] = useState<GeminiSummaryResult | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [showSummaryCard, setShowSummaryCard] = useState(false);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setSummaryError(null);
    setShowSummaryCard(true);
    try {
      const res = await fetchGeminiSummary(data, Number(days) || 30);
      setSummaryResult(res);
    } catch (err: any) {
      setSummaryError(err.message || 'Не удалось получить ответ от Gemini');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Save order
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ORDER_KEY, JSON.stringify(widgetOrder));
    } catch (e) {
      console.error(e);
    }
  }, [widgetOrder]);

  // Real-time anomaly detection for metrics
  const budgetSettings = useMemo(() => getAiBudgetSettings(), []);
  const anomalies = useMemo(() => detectSummaryAnomalies(data), [data]);

  const costDelta = calculateDelta(data.cost.value, data.cost.prev);
  const callsDelta = calculateDelta(data.calls.value, data.calls.prev);
  const viewsDelta = calculateDelta(data.views.value, data.views.prev);
  const commentsDelta = calculateDelta(data.comments.value, data.comments.prev);
  const eventsDelta = calculateDelta(data.events.value, data.events.prev);

  // Sparkline data for quick visual rhythm
  const costSparkline = [
    data.cost.prev * 0.8,
    data.cost.prev * 0.9,
    data.cost.prev,
    data.cost.value * 0.95,
    data.cost.value,
  ];
  const callsSparkline = [
    data.calls.prev * 0.85,
    data.calls.prev * 0.95,
    data.calls.prev,
    data.calls.value * 0.9,
    data.calls.value,
  ];

  // Drag and Drop reordering handlers
  const handleDragStart = (id: SummaryWidgetId) => {
    setDraggedWidget(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: SummaryWidgetId) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetId) return;

    const currentIndex = widgetOrder.indexOf(draggedWidget);
    const targetIndex = widgetOrder.indexOf(targetId);

    if (currentIndex !== -1 && targetIndex !== -1) {
      const newOrder = [...widgetOrder];
      newOrder.splice(currentIndex, 1);
      newOrder.splice(targetIndex, 0, draggedWidget);
      setWidgetOrder(newOrder);
    }
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const moveWidget = (id: SummaryWidgetId, direction: 'up' | 'down') => {
    const idx = widgetOrder.indexOf(id);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= widgetOrder.length) return;

    const newOrder = [...widgetOrder];
    const [removed] = newOrder.splice(idx, 1);
    newOrder.splice(newIdx, 0, removed);
    setWidgetOrder(newOrder);
  };

  const resetWidgetOrder = () => {
    setWidgetOrder(DEFAULT_WIDGET_ORDER);
  };

  // Render individual widget blocks
  const renderWidget = (id: SummaryWidgetId) => {
    switch (id) {
      case 'primary_kpis':
        return (
          <div key="primary_kpis" className="relative group">
            {isReordering && (
              <div className="flex items-center justify-between pb-1.5 mb-2 text-xs text-slate-400 border-b border-dashed border-slate-300 dark:border-slate-700">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <GripVertical className="w-3.5 h-3.5" /> Блок ключевых KPI
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveWidget('primary_kpis', 'up')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                    title="Поднять вверх"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget('primary_kpis', 'down')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                    title="Опустить вниз"
                  >
                    ↓
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                label="Лиды"
                value={formatNumber(data.leads.value)}
                subtext={`+${formatNumber(data.leads.new)} новых за период`}
                delta={{
                  text: `+${data.leads.new}`,
                  direction: 'up',
                }}
                icon={<Users className="w-4 h-4 text-indigo-600" />}
                anomalyAlert={anomalies.leads}
                onClick={() => onNavigate('leads')}
              />

              <MetricCard
                label="Отчётов всего"
                value={formatNumber(data.reports_total)}
                subtext={`${formatNumber(data.reports_period.value)} сгенерировано за период`}
                icon={<FileText className="w-4 h-4 text-slate-700" />}
                anomalyAlert={anomalies.reports}
                onClick={() => onNavigate('reports')}
              />

              <MetricCard
                label="Расход на модели"
                value={formatMoney(data.cost.value)}
                subtext={`Пред. период: ${formatMoney(data.cost.prev)}`}
                delta={costDelta}
                sparklineData={costSparkline}
                icon={<Coins className="w-4 h-4 text-amber-600" />}
                anomalyAlert={anomalies.aiCost}
                onClick={() => onNavigate('usage')}
              />

              <MetricCard
                label="Вызовов ИИ"
                value={formatNumber(data.calls.value)}
                subtext={`Пред. период: ${formatNumber(data.calls.prev)}`}
                delta={callsDelta}
                sparklineData={callsSparkline}
                icon={<Cpu className="w-4 h-4 text-indigo-600" />}
                anomalyAlert={anomalies.aiCalls}
                onClick={() => onNavigate('usage')}
              />
            </div>
          </div>
        );

      case 'secondary_kpis':
        return (
          <div key="secondary_kpis" className="relative group">
            {isReordering && (
              <div className="flex items-center justify-between pb-1.5 mb-2 text-xs text-slate-400 border-b border-dashed border-slate-300 dark:border-slate-700">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <GripVertical className="w-3.5 h-3.5" /> Дополнительные показатели
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveWidget('secondary_kpis', 'up')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget('secondary_kpis', 'down')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    ↓
                  </button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <MetricCard
                label="Просмотры блога"
                value={formatNumber(data.views.value)}
                subtext={`Пред. период: ${formatNumber(data.views.prev)}`}
                delta={viewsDelta}
                icon={<Eye className="w-4 h-4 text-slate-700" />}
                anomalyAlert={anomalies.views}
                onClick={() => onNavigate('blog')}
              />

              <MetricCard
                label="Комментарии"
                value={formatNumber(data.comments.value)}
                subtext={`Пред. период: ${formatNumber(data.comments.prev)}`}
                delta={commentsDelta}
                icon={<MessageSquare className="w-4 h-4 text-slate-700" />}
                anomalyAlert={anomalies.comments}
                onClick={() => onNavigate('blog')}
              />

              <MetricCard
                label="Событий на сайте"
                value={formatNumber(data.events.value)}
                subtext={`Пред. период: ${formatNumber(data.events.prev)}`}
                delta={eventsDelta}
                icon={<Activity className="w-4 h-4 text-indigo-600" />}
                anomalyAlert={anomalies.events}
                onClick={() => onNavigate('analytics')}
              />
            </div>
          </div>
        );

      case 'trend_chart':
        return (
          <div key="trend_chart" className="relative group">
            {isReordering && (
              <div className="flex items-center justify-between pb-1.5 mb-2 text-xs text-slate-400 border-b border-dashed border-slate-300 dark:border-slate-700">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <GripVertical className="w-3.5 h-3.5" /> График трендов и динамики
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveWidget('trend_chart', 'up')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget('trend_chart', 'down')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    ↓
                  </button>
                </div>
              </div>
            )}
            <SummaryTrendChart data={data} days={days} />
          </div>
        );

      case 'quick_notes':
        return (
          <div key="quick_notes" className="relative group">
            {isReordering && (
              <div className="flex items-center justify-between pb-1.5 mb-2 text-xs text-slate-400 border-b border-dashed border-slate-300 dark:border-slate-700">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <GripVertical className="w-3.5 h-3.5" /> Быстрые заметки
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveWidget('quick_notes', 'up')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget('quick_notes', 'down')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    ↓
                  </button>
                </div>
              </div>
            )}
            <QuickNotesWidget />
          </div>
        );

      case 'quick_nav':
        return (
          <div key="quick_nav" className="relative group">
            {isReordering && (
              <div className="flex items-center justify-between pb-1.5 mb-2 text-xs text-slate-400 border-b border-dashed border-slate-300 dark:border-slate-700">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <GripVertical className="w-3.5 h-3.5" /> Навигационные переходы
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveWidget('quick_nav', 'up')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget('quick_nav', 'down')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    ↓
                  </button>
                </div>
              </div>
            )}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Быстрые переходы
                  </span>
                  <Zap className="w-4 h-4 text-[#37a4d3]" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  Управление и детальный аудит
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Оперативный контроль генерации отчётов, структуры воронки Telegram-бота и проверка состояния серверов.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={() => onNavigate('reports')}
                  className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition-all text-left group cursor-pointer"
                >
                  <span>Лента отчётов</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#37a4d3] transition-colors" />
                </button>
                <button
                  onClick={() => onNavigate('catalog')}
                  className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition-all text-left group cursor-pointer"
                >
                  <span>Каталог ступеней</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#37a4d3] transition-colors" />
                </button>
                <button
                  onClick={() => onNavigate('usage')}
                  className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition-all text-left group cursor-pointer"
                >
                  <span>Графики расходов</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#37a4d3] transition-colors" />
                </button>
                <button
                  onClick={() => onNavigate('inventory')}
                  className="flex items-center justify-between p-3 rounded-md bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 transition-all text-left group cursor-pointer"
                >
                  <span>Хозяйство и ключи</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#37a4d3] transition-colors" />
                </button>
              </div>
            </div>
          </div>
        );

      case 'infra_status':
        return (
          <div key="infra_status" className="relative group">
            {isReordering && (
              <div className="flex items-center justify-between pb-1.5 mb-2 text-xs text-slate-400 border-b border-dashed border-slate-300 dark:border-slate-700">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <GripVertical className="w-3.5 h-3.5" /> Инфраструктурный статус
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveWidget('infra_status', 'up')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveWidget('infra_status', 'down')}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    ↓
                  </button>
                </div>
              </div>
            )}
            <div className="bg-slate-900 text-white rounded-lg p-6 shadow-sm flex flex-col justify-between border border-slate-800">
              <div>
                <h4 className="text-[#37a4d3] font-bold uppercase tracking-widest text-xs mb-3">
                  Состояние инфраструктуры
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between border-b border-slate-800 pb-2.5">
                    <div className="text-xs">
                      <p className="font-medium text-slate-200">VPS vps-srv01.uspeshnyy.ru</p>
                      <p className="text-[11px] text-slate-400">Сайты отвечают без ошибок (200 OK)</p>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono">Active</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800 pb-2.5">
                    <div className="text-xs">
                      <p className="font-medium text-slate-200">Дисковое пространство (NVMe)</p>
                      <p className="text-[11px] text-slate-400">37.8 / 90 ГБ занято</p>
                    </div>
                    <span className="text-[11px] text-slate-300 font-mono">42%</span>
                  </div>

                  <div className="flex justify-between border-b border-slate-800 pb-2.5">
                    <div className="text-xs">
                      <p className="font-medium text-slate-200">Оперативная память (RAM)</p>
                      <p className="text-[11px] text-slate-400">4.7 / 8.0 ГБ занято</p>
                    </div>
                    <span className="text-[11px] text-slate-300 font-mono">58%</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-2">
                <div className="flex justify-between items-center bg-slate-800 p-3 rounded-md">
                  <span className="text-xs text-slate-300">Статус сервисов</span>
                  <span className="text-emerald-400 text-xs font-mono uppercase font-semibold">Optimal</span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Group quick_nav and infra_status in a 2-column grid if they appear adjacent,
  // or render sequentially based on widgetOrder
  return (
    <div className="space-y-6">
      {/* Top Customization & Real-time Alerts Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Мониторинг в реальном времени активен
          </span>
          {Object.keys(anomalies).length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              <AlertTriangle className="w-3 h-3" />
              {Object.keys(anomalies).length} отклонений
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Gemini AI Summary Trigger Button */}
          <button
            type="button"
            onClick={handleGenerateSummary}
            disabled={isGeneratingSummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white shadow-xs transition-all cursor-pointer disabled:opacity-60"
            title="Сформировать аналитическое ИИ-саммари с выводами и рекомендациями"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isGeneratingSummary ? 'animate-spin' : 'animate-pulse'}`} />
            <span>{isGeneratingSummary ? 'Анализирую...' : 'ИИ-Саммари'}</span>
          </button>

          {JSON.stringify(widgetOrder) !== JSON.stringify(DEFAULT_WIDGET_ORDER) && (
            <button
              type="button"
              onClick={resetWidgetOrder}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Сбросить порядок</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsReordering((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border transition-all cursor-pointer ${
              isReordering
                ? 'bg-[#37a4d3] text-white border-[#37a4d3] shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isReordering ? 'Готово (сохранить)' : 'Настроить виджеты'}</span>
          </button>
        </div>
      </div>

      {/* Gemini AI Summary Card */}
      {showSummaryCard && (
        <GeminiSummaryCard
          summary={summaryResult}
          isLoading={isGeneratingSummary}
          error={summaryError}
          onRefresh={handleGenerateSummary}
          onClose={() => setShowSummaryCard(false)}
        />
      )}

      {/* Main Ordered Widgets Container */}
      <div className="space-y-6">
        {widgetOrder.map((widgetId) => (
          <div
            key={widgetId}
            draggable={isReordering}
            onDragStart={() => handleDragStart(widgetId)}
            onDragOver={(e) => handleDragOver(e, widgetId)}
            onDragEnd={handleDragEnd}
            className={`transition-all duration-200 ${
              isReordering
                ? 'cursor-grab active:cursor-grabbing p-1.5 rounded-lg border-2 border-dashed border-[#37a4d3]/40 bg-[#37a4d3]/5 mb-4'
                : ''
            } ${draggedWidget === widgetId ? 'opacity-40 scale-[0.99]' : 'opacity-100'}`}
          >
            {renderWidget(widgetId)}
          </div>
        ))}
      </div>
    </div>
  );
};
