import express from 'express';
import { getCleanEnv } from '../../../server/env';
import { isSupabaseConfigured } from '../../../server/db';
import { isGeminiConfigured } from '../../../server/ai';
import { isAnthropicConfigured } from '../../../server/anthropicClient';
import { isOpenAIConfigured } from '../../../server/openaiClient';
import { renderMetrics } from '../../../server/metrics';

export function createSystemRouter(): express.Router {
  const router = express.Router();

  router.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      environment: getCleanEnv('NODE_ENV') || 'development',
      dependencies: {
        supabase: isSupabaseConfigured(),
        gemini: isGeminiConfigured(),
        anthropic: isAnthropicConfigured(),
        openai: isOpenAIConfigured(),
      },
    });
  });

  router.get('/metrics', (_req, res) => {
    res.type('text/plain; version=0.0.4').send(renderMetrics());
  });

  return router;
}
