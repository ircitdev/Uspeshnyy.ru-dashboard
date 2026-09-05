import { ThemeMode } from '../types';

const THEME_STORAGE_KEY = 'uspeshnyy_admin_theme';

export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch (e) {
    // Ignore localStorage errors
  }
  return 'system';
}

export function applyTheme(theme: ThemeMode): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  let resolved: 'light' | 'dark' = 'light';
  if (theme === 'system') {
    resolved = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  } else {
    resolved = theme;
  }

  const root = document.documentElement;
  root.setAttribute('data-theme', resolved);
  if (resolved === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    // Ignore localStorage errors
  }

  return resolved;
}
