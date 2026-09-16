import { useEffect, useRef, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export interface DashboardNavigationDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
  triggerId?: string;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => element.getAttribute('aria-hidden') !== 'true',
  );
}

/**
 * App-owned BB-2E drawer shell.
 *
 * This component owns presentation interaction only: modal semantics, Escape,
 * keyboard focus containment, scroll locking, reduced-motion handling and
 * focus return. Navigation, routing, IAM, entitlement and feature authority
 * remain outside this shell.
 */
export function DashboardNavigationDrawer({
  open,
  onClose,
  children,
  labelledBy = 'dashboard-navigation-title',
  triggerId = 'dashboard-main-menu-trigger',
}: DashboardNavigationDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    if (!panel) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const initialFocusable = getFocusableElements(panel)[0] ?? panel;
    const initialFocusFrame = requestAnimationFrame(() => initialFocusable.focus());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements(panel);
      if (focusableElements.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (!panel.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      cancelAnimationFrame(initialFocusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;

      const trigger = triggerId ? document.getElementById(triggerId) : null;
      const returnTarget = trigger instanceof HTMLElement ? trigger : previouslyFocused;
      if (returnTarget && document.contains(returnTarget)) {
        requestAnimationFrame(() => returnTarget.focus());
      }
    };
  }, [open, triggerId]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            aria-hidden="true"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
            transition={reduceMotion ? { duration: 0 } : undefined}
            onClick={() => onCloseRef.current()}
            className="fixed inset-0 z-40 cursor-pointer bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            id="dashboard-navigation-drawer"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            tabIndex={-1}
            initial={reduceMotion ? false : { x: '-100%' }}
            animate={{ x: 0 }}
            exit={reduceMotion ? { x: 0 } : { x: '-100%' }}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 top-0 z-50 flex w-full flex-col justify-between overflow-y-auto border-r border-white/10 bg-black/95 shadow-[0_0_50px_rgba(245,196,83,0.15)] outline-none scrollbar-thin scrollbar-thumb-white/10 sm:w-80 [&_a]:min-h-[44px] [&_button]:min-h-[44px]"
          >
            {children}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export default DashboardNavigationDrawer;
