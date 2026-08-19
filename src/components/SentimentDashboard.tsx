import React from 'react';

type SentimentDashboardProps = React.ComponentProps<(typeof import('./SentimentDashboardImpl'))['SentimentDashboard']>;

const LazySentimentDashboard = React.lazy(async () => {
  const { SentimentDashboard } = await import('./SentimentDashboardImpl');
  return { default: SentimentDashboard };
});

export function SentimentDashboard(props: SentimentDashboardProps) {
  return (
    <React.Suspense
      fallback={(
        <div className="ui-panel text-xs text-white/60" role="status" aria-live="polite">
          Sentiment-Cockpit wird geladen…
        </div>
      )}
    >
      <LazySentimentDashboard {...props} />
    </React.Suspense>
  );
}
