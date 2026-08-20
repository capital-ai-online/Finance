import React, { useId, type ReactNode } from 'react';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  const id = useId();
  return (
    <span className="group relative inline-flex" tabIndex={0} aria-describedby={id}>
      {children}
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-neutral-900 px-2 py-1 text-xs text-white/80 shadow-lg group-hover:block group-focus:block group-focus-within:block"
      >
        {content}
      </span>
    </span>
  );
}

export default Tooltip;
