import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = process.cwd();
const composerPath = path.join(repoRoot, 'server/routes/registerApplicationRoutes.ts');
const applicationPath = path.join(repoRoot, 'server.application.ts');

const expectedMounts = [
  "app.use('/api/raw-materials', createRawMaterialsRouter(ai, anthropic, openai));",
  "app.use('/api/crypto', createCryptoRouter(ai, anthropic, openai));",
  "app.use('/api/stripe', stripeReturnUrlGuard, stripeRouter);",
  "app.use('/api/orchestrator', orchestratorRouter);",
  "app.use('/api/admin/hygiene', hygieneRouter);",
  "app.use('/api/admin', systemEventsRouter);",
  "app.use('/api/admin', versionManagerRouter);",
  "app.use('/api/auth', stepUpRouter);",
  "app.use('/api/privacy', privacyRouter);",
  "app.use('/api/compliance', complianceRouter);",
  "app.use('/api/scoring', scoreValidationRouter);",
  "app.use('/api/scoring/explain', createScoreExplainabilityRouter(ai, anthropic, openai));",
  "app.use('/api/admin/diagnostics', adminDiagnosticsRouter);",
  "app.use('/api/alerts', alertsRouter);",
  "app.use('/api/admin/supervisor', supervisorRouter);",
  "app.use('/api/admin/agent-evaluation', createAgentEvaluationRouter(ai, anthropic, openai));",
  "app.use('/api/internal/systemadmin-execution', systemadminExecutionBrokerRouter);",
  "app.use('/api/news', newsRouter);",
  "app.use('/api/registry', registryRouter);",
  "app.use('/api/social-media', socialMediaRouter);",
  "app.use('/api', aiRouter);",
] as const;

describe('ADR-0014 application route composition contract', () => {
  it('keeps the canonical composer aligned with the current production route mounts', () => {
    const composer = fs.readFileSync(composerPath, 'utf8');
    const application = fs.readFileSync(applicationPath, 'utf8');

    expect(composer).toContain("import { stripeReturnUrlGuard } from '../middleware/stripeReturnUrlGuard';");

    for (const mount of expectedMounts) {
      expect(composer).toContain(mount);
      // Until the explicit cutover commit lands, the compatibility module remains the
      // production evidence source. This assertion prevents the two route maps from
      // drifting while parallel roadmap work is active.
      if (!application.includes('registerApplicationRoutes(app,')) {
        expect(application).toContain(mount);
      }
    }
  });

  it('keeps route composition free of Stripe raw-body and global middleware ownership', () => {
    const composer = fs.readFileSync(composerPath, 'utf8');
    expect(composer).not.toContain('express.raw(');
    expect(composer).not.toContain('express.json(');
    expect(composer).not.toContain("app.post('/api/stripe/webhook'");
    expect(composer).not.toContain('checkRateLimit(');
    expect(composer).not.toContain('validateRuntimeSecrets(');
  });
});
