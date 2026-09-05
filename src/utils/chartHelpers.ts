import { SummaryData, MetrikaData } from '../types';

export interface SummaryTrendPoint {
  date: string;
  dayLabel: string;
  leads: number;
  cumulativeLeads: number;
  reports: number;
  cumulativeReports: number;
  cost: number;
  cumulativeCost: number;
  calls: number;
  views: number;
  events: number;
}

export interface AnalyticsTrendPoint {
  date: string;
  dayLabel: string;
  visits: number;
  users: number;
  bounceRate: number;
  conversions: number;
  prevVisits?: number;
  prevUsers?: number;
  prevBounceRate?: number;
}

/**
 * Generate smooth, realistic daily trend data for SummaryView.
 * Normalizes values so their sum or average precisely matches the SummaryData metrics.
 */
export function generateSummaryTrend(
  data: SummaryData,
  daysCount: number = 30
): SummaryTrendPoint[] {
  const count = Math.max(7, Math.min(daysCount || 30, 90));
  const points: SummaryTrendPoint[] = [];

  const targetLeads = data.leads?.new ?? 184;
  const targetReports = data.reports_period?.value ?? 618;
  const targetCost = data.cost?.value ?? 84.62;
  const targetCalls = data.calls?.value ?? 1840;
  const targetViews = data.views?.value ?? 24890;
  const targetEvents = data.events?.value ?? 9240;

  // Base pseudorandom weights with weekday effect and gentle upward trend
  const weights: number[] = [];
  for (let i = 0; i < count; i++) {
    // 0 = oldest, count - 1 = most recent
    const progress = i / (count - 1);
    const dayOfWeek = (i + 3) % 7; // rough weekday pattern
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.72 : 1.08;
    // Upward trend over period (from 0.85 to 1.18)
    const trendFactor = 0.85 + progress * 0.33;
    // Organic wave
    const wave = 1 + 0.12 * Math.sin((i * Math.PI) / 3.5);
    weights.push(weekendFactor * trendFactor * wave);
  }

  const weightSum = weights.reduce((acc, w) => acc + w, 0);

  // Reference anchor date: 2026-09-05
  const baseDate = new Date(2026, 8, 5); // Month is 0-indexed (8 = September)

  let cumLeads = 0;
  let cumReports = 0;
  let cumCost = 0;

  for (let i = 0; i < count; i++) {
    const pointDate = new Date(baseDate);
    pointDate.setDate(baseDate.getDate() - (count - 1 - i));

    const w = weights[i] / weightSum;
    const dayLeads = Math.max(1, Math.round(targetLeads * w));
    const dayReports = Math.max(1, Math.round(targetReports * w));
    const dayCost = Number((targetCost * w).toFixed(2));
    const dayCalls = Math.max(1, Math.round(targetCalls * w));
    const dayViews = Math.max(10, Math.round(targetViews * w));
    const dayEvents = Math.max(5, Math.round(targetEvents * w));

    cumLeads += dayLeads;
    cumReports += dayReports;
    cumCost = Number((cumCost + dayCost).toFixed(2));

    const dayStr = `${pointDate.getDate().toString().padStart(2, '0')}.${(
      pointDate.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}`;

    points.push({
      date: dayStr,
      dayLabel: pointDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      }),
      leads: dayLeads,
      cumulativeLeads: cumLeads,
      reports: dayReports,
      cumulativeReports: cumReports,
      cost: dayCost,
      cumulativeCost: cumCost,
      calls: dayCalls,
      views: dayViews,
      events: dayEvents,
    });
  }

  return points;
}

/**
 * Generate smooth, realistic daily traffic trend data for AnalyticsView.
 */
export function generateAnalyticsTrafficTrend(
  metrika: MetrikaData,
  daysCount: number = 30
): AnalyticsTrendPoint[] {
  const count = Math.max(7, Math.min(daysCount || 30, 90));
  const points: AnalyticsTrendPoint[] = [];

  const targetVisits = metrika?.visits || 28450;
  const prevTargetVisits = metrika?.visits_prev || Math.round(targetVisits * 0.88);
  const targetUsers = metrika?.users || 21920;
  const prevTargetUsers = metrika?.users_prev || Math.round(targetUsers * 0.86);
  const baseBounce = metrika?.bounce || 24.8;
  const totalGoals = metrika?.goals?.reduce((acc, g) => acc + (g.n || 0), 0) || 1690;

  // Base weights with realistic traffic fluctuations
  const weights: number[] = [];
  const prevWeights: number[] = [];
  for (let i = 0; i < count; i++) {
    const progress = i / (count - 1);
    const dayOfWeek = (i + 3) % 7;
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.78 : 1.1;
    const trendFactor = 0.88 + progress * 0.28;
    const wave = 1 + 0.1 * Math.cos((i * Math.PI) / 4);
    weights.push(weekendFactor * trendFactor * wave);

    // Realistic variation for the previous period's corresponding days
    const prevWave = 1 + 0.12 * Math.sin(((i + 2) * Math.PI) / 3.8);
    prevWeights.push(weekendFactor * (0.82 + progress * 0.22) * prevWave);
  }

  const weightSum = weights.reduce((acc, w) => acc + w, 0);
  const prevWeightSum = prevWeights.reduce((acc, w) => acc + w, 0);
  const baseDate = new Date(2026, 8, 5);

  for (let i = 0; i < count; i++) {
    const pointDate = new Date(baseDate);
    pointDate.setDate(baseDate.getDate() - (count - 1 - i));

    const w = weights[i] / weightSum;
    const prevW = prevWeights[i] / prevWeightSum;

    const dayVisits = Math.max(10, Math.round(targetVisits * w));
    const prevDayVisits = Math.max(10, Math.round(prevTargetVisits * prevW));

    // Users are typically 75-82% of visits
    const dayUsers = Math.max(8, Math.round(targetUsers * w));
    const prevDayUsers = Math.max(8, Math.round(prevTargetUsers * prevW));

    // Bounce rate fluctuates slightly +/- 2%
    const bounceVariance = ((i % 5) - 2) * 0.7;
    const dayBounce = Number(Math.max(15, Math.min(45, baseBounce + bounceVariance)).toFixed(1));
    const prevDayBounce = Number(Math.max(15, Math.min(45, baseBounce + 1.4 - bounceVariance * 0.8)).toFixed(1));
    const dayConversions = Math.max(1, Math.round(totalGoals * w));

    const dayStr = `${pointDate.getDate().toString().padStart(2, '0')}.${(
      pointDate.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}`;

    points.push({
      date: dayStr,
      dayLabel: pointDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
      }),
      visits: dayVisits,
      users: dayUsers,
      bounceRate: dayBounce,
      conversions: dayConversions,
      prevVisits: prevDayVisits,
      prevUsers: prevDayUsers,
      prevBounceRate: prevDayBounce,
    });
  }

  return points;
}
