const RECOVERABLE_ASSET_FAILURES = [
  /chunkloaderror/i,
  /loading chunk .* failed/i,
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /unable to preload css/i,
  /error loading dynamically imported module/i,
];

export interface RecoveryStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface AutomaticRecoveryDecision {
  recoverable: boolean;
  shouldReload: boolean;
  fingerprint: string | null;
  reason: 'NOT_RECOVERABLE' | 'BUDGET_AVAILABLE' | 'BUDGET_EXHAUSTED' | 'STORAGE_UNAVAILABLE';
}

function errorText(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error ?? '');
}

function fnv1a(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function isRecoverableFrontendAssetError(error: unknown): boolean {
  const text = errorText(error);
  return RECOVERABLE_ASSET_FAILURES.some((pattern) => pattern.test(text));
}

export function buildFrontendRecoveryFingerprint(
  error: unknown,
  pathname: string,
): string {
  const normalized = errorText(error)
    .toLowerCase()
    .replace(/https?:\/\/[^\s)]+/g, '<url>')
    .replace(/[a-f0-9]{8,}/g, '<id>')
    .replace(/\d+/g, '<n>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 256);

  return `capital-ai:frontend-recovery:v1:${fnv1a(`${pathname}|${normalized}`)}`;
}

/**
 * Atomically consumes the one-shot automatic recovery budget for stale deployment assets.
 *
 * Persistent render defects are intentionally not auto-reloaded. If sessionStorage is
 * unavailable, recovery fails safe to the visible ErrorBoundary instead of risking a loop.
 */
export function consumeAutomaticFrontendRecovery(
  storage: RecoveryStorage,
  error: unknown,
  pathname: string,
): AutomaticRecoveryDecision {
  if (!isRecoverableFrontendAssetError(error)) {
    return {
      recoverable: false,
      shouldReload: false,
      fingerprint: null,
      reason: 'NOT_RECOVERABLE',
    };
  }

  const fingerprint = buildFrontendRecoveryFingerprint(error, pathname);

  try {
    if (storage.getItem(fingerprint) === 'consumed') {
      return {
        recoverable: true,
        shouldReload: false,
        fingerprint,
        reason: 'BUDGET_EXHAUSTED',
      };
    }

    storage.setItem(fingerprint, 'consumed');
    return {
      recoverable: true,
      shouldReload: true,
      fingerprint,
      reason: 'BUDGET_AVAILABLE',
    };
  } catch {
    return {
      recoverable: true,
      shouldReload: false,
      fingerprint,
      reason: 'STORAGE_UNAVAILABLE',
    };
  }
}
