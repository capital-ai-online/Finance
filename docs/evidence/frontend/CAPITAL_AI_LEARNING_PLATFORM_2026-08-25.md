# Capital-AI Learning Platform — Frontend / Routing Evidence

**Status:** RE-CORRELATED AFTER PR #538 / EXACT-HEAD CI PENDING  
**Date:** 2026-08-26  
**Authority:** `ESS-0017` / `ADR-0078`  
**Branch:** `feature/capital-ai-learning-platform-2026-08-25`

## Ziel

Das kanonische CAPITAL-AI Vocabulary wird als gemeinsame read-only Learning-Oberfläche bereitgestellt:

```text
Hauptzentrale
  -> Learning
     -> Capital-AI Learning Platform

https://capital-ai.online/learning-platform
  -> dieselbe LearningVocabulary-Komponente
  -> kanonische browser-safe Vocabulary Registry
```

Die direkte Public Route und der interne Learning-Reiter verwenden dieselbe Komponente. Es entsteht keine zweite Vocabulary-Datenquelle oder zweite Terminologie-Authority.

## Korrelation nach PR #538

PR #538 wurde am 2026-08-26 in `main` gemergt. Der danach maßgebliche Main-Stand ist:

- `main@1a3d26bac1155954a3ab1cde0b72fac5e8351091`;
- #540 wurde mit Merge-Sync `0c0afff33d6a65670dbd2ac7ae97f6cc1c4f4b0a` auf diesen Stand korreliert;
- der Sync-Commit hat den bisherigen #540-Head und den aktuellen Main als Eltern und übernimmt den vollständigen Main-Tree als Grundlage;
- außerhalb der 14 verifizierten #540-Pfade wurden keine Main-Dateien überschrieben.

Der Merge von #538 führt `normalizeVocabularyTerm()` als gemeinsamen lexikalischen Vocabulary-Vertrag ein. #540 konsumiert diesen Vertrag jetzt direkt in `LearningVocabulary.tsx`; die frühere lokale `normalizeSearch()`-Implementierung wurde entfernt.

Der gemeinsame Normalisierungsvertrag lautet:

- `trim`;
- Unicode `NFKC`;
- deterministisches `en-US` Lowercasing.

Damit verwendet die Learning-Suche dieselbe Semantik wie Registry und Skill Engine. Der Integrationstest schützt gegen eine erneute lokale Normalisierungs-Authority.

## Korrelation mit PR #542

PR #542 hat die Plattformversions-Authority auf `package.json#version` konsolidiert. Die zwei überlappenden #540-Pfade wurden vor dem Main-Sync manuell korreliert:

- `src/lib/routeSeo.ts` behält `CAPITAL_AI_VERSION` aus `src/platform/Release/clientVersion.ts` und ergänzt ausschließlich die Learning-Route;
- `scripts/seo/prerender-public-routes.mjs` behält die strikte `package.json#version`-SemVer-Projektion und ergänzt ausschließlich das Learning-Prerender-Artefakt.

Es wurde keine zweite Release-/Version-Authority eingeführt.

## Supersession

PR #535 ist geschlossen und nicht gemergt. #540 ist der alleinige konsolidierte Learning-/Vocabulary-Scope; beide Implementierungen werden nicht parallel gemergt.

## Implementierte Oberfläche

`src/features/learning/ui/LearningVocabulary.tsx`:

- H1 `Capital-AI Learning Platform`;
- ausschließlich Concepts mit `status === 'approved'`;
- DE-/EN-Anzeigenamen und Definitionen;
- stabile Concept-ID;
- Canonical Code Term;
- freigegebene Aliase;
- Kategorie und Version;
- deterministisch deduplizierte Governance-Referenzen;
- Suche über den kanonischen `normalizeVocabularyTerm()`-Contract;
- fail-closed Kategorie-Parsing;
- ausschließlich read-only Registry-Projektion.

`src/components/Dashboard.tsx`:

- eigener Reiter `Learning` unter Hauptzentrale;
- eigener `activeView` `learning`;
- Rendering über dieselbe `<LearningVocabulary />`-Komponente.

## Direkte Public Route

`src/app/routing/AppRoutes.tsx` akzeptiert explizit:

- `/learning-platform`;
- `/learning-platform/`.

Die Route liegt vor dem Session-Gate und ist als öffentliche Learning-Seite direkt erreichbar. Sie verwendet keine lokale Concept-Liste.

## SEO / Canonical / Prerender

`src/lib/routeSeo.ts` definiert für `/learning-platform` einen eigenen Seitentitel, eine eigene Meta-Description und den Canonical Path `/learning-platform`.

`scripts/seo/prerender-public-routes.mjs` erzeugt `dist/learning-platform/index.html` und behält zugleich die aus #542 stammende kanonische Release-Version-Projektion aus `package.json#version`.

## Production Soft-404 / Security Boundary

Die bestehende Public-SPA-Allowlist bleibt fail-closed:

- `server/middleware/seoUrlNormalize.ts` enthält exakt den Literal-Pfad `/learning-platform`;
- `server/runtime/spaFallback.ts` baut den Prerender-Pfad ausschließlich aus serverseitigen Literalen;
- Request-Daten werden nicht für Dateisystempfade verwendet;
- `/learning-platform-admin` und ähnlich benannte Pfade sind nicht allowlisted;
- unbekannte Pfade bleiben `404 Not Found`.

## Datenintegrität und Authority

Die Learning Platform:

- registriert keine Concepts;
- akzeptiert keine Kandidaten;
- mutiert keine Aliase oder Forbidden Terms;
- definiert keine Concept IDs lokal;
- importiert keine Node-only Vocabulary-Projektion;
- zeigt ausschließlich freigegebene Registry-Daten;
- besitzt keine Financial-, Scoring-, Ranking-, Eligibility-, IAM-, Billing-, Compliance-, Release- oder Production-Authority.

Geltende Regel bleibt: **Projection, not Redefinition.**

## Regression Coverage

- `src/lib/routeSeo.test.ts`: Learning SEO, Canonical Path und trailing-slash Normalisierung;
- `tests/server/seoUrlNormalize.contract.test.ts`: explizite Allowlist und negative Pfade;
- `tests/unit/soft404Intercept.test.ts`: Learning-SPA-Shell und 404 für unbekannte Pfade;
- `tests/unit/spaResolvePublicHtml.test.ts`: path-safe feste Prerender-Dateipfade;
- `tests/unit/learningVocabularyIntegration.test.ts`: eine kanonische Registry, gemeinsames Learning UI, kanonischer `normalizeVocabularyTerm()`-Import und keine lokale `normalizeSearch()`-Authority.

## Validierungsstatus

Statisch nach dem #538-Merge abgeschlossen:

- Main-Korrelation: **PASS**;
- #538 Vocabulary-Normalisierungsvertrag übernommen: **PASS**;
- #542 Release-/SEO-Projektion erhalten: **PASS**;
- #535 Supersession: **PASS**;
- Diff-/Scope-Korrelation: **PASS**;
- Security-/Datenintegritätsreview: **PASS**;
- Exact-Head Hosted CI/Governance: **PENDING nach dieser Evidence-Aktualisierung**.

## Rollback

Repository-only Änderung. Ein Human-reviewed Git-Revert des späteren Merge-Commits setzt Learning-Route, Public-Allowlist, Prerender-Route und UI atomar zurück. Keine Supabase-, Render-, Stripe-, Credential-, Datenbank- oder sonstige externe Plattformmutation wurde durchgeführt.
