import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '../..');
const migrationPath = path.join(
  root,
  'supabase/migrations/20260928055300_owner_authorization_service_role_least_privilege.sql',
);
const atomicMigrationPath = path.join(
  root,
  'supabase/migrations/20260902000000_owner_device_authorization_atomic_activation.sql',
);

function normalizedStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((statement) => statement.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim().toLowerCase())
    .filter(Boolean);
}

describe('owner authorization service-role least privilege migration', () => {
  it('normalizes all five owner-authorization tables before regranting privileges', () => {
    const statements = normalizedStatements(fs.readFileSync(migrationPath, 'utf8'));
    for (const table of [
      'owner_device_credentials',
      'owner_authorization_challenges',
      'owner_authorization_evidence',
      'owner_authorization_consumptions',
      'adr0104_owner_sessions',
    ]) {
      expect(statements).toContain(
        `revoke all on table public.${table} from public, anon, authenticated, service_role`,
      );
    }
  });

  it('grants only the direct DML required by current privileged server consumers', () => {
    const statements = normalizedStatements(fs.readFileSync(migrationPath, 'utf8'));
    const serviceRoleGrants = statements.filter((statement) =>
      statement.startsWith('grant ') && statement.endsWith(' to service_role'));

    expect(serviceRoleGrants).toEqual([
      'grant select, insert, update on table public.owner_device_credentials to service_role',
      'grant select, insert, update on table public.owner_authorization_challenges to service_role',
      'grant select on table public.adr0104_owner_sessions to service_role',
    ]);
  });

  it('does not expose any owner-authorization table directly to browser roles', () => {
    const statements = normalizedStatements(fs.readFileSync(migrationPath, 'utf8'));
    const browserGrants = statements.filter((statement) =>
      statement.startsWith('grant ') &&
      /\bto (?:public|anon|authenticated)(?:\b|,)/.test(statement));

    expect(browserGrants).toEqual([]);
  });

  it('keeps evidence and consumption writes behind the existing service-role-only atomic RPC', () => {
    const sql = fs.readFileSync(atomicMigrationPath, 'utf8').replace(/\s+/g, ' ').toLowerCase();

    expect(sql).toContain('security definer');
    expect(sql).toContain('insert into public.owner_authorization_evidence');
    expect(sql).toContain('insert into public.owner_authorization_consumptions');
    expect(sql).toContain('insert into public.adr0104_owner_sessions');
    expect(sql).toContain(
      'grant execute on function public.consume_adr0104_owner_authorization(uuid,uuid,uuid,bigint,bigint,text,text,text,text,jsonb,text,text,timestamptz,timestamptz,boolean,boolean,text) to service_role',
    );
  });
});
