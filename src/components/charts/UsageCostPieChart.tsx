import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector,
} from 'recharts';
import { ProviderUsage, PurposeUsage } from '../../types';
import { formatMoney, formatNumber } from '../../api';
import { PieChart as PieIcon, Cpu, Layers, Sparkles, HelpCircle, ArrowUpRight } from 'lucide-react';

interface UsageCostPieChartProps {
  providers: ProviderUsage[];
  purposes?: PurposeUsage[];
  totalCost?: number;
}

type GroupMode = 'models' | 'providers' | 'purposes';

interface SegmentItem {
  id: string;
  name: string;
  subname?: string;
  cost: number;
  calls: number;
  fails?: number;
  avgCost?: number;
  share: number; // 0 to 100
  color: string;
}

// Curated palette with distinctive, high-contrast, professional tones
const PALETTE = [
  '#37a4d3', // Brand Blue (Google / Gemini / Primary)
  '#F59E0B', // Amber (Anthropic / Claude 3.5 Sonnet)
  '#6366F1', // Indigo (DeepSeek / Reasoning)
  '#EC4899', // Pink / Rose (Direct Anthropic / Claude 3.7)
  '#10B981', // Emerald (OpenAI / GPT)
  '#8B5CF6', // Purple (Mistral / Cohere)
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#64748B', // Slate
];

// Color resolver based on name for consistent branding
function resolveColor(name: string, index: number): string {
  const lower = name.toLowerCase();
  if (lower.includes('gemini') || lower.includes('google')) return '#37a4d3';
  if (lower.includes('3.5-sonnet') || lower.includes('openrouter')) return '#F59E0B';
  if (lower.includes('3-7-sonnet') || lower.includes('anthropic')) return '#EC4899';
  if (lower.includes('deepseek')) return '#6366F1';
  if (lower.includes('openai') || lower.includes('gpt')) return '#10B981';
  if (lower.includes('аудит')) return '#37a4d3';
  if (lower.includes('оффер') || lower.includes('утп')) return '#8B5CF6';
  if (lower.includes('seo') || lower.includes('семантик')) return '#10B981';
  if (lower.includes('структур')) return '#F59E0B';
  return PALETTE[index % PALETTE.length];
}

// Active sector renderer for smooth donut highlight
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
  } = props;

  return (
    <g>
      {/* Outer subtle glow/ring */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={outerRadius + 3}
        outerRadius={outerRadius + 7}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.35}
      />
      {/* Expanded active slice */}
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius - 2}
        outerRadius={outerRadius + 4}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};

export const UsageCostPieChart: React.FC<UsageCostPieChartProps> = ({
  providers = [],
  purposes = [],
  totalCost: propTotalCost,
}) => {
  const [groupMode, setGroupMode] = useState<GroupMode>('models');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  // Compute processed segments according to current group mode
  const { segments, totalCalculatedCost, topSpender, cheapestModel } = useMemo(() => {
    let rawItems: SegmentItem[] = [];

    if (groupMode === 'models') {
      // Breakdown by individual models
      const sum = providers.reduce((acc, p) => acc + (p.cost || 0), 0);
      rawItems = providers.map((p, idx) => {
        const share = sum > 0 ? (p.cost / sum) * 100 : 0;
        const avg = p.calls > 0 ? p.cost / p.calls : 0;
        return {
          id: `model-${idx}-${p.model}`,
          name: p.model,
          subname: p.provider,
          cost: p.cost,
          calls: p.calls,
          fails: p.fails,
          avgCost: avg,
          share,
          color: resolveColor(p.model || p.provider, idx),
        };
      });
    } else if (groupMode === 'providers') {
      // Aggregate by provider
      const providerMap: Record<string, { cost: number; calls: number; fails: number }> = {};
      providers.forEach((p) => {
        const key = p.provider || 'Другой';
        if (!providerMap[key]) {
          providerMap[key] = { cost: 0, calls: 0, fails: 0 };
        }
        providerMap[key].cost += p.cost || 0;
        providerMap[key].calls += p.calls || 0;
        providerMap[key].fails += p.fails || 0;
      });

      const providerKeys = Object.keys(providerMap);
      const sum = providerKeys.reduce((acc, k) => acc + providerMap[k].cost, 0);

      rawItems = providerKeys.map((k, idx) => {
        const item = providerMap[k];
        const share = sum > 0 ? (item.cost / sum) * 100 : 0;
        const avg = item.calls > 0 ? item.cost / item.calls : 0;
        return {
          id: `prov-${idx}-${k}`,
          name: k,
          subname: `${item.calls} вызовов`,
          cost: item.cost,
          calls: item.calls,
          fails: item.fails,
          avgCost: avg,
          share,
          color: resolveColor(k, idx),
        };
      });
    } else {
      // Breakdown by workflow purpose / task
      const sum = purposes.reduce((acc, p) => acc + (p.cost || 0), 0);
      rawItems = purposes.map((p, idx) => {
        const share = sum > 0 ? (p.cost / sum) * 100 : 0;
        return {
          id: `purp-${idx}-${p.purpose}`,
          name: p.purpose,
          cost: p.cost,
          calls: p.calls,
          avgCost: p.avg_cost,
          share,
          color: resolveColor(p.purpose, idx),
        };
      });
    }

    // Sort descending by cost
    rawItems.sort((a, b) => b.cost - a.cost);

    const sumCost = rawItems.reduce((acc, it) => acc + it.cost, 0);

    // Insights
    const top = rawItems[0] || null;
    const withCalls = rawItems.filter((it) => it.calls > 0 && it.avgCost !== undefined);
    withCalls.sort((a, b) => (a.avgCost || 0) - (b.avgCost || 0));
    const cheapest = withCalls[0] || null;

    return {
      segments: rawItems,
      totalCalculatedCost: sumCost || propTotalCost || 0,
      topSpender: top,
      cheapestModel: cheapest,
    };
  }, [groupMode, providers, purposes, propTotalCost]);

  const activeItem = activeIndex !== null && segments[activeIndex] ? segments[activeIndex] : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm transition-colors">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#37a4d3]/10 text-[#37a4d3] flex items-center justify-center flex-shrink-0">
            <PieIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Распределение расходов на ИИ
              <span className="text-xs font-normal text-slate-400 font-mono">
                ({segments.length} {groupMode === 'models' ? 'моделей' : groupMode === 'providers' ? 'сервисов' : 'задач'})
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Детализированная структура затрат по используемым нейросетям и шлюзам
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="inline-flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium self-start sm:self-center">
          <button
            type="button"
            onClick={() => {
              setGroupMode('models');
              setActiveIndex(null);
            }}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              groupMode === 'models'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>По моделям</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setGroupMode('providers');
              setActiveIndex(null);
            }}
            className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              groupMode === 'providers'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>По провайдерам</span>
          </button>
          {purposes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setGroupMode('purposes');
                setActiveIndex(null);
              }}
              className={`px-3 py-1.5 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                groupMode === 'purposes'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>По задачам</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Visualization Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center pt-6">
        {/* Left: Recharts Donut PieChart with Central Infobox */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          <div className="w-full h-64 sm:h-72 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={segments}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={98}
                  paddingAngle={3}
                  dataKey="cost"
                  nameKey="name"
                  activeIndex={activeIndex !== null ? activeIndex : undefined}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={(_, index) => setActiveIndex(index === activeIndex ? null : index)}
                  isAnimationActive={true}
                  animationDuration={650}
                  animationEasing="ease-out"
                >
                  {segments.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.id}`}
                      fill={entry.color}
                      stroke="transparent"
                      className="cursor-pointer transition-opacity duration-200"
                      opacity={
                        activeIndex === null || activeIndex === index ? 1 : 0.45
                      }
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload as SegmentItem;
                    return (
                      <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white p-3 rounded-lg shadow-xl border border-slate-700/60 backdrop-blur-xs text-xs font-sans max-w-[240px]">
                        <div className="flex items-center gap-2 mb-1.5 pb-1.5 border-b border-slate-700">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold truncate text-[13px]">
                            {item.name}
                          </span>
                        </div>
                        {item.subname && (
                          <div className="text-[11px] text-slate-400 mb-1">
                            {item.subname}
                          </div>
                        )}
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">Сумма:</span>
                            <span className="font-bold text-emerald-400">
                              {formatMoney(item.cost)}
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">Доля:</span>
                            <span className="font-semibold text-white">
                              {item.share.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between gap-3">
                            <span className="text-slate-400">Вызовов:</span>
                            <span className="text-slate-200">
                              {formatNumber(item.calls)}
                            </span>
                          </div>
                          {item.avgCost !== undefined && item.avgCost > 0 && (
                            <div className="flex justify-between gap-3 pt-1 border-t border-slate-700/50">
                              <span className="text-slate-400">Ср./вызов:</span>
                              <span className="text-sky-300">
                                ${item.avgCost.toFixed(4)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Central Infobox in Donut hole */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
              {activeItem ? (
                <>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    {activeItem.share.toFixed(1)}% расходов
                  </span>
                  <span className="text-lg sm:text-xl font-bold font-mono text-slate-900 dark:text-slate-100 leading-tight">
                    {formatMoney(activeItem.cost)}
                  </span>
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate max-w-[120px] mt-0.5">
                    {activeItem.name}
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Всего расходов
                  </span>
                  <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 leading-tight">
                    {formatMoney(totalCalculatedCost)}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">
                    100% за период
                  </span>
                </>
              )}
            </div>
          </div>

          <span className="text-[11px] text-slate-400 text-center mt-1">
            Наведите на сектор или строку в списке для детальной информации
          </span>
        </div>

        {/* Right: Interactive Segment Breakdown List & Legend */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
            {segments.map((item, idx) => {
              const isSelected = activeIndex === idx;
              return (
                <div
                  key={item.id}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onClick={() => setActiveIndex(isSelected ? null : idx)}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-slate-50 dark:bg-slate-800/80 border-[#37a4d3] shadow-xs'
                      : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                  }`}
                >
                  {/* Left: Indicator & Name */}
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0 transition-transform"
                      style={{
                        backgroundColor: item.color,
                        transform: isSelected ? 'scale(1.25)' : 'scale(1)',
                      }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </span>
                        {item.fails !== undefined && item.fails > 0 && (
                          <span className="text-[10px] text-rose-500 font-medium px-1 rounded bg-rose-50 dark:bg-rose-950/40">
                            {item.fails} сбоев
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {item.subname || `${formatNumber(item.calls)} вызовов`}
                        {item.avgCost && item.avgCost > 0
                          ? ` • $${item.avgCost.toFixed(4)}/выз.`
                          : ''}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Visual mini bar */}
                  <div className="hidden sm:block w-24 flex-shrink-0">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(4, item.share)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Right: Share Badge & Amount */}
                  <div className="text-right flex-shrink-0 flex items-center gap-3">
                    <span
                      className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                      }}
                    >
                      {item.share.toFixed(1)}%
                    </span>
                    <span className="font-bold font-mono text-xs text-slate-900 dark:text-slate-100 min-w-[58px] text-right">
                      {formatMoney(item.cost)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer KPI Highlights / Quick Insights */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        {/* Top Expense */}
        <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400">Лидер по расходам</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {topSpender ? topSpender.name : '—'}
            </div>
            <div className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
              {topSpender ? `${formatMoney(topSpender.cost)} (${topSpender.share.toFixed(1)}%)` : ''}
            </div>
          </div>
        </div>

        {/* Most Economical Model */}
        <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400">Экономичный вызов</div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
              {cheapestModel ? cheapestModel.name : '—'}
            </div>
            <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              {cheapestModel && cheapestModel.avgCost
                ? `$${cheapestModel.avgCost.toFixed(4)} за вызов`
                : ''}
            </div>
          </div>
        </div>

        {/* Efficiency & Success Rate */}
        <div className="p-3 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#37a4d3]/10 text-[#37a4d3] flex items-center justify-center flex-shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] text-slate-400">Успешность запросов</div>
            {(() => {
              const totalCalls = providers.reduce((acc, p) => acc + (p.calls || 0), 0);
              const totalFails = providers.reduce((acc, p) => acc + (p.fails || 0), 0);
              const rate = totalCalls > 0 ? (((totalCalls - totalFails) / totalCalls) * 100).toFixed(1) : '100';
              return (
                <>
                  <div className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                    {rate}% успеха
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {totalFails} сбоев на {formatNumber(totalCalls)} вызовов
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
