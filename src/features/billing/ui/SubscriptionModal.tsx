import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { SubscriptionTier } from '../../../app/types/UserSession';
import { Abonnements } from './Abonnements';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier: SubscriptionTier;
  onUpdateTier: (tier: SubscriptionTier) => void;
  email: string;
  userId?: string;
}

/**
 * Modal projection of the canonical billing surface. It intentionally reuses Abonnements so the
 * modal cannot grow a second plan matrix, pricing calculation or entitlement authority.
 */
export function SubscriptionModal({
  isOpen,
  onClose,
  currentTier,
  onUpdateTier,
  email,
  userId,
}: SubscriptionModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 p-3 backdrop-blur-md sm:p-6">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-dialog-title"
        className="relative mx-auto w-full max-w-6xl rounded-2xl border border-white/15 bg-neutral-950 p-4 shadow-2xl sm:p-6"
      >
        <header className="mb-4 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-brand-primary">Subscription</p>
            <h2 id="subscription-dialog-title" className="text-lg font-black text-white">Tarife und Abonnement verwalten</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tarifdialog schließen"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <Abonnements
          currentTier={currentTier}
          onUpdateTier={onUpdateTier}
          email={email}
          userId={userId}
        />
      </section>
    </div>
  );
}
