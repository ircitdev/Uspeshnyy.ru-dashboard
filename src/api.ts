import {
  SummaryData,
  ReportsResponse,
  CatalogStepItem,
  UsageData,
  LeadsResponse,
  AnalyticsData,
  BlogData,
  InventoryData,
} from './types';
import {
  MOCK_SUMMARY,
  MOCK_REPORTS,
  MOCK_CATALOG,
  MOCK_USAGE,
  MOCK_LEADS,
  MOCK_ANALYTICS,
  MOCK_BLOG,
  MOCK_INVENTORY,
} from './mockData';

// Manage Key in session storage or URL hash
export function getStoredKey(): string {
  if (typeof window === 'undefined') return '';
  const hash = window.location.hash.replace(/^#/, '').trim();
  if (hash && hash.startsWith('admkey=')) {
    const key = hash.replace('admkey=', '');
    try {
      sessionStorage.setItem('admkey', key);
    } catch {
      // ignore
    }
    window.history.replaceState(null, '', window.location.pathname);
    return key;
  }
  if (hash && !hash.includes('=')) {
    try {
      sessionStorage.setItem('admkey', hash);
    } catch {
      // ignore
    }
    window.history.replaceState(null, '', window.location.pathname);
    return hash;
  }
  try {
    return sessionStorage.getItem('admkey') || '';
  } catch {
    return '';
  }
}

export function setStoredKey(key: string): void {
  try {
    if (key) {
      sessionStorage.setItem('admkey', key);
    } else {
      sessionStorage.removeItem('admkey');
    }
  } catch {
    // ignore
  }
}

// Data API with real fetch + mock fallback
export async function fetchAdminData<T>(
  endpoint: string,
  days: string | number,
  key: string,
  forceMock = false
): Promise<{ data: T; isLive: boolean; latencyMs: number }> {
  const startTime = performance.now();

  // If no key or forceMock is true, return authentic mock data
  if (forceMock || !key) {
    await new Promise((resolve) => setTimeout(resolve, 95 + Math.floor(Math.random() * 50)));
    const latencyMs = Math.round(performance.now() - startTime);
    return { data: getMockDataForEndpoint(endpoint, Number(days)) as T, isLive: false, latencyMs };
  }

  const url = `/api/adm/${endpoint}${endpoint.includes('?') ? '&' : '?'}days=${days}`;
  try {
    const res = await fetch(url, {
      headers: {
        'X-Adm-Key': key,
      },
    });

    if (res.status === 403) {
      throw new Error('Неверный ключ доступа (403)');
    }
    if (!res.ok) {
      throw new Error(`Ошибка сервера (${res.status})`);
    }

    const data = await res.json();
    const latencyMs = Math.round(performance.now() - startTime);
    return { data, isLive: true, latencyMs };
  } catch (err: any) {
    console.warn(`[Admin API fallback] Endpoint /api/adm/${endpoint} failed, using mock data.`, err);
    // Graceful fallback to rich mock data
    const latencyMs = Math.round(performance.now() - startTime);
    return { data: getMockDataForEndpoint(endpoint, Number(days)) as T, isLive: false, latencyMs };
  }
}

function getMockDataForEndpoint(endpoint: string, days: number): any {
  // Scale some numbers proportionally to days
  const scale = days / 30;

  switch (endpoint) {
    case 'summary':
      return {
        ...MOCK_SUMMARY,
        leads: {
          value: Math.round(MOCK_SUMMARY.leads.value * (0.8 + scale * 0.2)),
          new: Math.max(12, Math.round(MOCK_SUMMARY.leads.new * scale)),
        },
        reports_period: {
          value: Math.max(25, Math.round(MOCK_SUMMARY.reports_period.value * scale)),
        },
        cost: {
          value: +(MOCK_SUMMARY.cost.value * scale).toFixed(2),
          prev: +(MOCK_SUMMARY.cost.prev * scale).toFixed(2),
        },
        calls: {
          value: Math.round(MOCK_SUMMARY.calls.value * scale),
          prev: Math.round(MOCK_SUMMARY.calls.prev * scale),
        },
      } as SummaryData;

    case 'reports':
      return {
        ...MOCK_REPORTS,
        total: Math.round(MOCK_REPORTS.total * scale),
      } as ReportsResponse;

    case 'catalog':
      return MOCK_CATALOG as CatalogStepItem[];

    case 'usage':
      return {
        ...MOCK_USAGE,
        total: {
          ...MOCK_USAGE.total,
          cost: +(MOCK_USAGE.total.cost * scale).toFixed(2),
          calls: Math.round(MOCK_USAGE.total.calls * scale),
        },
      } as UsageData;

    case 'leads':
      return MOCK_LEADS as LeadsResponse;

    case 'analytics':
      return {
        ...MOCK_ANALYTICS,
        metrika: MOCK_ANALYTICS.metrika
          ? {
              ...MOCK_ANALYTICS.metrika,
              visits: Math.round(MOCK_ANALYTICS.metrika.visits * scale),
              users: Math.round(MOCK_ANALYTICS.metrika.users * scale),
            }
          : undefined,
      } as AnalyticsData;

    case 'blog':
      return MOCK_BLOG as BlogData;

    case 'inventory':
      return MOCK_INVENTORY as InventoryData;

    default:
      return {};
  }
}

// Formatting helpers
export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '—';
  if (Math.abs(n) >= 1000) {
    return Math.round(n).toLocaleString('ru-RU');
  }
  return (Math.round(n * 100) / 100).toLocaleString('ru-RU');
}

export function formatMoney(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '$0.00';
  return '$' + n.toFixed(2);
}

export function formatRub(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '— ₽';
  return (
    n.toLocaleString('ru-RU', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' ₽'
  );
}

export function formatDateTime(ts: number | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(ts: number | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function calculateDelta(cur: number, prev?: number) {
  if (!prev || prev === 0) {
    return {
      text: cur ? 'Новое' : '—',
      direction: 'flat' as const,
      percent: 0,
    };
  }
  const deltaVal = Math.round(((cur - prev) / prev) * 100);
  if (Math.abs(deltaVal) < 1) {
    return {
      text: 'без изменений',
      direction: 'flat' as const,
      percent: 0,
    };
  }
  return {
    text: `${deltaVal > 0 ? '+' : ''}${deltaVal}%`,
    direction: (deltaVal > 0 ? 'up' : 'down') as 'up' | 'down',
    percent: Math.abs(deltaVal),
  };
}
