import {
  PRODUCTION_BASELINE_END,
  PRODUCTION_BASELINE_START,
  extractBaselineGeneratedAt,
  extractProductionBaselineBlock,
  fail,
  renderProductionBaselineBlock,
} from './lib.mjs';

const PRODUCTION_BASELINE_SECTION_PAIRS = [
  {
    baseline: '## 3. Produktions-Baseline — maschinenverwalteter / beratender Nachweis',
    next: '## 4. Umfang / Multi-Agent-Koordination',
  },
  {
    baseline: '## 7. Maschinenlesbare Baseline',
    next: null,
  },
];

function occurrenceCount(text, needle) {
  if (!needle) return 0;
  return String(text || '').split(needle).length - 1;
}

function normalizeBlock(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function repairMissingProductionBaselineBlock(text, baseline, markers) {
  const markerOccurrences = markers.reduce((sum, marker) => sum + occurrenceCount(text, marker), 0);
  if (markerOccurrences > 0) {
    fail(
      'PR-Body enthält einen unvollständigen oder duplizierten Produktions-Baseline-Markerzustand; ' +
        'Auto-Refresh repariert nur vollständig markerfreie kanonische Abschnitt-3-Bodies.',
    );
  }

  const candidates = PRODUCTION_BASELINE_SECTION_PAIRS.filter(({ baseline: heading, next }) =>
    occurrenceCount(text, heading) === 1 && (next === null || occurrenceCount(text, next) === 1),
  );
  if (candidates.length !== 1) {
    fail(
      'PR-Body besitzt keinen eindeutig reparierbaren kanonischen Produktions-Baseline-Abschnitt; ' +
        'Auto-Refresh bleibt fail-closed.',
    );
  }

  const { baseline: sectionHeading, next: nextHeading } = candidates[0];
  const sectionStart = text.indexOf(sectionHeading);
  const sectionBodyStart = sectionStart + sectionHeading.length;
  const nextSectionStart = nextHeading === null ? text.length : text.indexOf(nextHeading, sectionBodyStart);
  if (sectionStart < 0 || nextSectionStart < sectionBodyStart) {
    fail('Kanonische Abschnittsgrenzen für die Produktions-Baseline konnten nicht sicher bestimmt werden.');
  }

  const replacement = renderProductionBaselineBlock(baseline);
  const suffix = nextHeading === null ? '' : `\n\n${text.slice(nextSectionStart)}`;
  return {
    body: `${text.slice(0, sectionBodyStart)}\n\n${replacement}${suffix}`,
    changed: true,
    evidenceState: 'STALE',
    baselineId: baseline.baselineId,
  };
}

/**
 * Replace only the canonical production-baseline block inside an existing PR body.
 *
 * The rest of the PR body remains byte-for-byte unchanged. When the current block
 * already represents the same atomic baseline identity, its original generatedAt
 * timestamp is preserved and the operation becomes a no-op. This prevents the
 * trusted auto-refresh workflow from creating an edited -> governance -> refresh loop.
 *
 * `evidenceState` is machine-readable in the returned result:
 * - CURRENT: body already matches Production/main/head identity;
 * - STALE: identity or canonical baseline content changed and requires refresh.
 *
 * A marker-free but otherwise canonical section 3 may be reconstructed atomically.
 * Partial/duplicate marker states and ambiguous section boundaries remain fail-closed.
 */
export function replaceProductionBaselineBlock(body, baseline) {
  const text = String(body || '');
  const startMarker = `<!-- ${PRODUCTION_BASELINE_START} -->`;
  const endMarker = `<!-- ${PRODUCTION_BASELINE_END} -->`;
  const visibleStartMarker = `\`${PRODUCTION_BASELINE_START}\``;
  const visibleEndMarker = `\`${PRODUCTION_BASELINE_END}\``;
  const markers = [startMarker, endMarker, visibleStartMarker, visibleEndMarker];

  const markerCountsAreCanonical = markers.every((marker) => occurrenceCount(text, marker) === 1);

  if (!markerCountsAreCanonical) {
    return repairMissingProductionBaselineBlock(text, baseline, markers);
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
        evidenceState: 'CURRENT',
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
    evidenceState: 'STALE',
    baselineId: baseline.baselineId,
  };
}
