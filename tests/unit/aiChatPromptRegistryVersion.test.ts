import { describe, expect, it } from 'vitest';
import { PROMPT_REGISTRY } from '../../src/services/aiUsageTracker';

describe('AI chat prompt registry version', () => {
  it('versions the hardened trust-boundary prompt contract', () => {
    expect(PROMPT_REGISTRY['chat-assistant']?.version).toBe('1.1.0');
  });
});
