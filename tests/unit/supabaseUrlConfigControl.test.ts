import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_SITE_URL,
  CONTROL_ISSUE_NUMBER,
  SUPABASE_PROJECT_REF,
  parseUrlConfigCommand,
} from '../../scripts/operations/supabaseUrlConfigControl.mjs';

describe('Supabase URL Configuration control', () => {
  it('parses the bounded CAPITAL-AI production URL configuration', () => {
    const result = parseUrlConfigCommand([
      '/supabase-url-config',
      JSON.stringify({
        site_url: 'https://capital-ai.online',
        redirect_urls: [
          'https://capital-ai.online/dashboard',
          'https://capital-ai.online/login',
          'https://capital-ai.online/login?password-recovery=1',
        ],
      }),
    ].join('\n'));

    expect(CONTROL_ISSUE_NUMBER).toBe(1192);
    expect(SUPABASE_PROJECT_REF).toBe('ryzywoktpmyhwzxmstyu');
    expect(CANONICAL_SITE_URL).toBe('https://capital-ai.online');
    expect(result).toEqual({
      site_url: 'https://capital-ai.online',
      redirect_urls: [
        'https://capital-ai.online/dashboard',
        'https://capital-ai.online/login',
        'https://capital-ai.online/login?password-recovery=1',
      ],
    });
  });

  it('rejects foreign origins, insecure URLs and unsupported fields', () => {
    const command = (payload: unknown) => ['/supabase-url-config', JSON.stringify(payload)].join('\n');

    expect(() => parseUrlConfigCommand(command({
      site_url: 'https://capital-ai.online',
      redirect_urls: ['https://evil.example/callback'],
    }))).toThrow('URL_ORIGIN_NOT_ALLOWED');

    expect(() => parseUrlConfigCommand(command({
      site_url: 'https://capital-ai.online',
      redirect_urls: ['http://capital-ai.online/login'],
    }))).toThrow('URL_ORIGIN_NOT_ALLOWED');

    expect(() => parseUrlConfigCommand(command({
      site_url: 'https://capital-ai.online',
      redirect_urls: ['https://capital-ai.online/login'],
      arbitrary_management_payload: true,
    }))).toThrow('UNSUPPORTED_CONFIG_FIELD');
  });

  it('keeps Site URL pinned to the public root', () => {
    expect(() => parseUrlConfigCommand([
      '/supabase-url-config',
      JSON.stringify({
        site_url: 'https://capital-ai.online/login',
        redirect_urls: ['https://capital-ai.online/dashboard'],
      }),
    ].join('\n'))).toThrow('SITE_URL_MUST_BE_CANONICAL_ROOT');
  });

  it('keeps the workflow owner-only, issue-bound, least-privileged and secret-backed', () => {
    const workflow = fs.readFileSync('.github/workflows/supabase-url-config-control.yml', 'utf8');

    expect(workflow).toContain('issue_comment:');
    expect(workflow).toContain("github.event.issue.number == 1192");
    expect(workflow).toContain("github.actor == 'SvenKulessa'");
    expect(workflow).toContain("github.event.comment.author_association == 'OWNER'");
    expect(workflow).toContain("github.event.comment.author_association == 'MEMBER'");
    expect(workflow).toContain("startsWith(github.event.comment.body, '/supabase-url-config')");
    expect(workflow).toContain("github.event.comment.body == '/supabase-auth-registration-config'");
    expect(workflow).toContain('node scripts/operations/supabaseAuthRegistrationControl.mjs');
    expect(workflow).toContain('Supabase Auth Registration Configuration verifiziert');
    expect(workflow).toContain('permissions: {}');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('issues: write');
    expect(workflow).toContain('CAPITAL_AI_SUPABASE_MGMT_ACCESS_TOKEN');
    expect(workflow).not.toContain('pull_request_target');
    expect(workflow).not.toContain('contents: write');
  });
});
