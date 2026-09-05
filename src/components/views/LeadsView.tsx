import React, { useState, useMemo, useEffect, useRef } from 'react';
import { LeadsResponse, LeadPerson } from '../../types';
import { MetricCard } from '../MetricCard';
import { formatNumber } from '../../api';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  MessageCircle,
  Clock,
  FileCheck,
  CheckCircle2,
  Activity,
  Layers,
  CheckSquare,
  Square,
  MinusSquare,
  Trash2,
  Tag,
  ChevronDown,
  Download,
  X,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface LeadsViewProps {
  data: LeadsResponse;
  initialSearchQuery?: string;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ data, initialSearchQuery }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Maintain local state of leads for real-time bulk updates and deletions
  const [leadsList, setLeadsList] = useState<LeadPerson[]>(() => data.people || []);

  useEffect(() => {
    if (data.people) {
      setLeadsList(data.people);
    }
  }, [data.people]);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Close status menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setIsStatusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredPeople = useMemo(() => {
    return leadsList.filter((lead) => {
      const matchSearch =
        (lead.full_name && lead.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (lead.username && lead.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
        String(lead.user_id).includes(searchQuery);

      const matchSource = sourceFilter === 'all' || lead.source === sourceFilter;

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'verified' && lead.verified) ||
        (statusFilter === 'unverified' && !lead.verified) ||
        lead.status === statusFilter;

      return matchSearch && matchSource && matchStatus;
    });
  }, [leadsList, searchQuery, sourceFilter, statusFilter]);

  const uniqueSources = useMemo(() => {
    const set = new Set<string>();
    leadsList.forEach((p) => {
      if (p.source) set.add(p.source);
    });
    return Array.from(set);
  }, [leadsList]);

  const totalReports = leadsList.reduce((acc, p) => acc + (p.reports || 0), 0);
  const verifiedCount = leadsList.filter((p) => p.verified).length;

  // Selection handlers
  const isAllFilteredSelected =
    filteredPeople.length > 0 && filteredPeople.every((p) => selectedIds.has(p.user_id));
  const isSomeFilteredSelected =
    filteredPeople.some((p) => selectedIds.has(p.user_id)) && !isAllFilteredSelected;

  const toggleSelectAllFiltered = () => {
    if (isAllFilteredSelected) {
      // Unselect filtered
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredPeople.forEach((p) => next.delete(p.user_id));
        return next;
      });
    } else {
      // Select all filtered
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredPeople.forEach((p) => next.add(p.user_id));
        return next;
      });
    }
  };

  const toggleSelectLead = (id: string | number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Bulk Actions
  const handleBulkStatusChange = (newStatus: 'verified' | 'unverified' | 'in_progress' | 'qualified' | 'archived') => {
    const count = selectedIds.size;
    if (count === 0) return;

    setLeadsList((prev) =>
      prev.map((lead) => {
        if (selectedIds.has(lead.user_id)) {
          if (newStatus === 'verified') {
            return { ...lead, verified: true, status: 'verified' };
          }
          if (newStatus === 'unverified') {
            return { ...lead, verified: false, status: 'new' };
          }
          return { ...lead, status: newStatus };
        }
        return lead;
      })
    );

    setIsStatusMenuOpen(false);

    const statusNames: Record<string, string> = {
      verified: 'Подтверждён (Verified)',
      unverified: 'Снято подтверждение',
      in_progress: 'В обработке',
      qualified: 'Квалифицирован',
      archived: 'В архив',
    };

    toast.success(
      'Статус обновлён',
      `Для ${count} ${count === 1 ? 'лида' : 'лидов'} установлен статус: ${statusNames[newStatus]}`
    );
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    setLeadsList((prev) => prev.filter((lead) => !selectedIds.has(lead.user_id)));
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);

    toast.success(
      'Лиды удалены',
      `Успешно удалено ${count} ${count === 1 ? 'лид' : 'лидов'} из списка`
    );
  };

  const handleBulkExport = () => {
    const selectedList = leadsList.filter((lead) => selectedIds.has(lead.user_id));
    if (selectedList.length === 0) return;

    const headers = ['User ID', 'Имя', 'Username', 'Источник', 'Отчётов', 'Подтверждён', 'Статус', 'Дата регистрации'];
    const rows = selectedList.map((lead) => [
      lead.user_id,
      `"${(lead.full_name || '').replace(/"/g, '""')}"`,
      lead.username ? `@${lead.username}` : '',
      `"${lead.source || ''}"`,
      lead.reports,
      lead.verified ? 'Да' : 'Нет',
      lead.status || 'new',
      new Date(lead.created * 1000).toLocaleDateString('ru-RU'),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.info('Экспорт завершён', `Скачан файл с ${selectedList.length} лидами`);
  };

  const renderStatusBadge = (lead: LeadPerson) => {
    if (lead.status === 'in_progress') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          В обработке
        </span>
      );
    }
    if (lead.status === 'qualified') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          Квалифицирован
        </span>
      );
    }
    if (lead.status === 'archived') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          Архив
        </span>
      );
    }
    if (lead.verified) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Подтверждён
        </span>
      );
    }
    return (
      <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
        Новый
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          label="Всего пользователей"
          value={formatNumber(leadsList.length)}
          subtext="В базе Telegram-бота"
          icon={<Users className="w-4 h-4 text-indigo-600" />}
        />
        <MetricCard
          label="Сгенерировано отчётов"
          value={formatNumber(totalReports)}
          subtext={`В среднем ${(totalReports / (leadsList.length || 1)).toFixed(1)} на пользователя`}
          icon={<FileCheck className="w-4 h-4 text-emerald-600" />}
        />
        <MetricCard
          label="Подтверждённых контактов"
          value={verifiedCount}
          subtext="Оставили контактные данные"
          icon={<CheckCircle2 className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* Search and Source Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Поиск по имени, @username или Telegram ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-md text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSourceFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              sourceFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Все источники ({leadsList.length})
          </button>
          {uniqueSources.map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                sourceFilter === src
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {src}
            </button>
          ))}
        </div>
      </div>

      {/* Floating / Sticky Bulk Actions Bar when leads are selected */}
      {selectedIds.size > 0 && (
        <div className="sticky top-4 z-20 bg-slate-900 text-white rounded-lg p-3.5 shadow-lg border border-slate-700 flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-500 text-white text-xs font-bold">
              {selectedIds.size}
            </span>
            <span className="text-xs sm:text-sm font-medium text-slate-200">
              Выбрано: <strong className="text-white">{selectedIds.size}</strong> из {filteredPeople.length}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Снять выбор
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Change Status Dropdown */}
            <div className="relative" ref={statusMenuRef}>
              <button
                type="button"
                onClick={() => setIsStatusMenuOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-colors cursor-pointer"
              >
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Изменить статус</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isStatusMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-30 text-xs">
                  <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Массовый статус
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange('verified')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400 font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Подтверждён (Verified)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange('in_progress')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 cursor-pointer text-amber-600 dark:text-amber-400 font-medium"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>В обработке</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange('qualified')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 cursor-pointer text-purple-600 dark:text-purple-400 font-medium"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Квалифицирован</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange('unverified')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-300"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Снять подтверждение</span>
                  </button>
                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                  <button
                    type="button"
                    onClick={() => handleBulkStatusChange('archived')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/80 flex items-center gap-2 cursor-pointer text-slate-500"
                  >
                    <span>Переместить в архив</span>
                  </button>
                </div>
              )}
            </div>

            {/* Export Selected Button */}
            <button
              type="button"
              onClick={handleBulkExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 transition-colors cursor-pointer"
              title="Экспортировать выбранных лидов в CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Экспорт</span>
            </button>

            {/* Delete Selected Button */}
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
              title="Удалить выбранных лидов"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить</span>
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-full bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Подтверждение удаления
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Вы уверены, что хотите удалить <strong>{selectedIds.size}</strong> выбранных лидов? Записи будут удалены из базы текущей сессии.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-md text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                Да, удалить ({selectedIds.size})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Leads Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                {/* Checkbox Column */}
                <th className="py-3.5 px-4 w-10 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer flex items-center justify-center mx-auto"
                    title={isAllFilteredSelected ? 'Снять выделение со всех' : 'Выбрать все отфильтрованные'}
                    aria-label="Выбрать все"
                  >
                    {isAllFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : isSomeFilteredSelected ? (
                      <MinusSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Пользователь</th>
                <th className="py-3.5 px-4">Статус</th>
                <th className="py-3.5 px-4">Источник</th>
                <th className="py-3.5 px-4 text-center">Отчётов</th>
                <th className="py-3.5 px-4">Первый визит</th>
                <th className="py-3.5 px-4 text-right">Крайний отчёт</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPeople.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Пользователи не найдены
                  </td>
                </tr>
              ) : (
                filteredPeople.map((lead) => {
                  const isSelected = selectedIds.has(lead.user_id);
                  return (
                    <tr
                      key={lead.user_id}
                      className={`transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-2 border-indigo-600'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                      }`}
                      onClick={() => toggleSelectLead(lead.user_id)}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-4 text-center w-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLead(lead.user_id)}
                          aria-label={`Выбрать ${lead.full_name || lead.user_id}`}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                      </td>

                      {/* User details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {lead.full_name ? lead.full_name[0] : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{lead.full_name || 'Без имени'}</span>
                              {lead.verified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400">
                              {lead.username ? `@${lead.username}` : `ID: ${lead.user_id}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        {renderStatusBadge(lead)}
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {lead.source || 'Прямой (@bot)'}
                      </td>

                      {/* Reports count */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900 dark:text-slate-100">
                        {lead.reports}
                      </td>

                      {/* Created date */}
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {new Date(lead.created * 1000).toLocaleDateString('ru-RU')}
                      </td>

                      {/* Last report date */}
                      <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                        {lead.last_report
                          ? new Date(lead.last_report * 1000).toLocaleDateString('ru-RU')
                          : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Mini Breakdowns: By Report Kind and Acquisition Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {data.by_kind && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Популярность типов отчётов</span>
            </h4>
            <div className="space-y-3">
              {data.by_kind.map((stage) => {
                const totalN = data.by_kind.reduce((acc, k) => acc + k.n, 0) || 1;
                const pct = ((stage.n / totalN) * 100).toFixed(0);
                return (
                  <div key={stage.kind} className="text-xs">
                    <div className="flex justify-between text-slate-700 dark:text-slate-300 mb-1">
                      <span>{stage.kind}</span>
                      <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                        {formatNumber(stage.n)} раз ({stage.people} польз.)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-indigo-600 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {data.by_source && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-indigo-600" />
              <span>Источники переходов (каналы)</span>
            </h4>
            <div className="space-y-2.5 text-xs">
              {data.by_source.map((src) => (
                <div
                  key={src.src}
                  className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  <span className="text-slate-800 dark:text-slate-200 font-medium">{src.src}</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {formatNumber(src.n)} переходов
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Events table if available */}
      {data.events && data.events.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>События и действия в боте</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {data.events.map((ev) => (
              <div
                key={ev.type}
                className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md flex justify-between items-center"
              >
                <span className="font-mono text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {ev.type}
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {formatNumber(ev.n)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
