import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: ToastMessage; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-white dark:bg-slate-800 border-green-100 dark:border-green-900/30',
    error: 'bg-white dark:bg-slate-800 border-red-100 dark:border-red-900/30',
    info: 'bg-white dark:bg-slate-800 border-blue-100 dark:border-blue-900/30',
  };

  return (
    <div className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border ${bgColors[toast.type]} animate-fade-in-up`}>
      <div className="shrink-0 mt-0.5">{icons[toast.type]}</div>
      <div className="flex-1 min-w-0">
        {toast.title && <h4 className="font-bold text-sm text-slate-800 dark:text-white mb-0.5">{toast.title}</h4>}
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{toast.message}</p>
      </div>
      <button onClick={onRemove} className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <X size={18} />
      </button>
    </div>
  );
};
