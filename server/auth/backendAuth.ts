import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import { createClient, type Session, type User } from '@supabase/supabase-js';
import { getCleanEnv } from '../env';
import { isOriginAllowed } from '../middleware/cors';

const SESSION_COOKIE = 'cai_auth_session';
const SESSION_CHUNK_COUNT_COOKIE = 'cai_auth_session_count';
const PKCE_COOKIE = 'cai_auth_pkce';
const STATE_COOKIE = 'cai_auth_state';
const SESSION_CHUNK_SIZE = 2800;
const MAX_SESSION_CHUNKS = 8;
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const OAUTH_TRANSIENT_MAX_AGE_SECONDS = 60 * 10;
const SESSION_REFRESH_REUSE_WINDOW_MS = 10_000;
const MAX_SESSION_REFRESH_REUSE_ENTRIES = 256;

interface StoredBackendSession {
  version: 1;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  mfaPending?: boolean;
}

export interface VerifiedBackendAuth {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshed: boolean;
  mfaPending: boolean;
}

interface BackendSessionRefreshResult {
  session: Session;
  user: User;
}

interface BackendSessionRefreshEntry {
  promise: Promise<BackendSessionRefreshResult | null>;
  reuseUntil: number;
}

const backendSessionRefreshes = new Map<string, BackendSessionRefreshEntry>();

function getSupabaseUrl(): string {
  return getCleanEnv('SUPABASE_URL') || getCleanEnv('VITE_SUPABASE_URL');
}

function getPublishableKey(): string {
  return getCleanEnv('SUPABASE_PUBLISHABLE_KEY') || getCleanEnv('VITE_SUPABASE_PUBLISHABLE_KEY');
}

function assertPublicSupabaseConfiguration(): { url: string; key: string } {
  const url = getSupabaseUrl();
  const key = getPublishableKey();
  if (!url || !key) {
    throw new Error('[BackendAuth] Supabase public auth configuration is unavailable.');
  }
  return { url, key };
}

function isProduction(): boolean {
  return getCleanEnv('NODE_ENV') === 'production';
}

function parseCookieHeader(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const cookies: Record<string, string> = {};
  for (const pair of header.split(';')) {
    const index = pair.indexOf('=');
    if (index <= 0) continue;
    const name = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (!name) continue;
    try {
      cookies[name] = decodeURIComponent(value);
    } catch {
      cookies[name] = value;
    }
  }
  return cookies;
}

function serializeCookie(
  name: string,
  value: string,
  options: { maxAge: number; httpOnly?: boolean; sameSite?: 'Lax' | 'Strict' },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    `Max-Age=${Math.max(0, Math.floor(options.maxAge))}`,
    `SameSite=${options.sameSite ?? 'Lax'}`,
  ];
  if (options.httpOnly !== false) parts.push('HttpOnly');
  if (isProduction()) parts.push('Secure');
  return parts.join('; ');
}

function appendCookie(
  res: Response,
  name: string,
  value: string,
  options: { maxAge: number; httpOnly?: boolean; sameSite?: 'Lax' | 'Strict' },
): void {
  res.append('Set-Cookie', serializeCookie(name, value, options));
}

function clearCookie(res: Response, name: string): void {
  appendCookie(res, name, '', { maxAge: 0 });
}

function encodeStoredSession(session: StoredBackendSession): string {
  return Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
}

function decodeStoredSession(encoded: string): StoredBackendSession | null {
  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as StoredBackendSession;
    if (
      parsed?.version !== 1 ||
      typeof parsed.accessToken !== 'string' ||
      typeof parsed.refreshToken !== 'string' ||
      typeof parsed.expiresAt !== 'number'
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function readSessionCookie(req: Request): StoredBackendSession | null {
  const cookies = parseCookieHeader(req.headers.cookie);
  const count = Number.parseInt(cookies[SESSION_CHUNK_COUNT_COOKIE] || '0', 10);
  if (!Number.isInteger(count) || count < 1 || count > MAX_SESSION_CHUNKS) return null;

  let encoded = '';
  for (let i = 0; i < count; i += 1) {
    const chunk = cookies[`${SESSION_COOKIE}_${i}`];
    if (!chunk) return null;
    encoded += chunk;
  }
  return decodeStoredSession(encoded);
}

function writeSessionCookie(req: Request, res: Response, session: Session, mfaPending = false): void {
  if (!session.access_token || !session.refresh_token || !session.expires_at) {
    throw new Error('[BackendAuth] Supabase returned an incomplete session.');
  }

  const encoded = encodeStoredSession({
    version: 1,
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresAt: session.expires_at,
    mfaPending,
  });
  const chunks = encoded.match(new RegExp(`.{1,${SESSION_CHUNK_SIZE}}`, 'g')) ?? [];
  if (chunks.length < 1 || chunks.length > MAX_SESSION_CHUNKS) {
    throw new Error('[BackendAuth] Session cookie exceeds the bounded cookie envelope.');
  }

  const existing = parseCookieHeader(req.headers.cookie);
  const previousCount = Math.min(
    MAX_SESSION_CHUNKS,
    Math.max(0, Number.parseInt(existing[SESSION_CHUNK_COUNT_COOKIE] || '0', 10) || 0),
  );
  const cookieMaxAge = mfaPending ? OAUTH_TRANSIENT_MAX_AGE_SECONDS : SESSION_MAX_AGE_SECONDS;

  appendCookie(res, SESSION_CHUNK_COUNT_COOKIE, String(chunks.length), {
    maxAge: cookieMaxAge,
  });
  chunks.forEach((chunk, index) => {
    appendCookie(res, `${SESSION_COOKIE}_${index}`, chunk, {
      maxAge: cookieMaxAge,
    });
  });
  for (let index = chunks.length; index < previousCount; index += 1) {
    clearCookie(res, `${SESSION_COOKIE}_${index}`);
  }
}

export function clearBackendAuthCookies(req: Request, res: Response): void {
  const cookies = parseCookieHeader(req.headers.cookie);
  const count = Math.min(
    MAX_SESSION_CHUNKS,
    Math.max(0, Number.parseInt(cookies[SESSION_CHUNK_COUNT_COOKIE] || '0', 10) || 0),
  );
  for (let index = 0; index < Math.max(1, count); index += 1) {
    clearCookie(res, `${SESSION_COOKIE}_${index}`);
  }
  clearCookie(res, SESSION_CHUNK_COUNT_COOKIE);
  clearCookie(res, PKCE_COOKIE);
  clearCookie(res, STATE_COOKIE);
}

function createStatelessAuthClient() {
  const { url, key } = assertPublicSupabaseConfiguration();
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      experimental: { passkey: true },
    },
  });
}

function refreshTokenFingerprint(refreshToken: string): string {
  return createHash('sha256').update(refreshToken).digest('hex');
}

function pruneBackendSessionRefreshes(now: number): void {
  for (const [key, entry] of backendSessionRefreshes) {
    if (entry.reuseUntil <= now) backendSessionRefreshes.delete(key);
  }

  while (backendSessionRefreshes.size >= MAX_SESSION_REFRESH_REUSE_ENTRIES) {
    const oldestKey = backendSessionRefreshes.keys().next().value;
    if (typeof oldestKey !== 'string') break;
    backendSessionRefreshes.delete(oldestKey);
  }
}

/**
 * Coalesces refresh-token rotation for concurrent requests carrying the same cookie.
 *
 * Supabase refresh tokens are single-use. Keeping the successful result for a short bounded
 * interval lets every response persist the same rotated pair instead of racing the provider with
 * the already-consumed token. Only a SHA-256 fingerprint is used as the lookup key.
 */
async function refreshBackendSessionOnce(
  refreshToken: string,
): Promise<BackendSessionRefreshResult | null> {
  const now = Date.now();
  const key = refreshTokenFingerprint(refreshToken);
  const existing = backendSessionRefreshes.get(key);
  if (existing && existing.reuseUntil > now) return existing.promise;

  pruneBackendSessionRefreshes(now);
  const promise = (async () => {
    const client = createStatelessAuthClient();
    const { data, error } = await client.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session || !data.user) return null;
    return { session: data.session, user: data.user };
  })().catch(() => null);
  const entry: BackendSessionRefreshEntry = {
    promise,
    reuseUntil: now + SESSION_REFRESH_REUSE_WINDOW_MS,
  };
  backendSessionRefreshes.set(key, entry);

  void promise.then((result) => {
    if (backendSessionRefreshes.get(key) !== entry) return;
    if (!result) {
      backendSessionRefreshes.delete(key);
      return;
    }
    entry.reuseUntil = Date.now() + SESSION_REFRESH_REUSE_WINDOW_MS;
  });

  return promise;
}

export type BackendUserAuthClient = ReturnType<typeof createStatelessAuthClient>;

/**
 * Server-only client for password, signup, confirmation and recovery operations.
 *
 * This deliberately has no browser storage and never projects Supabase session material to the
 * frontend. Successful login/verification sessions must be handed to persistBackendAuthSession().
 */
export function createBackendEmailAuthClient() {
  return createStatelessAuthClient();
}

/**
 * Binds a stateless Supabase client to a backend-verified cookie session.
 * Any token rotation stays server-side and is immediately projected back into
 * the HttpOnly application cookie.
 */
export async function createAuthenticatedBackendAuthClient(
  req: Request,
  res: Response,
  verified: VerifiedBackendAuth,
): Promise<BackendUserAuthClient> {
  const client = createStatelessAuthClient();
  const { data, error } = await client.auth.setSession({
    access_token: verified.accessToken,
    refresh_token: verified.refreshToken,
  });
  if (error || !data.session || !data.user) {
    throw new Error('[BackendAuth] Verified session could not be bound to the user client.');
  }
  persistBackendAuthSession(req, res, data.session);
  return client;
}

function pkceStorage(req: Request, res: Response) {
  const cookies = parseCookieHeader(req.headers.cookie);
  return {
    getItem(key: string): string | null {
      if (!key.includes('code-verifier')) return null;
      return cookies[PKCE_COOKIE] ?? null;
    },
    setItem(key: string, value: string): void {
      if (!key.includes('code-verifier')) return;
      cookies[PKCE_COOKIE] = value;
      appendCookie(res, PKCE_COOKIE, value, {
        maxAge: OAUTH_TRANSIENT_MAX_AGE_SECONDS,
      });
    },
    removeItem(key: string): void {
      if (!key.includes('code-verifier')) return;
      delete cookies[PKCE_COOKIE];
      clearCookie(res, PKCE_COOKIE);
    },
  };
}

export function createBackendOAuthClient(req: Request, res: Response) {
  const { url, key } = assertPublicSupabaseConfiguration();
  return createClient(url, key, {
    auth: {
      flowType: 'pkce',
      storage: pkceStorage(req, res),
      persistSession: true,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createOAuthState(res: Response): string {
  const state = randomBytes(32).toString('base64url');
  appendCookie(res, STATE_COOKIE, state, {
    maxAge: OAUTH_TRANSIENT_MAX_AGE_SECONDS,
  });
  return state;
}

export function verifyOAuthState(req: Request, providedState: unknown): boolean {
  if (typeof providedState !== 'string' || providedState.length < 32 || providedState.length > 128) {
    return false;
  }
  const expected = parseCookieHeader(req.headers.cookie)[STATE_COOKIE];
  if (!expected) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(providedState);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function persistBackendAuthSession(
  req: Request,
  res: Response,
  session: Session,
  options: { mfaPending?: boolean } = {},
): void {
  writeSessionCookie(req, res, session, options.mfaPending === true);
  clearCookie(res, PKCE_COOKIE);
  clearCookie(res, STATE_COOKIE);
}

async function resolveBackendAuth(
  req: Request,
  res?: Response,
  allowMfaPending = false,
): Promise<VerifiedBackendAuth | null> {
  const stored = readSessionCookie(req);
  if (!stored) return null;
  const mfaPending = stored.mfaPending === true;
  if (mfaPending && !allowMfaPending) return null;

  const client = createStatelessAuthClient();
  let accessToken = stored.accessToken;
  let refreshToken = stored.refreshToken;
  let expiresAt = stored.expiresAt;
  let refreshed = false;

  const shouldRefresh = expiresAt <= Math.floor(Date.now() / 1000) + 60;
  let user: User | null = null;

  if (!shouldRefresh) {
    const { data, error } = await client.auth.getUser(accessToken);
    if (!error && data.user) user = data.user;
  }

  if (!user) {
    // Only the dedicated session endpoint owns refresh-token rotation because it also has the
    // Response needed to atomically persist the rotated refresh token. Other server middleware
    // may validate the current cookie access token but must never rotate a refresh token without
    // returning the replacement cookie to the browser.
    if (!res) return null;

    const result = await refreshBackendSessionOnce(refreshToken);
    if (!result) return null;
    accessToken = result.session.access_token;
    refreshToken = result.session.refresh_token;
    expiresAt = result.session.expires_at ?? Math.floor(Date.now() / 1000) + result.session.expires_in;
    user = result.user;
    refreshed = true;
    writeSessionCookie(req, res, result.session, mfaPending);
  }

  return { user, accessToken, refreshToken, expiresAt, refreshed, mfaPending };
}

export async function resolveVerifiedBackendAuth(
  req: Request,
  res?: Response,
): Promise<VerifiedBackendAuth | null> {
  const resolved = await resolveBackendAuth(req, res, true);
  return resolved?.mfaPending ? null : resolved;
}

export async function resolvePendingBackendAuth(
  req: Request,
  res?: Response,
): Promise<VerifiedBackendAuth | null> {
  const verified = await resolveBackendAuth(req, res, true);
  return verified?.mfaPending ? verified : null;
}

export async function resolveBackendAuthSession(
  req: Request,
  res?: Response,
): Promise<VerifiedBackendAuth | null> {
  return resolveBackendAuth(req, res, true);
}

export async function revokeBackendAuthSession(req: Request, scope: 'local' | 'global'): Promise<void> {
  const stored = readSessionCookie(req);
  if (!stored) return;

  try {
    const client = createStatelessAuthClient();
    const { error: setError } = await client.auth.setSession({
      access_token: stored.accessToken,
      refresh_token: stored.refreshToken,
    });
    if (setError) return;
    await client.auth.signOut({ scope });
  } catch {
    // Cookie clearing remains authoritative for this application session. Provider revocation is
    // best-effort here so a provider outage cannot trap the user in an apparently logged-in UI.
  }
}

export function resolveApplicationOrigin(req: Request): string {
  const production = isProduction();
  const rawHost = String(req.headers.host || '').trim().toLowerCase();
  if (!rawHost || /[\s,/@\\]/.test(rawHost)) {
    throw new Error('[BackendAuth] Invalid request host.');
  }

  const proto = production ? 'https' : (String(req.headers['x-forwarded-proto'] || req.protocol || 'http').split(',')[0].trim());
  const origin = `${proto}://${rawHost}`;
  if (!isOriginAllowed(origin, production)) {
    throw new Error('[BackendAuth] Request origin is outside the canonical application origin set.');
  }
  return origin;
}

export function normalizePostAuthPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return '/';
  if (value.includes('\\') || value.includes('\0')) return '/';
  return value;
}

export function sessionFingerprint(accessToken: string): string {
  return createHash('sha256').update(accessToken).digest('hex').slice(0, 16);
}
