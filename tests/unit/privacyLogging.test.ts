import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const dbSource = fs.readFileSync(path.join(process.cwd(), 'server/db.ts'), 'utf8');

describe('privacy-safe subscription logging', () => {
  it('does not interpolate raw email or generic user identifiers into subscription logs', () => {
    expect(dbSource).not.toContain('conflict key: ${cleanEmail}');
    expect(dbSource).not.toContain('Persisted ${userIdentifier}');
    expect(dbSource).not.toContain('userId ${cleanUserId}');
    expect(dbSource).toContain('subject identifier redacted');
  });
});
