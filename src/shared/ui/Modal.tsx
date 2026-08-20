import React, { useEffect, type ReactNode } from 'react';
import clsx from 'clsx';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  closeOnBackdrop?: boolean;
}

export function Modal({ open, onClose, title, children, className, closeOnBackdrop = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Dialog schließen"
        disabled={!closeOnBackdrop}
        className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm disabled:pointer-events-none"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx('relative z-10 max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-white/10 bg-neutral-950 p-6 shadow-2xl', className)}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="ui-hit rounded-lg px-3 text-white/60 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aif-gold-DEFAULT"
            aria-label="Dialog schließen"
          >
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export default Modal;
