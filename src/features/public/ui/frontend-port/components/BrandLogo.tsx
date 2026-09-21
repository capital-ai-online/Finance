import React from 'react';
import { CapitalAiEmblem } from '../../../../../shared/branding/CapitalAiEmblem';

interface BrandLogoProps {
  variant?: 'emblem' | 'inline' | 'stacked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  onClick?: () => void;
}

export const CapitalAIVectorEmblem = CapitalAiEmblem;

/**
 * FRONTEND presentation adapter.
 *
 * The emblem geometry follows SvenKulessa/FRONTEND.
 * Branding colors, typography and naming remain Finance-owned.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'inline',
  size = 'md',
  showSubtitle = true,
  className = '',
  onClick,
}) => {
  const emblemSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }[size];

  const titleSizeClasses = {
    sm: 'text-base',
    md: 'text-[21px]',
    lg: 'text-2xl',
    xl: 'text-3xl',
  }[size];

  const subtitleSizeClasses = {
    sm: 'text-[7px]',
    md: 'text-[8.5px]',
    lg: 'text-[10px]',
    xl: 'text-xs',
  }[size];

  if (variant === 'emblem') {
    return <CapitalAiEmblem sizeClass={emblemSizeClasses} className={className} />;
  }

  if (variant === 'stacked') {
    return (
      <div
        className={`flex flex-col items-center justify-center text-center select-none cursor-pointer group ${className}`}
        onClick={onClick}
      >
        <CapitalAiEmblem
          sizeClass={emblemSizeClasses}
          className="group-hover:scale-105 transition-transform duration-300"
        />
        <span
          className={`${titleSizeClasses} font-display font-bold tracking-tight leading-none text-brand-primary mt-2`}
        >
          CAPITAL-AI
        </span>
        {showSubtitle && (
          <span
            className={`${subtitleSizeClasses} font-sans font-semibold text-text-secondary tracking-[0.22em] mt-1 uppercase`}
          >
            AI-DRIVEN MARKET INTELLIGENCE
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center space-x-3 cursor-pointer select-none group ${className}`}
      onClick={onClick}
    >
      <CapitalAiEmblem
        sizeClass={emblemSizeClasses}
        className="group-hover:scale-105 transition-transform duration-300"
      />
      <div className="flex flex-col">
        <span
          className={`${titleSizeClasses} font-display font-bold tracking-tight leading-none text-brand-primary`}
        >
          CAPITAL-AI
        </span>
        {showSubtitle && (
          <span
            className={`${subtitleSizeClasses} font-sans font-semibold text-text-secondary tracking-[0.22em] mt-1 uppercase`}
          >
            AI-DRIVEN MARKET INTELLIGENCE
          </span>
        )}
      </div>
    </div>
  );
};
