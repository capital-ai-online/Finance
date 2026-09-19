import { Router } from 'express';
import { isSupabaseConfigured } from '../db';
import { isAnthropicConfigured } from '../anthropicClient';
import { isOpenAIConfigured } from '../openaiClient';

/**
 * Network-independent process health endpoint for Render and local probes.
 *
 * This route intentionally reports configuration presence only. It must not call
 * Supabase or any AI/market-data provider because deployment health must remain
 * independent from third-party availability and must never expose secret material.
 */
export function createHealthRouter(): Router {
  const router = Router();

  router.get('/healthz', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      configured: {
        supabase: isSupabaseConfigured(),
        anthropic: isAnthropicConfigured(),
        openai: isOpenAIConfigured(),
      },
    });
  });

  return router;
}
