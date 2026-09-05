import { SummaryData, MetricAnomaly } from '../types';

/**
 * Anomaly Detection Service for Real-time Monitoring
 * Evaluates KPIs against historical baselines and thresholds.
 */
export function detectSummaryAnomalies(
  data: SummaryData,
  budgetLimit: number = 50
): Record<string, MetricAnomaly> {
  const anomalies: Record<string, MetricAnomaly> = {};

  if (!data) return anomalies;

  // 1. AI Expenses Monitoring (Расходы на ИИ)
  const costCurr = data.cost?.value || 0;
  const costPrev = data.cost?.prev || 0;
  if (costPrev > 0) {
    const costDiffPct = ((costCurr - costPrev) / costPrev) * 100;

    // Trigger alert if surge is > 20% or exceeds the configured budget limit
    if (costCurr > budgetLimit) {
      anomalies['cost'] = {
        id: 'anomaly_cost_budget',
        metricKey: 'cost',
        label: 'Расход на модели',
        type: 'danger',
        badge: `Лимит +${Math.round(((costCurr - budgetLimit) / budgetLimit) * 100)}%`,
        title: 'Превышение лимита бюджета',
        description: `Текущий расход ($${costCurr.toFixed(2)}) превысил лимит в настройках ($${budgetLimit.toFixed(2)}).`,
        currentValue: `$${costCurr.toFixed(2)}`,
        baselineValue: `$${budgetLimit.toFixed(2)}`,
        diffPercent: Number(costDiffPct.toFixed(1)),
      };
    } else if (costDiffPct >= 25) {
      anomalies['cost'] = {
        id: 'anomaly_cost_surge',
        metricKey: 'cost',
        label: 'Расход на модели',
        type: 'warning',
        badge: `Всплеск +${Math.round(costDiffPct)}%`,
        title: 'Аномальный рост расходов',
        description: `Затраты выросли на ${costDiffPct.toFixed(1)}% выше среднего значения прошлого периода.`,
        currentValue: `$${costCurr.toFixed(2)}`,
        baselineValue: `$${costPrev.toFixed(2)}`,
        diffPercent: Number(costDiffPct.toFixed(1)),
      };
    }
  }

  // 2. Leads & Conversion Monitoring (Лиды и конверсия)
  const leadsNew = data.leads?.new || 0;
  const reportsCount = data.reports_period?.value || 1;
  const conversionRate = (leadsNew / reportsCount) * 100;
  const baselineConversion = 22.5; // Average expected conversion rate in %

  const conversionDiff = ((conversionRate - baselineConversion) / baselineConversion) * 100;

  if (conversionRate < 18) {
    anomalies['leads'] = {
      id: 'anomaly_leads_low_conv',
      metricKey: 'leads',
      label: 'Лиды',
      type: 'warning',
      badge: `Конверсия ${conversionRate.toFixed(1)}%`,
      title: 'Конверсия ниже средней нормы',
      description: `Конверсия из отчётов в лиды (${conversionRate.toFixed(1)}%) отклонилась от нормы (22-26%).`,
      currentValue: `${conversionRate.toFixed(1)}%`,
      baselineValue: `${baselineConversion}%`,
      diffPercent: Number(conversionDiff.toFixed(1)),
    };
  } else if (conversionDiff >= 30) {
    anomalies['leads'] = {
      id: 'anomaly_leads_high_conv',
      metricKey: 'leads',
      label: 'Лиды',
      type: 'info',
      badge: `Конверсия +${Math.round(conversionDiff)}%`,
      title: 'Высокая конверсия в лиды',
      description: `Показатель конверсии вырос до ${conversionRate.toFixed(1)}% (на ${conversionDiff.toFixed(1)}% выше нормы).`,
      currentValue: `${conversionRate.toFixed(1)}%`,
      baselineValue: `${baselineConversion}%`,
      diffPercent: Number(conversionDiff.toFixed(1)),
    };
  }

  // 3. AI Calls Volume Monitoring (Вызовы ИИ)
  const callsCurr = data.calls?.value || 0;
  const callsPrev = data.calls?.prev || 0;
  if (callsPrev > 0) {
    const callsDiffPct = ((callsCurr - callsPrev) / callsPrev) * 100;
    if (callsDiffPct >= 35) {
      anomalies['calls'] = {
        id: 'anomaly_calls_surge',
        metricKey: 'calls',
        label: 'Вызовов ИИ',
        type: 'warning',
        badge: `Всплеск вызовов +${Math.round(callsDiffPct)}%`,
        title: 'Повышенная нагрузка на API',
        description: `Частота обращений к LLM возросла на ${callsDiffPct.toFixed(1)}% выше обычного уровня.`,
        currentValue: callsCurr,
        baselineValue: callsPrev,
        diffPercent: Number(callsDiffPct.toFixed(1)),
      };
    }
  }

  // 4. Website Events / Traffic Monitoring (События на сайте)
  const eventsCurr = data.events?.value || 0;
  const eventsPrev = data.events?.prev || 0;
  if (eventsPrev > 0) {
    const eventsDiffPct = ((eventsCurr - eventsPrev) / eventsPrev) * 100;
    if (eventsDiffPct <= -25) {
      anomalies['events'] = {
        id: 'anomaly_events_drop',
        metricKey: 'events',
        label: 'Событий на сайте',
        type: 'warning',
        badge: `Спад активности ${Math.round(eventsDiffPct)}%`,
        title: 'Снижение вовлечённости',
        description: `Количество зарегистрированных событий снизилось на ${Math.abs(eventsDiffPct).toFixed(1)}%.`,
        currentValue: eventsCurr,
        baselineValue: eventsPrev,
        diffPercent: Number(eventsDiffPct.toFixed(1)),
      };
    }
  }

  return anomalies;
}
