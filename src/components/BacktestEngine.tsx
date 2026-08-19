import React from 'react';

type BacktestEngineProps = React.ComponentProps<(typeof import('./BacktestEngineImpl'))['BacktestEngine']>;

const LazyBacktestEngine = React.lazy(async () => {
  const { BacktestEngine } = await import('./BacktestEngineImpl');
  return { default: BacktestEngine };
});

export function BacktestEngine(props: BacktestEngineProps) {
  return (
    <React.Suspense
      fallback={(
        <div className="ui-panel text-xs text-white/60" role="status" aria-live="polite">
          Backtest-Modul wird geladen…
        </div>
      )}
    >
      <LazyBacktestEngine {...props} />
    </React.Suspense>
  );
}
