# Pull Request Execution Rights Classification

Status: REQUIRED
Date: 2026-08-12
Authority: CAPITAL-AI DevelopmentChain

## Zweck

Dieses Dokument ergänzt `PR_CHECK_CLASSIFICATION.md` um die Ausführungs- und Rechteperspektive. Jeder Pull Request muss nicht nur technisch einer Checkklasse D/C/R/M zugeordnet werden, sondern zugleich offenlegen, **wer welche Aktion im Scope ausführen darf, welche zusätzliche Autorisierung erforderlich ist und welche Aktionen unabhängig von der Klasse Human/Owner-reserviert bleiben**.

Normative Quellen:

- `AGENTS.md`
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`
- `docs/governance/DEVELOPMENT_CHAIN_RESPONSIBILITY_MATRIX.md`
- `docs/governance/HUMAN_OWNER_PR_APPROVAL_POLICY.md`
- `docs/governance/PR_CHECK_CLASSIFICATION.md`
- `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md`
- ESS-0021 / ADR-0065 für den Systemadmin Roadmap Executor

## Zwei unabhängige Klassifikationen

Jeder PR muss beide Dimensionen bestimmen:

1. **Checkklasse** — welche technischen Prüfungen erforderlich sind: D, C, R oder M.
2. **Execution Profile** — welche Rolle/Plane die Änderungen vorbereitet oder ausführt und welche Capabilities dafür zulässig sind.

Eine hohe technische Checkklasse erteilt niemals automatisch zusätzliche Rechte.

## Execution Profiles

### P0 — Human / Owner Reserved

Human/Owner-only bleiben mindestens:

- `MERGE`;
- Owner/Admin-IAM-Elevation;
- Owner MFA/Passkey/Break-Glass Recovery;
- Secret Disclosure;
- unbeschränkte Credential Rotation;
- destruktive Produktionsdatenoperationen;
- Live Billing/Money/Entitlement;
- Produktionsressourcen-Löschung;
- DNS/TLS/Domain Ownership;
- Abschwächung von Security-, Audit-, RLS-, Consent-, Branch- oder Repository-Protection;
- Erweiterung der eigenen REM-/Policy-/Capability-Rechte.

Kein D/C/R/M-PR und kein Agentenprofil hebt diese Reservierung auf.

### P1 — Roadmap / Architecture / Documentation Plane

Erlaubt:

- READ / ANALYZE / PLAN;
- Roadmap, Gap, ESS, ADR, Threat Model, Runbook, Contract, Traceability und Evidence-Design;
- Repository-Dokumentation auf frischem Branch;
- COMMIT/PR nur nach geltender ADR-0039-Autorisierung bzw. innerhalb eines gültigen REM.

Nicht erlaubt allein aufgrund dieser Rolle:

- externe Produktionsmutation;
- MERGE;
- P0-Aktionen.

Typische Checkklasse: D.

### P2 — Development Implementation Plane

Erlaubt im Repository:

- READ / ANALYZE / PLAN;
- frischer Branch von aktuellem `main`;
- Anwendungscode, Frontend, Tests, production-ready Konfiguration;
- COMMIT;
- PR erstellen/aktualisieren nach ADR-0039 oder gültigem REM;
- CI anfordern/prüfen und scoped technische Fehler beheben.

Nicht direkt erlaubt:

- Supabase-/Stripe-/Render-Produktionszustand verändern;
- MERGE;
- P0-Aktionen.

Typische Checkklasse: C oder R.

### P3 — Production Integration Plane

Erlaubt:

- Production-Handoff, Staging/Integration und Backend-Konfiguration vorbereiten;
- externe Mutation nur, wenn die konkrete Roadmap-/ADR-/ESS-/Approval-/Control-Plane-Kette dies separat autorisiert.

Nicht erlaubt ohne separate Autorisierung:

- Produktionsmutation allein aufgrund eines PRs oder grüner CI;
- MERGE;
- P0-Aktionen.

Typische Checkklasse: R oder M.

### P4 — Bounded Mutation Executor / Systemadmin REM

Nur bei gültigem REM und technisch enforcebarem Execution Host.

Erlaubt innerhalb des Mandats:

- READ / ANALYZE / PLAN;
- frischer Branch;
- scoped Repository-Änderungen;
- Tests/Evidence;
- COMMIT;
- PR erstellen/aktualisieren;
- CI anfordern/prüfen;
- explizit REM-bound externe Mutation nur mit separater Mutation Approval Evidence, Audit und Post-Verification.

Verboten:

- MERGE;
- Self-Authority / Scope-Erweiterung;
- P0-Aktionen;
- ungebundene Shell-/Tool-Kommandos aus untrusted Input.

Typische Checkklasse: C, R oder M abhängig vom tatsächlichen Scope.

## Mapping Checkklasse → Mindestvoraussetzungen

### D — Documentation-only

Mindestprofil: P1 oder höher berechtigt.

Pflicht:

- vollständiges PR-Template;
- Scope/Authority-Referenz;
- Human/Owner current-head Review + kanonische Viewed-Attestations;
- Governance/Security Checks;
- Docs-Fast-Path + `build-and-test`.

Nicht erforderlich: npm, TypeScript, Unit Tests, Production Build, Docker, externe Mutation.

### C — Application / Test / Configuration

Mindestprofil: P2 oder ein gleichwertig autorisierter P4-Executor.

Pflicht zusätzlich zu D-Governance:

- Git-/Toolchain-Integrität;
- `npm ci`;
- Production Dependency Audit;
- Production Config Invariants;
- Docker-Hardening-Policy-Check;
- TypeScript/Lint;
- Unit Tests;
- Production Build;
- CSP-Test;
- Predeploy-Check;
- `build-and-test`.

Keine externe Plattformmutation aus dieser Klasse ableiten.

### R — Runtime / Dependency / Docker / Deployment

Mindestprofil: P2 für Repository-Code; P3/P4 nur, wenn darüber hinaus autorisierte Integrations-/Mutationstätigkeit vorliegt.

Pflicht zusätzlich zu C:

- Docker Image Build;
- Image User/CMD/Healthcheck;
- Workflow-Security bei Workflow-Änderungen;
- Deployment-/Rollback-Nachweis wenn Produktionsverhalten betroffen ist;
- explizite Angabe, ob der PR nur Repository-Runtime vorbereitet oder nach Merge einen separaten M-Schritt benötigt.

Ein R-PR deployt nicht automatisch produktiv.

### M — External Platform Mutation

M setzt einen separaten externen Mutation-Schritt voraus oder beschreibt ihn verbindlich.

Ausführungsprofil: ausschließlich P3 oder P4 **mit** gültiger, scope-bound Autorisierung; P0 bleibt für reservierte Aktionen zuständig.

Pflicht zusätzlich zu R/C soweit zutreffend:

- autorisierende Roadmap/ADR/ESS;
- konkretes Target/Environment;
- Human/Owner Mutation Approval;
- Pre-Mutation Baseline PASS;
- ausführbares Rollback-Runbook;
- Audit-/Request-/Deployment-Korrelation;
- Post-Mutation Verification PASS;
- Evidence;
- nächster Roadmap-Schritt bis `VERIFIED PASS` blockiert.

## Automatische Auswahlregel

Die PR-Erstellung muss anhand der Changed Files und des geplanten Side Effects mindestens folgende Fragen beantworten:

1. Nur `docs/**`, `.ai/**` oder Markdown und keine Workflow-/Runtime-Datei? → mindestens D.
2. Application/Test/Config ohne Runtime/Deployment? → mindestens C.
3. `Dockerfile`, `package*.json`, `server.ts`, `server/**`, `render.yaml`, Runtime-/Docker-Security oder relevante Workflows? → mindestens R.
4. Soll außerhalb des Repositories ein produktionsverbundener Zustand geändert werden? → M als strengste Klasse.
5. Welche Rolle führt aus? → P1/P2/P3/P4 angeben.
6. Berührt die Aktion P0-reservierte Rechte? → STOP; Human/Owner-only, unabhängig von der technischen Klasse.

Bei mehreren zutreffenden Klassen gilt die strengste Klasse. Bei mehreren Rollen gilt nicht die mächtigste Rolle, sondern nur die für den konkreten Schritt dokumentiert autorisierte Rolle.

## Pflichtfelder im PR

Jeder PR muss ausweisen:

- `Checkklasse: D | C | R | M`;
- `Execution Profile: P1 | P2 | P3 | P4` bzw. `P0 HUMAN REQUIRED`;
- `Ausführender Principal/Agent`;
- `Erlaubte Capabilities`;
- `Nicht erlaubte / reservierte Capabilities`;
- `External Mutation: NONE | PLANNED | HUMAN APPROVED | MUTATED | VERIFIED PASS`;
- Authority-Referenzen;
- erforderliche positive/negative Tests;
- Rollback-/Evidence-Anforderungen;
- Human/Owner Review für aktuellen Head;
- separate Merge-Autorisierung.

## Fail-Closed-Regel

Unklare oder widersprüchliche Einstufung führt nicht zu einer niedrigeren Klasse oder mehr Rechten. Stattdessen gilt:

`AMBIGUOUS → HIGHER CHECK CLASS + LOWER EXECUTION AUTHORITY + HUMAN REVIEW`.

CI-Erfolg ist technische Evidence und erweitert keine Capability.
