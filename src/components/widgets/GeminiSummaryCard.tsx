import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Lightbulb,
  Copy,
  Check,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GeminiSummaryResult } from '../../services/geminiSummary';

interface GeminiSummaryCardProps {
  summary: GeminiSummaryResult | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onClose: () => void;
}

export const GeminiSummaryCard: React.FC<GeminiSummaryCardProps> = ({
  summary,
  isLoading,
  error,
  onRefresh,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleCopy = () => {
    if (!summary) return;
    const text = `📊 ${summary.title}\n\n📌 КРАТКИЙ ВЫВОД:\n${summary.executiveSummary}\n\n🔍 КЛЮЧЕВЫЕ ИНСАЙТЫ:\n${summary.keyInsights.map((i) => `• ${i}`).join('\n')}\n\n💡 РЕКОМЕНДАЦИИ:\n${summary.recommendations.map((r) => `[${r.category}] ${r.text} (${r.impact})`).join('\n')}\n\nСгенерировано: ${new Date(summary.generatedAt).toLocaleString('ru-RU')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isLoading && !summary && !error) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-indigo-200/80 dark:border-indigo-800/60 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 shadow-md mb-6 transition-all duration-300">
      {/* Decorative gradient blur accent */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-400/10 dark:bg-indigo-600/10 blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-indigo-100/80 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-xs flex-shrink-0">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                {summary?.title || 'ИИ-Аналитика и Саммари данных'}
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                Gemini 2.5 Flash
              </span>
              {summary?.isAiGenerated === false && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  Авто-эвристика
                </span>
              )}
            </div>
            {summary?.generatedAt && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Обновлено {new Date(summary.generatedAt).toLocaleTimeString('ru-RU')}
              </p>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {summary && (
            <>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
                title="Скопировать отчёт"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px]">Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[11px] hidden sm:inline">Копировать</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer disabled:opacity-50"
                title="Обновить анализ"
                aria-label="Обновить анализ"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 transition-all cursor-pointer"
                title={isExpanded ? 'Свернуть' : 'Развернуть'}
                aria-label={isExpanded ? 'Свернуть' : 'Развернуть'}
              >
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title="Закрыть панель"
            aria-label="Закрыть панель"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="p-8 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 animate-spin">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Gemini анализирует текущие метрики...
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              Сводятся данные по лидам, расходам на модели, генерации отчётов и системным аномалиям.
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="p-5 flex items-start gap-3 bg-red-50/70 dark:bg-red-950/30 text-red-700 dark:text-red-300 border-t border-red-100 dark:border-red-900/50">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-semibold">Не удалось сгенерировать ИИ-саммари</p>
            <p className="mt-0.5 text-red-600 dark:text-red-400">{error}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="mt-2 inline-flex items-center gap-1 font-semibold text-red-800 dark:text-red-200 hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Попробовать снова
            </button>
          </div>
        </div>
      )}

      {/* Content body */}
      {!isLoading && summary && isExpanded && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Executive Summary Block */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs rounded-lg p-4 border border-indigo-100 dark:border-slate-700/80 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Краткий вывод</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
              {summary.executiveSummary}
            </p>
          </div>

          {/* 2-Column Grid: Insights & Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Key Insights */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs rounded-lg p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ключевые инсайты</span>
              </h4>
              <ul className="space-y-2.5">
                {summary.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 flex-shrink-0" />
                    <span className="leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xs rounded-lg p-4 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>Рекомендации</span>
              </h4>
              <div className="space-y-2.5">
                {summary.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/70 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {rec.category}
                      </span>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                        {rec.impact}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-normal">
                      {rec.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
