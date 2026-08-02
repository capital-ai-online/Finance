import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const source = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), 'utf8');

describe('ARCH-AUDIT-0004 audit-integrity regression gates', () => {
  it('does not persist simulated orchestrator audit records', () => {
    const code = source('server/orchestrator.ts');
    expect(code).toContain('SIMULATED_AUDIT_DISABLED');
    expect(code).toContain('status(410)');
    expect(code).not.toContain('data_quality_score: dataQualityScore || 98');
    expect(code).not.toContain('final_score: finalScore || 85');
    expect(code).not.toContain('fs.writeFileSync(fullPath');
  });

  it('keeps GDPR audit UI fail-closed until a real backend evidence contract exists', () => {
    const code = source('src/components/AuditLogManager.tsx');
    expect(code).toContain('FAIL-CLOSED · AUD4-F-002');
    expect(code).not.toMatch(/fetch\s*\([^)]*\/api\/admin\/gdpr-audit/);
    expect(code).not.toContain('Math.random');
    expect(code).not.toContain('192.168.42.');
  });
});
