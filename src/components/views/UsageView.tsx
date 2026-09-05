import React, { useState, useEffect } from 'react';
import { UsageData } from '../../types';
import { MetricCard } from '../MetricCard';
import { formatNumber, formatMoney } from '../../api';
import {
  Coins,
  Cpu,
  Database,
  Zap,
  Layers,
  AlertTriangle,
  Settings2,
  Check,
  Bell,
  TrendingUp,
} from 'lucide-react';
import { getAiBudgetSettings, setAiBudgetSettings } from '../../services/budgetSettings';
import { useToast } from '../../context/ToastContext';

interface UsageViewProps {
  data: UsageData;
}

export const UsageView: React.FC<UsageViewProps> = ({ data }) => {
  const { toast } = useToast();
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [budgetSettings, setBudget] = useState(() => getAiBudgetSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [monthlyLimitInput, setMonthlyLimitInput] = useState(
    budgetSettings.monthlyLimit.toString()
  );

  const total = data.total || {
    cost: 0,
    calls: 0,
    tin: 0,
    tout: 0,
    avg_sec: 0,
    fails: 0,
  };
  const byDay = data.by_day || [];
  const providers = data.providers || [];
  const purposes = data.purposes || [];

  const maxDailyCost = Math.max(...byDay.map((d) => d.cost), 0.01);
  const totalTokens = total.tin + total.tout;

  // Check if cost exceeded the configured threshold
  const isBudgetExceeded =
    budgetSettings.isThresholdAlertEnabled && total.cost > budgetSettings.monthlyLimit;

  const budgetUsagePercent = Math.min(
    100,
    budgetSettings.monthlyLimit > 0
      ? Math.round((total.cost / budgetSettings.monthlyLimit) * 100)
      : 0
  );

  // Notify once on mount if budget already exceeded
  useEffect(() => {
    if (isBudgetExceeded) {
      toast.warning(
        'Превышен лимит расходов на ИИ!',
        `Текущие расходы $${total.cost.toFixed(2)} превышают установленный порог в $${budgetSettings.monthlyLimit}`
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(monthlyLimitInput);
    if (isNaN(val) || val <= 0) return;

    const updated = setAiBudgetSettings({
      monthlyLimit: val,
    });
    setBudget(updated);
    setShowSettings(false);

    if (total.cost > val && updated.isThresholdAlertEnabled) {
      toast.warning(
        'Лимит сохранён: порог превышен',
        `Расход ($${total.cost.toFixed(2)}) выше нового лимита ($${val})`
      );
    } else {
      toast.success(
        'Лимит расходов обновлён',
        `Новый месячный порог: $${val}`
      );
    }
  };

  const handleToggleAlerts = () => {
    const updated = setAiBudgetSettings({
      isThresholdAlertEnabled: !budgetSettings.isThresholdAlertEnabled,
    });
    setBudget(updated);
    toast.info(
      updated.isThresholdAlertEnabled
        ? 'Пороговые уведомления включены'
        : 'Пороговые уведомления отключены'
    );
  };

  return (
    <div className="space-y-6">
      {/* Budget Threshold Control Banner */}
      <div
        className={`p-4 rounded-lg border transition-all ${
          isBudgetExceeded
            ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 shadow-sm'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isBudgetExceeded
                  ? 'bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-300 animate-pulse'
                  : 'bg-[#37a4d3]/10 text-[#37a4d3]'
              }`}
            >
              {isBudgetExceeded ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Coins className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {isBudgetExceeded
                    ? 'Внимание: Превышен лимит расходов на ИИ'
                    : 'Мониторинг бюджета расходов на ИИ'}
                </h3>
                {isBudgetExceeded && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-600 text-white animate-pulse">
                    Превышение
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Текущий расход:{' '}
                <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                  {formatMoney(total.cost)}
                </span>{' '}
                из лимита в{' '}
                <span className="font-semibold font-mono text-slate-800 dark:text-slate-200">
                  ${budgetSettings.monthlyLimit}
                </span>{' '}
                ({budgetUsagePercent}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleAlerts}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                budgetSettings.isThresholdAlertEnabled
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
              }`}
              title="Включить / отключить подсветку при превышении"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{budgetSettings.isThresholdAlertEnabled ? 'Оповещения вкл' : 'Оповещения выкл'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSettings((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Лимит</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              style={{ width: `${Math.min(100, (total.cost / budgetSettings.monthlyLimit) * 100)}%` }}
              className={`h-full rounded-full transition-all duration-300 ${
                isBudgetExceeded
                  ? 'bg-rose-600'
                  : budgetUsagePercent > 80
                  ? 'bg-amber-500'
                  : 'bg-[#37a4d3]'
              }`}
            />
          </div>
        </div>

        {/* Inline settings editor */}
        {showSettings && (
          <form
            onSubmit={handleSaveBudget}
            className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-3 text-xs"
          >
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Месячный лимит (USD):
            </span>
            <div className="relative">
              <span className="absolute left-2.5 top-1.5 text-slate-400 font-mono">$</span>
              <input
                type="number"
                min="1"
                max="10000"
                step="5"
                value={monthlyLimitInput}
                onChange={(e) => setMonthlyLimitInput(e.target.value)}
                className="w-28 pl-6 pr-2 py-1 text-xs font-mono font-bold rounded-md bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-[#37a4d3]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[#37a4d3] text-white font-medium hover:bg-[#2c8bb4] transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Применить</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Отмена
            </button>
          </form>
        )}
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className={
            isBudgetExceeded
              ? 'rounded-lg ring-2 ring-rose-500 ring-offset-2 ring-offset-rose-50 dark:ring-offset-slate-950 transition-all'
              : ''
          }
        >
          <MetricCard
            label="Всего расходов"
            value={formatMoney(total.cost)}
            subtext={`За выбранный период (лимит $${budgetSettings.monthlyLimit})`}
            icon={<Coins className="w-4 h-4 text-amber-600" />}
            anomalyAlert={
              isBudgetExceeded
                ? {
                    type: 'danger',
                    message: `Превышен лимит расходов! Задано: $${budgetSettings.monthlyLimit}, факт: $${total.cost.toFixed(2)}`,
                  }
                : undefined
            }
          />
        </div>

        <MetricCard
          label="Всего вызовов"
          value={formatNumber(total.calls)}
          subtext={`Ср. задержка: ${total.avg_sec}с (сбоев: ${total.fails})`}
          icon={<Cpu className="w-4 h-4 text-[#37a4d3]" />}
        />
        <MetricCard
          label="Входные токены (Prompt)"
          value={formatNumber(total.tin)}
          subtext={`${((total.tin / (totalTokens || 1)) * 100).toFixed(0)}% от общего объёма`}
          icon={<Database className="w-4 h-4 text-slate-600" />}
        />
        <MetricCard
          label="Выходные токены (Completion)"
          value={formatNumber(total.tout)}
          subtext={`${((total.tout / (totalTokens || 1)) * 100).toFixed(0)}% от общего объёма`}
          icon={<Zap className="w-4 h-4 text-[#37a4d3]" />}
        />
      </div>

      {/* Main Bar Chart - Geometric Balance Style */}
      <div className="bg-white dark:bg-slate-900 p-6 border border-slate-200 dark:border-slate-800 rounded-lg shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
              Расход по дням (USD)
            </h3>
            <p className="text-xs text-slate-400">
              Ежедневная динамика затрат на токены и генерацию отчётов
            </p>
          </div>
          {hoveredBarIndex !== null && byDay[hoveredBarIndex] && (
            <div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700">
              <span className="text-slate-500 font-sans">{byDay[hoveredBarIndex].day}: </span>
              <span className="font-bold text-[#37a4d3]">{formatMoney(byDay[hoveredBarIndex].cost)}</span>
              <span className="text-slate-500"> ({formatNumber(byDay[hoveredBarIndex].calls)} выз.)</span>
            </div>
          )}
        </div>

        {/* Dynamic bar chart columns */}
        <div className="h-64 flex items-end gap-1 sm:gap-2 pt-8 border-b border-slate-100 dark:border-slate-800 pb-2">
          {byDay.map((day, idx) => {
            const heightPercent = Math.max(8, (day.cost / maxDailyCost) * 100);
            const isHovered = hoveredBarIndex === idx;
            const isPeak = day.cost === maxDailyCost;

            return (
              <div
                key={day.day}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                onMouseEnter={() => setHoveredBarIndex(idx)}
                onMouseLeave={() => setHoveredBarIndex(null)}
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t transition-all duration-150 ${
                    isPeak
                      ? 'bg-slate-900 dark:bg-slate-100'
                      : isHovered
                      ? 'bg-[#37a4d3]'
                      : idx % 3 === 0
                      ? 'bg-[#37a4d3]/40'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-[#37a4d3]/60'
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* Date labels on x-axis */}
        <div className="flex justify-between text-[10px] text-slate-400 font-mono pt-3">
          <span>{byDay[0]?.day || ''}</span>
          <span>{byDay[Math.floor(byDay.length / 2)]?.day || ''}</span>
          <span>{byDay[byDay.length - 1]?.day || ''}</span>
        </div>
      </div>

      {/* Two Breakdown Tables: Providers and Purposes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Provider & Model */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#37a4d3]" />
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                По провайдерам и моделям
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {providers.length} моделей
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Провайдер / Модель</th>
                  <th className="py-3 px-4 text-right">Вызовы</th>
                  <th className="py-3 px-4 text-right">Сбои</th>
                  <th className="py-3 px-4 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {providers.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{row.provider}</div>
                      <div className="text-[11px] font-mono text-slate-400 truncate max-w-[170px]">
                        {row.model}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatNumber(row.calls)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {row.fails > 0 ? (
                        <span className="text-rose-600 font-bold">{row.fails}</span>
                      ) : (
                        '0'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatMoney(row.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* By Purpose / Step in Workflow */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#37a4d3]" />
              <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                По назначению (этапам)
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-500">
              {purposes.length} этапов
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Назначение / Ступень</th>
                  <th className="py-3 px-4 text-right">Вызовы</th>
                  <th className="py-3 px-4 text-right">Ср. стоимость</th>
                  <th className="py-3 px-4 text-right">Сумма</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {purposes.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{row.purpose}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatNumber(row.calls)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatMoney(row.avg_cost)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatMoney(row.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
