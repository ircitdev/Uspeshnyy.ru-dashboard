import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastType } from '../types';

const TOAST_STYLES: Record<
  ToastType,
  {
    icon: React.ReactNode;
    bg: string;
    border: string;
    text: string;
    iconColor: string;
    progress: string;
  }
> = {
  success: {
    icon: <CheckCircle2 className="w-5 h-5" />,
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-emerald-200 dark:border-emerald-800/80',
    text: 'text-slate-900 dark:text-slate-100',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
    progress: 'bg-emerald-500',
  },
  error: {
    icon: <AlertCircle className="w-5 h-5" />,
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-rose-200 dark:border-rose-800/80',
    text: 'text-slate-900 dark:text-slate-100',
    iconColor: 'text-rose-500 dark:text-rose-400',
    progress: 'bg-rose-500',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-amber-200 dark:border-amber-800/80',
    text: 'text-slate-900 dark:text-slate-100',
    iconColor: 'text-amber-500 dark:text-amber-400',
    progress: 'bg-amber-500',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    bg: 'bg-white dark:bg-slate-900',
    border: 'border-[#37a4d3]/30 dark:border-[#37a4d3]/40',
    text: 'text-slate-900 dark:text-slate-100',
    iconColor: 'text-[#37a4d3]',
    progress: 'bg-[#37a4d3]',
  },
};

export const ToastNotification: React.FC = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div
      aria-live="assertive"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] || TOAST_STYLES.info;

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: 10, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className={`pointer-events-auto relative overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all ${style.bg} ${style.border}`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 mt-0.5 ${style.iconColor}`}>{style.icon}</div>

                <div className="flex-1 min-w-0 pr-2">
                  <h5 className={`text-sm font-semibold leading-snug ${style.text}`}>
                    {toast.title}
                  </h5>
                  {toast.message && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed break-words">
                      {toast.message}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="flex-shrink-0 -mt-1 -mr-1 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Закрыть уведомление"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Progress timer bar */}
              {toast.duration && toast.duration > 0 && (
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: toast.duration / 1000, ease: 'linear' }}
                  className={`absolute bottom-0 left-0 h-1 ${style.progress} opacity-70`}
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
