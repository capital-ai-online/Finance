/**
 * Bounded Security remediations for CodeQL 2026-09-14 findings.
 * Path confinement, relative-redirect allowlisting, ReDoS-safe string helpers
 * and format-string-safe logging. Does not change product authority.
 */
import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';
import { checkRateLimit, getClientIp } from './rateLimiter';

export class UnsafePathError extends Error {
  constructor(message = 'path-escape') {
    super(message);
    this.name = 'UnsafePathError';
  }
}

export class UnsafeRedirectError extends Error {
  constructor(message = 'unsafe-redirect') {
    super(message);
    this.name = 'UnsafeRedirectError';
  }
}

function assertNoNul(value: string): void {
  if (value.includes('\0')) {
    throw new UnsafePathError('invalid-path');
  }
}

export function resolveWithinRoot(rootDir: string, candidate: string): string {
  if (typeof candidate !== 'string' || candidate.length === 0 || candidate.length > 2048) {
    throw new UnsafePathError('invalid-path');
  }
  assertNoNul(candidate);
  const root = path.resolve(rootDir);
  const resolved = path.resolve(root, candidate);
  const prefix = root.endsWith(path.sep) ? root : root + path.sep;
  if (resolved !== root && !resolved.startsWith(prefix)) {
    throw new UnsafePathError('path-escape');
  }
  return resolved;
}

const DEFAULT_WORKSPACE_ROOTS = ['docs', 'src', 'server', 'tests'] as const;

export function resolveWorkspacePath(
  candidate: string,
  allowedRoots: readonly string[] = DEFAULT_WORKSPACE_ROOTS,
): string {
  if (typeof candidate !== 'string' || candidate.length === 0 || candidate.length > 2048) {
    throw new UnsafePathError('invalid-path');
  }
  assertNoNul(candidate);
  const normalized = candidate.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.includes('://') || normalized.startsWith('..')) {
    throw new UnsafePathError('path-escape');
  }
  const cwd = path.resolve(process.cwd());
  const resolved = resolveWithinRoot(cwd, normalized);
  const allowed = allowedRoots.map((root) => resolveWithinRoot(cwd, root));
  const ok = allowed.some((root) => {
    const prefix = root.endsWith(path.sep) ? root : root + path.sep;
    return resolved === root || resolved.startsWith(prefix);
  });
  if (!ok) {
    throw new UnsafePathError('path-not-allowlisted');
  }
  return resolved;
}

export function safeRelativeRedirectLocation(pathname: string, query = ''): string {
  if (typeof pathname !== 'string' || pathname.length === 0 || pathname.length > 2048) {
    throw new UnsafeRedirectError('invalid-redirect');
  }
  if (pathname.includes('\\') || pathname.includes('\0') || pathname.includes('\r') || pathname.includes('\n')) {
    throw new UnsafeRedirectError('invalid-redirect');
  }
  if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('://')) {
    throw new UnsafeRedirectError('unsafe-redirect');
  }
  const safeQuery =
    typeof query === 'string' && query.startsWith('?') && !query.includes('\r') && !query.includes('\n')
      ? query.slice(0, 2048)
      : '';
  return pathname + safeQuery;
}

export function stripTrailingSlashes(pathname: string): string {
  if (!pathname || pathname === '/') return '/';
  let end = pathname.length;
  while (end > 1 && pathname.charCodeAt(end - 1) === 47) {
    end -= 1;
  }
  return pathname.slice(0, end) || '/';
}

export function isSimpleEmail(value: string): boolean {
  if (typeof value !== 'string' || value.length < 3 || value.length > 254) return false;
  const at = value.indexOf('@');
  if (at <= 0 || at !== value.lastIndexOf('@')) return false;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (!local || !domain || local.length > 64) return false;
  if (local.includes(' ') || domain.includes(' ') || domain.startsWith('.') || domain.endsWith('.')) return false;
  const dot = domain.lastIndexOf('.');
  return dot > 0 && dot < domain.length - 1;
}

export function htmlToPlainText(html: string): string {
  const source = String(html ?? '');
  const parts: string[] = [];
  let i = 0;
  while (i < source.length) {
    const open = source.indexOf('<', i);
    if (open === -1) {
      parts.push(source.slice(i));
      break;
    }
    parts.push(source.slice(i, open));
    const close = source.indexOf('>', open + 1);
    if (close === -1) {
      break;
    }
    i = close + 1;
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '\u0026amp;',
  '<': '\u0026lt;',
  '>': '\u0026gt;',
  '"': '\u0026quot;',
  "'": '\u0026#39;',
};

export function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

export function escapeMarkdownTableCell(value: string): string {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
}

export function hostnameOf(urlValue: string): string | null {
  try {
    return new URL(urlValue).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function hostEquals(urlValue: string, expectedHost: string): boolean {
  const host = hostnameOf(urlValue);
  return host === expectedHost.toLowerCase();
}

export function capLength(value: string, max = 256): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

export function rateLimitMiddleware(options: {
  name: string;
  maxRequests: number;
  windowMs: number;
}) {
  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const ip = getClientIp(req as Parameters<typeof getClientIp>[0]);
    if (!checkRateLimit(`${options.name}:${ip}`, options.maxRequests, options.windowMs)) {
      res.status(429).json({ error: 'Zu viele Anfragen. Bitte spaeter erneut versuchen.' });
      return;
    }
    next();
  };
}
