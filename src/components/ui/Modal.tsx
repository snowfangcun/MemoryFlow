import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

const panelVariants = {
  hidden: { opacity: 0, scale: 0.93, y: 12 },
  visible: {
    opacity: 1, scale: 1, y: 0,
    transition: { type: 'spring' as const, damping: 22, stiffness: 350 },
  },
  exit: {
    opacity: 0, scale: 0.95, y: 8,
    transition: { duration: 0.12, ease: 'easeIn' as const },
  },
};

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed inset-0 z-50"
          onClick={onClose}
        >
          <div className="fixed inset-0 bg-black/20" />
          <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal-panel"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="pointer-events-auto w-full max-w-md bg-canvas rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-hairline shrink-0">
                <h2 className="text-base font-semibold text-ink">{title}</h2>
                <button onClick={onClose} className="p-1 rounded-md hover:bg-surface-soft transition-colors">
                  <X size={18} className="text-muted" />
                </button>
              </div>
              <div className="px-5 py-4 overflow-y-auto">{children}</div>
              {footer && (
                <div className="flex justify-end gap-2.5 px-5 py-4 bg-surface-soft border-t border-hairline shrink-0">{footer}</div>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, onClose, onConfirm, title, message, confirmText = '确认', cancelText = '取消', variant = 'danger',
}) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title}
    footer={<><Button variant="ghost" onClick={onClose}>{cancelText}</Button>
      <Button variant={variant === 'danger' ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</Button></>}>
    <p className="text-sm text-body">{message}</p>
  </Modal>
);

export default Modal;