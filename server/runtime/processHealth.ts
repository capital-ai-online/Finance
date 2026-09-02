export type FatalProcessSource = 'unhandledRejection' | 'uncaughtException';

export interface ProcessHealthSnapshot {
  healthy: boolean;
  fatalSource: FatalProcessSource | null;
  fatalObservedAt: string | null;
}

let fatalState: { source: FatalProcessSource; observedAt: string } | null = null;

export function markProcessFatal(
  source: FatalProcessSource,
  observedAt = new Date().toISOString(),
): ProcessHealthSnapshot {
  if (!fatalState) fatalState = { source, observedAt };
  return getProcessHealthSnapshot();
}

export function getProcessHealthSnapshot(): ProcessHealthSnapshot {
  if (!fatalState) {
    return { healthy: true, fatalSource: null, fatalObservedAt: null };
  }
  return {
    healthy: false,
    fatalSource: fatalState.source,
    fatalObservedAt: fatalState.observedAt,
  };
}

export function resetProcessHealthForTests(): void {
  fatalState = null;
}
