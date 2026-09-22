import React from 'react';
import { BookOpen, ShieldCheck, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LearningVocabulary } from '../../../../learning/ui/LearningVocabulary';

interface MarketVocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * FRONTEND presentation adapter for the Market Vocabulary surface.
 *
 * The graphical shell follows SvenKulessa/FRONTEND@cbc558019ae6785f44079fe6fca3403460774df3.
 * Vocabulary content is intentionally not copied from the upstream fixture. The rendered
 * knowledge nodes come exclusively from Finance's canonical ESS-0017 Vocabulary registry
 * through LearningVocabulary.
 */
export const MarketVocabularyModal: React.FC<MarketVocabularyModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/85 backdrop-blur-md sm:items-center sm:p-4"
          data-vocabulary-authority="ESS-0017"
          data-vocabulary-source="src/platform/Vocabulary"
          data-vocabulary-mode="READ_ONLY"
        >
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            className="flex max-h-[96vh] w-full max-w-7xl flex-col overflow-hidden rounded-t-3xl border border-amber-400/25 bg-[#02050e] shadow-[0_0_60px_rgba(249,191,33,0.12)] sm:max-h-[94vh] sm:rounded-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="market-vocabulary-modal-title"
          >
            <header className="flex items-center justify-between gap-4 border-b border-amber-400/15 bg-[#071020]/95 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-400/10 text-amber-300">
                  <BookOpen className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <h1 id="market-vocabulary-modal-title" className="truncate text-base font-black text-white sm:text-lg">
                    Market Vocabulary
                  </h1>
                  <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300">
                    <ShieldCheck className="h-3 w-3" aria-hidden />
                    Kanonisch · Read-only · ESS-0017
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Market Vocabulary schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 lg:px-8">
              <LearningVocabulary />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MarketVocabularyModal;
