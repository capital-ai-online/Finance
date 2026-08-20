import React from 'react';
import clsx from 'clsx';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const roundedClasses = {
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const;

export function Skeleton({ className, rounded = 'md', ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={clsx('animate-pulse bg-white/10 motion-reduce:animate-none', roundedClasses[rounded], className)}
      {...props}
    />
  );
}

export default Skeleton;
