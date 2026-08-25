# Learning Vocabulary Website Evidence — 2026-08-25

**Status:** PR #535 CREATED / PRE-CHECK COMPLETE / EXACT-HEAD CI PENDING

## Baseline

- Repository: `SvenKulessa/Finance`
- Main-Baseline bei Branch-Erzeugung: `b08b8e0b73e5413aeec286a3522a85448c3e3421`
- Baseline-Inhalt bei Branch-Erzeugung: Merge von PR #531 `[CAPITAL-AI] Vocabulary VW-7 und GoPlus Operations finalisieren`
- Feature-Branch: `feat/learning-vocabulary-website-2026-08-25`
- Vor finaler PR-Ausgestaltung wurde der Branch non-destruktiv per Merge-Commit auf `main@7fc2d25bb5f8b74b1c276b6aaf8f01683cd76c45` synchronisiert.
- Der synchronisierte `main` enthält PR #532 `[CAPITAL-AI] Domain- und Mail-Security-Härtung governance-konform vorbereiten`.
- Die Netto-PR-Differenz bleibt auf die fünf Learning-/Dashboard-/Test-/Evidence-Pfade begrenzt; die beiden #532-Dateien erscheinen nicht im PR-Scope.

## Ziel

Das bereits kanonische CAPITAL-AI Vocabulary wird als read-only Lernoberfläche in die Website integriert:

```text
Hauptzentrale
  -> Learning
     -> CAPITAL-AI Vocabulary
        -> browser-safe Vocabulary Registry
```

Die Website erhält damit keinen zweiten Vocabulary-Speicher und keine eigene Begriffshoheit.

## Kanonische Authority

Die Learning-Oberfläche konsumiert ausschließlich den browser-sicheren Public Entry Point:

`src/platform/Vocabulary/index.ts`

und daraus:

- `createDefaultVocabularyRegistry()`
- `VocabularyConcept`
- `VocabularyCategory`

Die Oberfläche importiert ausdrücklich **nicht** `src/platform/Vocabulary/node.ts` oder Node-only Projection-/Wiki-/Usage-Adapter.

Geltende Architekturregel:

> Projection, not Redefinition.

Die Registry bleibt unter den bestehenden Vocabulary-Verträgen und Governance-Referenzen autoritativ. Learning ist ausschließlich eine Website-Projektion.

## Implementierte Website-Anbindung

### `src/features/learning/ui/LearningVocabulary.tsx`

- zeigt nur Concepts mit `status === 'approved'`;
- DE-/EN-Anzeigename und DE-/EN-Definition;
- stabile Concept-ID;
- kanonischer Code-Term;
- freigegebene Aliase;
- Kategorie und Version;
- ESS-, ADR- und Traceability-Referenzen;
- Suche über Begriff, Definition, Alias, Code-Term und Concept-ID;
- Kategorie-Filter;
- responsive Kartenansicht;
- semantische Design-Tokens ohne lokale Hex-Farben;
- zugängliche Labels und Live-Ergebnisanzahl.

### `src/components/Dashboard.tsx`

Der bestehende Dashboard-Navigationsvertrag wurde bounded erweitert:

- neuer `activeView`: `learning`;
- `learning` gehört zur bestehenden Kategorie `hub` / Hauptzentrale;
- neuer Menüpunkt **Learning** unter Hauptzentrale;
- Breadcrumb `Learning · CAPITAL-AI Vocabulary`;
- Rendering über `<LearningVocabulary />`.

Es wurde kein zweites Router-, Navigation- oder Dashboard-System eingeführt.

## Authority- und Sicherheitsgrenze

Die Learning-Projektion besitzt keine Authority für:

- Financial Runtime oder Markt-/Preiswahrheit;
- Scoring oder Ranking;
- Eligibility oder Trade Execution;
- IAM/Auth;
- Billing/Entitlements;
- Compliance-Entscheidungen;
- Release-/Production-Mutation;
- Vocabulary-Mutation.

Die UI zeigt deshalb explizit einen read-only Authority-Hinweis.

## Datenintegrität

- Keine Concepts wurden in die UI kopiert oder neu angelegt.
- Keine lokale Vocabulary-Liste wurde eingeführt.
- Keine Draft-/Proposed-/Deprecated-/Retired-Concepts werden als freigegebene Lernbegriffe dargestellt.
- Search/Filter ändern ausschließlich die Darstellung, niemals den Registry-Inhalt.
- Keine Finanzwerte, Scores oder Marktdaten werden erzeugt.

## Regression Contract

Neu:

`tests/unit/learningVocabularyIntegration.test.ts`

Der Source-Level-Vertrag prüft unter anderem:

1. Import aus dem browser-sicheren Vocabulary Public Entry Point.
2. Keine Node-only Vocabulary-Imports.
3. Nur `approved` Concepts werden projiziert.
4. Keine lokal kopierte Concept-ID als zweiter Vocabulary-Datensatz.
5. Keine lokalen Hex-Farben in der Learning-Komponente.
6. Learning ist in `activeView`, Hauptzentrale, Breadcrumb und Dynamic Rendering verdrahtet.

## Pre-Check vor Exact-Head-CI

- PR-Klasse nach `scripts/pr/classifyPrScope.mjs`: **C** — Application/Test ohne Runtime-/Dependency-/Docker-/Deployment-Scope.
- Keine `package.json`-, Lockfile-, Server-, Workflow-, Docker- oder Render-Datei im Netto-Diff.
- Offene PRs #533 und #534 wurden auf File-Level-Overlap geprüft; kein direkter Pfadkonflikt mit den fünf Learning-Pfaden.
- Browser-/Node-Grenze des Vocabulary bleibt unverändert.
- Die aktuelle `main`-CI und anschließende Render-Deployment-Verifikation für `main@7fc2d25bb5f8b74b1c276b6aaf8f01683cd76c45` waren erfolgreich; dies ist Baseline-Evidence und kein Testnachweis für den PR-Head.

## Validierungsstatus

Für den finalen PR-Head noch **nicht** als PASS behauptet:

- Governance-/Security-PR-Check
- TypeScript/Lint
- Unit Test Suite
- Production Build
- Hosted `build-and-test`

Diese Checks dürfen erst nach Ausführung auf dem exakten PR-Head als PASS markiert werden.

## PR-/Produktionsstatus

- Pull Request #535 wurde gegen `main` angelegt und wird mit der kanonischen PR-Vorlage 1.5.0 finalisiert.
- Kein Merge durchgeführt; Merge bleibt Human-/CODEOWNER-only.
- Keine Render-, Supabase-, Stripe-, Credential- oder sonstige externe Produktionsmutation durch diesen PR durchgeführt.
