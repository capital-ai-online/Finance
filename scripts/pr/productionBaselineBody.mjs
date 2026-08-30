import {
  PRODUCTION_BASELINE_END,
  PRODUCTION_BASELINE_START,
  extractBaselineGeneratedAt,
  extractProductionBaselineBlock,
  fail,
  renderProductionBaselineBlock,
} from './lib.mjs';

const PRODUCTION_BASELINE_SECTION_HEADING = '## 3. Produktions-Baseline — maschinenverwalteter / beratender Nachweis';
const NEXT_SECTION_HEADING = '## 4. Umfang / Multi-Agent-Koordination';

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

  if (
    occurrenceCount(text, PRODUCTION_BASELINE_SECTION_HEADING) !== 1 ||
    occurrenceCount(text, NEXT_SECTION_HEADING) !== 1
  ) {
    fail(
      'PR-Body besitzt keinen eindeutig reparierbaren kanonischen Produktions-Baseline-Abschnitt 3; ' +
        'Auto-Refresh bleibt fail-closed.',
    );
  }

  const sectionStart = text.indexOf(PRODUCTION_BASELINE_SECTION_HEADING);
  const sectionBodyStart = sectionStart + PRODUCTION_BASELINE_SECTION_HEADING.length;
  const nextSectionStart = text.indexOf(NEXT_SECTION_HEADING, sectionBodyStart);
  if (sectionStart < 0 || nextSectionStart < 0 || nextSectionStart <= sectionBodyStart) {
    fail('Kanonische Abschnittsgrenzen für die Produktions-Baseline konnten nicht sicher bestimmt werden.');
  }

  const replacement = renderProductionBaselineBlock(baseline);
  return {
    body: `${text.slice(0, sectionBodyStart)}\n\n${replacement}\n\n${text.slice(nextSectionStart)}`,
    changed: true,
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
