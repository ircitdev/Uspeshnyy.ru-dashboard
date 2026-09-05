export type TabKey =
  | 'summary'
  | 'reports'
  | 'catalog'
  | 'usage'
  | 'leads'
  | 'analytics'
  | 'blog'
  | 'inventory';

export interface TabInfo {
  id: TabKey;
  label: string;
  sublabel: string;
  badge?: string | number;
}

// Summary Types
export interface MetricValue {
  value: number;
  prev?: number;
  new?: number;
}

export interface SummaryData {
  build?: string;
  leads: { value: number; new: number };
  reports_total: number;
  reports_period: { value: number };
  cost: { value: number; prev: number };
  calls: { value: number; prev: number };
  views: { value: number; prev: number };
  comments: { value: number; prev: number };
  events: { value: number; prev: number };
}

// Reports Types
export interface ReportSpendModel {
  provider: string;
  model: string;
}

export interface ReportSpend {
  models: ReportSpendModel[];
  tin: number;
  tout: number;
  cost: number;
}

export interface ReportItem {
  id?: string;
  created: number; // unix timestamp in seconds
  kind: string;
  who: string;
  username?: string;
  url?: string;
  score?: number;
  cost_rub?: number;
  link?: string;
  spend?: ReportSpend;
  summary?: string;
  status?: 'completed' | 'processing' | 'failed';
}

export interface ReportsResponse {
  total: number;
  usd_rate: number;
  rows: ReportItem[];
}

// Catalog Types
export interface CatalogPrompt {
  kind: string;
  where?: string;
  note?: string;
  text?: string;
}

export interface CatalogStepItem {
  id: string;
  title: string;
  kind: 'собранный' | 'шаблон' | 'внутри бота' | 'проверки' | 'правила' | string;
  level: number | string;
  menu?: string;
  command?: string;
  deeplink: string;
  runner: string;
  next?: string;
  ask?: string;
  prompt: CatalogPrompt;
  description?: string;
  estimatedTokens?: number;
}

// Usage Types
export interface DaySpend {
  day: string;
  cost: number;
  calls: number;
  tokens?: number;
}

export interface ProviderUsage {
  provider: string;
  model: string;
  calls: number;
  fails: number;
  cost: number;
}

export interface PurposeUsage {
  purpose: string;
  calls: number;
  cost: number;
  avg_cost: number;
}

export interface UsageTotal {
  cost: number;
  calls: number;
  tin: number;
  tout: number;
  avg_sec: number;
  fails: number;
}

export interface UsageData {
  total: UsageTotal;
  by_day: DaySpend[];
  providers: ProviderUsage[];
  purposes: PurposeUsage[];
}

// Leads Types
export interface LeadPerson {
  user_id: string | number;
  full_name?: string;
  username?: string;
  source?: string;
  reports: number;
  created: number;
  last_report: number;
  verified?: boolean;
  status?: 'new' | 'in_progress' | 'verified' | 'qualified' | 'archived' | string;
}

export interface LeadKindStat {
  kind: string;
  n: number;
  people: number;
}

export interface LeadSourceStat {
  src: string;
  n: number;
}

export interface LeadEventItem {
  type: string;
  n: number;
  last_seen?: number;
}

export interface LeadsResponse {
  people: LeadPerson[];
  by_kind: LeadKindStat[];
  by_source: LeadSourceStat[];
  events: LeadEventItem[];
}

// Analytics Types
export interface AnalyticsSource {
  name: string;
  n: number;
}

export interface AnalyticsPage {
  name: string;
  n: number;
}

export interface AnalyticsGoal {
  name: string;
  n: number;
  prev: number;
}

export interface MetrikaData {
  visits: number;
  visits_prev: number;
  users: number;
  users_prev: number;
  bounce: number;
  dur: number; // seconds
  from: string;
  to: string;
  sources: AnalyticsSource[];
  pages: AnalyticsPage[];
  goals: AnalyticsGoal[];
}

export interface WebmasterQuery {
  q: string;
  shows: number;
  clicks: number;
}

export interface WebmasterProblem {
  code: string;
  level: string;
}

export interface WebmasterData {
  in_search: number;
  excluded: number;
  queries_total: number;
  queries: WebmasterQuery[];
  problems?: WebmasterProblem[];
}

export interface AnalyticsData {
  metrika?: MetrikaData;
  webmaster?: WebmasterData;
  errors?: string[];
}

// Blog Types
export interface BlogRecentItem {
  slug: string;
  n: number;
  title?: string;
}

export interface BlogTopItem {
  slug: string;
  views: number;
  comments: number;
  title?: string;
}

export interface BlogData {
  posts_with_views: number;
  comments_total: number;
  recent: BlogRecentItem[];
  top: BlogTopItem[];
}

// Inventory Types
export interface ServerSpecs {
  host?: string;
  ip?: string;
  disk_percent: number;
  disk_used_gb: number;
  disk_total_gb: number;
  disk_alert?: boolean;
  mem_percent: number;
  mem_used_mb: number;
  mem_total_mb: number;
  mem_alert?: boolean;
  uptime?: string;
  cpu_percent?: number;
}

export interface SiteItem {
  domain: string;
  what: string;
  project: string;
  code: number | null;
  problem?: boolean;
  cert_days: number | null;
  cert_soon?: boolean;
  ssl_valid?: boolean;
  response_ms?: number;
}

export interface ServiceItem {
  unit: string;
  what: string;
  active: boolean | null;
  expected?: boolean;
  mem_mb?: number;
  restart_count?: number;
  status_text?: string;
}

export interface KeyItem {
  name: string;
  where: string;
  breaks: string;
  status?: 'active' | 'expiring' | 'missing';
}

export interface InventoryData {
  server: ServerSpecs;
  sites: {
    rows: SiteItem[];
    unlisted?: string[];
  };
  services: {
    rows: ServiceItem[];
    unlisted?: string[];
  };
  keys: KeyItem[];
}

// Theme Types
export type ThemeMode = 'light' | 'dark' | 'system';

// Search Types
export type SearchCategory =
  | 'all'
  | 'tabs'
  | 'reports'
  | 'catalog'
  | 'leads'
  | 'blog'
  | 'inventory'
  | 'actions';

export interface SearchItem {
  id: string;
  category: Exclude<SearchCategory, 'all'>;
  categoryLabel: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeColor?: 'indigo' | 'emerald' | 'amber' | 'blue' | 'purple' | 'slate' | 'rose';
  iconType:
    | 'layout'
    | 'file-text'
    | 'workflow'
    | 'users'
    | 'book-open'
    | 'server'
    | 'activity'
    | 'key'
    | 'calendar'
    | 'refresh-cw'
    | 'sparkles'
    | 'sun'
    | 'moon'
    | 'send';
  keywords?: string[];
  tabTarget?: TabKey;
  targetSearchQuery?: string;
  targetStepId?: string;
  actionType?: 'changePeriod' | 'refresh' | 'openKeyModal' | 'toggleDemo' | 'toggleTheme' | 'setTheme' | 'openTelegramSettings';
  actionValue?: string;
}

// Toast Notification Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  timestamp: number;
}

// Quick Notes Types
export type NoteCategory = 'general' | 'important' | 'idea' | 'bug';

export interface QuickNote {
  id: string;
  text: string;
  category: NoteCategory;
  pinned?: boolean;
  createdAt: number;
  updatedAt?: number;
}

// Anomaly & Monitoring Alert Types
export interface MetricAnomaly {
  id: string;
  metricKey: string;
  label: string;
  type: 'warning' | 'danger' | 'info';
  badge: string;
  title: string;
  description: string;
  currentValue: number | string;
  baselineValue: number | string;
  diffPercent: number;
}

// Summary Widget Reordering Types
export type SummaryWidgetId =
  | 'primary_kpis'
  | 'secondary_kpis'
  | 'trend_chart'
  | 'quick_notes'
  | 'quick_nav'
  | 'infra_status'
  | 'primary_kpi'
  | 'secondary_kpi'
  | 'shortcuts';

export interface SummaryWidgetItem {
  id: SummaryWidgetId;
  title: string;
  visible: boolean;
}

// AI Budget / Expense Threshold
export interface AiBudgetSettings {
  limitUsd: number;
  alertEnabled: boolean;
  monthlyLimit: number;
  isThresholdAlertEnabled: boolean;
  telegramId?: string;
  telegramAlertsEnabled?: boolean;
}

export interface TelegramAlertPayload {
  telegramId: string;
  currentCost?: number;
  currentExpense?: number;
  limitUsd?: number;
  limit?: number;
  periodDays?: number;
  isTest?: boolean;
  exceededAmount?: number;
  exceededPercentage?: number;
  messageType?: 'budget_exceeded' | 'daily_report' | 'anomaly' | 'test';
  customTitle?: string;
  customDetails?: string;
}

export interface TelegramAlertResponse {
  success: boolean;
  simulated?: boolean;
  message: string;
  deliveredAt?: string;
  previewText?: string;
  chatId?: string;
  error?: string;
}
