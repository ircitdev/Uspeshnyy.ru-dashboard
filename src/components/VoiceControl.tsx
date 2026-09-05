import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  HelpCircle,
  X,
  RotateCw,
  LayoutDashboard,
  Check,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { TabKey, ThemeMode } from '../types';
import { parseVoiceCommand, VoiceAction, SAMPLE_VOICE_COMMANDS } from '../services/voiceCommands';
import { audioFeedback } from '../services/audioFeedback';
import { useToast } from '../context/ToastContext';

interface VoiceControlProps {
  currentTab: TabKey;
  onNavigate: (tab: TabKey) => void;
  onRefresh: () => void;
  onChangeDays?: (days: string) => void;
  onThemeChange?: (theme: ThemeMode) => void;
  onOpenSearch?: () => void;
  onOpenKeyModal?: () => void;
}

// Window speech recognition types
type IWindowWithSpeech = typeof window & {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
};

export const VoiceControl: React.FC<VoiceControlProps> = ({
  currentTab,
  onNavigate,
  onRefresh,
  onChangeDays,
  onThemeChange,
  onOpenSearch,
  onOpenKeyModal,
}) => {
  const { toast } = useToast();
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const [interimText, setInterimText] = useState<string>('');
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isStoppingManually = useRef<boolean>(false);

  // Check browser Web Speech API support
  useEffect(() => {
    const win = window as IWindowWithSpeech;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const handleCommandExecution = useCallback(
    (action: VoiceAction) => {
      audioFeedback.playSuccess();

      switch (action.type) {
        case 'navigate':
          setLastAction(`Переход: ${action.label}`);
          onNavigate(action.tab);
          toast.success(
            'Голосовая команда',
            `Перешли в раздел «${action.label}»`
          );
          break;

        case 'refresh':
          setLastAction('Обновление данных');
          onRefresh();
          toast.info(
            'Голосовая команда',
            'Данные успешно обновляются...'
          );
          break;

        case 'period':
          setLastAction(`Период: ${action.label}`);
          if (onChangeDays) {
            onChangeDays(action.days);
            toast.success(
              'Голосовая команда',
              `Установлен период: ${action.label}`
            );
          }
          break;

        case 'theme':
          setLastAction(action.label);
          if (onThemeChange) {
            onThemeChange(action.theme);
            toast.success(
              'Голосовая команда',
              `Тема изменена: ${action.label}`
            );
          }
          break;

        case 'search':
          setLastAction('Поиск');
          if (onOpenSearch) {
            onOpenSearch();
            toast.info('Голосовая команда', 'Открыт быстрый поиск');
          }
          break;

        case 'settings':
          setLastAction('Настройки');
          if (onOpenKeyModal) {
            onOpenKeyModal();
            toast.info('Голосовая команда', 'Открыты настройки');
          }
          break;

        case 'telegram':
          setLastAction('Telegram настройки');
          if (onOpenKeyModal) {
            onOpenKeyModal();
            toast.info('Голосовая команда', 'Открыты настройки Telegram');
          }
          break;

        case 'unknown':
          audioFeedback.playError();
          setLastAction(`Неизвестно: "${action.rawText}"`);
          toast.warning(
            'Команда не распознана',
            `Вы сказали: «${action.rawText}». Попробуйте «Перейди в аналитику» или «Обнови данные».`
          );
          break;
      }
    },
    [onNavigate, onRefresh, onChangeDays, onThemeChange, onOpenSearch, onOpenKeyModal, toast]
  );

  const stopListening = useCallback(() => {
    isStoppingManually.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop error
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const win = window as IWindowWithSpeech;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.warning(
        'Web Speech API недоступен',
        'Ваш браузер не поддерживает голосовое распознавание. Рекомендуем использовать Google Chrome, Microsoft Edge или Safari.'
      );
      setShowHelp(true);
      return;
    }

    setPermissionError(null);
    setTranscript('');
    setInterimText('');
    setLastAction(null);
    isStoppingManually.current = false;

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'ru-RU';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        audioFeedback.playStart();
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }

        if (interim) {
          setInterimText(interim);
        }

        if (final) {
          setTranscript(final);
          setInterimText('');
          const action = parseVoiceCommand(final);
          handleCommandExecution(action);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // Timeout without speech
          setInterimText('Голос не обнаружен. Нажмите микрофон и повторите.');
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setPermissionError('Доступ к микрофону запрещён. Разрешите микрофон в настройках браузера.');
          audioFeedback.playError();
          toast.error(
            'Ошибка доступа к микрофону',
            'Разрешите приложению доступ к микрофону в панели браузера.'
          );
        } else if (event.error !== 'aborted') {
          console.warn('Speech recognition error:', event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      toast.error('Не удалось запустить распознавание', err?.message || 'Попробуйте снова');
    }
  }, [handleCommandExecution, toast]);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Keyboard shortcut: Alt + V to toggle voice recognition
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && (e.key === 'v' || e.key === 'м' || e.key === 'V' || e.key === 'М')) ||
          (e.metaKey && e.shiftKey && (e.key === 'v' || e.key === 'V'))) {
        e.preventDefault();
        toggleListening();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isListening, toggleListening]);

  return (
    <>
      {/* Voice Trigger Button in Header/Toolbar */}
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={toggleListening}
          className={`relative inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 cursor-pointer shadow-2xs ${
            isListening
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 animate-pulse'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
          }`}
          title={
            isListening
              ? 'Идёт прослушивание... Нажмите, чтобы остановить'
              : 'Голосовые команды: «Перейди в аналитику», «Обнови данные» (Alt+V)'
          }
        >
          {isListening ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <Mic className="w-3.5 h-3.5" />
              <span className="font-semibold">Слушаю...</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-[#37a4d3]" />
              <span className="hidden md:inline">Голос</span>
              <kbd className="hidden lg:inline-flex px-1 py-0.2 text-[9px] font-mono text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                Alt+V
              </kbd>
            </>
          )}
        </button>

        {/* Small quick help popover toggle */}
        <button
          type="button"
          onClick={() => setShowHelp((prev) => !prev)}
          className="p-1 ml-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Справка по голосовым командам"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Active Voice Bar when listening or recently executed */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-[#37a4d3]/40 dark:border-[#37a4d3]/50 rounded-2xl shadow-2xl p-4 overflow-hidden"
          >
            {/* Ambient top glowing line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#37a4d3] via-sky-400 to-indigo-500 animate-pulse" />

            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#37a4d3]/15 flex items-center justify-center text-[#37a4d3]">
                  <Radio className="w-4 h-4 animate-spin text-[#37a4d3]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    Голосовое управление
                    <span className="text-[11px] font-normal text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900">
                      Запись активна
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Скажите команду на русском языке
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowHelp((prev) => !prev)}
                  className="p-1.5 text-xs text-slate-500 hover:text-[#37a4d3] rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Список команд"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={stopListening}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Остановить запись"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Audio Visualizer Bars */}
            <div className="flex items-center justify-center gap-1.5 py-2">
              {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65].map((height, i) => (
                <motion.span
                  key={i}
                  animate={{
                    height: [
                      `${Math.max(8, height * 0.3)}px`,
                      `${Math.min(32, height * 0.45)}px`,
                      `${Math.max(6, height * 0.2)}px`,
                    ],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 0.6 + (i % 4) * 0.15,
                    ease: 'easeInOut',
                  }}
                  className="w-1 rounded-full bg-[#37a4d3] opacity-80"
                />
              ))}
            </div>

            {/* Live Transcript Bubble */}
            <div className="mt-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 min-h-[44px] flex items-center justify-center text-center">
              {interimText || transcript ? (
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100 italic">
                  «{interimText || transcript}»
                </p>
              ) : (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Попробуйте сказать: «Перейди в аналитику», «Обнови данные», «Открой расходы»
                </p>
              )}
            </div>

            {permissionError && (
              <div className="mt-2.5 p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{permissionError}</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Help & Command Reference Modal / Popover */}
      <AnimatePresence>
        {showHelp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#37a4d3]/15 text-[#37a4d3] flex items-center justify-center">
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      Голосовые команды (Web Speech API)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Управляйте админкой голосом на русском языке
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status banner */}
              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-300">Статус поддержки браузером:</span>
                {isSupported ? (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Поддерживается (Web Speech API)
                  </span>
                ) : (
                  <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Требуется Chrome, Edge или Safari
                  </span>
                )}
              </div>

              {/* Command categories */}
              <div className="mt-5 space-y-4">
                {SAMPLE_VOICE_COMMANDS.map((category, idx) => (
                  <div key={idx} className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {category.category}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {category.examples.map((example, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setShowHelp(false);
                            const clean = example.replace(/[«»]/g, '');
                            const action = parseVoiceCommand(clean);
                            handleCommandExecution(action);
                          }}
                          className="flex items-center justify-between p-2.5 rounded-lg text-xs font-medium text-left bg-slate-50 hover:bg-[#37a4d3]/10 dark:bg-slate-800/50 dark:hover:bg-[#37a4d3]/20 border border-slate-200/80 hover:border-[#37a4d3]/50 text-slate-700 dark:text-slate-200 transition-colors group cursor-pointer"
                        >
                          <span className="truncate">{example}</span>
                          <span className="text-[10px] text-slate-400 group-hover:text-[#37a4d3] ml-1">
                            Кликнуть
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Быстрый запуск: <kbd className="px-1.5 py-0.5 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 rounded">Alt+V</kbd>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowHelp(false);
                    startListening();
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#37a4d3] hover:bg-[#2b8cb8] text-white transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Mic className="w-3.5 h-3.5" />
                  Включить микрофон
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
