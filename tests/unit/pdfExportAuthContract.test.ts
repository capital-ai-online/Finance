import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('PDF export authentication contract', () => {
  const modalSource = fs.readFileSync(path.join(process.cwd(), 'src/components/PdfExportModal.tsx'), 'utf8');

  it('uses the centralized authenticated fetch for both protected credit endpoints', () => {
    expect(modalSource).toContain("authFetch('/api/stripe/pdf-credits')");
    expect(modalSource).toContain("authFetch('/api/stripe/consume-pdf-credit'");
    expect(modalSource).not.toContain("fetch('/api/stripe/consume-pdf-credit'");
    expect(modalSource).not.toContain('fetch(`/api/stripe/pdf-credits');
  });

  it('does not trust the client email as the ledger identity', () => {
    expect(modalSource).not.toContain('/api/stripe/pdf-credits?email=');
  });
});
