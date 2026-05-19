import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  useEffect(() => {
    if (isOpen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="fixed inset-0 bg-black/20" />
      <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md bg-canvas rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
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
        </div>
      </div>
    </div>,
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