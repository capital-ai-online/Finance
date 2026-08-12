# DEVELOPMENT Chain Execution Policy

Status: PROPOSED
Date: 2026-08-12
Scope: CAPITAL-AI `SvenKulessa/Finance`
Authority: `docs/architecture/ROADMAP.md`, `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`, ESS-0019, ESS-0021 v1.1, ADR-0039, ADR-0057..0069

## Zweck

Diese Policy definiert die verbindliche Ausführungslogik der CAPITAL-AI DEVELOPMENT Chain. Sie trennt Architektur-/Dokumentationsautorität, Repository-Implementierung, autonome Systemadmin-Repository-Ausführung, externe Plattformmutation, Verifikation und Human/Owner-Autorität.

Sie erteilt selbst **keine** Mutationsberechtigung. Jede konkrete Mutation benötigt die für den Roadmap-Punkt geltende ADR/ESS/REM-/Approval-Kette.

## Kanonische Kette

```text
READ-ONLY BASELINE
→ GAP / ROADMAP PACKAGE
→ ESS / ADR / RUNBOOK / TRACEABILITY
→ HUMAN/OWNER AUTHORITY
→ FRESH SCOPED BRANCH FROM CURRENT MAIN
→ REPOSITORY IMPLEMENTATION
→ PR CHECKPOINT
→ HUMAN FILE REVIEW / REQUIRED CI
→ HUMAN MERGE
→ BRANCH DELETE
→ OPTIONAL NEXT REPOSITORY UNIT FROM NEW MAIN
→ READ-ONLY PRE-MUTATION CHECK (wenn externe Mutation erforderlich)
→ EXPLICIT OWNER MUTATION APPROVAL
→ NON-AUTHORIZING MUTATION HANDOFF
→ AUTHORIZED EXECUTION HOST / MUTATION EXECUTOR
→ POST-MUTATION VERIFICATION
→ APPEND-ONLY EVIDENCE
→ ROADMAP / TRACEABILITY SYNC
→ NEXT PHASE
```

Ein Schritt darf nicht übersprungen werden, wenn er für den konkreten Roadmap-Punkt als `REQUIRED` markiert ist.

## Grundprinzipien

1. **Roadmap vor Mutation.** Keine Mutation ohne kanonischen Roadmap-/Authority-Scope.
2. **Ein Statusspeicher.** Phase-/Blockstatus bleibt in den kanonischen Roadmaps; Contracts/Handoffs/Issues/PR-Bodies führen keinen konkurrierenden Status.
3. **Sequenzielle Phasen.** M6–M10 bleiben geblockt, bis der jeweilige Vorgänger `VERIFIED PASS` ist.
4. **Fail closed.** Fehlende, abgelaufene, widersprüchliche oder nicht persistierbare Autorisierung führt zu `DENY/STOP`.
5. **Human Merge.** MERGE bleibt Human/Owner-only.
6. **Keine Self-Authority.** Ein Agent darf REM, Block Contract, Capability-Grenzen, Owner-Gates, Audit-Controls oder Kill-Switches nicht zu seinen Gunsten erweitern.
7. **Evidence vor Statusfortschritt.** Ein Roadmap-Punkt wird erst nach positiver/negativer Verifikation und belastbarer Evidence geschlossen.
8. **Keine Secrets in Evidence.** Reusable Credentials, MFA-Secrets/Codes, Passkey private material, rohe Tokens und vollständige sensible Payloads werden nicht persistiert.
9. **Ein Execution Unit = ein Branch = ein PR.** Branches werden nicht für nachfolgende Roadmap-Punkte/Units wiederverwendet.
10. **Parallelität nur ohne Schreibkonflikt.** Aktive PRs/Branches werden vor Schreibarbeit auf Changed-File-Overlap geprüft.
11. **Transport ist keine Autorität.** ChatGPT/Claude/AI Studio/GitHub Actions/Connector/Issue/Chat erhalten Authority nur aus Control Plane + Human-approved Mandate.
12. **Repository authority ≠ production authority.** Ein autonomer Repository-Block autorisiert keine externe Production Mutation.

## Rollen und Ausführungsgrenzen

### Human / Owner

Behält mindestens:

- sicherheitsrelevante Architektur-/Roadmap-Freigabe;
- Human current-head file review;
- finale Merge-Autorität;
- explizite Freigabe externer Production Mutations;
- Owner/Admin-IAM-Elevation, MFA/Break-Glass/Recovery;
- Secret Disclosure/erweiterte Rotation;
- destruktive Production Data Operations;
- Live Billing/Money/Entitlement;
- Production Resource Deletion;
- DNS/TLS/Domain Ownership;
- Security-Control-Abschwächung.

### Roadmap / Architecture / Documentation Plane

Darf read-only analysieren, Gaps klassifizieren und Roadmap-/ESS-/ADR-/Runbook-/Traceability-/Contract-/Evidence-Vorgaben erstellen.

Diese Plane führt keine externe Plattformmutation allein aufgrund einer Dokumentationsentscheidung aus.

### Development Implementation Plane — Google AI Studio

Google AI Studio ist Entwicklungsumgebung für Anwendungscode, Architektur und Frontend. Produktionsreifer Code darf erstellt werden, sofern Production-Systeme dadurch nicht direkt mutiert werden.

Stripe/Supabase/Render Production Changes werden als Code/Contract/Handoff vorbereitet, nicht direkt aus der Development Plane ausgeführt.

### Production Integration Plane — Claude

Claude ist für Produktionsüberführung/Staging/Integration vorgesehen. Externe Zustandsänderungen benötigen unverändert Roadmap + Owner Approval + Handoff + Control Plane + Audit + Post-Verification.

### Systemadmin Roadmap Executor

Der Systemadmin darf Repository-Mutationen nur innerhalb eines gültigen Human/Owner-approved REM und technisch enforcebaren Execution Hosts ausführen.

Authority: ESS-0021 v1.1, ADR-0065, ADR-0069 und `SYSTEMADMIN_AGENT_ROADMAP_EXECUTION_POLICY.md`.

Der Executor:

- konsumiert exakt gebundene Roadmap Block/Execution Unit IDs;
- validiert REM + per-unit Contract + Capability + Path + Risk + Mutation Class;
- erzeugt Audit Evidence vor und nach jedem Side Effect;
- verwendet keine beliebigen Shell-/Tool-Kommandos aus untrusted Input;
- stoppt an jedem PR-Checkpoint;
- führt MERGE nicht aus;
- führt externe Production Mutation nicht allein aufgrund eines Repository-REM aus.

## Autonomous Roadmap Blocks

Nach SA4B `VERIFIED PASS` darf ein Owner-approved REM mehrere explizite Execution Units eines größeren Roadmap-Blocks autorisieren.

### Architektur

```text
Canonical Roadmap Block
→ Owner-approved REM
→ non-authorizing Roadmap Block Contract
→ EU-01 branch/commit/test/PR → STOP
→ Human review/CI/merge → branch delete
→ EU-02 from new current main → ...
```

Contract:

- `docs/contracts/DEVELOPMENT_CHAIN_ROADMAP_BLOCK_CONTRACT.md`;
- `.ai/contracts/development-chain-roadmap-block.schema.json`.

Der Contract beschreibt per-unit technische Grenzen und enthält keinen Phase-/Execution-State.

### Per-unit effective authority

Eine Operation ist nur erlaubt, wenn sie gleichzeitig in:

- kanonischem Roadmap Gate;
- Owner-approved REM;
- current Execution Unit Contract;
- Agent IAM/Risk Policy;
- nicht geschütztem Trust-Root Scope

zulässig ist.

Die restriktivste Regel gewinnt.

### PR checkpoint

Review-ready PR ist ein harter `STOP_PR_CHECKPOINT_REACHED`.

Der Agent darf vor finalem Human Review scope-konforme CI/Governance-Fehler reparieren. Danach folgen Human Review, required CI und Human Merge. Erst nach Branch Delete darf die nächste Unit geprüft werden.

### Resume gate

Nächste Unit unter demselben REM nur wenn:

1. vorheriger PR Human merged;
2. Merge SHA auf current main;
3. vorheriger Branch gelöscht;
4. vorherige Unit Evidence vollständig;
5. REM weiterhin gültig/approved;
6. Kill Switch inactive;
7. nächste Unit explizit im REM/Contract;
8. Roadmap Gate unblocked;
9. no Open-PR path overlap;
10. M5 Audit verfügbar;
11. kein Human-only external mutation gate dazwischenliegt.

## Parallel Work / Concurrent Writer Gate

Vor jedem neuen Schreib-Workitem/Execution Unit:

1. current main SHA auflösen;
2. offene PRs und Changed Files prüfen;
3. Zielpfade bestimmen;
4. bei Überschneidung `STOP/RESCOPE/SEQUENCE`;
5. bei keiner Überschneidung fresh branch aus current main.

Ein offener Agent-PR darf parallel zu disjunkten Arbeiten laufen, solange keine nicht gemergte Datei als normative Abhängigkeit vorausgesetzt wird.

## Branch- und Clone-Lifecycle

Verbindlich:

```text
current main → fresh scoped branch → commits → PR → Human merge → branch delete
```

Für geklonte Repositories/Worktrees:

- niemals direkt auf main;
- pro Unit neuer Branch;
- gemergte/supersedete Branches nie wiederverwenden;
- nach Merge Remote-Branch löschen;
- kurzlebige Clone-/Worktree-Kopien nach Evidence-Sicherung entfernen.

Details: `DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md`.

## PR-/CI-Klassifikation

Es gilt `PR_CHECK_CLASSIFICATION.md`:

- D — Documentation-only;
- C — Application/Test/Configuration;
- R — Runtime/Dependency/Docker/Deployment;
- M — External Platform Mutation.

Die strengste zutreffende Klasse gilt. CI-Kostenoptimierung darf Security-/Exit-Gates nicht abschwächen.

## Mutation State Vocabulary

Externe Mutation verwendet mindestens:

- `NOT REQUIRED`
- `PLANNED`
- `HUMAN APPROVED`
- `MUTATED`
- `VERIFIED PASS`
- `FAILED / ROLLED BACK`

Repository-only Vorarbeiten können `IMPLEMENTED / CI PENDING` verwenden, ändern aber den externen Mutation State nicht.

## External Mutation Handoff

Der DevelopmentChain Handoff ist nicht autorisierend.

Authority bleibt:

`Roadmap/ADR/ESS + Human Owner Approval + REM/IAM/Execution Host Policy + M5 Audit`.

Contract:

- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`
- `.ai/contracts/development-chain-mutation-handoff.schema.json`

Ein valider Handoff ohne Autorisierung ergibt weiterhin DENY.

## Evidence Minimum

Jeder geschlossene Repository Unit/Phase-Punkt dokumentiert mindestens:

- blockId/unitId/mandateId, wenn autonom;
- Baseline SHA;
- Authority refs;
- Branch / PR / final Head / Merge SHA;
- Checkklasse;
- allowed/changed paths;
- Preflight Result;
- Authorization/Outcome refs für mutierende Capabilities;
- Tests/negative tests;
- Human Review/CI Evidence;
- branchDeleted=true;
- Rollback State;
- Next Gate/resume decision.

Für externe Mutation zusätzlich exact platform/target, Owner approval, pre/post verification und mutation state.

## Stop- und Rollback-Regeln

STOP ist verpflichtend bei:

- unerwartetem Target/Account/Environment;
- stale base / baseline drift;
- expired/revoked REM;
- block/unit/path/capability mismatch;
- Self-Authority/Reserved Action;
- Open-PR overlap;
- fehlender Audit-Persistenz;
- fehlgeschlagenem Precheck/Test;
- CI Budget Violation;
- PR checkpoint reached;
- prior branch not deleted;
- external mutation approval required;
- unbekanntem/nicht reversiblen Side Effect;
- failed/inconclusive post-verification/rollback.

## Phase-spezifische Runbooks

- Systemadmin ARB: `docs/runbooks/SYSTEMADMIN_AUTONOMOUS_ROADMAP_BLOCK_EXECUTION.md`
- M5A: `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md`
- M6: `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md`
- M7: `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`
- M8: `docs/runbooks/M8_AGENT_CUTOVER.md`
- M9: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- M10: `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`

## Enablement boundary

SA4 docs-only autonomy is VERIFIED PASS. General code/test/config Roadmap-block autonomy is **not enabled** until SA4B is VERIFIED PASS according to `SYSTEMADMIN_AGENT_ROADMAP.md` and `SA4B_AUTONOMOUS_ROADMAP_BLOCK_TRACEABILITY.md`.

Normal Human-authorized Development work remains independent of this Systemadmin enablement gate.

## Closure Rule

Eine Phase/Block wird nur geschlossen, wenn Roadmap, Systemadmin Stage (wenn relevant), Traceability, ESS/ADR, Contracts, Evidence, Mutation State und Branch Lifecycle konsistent sind. PR completion alone is never a DevelopmentChain exit gate.
