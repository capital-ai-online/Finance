import type Anthropic from '@anthropic-ai/sdk';
import type OpenAI from 'openai';
import { getAnthropicInstance, isAnthropicConfigured } from '../anthropicClient';
import { getOpenAIInstance, isOpenAIConfigured } from '../openaiClient';

export interface AiProviderSet {
  anthropic: Anthropic | null;
  openai: OpenAI | null;
}

export interface ProviderBootstrapLogger {
  warn(message: string, meta?: Record<string, unknown>): void;
}

function safeProvider<T>(
  configured: () => boolean,
  factory: () => T,
  provider: string,
  logger: ProviderBootstrapLogger,
): T | null {
  try {
    return configured() ? factory() : null;
  } catch (error) {
    logger.warn('AI provider bootstrap failed', {
      provider,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Creates the optional AI provider set once for the server composition root.
 * Provider absence remains fail-open for routes that support deterministic fallbacks.
 */
export function initializeAiProviders(logger: ProviderBootstrapLogger): AiProviderSet {
  return {
    anthropic: safeProvider(isAnthropicConfigured, getAnthropicInstance, 'anthropic', logger),
    openai: safeProvider(isOpenAIConfigured, getOpenAIInstance, 'openai', logger),
  };
}
