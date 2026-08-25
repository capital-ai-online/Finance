# Learning Vocabulary Website Evidence — 2026-08-25

**Status:** IMPLEMENTED ON FEATURE BRANCH / HOSTED CI NOT STARTED

## Baseline

- Repository: `SvenKulessa/Finance`
- Main-Baseline bei Branch-Erzeugung: `b08b8e0b73e5413aeec286a3522a85448c3e3421`
- Baseline-Inhalt: Merge von PR #531 `[CAPITAL-AI] Vocabulary VW-7 und GoPlus Operations finalisieren`
- Feature-Branch: `feat/learning-vocabulary-website-2026-08-25`

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

## Validierungsstatus

Noch **nicht** als PASS behauptet:

- TypeScript
- Unit Test Suite
- Production Build
- Hosted `build-and-test`

Die Testdatei wurde angelegt, aber in diesem Branch vor einem PR noch nicht durch gehostete CI ausgeführt.

## PR-/Produktionsstatus

- Kein Pull Request durch diese Umsetzung erzeugt.
- Kein Merge durchgeführt.
- Keine Render-, Supabase-, Stripe-, Credential- oder sonstige Produktionsmutation durchgeführt.
