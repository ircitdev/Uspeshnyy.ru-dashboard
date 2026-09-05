import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, Trash2, Pin, Tag, Check, Sparkles } from 'lucide-react';
import { QuickNote, NoteCategory } from '../../types';
import { useToast } from '../../context/ToastContext';

const STORAGE_KEY = 'uspeshnyy_quick_notes';

const INITIAL_NOTES: QuickNote[] = [
  {
    id: 'note-1',
    text: 'Проверить расход токенов Claude 3.5 Sonnet и оптимизировать системный промпт',
    category: 'important',
    pinned: true,
    createdAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'note-2',
    text: 'Согласовать новую структуру конверсионных шагов Telegram-бота',
    category: 'idea',
    pinned: false,
    createdAt: Date.now() - 3600000 * 5,
  },
];

const CATEGORY_CONFIG: Record<
  NoteCategory,
  { label: string; color: string; bg: string; border: string }
> = {
  general: {
    label: 'Заметка',
    color: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
  },
  important: {
    label: 'Важно',
    color: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-200 dark:border-rose-800',
  },
  idea: {
    label: 'Идея',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-800',
  },
  bug: {
    label: 'Баг / Сбой',
    color: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    border: 'border-purple-200 dark:border-purple-800',
  },
};

export const QuickNotesWidget: React.FC = () => {
  const { toast } = useToast();
  const [notes, setNotes] = useState<QuickNote[]>(() => {
    if (typeof window === 'undefined') return INITIAL_NOTES;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_NOTES;
    } catch {
      return INITIAL_NOTES;
    }
  });

  const [newText, setNewText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory>('general');
  const [isAdding, setIsAdding] = useState(false);

  // Save notes to localStorage whenever updated
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch (err) {
      console.error('Failed to save notes to localStorage', err);
    }
  }, [notes]);

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = newText.trim();
    if (!cleanText) return;

    const newNote: QuickNote = {
      id: 'note_' + Date.now(),
      text: cleanText,
      category: selectedCategory,
      pinned: false,
      createdAt: Date.now(),
    };

    setNotes((prev) => [newNote, ...prev]);
    setNewText('');
    setIsAdding(false);
    toast.success('Заметка добавлена', cleanText.slice(0, 45) + (cleanText.length > 45 ? '...' : ''));
  };

  const handleTogglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n))
    );
  };

  const handleDeleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.info('Заметка удалена');
  };

  // Sort notes: pinned first, then by date descending
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.createdAt - a.createdAt;
  });

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}.${month}, ${hours}:${minutes}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-colors">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#37a4d3]/10 text-[#37a4d3] flex items-center justify-center flex-shrink-0">
              <StickyNote className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-tight">
                Быстрые заметки
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Краткие пометки и рабочие задачи (сохраняются в localStorage)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {notes.length} шт.
            </span>
          </div>
        </div>

        {/* Note Creator Form */}
        <form onSubmit={handleAddNote} className="mt-4 mb-4">
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onFocus={() => setIsAdding(true)}
                placeholder="Записать новую заметку или напоминание..."
                className="w-full px-3.5 py-2 text-xs rounded-md bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#37a4d3] focus:border-[#37a4d3] transition-all"
              />
            </div>

            {(isAdding || newText.length > 0) && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                {/* Category selector pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(Object.keys(CATEGORY_CONFIG) as NoteCategory[]).map((cat) => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-[11px] px-2 py-0.5 rounded-md border font-medium transition-all cursor-pointer ${
                          isSelected
                            ? `${cfg.bg} ${cfg.color} ${cfg.border} ring-1 ring-offset-1 ring-current`
                            : 'bg-transparent text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-700'
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdding(false);
                      setNewText('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 px-2 py-1"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={!newText.trim()}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-md bg-[#37a4d3] text-white hover:bg-[#2c8bb4] disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Добавить</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Notes List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {sortedNotes.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <StickyNote className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Заметок пока нет
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Напишите короткую заметку в поле выше для быстрого доступа
              </p>
            </div>
          ) : (
            sortedNotes.map((note) => {
              const catConfig = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.general;
              return (
                <div
                  key={note.id}
                  className={`group relative p-3 rounded-lg border transition-all ${
                    note.pinned
                      ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed break-words flex-1">
                      {note.text}
                    </p>

                    <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => handleTogglePin(note.id, e)}
                        title={note.pinned ? 'Открепить заметку' : 'Закрепить наверху'}
                        className={`p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer ${
                          note.pinned
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5 fill-current" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        title="Удалить заметку"
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 text-[10px] text-slate-400 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span
                      className={`inline-block px-1.5 py-0.2 rounded border font-medium ${catConfig.bg} ${catConfig.color} ${catConfig.border}`}
                    >
                      {catConfig.label}
                    </span>
                    <span className="font-mono">{formatDate(note.createdAt)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
