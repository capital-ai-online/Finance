import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { LearningVocabulary } from '../../../../learning/ui/LearningVocabulary';

interface MarketVocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * FRONTEND presentation adapter for the Market Vocabulary surface.
 * Productive terminology remains a read-only projection of the canonical Finance Vocabulary registry.
 */
export const MarketVocabularyModal: React.FC<MarketVocabularyModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-2 backdrop-blur-md sm:p-4"
          data-vocabulary-authority="ESS-0017"
          data-vocabulary-mode="READ_ONLY"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ duration: 0.2 }}
            className="max-h-[92vh] w-full max-w-3xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="learning-vocabulary-title"
          >
            <LearningVocabulary onClose={onClose} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default MarketVocabularyModal;
