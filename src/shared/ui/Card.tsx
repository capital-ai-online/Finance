import React from 'react';
import clsx from 'clsx';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { className, elevated = false, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx(
        'rounded-xl border border-white/10 bg-neutral-950/40 p-6 backdrop-blur-md',
        elevated && 'bg-neutral-900/85 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]',
        className,
      )}
      {...props}
    />
  );
});

export default Card;
