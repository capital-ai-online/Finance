import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('ARCH-AUDIT-0004 enterprise hardening', () => {
  it('removes fabricated runtime latency telemetry', () => {
    const code = source('src/components/SystemLatencyMonitor.tsx');
    expect(code).not.toContain('Math.random');
    expect(code).toContain('/api/orchestrator/stats');
    expect(code).toContain('keine simulierten Latenzen');
  });

  it('uses measured runtime evidence in PerformanceDashboard', () => {
    const code = source('src/components/PerformanceDashboard.tsx');
    expect(code).not.toContain('Math.random');
    expect(code).not.toContain('isSimulatingLoad');
    expect(code).toContain('/api/orchestrator/stats');
    expect(code).toContain('keine Demo-, Seed- oder Random-Metriken');
  });

  it('removes fabricated market metrics and headlines from the canonical Newsticker', () => {
    const code = source('src/features/news/ui/Newsticker.tsx');
    expect(code).not.toContain('Math.random');
    expect(code).not.toContain('regAsset.price');
    expect(code).toContain('/verified-context');
    expect(code).toContain('/verified-quote');
    expect(code).toContain('keine synthetischen Kurs-, Volumen- oder Momentumwerte');
  });

  it('declares every active external market-data key as Dashboard-managed Render env vars', () => {
    const manifest = source('render.yaml');
    expect(manifest).not.toContain('secretFiles:');
    expect(manifest).not.toContain('finance-secrets.env');
    for (const key of ['COIN_API_KEY', 'TWELVEDATA_API_KEY', 'EODHD_API_KEY', 'FRED_API_KEY']) {
      expect(manifest).toContain(`- key: ${key}`);
    }
    expect(manifest).not.toMatch(/COIN_API_KEY:\s*\S+/);
    expect(manifest).not.toMatch(/TWELVEDATA_API_KEY:\s*\S+/);
    expect(manifest).not.toMatch(/EODHD_API_KEY:\s*\S+/);
    expect(manifest).not.toMatch(/FRED_API_KEY:\s*\S+/);

    const secretManifest = source('scripts/security/secretFileManifest.ts');
    expect(secretManifest).toContain('SERVER_SECRET_ENV_KEYS');
    for (const key of ['COIN_API_KEY', 'TWELVEDATA_API_KEY', 'EODHD_API_KEY', 'FRED_API_KEY']) {
      expect(secretManifest).toContain(`'${key}'`);
    }
  });

  it('keeps ADR-0020/0021 canonical and moves social-media decisions to 0026/0027', () => {
    expect(fs.existsSync(path.join(root, 'docs/adr/ADR-0020-multi-provider-market-data-routing.md'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'docs/adr/ADR-0021-external-market-data-provider-activation.md'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'docs/adr/ADR-0026-social-media-direct-publishing-real-integration.md'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'docs/adr/ADR-0027-social-media-access-restriction-owner-founder.md'))).toBe(true);
    expect(fs.existsSync(path.join(root, 'docs/adr/ADR-0020-social-media-direct-publishing-real-integration.md'))).toBe(false);
    expect(fs.existsSync(path.join(root, 'docs/adr/ADR-0021-social-media-access-restriction-owner-founder.md'))).toBe(false);
  });
});
