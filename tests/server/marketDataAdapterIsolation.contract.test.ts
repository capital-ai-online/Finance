import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const alpha = fs.readFileSync(path.join(process.cwd(), 'server/routes/alphaVantageRoutes.ts'), 'utf8');
const composer = fs.readFileSync(path.join(process.cwd(), 'server/routes/registerMarketDataAdapters.ts'), 'utf8');

for (const [name, source] of [['alphaVantageRoutes', alpha], ['registerMarketDataAdapters', composer]] as const) {
  describe(`${name} architecture isolation`, () => {
    it('does not own runtime startup or deployment concerns', () => {
      expect(source).not.toContain('listen(');
      expect(source).not.toContain('NODE_OPTIONS');
      expect(source).not.toContain('runtimeArtifactGuard');
      expect(source).not.toContain('validateRuntimeSecrets');
    });

    it('does not own billing or scoring boundaries', () => {
      expect(source).not.toContain('handleWebhookEvent');
      expect(source).not.toContain('STRIPE_WEBHOOK_SECRET');
      expect(source).not.toContain('CryptoScoringService');
      expect(source).not.toContain('MemeCoinScoringService');
    });
  });
}
