# DEVELOPMENT Chain Execution Policy

Status: ACTIVE  
Date: 2026-08-12  
Updated: 2026-08-16  
Scope: CAPITAL-AI `SvenKulessa/Finance`  
Authority: `docs/architecture/ROADMAP.md`, `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md`, ESS-0019, ESS-0021, ADR-0039, ADR-0057..0066, ADR-0069 Nachtrag 2026-08-16

## Zweck

Diese Policy definiert die verbindliche Ausführungslogik der CAPITAL-AI DEVELOPMENT Chain. Sie trennt Architektur-/Dokumentationsautorität, Repository-Implementierung, externe Plattformmutation, Verifikation und Human/Owner-Autorität voneinander.

Sie erteilt selbst **keine** Mutationsberechtigung. Jede konkrete Mutation benötigt die für den Roadmap-Punkt geltende ADR/ESS/REM-/Approval-Kette.

**Stand 2026-08-16:** Pre-CI-Owner-Gate mit Checkboxen und Review `💪`/`okay` ist **retired**. Merge bleibt Human/Owner-only. Ab **M10** Passkey/WebAuthn für CI-Autorisierung.

## Kanonische Kette

```text
READ-ONLY BASELINE
→ GAP / ROADMAP PACKAGE
→ ESS / ADR / RUNBOOK / TRACEABILITY
→ FRESH SCOPED BRANCH FROM CURRENT MAIN
→ REPOSITORY IMPLEMENTATION
→ PR / GOVERNANCE CHECKS / CI (ohne Checkbox-/Emoji-Gate)
→ HUMAN MERGE
→ BRANCH DELETE
→ READ-ONLY PRE-MUTATION CHECK (wenn externe Mutation erforderlich)
→ EXPLICIT OWNER MUTATION APPROVAL
→ NON-AUTHORIZING MUTATION HANDOFF
→ AUTHORIZED EXECUTION HOST / MUTATION EXECUTOR
→ POST-MUTATION VERIFICATION
→ APPEND-ONLY EVIDENCE
→ ROADMAP / TRACEABILITY SYNC
→ NEXT PHASE
```

Ab **M10** (nach `VERIFIED PASS` Cutover): vor teurer CI zusätzlich Passkey-`AUTHORIZE_PR_CI` laut M10-Runbook.

Ein Schritt darf nicht übersprungen werden, wenn er für den konkreten Roadmap-Punkt als `REQUIRED` markiert ist.

## Grundprinzipien

1. **Roadmap vor Mutation.** Keine externe Plattformmutation ohne vorherige Roadmap-/ADR-/Runbook-Klassifikation.
2. **Sequenzielle Phasen.** M6–M10 bleiben geblockt, bis der jeweilige Vorgänger `VERIFIED PASS` ist.
3. **Fail closed.** Fehlende, abgelaufene, widersprüchliche oder nicht persistierbare Autorisierung führt zu `DENY/STOP`.
4. **Human Merge.** `MERGE` bleibt Human/Owner-only und wird keinem Agenten als Capability übertragen. Checkbox-/Emoji-Zeremonien sind keine Merge-Voraussetzung mehr.
5. **Keine Self-Authority.** Ein Agent darf REM, Capability-Grenzen, Owner-Gates, Audit-Controls oder Kill-Switches nicht zu seinen Gunsten erweitern.
6. **Evidence vor Statusfortschritt.** Ein Roadmap-Punkt wird erst nach positiver/negativer Verifikation und belastbarer Evidence geschlossen.
7. **Keine Secrets in Evidence.** Reusable Credentials, TOTP-Codes/Secrets, Passkey Private Keys, Biometriedaten, rohe Tokens und vollständige sensible Requests/Responses dürfen nicht persistiert werden.
8. **Ein Work Item = ein Branch = ein PR.** Branches werden nicht für nachfolgende Roadmap-Punkte wiederverwendet.
9. **Parallelität nur ohne Schreibkonflikt.** Aktive PRs/Branches werden vor Schreibarbeit auf Changed-File-Overlap geprüft.
10. **Transport ist keine Autorität.** ChatGPT Connector, Claude Tooling, Google AI Studio, MCP, SDK, GitHub Actions oder andere Hosts erhalten Autorität ausschließlich aus der Control Plane.

## Rollen und Ausführungsgrenzen

### Human / Owner

Behält mindestens:

- Architektur-/Roadmap-Freigabe bei sicherheitsrelevanten Entscheidungen;
- finale Merge-Autorität (explizite Anweisung; kein Agent-Self-Merge);
- ab M10: Passkey-Autorisierung für `AUTHORIZE_PR_CI` und privilegierte Step-ups;
- explizite Freigabe externer Produktionsmutationen;
- Owner/Admin-IAM-Elevation, MFA/Break-Glass und Recovery;
- Secret Disclosure/Rotation mit erweitertem Scope;
- destruktive Produktionsdatenoperationen;
- Live Billing/Money/Entitlement;
- Produktionsressourcen-Löschung;
- DNS/TLS/Domain-Ownership;
- Security-Control-Abschwächung.

### Roadmap / Architecture / Documentation Plane

Darf read-only analysieren, Gaps klassifizieren, Roadmap-/ESS-/ADR-/Runbook-/Traceability-/Evidence-Vorgaben erstellen und Mutation Work Orders vorbereiten.

### Development Implementation Plane — Google AI Studio

Google AI Studio ist die Entwicklungsumgebung für Anwendungscode, Architektur und Frontend. Externe Plattformmutationen (Stripe, Supabase, Render) werden dort nicht direkt ausgeführt.

### Production Integration Plane — Claude

Claude ist für Produktionsüberführung und Backend-Konfiguration vorgesehen; Mutationsautorität bleibt an Roadmap, Owner Approval, Handoff und Audit gebunden.

### Systemadmin / Mutation Executor

Nur innerhalb eines gültigen, Human/Owner-approved Mandats. Executor darf `MERGE` nicht ausführen und keine Reserved Human/Owner Actions über Handoff delegieren.

## Parallel Work / Concurrent Writer Gate

Vor jedem neuen Schreib-Workitem: aktuellen `main` SHA, offene PRs/Changed Files und Zielpfade prüfen; bei Overlap `STOP/RESCOPE/SEQUENCE`.

## Branch- und Clone-Lifecycle

```text
current main → fresh scoped branch → commits → PR → Human merge → branch delete
```

Details: `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md`.

## PR-/CI-Klassifikation

Es gilt `docs/governance/PR_CHECK_CLASSIFICATION.md` (D/C/R/M). Owner-Checkbox-/Emoji-Gate ist retired.

## Mutation State Vocabulary

`NOT REQUIRED` | `PLANNED` | `HUMAN APPROVED` | `MUTATED` | `VERIFIED PASS` | `FAILED / ROLLED BACK`

## Mutation Handoff

Nicht autorisierender Arbeitsauftrag. Authority: Roadmap/ADR/ESS + Human/Owner Approval + REM / Agent IAM + M5 Audit.

## Evidence Minimum

Baseline SHA, Authority refs, Branch/PR/Head/Merge SHA, Checkklasse, Mutation Class, Pre/Post Verification, Approval Evidence (wenn erforderlich; ab M10 Passkey-Evidence), Audit refs, Rollback State, Next Gate.

## Stop- und Rollback-Regeln

`STOP` bei unerwartetem Target, Baseline-Drift, fehlender Approval Evidence, Open-PR-Overlap, fehlender Audit-Persistenz, fehlgeschlagenem Pre-Check, unbekanntem Side Effect, Post-Mutation FAILED/INCONCLUSIVE.

## Phase-spezifische Runbooks

- M5A: `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md`
- M6: `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md`
- M7: `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`
- M8: `docs/runbooks/M8_AGENT_CUTOVER.md`
- M9: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- M10: `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`

## Closure Rule

Eine Phase wird nur geschlossen, wenn Roadmap, detaillierte Roadmap, Traceability, betroffene ESS/ADR, Evidence und Mutation State konsistent sind. Der Abschluss eines PRs allein ist kein DevelopmentChain Exit Gate.
