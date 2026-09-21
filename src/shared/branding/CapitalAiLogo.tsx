import React from 'react';
import { motion } from 'motion/react';
import brandmark from '../../../docs/frontend/brandmark.json';
import { CAPITAL_AI_VERSION } from '../../platform/Branding/runtimeBrand';
import { CapitalAiEmblem } from './CapitalAiEmblem';

interface CapitalAiLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  version?: string;
}

/**
 * Canonical CAPITAL-AI brand projection.
 *
 * Logo geometry comes from SvenKulessa/FRONTEND through CapitalAiEmblem.
 * Colors, typography, naming and version labels remain Finance-owned.
 */
export function CapitalAiLogo({
  className = '',
  size = 160,
  showText = true,
  version = CAPITAL_AI_VERSION,
}: CapitalAiLogoProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${className}`}
      data-brandmark-version={brandmark.version}
    >
      <motion.div
        animate={{ scale: [1, 1.03, 1], rotateY: [0, 8, 0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        className="perspective-1000 select-none cursor-pointer"
        style={{ width: size, height: size }}
      >
        <CapitalAiEmblem sizeClass="h-full w-full" />
      </motion.div>

      {showText && (
        <div className="mt-4 flex flex-col items-center">
          <h1 className="text-2xl font-black text-brand-primary tracking-[0.1em] font-display uppercase mr-[-0.1em]">
            CAPITAL-AI
          </h1>
          <p className="text-[10px] text-white/50 font-mono tracking-[0.3em] uppercase mt-1.5 mr-[-0.3em]">
            VERSION {version}
          </p>
        </div>
      )}
    </div>
  );
}
