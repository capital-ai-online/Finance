import {
  PRODUCTION_BASELINE_END,
  PRODUCTION_BASELINE_START,
  extractBaselineGeneratedAt,
  extractProductionBaselineBlock,
  fail,
  renderProductionBaselineBlock,
} from './lib.mjs';

function occurrenceCount(text, needle) {
  if (!needle) return 0;
  return String(text || '').split(needle).length - 1;
}

function normalizeBlock(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

/**
 * Replace only the canonical production-baseline block inside an existing PR body.
 *
 * The rest of the PR body remains byte-for-byte unchanged. When the current block
 * already represents the same atomic baseline identity, its original generatedAt
 * timestamp is preserved and the operation becomes a no-op. This prevents the
 * trusted auto-refresh workflow from creating an edited -> governance -> refresh loop.
 */
export function replaceProductionBaselineBlock(body, baseline) {
  const text = String(body || '');
  const startMarker = `<!-- ${PRODUCTION_BASELINE_START} -->`;
  const endMarker = `<!-- ${PRODUCTION_BASELINE_END} -->`;

  if (occurrenceCount(text, startMarker) !== 1 || occurrenceCount(text, endMarker) !== 1) {
    fail('PR-Body muss genau einen kanonischen Produktions-Baseline-Block enthalten; Auto-Refresh bleibt fail-closed.');
  }

  const currentBlock = extractProductionBaselineBlock(text);
  if (!currentBlock) {
    fail('Kanonischer Produktions-Baseline-Block konnte nicht eindeutig gelesen werden.');
  }

  const currentGeneratedAt = extractBaselineGeneratedAt(currentBlock);
  if (currentGeneratedAt && !Number.isNaN(Date.parse(currentGeneratedAt))) {
    const expectedForCurrentTimestamp = renderProductionBaselineBlock({
      ...baseline,
      generatedAt: currentGeneratedAt,
    });

    if (normalizeBlock(currentBlock) === normalizeBlock(expectedForCurrentTimestamp)) {
      return {
        body: text,
        changed: false,
        baselineId: baseline.baselineId,
      };
    }
  }

  const replacement = renderProductionBaselineBlock(baseline);
  const startAt = text.indexOf(startMarker);
  const endAt = text.indexOf(endMarker, startAt + startMarker.length);
  if (startAt < 0 || endAt < 0) {
    fail('Kanonischer Produktions-Baseline-Block ist beim Ersetzen inkonsistent geworden.');
  }

  return {
    body: `${text.slice(0, startAt)}${replacement}${text.slice(endAt + endMarker.length)}`,
    changed: true,
    baselineId: baseline.baselineId,
  };
}
