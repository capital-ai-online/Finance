import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const migrationPath = new URL(
  '../../supabase/migrations/20260920161216_remove_promo_redemptions.sql',
  import.meta.url,
);
const migration = readFileSync(migrationPath, 'utf8');

describe('promo_redemptions retirement migration', () => {
  it('locks before checking emptiness and fails closed with SQLSTATE 55000', () => {
    const lock = migration.indexOf('lock table public.promo_redemptions in access exclusive mode');
    const guard = migration.indexOf('if exists (select 1 from public.promo_redemptions limit 1)');
    const errorCode = migration.indexOf("errcode = '55000'");
    expect(lock).toBeGreaterThanOrEqual(0);
    expect(guard).toBeGreaterThan(lock);
    expect(errorCode).toBeGreaterThan(guard);
    expect(migration).toContain('promo_redemptions retirement blocked: table is not empty');
  });

  it('keeps lock, guard and drop inside one atomic DO statement', () => {
    const doStart = migration.indexOf('do $$');
    const lock = migration.indexOf('lock table public.promo_redemptions in access exclusive mode');
    const guard = migration.indexOf('if exists (select 1 from public.promo_redemptions limit 1)');
    const drop = migration.indexOf("execute 'drop table public.promo_redemptions'");
    const doEnd = migration.lastIndexOf('$$;');
    expect(doStart).toBeGreaterThanOrEqual(0);
    expect(lock).toBeGreaterThan(doStart);
    expect(guard).toBeGreaterThan(lock);
    expect(drop).toBeGreaterThan(guard);
    expect(doEnd).toBeGreaterThan(drop);
    expect(migration.slice(doEnd + 3).trim()).toBe('');
    expect(migration.match(/drop table public\.promo_redemptions/gi)).toHaveLength(1);
  });

  it('is idempotent when the retired table is already absent', () => {
    expect(migration).toContain("if to_regclass('public.promo_redemptions') is null then");
    expect(migration).toMatch(/if to_regclass\('public\.promo_redemptions'\) is null then\s+return;/);
  });
});

const runPostgresEvidence = process.env.CI === 'true' ? describe : describe.skip;

runPostgresEvidence('promo_redemptions retirement PostgreSQL behavior', () => {
  const container = `capital-ai-promo-retirement-${process.pid}`;
  const postgresPassword = randomBytes(32).toString('base64url');
  const docker = (...args: string[]) => execFileSync('docker', args, {
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const psql = (sql: string) => execFileSync(
    'docker',
    [
      'exec', '-i', container,
      'psql', '-X', '--no-psqlrc', '-U', 'postgres', '-d', 'postgres',
      '-v', 'ON_ERROR_STOP=1', '-v', 'VERBOSITY=verbose', '-At',
    ],
    { input: sql, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] },
  );
  const reset = () => psql('drop table if exists public.promo_redemptions;');

  beforeAll(async () => {
    docker(
      'run', '--rm', '-d', '--name', container,
      '-e', `POSTGRES_PASSWORD=${postgresPassword}`,
      'postgres:17-alpine',
    );
    let ready = false;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      try {
        // The official image briefly starts a socket-only temporary server
        // during init. Do not treat that phase as final readiness.
        const listenAddresses = psql('show listen_addresses;').trim();
        if (listenAddresses.length > 0) {
          ready = true;
          break;
        }
      } catch {
        // Expected while the entrypoint transitions from init to final server.
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    if (!ready) throw new Error('PostgreSQL 17 final server did not become ready');
  }, 60_000);

  afterAll(() => {
    try { docker('rm', '-f', container); } catch { /* best-effort cleanup */ }
  });

  it('succeeds idempotently when the table is already absent', () => {
    reset();
    expect(() => psql(migration)).not.toThrow();
    expect(psql("select coalesce(to_regclass('public.promo_redemptions')::text, 'ABSENT');").trim()).toBe('ABSENT');
  });

  it('drops an empty table', () => {
    reset();
    psql('create table public.promo_redemptions (email text, redeemed_at timestamptz);');
    expect(() => psql(migration)).not.toThrow();
    expect(psql("select coalesce(to_regclass('public.promo_redemptions')::text, 'ABSENT');").trim()).toBe('ABSENT');
  });

  it('fails closed on existing rows and preserves both table and data', () => {
    reset();
    psql([
      'create table public.promo_redemptions (email text, redeemed_at timestamptz);',
      "insert into public.promo_redemptions(email, redeemed_at) values ('evidence@example.invalid', now());",
    ].join('\n'));

    let thrown: unknown;
    try { psql(migration); } catch (error) { thrown = error; }

    expect(thrown).toBeTruthy();
    const stderr = String((thrown as { stderr?: string })?.stderr ?? '');
    expect(stderr).toContain('55000');
    expect(stderr).toContain('promo_redemptions retirement blocked: table is not empty');
    expect(psql("select to_regclass('public.promo_redemptions')::text;").trim()).toBe('promo_redemptions');
    expect(psql('select count(*) from public.promo_redemptions;').trim()).toBe('1');
  });
});
