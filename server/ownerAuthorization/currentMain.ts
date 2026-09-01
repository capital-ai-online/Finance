const MAIN_API = 'https://api.github.com/repos/SvenKulessa/Finance/commits/main';
const CONTENT_API = 'https://api.github.com/repos/SvenKulessa/Finance/contents';

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'capital-ai-owner-authorization',
  };
  const token = process.env.OWNER_AUTH_GITHUB_READ_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function resolveCurrentMainSha(): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(MAIN_API, { headers: githubHeaders(), signal: controller.signal });
    if (!response.ok) throw new Error('ADR0104_CURRENT_MAIN_UNRESOLVED');
    const payload = await response.json() as { sha?: unknown };
    if (typeof payload.sha !== 'string' || !/^[0-9a-f]{40}$/.test(payload.sha)) {
      throw new Error('ADR0104_CURRENT_MAIN_UNRESOLVED');
    }
    return payload.sha;
  } catch (error: any) {
    if (error?.message === 'ADR0104_CURRENT_MAIN_UNRESOLVED') throw error;
    throw new Error('ADR0104_CURRENT_MAIN_UNRESOLVED');
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCurrentMainTextFile(path: string, expectedMainSha: string): Promise<string> {
  if (!/^[0-9a-f]{40}$/.test(expectedMainSha)) throw new Error('ADR0104_CURRENT_MAIN_UNRESOLVED');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetch(`${CONTENT_API}/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${expectedMainSha}`, {
      headers: githubHeaders(),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error('ADR0104_CANONICAL_PROJECT_UNRESOLVED');
    const payload = await response.json() as { content?: unknown; encoding?: unknown };
    if (payload.encoding !== 'base64' || typeof payload.content !== 'string') {
      throw new Error('ADR0104_CANONICAL_PROJECT_UNRESOLVED');
    }
    return Buffer.from(payload.content.replace(/\n/g, ''), 'base64').toString('utf8');
  } catch (error: any) {
    if (error?.message === 'ADR0104_CANONICAL_PROJECT_UNRESOLVED') throw error;
    throw new Error('ADR0104_CANONICAL_PROJECT_UNRESOLVED');
  } finally {
    clearTimeout(timeout);
  }
}

export async function assertCurrentMainSha(expectedSha: string): Promise<void> {
  const actual = await resolveCurrentMainSha();
  if (actual !== expectedSha) throw new Error('ADR0104_CURRENT_MAIN_DRIFT');
}
