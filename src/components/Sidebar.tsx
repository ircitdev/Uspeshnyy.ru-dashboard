import React from 'react';
import {
  LayoutDashboard,
  FileText,
  Workflow,
  Coins,
  Users,
  TrendingUp,
  BookOpen,
  Server,
  Key,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Activity,
  Sun,
  Moon,
} from 'lucide-react';
import { TabKey, ThemeMode } from '../types';
import { ThemeToggle } from './ThemeToggle';

interface SidebarProps {
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isLive: boolean;
  hasKey: boolean;
  onOpenKeyModal: () => void;
  latencyMs?: number | null;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
}

export const NAV_ITEMS: {
  id: TabKey;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'summary',
    label: 'Сводка',
    sublabel: 'Ключевые числа за период',
    icon: LayoutDashboard,
  },
  {
    id: 'reports',
    label: 'Отчёты',
    sublabel: 'Каждый отчёт со стоимостью',
    icon: FileText,
  },
  {
    id: 'catalog',
    label: 'Как устроено',
    sublabel: 'Ступени, вызовы и промпты',
    icon: Workflow,
  },
  {
    id: 'usage',
    label: 'Расходы',
    sublabel: 'Модели, токены и деньги',
    icon: Coins,
  },
  {
    id: 'leads',
    label: 'Лиды',
    sublabel: 'Кто пришёл и что получил',
    icon: Users,
  },
  {
    id: 'analytics',
    label: 'Аналитика',
    sublabel: 'Метрика и Вебмастер',
    icon: TrendingUp,
  },
  {
    id: 'blog',
    label: 'Блог',
    sublabel: 'Просмотры и комментарии',
    icon: BookOpen,
  },
  {
    id: 'inventory',
    label: 'Хозяйство',
    sublabel: 'Сайты, сервисы и ключи',
    icon: Server,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isLive,
  hasKey,
  onOpenKeyModal,
  latencyMs,
  theme,
  onThemeChange,
}) => {
  return (
    <aside className="w-full lg:w-64 flex-shrink-0 bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] shadow-sm">
      <div>
        {/* Brand Header with Official Logo */}
        <div className="pb-5 mb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            {/* Official Uspeshnyy Logo https://uspeshnyy.ru/assets/logo.svg */}
            <a
              href="https://uspeshnyy.ru"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
              title="Перейти на uspeshnyy.ru"
            >
              <img
                src="https://uspeshnyy.ru/assets/logo.svg"
                alt="УСПЕШНЫЙ"
                className="w-8 h-8 object-contain"
                width={32}
                height={32}
              />
            </a>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">УСПЕШНЫЙ</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-semibold border border-indigo-200">
                  v2.4
                </span>
              </div>
              <a
                href="https://uspeshnyy.ru"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1 group"
              >
                uspeshnyy.ru
                <ExternalLink className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100" />
              </a>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`p-2.5 rounded-md flex items-center gap-3 text-sm font-medium transition-all duration-150 text-left whitespace-nowrap lg:whitespace-normal w-auto lg:w-full ${
                  isActive
                    ? 'bg-slate-100 text-indigo-600 font-semibold'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-indigo-600' : 'text-slate-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{item.label}</div>
                  <div className="text-[11px] text-slate-400 font-normal truncate hidden xl:block">
                    {item.sublabel}
                  </div>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 hidden lg:block" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer system status & Key switch */}
      <div className="mt-6 pt-4 border-t border-slate-200 hidden lg:block space-y-2">
        {/* Theme quick switcher */}
        {theme && onThemeChange && (
          <div className="px-2.5 py-1.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5 font-medium">
              {theme === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-500" />
              )}
              Тема
            </span>
            <ThemeToggle theme={theme} onThemeChange={onThemeChange} />
          </div>
        )}

        {/* Connection status badge */}
        <button
          onClick={onOpenKeyModal}
          className="w-full flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-left group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isLive
                  ? 'bg-emerald-500'
                  : 'bg-amber-500'
              }`}
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">
                {isLive ? 'Онлайн-режим' : 'Демо-режим'}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                {hasKey ? 'Ключ подключен' : 'Нажмите для ввода ключа'}
              </div>
            </div>
          </div>
          <Key className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
        </button>

        {/* API response latency indicator */}
        <div
          className="px-3 py-2 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-500"
          title="Текущее время отклика API при последнем запросе"
        >
          <span className="flex items-center gap-1.5 font-medium text-slate-600">
            <Activity className="w-3.5 h-3.5 text-indigo-600" />
            Отклик API
          </span>
          <div className="flex items-center gap-1.5 font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                latencyMs === undefined || latencyMs === null
                  ? 'bg-slate-300 animate-pulse'
                  : latencyMs < 200
                  ? 'bg-emerald-500'
                  : latencyMs < 500
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span
              className={`font-semibold ${
                latencyMs === undefined || latencyMs === null
                  ? 'text-slate-400'
                  : latencyMs < 200
                  ? 'text-emerald-700'
                  : latencyMs < 500
                  ? 'text-amber-700'
                  : 'text-rose-700'
              }`}
            >
              {latencyMs !== undefined && latencyMs !== null ? `${latencyMs} ms` : '—'}
            </span>
          </div>
        </div>

        {/* Server status pill */}
        <div className="px-3 py-2 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
            VPS vps-srv01
          </span>
          <span className="font-mono text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100%
          </span>
        </div>
      </div>
    </aside>
  );
};
