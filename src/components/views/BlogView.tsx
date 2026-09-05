import React, { useState } from 'react';
import { BlogData } from '../../types';
import { MetricCard } from '../MetricCard';
import { formatNumber } from '../../api';
import {
  BookOpen,
  Eye,
  MessageSquare,
  ExternalLink,
  Flame,
  Clock,
  Layers,
} from 'lucide-react';

interface BlogViewProps {
  data: BlogData;
}

export const BlogView: React.FC<BlogViewProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState<'top' | 'recent'>('top');

  const postsWithViews = data.posts_with_views || 0;
  const commentsTotal = data.comments_total || 0;
  const recent = data.recent || [];
  const top = data.top || [];

  const totalTopViews = top.reduce((acc, p) => acc + (p.views || p.n || 0), 0);

  const displayList = activeTab === 'top' ? top : recent;

  return (
    <div className="space-y-6">
      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          label="Статей с просмотрами"
          value={formatNumber(postsWithViews)}
          subtext="Опубликованные материалы в блоге"
          icon={<BookOpen className="w-4 h-4 text-indigo-600" />}
        />
        <MetricCard
          label="Всего просмотров (Топ-материалы)"
          value={formatNumber(totalTopViews)}
          subtext="Органический и реферальный охват"
          icon={<Eye className="w-4 h-4 text-slate-700" />}
        />
        <MetricCard
          label="Комментариев в блоге"
          value={formatNumber(commentsTotal)}
          subtext="Обсуждения и вопросы читателей"
          icon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Main Blog Articles Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
              <button
                onClick={() => setActiveTab('top')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'top'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>Самые читаемые</span>
              </button>
              <button
                onClick={() => setActiveTab('recent')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  activeTab === 'recent'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Свежие просмотры</span>
              </button>
            </div>
          </div>
          <a
            href="https://uspeshnyy.ru/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1 self-end sm:self-center"
          >
            <span>Открыть блог на сайте</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Заголовок статьи</th>
                <th className="py-3.5 px-4">URL (Slug)</th>
                <th className="py-3.5 px-4 text-right">Просмотры</th>
                <th className="py-3.5 px-4 text-right">Комментарии</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayList.map((art, idx) => {
                const views = art.views ?? art.n ?? 0;
                return (
                  <tr key={art.slug || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {art.title}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      /{art.slug}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      {formatNumber(views)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {art.comments !== undefined ? formatNumber(art.comments) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
