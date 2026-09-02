import type { Express, Request, Response, NextFunction } from 'express';

export type ReconnaissanceProbeFamily =
  | 'wordpress'
  | 'secret-file'
  | 'vcs'
  | 'php'
  | 'database-artifact'
  | 'container-artifact'
  | 'configuration'
  | 'cloud-credential'
  | 'cms-framework';

interface ProbeRule {
  family: ReconnaissanceProbeFamily;
  patterns: readonly RegExp[];
}

// Ordered from the most specific/sensitive classes to broad framework fingerprints. The path is
// decoded only for classification; it is never reflected to the client. This catches encoded
// variants such as /%2eenv and /%2f.git%2fconfig without changing Express routing semantics.
const PROBE_RULES: readonly ProbeRule[] = [
  { family: 'secret-file', patterns: [/(^|\/)\.env(?:[./_-]|$)/i, /(^|\/)[^/]*\.env(?:[._-].*)?$/i, /^\/(credentials|secrets?)(?:[./_-]|$)/i] },
  { family: 'vcs', patterns: [/(^|\/)\.(git|svn|hg)(\/|$)/i, /^\/\.git(?:config|credentials)$/i] },
  { family: 'cloud-credential', patterns: [/(^|\/)\.(aws|ssh)(\/|$)/i, /^\/(?:aws|gcp|azure)[._-]?(?:credentials?|secrets?)(?:[./_-]|$)/i] },
  { family: 'container-artifact', patterns: [/^\/(?:dockerfile|docker-compose(?:\.[^/]+)?|\.dockerenv)$/i, /(^|\/)\.docker(\/|$)/i] },
  { family: 'database-artifact', patterns: [/\.(?:sql|bak|old|swp|orig)$/i, /^\/(?:backup|dump|db|database|localhost)\.(?:sql|zip|tar|gz)$/i] },
  { family: 'wordpress', patterns: [/^\/wp-(?:admin|login|content|includes|json)(\/|$)/i, /^\/wp-config\.(?:php|json|ya?ml|ini)$/i] },
  { family: 'php', patterns: [/\.php(?:[./_-]|$)/i, /^\/(?:phpinfo|info|test)(?:\.php)?$/i] },
  { family: 'configuration', patterns: [/(^|\/)(?:app\/)?(?:config|settings|secrets)\.(?:toml|ya?ml|ini|json|conf)$/i, /^\/\.(?:npmrc|netrc|htpasswd|htaccess)$/i] },
  { family: 'cms-framework', patterns: [/^\/magento_version$/i, /^\/administrator(\/|$)/i, /^\/(?:core|install|setup)\/install(?:\.php)?$/i, /^\/admin\/controller(\/|$)/i, /^\/(?:typo3|joomla|drupal|opencart|prestashop|laravel|_profiler)(\/|$)/i] },
] as const;

const BURST_WINDOW_MS = 10_000;
const ENUMERATION_WINDOW_MS = 30_000;
const BURST_REQUEST_THRESHOLD = 8;
const ENUMERATION_FAMILY_THRESHOLD = 3;
const ALERT_COOLDOWN_MS = 60_000;
const MAX_TRACKED_CLIENTS = 2_048;

interface ProbeObservation { at: number; family: ReconnaissanceProbeFamily; }
interface ClientProbeState { observations: ProbeObservation[]; lastSeenAt: number; lastAlertAt: number | null; }

export interface ReconnaissanceDetection {
  family: ReconnaissanceProbeFamily;
  burstDetected: boolean;
  technologyEnumerationDetected: boolean;
  requestsInBurstWindow: number;
  distinctFamiliesInEnumerationWindow: number;
  shouldAlert: boolean;
}

function decodePathForClassification(pathname: string): string {
  let value = pathname;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch { break; }
  }
  const normalized = value.startsWith('/') ? value : `/${value}`;
  return normalized.replace(/\/{2,}/g, '/');
}

export function classifyProbePath(pathname: string): ReconnaissanceProbeFamily | null {
  const normalized = decodePathForClassification(pathname);
  for (const rule of PROBE_RULES) {
    if (rule.patterns.some((pattern) => pattern.test(normalized))) return rule.family;
  }
  return null;
}

export function isKnownProbePath(pathname: string): boolean { return classifyProbePath(pathname) !== null; }

export function createReconnaissanceBurstDetector() {
  const clients = new Map<string, ClientProbeState>();
  function evictOldestClient(): void {
    let oldestKey: string | null = null;
    let oldestSeen = Number.POSITIVE_INFINITY;
    for (const [key, state] of clients) {
      if (state.lastSeenAt < oldestSeen) { oldestSeen = state.lastSeenAt; oldestKey = key; }
    }
    if (oldestKey) clients.delete(oldestKey);
  }
  return {
    observe(clientKey: string | null, family: ReconnaissanceProbeFamily, now: number = Date.now()): ReconnaissanceDetection {
      if (!clientKey) return { family, burstDetected: false, technologyEnumerationDetected: false, requestsInBurstWindow: 1, distinctFamiliesInEnumerationWindow: 1, shouldAlert: false };
      if (!clients.has(clientKey) && clients.size >= MAX_TRACKED_CLIENTS) evictOldestClient();
      const state = clients.get(clientKey) ?? { observations: [], lastSeenAt: now, lastAlertAt: null };
      state.observations = state.observations.filter((entry) => entry.at >= now - ENUMERATION_WINDOW_MS);
      state.observations.push({ at: now, family });
      state.lastSeenAt = now;
      const requestsInBurstWindow = state.observations.filter((entry) => entry.at >= now - BURST_WINDOW_MS).length;
      const distinctFamiliesInEnumerationWindow = new Set(state.observations.map((entry) => entry.family)).size;
      const burstDetected = requestsInBurstWindow >= BURST_REQUEST_THRESHOLD;
      const technologyEnumerationDetected = distinctFamiliesInEnumerationWindow >= ENUMERATION_FAMILY_THRESHOLD;
      const detected = burstDetected || technologyEnumerationDetected;
      const shouldAlert = detected && (state.lastAlertAt === null || now - state.lastAlertAt >= ALERT_COOLDOWN_MS);
      if (shouldAlert) state.lastAlertAt = now;
      clients.set(clientKey, state);
      return { family, burstDetected, technologyEnumerationDetected, requestsInBurstWindow, distinctFamiliesInEnumerationWindow, shouldAlert };
    },
  };
}

export function registerProbeProtection(app: Express): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (isKnownProbePath(req.path)) { res.status(404).end(); return; }
    next();
  });
}
