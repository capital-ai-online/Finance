import { getGeminiInstance, isGeminiConfigured } from '../../../../server/ai';
import { getAnthropicInstance, isAnthropicConfigured } from '../../../../server/anthropicClient';
import { getOpenAIInstance, isOpenAIConfigured } from '../../../../server/openaiClient';

export interface AiProviders {
  ai: any | null;
  anthropic: any | null;
  openai: any | null;
}

export function createAiProviders(): AiProviders {
  let ai: any = null;
  let anthropic: any = null;
  let openai: any = null;

  try {
    if (isGeminiConfigured()) ai = getGeminiInstance();
  } catch (error) {
    console.warn('Failed to retrieve Gemini instance on boot:', error);
  }

  try {
    if (isAnthropicConfigured()) anthropic = getAnthropicInstance();
  } catch (error) {
    console.warn('Failed to retrieve Anthropic instance on boot:', error);
  }

  try {
    if (isOpenAIConfigured()) openai = getOpenAIInstance();
  } catch (error) {
    console.warn('Failed to retrieve OpenAI instance on boot:', error);
  }

  return { ai, anthropic, openai };
}
