import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

export const CONTROL_ISSUE_NUMBER = 1192;
export const SUPABASE_PROJECT_REF = 'ryzywoktpmyhwzxmstyu';
export const CANONICAL_SITE_URL = 'https://capital-ai.online';
const MANAGEMENT_API_BASE = 'https://api.supabase.com';
const MAX_COMMAND_BYTES = 4_096;
const MAX_REDIRECTS = 12;

function normalizeUriAllowList(value) {
  if (Array.isArray(value)) return value.map(String).map((entry) => entry.trim()).filter(Boolean);
  if (typeof value !== 'string') return [];
  return value.split(',').map((entry) => entry.trim()).filter(Boolean);
}

function validateCapitalAiUrl(raw, { siteUrl = false } = {}) {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 512) {
    throw new Error('INVALID_URL');
  }

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('INVALID_URL');
  }

  if (url.protocol !== 'https:' || url.origin !== CANONICAL_SITE_URL) {
    throw new Error('URL_ORIGIN_NOT_ALLOWED');
  }
  if (url.username || url.password || url.hash) {
    throw new Error('URL_COMPONENT_NOT_ALLOWED');
  }

  if (siteUrl) {
    if (url.pathname !== '/' || url.search) throw new Error('SITE_URL_MUST_BE_CANONICAL_ROOT');
    return CANONICAL_SITE_URL;
  }

  return url.toString().replace(/\/$/, url.pathname === '/' && !url.search ? '' : '/');
}

export function parseUrlConfigCommand(body) {
  if (typeof body !== 'string' || Buffer.byteLength(body, 'utf8') > MAX_COMMAND_BYTES) {
    throw new Error('INVALID_COMMAND_SIZE');
  }

  const lines = body.trim().split(/\r?\n/);
  if (lines.shift()?.trim() !== '/supabase-url-config') {
    throw new Error('INVALID_COMMAND');
  }

  const jsonText = lines.join('\n').trim();
  if (!jsonText) throw new Error('MISSING_CONFIG_JSON');

  let payload;
  try {
    payload = JSON.parse(jsonText);
  } catch {
    throw new Error('INVALID_CONFIG_JSON');
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('INVALID_CONFIG_OBJECT');
  }

  const allowedKeys = new Set(['site_url', 'redirect_urls']);
  for (const key of Object.keys(payload)) {
    if (!allowedKeys.has(key)) throw new Error('UNSUPPORTED_CONFIG_FIELD');
  }

  const siteUrl = validateCapitalAiUrl(payload.site_url, { siteUrl: true });

  if (!Array.isArray(payload.redirect_urls) || payload.redirect_urls.length === 0 || payload.redirect_urls.length > MAX_REDIRECTS) {
    throw new Error('INVALID_REDIRECT_LIST');
  }

  const redirectUrls = [...new Set(payload.redirect_urls.map((entry) => validateCapitalAiUrl(entry)))];
  if (redirectUrls.length === 0) throw new Error('INVALID_REDIRECT_LIST');

  return {
    site_url: siteUrl,
    redirect_urls: redirectUrls,
  };
}

function safeConfigSnapshot(config) {
  return {
    site_url: typeof config?.site_url === 'string' ? config.site_url : null,
    redirect_urls: normalizeUriAllowList(config?.uri_allow_list),
  };
}

async function managementFetch(path, token, init = {}) {
  const response = await fetch(`${MANAGEMENT_API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    throw new Error(`SUPABASE_MANAGEMENT_HTTP_${response.status}`);
  }

  return response.json();
}

function sorted(values) {
  return [...values].sort();
}

function sameStringArray(left, right) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

export async function applyUrlConfig({ event, accessToken }) {
  if (!event || event.issue?.number !== CONTROL_ISSUE_NUMBER) {
    throw new Error('CONTROL_ISSUE_MISMATCH');
  }
  if (event.sender?.login !== 'SvenKulessa') {
    throw new Error('OWNER_ACTOR_REQUIRED');
  }
  if (!['OWNER', 'MEMBER'].includes(event.comment?.author_association)) {
    throw new Error('OWNER_ASSOCIATION_REQUIRED');
  }
  if (typeof accessToken !== 'string' || accessToken.length < 20) {
    throw new Error('SUPABASE_MANAGEMENT_ACCESS_TOKEN_MISSING');
  }

  const requested = parseUrlConfigCommand(event.comment?.body ?? '');
  const path = `/v1/projects/${SUPABASE_PROJECT_REF}/config/auth`;

  const beforeRaw = await managementFetch(path, accessToken);
  const before = safeConfigSnapshot(beforeRaw);

  await managementFetch(path, accessToken, {
    method: 'PATCH',
    body: JSON.stringify({
      site_url: requested.site_url,
      uri_allow_list: requested.redirect_urls.join(','),
    }),
  });

  const afterRaw = await managementFetch(path, accessToken);
  const after = safeConfigSnapshot(afterRaw);

  if (after.site_url !== requested.site_url || !sameStringArray(after.redirect_urls, requested.redirect_urls)) {
    throw new Error('SUPABASE_URL_CONFIG_READBACK_MISMATCH');
  }

  return { before, after };
}

function markdownReport(result) {
  const redirects = result.after.redirect_urls.map((url) => `- \`${url}\``).join('\n');
  return [
    '### ✅ Supabase URL Configuration aktualisiert',
    '',
    `- Project Ref: \`${SUPABASE_PROJECT_REF}\``,
    `- Site URL: \`${result.after.site_url}\``,
    '- Redirect URLs:',
    redirects,
    '',
    'Read-before-write und Read-after-write: **PASS**.',
    '',
    '> Es wurden ausschließlich `site_url` und `uri_allow_list` des fest gebundenen Projekts geändert.',
  ].join('\n');
}

async function cli() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  const reportPath = process.env.SUPABASE_URL_CONFIG_REPORT_PATH;
  const accessToken = process.env.SUPABASE_MANAGEMENT_ACCESS_TOKEN;

  if (!eventPath || !reportPath) throw new Error('WORKFLOW_CONTEXT_MISSING');

  try {
    const event = JSON.parse(await fs.readFile(eventPath, 'utf8'));
    const result = await applyUrlConfig({ event, accessToken });
    await fs.writeFile(reportPath, markdownReport(result), { mode: 0o600 });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'UNKNOWN_ERROR';
    await fs.writeFile(
      reportPath,
      ['### ❌ Supabase URL Configuration nicht geändert', '', `Fail-closed reason: \`${reason}\``].join('\n'),
      { mode: 0o600 },
    ).catch(() => {});
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await cli();
}
