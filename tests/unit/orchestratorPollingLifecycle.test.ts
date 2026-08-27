import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

describe('FO-05 orchestrator polling lifecycle wiring', () => {
  it('keeps the new polling authority in the governance feature slice', () => {
    const panel = readRepoFile('src/components/OrchestratorPanel.tsx');
    const hook = readRepoFile('src/features/governance/ui/orchestrator/useOrchestratorTelemetry.ts');

    expect(panel).toContain("from '../features/governance/ui/orchestrator/useOrchestratorTelemetry'");
    expect(panel).toContain('useOrchestratorTelemetry()');
    expect(hook).toContain('export function useOrchestratorTelemetry()');
  });

  it('uses single-flight timeout scheduling rather than overlapping intervals', () => {
    const hook = readRepoFile('src/features/governance/ui/orchestrator/useOrchestratorTelemetry.ts');

    expect(hook).not.toContain('setInterval(');
    expect(hook).toContain('pollTimerRef.current = setTimeout(() =>');
    expect(hook).toContain("if (activeRequest) {");
    expect(hook).toContain("if (mode === 'auto') return;");
    expect(hook).toContain('activeRequest.abort();');
  });

  it('cancels read requests on lifecycle transitions and unmount', () => {
    const hook = readRepoFile('src/features/governance/ui/orchestrator/useOrchestratorTelemetry.ts');
    const client = readRepoFile('src/features/governance/ui/orchestrator/orchestratorApi.ts');

    expect(hook.match(/new AbortController\(\)/g)).toHaveLength(2);
    expect(hook).toContain('statsAbortRef.current?.abort();');
    expect(hook).toContain('modelAbortRef.current?.abort();');
    expect(client).toContain('{ signal }');
    expect(client).toContain('const response = await authFetch(url, options)');
  });

  it('pauses background work while the document is hidden and refreshes on visibility return', () => {
    const hook = readRepoFile('src/features/governance/ui/orchestrator/useOrchestratorTelemetry.ts');

    expect(hook).toContain("document.addEventListener('visibilitychange', handleVisibilityChange)");
    expect(hook).toContain("document.removeEventListener('visibilitychange', handleVisibilityChange)");
    expect(hook).toContain("document.visibilityState === 'hidden'");
    expect(hook).toContain("setFreshness('paused')");
    expect(hook).toContain("runStatsRef.current('visible')");
  });

  it('exposes explicit freshness, last-success and bounded retry state to the operator', () => {
    const hook = readRepoFile('src/features/governance/ui/orchestrator/useOrchestratorTelemetry.ts');
    const panel = readRepoFile('src/components/OrchestratorPanel.tsx');

    expect(hook).toContain("export type OrchestratorFreshness = 'loading' | 'fresh' | 'stale' | 'paused' | 'refused'");
    expect(hook).toContain('setLastUpdatedAt(Date.now())');
    expect(hook).toContain('getOrchestratorPollDelayMs(consecutiveFailuresRef.current)');
    expect(panel).toContain('Lifecycle: {freshnessLabel}');
    expect(panel).toContain('letzter erfolgreicher Stand bleibt sichtbar; Retry läuft mit Backoff');
  });

  it('keeps configuration and reset writes on the same typed authenticated client', () => {
    const panel = readRepoFile('src/components/OrchestratorPanel.tsx');
    const client = readRepoFile('src/features/governance/ui/orchestrator/orchestratorApi.ts');

    expect(panel).toContain('updateOrchestratorConfig({');
    expect(panel).toContain('resetOrchestratorStats()');
    expect(client).toContain("'/api/orchestrator/config'");
    expect(client).toContain("'/api/orchestrator/reset'");
  });
});
