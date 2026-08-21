import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

function read(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('operational event UI authority boundary', () => {
  const auditView = read('src/components/AuditLog.tsx');
  const notifications = read('src/components/ComplianceNotifications.tsx');
  const bridge = read('src/platform/EventMesh/Services/SystemAuditBridge.ts');

  it('keeps the legacy AuditLog component read-only and explicitly non-auditing', () => {
    expect(auditView).toContain('This view is NOT an audit log');
    expect(auditView).toContain('operational-read-model-only');
    expect(auditView).not.toContain("method: 'POST'");
    expect(auditView).not.toContain('Manuelles Ereignis');
    expect(auditView).not.toContain('system_events.json');
    expect(auditView).not.toContain('userEmail: string');
    expect(auditView).not.toContain('ip?: string');
  });

  it('uses authenticated polling instead of an unauthenticated EventSource compatibility path', () => {
    expect(notifications).toContain("authFetch('/api/admin/system-events')");
    expect(notifications).not.toContain('new EventSource');
    expect(notifications).not.toContain('/system-events/stream');
    expect(notifications).not.toContain('Compliance Audit Entry');
    expect(notifications).not.toContain('LIVE COMPLIANCE ALERTS');
    expect(notifications).not.toContain('userEmail');
    expect(notifications).not.toContain('Local Loopback');
  });

  it('keeps the Event Mesh bridge non-authorizing and PII-minimized', () => {
    expect(bridge).toContain('legacy catalog name');
    expect(bridge).toContain('Neither this bridge nor Event Mesh is an');
    expect(bridge).not.toContain('userEmail: string');
    expect(bridge).not.toContain('ip?: string');
    expect(bridge).toContain('public.security_events');
    expect(bridge).toContain('agent_audit_events');
  });
});
