# CV-3 / CV-7 Route & Path Correlation

**Document ID:** `EVID-CV3-CV7-ROUTE-PATH-CORRELATION-2026-08-29`  
**Date:** 2026-08-29  
**Status:** IMPLEMENTATION IN BRANCH  
**Branch:** `fix/crypto-orchestrator-route-correlation-20260829`  
**Base:** `main@935394cd04ee3f0c6702c78ce9c85315e697109a`  
**Work items:** CV-3 Factor & Model Explorer; CV-7 Meme/DeFi Research Lenses; BB-2D/BB-6 frontend strangler correlation.

## Ausgangslage

PR #586 integrierte CV-3/CV-7 und die SC-3 Meme-Profil-Supersession erfolgreich. Seit dessen Head wurden 61 Commits in `main` aufgenommen. Darunter wurden insbesondere Public-/Login-Routen, `AppRoutes.tsx`, `DashboardViewRouter.tsx` und die Feature-Facade-Struktur weiter migriert.

Der fachliche Crypto-Code aus PR #586 blieb erhalten. Die CV-3/CV-7-Komposition lag jedoch weiterhin ausschließlich in `src/components/CryptoScoringEnterprise.tsx`, also im Legacy-Kompatibilitätspfad. Der kanonische Feature-Export `src/features/crypto/ui/index.ts` exportierte dagegen direkt die Basisimplementierung `./CryptoScoringEnterprise` und konnte die Research-Linsen damit umgehen.

## Korrektur

1. `CryptoScoringWorkspace.tsx` wird als feature-owned Composition Root eingeführt.
2. Der Workspace komponiert den bestehenden kanonischen Enterprise Scorer und `CryptoCategoryResearchLenses` ohne Score-Neuberechnung oder zusätzliche Authority.
3. `src/features/crypto/ui/index.ts` exportiert den Workspace als kanonisches `CryptoScoringEnterprise`.
4. `src/components/CryptoScoringEnterprise.tsx` ist nur noch ein dünner Compatibility-Re-Export auf die Feature-Fassade.
5. Damit liefern Legacy-Dashboard-Imports und BB-2D/BB-6-Feature-Facade-Consumer denselben CV-3/CV-7-fähigen Entry Point.

## Main-Korrelation

Seit dem PR-586-Head `cc594bc2ba0c3fbc92f94fbed5db8ff42686b53d` wurden bis `main@935394cd04ee3f0c6702c78ce9c85315e697109a` 61 Commits aufgenommen. Relevante Pfadänderungen betreffen unter anderem:

- `src/app/routing/AppRoutes.tsx`;
- `src/app/dashboard/DashboardViewRouter.tsx`;
- `src/features/public/ui/LandingPage.tsx` (aus `PublicHomepage.tsx` migriert);
- neue Login-/Passkey-Komponenten unter `src/features/public/ui`;
- `src/components/LandingPage.tsx` als Legacy-/Kompatibilitätspfad.

Die produktiven Crypto-/CV-3-/CV-7-Dateien wurden durch diese Main-Änderungen nicht überschrieben. Die notwendige Korrelation ist deshalb eine Entry-Point-/Facade-Korrektur, kein Re-Implementieren des Scorings.

## Security / Data Integrity / Governance

- keine neue API, Dependency oder externe Plattformmutation;
- keine Änderung an AuthN/AuthZ, IAM, Supabase, Stripe oder Render;
- `ScoringModelRegistry -> ScoringDispatcher` bleibt einzige produktive Score-Authority;
- CV-3/CV-7 bleiben presentation/read-only;
- kein Browser-Re-Scoring und keine Gate-PASS-Synthese;
- Legacy-Pfad und Feature-Pfad besitzen keine getrennten Implementierungen mehr;
- offener PR #591 wurde changed-file-basiert geprüft und besitzt keine Überschneidung mit diesem Scope.

## Regression Guard

`tests/unit/cryptoOrchestratorRouteCorrelation.test.ts` schützt:

- Feature-Fassade -> `CryptoScoringWorkspace`;
- Workspace -> Canonical Scorer + CV-3/CV-7 Research Lenses;
- Legacy-Komponente -> reiner Compatibility-Re-Export;
- BB-2D-Dashboard-Router -> Feature-Facade-Importvertrag.

## Validierungsstatus vor PR

Kostenverursachende GitHub-CI wird gemäß Governance erst nach PR-Erstellung ausgeführt. Vor PR werden Main-Sync, changed-file correlation und Scope-Diff erneut geprüft. TypeScript, Unit Tests und Production Build werden vor PR nicht als PASS behauptet.
