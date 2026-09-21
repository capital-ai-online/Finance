import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (repoPath: string) => fs.readFileSync(path.join(process.cwd(), repoPath), 'utf8');

const app = read('src/app/App.tsx');
const globalBoundary = read('src/app/reliability/FrontendReliabilityBoundary.tsx');
const degradedMode = read('src/app/reliability/frontendDegradedMode.ts');
const featureBoundary = read('src/shared/ui/FeatureRecoveryBoundary.tsx');
const routes = read('src/app/routing/AppRoutes.tsx');
const publicWorkbench = read('src/app/public/PublicAnalysisWorkbench.tsx');

describe('SH-02.6 frontend reliability composition', () => {
  it('composes one global presentation-only reliability boundary', () => {
    expect(app).toContain("import { FrontendReliabilityBoundary } from './reliability/FrontendReliabilityBoundary'");
    expect(app).toContain('<FrontendReliabilityBoundary>');
    expect(app).toContain('</FrontendReliabilityBoundary>');
    expect(globalBoundary).toContain("fetchWithBoundedFrontendRetry('/healthz'");
    expect(globalBoundary).toContain("cache: 'no-store'");
    expect(globalBoundary).toContain("credentials: 'same-origin'");
  });

  it('uses event-driven recovery rather than interval polling', () => {
    for (const eventName of ['online', 'offline', 'focus', 'visibilitychange']) {
      expect(globalBoundary).toContain(eventName);
    }
    expect(globalBoundary).not.toContain('setInterval');
    expect(globalBoundary).not.toContain('setTimeout');
  });

  it('preserves auth/session persistence during deployment-skew recovery', () => {
    expect(globalBoundary).toContain('window.sessionStorage');
    expect(globalBoundary).toContain('window.location.reload()');
    expect(globalBoundary).not.toContain('localStorage');
    expect(globalBoundary).not.toContain('supabase');
    expect(globalBoundary).not.toContain('.clear()');
    expect(globalBoundary).not.toContain('removeItem(');
  });

  it('keeps generic mutation retry and stale financial fallbacks fail-closed', () => {
    expect(degradedMode).toContain("return method === 'GET' || method === 'HEAD'");
    expect(degradedMode).toContain("if (!policy.allowStale) return { state: 'DENIED' }");
    expect(degradedMode).not.toContain("method === 'POST'");
    expect(degradedMode).not.toContain('CanonicalScoreResult');
  });

  it('keeps reusable feature-local recovery available without coupling it into the LF-01 root', () => {
    expect(featureBoundary).toContain('generation: state.generation + 1');
    expect(featureBoundary).toContain('Andere Funktionen und Ihre bestehende Sitzung bleiben erhalten.');
    expect(featureBoundary).not.toContain('error.message');

    expect(routes).not.toContain('<FeatureRecoveryBoundary');
    expect(routes).not.toContain('name="Öffentliche Analyse-Workbench"');
    expect(routes).not.toContain('PublicAnalysisWorkbench');
    expect(publicWorkbench).toContain('<FeatureRecoveryBoundary key={activeTool} name={activeDefinition.label}>');
    expect(publicWorkbench).not.toContain('class PublicToolErrorBoundary');
    expect(routes).not.toContain('class PublicPreviewErrorBoundary');
  });

  it('announces connectivity degradation accessibly without inventing business state', () => {
    expect(globalBoundary).toContain('role="status"');
    expect(globalBoundary).toContain('aria-live="polite"');
    expect(globalBoundary).toContain("data-frontend-connectivity={state}");
    expect(globalBoundary).not.toContain('score');
    expect(globalBoundary).not.toContain('ranking');
  });
});
