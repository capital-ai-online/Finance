export const REQUIRED_PR_SECTIONS = Object.freeze([
  '## 1. 🎯 Kurzüberblick',
  '## 2. 📦 Projekt & Scope',
  '## 3. 🛠️ Umsetzung',
  '## 4. 📌 Priorität & Roadmap',
  '## 5. 🔢 Version & PR-Klasse',
  '## 6. ✅ Prüfung & Merge',
  '## 7. Maschinenlesbare Baseline',
]);

// Existing open PRs from earlier canonical templates remain structurally compatible.
// Newly rendered PRs use the compact, human-first v1.6 headings above.
export const PR_SECTION_ALIASES = Object.freeze({
  '## 1. 🎯 Kurzüberblick': Object.freeze(['## 1. Herkunft', '## 1. Arbeitsauftrag']),
  '## 2. 📦 Projekt & Scope': Object.freeze(['## 2. Projektzuordnung', '## 4. Umfang / Multi-Agent-Koordination']),
  '## 3. 🛠️ Umsetzung': Object.freeze(['## 3. Umsetzung', '## 5. Änderungszusammenfassung']),
  '## 4. 📌 Priorität & Roadmap': Object.freeze(['## 4. Roadmap', '## 6. Architektur- / Governance-Auswirkungen']),
  '## 5. 🔢 Version & PR-Klasse': Object.freeze(['## 5. PR-Klasse', '## 9. PR-Checkklasse und auszuführende Checks']),
  '## 6. ✅ Prüfung & Merge': Object.freeze(['## 6. Prüfung', '## 12. Prüf- und Merge-Bereitschaft']),
  '## 7. Maschinenlesbare Baseline': Object.freeze(['## 3. Produktions-Baseline — maschinenverwalteter / beratender Nachweis']),
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
