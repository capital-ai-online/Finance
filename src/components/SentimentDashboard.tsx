import React from 'react';

const LazySentimentDashboard = React.lazy(async () => {
  const { SentimentDashboard } = await import('./SentimentDashboardImpl');
  return { default: SentimentDashboard };
});

export function SentimentDashboard() {
  return (
    <React.Suspense
      fallback={(
        <div className="ui-panel text-xs text-white/60" role="status" aria-live="polite">
          Sentiment-Cockpit wird geladen…
        </div>
      )}
    >
      <LazySentimentDashboard />
    </React.Suspense>
  );
}
