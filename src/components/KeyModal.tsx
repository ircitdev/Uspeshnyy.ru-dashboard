import React, { useState } from 'react';
import {
  X,
  Key,
  Shield,
  CheckCircle2,
  Sparkles,
  Sun,
  Moon,
  Laptop,
  Palette,
  Check,
  Layers,
} from 'lucide-react';
import { ThemeMode } from '../types';

interface KeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentKey: string;
  onSaveKey: (key: string) => void;
  isDemoMode: boolean;
  onToggleDemo: (demo: boolean) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  defaultTab?: 'theme' | 'api';
}

export const KeyModal: React.FC<KeyModalProps> = ({
  isOpen,
  onClose,
  currentKey,
  onSaveKey,
  isDemoMode,
  onToggleDemo,
  theme,
  onThemeChange,
  defaultTab = 'theme',
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'api'>(defaultTab);
  const [inputVal, setInputVal] = useState(currentKey);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inputVal.trim();
    onSaveKey(clean);
    if (clean) {
      onToggleDemo(false);
      setStatusMsg('Ключ сохранен!');
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 700);
    } else {
      setStatusMsg('Ключ очищен. Включен демо-режим.');
      onToggleDemo(true);
      setTimeout(() => {
        setStatusMsg(null);
        onClose();
      }, 700);
    }
  };

  const handleUseDemo = () => {
    onToggleDemo(true);
    setStatusMsg('Демо-режим активирован');
    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 500);
  };

  const THEME_OPTIONS: {
    id: ThemeMode;
    title: string;
    badge: string;
    description: string;
    icon: React.ReactNode;
    preview: {
      bg: string;
      card: string;
      border: string;
      accent: string;
      text: string;
    };
  }[] = [
    {
      id: 'light',
      title: 'Светлая тема',
      badge: 'Geometric Light',
      description: 'Чистый белый холст #F8FAFC, строгие контуры #E2E8F0 и глубокий контрастный текст #0F172A.',
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      preview: {
        bg: '#F8FAFC',
        card: '#FFFFFF',
        border: '#CBD5E1',
        accent: '#37a4d3',
        text: '#0F172A',
      },
    },
    {
      id: 'dark',
      title: 'Тёмная тема',
      badge: 'Geometric Obsidian',
      description: 'Глубокий обсидиановый фон #090D16, графитовые карточки #111827 и фирменный акцент #37a4d3.',
      icon: <Moon className="w-4 h-4 text-sky-400" />,
      preview: {
        bg: '#090D16',
        card: '#111827',
        border: '#334155',
        accent: '#37a4d3',
        text: '#F8FAFC',
      },
    },
    {
      id: 'system',
      title: 'Системная',
      badge: 'Auto',
      description: 'Автоматическая адаптация цветовой схемы под текущие системные настройки вашей операционной системы.',
      icon: <Laptop className="w-4 h-4 text-slate-400" />,
      preview: {
        bg: 'linear-gradient(135deg, #F8FAFC 50%, #090D16 50%)',
        card: 'linear-gradient(135deg, #FFFFFF 50%, #111827 50%)',
        border: '#64748B',
        accent: '#37a4d3',
        text: '#38BDF8',
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden text-slate-900 transition-colors">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 leading-tight">
                Настройки приложения
              </h3>
              <p className="text-xs text-slate-500">
                Оформление интерфейса и параметры подключения API
              </p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
            title="Закрыть настройки (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-5 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'theme'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Тема оформления</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">
              {theme === 'dark' ? 'Тёмная' : theme === 'light' ? 'Светлая' : 'Авто'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'api'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Ключ API и режим</span>
            {isDemoMode ? (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Демо
              </span>
            ) : (
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'theme' ? (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-semibold text-slate-900">
                    Тема интерфейса «Geometric Balance»
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">CSS Variables</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Адаптация дизайна построена на математически сбалансированных CSS-переменных. Выберите комфортную для глаз цветовую палитру:
                </p>
              </div>

              {/* Theme Options Cards */}
              <div className="grid grid-cols-1 gap-3">
                {THEME_OPTIONS.map((opt) => {
                  const isSelected = theme === opt.id;
                  return (
                    <div
                      key={opt.id}
                      onClick={() => onThemeChange(opt.id)}
                      className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/30 ring-1 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-slate-900">
                              {opt.title}
                            </span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                              {opt.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {opt.description}
                          </p>
                        </div>
                      </div>

                      {/* Mini Swatch preview */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0 pl-8 sm:pl-0">
                        <div
                          className="w-4 h-6 rounded-xs border border-slate-300 shadow-2xs"
                          style={{
                            background: opt.preview.bg,
                            borderColor: opt.preview.border,
                          }}
                          title="Фон приложения (--bg-app)"
                        />
                        <div
                          className="w-5 h-6 rounded-xs border shadow-2xs"
                          style={{
                            background: opt.preview.card,
                            borderColor: opt.preview.border,
                          }}
                          title="Карточка (--bg-card)"
                        />
                        <div
                          className="w-3 h-6 rounded-xs shadow-2xs"
                          style={{ background: opt.preview.accent }}
                          title="Акцент (--accent-primary)"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Design System Details note */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
                <Layers className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold text-slate-800">Архитектура темы: </span>
                  Значения переменных <code className="font-mono text-indigo-600 text-[11px]">--bg-app</code>, <code className="font-mono text-indigo-600 text-[11px]">--bg-card</code>, <code className="font-mono text-indigo-600 text-[11px]">--border-subtle</code> и <code className="font-mono text-indigo-600 text-[11px]">--text-main</code> переключаются мгновенно без мерцания и сохраняются в локальном хранилище браузера.
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Info box for API */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <div className="flex items-start gap-2 mb-1.5 text-slate-900 font-semibold">
                  <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>Авторизация для запросов к /api/adm/*</span>
                </div>
                <p>
                  Откройте Telegram-бота проекта и отправьте команду{' '}
                  <span className="font-mono font-semibold text-indigo-600">/adm</span>. Бот выдаст вам персональный токен администратора.
                </p>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Секретный ключ (X-Adm-Key)
                  </label>
                  <input
                    type="password"
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    placeholder="Вставьте токен или оставьте пустым"
                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md text-sm font-mono text-slate-900 placeholder:text-slate-400 outline-none transition-all"
                  />
                </div>

                {statusMsg && (
                  <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-md">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>{statusMsg}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 rounded-md bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer"
                  >
                    Сохранить ключ
                  </button>
                  <button
                    type="button"
                    onClick={handleUseDemo}
                    className="py-2 px-4 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Демо-режим
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Текущий режим:</span>
            <span
              className={`font-semibold ${
                theme === 'dark' ? 'text-indigo-600' : 'text-amber-600'
              }`}
            >
              {theme === 'dark' ? 'Тёмная тема' : theme === 'light' ? 'Светлая тема' : 'Системная'}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
