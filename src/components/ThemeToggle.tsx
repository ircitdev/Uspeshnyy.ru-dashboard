import React from 'react';
import { Sun, Moon, Laptop, ChevronDown } from 'lucide-react';
import { ThemeMode } from '../types';

interface ThemeToggleProps {
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  theme,
  onThemeChange,
  className = '',
}) => {
  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />;
      case 'dark':
        return <Moon className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />;
      case 'system':
      default:
        return <Laptop className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />;
    }
  };

  return (
    <div
      className={`relative inline-flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2.5 py-1.5 transition-colors focus-within:ring-2 focus-within:ring-indigo-500/20 ${className}`}
    >
      <span className="mr-1.5 pointer-events-none" aria-hidden="true">
        {getIcon()}
      </span>
      <select
        value={theme}
        onChange={(e) => onThemeChange(e.target.value as ThemeMode)}
        aria-label="Выбор темы оформления"
        className="appearance-none bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 pr-5 pl-0.5 py-0.5 cursor-pointer focus:outline-none"
      >
        <option value="system" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          Системная
        </option>
        <option value="light" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          Светлая
        </option>
        <option value="dark" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
          Тёмная
        </option>
      </select>
      <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
    </div>
  );
};

