import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  Layers,
  FileText,
  Workflow,
  Users,
  BookOpen,
  Server,
  Activity,
  Key,
  Calendar,
  RotateCw,
  Sparkles,
  CornerDownLeft,
  ChevronRight,
  Command,
  Sun,
  Moon,
  Mic,
  MicOff,
  Volume2,
  Radio,
  Check,
} from 'lucide-react';
import { SearchItem, SearchCategory } from '../types';
import { useToast } from '../context/ToastContext';
import { audioFeedback } from '../services/audioFeedback';
import { parseVoiceCommand, normalizeTranscript } from '../services/voiceCommands';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  items: SearchItem[];
  onSelectItem: (item: SearchItem) => void;
}

const CATEGORY_TABS: { id: SearchCategory; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'tabs', label: 'Разделы' },
  { id: 'reports', label: 'Отчёты' },
  { id: 'catalog', label: 'Каталог' },
  { id: 'leads', label: 'Лиды' },
  { id: 'blog', label: 'Блог' },
  { id: 'inventory', label: 'Инфраструктура' },
  { id: 'actions', label: 'Действия' },
];

export const GlobalSearch: React.FC<GlobalSearchProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
}) => {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [activeIndex, setActiveIndex] = useState<number>(0);

  // Voice recognition state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [interimVoiceText, setInterimVoiceText] = useState<string>('');
  const [voiceStatus, setVoiceStatus] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const isStoppingManually = useRef<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Filter items based on query & selected category
  const filteredItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    const words = cleanQuery ? cleanQuery.split(/\s+/).filter(Boolean) : [];

    return items.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // If no query, show all items under category (limited count)
      if (words.length === 0) {
        return true;
      }

      // Check if all query words match in title, subtitle, badge, or keywords
      const searchTarget = [
        item.title,
        item.subtitle,
        item.badge || '',
        item.categoryLabel,
        ...(item.keywords || []),
      ]
        .join(' ')
        .toLowerCase();

      return words.every((word) => searchTarget.includes(word));
    });
  }, [items, query, selectedCategory]);

  // Voice command & query handler
  const handleVoiceInput = useCallback(
    (rawText: string) => {
      const clean = rawText.trim();
      if (!clean) return;

      const norm = normalizeTranscript(clean);

      // 1. Clear search input command
      if (['очистить', 'стереть', 'сбрось', 'сбросить', 'очисти'].includes(norm)) {
        setQuery('');
        audioFeedback.playSuccess();
        setVoiceStatus('Поисковая строка очищена');
        toast.info('Голосовой поиск', 'Поисковая строка очищена');
        return;
      }

      // 2. Close modal command
      if (['закрыть', 'закрой', 'отмена', 'выйти', 'выход'].includes(norm)) {
        audioFeedback.playSuccess();
        onClose();
        return;
      }

      // 3. Select active or first result command
      if (['выбрать', 'выбери', 'открой', 'открыть', 'первый'].includes(norm)) {
        if (filteredItems.length > 0) {
          const target = filteredItems[activeIndex] || filteredItems[0];
          audioFeedback.playSuccess();
          onSelectItem(target);
          onClose();
          return;
        }
      }

      // 4. Try parsing as a direct navigation or system action
      const action = parseVoiceCommand(clean);
      if (action.type !== 'unknown') {
        let matchingItem: SearchItem | undefined;

        if (action.type === 'navigate') {
          matchingItem = items.find(
            (it) => it.category === 'tabs' && it.tabTarget === action.tab
          );
        } else if (action.type === 'refresh') {
          matchingItem = items.find((it) => it.actionType === 'refresh');
        } else if (action.type === 'theme') {
          matchingItem = items.find(
            (it) => it.actionType === 'changeTheme' && it.actionValue === action.theme
          );
        } else if (action.type === 'period') {
          matchingItem = items.find(
            (it) => it.actionType === 'changePeriod' && it.actionValue === action.days
          );
        }

        if (matchingItem) {
          audioFeedback.playSuccess();
          toast.success('Голосовая команда', `Выбрано: ${matchingItem.title}`);
          onSelectItem(matchingItem);
          onClose();
          return;
        }
      }

      // 5. It is a search query - strip common search prefix keywords
      const searchPrefixRegex = /^(найди|найти|поиск|поищи|ищи|покажи|открой|открыть)\s+/i;
      const strippedQuery = clean.replace(searchPrefixRegex, '').trim();
      const finalQuery = strippedQuery || clean;

      setQuery(finalQuery);
      audioFeedback.playSuccess();
      setVoiceStatus(`Поиск: «${finalQuery}»`);
      toast.info('Голосовой поиск', `Поиск по запросу «${finalQuery}»`);

      // Refocus input
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    },
    [filteredItems, activeIndex, items, onSelectItem, onClose, toast]
  );

  // Stop speech recognition
  const stopListening = useCallback(() => {
    isStoppingManually.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
    setIsListening(false);
    setInterimVoiceText('');
  }, []);

  // Start speech recognition
  const startListening = useCallback(() => {
    const win = window as any;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.warning(
        'Web Speech API недоступен',
        'Ваш браузер не поддерживает распознавание речи. Используйте Google Chrome, Edge или Safari.'
      );
      return;
    }

    setInterimVoiceText('');
    setVoiceStatus(null);
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
          setInterimVoiceText(interim);
        }

        if (final) {
          setInterimVoiceText('');
          handleVoiceInput(final);
          setIsListening(false);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          setVoiceStatus('Голос не распознан. Нажмите микрофон и повторите.');
        } else if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceStatus('Доступ к микрофону заблокирован в настройках браузера.');
          audioFeedback.playError();
          toast.error(
            'Ошибка микрофона',
            'Разрешите доступ к микрофону в браузере для использования голосового поиска.'
          );
        } else if (event.error !== 'aborted') {
          console.warn('Search speech recognition error:', event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('Failed to start speech recognition in search:', err);
      setIsListening(false);
      toast.error('Не удалось запустить микрофон', err?.message || 'Попробуйте снова');
    }
  }, [handleVoiceInput, toast]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Clean up speech recognition when modal closes or unmounts
  useEffect(() => {
    if (!isOpen && isListening) {
      stopListening();
    }
  }, [isOpen, isListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Clear temporary voice status after delay
  useEffect(() => {
    if (!voiceStatus) return;
    const t = setTimeout(() => {
      setVoiceStatus(null);
    }, 4500);
    return () => clearTimeout(t);
  }, [voiceStatus]);

  // Focus input when opened and reset query
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedCategory('all');
      setActiveIndex(0);
      setVoiceStatus(null);
      setInterimVoiceText('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Global Esc key listener & Alt+V shortcut within GlobalSearch
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (
        (e.altKey && (e.key === 'v' || e.key === 'м' || e.key === 'V' || e.key === 'М')) ||
        (e.metaKey && e.shiftKey && (e.key === 'v' || e.key === 'V'))
      ) {
        e.preventDefault();
        e.stopPropagation();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, toggleListening]);

  // Keep active index within bounds
  useEffect(() => {
    setActiveIndex(0);
  }, [query, selectedCategory]);

  // Scroll active item into view
  useEffect(() => {
    if (!resultsContainerRef.current) return;
    const activeEl = resultsContainerRef.current.querySelector(
      `[data-search-index="${activeIndex}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  // Handle keyboard navigation within results
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const currentItem = filteredItems[activeIndex];
      if (currentItem) {
        onSelectItem(currentItem);
        onClose();
      }
    }
  };

  // Render icon based on iconType
  const renderItemIcon = (type: SearchItem['iconType'], colorScheme?: SearchItem['badgeColor']) => {
    const iconClass = 'w-4 h-4';

    let colorClasses = 'bg-slate-100 text-slate-700';
    if (colorScheme === 'indigo') colorClasses = 'bg-indigo-50 text-indigo-600 border border-indigo-100';
    else if (colorScheme === 'emerald') colorClasses = 'bg-emerald-50 text-emerald-600 border border-emerald-100';
    else if (colorScheme === 'amber') colorClasses = 'bg-amber-50 text-amber-600 border border-amber-100';
    else if (colorScheme === 'blue') colorClasses = 'bg-blue-50 text-blue-600 border border-blue-100';
    else if (colorScheme === 'purple') colorClasses = 'bg-purple-50 text-purple-600 border border-purple-100';
    else if (colorScheme === 'rose') colorClasses = 'bg-rose-50 text-rose-600 border border-rose-100';

    let iconNode = <Layers className={iconClass} />;
    if (type === 'file-text') iconNode = <FileText className={iconClass} />;
    else if (type === 'workflow') iconNode = <Workflow className={iconClass} />;
    else if (type === 'users') iconNode = <Users className={iconClass} />;
    else if (type === 'book-open') iconNode = <BookOpen className={iconClass} />;
    else if (type === 'server') iconNode = <Server className={iconClass} />;
    else if (type === 'activity') iconNode = <Activity className={iconClass} />;
    else if (type === 'key') iconNode = <Key className={iconClass} />;
    else if (type === 'calendar') iconNode = <Calendar className={iconClass} />;
    else if (type === 'refresh-cw') iconNode = <RotateCw className={iconClass} />;
    else if (type === 'sparkles') iconNode = <Sparkles className={iconClass} />;
    else if (type === 'sun') iconNode = <Sun className={iconClass} />;
    else if (type === 'moon') iconNode = <Moon className={iconClass} />;

    return (
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClasses}`}>
        {iconNode}
      </div>
    );
  };

  // Helper to highlight matching text
  const highlightMatch = (text: string, queryStr: string) => {
    if (!queryStr.trim()) return text;

    const words = queryStr.trim().split(/\s+/).filter(Boolean);
    const regex = new RegExp(`(${words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');

    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-indigo-100 text-indigo-900 rounded px-0.5 font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-16">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col z-10 max-h-[85vh]"
          >
            {/* Top Search Input Bar */}
            <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-3 bg-white dark:bg-slate-900">
              <Search className="w-5 h-5 text-[#37a4d3] flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={
                  isListening
                    ? 'Слушаю... Произнесите команду или поисковый запрос'
                    : 'Поиск по разделам, отчётам, лидам, промптам, сайтам...'
                }
                className="flex-1 text-sm sm:text-base text-slate-900 dark:text-slate-100 placeholder:text-slate-400 bg-transparent focus:outline-none"
              />

              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Очистить"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* Voice input button inside search bar */}
              <button
                type="button"
                onClick={toggleListening}
                className={`relative px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-300 dark:ring-rose-900 animate-pulse'
                    : 'text-slate-500 dark:text-slate-400 hover:text-[#37a4d3] dark:hover:text-[#37a4d3] hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}
                title={
                  isListening
                    ? 'Остановить голосовой ввод'
                    : 'Голосовой поиск и команды (Alt+V)'
                }
              >
                {isListening ? (
                  <>
                    <Mic className="w-3.5 h-3.5 text-white" />
                    <span className="text-[11px] font-semibold hidden xs:inline">Слушаю...</span>
                    <span className="relative flex h-2 w-2 ml-0.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3.5 h-3.5 text-[#37a4d3]" />
                    <span className="text-[11px] hidden sm:inline text-slate-600 dark:text-slate-300">Голос</span>
                  </>
                )}
              </button>

              <div className="hidden sm:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
                  ESC
                </kbd>
              </div>
            </div>

            {/* Voice Listening & Feedback Banner */}
            <AnimatePresence>
              {(isListening || interimVoiceText || voiceStatus) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-sky-50/90 via-indigo-50/60 to-purple-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 px-4 py-2.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                    {isListening ? (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className="w-1 h-3 bg-rose-500 rounded-full animate-bounce" />
                        <span className="w-1 h-4 bg-rose-500 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1 h-2 bg-rose-500 rounded-full animate-bounce [animation-delay:0.3s]" />
                      </div>
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-[#37a4d3] flex-shrink-0" />
                    )}

                    <div className="truncate text-slate-700 dark:text-slate-200">
                      {isListening ? (
                        interimVoiceText ? (
                          <span className="font-medium text-slate-900 dark:text-white">
                            «{interimVoiceText}»
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-300">
                            Говорите команду или запрос... <span className="text-slate-400 hidden sm:inline">(«Отчёты», «Лиды», «Аналитика», «Кухня», «Тёмная тема»)</span>
                          </span>
                        )
                      ) : voiceStatus ? (
                        <span className="font-medium text-[#37a4d3]">
                          {voiceStatus}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {isListening && (
                    <button
                      type="button"
                      onClick={stopListening}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex-shrink-0 cursor-pointer"
                    >
                      Готово
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Category Filter Pills */}
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/70 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {CATEGORY_TABS.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Results list */}
            <div
              ref={resultsContainerRef}
              className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 max-h-[380px] sm:max-h-[440px]"
            >
              {filteredItems.length === 0 ? (
                <div className="py-12 px-4 text-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <Search className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800">
                    Ничего не найдено
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    По запросу «{query}» элементов не обнаружено. Попробуйте изменить формулировку или сбросить фильтр категории.
                  </p>
                  {selectedCategory !== 'all' && (
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className="mt-3 inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Показать результаты во всех категориях
                    </button>
                  )}
                </div>
              ) : (
                filteredItems.map((item, idx) => {
                  const isActive = idx === activeIndex;
                  return (
                    <div
                      key={item.id}
                      data-search-index={idx}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => {
                        onSelectItem(item);
                        onClose();
                      }}
                      className={`group flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all ${
                        isActive
                          ? 'bg-indigo-50/90 text-indigo-950 border border-indigo-200/70 shadow-2xs'
                          : 'hover:bg-slate-50 text-slate-800 border border-transparent'
                      }`}
                    >
                      {/* Left: Icon & Text Info */}
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        {renderItemIcon(item.iconType, item.badgeColor)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-semibold truncate">
                              {highlightMatch(item.title, query)}
                            </span>
                            {item.badge && (
                              <span
                                className={`text-[10px] font-medium px-1.5 py-0.2 rounded whitespace-nowrap ${
                                  isActive
                                    ? 'bg-indigo-200/80 text-indigo-800'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p
                            className={`text-xs truncate mt-0.5 ${
                              isActive ? 'text-indigo-700/90' : 'text-slate-500'
                            }`}
                          >
                            {highlightMatch(item.subtitle, query)}
                          </p>
                        </div>
                      </div>

                      {/* Right: Category tag & Enter shortcut action */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-md hidden sm:inline-block ${
                            isActive
                              ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.categoryLabel}
                        </span>
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center transition-opacity ${
                            isActive ? 'opacity-100 text-indigo-600' : 'opacity-0 text-slate-300'
                          }`}
                        >
                          <CornerDownLeft className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer with shortcuts & stats */}
            <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
                    ↑↓
                  </kbd>
                  <span className="hidden sm:inline">навигация</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
                    ↵
                  </kbd>
                  <span className="hidden sm:inline">выбрать</span>
                </span>
                <button
                  type="button"
                  onClick={toggleListening}
                  className="flex items-center gap-1 hover:text-[#37a4d3] dark:hover:text-[#37a4d3] transition-colors cursor-pointer"
                  title="Нажмите или нажмите Alt+V для голосового ввода"
                >
                  <kbd
                    className={`px-1.5 py-0.5 text-[10px] font-mono border rounded shadow-2xs ${
                      isListening
                        ? 'bg-rose-50 border-rose-300 text-rose-600 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    Alt+V
                  </kbd>
                  <span className="hidden sm:inline">голос</span>
                </button>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-2xs">
                    esc
                  </kbd>
                  <span className="hidden sm:inline">закрыть</span>
                </span>
              </div>

              <div className="text-[11px] text-slate-400 font-medium">
                {filteredItems.length === 0
                  ? 'Нет совпадений'
                  : `Найдено: ${filteredItems.length}`}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
