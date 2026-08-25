# Capital-AI Learning Platform — Frontend / Routing Evidence

**Status:** IMPLEMENTED ON BRANCH / PRE-PR STATIC VALIDATION COMPLETE  
**Date:** 2026-08-25  
**Authority:** `ESS-0017` / `ADR-0078`  
**Work source:** Chat-Priorität „Vocabulary unter eigenem Reiter Learning mit Überschrift Capital-AI Learning Platform und unter /learning-platform erreichbar“  
**Branch:** `feature/capital-ai-learning-platform-2026-08-25`  
**Branch-Basis:** `main@6283b3618274d36a026a6ce791d3d291945a7f7f`

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

Die direkte Public Route und der interne Learning-Reiter verwenden bewusst dieselbe Komponente. Es entsteht keine zweite Vocabulary-Datenquelle oder zweite Terminologie-Authority.

## Wiederverwendung

Die bereits in PR #535 vorbereitete read-only `LearningVocabulary`-Oberfläche und der vorhandene Learning-Reiter wurden auf einem frischen Branch vom aktuellen `main` wiederverwendet und gegen die aktuelle Routing-/Security-Architektur ergänzt. Die ältere PR-Arbeit wurde nicht blind auf den neuen Main-Stand gemergt.

PR #535 bleibt zum Zeitpunkt dieses Pre-PR-Checks offen und überschneidet sich bewusst mit den übernommenen Learning-/Dashboard-Pfaden. Der neue Branch ist deshalb als fachlich erweiterter Supersession-Kandidat zu behandeln; beide Varianten dürfen nicht unabhängig gemergt werden.

## Implementierte Oberfläche

`src/features/learning/ui/LearningVocabulary.tsx`:

- Überschrift `Capital-AI Learning Platform`;
- ausschließlich Concepts mit `status === 'approved'`;
- DE-/EN-Anzeigenamen und Definitionen;
- stabile Concept-ID;
- Canonical Code Term;
- freigegebene Aliase;
- Kategorie und Version;
- deduplizierte, deterministisch sortierte ESS-/ADR-/Traceability-Referenzen;
- Suche mit `trim + Unicode NFKC + de-DE lowercase`;
- fail-closed Kategorie-Parsing;
- ausschließlich read-only Registry-Projektion.

`src/components/Dashboard.tsx`:

- eigener Reiter `Learning` unter Hauptzentrale;
- eigener `activeView` `learning`;
- Rendering über dieselbe `<LearningVocabulary />`-Komponente.

## Direkte Public Route

`src/app/routing/AppRoutes.tsx` akzeptiert explizit:

- `/learning-platform`
- `/learning-platform/`

Die Route liegt vor dem Session-Gate und ist damit als öffentliche Learning-Seite direkt erreichbar. Sie verwendet keine eigene lokale Concept-Liste, sondern dieselbe `LearningVocabulary`-Komponente wie der Dashboard-Reiter.

## SEO / Canonical / Prerender

`src/lib/routeSeo.ts` definiert für `/learning-platform`:

- eigenen Seitentitel;
- eigene Meta-Description;
- Canonical Path `/learning-platform`.

`scripts/seo/prerender-public-routes.mjs` erzeugt:

`dist/learning-platform/index.html`

mit derselben Canonical URL und denselben route-spezifischen Meta-Daten.

## Production Soft-404 / Security Boundary

Die aktuelle Produktion verwendet eine explizite Public-SPA-Allowlist und liefert unbekannte Pfade absichtlich als HTTP 404 aus. Deshalb wurde `/learning-platform` nicht über einen allgemeinen SPA-Wildcard-Fallback geöffnet.

Stattdessen:

- `server/middleware/seoUrlNormalize.ts` enthält exakt den Literal-Pfad `/learning-platform` in `PUBLIC_SPA_PATHS`;
- `server/runtime/spaFallback.ts` baut den Prerender-Pfad ausschließlich aus serverseitigen Literalen;
- Request-Daten werden weiterhin nicht für Dateisystempfade verwendet;
- ähnlich benannte Pfade wie `/learning-platform-admin` bleiben nicht allowlisted;
- unbekannte Pfade bleiben `404 Not Found`.

Damit bleibt die bestehende Soft-404-/Path-Traversal-Sicherheitsinvariante erhalten.

## Datenintegrität und Authority

Die Learning Platform:

- registriert keine Concepts;
- akzeptiert keine Kandidaten;
- mutiert keine Aliase oder Forbidden Terms;
- definiert keine Concept IDs lokal;
- besitzt keine Financial-, Scoring-, Ranking-, Eligibility-, IAM-, Billing-, Compliance-, Release- oder Production-Authority;
- importiert keine Node-only Vocabulary-Projektion;
- zeigt ausschließlich freigegebene Registry-Daten.

Geltende Regel bleibt:

> Projection, not Redefinition.

## Regression Coverage

Folgende Tests wurden im Branch erweitert bzw. ergänzt:

- `src/lib/routeSeo.test.ts`
  - Learning-SEO und Canonical Path;
  - trailing-slash Normalisierung;
  - fünf Public-SEO-Routen.
- `tests/server/seoUrlNormalize.contract.test.ts`
  - `/learning-platform` explizit allowlisted;
  - ähnlich benannte/unknown Pfade bleiben verboten;
  - canonical trailing-slash Redirect.
- `tests/unit/soft404Intercept.test.ts`
  - Learning-Pfad erhält SPA-Shell;
  - unknown bleibt 404.
- `tests/unit/learningVocabularyIntegration.test.ts`
  - eine kanonische Registry;
  - ein gemeinsames Learning UI für Tab und Public Route;
  - Überschrift `Capital-AI Learning Platform`;
  - SEO/Prerender/Server-Allowlist-Korrelation;
  - keine Aufweichung der Soft-404-Grenze.

## Architekturentscheidung

Kein neuer Router und keine zusätzliche Runtime-Abhängigkeit wurden eingeführt. Der bestehende lightweight Pathname-Router sowie der vorhandene Production-SPA-Fallback werden erweitert. Für diese additive Route ist kein neuer ADR erforderlich; `ESS-0017` / `ADR-0078` bleiben die Vocabulary-Authority, und die vorhandene SEO-/SPA-Routing-Architektur bleibt unverändert führend.

## Pre-PR-Korrelation und Security Review

Finaler statischer Sync dieses Arbeitsstands:

- aktueller `main`: `6283b3618274d36a026a6ce791d3d291945a7f7f`;
- Branch: `12 ahead / 0 behind` vor dieser Evidence-Aktualisierung;
- Merge-Base entspricht exakt aktuellem `main`;
- kein Dependency-, Lockfile-, Workflow-, Credential-, Datenbank- oder externer Plattform-Scope;
- Public-Zugriff wird ausschließlich für den expliziten Literal-Pfad `/learning-platform` ergänzt;
- kein `dangerouslySetInnerHTML`, kein `eval`, kein dynamischer Dateisystempfad aus Request-Daten und keine externe Fetch-/Write-Capability wurden für die Learning-Seite eingeführt;
- Vocabulary bleibt browser-safe und read-only;
- keine Finanz-, Scoring-, Ranking- oder sonstige fachliche Authority wird aus der Public Route abgeleitet.

## Validierungsstatus

Pre-PR statisch abgeschlossen:

- finaler `main`-Sync: PASS;
- Diff-/Scope-Korrelation: PASS;
- Security-/Datenintegritätsreview: PASS nach expliziter Soft-404-Allowlist-Härtung;
- Open-PR-Korrelation: PR #535 besitzt absichtlichen Scope-Overlap und muss durch den späteren konsolidierten PR supersediert statt parallel gemergt werden.

Nicht als PASS behauptet, weil in dieser Connector-Umgebung keine vollständige lokale Repository-Ausführung vorliegt:

- TypeScript/Lint;
- Vitest;
- Production Build;
- Prerender-Ausführung.

Hosted GitHub-CI wird vor PR-Erstellung nicht manuell ausgelöst. TypeScript, Unit Tests, Production Build und der vollständige `build-and-test` bleiben nach PR-Erstellung die maßgebliche Exact-Head-Evidence.

## Rollback

Repository-only Änderung. Ein Human-reviewed Git-Revert ist ausreichend; keine Supabase-, Render-, Stripe-, Credential-, Datenbank- oder sonstige externe Plattformmutation wurde durchgeführt.
