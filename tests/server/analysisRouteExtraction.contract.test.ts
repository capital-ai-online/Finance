import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(repoRoot, relative), 'utf8');

describe('ADR-0014 Phase 3.3 AI analysis route extraction', () => {
  it('keeps grounded market sentiment Gemini-specific', () => {
    const source = read('server/routes/marketSentimentRoutes.ts');
    expect(source).toContain("router.get('/market-sentiment'");
    expect(source).toContain("tools: [{ googleSearch: {} }]");
    expect(source).toContain("promptId: 'server-market-sentiment'");
  });

  it('keeps shock simulation on the Anthropic -> OpenAI -> Gemini fallback chain', () => {
    const source = read('server/routes/marketSentimentRoutes.ts');
    expect(source).toContain("router.post('/market-sentiment/simulate-shock'");
    expect(source).toContain('anthropic,');
    expect(source).toContain('openai,');
    expect(source).toContain('gemini: ai');
    expect(source).toContain("promptId: 'server-market-sentiment-shock'");
  });

  it('keeps portfolio review on the same structured provider fallback chain', () => {
    const source = read('server/routes/portfolioReviewRoutes.ts');
    expect(source).toContain("router.post('/portfolio-review'");
    expect(source).toContain("promptId: 'server-portfolio-review'");
    expect(source).toContain("geminiModels: ['gemini-2.5-flash']");
    expect(source).toContain('generateStructuredWithFallback');
  });

  it('does not pull startup, Stripe ingress or runtime-secret validation into AI route modules', () => {
    for (const relative of [
      'server/routes/marketSentimentRoutes.ts',
      'server/routes/portfolioReviewRoutes.ts',
    ]) {
      const source = read(relative);
      expect(source).not.toContain('validateRuntimeSecrets');
      expect(source).not.toContain('STRIPE_WEBHOOK_SECRET');
      expect(source).not.toContain("app.listen(");
    }
  });
});
