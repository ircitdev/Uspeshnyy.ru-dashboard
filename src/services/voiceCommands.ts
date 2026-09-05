import { TabKey, ThemeMode } from '../types';

export type VoiceAction =
  | { type: 'navigate'; tab: TabKey; label: string; phrase: string }
  | { type: 'refresh'; phrase: string }
  | { type: 'period'; days: string; label: string; phrase: string }
  | { type: 'theme'; theme: ThemeMode; label: string; phrase: string }
  | { type: 'search'; phrase: string }
  | { type: 'settings'; phrase: string }
  | { type: 'telegram'; phrase: string }
  | { type: 'unknown'; rawText: string };

interface TabMatchConfig {
  tab: TabKey;
  label: string;
  keywords: string[];
}

const TAB_MATCHERS: TabMatchConfig[] = [
  {
    tab: 'summary',
    label: 'Сводка',
    keywords: ['сводк', 'главн', 'дашборд', 'обзор', 'инфопанел', 'home', 'summary'],
  },
  {
    tab: 'reports',
    label: 'Отчёты',
    keywords: ['отчет', 'отчёт', 'генераци', 'интерьер', 'reports'],
  },
  {
    tab: 'catalog',
    label: 'Как устроено',
    keywords: ['каталог', 'устроен', 'конфигуратор', 'промпт', 'шаг', 'цепочк', 'catalog'],
  },
  {
    tab: 'usage',
    label: 'Расходы ИИ',
    keywords: ['расход', 'ии', 'трат', 'бюджет', 'токен', 'модел', 'usage', 'gemini', 'круг', 'диаграмм', 'пайчарт'],
  },
  {
    tab: 'leads',
    label: 'Лиды',
    keywords: ['лид', 'заявк', 'клиент', 'контакт', 'обращени', 'leads'],
  },
  {
    tab: 'analytics',
    label: 'Аналитика',
    keywords: ['аналитик', 'метрик', 'яндекс', 'трафик', 'посещени', 'посещаемост', 'analytics'],
  },
  {
    tab: 'blog',
    label: 'Блог',
    keywords: ['блог', 'стать', 'пост', 'публикац', 'новост', 'blog'],
  },
  {
    tab: 'inventory',
    label: 'Хозяйство',
    keywords: ['хозяйств', 'инвентар', 'склад', 'остатк', 'техник', 'имущество', 'inventory'],
  },
];

/**
 * Clean and normalize text for fuzzy speech matching
 */
export function normalizeTranscript(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'«»]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parse speech transcript into a structured action
 */
export function parseVoiceCommand(rawTranscript: string): VoiceAction {
  const norm = normalizeTranscript(rawTranscript);
  if (!norm) {
    return { type: 'unknown', rawText: rawTranscript };
  }

  // 1. Refresh / Update commands
  const refreshKeywords = [
    'обнови',
    'обновить',
    'перезагрузи',
    'перезагрузить',
    'синхронизируй',
    'синхронизация',
    'свежие данные',
    'refresh',
    'update',
    'перезагрузка',
  ];
  if (refreshKeywords.some((kw) => norm.includes(kw))) {
    return { type: 'refresh', phrase: rawTranscript };
  }

  // 2. Global search command
  const searchKeywords = ['поиск', 'найти', 'найди', 'искать', 'открой поиск', 'search'];
  if (searchKeywords.some((kw) => norm.includes(kw))) {
    return { type: 'search', phrase: rawTranscript };
  }

  // 3. Telegram notifications settings
  const telegramKeywords = ['телеграм', 'telegram', 'уведомления', 'алерт', 'тг'];
  if (telegramKeywords.some((kw) => norm.includes(kw))) {
    return { type: 'telegram', phrase: rawTranscript };
  }

  // 4. Settings / Key modal
  const settingsKeywords = ['настройк', 'ключ', 'ввести ключ', 'settings'];
  if (settingsKeywords.some((kw) => norm.includes(kw))) {
    return { type: 'settings', phrase: rawTranscript };
  }

  // 4. Period selection commands
  if (norm.includes('7 дней') || norm.includes('недел') || norm.includes('семь дней')) {
    return { type: 'period', days: '7', label: '7 дней', phrase: rawTranscript };
  }
  if (norm.includes('30 дней') || norm.includes('месяц') || norm.includes('тридцать дней')) {
    return { type: 'period', days: '30', label: '30 дней', phrase: rawTranscript };
  }
  if (norm.includes('90 дней') || norm.includes('квартал') || norm.includes('девяносто дней')) {
    return { type: 'period', days: '90', label: '90 дней', phrase: rawTranscript };
  }
  if (norm.includes('год') || norm.includes('365') || norm.includes('весь год')) {
    return { type: 'period', days: '365', label: 'Год', phrase: rawTranscript };
  }

  // 5. Theme commands
  if (norm.includes('темн') || norm.includes('тёмн') || norm.includes('ночн') || norm.includes('dark')) {
    return { type: 'theme', theme: 'dark', label: 'Тёмная тема', phrase: rawTranscript };
  }
  if (norm.includes('светл') || norm.includes('дневн') || norm.includes('light')) {
    return { type: 'theme', theme: 'light', label: 'Светлая тема', phrase: rawTranscript };
  }
  if (norm.includes('системн') || norm.includes('авто')) {
    return { type: 'theme', theme: 'system', label: 'Системная тема', phrase: rawTranscript };
  }

  // 6. Navigation tabs matching
  for (const matcher of TAB_MATCHERS) {
    for (const kw of matcher.keywords) {
      if (norm.includes(kw)) {
        return {
          type: 'navigate',
          tab: matcher.tab,
          label: matcher.label,
          phrase: rawTranscript,
        };
      }
    }
  }

  return { type: 'unknown', rawText: rawTranscript };
}

/**
 * List of sample voice commands for user guidance
 */
export const SAMPLE_VOICE_COMMANDS = [
  {
    category: 'Навигация по разделам',
    examples: [
      '«Перейди в аналитику»',
      '«Открой расходы»',
      '«Покажи отчёты»',
      '«Перейди в лиды»',
      '«Открой хозяйство»',
      '«Вернись в сводку»',
    ],
  },
  {
    category: 'Управление данными',
    examples: [
      '«Обнови данные»',
      '«Период за неделю»',
      '«Покажи за 30 дней»',
      '«Период за год»',
    ],
  },
  {
    category: 'Интерфейс и поиск',
    examples: [
      '«Открой поиск»',
      '«Включи тёмную тему»',
      '«Включи светлую тему»',
      '«Настройки ключа»',
    ],
  },
];
