const FULL_SHA_RE = /^[0-9a-f]{40}$/i;

const CURRENT_STATE_BASELINE_LABELS = [
  'Baseline',
  'Current-main synchronization baseline',
  'Correlation baseline',
  'Current correlation baseline',
  'Current repository baseline for this synchronization',
];

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function markdownField(text, labels) {
  const source = String(text ?? '');
  for (const label of labels) {
    const pattern = new RegExp('^\\*\\*' + escapeRegExp(label) + ':\\*\\*\\s*`([^`]+)`', 'im');
    const match = source.match(pattern);
    if (match) return match[1].trim();
  }
  return null;
}

export function isCurrentStateProjectionPath(filePath) {
  const normalized = String(filePath ?? '').replace(/\\/g, '/').replace(/^\.\//, '');
  return normalized === 'docs/architecture/ROADMAP.md'
    || /^docs\/projects\/[^/]+\/(?:ROADMAP|TASK_REGISTER)\.md$/.test(normalized);
}

export function extractCurrentStateMainBaseline(text) {
  const source = String(text ?? '');
  for (const label of CURRENT_STATE_BASELINE_LABELS) {
    const pattern = new RegExp('^\\*\\*' + escapeRegExp(label) + ':\\*\\*\\s*`main@([0-9a-f]{40})`\\s*$', 'im');
    const match = source.match(pattern);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

export function validateCurrentStateProjectionFreshness({ filePath, text, expectedMainSha }) {
  const findings = [];
  if (!isCurrentStateProjectionPath(filePath)) return findings;

  const expected = String(expectedMainSha ?? '').toLowerCase();
  if (!FULL_SHA_RE.test(expected)) {
    findings.push({
      code: 'CURRENT_STATE_EXPECTED_MAIN_INVALID',
      message: `${filePath}: expected current main SHA is missing or invalid.`,
    });
    return findings;
  }

  const observed = extractCurrentStateMainBaseline(text);
  if (!observed) {
    findings.push({
      code: 'CURRENT_STATE_PROJECTION_BASELINE_MISSING',
      message: `${filePath}: changed current-state projection must declare a recognized full main@<sha> baseline.`,
    });
    return findings;
  }

  if (observed !== expected) {
    findings.push({
      code: 'CURRENT_STATE_PROJECTION_BASELINE_STALE',
      message: `${filePath}: baseline main@${observed} != current main@${expected}.`,
    });
  }

  return findings;
}

export function extractAuthorityMetadata({ text = '', jsonValue = null } = {}) {
  if (jsonValue && typeof jsonValue === 'object' && !Array.isArray(jsonValue)) {
    return {
      authorityId: typeof jsonValue.authorityId === 'string' ? jsonValue.authorityId.trim() : null,
      version: typeof jsonValue.version === 'string' ? jsonValue.version.trim() : null,
    };
  }

  return {
    authorityId: markdownField(text, ['Authority ID']),
    version: markdownField(text, ['Authority version', 'Control Plane Version', 'Version']),
  };
}

export function validateAuthorityProjection({
  filePath,
  expectedAuthorityId,
  expectedVersion,
  text = '',
  jsonValue = null,
  requireAuthorityId = false,
  requireVersion = false,
}) {
  const findings = [];
  const metadata = extractAuthorityMetadata({ text, jsonValue });

  if (requireAuthorityId && !metadata.authorityId) {
    findings.push({
      code: 'AUTHORITY_TARGET_ID_MISSING',
      message: `${filePath}: authority identity metadata is required.`,
    });
  }
  if (metadata.authorityId && metadata.authorityId !== expectedAuthorityId) {
    findings.push({
      code: 'AUTHORITY_TARGET_ID_MISMATCH',
      message: `${filePath}: ${metadata.authorityId} != ${expectedAuthorityId}.`,
    });
  }

  if (requireVersion && !metadata.version) {
    findings.push({
      code: 'AUTHORITY_TARGET_VERSION_MISSING',
      message: `${filePath}: authority version metadata is required.`,
    });
  }
  if (metadata.version && metadata.version !== expectedVersion) {
    findings.push({
      code: 'AUTHORITY_TARGET_VERSION_MISMATCH',
      message: `${filePath}: ${metadata.version} != registry ${expectedVersion}.`,
    });
  }

  return findings;
}
