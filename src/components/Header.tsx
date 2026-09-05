import React from 'react';
import { RotateCw, Calendar, Key, Sparkles, CheckCircle2, Search, Sun, Moon } from 'lucide-react';
import { TabKey, ThemeMode } from '../types';
import { NAV_ITEMS } from './Sidebar';
import { ThemeToggle } from './ThemeToggle';
import { VoiceControl } from './VoiceControl';

interface HeaderProps {
  currentTab: TabKey;
  onNavigate: (tab: TabKey) => void;
  days: string;
  onChangeDays: (days: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  isLive: boolean;
  hasKey: boolean;
  onOpenKeyModal: () => void;
  onOpenSearch: () => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  days,
  onChangeDays,
  onRefresh,
  isLoading,
  isLive,
  hasKey,
  onOpenKeyModal,
  onOpenSearch,
  theme,
  onThemeChange,
}) => {
  const currentNav = NAV_ITEMS.find((item) => item.id === currentTab) || NAV_ITEMS[0];

  const PERIOD_OPTIONS = [
    { value: '7', label: '7 дней' },
    { value: '30', label: '30 дней' },
    { value: '90', label: '90 дней' },
    { value: '365', label: 'Год' },
  ];

  return (
    <header className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      {/* Title & Subtitle */}
      <div className="flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
            {currentNav.label}
          </h1>
          {isLive ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Live
            </span>
          ) : (
            <button
              onClick={onOpenKeyModal}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-600" /> Демо-данные
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{currentNav.sublabel}</p>
      </div>

      {/* Global Quick Search component */}
      <div className="flex-1 max-w-md xl:max-w-xs 2xl:max-w-md w-full">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-md bg-slate-50 hover:bg-slate-100/90 border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600 transition-all text-left shadow-2xs group cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          title="Быстрый поиск по разделам, отчётам, лидам, промптам и сайтам (⌘K)"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
            <span className="text-xs sm:text-sm text-slate-500 truncate">
              Поиск по разделам и данным...
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white border border-slate-200 rounded shadow-2xs">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </div>
        </button>
      </div>

      {/* Actions: Period Selector & Controls */}
      <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
        {/* Period Selector Tabs */}
        <div className="flex items-center bg-slate-100 rounded-md p-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2 mr-1 hidden md:block" />
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChangeDays(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                days === opt.value
                  ? 'bg-white text-slate-900 shadow-sm font-semibold'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Voice Recognition Control */}
        <VoiceControl
          currentTab={currentTab}
          onNavigate={onNavigate}
          onRefresh={onRefresh}
          onChangeDays={onChangeDays}
          onThemeChange={onThemeChange}
          onOpenSearch={onOpenSearch}
          onOpenKeyModal={onOpenKeyModal}
        />

        {/* Theme Toggle Select */}
        <ThemeToggle theme={theme} onThemeChange={onThemeChange} />

        {/* Refresh button - icon only */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center border border-slate-200 dark:border-slate-700"
          title="Обновить данные"
          aria-label="Обновить данные"
        >
          <RotateCw
            className={`w-3.5 h-3.5 text-slate-600 dark:text-slate-300 ${isLoading ? 'animate-spin text-indigo-600' : ''}`}
          />
        </button>

        {/* Key modal trigger - icon only */}
        <button
          onClick={onOpenKeyModal}
          className={`p-2 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-center ${
            hasKey
              ? 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 shadow-sm'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'
          }`}
          title={hasKey ? 'Ключ доступа (подключен)' : 'Ввести ключ доступа'}
          aria-label={hasKey ? 'Ключ доступа (подключен)' : 'Ввести ключ доступа'}
        >
          <Key className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </header>
  );
};
