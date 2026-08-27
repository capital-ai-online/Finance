import { useCallback, useEffect, useRef, useState } from 'react';
import {
  OrchestratorApiError,
  fetchModelIntegrationStatus,
  fetchOrchestratorStats,
  type ModelIntegrationStatus,
  type OrchestratorStats,
} from './orchestratorApi';
import {
  describeRefusal,
  getOrchestratorPollDelayMs,
  isAbortError,
  isRefusalStatus,
} from '../../../../lib/orchestratorPollPolicy';

export type OrchestratorFreshness = 'loading' | 'fresh' | 'stale' | 'paused' | 'refused';

type FetchMode = 'initial' | 'auto' | 'manual' | 'visible';

export interface OrchestratorTelemetryLifecycle {
  stats: OrchestratorStats | null;
  loading: boolean;
  error: string | null;
  refusal: string | null;
  isRefreshing: boolean;
  freshness: OrchestratorFreshness;
  lastUpdatedAt: number | null;
  nextPollDelayMs: number | null;
  modelStatuses: ModelIntegrationStatus[];
  modelError: string | null;
  isLoadingModels: boolean;
  refreshStats: () => Promise<void>;
  refreshModelStatus: () => Promise<void>;
  applyStatsSnapshot: (stats: OrchestratorStats) => void;
}

export function useOrchestratorTelemetry(): OrchestratorTelemetryLifecycle {
  const [stats, setStats] = useState<OrchestratorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [freshness, setFreshness] = useState<OrchestratorFreshness>('loading');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [nextPollDelayMs, setNextPollDelayMs] = useState<number | null>(null);

  const [modelStatuses, setModelStatuses] = useState<ModelIntegrationStatus[]>([]);
  const [modelError, setModelError] = useState<string | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  const mountedRef = useRef(false);
  const hiddenRef = useRef(false);
  const refusalActiveRef = useRef(false);
  const hasSuccessfulStatsRef = useRef(false);
  const consecutiveFailuresRef = useRef(0);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsAbortRef = useRef<AbortController | null>(null);
  const modelAbortRef = useRef<AbortController | null>(null);
  const runStatsRef = useRef<(mode: FetchMode) => Promise<void>>(async () => undefined);
  const runModelsRef = useRef<() => Promise<void>>(async () => undefined);
  const scheduleNextRef = useRef<() => void>(() => undefined);

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current !== null) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (mountedRef.current) setNextPollDelayMs(null);
  }, []);

  const blockOnRefusal = useCallback((status: number) => {
    refusalActiveRef.current = true;
    clearPollTimer();
    statsAbortRef.current?.abort();
    modelAbortRef.current?.abort();
    setRefusal(describeRefusal(status));
    setError(null);
    setModelError(null);
    setFreshness('refused');
  }, [clearPollTimer]);

  const scheduleNext = useCallback(() => {
    clearPollTimer();
    if (!mountedRef.current || hiddenRef.current || refusalActiveRef.current) return;

    const delay = getOrchestratorPollDelayMs(consecutiveFailuresRef.current);
    setNextPollDelayMs(delay);
    pollTimerRef.current = setTimeout(() => {
      pollTimerRef.current = null;
      if (mountedRef.current) setNextPollDelayMs(null);
      void runStatsRef.current('auto');
    }, delay);
  }, [clearPollTimer]);
  scheduleNextRef.current = scheduleNext;

  const runStats = useCallback(async (mode: FetchMode) => {
    if (!mountedRef.current) return;
    if (hiddenRef.current && mode !== 'manual') return;

    const activeRequest = statsAbortRef.current;
    if (activeRequest) {
      if (mode === 'auto') return;
      activeRequest.abort();
    }

    clearPollTimer();
    const controller = new AbortController();
    statsAbortRef.current = controller;

    if (mode === 'manual') setIsRefreshing(true);
    if (mode === 'visible' && hasSuccessfulStatsRef.current) setFreshness('stale');

    try {
      const nextStats = await fetchOrchestratorStats(controller.signal);
      if (!mountedRef.current || controller.signal.aborted) return;

      setStats(nextStats);
      hasSuccessfulStatsRef.current = true;
      consecutiveFailuresRef.current = 0;
      refusalActiveRef.current = false;
      setRefusal(null);
      setError(null);
      setFreshness('fresh');
      setLastUpdatedAt(Date.now());
    } catch (err) {
      if (isAbortError(err) || controller.signal.aborted || !mountedRef.current) return;

      if (err instanceof OrchestratorApiError && isRefusalStatus(err.status)) {
        blockOnRefusal(err.status);
        return;
      }

      consecutiveFailuresRef.current += 1;
      setError(err instanceof Error ? err.message : 'Server-Verbindungsfehler.');
      setFreshness('stale');
    } finally {
      if (statsAbortRef.current === controller) {
        statsAbortRef.current = null;
        if (mountedRef.current) {
          setLoading(false);
          if (mode === 'manual') setIsRefreshing(false);
          scheduleNextRef.current();
        }
      }
    }
  }, [blockOnRefusal, clearPollTimer]);
  runStatsRef.current = runStats;

  const runModels = useCallback(async () => {
    if (!mountedRef.current || hiddenRef.current) return;

    modelAbortRef.current?.abort();
    const controller = new AbortController();
    modelAbortRef.current = controller;
    setIsLoadingModels(true);

    try {
      const models = await fetchModelIntegrationStatus(controller.signal);
      if (!mountedRef.current || controller.signal.aborted) return;
      setModelStatuses(models);
      setModelError(null);
    } catch (err) {
      if (isAbortError(err) || controller.signal.aborted || !mountedRef.current) return;

      if (err instanceof OrchestratorApiError && isRefusalStatus(err.status)) {
        blockOnRefusal(err.status);
        return;
      }

      setModelError(err instanceof Error ? err.message : 'Modell-Integrationsstatus konnte nicht geladen werden.');
    } finally {
      if (modelAbortRef.current === controller) {
        modelAbortRef.current = null;
        if (mountedRef.current) setIsLoadingModels(false);
      }
    }
  }, [blockOnRefusal]);
  runModelsRef.current = runModels;

  useEffect(() => {
    mountedRef.current = true;
    hiddenRef.current = typeof document !== 'undefined' && document.visibilityState === 'hidden';

    const handleVisibilityChange = () => {
      hiddenRef.current = document.visibilityState === 'hidden';

      if (hiddenRef.current) {
        clearPollTimer();
        statsAbortRef.current?.abort();
        modelAbortRef.current?.abort();
        if (!refusalActiveRef.current) setFreshness('paused');
        return;
      }

      if (!refusalActiveRef.current) {
        setFreshness(hasSuccessfulStatsRef.current ? 'stale' : 'loading');
        void runStatsRef.current('visible');
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    if (hiddenRef.current) {
      setFreshness('paused');
    } else {
      void runStatsRef.current('initial');
      void runModelsRef.current();
    }

    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current !== null) {
        clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
      statsAbortRef.current?.abort();
      modelAbortRef.current?.abort();
      statsAbortRef.current = null;
      modelAbortRef.current = null;
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [clearPollTimer]);

  const refreshStats = useCallback(async () => {
    refusalActiveRef.current = false;
    setRefusal(null);
    await runStatsRef.current('manual');
  }, []);

  const refreshModelStatus = useCallback(async () => {
    await runModelsRef.current();
  }, []);

  const applyStatsSnapshot = useCallback((nextStats: OrchestratorStats) => {
    setStats(nextStats);
    hasSuccessfulStatsRef.current = true;
    consecutiveFailuresRef.current = 0;
    setError(null);
    setFreshness('fresh');
    setLastUpdatedAt(Date.now());
  }, []);

  return {
    stats,
    loading,
    error,
    refusal,
    isRefreshing,
    freshness,
    lastUpdatedAt,
    nextPollDelayMs,
    modelStatuses,
    modelError,
    isLoadingModels,
    refreshStats,
    refreshModelStatus,
    applyStatsSnapshot,
  };
}
