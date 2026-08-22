export const REQUIRED_PR_SECTIONS = Object.freeze([
  '## 1. Arbeitsauftrag',
  '## 2. Agenten-/Principal-Identität und PR-Erstellungsfreigabe',
  '## 3. Produktions-Baseline — maschinenverwalteter / beratender Nachweis',
  '## 4. Umfang / Multi-Agent-Koordination',
  '## 5. Änderungszusammenfassung',
  '## 6. Architektur- / Governance-Auswirkungen',
  '## 7. Sicherheitsprüfung',
  '### Threat Model',
  '### Negative Tests',
  '### Rollback / Runbook',
  '## 8. Merge-Autorisierung (vereinfacht)',
  '## 9. PR-Checkklasse und auszuführende Checks',
  '## 10. Technische Validierungsnachweise',
  '## 11. Risiko und Rücksetzung',
  '## 12. Prüf- und Merge-Bereitschaft',
]);

export const PR_SECTION_ALIASES = Object.freeze({
  '## 8. Merge-Autorisierung (vereinfacht)': Object.freeze([
    '## 8. Merge-Autorisierung',
  ]),
});

export function normalizePrHeading(text) {
  return String(text || '')
    .replace(/[\u2014\u2013\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function headingCandidates(requiredHeading) {
  return [
    requiredHeading,
    ...(PR_SECTION_ALIASES[requiredHeading] || []),
  ];
}

export function bodyHasRequiredSection(bodyText, requiredHeading) {
  const normalizedLines = new Set(
    String(bodyText || '')
      .split(/\r?\n/)
      .map(normalizePrHeading)
      .filter(Boolean),
  );

  return headingCandidates(requiredHeading)
    .map(normalizePrHeading)
    .some((heading) => normalizedLines.has(heading));
}

export function findMissingRequiredSections(bodyText) {
  return REQUIRED_PR_SECTIONS.filter(
    (heading) => !bodyHasRequiredSection(bodyText, heading),
  );
}

export function canonicalizeKnownSectionHeadings(bodyText) {
  const canonicalByNormalizedAlias = new Map();

  for (const [canonical, aliases] of Object.entries(PR_SECTION_ALIASES)) {
    for (const alias of aliases) {
      canonicalByNormalizedAlias.set(normalizePrHeading(alias), canonical);
    }
  }

  return String(bodyText || '')
    .split(/\r?\n/)
    .map((line) => canonicalByNormalizedAlias.get(normalizePrHeading(line)) || line)
    .join('\n');
}
