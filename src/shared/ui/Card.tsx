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
      className={clsx('ui-panel', elevated && 'ui-panel--elevated', className)}
      {...props}
    />
  );
});

export default Card;
