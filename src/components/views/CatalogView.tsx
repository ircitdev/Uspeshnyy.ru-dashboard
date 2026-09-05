import React, { useState, useEffect } from 'react';
import { CatalogStepItem } from '../../types';
import { MetricCard } from '../MetricCard';
import { formatNumber } from '../../api';
import {
  Workflow,
  ChevronDown,
  ChevronUp,
  Terminal,
  Code2,
  ExternalLink,
  Layers,
} from 'lucide-react';

interface CatalogViewProps {
  data: CatalogStepItem[];
  initialStepId?: string;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ data, initialStepId }) => {
  const steps = data || [];
  const [expandedStepId, setExpandedStepId] = useState<string | null>(
    initialStepId || steps[0]?.id || null
  );

  useEffect(() => {
    if (initialStepId) {
      setExpandedStepId(initialStepId);
    }
  }, [initialStepId]);

  const toggleStep = (id: string) => {
    setExpandedStepId(expandedStepId === id ? null : id);
  };

  const totalEstimatedTokens = steps.reduce(
    (acc, step) => acc + (step.estimatedTokens || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          label="Ступеней в конвейере"
          value={steps.length}
          subtext="Последовательная лестница продуктов"
          icon={<Workflow className="w-4 h-4 text-indigo-600" />}
        />
        <MetricCard
          label="Суммарный контекст"
          value={`~${formatNumber(totalEstimatedTokens)}`}
          subtext="Токенов на полный цикл прогона"
          icon={<Code2 className="w-4 h-4 text-slate-700" />}
        />
        <MetricCard
          label="Типов шагов"
          value={Array.from(new Set(steps.map((s) => s.kind))).length}
          subtext="Шаблоны, проверки и правила"
          icon={<Layers className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* Intro info box */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <h3 className="font-semibold text-base text-slate-900 mb-1">
          Каталог ступеней воронки и промптов
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
          Каждая ступень бота решает конкретную бизнес-задачу лида: от быстрого бесплатного разбора сайта до декомпозиции маркетинга и записи на консультацию. Здесь представлены исходные промпты, воркеры и команды запуска.
        </p>
      </div>

      {/* Step by Step List */}
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isExpanded = expandedStepId === step.id;
          return (
            <div
              key={step.id}
              className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden transition-all duration-150"
            >
              {/* Header clickable row */}
              <div
                onClick={() => toggleStep(step.id)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-8 h-8 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold flex items-center justify-center flex-shrink-0 text-sm">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-sm text-slate-900">{step.title}</h4>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        Уровень {step.level}
                      </span>
                      {step.command && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {step.command}
                        </span>
                      )}
                    </div>
                    {step.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs font-mono font-medium text-slate-700 block">
                      {step.kind}
                    </span>
                    {step.estimatedTokens ? (
                      <span className="text-[10px] text-slate-400 font-mono">
                        ~{formatNumber(step.estimatedTokens)} токенов
                      </span>
                    ) : null}
                  </div>
                  <button className="p-1 rounded text-slate-400 hover:text-slate-600">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Prompt and Details Body */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/40 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {step.runner && (
                      <div className="p-3 bg-white border border-slate-200 rounded-md">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                          Воркер / Служба
                        </span>
                        <span className="font-mono font-medium text-slate-800 text-[11px]">
                          {step.runner}
                        </span>
                      </div>
                    )}
                    {step.ask && (
                      <div className="p-3 bg-white border border-slate-200 rounded-md sm:col-span-2">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">
                          Что запрашивает бот
                        </span>
                        <span className="font-medium text-slate-800">{step.ask}</span>
                      </div>
                    )}
                  </div>

                  {step.prompt && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                          <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Инструкция шага / Промпт</span>
                        </div>
                        {step.prompt.where && (
                          <span className="text-[11px] font-mono text-slate-400">
                            {step.prompt.where}
                          </span>
                        )}
                      </div>

                      {step.prompt.text ? (
                        <div className="p-4 rounded-md bg-slate-900 text-slate-200 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed whitespace-pre-wrap">
                          {step.prompt.text}
                        </div>
                      ) : step.prompt.note ? (
                        <div className="p-4 rounded-md bg-slate-100 text-slate-700 text-xs border border-slate-200 leading-relaxed">
                          {step.prompt.note}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {step.deeplink && (
                    <div className="pt-1">
                      <a
                        href={step.deeplink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        <span>Запустить шаг в Telegram-боте</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
