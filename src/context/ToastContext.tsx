import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastItem, ToastType } from '../types';

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id' | 'timestamp'>) => string;
  removeToast: (id: string) => void;
  toast: {
    success: (title: string, message?: string, duration?: number) => string;
    error: (title: string, message?: string, duration?: number) => string;
    warning: (title: string, message?: string, duration?: number) => string;
    info: (title: string, message?: string, duration?: number) => string;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, 'id' | 'timestamp'>) => {
      const id = 'toast_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
      const newToast: ToastItem = {
        ...item,
        id,
        timestamp: Date.now(),
        duration: item.duration ?? 4500,
      };

      setToasts((prev) => [...prev.slice(-4), newToast]); // keep at most 5 toasts on screen

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [removeToast]
  );

  const toast = {
    success: useCallback(
      (title: string, message?: string, duration?: number) =>
        addToast({ type: 'success', title, message, duration }),
      [addToast]
    ),
    error: useCallback(
      (title: string, message?: string, duration?: number) =>
        addToast({ type: 'error', title, message, duration: duration ?? 6000 }),
      [addToast]
    ),
    warning: useCallback(
      (title: string, message?: string, duration?: number) =>
        addToast({ type: 'warning', title, message, duration: duration ?? 5500 }),
      [addToast]
    ),
    info: useCallback(
      (title: string, message?: string, duration?: number) =>
        addToast({ type: 'info', title, message, duration }),
      [addToast]
    ),
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast }}>
      {children}
    </ToastContext.Provider>
  );
};

const fallbackToastContext: ToastContextValue = {
  toasts: [],
  addToast: () => '',
  removeToast: () => {},
  toast: {
    success: () => '',
    error: () => '',
    warning: () => '',
    info: () => '',
  },
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    console.warn('useToast was called outside of a ToastProvider. Using fallback no-op toast handler.');
    return fallbackToastContext;
  }
  return context;
}
