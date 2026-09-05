import { SearchItem, TabKey } from '../types';
import {
  MOCK_REPORTS,
  MOCK_CATALOG,
  MOCK_LEADS,
  MOCK_BLOG,
  MOCK_INVENTORY,
} from '../mockData';

export function buildSearchIndex(activeReports?: any[]): SearchItem[] {
  const items: SearchItem[] = [];

  // 1. Navigation Sections (Tabs)
  const TABS_DATA: {
    id: TabKey;
    title: string;
    subtitle: string;
    badge: string;
    keywords: string[];
  }[] = [
    {
      id: 'summary',
      title: 'Сводка',
      subtitle: 'Главные KPI, лиды, выручка, конверсия, события и расходы',
      badge: 'Раздел',
      keywords: ['дашборд', 'dashboard', 'overview', 'kpi', 'главная', 'метрики', 'выручка'],
    },
    {
      id: 'reports',
      title: 'Отчёты',
      subtitle: 'Все созданные аудиты сайтов, скоринг, spend по LLM и ссылки',
      badge: 'Раздел',
      keywords: ['аудит', 'audit', 'сайты', 'разборы', 'клиенты', 'отчеты', 'скоринг'],
    },
    {
      id: 'catalog',
      title: 'Каталог промптов',
      subtitle: 'Ступени воронки Telegram-бота, системные промпты и шаблоны',
      badge: 'Раздел',
      keywords: ['промпты', 'prompts', 'воронка', 'шаблоны', 'команды', 'bot', 'бот'],
    },
    {
      id: 'usage',
      title: 'Расход API',
      subtitle: 'Затраты на ИИ-модели, токены, сбои провайдеров и динамика',
      badge: 'Раздел',
      keywords: ['llm', 'расходы', 'токены', 'api', 'claude', 'gemini', 'deepseek', 'openrouter', 'деньги'],
    },
    {
      id: 'leads',
      title: 'Лиды',
      subtitle: 'Пользователи бота, верифицированные контакты и источники заявок',
      badge: 'Раздел',
      keywords: ['клиенты', 'контакты', 'пользователи', 'telegram', 'заявки', 'юзеры'],
    },
    {
      id: 'analytics',
      title: 'Аналитика',
      subtitle: 'Каналы привлечения, воронка конверсии шагов и метрики аудитов',
      badge: 'Раздел',
      keywords: ['трафик', 'конверсия', 'воронка', 'каналы', 'статистика', 'графики'],
    },
    {
      id: 'blog',
      title: 'Блог',
      subtitle: 'Статьи, охват, просмотры публикаций и комментарии читателей',
      badge: 'Раздел',
      keywords: ['статьи', 'контент', 'посты', 'просмотры', 'seo', 'ghost', 'hugo'],
    },
    {
      id: 'inventory',
      title: 'Инфраструктура',
      subtitle: 'VPS сервер, статус systemd сервисов, SSL сертификаты и домены',
      badge: 'Раздел',
      keywords: ['сервер', 'vps', 'ssl', 'домены', 'память', 'cpu', 'systemd', 'бот', 'хостинг'],
    },
  ];

  TABS_DATA.forEach((tab) => {
    items.push({
      id: `tab-${tab.id}`,
      category: 'tabs',
      categoryLabel: 'Разделы',
      title: tab.title,
      subtitle: tab.subtitle,
      badge: tab.badge,
      badgeColor: 'indigo',
      iconType: 'layout',
      keywords: tab.keywords,
      tabTarget: tab.id,
    });
  });

  // 2. Reports Items
  const reportsSource =
    activeReports && Array.isArray(activeReports) && activeReports.length > 0
      ? activeReports
      : MOCK_REPORTS.rows;

  reportsSource.forEach((rep) => {
    const domainClean = rep.url ? rep.url.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
    const modelNames = rep.spend?.models?.map((m: any) => m.model).join(', ') || '';

    items.push({
      id: `rep-${rep.id || Math.random()}`,
      category: 'reports',
      categoryLabel: 'Отчёты',
      title: `${rep.who || 'Отчёт'} — ${rep.kind || 'Аудит'}`,
      subtitle: `${domainClean || rep.url || ''} • ${rep.score ? `Балл: ${rep.score}/100` : ''} • ${rep.cost_rub ? `${rep.cost_rub} ₽` : ''}`,
      badge: rep.id ? rep.id.toUpperCase() : 'ОТЧЁТ',
      badgeColor: 'emerald',
      iconType: 'file-text',
      keywords: [
        rep.who || '',
        rep.username || '',
        domainClean,
        rep.url || '',
        rep.kind || '',
        rep.id || '',
        modelNames,
        'отчёт',
        'аудит',
      ],
      tabTarget: 'reports',
      targetSearchQuery: rep.who || rep.id || domainClean,
    });
  });

  // 3. Catalog Steps
  MOCK_CATALOG.forEach((step) => {
    items.push({
      id: `cat-${step.id}`,
      category: 'catalog',
      categoryLabel: 'Каталог промптов',
      title: `${step.title} (${step.command || 'команда'})`,
      subtitle: `${step.menu || 'Воронка'} • ${step.kind || 'шаг'} • Раннер: ${step.runner || 'service'}`,
      badge: step.command || `Шаг ${step.level}`,
      badgeColor: 'purple',
      iconType: 'workflow',
      keywords: [
        step.title,
        step.command || '',
        step.kind || '',
        step.menu || '',
        step.runner || '',
        step.description || '',
        'промпт',
        'ступень',
      ],
      tabTarget: 'catalog',
      targetStepId: step.id,
    });
  });

  // 4. Leads & Contacts
  MOCK_LEADS.people.forEach((lead) => {
    items.push({
      id: `lead-${lead.user_id}`,
      category: 'leads',
      categoryLabel: 'Лиды',
      title: lead.full_name || `@${lead.username}`,
      subtitle: `@${lead.username} • Источник: ${lead.source} • Отчётов: ${lead.reports}`,
      badge: lead.verified ? 'Верифицирован' : `${lead.reports} отчёта`,
      badgeColor: 'blue',
      iconType: 'users',
      keywords: [
        lead.full_name,
        lead.username,
        String(lead.user_id),
        lead.source,
        'лид',
        'клиент',
        'telegram',
      ],
      tabTarget: 'leads',
      targetSearchQuery: lead.full_name || lead.username,
    });
  });

  // 5. Blog Articles
  const blogList: Array<{ slug: string; title?: string; views?: number; n?: number; comments?: number }> = [
    ...(MOCK_BLOG.top || []),
    ...(MOCK_BLOG.recent || []),
  ];
  const uniqueBlogSlugs = new Set<string>();

  blogList.forEach((post) => {
    if (uniqueBlogSlugs.has(post.slug)) return;
    uniqueBlogSlugs.add(post.slug);

    const views = post.views !== undefined ? post.views : post.n !== undefined ? post.n : 0;
    const comments = post.comments;
    const postTitle = post.title || post.slug;

    items.push({
      id: `blog-${post.slug}`,
      category: 'blog',
      categoryLabel: 'Блог',
      title: postTitle,
      subtitle: `Просмотров: ${views.toLocaleString('ru-RU')} • ${comments !== undefined ? `Комментариев: ${comments}` : 'Статья в блоге'}`,
      badge: `${views.toLocaleString('ru-RU')} просм.`,
      badgeColor: 'rose',
      iconType: 'book-open',
      keywords: [postTitle, post.slug, 'блог', 'статья', 'seo', 'пост'],
      tabTarget: 'blog',
    });
  });

  // 6. Infrastructure Sites & Services
  MOCK_INVENTORY.sites.rows.forEach((site) => {
    items.push({
      id: `site-${site.domain}`,
      category: 'inventory',
      categoryLabel: 'Инфраструктура',
      title: site.domain,
      subtitle: `${site.what} • HTTP ${site.code} • Отклик: ${site.response_ms} ms`,
      badge: `SSL ${site.cert_days} дн.`,
      badgeColor: 'amber',
      iconType: 'server',
      keywords: [site.domain, site.what, site.project, 'домен', 'сайт', 'ssl', 'сервер'],
      tabTarget: 'inventory',
    });
  });

  MOCK_INVENTORY.services.rows.forEach((svc) => {
    items.push({
      id: `svc-${svc.unit}`,
      category: 'inventory',
      categoryLabel: 'Инфраструктура',
      title: svc.unit,
      subtitle: `${svc.what} • Память: ${svc.mem_mb || 0} МБ • ${svc.status_text}`,
      badge: svc.active ? 'Active' : 'Stopped',
      badgeColor: svc.active ? 'emerald' : 'rose',
      iconType: 'activity',
      keywords: [svc.unit, svc.what, 'служба', 'сервис', 'systemd', 'бот', 'воркер'],
      tabTarget: 'inventory',
    });
  });

  // 7. Quick System Actions
  const ACTIONS: {
    id: string;
    title: string;
    subtitle: string;
    badge: string;
    iconType: SearchItem['iconType'];
    actionType: SearchItem['actionType'];
    actionValue?: string;
    keywords: string[];
  }[] = [
    {
      id: 'act-period-7',
      title: 'Период: за 7 дней',
      subtitle: 'Переключить фильтр диапазона данных на последнюю неделю',
      badge: 'Фильтр',
      iconType: 'calendar',
      actionType: 'changePeriod',
      actionValue: '7',
      keywords: ['период', '7 дней', 'неделя', 'время', 'фильтр'],
    },
    {
      id: 'act-period-30',
      title: 'Период: за 30 дней (Месяц)',
      subtitle: 'Переключить фильтр диапазона данных на стандартный месяц',
      badge: 'Фильтр',
      iconType: 'calendar',
      actionType: 'changePeriod',
      actionValue: '30',
      keywords: ['период', '30 дней', 'месяц', 'время', 'фильтр'],
    },
    {
      id: 'act-period-90',
      title: 'Период: за 90 дней (Квартал)',
      subtitle: 'Переключить фильтр диапазона данных на квартальную статистику',
      badge: 'Фильтр',
      iconType: 'calendar',
      actionType: 'changePeriod',
      actionValue: '90',
      keywords: ['период', '90 дней', 'квартал', 'время', 'фильтр'],
    },
    {
      id: 'act-period-365',
      title: 'Период: за год (365 дней)',
      subtitle: 'Переключить фильтр диапазона данных на годовой объём',
      badge: 'Фильтр',
      iconType: 'calendar',
      actionType: 'changePeriod',
      actionValue: '365',
      keywords: ['период', 'год', '365 дней', 'время', 'фильтр'],
    },
    {
      id: 'act-refresh',
      title: 'Обновить данные системы',
      subtitle: 'Запросить свежие метрики и очистить временный кэш',
      badge: 'Действие',
      iconType: 'refresh-cw',
      actionType: 'refresh',
      keywords: ['обновить', 'перезагрузить', 'refresh', 'sync', 'запрос'],
    },
    {
      id: 'act-api-key',
      title: 'Настройки ключа API (Bearer)',
      subtitle: 'Ввести, проверить или сменить секретный ключ администратора',
      badge: 'Безопасность',
      iconType: 'key',
      actionType: 'openKeyModal',
      keywords: ['ключ', 'токен', 'api key', 'bearer', 'авторизация', 'настройки'],
    },
    {
      id: 'act-toggle-demo',
      title: 'Переключить Демо / Live режим',
      subtitle: 'Переключиться между демонстрационными и реальными данными',
      badge: 'Режим',
      iconType: 'sparkles',
      actionType: 'toggleDemo',
      keywords: ['демо', 'live', 'mock', 'данные', 'тест', 'боевой'],
    },
    {
      id: 'act-toggle-theme',
      title: 'Переключить тему оформления (Светлая / Тёмная)',
      subtitle: 'Быстрая смена цветовой палитры интерфейса Geometric Balance',
      badge: 'Оформление',
      iconType: 'moon',
      actionType: 'toggleTheme',
      keywords: ['тема', 'theme', 'темная', 'тёмная', 'светлая', 'dark', 'light', 'ночь', 'день', 'режим', 'палитра'],
    },
    {
      id: 'act-theme-dark',
      title: 'Включить тёмную тему (Dark Mode)',
      subtitle: 'Глубокая ночная палитра с контрастными контурами и мягкими тенями',
      badge: 'Оформление',
      iconType: 'moon',
      actionType: 'setTheme',
      actionValue: 'dark',
      keywords: ['тёмная тема', 'темная', 'dark mode', 'ночной режим', 'черная'],
    },
    {
      id: 'act-theme-light',
      title: 'Включить светлую тему (Light Mode)',
      subtitle: 'Чистая белая геометрическая тема Geometric Balance',
      badge: 'Оформление',
      iconType: 'sun',
      actionType: 'setTheme',
      actionValue: 'light',
      keywords: ['светлая тема', 'light mode', 'дневной режим', 'белая'],
    },
  ];

  ACTIONS.forEach((act) => {
    items.push({
      id: act.id,
      category: 'actions',
      categoryLabel: 'Действия',
      title: act.title,
      subtitle: act.subtitle,
      badge: act.badge,
      badgeColor: 'slate',
      iconType: act.iconType,
      keywords: act.keywords,
      actionType: act.actionType,
      actionValue: act.actionValue,
    });
  });

  return items;
}
