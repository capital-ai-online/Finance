import React, { type ReactNode } from 'react';
import clsx from 'clsx';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <section className={clsx('flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-6 text-center', className)}>
      {icon && <div className="mb-3 text-white/45" aria-hidden="true">{icon}</div>}
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description && <p className="mt-2 max-w-lg text-sm text-white/50">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}

export default EmptyState;
