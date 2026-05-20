import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

const toastVariants = {
  initial: { opacity: 0, y: 24, scale: 0.9 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.28, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  exit: {
    opacity: 0, y: -12, scale: 0.9,
    transition: { duration: 0.18, ease: 'easeIn' as const },
  },
};

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const Icon = icons[toast.type];
          const c = colors[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              variants={toastVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-lg shadow-sm"
              style={{ backgroundColor: c.bg, color: c.text }}
            >
              <Icon size={16} />
              <span className="text-sm font-medium">{toast.message}</span>
              <button onClick={() => removeToast(toast.id)}
                className="ml-2 opacity-70 hover:opacity-100 transition-opacity">
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;