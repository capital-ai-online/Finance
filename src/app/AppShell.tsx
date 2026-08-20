import React, { type ReactNode } from 'react';
import clsx from 'clsx';

export interface AppShellProps {
  header?: ReactNode;
  navigation?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function AppShell({ header, navigation, children, className, contentClassName }: AppShellProps) {
  return (
    <div className={clsx('min-h-screen bg-background text-foreground', className)}>
      {header}
      <div className="flex min-h-0 flex-1">
        {navigation}
        <main id="main-content" className={clsx('min-w-0 flex-1', contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
