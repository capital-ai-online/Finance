# ADR-0029 — Bond Scoring Weights Proposal (ADR-0022 Follow-up)

- Status: Proposed / Pending Review — **kein produktiver Scoring-Pfad, keine Freigabe**
- Date: 2026-08-02
- Scope: Bonds (`src/lib/assetRegistry.ts` `type: 'bond'`)
- Depends on: ADR-0022 (Evidence-gated Bond Scoring Architecture)

## Context

ADR-0022 sperrt Bond Scoring bewusst, bis (a) der Evidence Contract vollständig erfüllt ist (bereits umgesetzt: `src/services/bondFeatureContract.ts`, `src/types/bondScoringContract.ts`, `src/services/eodhdBondEvidence.ts`, alle mit Tests) und (b) "Gewichte … mit einem separaten versionierten Scoring Contract festgelegt werden". Teil (b) fehlte bisher als konkretes Artefakt.

Diese ADR liefert **ausschließlich den Entwurf** dieses separaten Contracts (`src/services/bondScoringWeightsProposal.ts`, `bond-scoring-weights-proposal/0.1.0-draft`) für die fachliche Prüfung. Sie hebt die Sperre aus ADR-0022 nicht auf und ändert `src/types/bondScoringContract.ts`/`src/services/bondFeatureContract.ts` nicht — beide bleiben unverändert die alleinige Instanz, die `score: null` erzwingt.

## Decision

1. `DRAFT_BOND_SCORING_WEIGHTS` schlägt Gewichte für die sieben in ADR-0022 genannten Scoring-Dimensionen vor (Summe = 1.0), jeweils mit Evidenzgrundlage und Begründung im Code selbst.
2. Der Proposal-Contract trägt ein eigenständiges `status`-Feld (`proposed` | `approved` | `rejected`), das **manuell** von einer reviewenden Person gesetzt werden muss — es gibt keinen automatisierten Übergang zu `approved`.
3. `previewHypotheticalBondScore()` existiert ausschließlich für die in ADR-0022 geforderte Golden-Dataset-/Backtesting-Validierung durch Reviewer:innen außerhalb von Produktionspfaden. Die Funktion wirft, solange `status !== 'approved'`.
4. Keine Route, kein Endpunkt und keine UI-Komponente importiert `bondScoringWeightsProposal.ts` (durch Regressionstest erzwungen, siehe unten). Das Proposal ist damit strukturell tot für den produktiven Pfad, bis es explizit verdrahtet wird — und diese Verdrahtung ist ausdrücklich **nicht** Teil dieser ADR.
5. `evaluateBondEvidenceGate()` (ADR-0022, `src/types/bondScoringContract.ts`) bleibt unverändert: `score: null` in jedem Fall, auch bei vollständiger Evidence.

## Was für eine formale Freigabe noch fehlt

Diese ADR macht **keine** Aussage darüber, dass die vorgeschlagenen Gewichte korrekt oder ausreichend validiert sind. Vor einer Freigabe (`status: 'approved'`) sind mindestens erforderlich:

1. Fachliche Prüfung der sieben Dimensionen und ihrer Gewichte durch eine für Fixed-Income-Risikomodelle qualifizierte Person.
2. Ein Golden Dataset (reale historische Bond-Preise/Yields/Ratings mit bekanntem Ausgang) zum Backtesting von `previewHypotheticalBondScore()`.
3. Eine Ratingagentur-Anbindung für den Faktor „Credit quality" — aktuell ohne Provider (`evidenceBasis` vermerkt dies explizit im Proposal).
4. Eine Bond-Spread-/Liquiditäts-Datenquelle für den Faktor „Liquidity" — aktuell ebenfalls ohne Provider.
5. Nach Freigabe: eine eigene, neue ADR oder ein Nachtrag zu dieser ADR, die die tatsächliche Verdrahtung in eine Route beschreibt (analog zu ADR-0025 für traditionelle Assets), inklusive erneuter Regressionstests, die die dann *gewollte* Live-Nutzung erlauben.

## Consequences

- Der ADR-0022-Auftrag „separater versionierter Scoring Contract" hat jetzt ein konkretes, review-fähiges Artefakt statt nur einer Textanforderung.
- Es entsteht keine neue Angriffsfläche für fabrizierte Finanzaussagen: das Proposal kann nicht versehentlich live gehen (Typ-Sperre `scoringEnabled: false`, Laufzeit-Wurf bei `status !== 'approved'`, Regressionstest gegen jede Route-Einbindung).
- Zwei strukturelle Lücken (Rating-Provider, Liquiditäts-Provider) werden durch das Proposal selbst sichtbar gemacht statt verschwiegen.

## Security and operations

- Keine neuen externen API-Calls, keine neuen Secrets.
- Keine Änderung an `src/types/scoringIntegrity.ts`, `src/types/bondScoringContract.ts` oder `src/services/bondFeatureContract.ts`.
- Regressionstests (`tests/unit/bondScoringWeightsProposal.test.ts`) müssen grün bleiben, inklusive des Tests, der jede Route/jeden Server-Einstiegspunkt auf Abwesenheit eines Imports von `bondScoringWeightsProposal.ts` prüft.
