import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const read = (relative: string) => fs.readFileSync(path.join(repoRoot, relative), 'utf8');

describe('ADR-0014 Phase 3.3 AI analysis route extraction', () => {
  it('fails closed for market sentiment without verified news evidence', () => {
    const source = read('server/routes/marketSentimentRoutes.ts');
    expect(source).toContain("router.get('/market-sentiment'");
    expect(source).toContain('VERIFIED_NEWS_EVIDENCE_UNAVAILABLE');
    expect(source).not.toContain('googleSearch');
    expect(source).not.toContain('gemini');
  });

  it('keeps shock simulation on the Anthropic -> OpenAI chain', () => {
    const source = read('server/routes/marketSentimentRoutes.ts');
    expect(source).toContain("router.post('/market-sentiment/simulate-shock'");
    expect(source).toContain('anthropic,');
    expect(source).toContain('openai,');
    expect(source).toContain("promptId: 'server-market-sentiment-shock'");
    expect(source).not.toContain('gemini:');
  });

  it('keeps portfolio review on the active structured provider chain', () => {
    const source = read('server/routes/portfolioReviewRoutes.ts');
    expect(source).toContain("router.post('/portfolio-review'");
    expect(source).toContain("promptId: 'server-portfolio-review'");
    expect(source).toContain('generateStructuredWithFallback');
    expect(source).toContain('anthropic,');
    expect(source).toContain('openai,');
    expect(source).not.toContain('gemini');
  });

  it('does not pull startup, Stripe ingress or runtime-secret validation into AI route modules', () => {
    for (const relative of ['server/routes/marketSentimentRoutes.ts', 'server/routes/portfolioReviewRoutes.ts']) {
      const source = read(relative);
      expect(source).not.toContain('validateRuntimeSecrets');
      expect(source).not.toContain('STRIPE_WEBHOOK_SECRET');
      expect(source).not.toContain("app.listen(");
    }
  });
});
