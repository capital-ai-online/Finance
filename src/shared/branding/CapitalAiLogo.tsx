import React, { useId, useMemo } from 'react';
import { motion } from 'motion/react';
import brandmark from '../../../docs/frontend/brandmark.json';
import { CAPITAL_AI_VERSION } from '../../platform/Branding/runtimeBrand';

interface CapitalAiLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  version?: string;
}

const TOKEN_COLOR: Record<string, string> = {
  'color.brand.primary': 'var(--color-brand-primary)',
  'color.brand.accent': 'var(--color-brand-accent)',
};

/**
 * Canonical CAPITAL-AI brand mark.
 * Branding Manifest v6.2: geometry is versioned in docs/frontend/brandmark.json;
 * color roles remain authoritative in docs/frontend/design-tokens.json.
 */
export function CapitalAiLogo({ className = '', size = 160, showText = true, version = CAPITAL_AI_VERSION }: CapitalAiLogoProps) {
  const idPrefix = useId().replace(/:/g, '');
  const gradientId = `${idPrefix}-gold-sphere-3d`;
  const glowId = `${idPrefix}-glow-line`;
  const nodeById = useMemo(() => new Map(brandmark.nodes.map((node) => [node.id, node])), []);

  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <motion.div
        animate={{ scale: [1, 1.03, 1], rotateY: [0, 8, 0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
        className="perspective-1000 select-none cursor-pointer"
        style={{ width: size, height: size }}
      >
        <svg
          viewBox={brandmark.viewBox.join(' ')}
          width="100%"
          height="100%"
          className="filter drop-shadow-[0_0_25px_rgba(249,191,33,0.3)]"
          aria-hidden="true"
          data-brandmark-version={brandmark.version}
        >
          <defs>
            <radialGradient id={gradientId} cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="var(--color-brand-primary)" />
              <stop offset="42%" stopColor="var(--color-brand-primary)" />
              <stop offset="100%" stopColor="var(--color-brand-primary)" />
            </radialGradient>
            <filter id={glowId} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {brandmark.edges.map((edge, index) => {
            const from = nodeById.get(edge.from);
            const to = nodeById.get(edge.to);
            if (!from || !to) return null;
            const color = TOKEN_COLOR[edge.strokeToken];
            if (!color) return null;
            return (
              <line
                key={`${edge.from}-${edge.to}-${index}`}
                x1={from.cx}
                y1={from.cy}
                x2={to.cx}
                y2={to.cy}
                stroke={color}
                strokeWidth={edge.width}
                strokeOpacity={edge.opacity}
                filter={edge.strokeToken === 'color.brand.accent' && index % 5 === 0 ? `url(#${glowId})` : undefined}
              />
            );
          })}

          {brandmark.nodes.map((node) => (
            <circle
              key={node.id}
              cx={node.cx}
              cy={node.cy}
              r={node.r}
              fill={node.fillToken === 'color.brand.primary' ? `url(#${gradientId})` : TOKEN_COLOR[node.fillToken]}
            />
          ))}
        </svg>
      </motion.div>
      {showText && (
        <div className="mt-4 flex flex-col items-center">
          <h1 className="text-2xl font-black text-brand-primary tracking-[0.1em] font-display uppercase mr-[-0.1em]">CAPITAL-AI</h1>
          <p className="text-[10px] text-white/50 font-mono tracking-[0.3em] uppercase mt-1.5 mr-[-0.3em]">VERSION {version}</p>
        </div>
      )}
    </div>
  );
}
