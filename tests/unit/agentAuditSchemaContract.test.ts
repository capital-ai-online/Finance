import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260811230540_m5_agent_audit_events.sql');
const writerPath = path.join(process.cwd(), 'server/agentAudit/agentAuditWriter.ts');

const canonicalColumns = [
  'occurred_at',
  'request_id',
  'trace_id',
  'span_id',
  'human_actor_id',
  'app_id',
  'agent_id',
  'provider',
  'model',
  'intent',
  'scope',
  'capability',
  'risk_class',
  'policy_id',
  'policy_version',
  'authorization_decision',
  'approval_reference',
  'step_up_reference',
  'tool_name',
  'repository',
  'branch',
  'commit_sha',
  'pull_request_number',
  'ci_run_id',
  'artifact_digest',
  'deployment_id',
  'runtime_version',
  'result',
  'error_code',
  'rollback_reference',
  'attributes',
] as const;

const legacyWriterAliases = [
  'actor_id',
  'decision',
  'approval_id',
  'tool_id',
  'pr_number',
  'workflow_run_id',
  'metadata',
] as const;

function extractWriterRow(writer: string): string {
  const match = writer.match(/const row = \{([\s\S]*?)\n  \};\n\n  const supabase/);
  if (!match?.[1]) throw new Error('agentAuditWriter row mapping could not be located');
  return match[1];
}

describe('M5 production audit schema contract', () => {
  it('keeps the canonical migration and the application DB row on the same column vocabulary', () => {
    const migration = fs.readFileSync(migrationPath, 'utf8');
    const writer = fs.readFileSync(writerPath, 'utf8');
    const row = extractWriterRow(writer);

    for (const column of canonicalColumns) {
      expect(migration, `migration column ${column}`).toMatch(new RegExp(`^\\s*${column}\\s+`, 'm'));
      expect(row, `writer row mapping ${column}`).toMatch(new RegExp(`\\b${column}\\s*:`));
    }

    for (const alias of legacyWriterAliases) {
      expect(row, `legacy DB row alias ${alias}`).not.toMatch(new RegExp(`\\b${alias}\\s*:`));
    }
  });
});
