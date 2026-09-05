import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TabKey, SearchItem, ThemeMode } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KeyModal } from './components/KeyModal';
import { GlobalSearch } from './components/GlobalSearch';
import { SummaryView } from './components/views/SummaryView';
import { ReportsView } from './components/views/ReportsView';
import { CatalogView } from './components/views/CatalogView';
import { UsageView } from './components/views/UsageView';
import { LeadsView } from './components/views/LeadsView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { BlogView } from './components/views/BlogView';
import { InventoryView } from './components/views/InventoryView';
import { ToastNotification } from './components/ToastNotification';
import { buildSearchIndex } from './services/searchIndex';
import { getStoredTheme, applyTheme } from './services/theme';
import {
  getStoredKey,
  setStoredKey,
  fetchAdminData,
} from './api';
import { AlertCircle, RotateCw } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabKey>('summary');
  const [days, setDays] = useState<string>('30');
  const [adminKey, setAdminKey] = useState<string>(() => getStoredKey());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => !getStoredKey());
  const [isLiveConnection, setIsLiveConnection] = useState<boolean>(false);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => getStoredTheme());

  // Apply theme class and data-theme attributes whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Respond to OS system theme preference changes if 'system' is active
  useEffect(() => {
    if (theme !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      applyTheme('system');
    };
    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme]);

  // Cross-view target filters set by global search
  const [searchReportsQuery, setSearchReportsQuery] = useState<string>('');
  const [searchLeadsQuery, setSearchLeadsQuery] = useState<string>('');
  const [searchCatalogStepId, setSearchCatalogStepId] = useState<string>('');

  // Data state
  const [viewData, setViewData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Global search index built across sections and data
  const searchItems = useMemo(() => {
    const activeReports = currentTab === 'reports' && viewData?.rows ? viewData.rows : undefined;
    return buildSearchIndex(activeReports);
  }, [currentTab, viewData]);

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch view data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const { data, isLive, latencyMs: measuredLatency } = await fetchAdminData(
        currentTab,
        days,
        adminKey,
        isDemoMode
      );
      setViewData(data);
      setIsLiveConnection(isLive);
      setLatencyMs(measuredLatency ?? Math.round(performance.now() - start));
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки данных');
      setLatencyMs(Math.round(performance.now() - start));
    } finally {
      setIsLoading(false);
    }
  }, [currentTab, days, adminKey, isDemoMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveKey = (newKey: string) => {
    setAdminKey(newKey);
    setStoredKey(newKey);
    setIsDemoMode(!newKey);
  };

  const handleTabChange = (tab: TabKey) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSearchItem = (item: SearchItem) => {
    // 1. Actions
    if (item.actionType) {
      if (item.actionType === 'changePeriod' && item.actionValue) {
        setDays(item.actionValue);
      } else if (item.actionType === 'refresh') {
        loadData();
      } else if (item.actionType === 'openKeyModal') {
        setIsKeyModalOpen(true);
      } else if (item.actionType === 'toggleDemo') {
        setIsDemoMode((prev) => !prev);
      } else if (item.actionType === 'toggleTheme') {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
      } else if (item.actionType === 'setTheme' && item.actionValue) {
        setTheme(item.actionValue as ThemeMode);
      }
      return;
    }

    // 2. Navigation
    if (item.tabTarget) {
      if (item.tabTarget === 'reports' && item.targetSearchQuery) {
        setSearchReportsQuery(item.targetSearchQuery);
      } else if (item.tabTarget === 'leads' && item.targetSearchQuery) {
        setSearchLeadsQuery(item.targetSearchQuery);
      } else if (item.tabTarget === 'catalog' && item.targetStepId) {
        setSearchCatalogStepId(item.targetStepId);
      }

      handleTabChange(item.tabTarget);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans antialiased selection:bg-indigo-500/20 selection:text-indigo-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Sidebar Navigation */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={handleTabChange}
            isLive={isLiveConnection}
            hasKey={!!adminKey}
            onOpenKeyModal={() => setIsKeyModalOpen(true)}
            latencyMs={latencyMs}
            theme={theme}
            onThemeChange={setTheme}
          />

          {/* Main Content Area */}
          <main className="flex-1 w-full min-w-0">
            <Header
              currentTab={currentTab}
              onNavigate={handleTabChange}
              days={days}
              onChangeDays={setDays}
              onRefresh={loadData}
              isLoading={isLoading}
              isLive={isLiveConnection}
              hasKey={!!adminKey}
              onOpenKeyModal={() => setIsKeyModalOpen(true)}
              onOpenSearch={() => setIsSearchOpen(true)}
              theme={theme}
              onThemeChange={setTheme}
            />

            {/* Error banner */}
            {error && (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm mb-6 flex items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 rounded-md bg-white hover:bg-rose-100 border border-rose-300 text-xs font-semibold text-rose-800 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Повторить
                </button>
              </div>
            )}

            {/* View container with loading skeleton or content */}
            <div className="relative min-h-[420px]">
              <AnimatePresence mode="wait">
                {isLoading && !viewData ? (
                  <motion.div
                    key="loading-skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-32 rounded-lg bg-white border border-slate-200 shadow-sm p-6 animate-pulse"
                        />
                      ))}
                    </div>
                    <div className="h-64 rounded-lg bg-white border border-slate-200 shadow-sm animate-pulse" />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`${currentTab}-${days}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  >
                    {currentTab === 'summary' && viewData && (
                      <SummaryView data={viewData} onNavigate={handleTabChange} days={days} />
                    )}
                    {currentTab === 'reports' && viewData && (
                      <ReportsView
                        data={viewData}
                        initialSearchQuery={searchReportsQuery}
                      />
                    )}
                    {currentTab === 'catalog' && viewData && (
                      <CatalogView
                        data={viewData}
                        initialStepId={searchCatalogStepId}
                      />
                    )}
                    {currentTab === 'usage' && viewData && (
                      <UsageView data={viewData} />
                    )}
                    {currentTab === 'leads' && viewData && (
                      <LeadsView
                        data={viewData}
                        initialSearchQuery={searchLeadsQuery}
                      />
                    )}
                    {currentTab === 'analytics' && viewData && (
                      <AnalyticsView data={viewData} days={days} />
                    )}
                    {currentTab === 'blog' && viewData && (
                      <BlogView data={viewData} />
                    )}
                    {currentTab === 'inventory' && viewData && (
                      <InventoryView data={viewData} />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      {/* Global Quick Search Component */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        items={searchItems}
        onSelectItem={handleSelectSearchItem}
      />

      {/* Admin Key & Connection / Theme Settings Modal */}
      <KeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        currentKey={adminKey}
        onSaveKey={handleSaveKey}
        isDemoMode={isDemoMode}
        onToggleDemo={setIsDemoMode}
        theme={theme}
        onThemeChange={setTheme}
      />

      {/* Global Toast Notification System */}
      <ToastNotification />
    </div>
  );
}
