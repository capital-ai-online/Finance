import { Router } from 'express';
import { isSupabaseConfigured } from '../db';
import { isAnthropicConfigured } from '../anthropicClient';
import { isOpenAIConfigured } from '../openaiClient';
import {
  getProcessHealthSnapshot,
  type ProcessHealthSnapshot,
} from '../runtime/processHealth';

export interface ProcessLivenessSnapshot {
  status: 'ok' | 'unhealthy';
  healthy: boolean;
  timestamp: string;
  uptimeSeconds: number;
  configured: {
    supabase: boolean;
    anthropic: boolean;
    openai: boolean;
  };
  fatal: {
    source: ProcessHealthSnapshot['fatalSource'];
    observedAt: string | null;
  } | null;
}

interface ProcessLivenessInputs {
  now?: Date;
  uptimeSeconds?: number;
  processHealth?: ProcessHealthSnapshot;
  configured?: ProcessLivenessSnapshot['configured'];
}

/**
 * Builds the network-independent process liveness projection.
 *
 * External providers are deliberately not called here. Render needs to decide
 * whether this process can continue serving traffic, not whether every business
 * dependency is currently available. Business dependency health remains /readyz.
 */
export function buildProcessLivenessSnapshot(
  inputs: ProcessLivenessInputs = {},
): ProcessLivenessSnapshot {
  const processHealth = inputs.processHealth ?? getProcessHealthSnapshot();
  const configured = inputs.configured ?? {
    supabase: isSupabaseConfigured(),
    anthropic: isAnthropicConfigured(),
    openai: isOpenAIConfigured(),
  };

  return {
    status: processHealth.healthy ? 'ok' : 'unhealthy',
    healthy: processHealth.healthy,
    timestamp: (inputs.now ?? new Date()).toISOString(),
    uptimeSeconds: inputs.uptimeSeconds ?? Math.floor(process.uptime()),
    configured,
    fatal: processHealth.healthy
      ? null
      : {
          source: processHealth.fatalSource,
          observedAt: processHealth.fatalObservedAt,
        },
  };
}

/**
 * Canonical Render/process liveness endpoint.
 *
 * Fatal process state returns 503 so the already-installed process lifecycle and
 * Render restart semantics converge on the same observed state. No third-party
 * network call or secret material is allowed in this route.
 */
export function createHealthRouter(): Router {
  const router = Router();

  router.get('/healthz', (_req, res) => {
    const snapshot = buildProcessLivenessSnapshot();
    res.status(snapshot.healthy ? 200 : 503).json(snapshot);
  });

  return router;
}
