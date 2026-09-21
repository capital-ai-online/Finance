import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('FRONTEND upstream presentation sync contract', () => {
  const root = process.cwd();
  const config = JSON.parse(
    fs.readFileSync(path.join(root, '.github/frontend-upstream-sync.json'), 'utf8'),
  );
  const workflow = fs.readFileSync(
    path.join(root, '.github/workflows/frontend-upstream-presentation-sync.yml'),
    'utf8',
  );
  const syncScript = fs.readFileSync(
    path.join(root, 'scripts/frontend/syncFrontendPresentationSource.mjs'),
    'utf8',
  );

  it('binds to the public FRONTEND repository but keeps the generated mirror outside runtime src', () => {
    expect(config.source.repository).toBe('SvenKulessa/FRONTEND');
    expect(config.source.ref).toBe('main');
    expect(config.destination.startsWith('src/')).toBe(false);
    expect(config.runtimePromotion.automatic).toBe(false);
    expect(config.runtimePromotion.destinationUnderSrcAllowed).toBe(false);
  });

  it('allows presentation surfaces and excludes productive/domain source classes', () => {
    expect(config.allowedExactPaths).toContain('src/App.tsx');
    expect(config.allowedExactPaths).toContain('src/index.css');
    expect(config.allowedPathPatterns.join('\n')).toContain('src/components');
    expect(config.allowedPathPatterns.join('\n')).toContain('/ui/');
    const denied = config.neverCopyPathPatterns.join('\n');
    expect(denied).toContain('data');
    expect(denied).toContain('api');
    expect(denied).toContain('server');
    expect(denied).toContain('auth');
    expect(denied).toContain('billing');
    expect(denied).toContain('scoring');
    expect(denied).toContain('entitlement');
    expect(denied).toContain('package');
  });

  it('runs hourly from trusted main, with least privilege and immutable actions', () => {
    expect(workflow).toContain("cron: '23 * * * *'");
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain('contents: write');
    expect(workflow).toContain('pull-requests: write');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('actions/checkout@08c6903cd8c0fde910a37f88322edcfb5dd907a8');
    expect(workflow).toContain('actions/setup-node@a0853c24544627f65ddf259abe73b1d18a591444');
    expect(workflow).not.toContain('npm install');
    expect(workflow).not.toContain('npm run');
  });

  it('never executes upstream code and marks risky presentation dependencies as adapter-blocked', () => {
    expect(syncScript).toContain('lstatSync');
    expect(syncScript).toContain('isSymbolicLink');
    expect(syncScript).toContain('runtimePromotionEligible');
    expect(syncScript).toContain('promotionBlockPatterns');
    expect(syncScript).not.toContain('execFileSync(source');
  });
});
