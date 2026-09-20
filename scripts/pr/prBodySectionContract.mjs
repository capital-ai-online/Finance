export const REQUIRED_PR_SECTIONS = Object.freeze([
  '## 1. 🧭 Entscheidung',
  '## 2. ✅ Evidence',
  '## 3. 🔍 Technical Evidence',
]);

export const LEGACY_V16_REQUIRED_PR_SECTIONS = Object.freeze([
  '## 1. 🎯 Kurzüberblick',
  '## 2. 📦 Projekt & Scope',
  '## 3. 🛠️ Umsetzung',
  '## 4. 📌 Priorität & Roadmap',
  '## 5. 🔢 Version & PR-Klasse',
  '## 6. ✅ Prüfung & Merge',
  '## 7. Maschinenlesbare Baseline',
]);

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

export function detectPrBodyContractVersion(bodyText) {
  return String(bodyText || '').match(/CAPITAL_AI_PR_TEMPLATE_VERSION:\s*(1\.[0-9]+\.[0-9]+)/)?.[1] || null;
}

function requiredSectionsForVersion(version) {
  if (version === '1.5.0' || version === '1.6.0') return LEGACY_V16_REQUIRED_PR_SECTIONS;
  return REQUIRED_PR_SECTIONS;
}

function headingCandidates(requiredHeading, version) {
  if (version === '1.5.0' || version === '1.6.0') {
    return [requiredHeading, ...(PR_SECTION_ALIASES[requiredHeading] || [])];
  }
  return [requiredHeading];
}

export function bodyHasRequiredSection(bodyText, requiredHeading, version = detectPrBodyContractVersion(bodyText) || '1.7.0') {
  const normalizedLines = new Set(
    String(bodyText || '')
      .split(/\r?\n/)
      .map(normalizePrHeading)
      .filter(Boolean),
  );

  return headingCandidates(requiredHeading, version)
    .map(normalizePrHeading)
    .some((heading) => normalizedLines.has(heading));
}

export function findMissingRequiredSections(bodyText, version = detectPrBodyContractVersion(bodyText) || '1.7.0') {
  return requiredSectionsForVersion(version).filter(
    (heading) => !bodyHasRequiredSection(bodyText, heading, version),
  );
}

// Legacy body repair intentionally converges only the v1.5/v1.6 compatibility
// contract. New v1.7 bodies are rendered directly from the canonical template.
export function canonicalizeKnownSectionHeadings(bodyText, targetVersion = '1.6.0') {
  if (targetVersion !== '1.5.0' && targetVersion !== '1.6.0') return String(bodyText || '');

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
