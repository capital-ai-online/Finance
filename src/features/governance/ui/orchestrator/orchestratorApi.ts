import { authFetch } from '../../../../lib/authFetch';

export interface RequestLogEntry {
  id: string;
  ip: string;
  endpoint: string;
  timestamp: string;
  status: 'COMPLETED' | 'QUEUED' | 'REJECTED' | 'TIMED_OUT' | 'RUNNING';
  duration?: number;
}

export interface OrchestratorStats {
  activeRequests: number;
  queueSize: number;
  totalProcessed: number;
  totalRejected: number;
  rateLimitsHit: number;
  concurrencyLimit: number;
  maxQueueSize: number;
  rateLimitWindowMs: number;
  maxRequestsPerWindow: number;
  requestsLastMinute: number;
  recentLogs: RequestLogEntry[];
}

export interface ModelIntegrationStatus {
  id: string;
  name: string;
  task: string;
  configured: boolean;
  status: string;
  latency: number | null;
  cost?: string;
}

export interface OrchestratorConfigInput {
  concurrencyLimit: number;
  maxQueueSize: number;
  maxRequestsPerWindow: number;
}

interface ModelIntegrationResponse {
  models: ModelIntegrationStatus[];
}

interface StatsMutationResponse {
  success: boolean;
  stats: OrchestratorStats;
}

export class OrchestratorApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'OrchestratorApiError';
    this.status = status;
  }
}

async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  fallbackMessage: string,
): Promise<T> {
  const response = await authFetch(url, options);

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string };
    throw new OrchestratorApiError(payload.error || fallbackMessage, response.status);
  }

  return response.json() as Promise<T>;
}

export function fetchOrchestratorStats(signal?: AbortSignal): Promise<OrchestratorStats> {
  return requestJson<OrchestratorStats>(
    '/api/orchestrator/stats',
    { signal },
    'Fehler beim Laden der Orchestrator-Daten.',
  );
}

export async function fetchModelIntegrationStatus(signal?: AbortSignal): Promise<ModelIntegrationStatus[]> {
  const response = await requestJson<ModelIntegrationResponse>(
    '/api/orchestrator/ping-models',
    { signal },
    'Modell-Integrationsstatus konnte nicht geladen werden.',
  );
  return Array.isArray(response.models) ? response.models : [];
}

export function updateOrchestratorConfig(input: OrchestratorConfigInput): Promise<StatsMutationResponse> {
  return requestJson<StatsMutationResponse>(
    '/api/orchestrator/config',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    },
    'Konfiguration konnte nicht aktualisiert werden.',
  );
}

export function resetOrchestratorStats(): Promise<StatsMutationResponse> {
  return requestJson<StatsMutationResponse>(
    '/api/orchestrator/reset',
    { method: 'POST' },
    'Zurücksetzen fehlgeschlagen.',
  );
}
