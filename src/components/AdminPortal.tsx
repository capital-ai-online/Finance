import React from 'react';

type AdminPortalProps = React.ComponentProps<(typeof import('./AdminPortalImpl'))['AdminPortal']>;

const LazyAdminPortal = React.lazy(async () => {
  const { AdminPortal } = await import('./AdminPortalImpl');
  return { default: AdminPortal };
});

export function AdminPortal(props: AdminPortalProps) {
  return (
    <React.Suspense
      fallback={(
        <div className="ui-panel text-xs text-white/60" role="status" aria-live="polite">
          Admin-Portal wird geladen…
        </div>
      )}
    >
      <LazyAdminPortal {...props} />
    </React.Suspense>
  );
}
