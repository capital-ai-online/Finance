import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SupervisorDashboard governance projection', () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), 'src/components/SupervisorDashboard.tsx'),
    'utf8',
  );

  it('does not render synthetic infrastructure or operational evidence', () => {
    const forbidden = [
      '99.8% Perfect',
      'Cloud Run',
      'Firestore',
      '1204',
      '9e32a8f8d66',
      'Simulated live alert',
      'capital-ai-prod:0.7.0',
      'gcp-europe-west2',
      'Gemini 2.5 Flash',
      '150,00 €',
    ];
    for (const token of forbidden) expect(source).not.toContain(token);
  });

  it('does not expose retired runtime agent mutation routes', () => {
    expect(source).not.toContain('/api/admin/agents/register');
    expect(source).not.toContain('/api/admin/agents/toggle');
    expect(source).not.toContain('handleRegisterAgent');
    expect(source).not.toContain('handleToggleAgent');
  });

  it('states the read-only and no-demo-data boundary explicitly', () => {
    expect(source).toContain('Read-only Operational Projection');
    expect(source).toContain('no synthetic infrastructure metrics');
    expect(source).toContain('nicht instrumentiert');
    expect(source).toContain('Manuelle Runtime-Toggles und Runtime-Registrierung sind absichtlich nicht verfügbar');
  });
});
