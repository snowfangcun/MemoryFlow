import React from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '../../stores/useToastStore';

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const colors = {
  success: { bg: '#5db872', text: '#ffffff' },
  error: { bg: '#c64545', text: '#ffffff' },
  info: { bg: '#cc785c', text: '#ffffff' },
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => {
        const Icon = icons[toast.type];
        const c = colors[toast.type];
        return (
          <div key={toast.id}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-sm enter"
            style={{ backgroundColor: c.bg, color: c.text }}>
            <Icon size={16} />
            <span className="text-sm font-medium">{toast.message}</span>
            <button onClick={() => removeToast(toast.id)}
              className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
