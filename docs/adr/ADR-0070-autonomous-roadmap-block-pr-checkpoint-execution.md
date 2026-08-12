# ADR-0070 — Autonomous Roadmap Block Execution with PR Checkpoints

**Status:** Proposed  
**Date:** 2026-08-12  
**Decision owners:** CAPITAL-AI Owner / Platform Director / Security & Compliance  
**Related:** ESS-0021, ADR-0065, ADR-0058, ADR-0059, ADR-0067, ADR-0068, ADR-0069 Human-Owner Comment Gate, DEVELOPMENT Chain Execution Policy

## Context

ADR-0065 und ESS-0021 erlauben bereits, dass ein Owner-approved Roadmap Execution Mandate (REM) einen bounded Roadmap-Segment statt nur eines einzelnen Pull Requests autorisiert. SA4 hat die Kontrollkette für einen deterministischen docs-only Work Package real bewiesen.

Die verbleibende Lücke ist die sichere Ausführung eines **größeren Repository-Roadmap-Blocks**, der aus mehreren technisch getrennten Implementierungseinheiten besteht. Jede Einheit soll autonom bis zu einem festgelegten Pull-Request-Punkt bearbeitet werden können. Danach bleibt Human Review und Human Merge zwingend. Nach erfolgreichem Merge soll der Systemadmin unter demselben noch gültigen REM mit der nächsten freigegebenen Einheit auf einem frischen Branch aus dem neuen `main` fortfahren können.

Der aktuelle REM-v1-Vertrag besitzt globale `allowedPaths`, `allowedCapabilities` und `maxRiskClass`. Für einen mehrteiligen Block reicht dies nicht als technische Isolation, weil unterschiedliche PR-Einheiten unterschiedliche Pfade, Risiken und Tests benötigen können. Eine rein textuelle Roadmap darf diese technische Lücke nicht als bereits vorhandene Enforcement-Fähigkeit darstellen.

Die aktuelle `main`-Architektur besitzt mit ADR-0069 bereits die Human-Owner-Comment-Gate-/dispatched-CI-Entscheidung. ADR-0070 baut darauf auf und dupliziert diese PR-Gate-Architektur ausdrücklich nicht. Der Systemadmin konsumiert stets die aktuelle kanonische Human-Owner-Policy.

## Decision

### 1. Ein Roadmap-Block ist eine Sequenz von Execution Units

CAPITAL-AI führt den Begriff **Autonomous Roadmap Block (ARB)** ein.

Ein ARB ist kein neuer Roadmap-Statusspeicher. Er ist eine Ausführungsprojektion eines bereits vorhandenen Roadmap-Punkts und besteht aus geordneten **Execution Units (EU)**.

```text
Roadmap Phase / Block
  → EU-01 → PR checkpoint → Human review/merge → branch delete
  → EU-02 → PR checkpoint → Human review/merge → branch delete
  → EU-03 → PR checkpoint → Human review/merge → branch delete
  → optional separate external-mutation gate
  → block closure / traceability sync
```

Der kanonische Phase-/Execution-State bleibt ausschließlich in den bestehenden Roadmaps und Traceability-Matrizen.

### 2. Ein Execution Unit entspricht genau einem Repository Work Item

Für jede EU gilt unverändert:

`one execution unit = one fresh branch = one PR`

Eine EU definiert mindestens:

- eindeutige `unitId`;
- Roadmap-/Authority-Referenzen;
- Vorgänger/Dependencies;
- Ziel und Exit Criteria;
- erlaubte Repository-Pfade;
- erlaubte Capabilities;
- maximale Risikoklasse;
- erlaubte Mutation Classes;
- erforderliche Preflight-Prüfungen;
- positive und negative Tests;
- Evidence-Anforderungen;
- Rollback;
- verpflichtenden PR-Checkpoint.

### 3. PR-Checkpoint ist ein harter Autonomous STOP

Nach Erstellung bzw. Aktualisierung des review-ready PR stoppt die autonome Einheit.

Der Systemadmin darf nicht autonom über folgende Grenze gehen:

`PR READY → aktuelle Human-Owner-Gate-Policy → required CI → Human Merge`

`MERGE` bleibt nicht delegierbar.

CI-/Governance-Reparaturen vor dem finalen Human Review dürfen innerhalb derselben EU und ihres REM-Scope autonom erfolgen. Eine Scope-Erweiterung nach Beginn des finalen Human Review ist verboten.

### 4. Fortsetzung nach Merge unter demselben REM

Ein noch gültiges REM darf mehrere EU-IDs eines Roadmap-Blocks enthalten. Nach Human Merge einer EU darf die nächste EU ohne neue PR-Erstellungsfreigabe beginnen, wenn **alle** Bedingungen erfüllt sind:

1. vorheriger PR ist erfolgreich gemergt;
2. vorheriger Work-Branch ist gelöscht;
3. aktuelles `main` enthält den vorherigen Merge;
4. REM ist weiterhin `OWNER_APPROVED`, nicht abgelaufen/revoked und Kill Switch ist nicht aktiv;
5. nächste EU ist im REM enthalten und laut Roadmap unblocked;
6. per-EU Pfad-/Capability-/Risk-Scope ist technisch enforcebar;
7. kein Open-PR-Overlap besteht;
8. Audit-Persistenz ist verfügbar;
9. keine externe Human-only Mutation ist für den Start der nächsten EU erforderlich.

Fehlt eine Bedingung, gilt `STOP`.

### 5. Per-EU Enforcement ist Voraussetzung für allgemeinen Code-Executor

Der heutige REM-v1-Validator mit globaler Path-Allowlist genügt für den SA4-Pilot, aber nicht für mehrere unterschiedlich gescoped Code-PRs unter einem größeren Block.

Vor Freigabe eines allgemeinen autonomen Repository-Codepfads muss **SA4B** technisch implementieren und verifizieren:

- per-EU `allowedPaths`;
- per-EU Capabilities;
- per-EU Risk Ceiling;
- per-EU Mutation Class;
- per-EU Required Tests/Evidence;
- Branch/Base/Head Binding;
- PR-Checkpoint State;
- previous-merge/branch-delete resume gate;
- self-authority/trust-root deny list;
- no arbitrary shell/command execution from untrusted Roadmap/Issue content;
- permit-before-side-effect und durable outcome für BRANCH/COMMIT/PR/CI_REQUEST.

Bis SA4B `VERIFIED PASS` ist, darf Dokumentation diese Zielarchitektur beschreiben, aber nicht als allgemeine Code-Autorität ausgeben.

### 6. Roadmap Block Contract ist nicht autorisierend

Der maschinenlesbare `DEVELOPMENT_CHAIN_ROADMAP_BLOCK_CONTRACT` beschreibt die technische Zerlegung eines Roadmap-Blocks. Er enthält **keinen eigenen Execution State** und kann keine Authority erzeugen.

Wirksame Autorität entsteht nur aus:

```text
canonical Roadmap state
+ ESS / ADR
+ Owner-approved REM
+ Roadmap Block Contract bound to the approved REM
+ Agent IAM / Policy Gate
+ trusted Execution Host
+ M5 audit permit/outcome
```

Widersprüche werden fail-closed behandelt. Die restriktivere Authority gewinnt.

### 7. Repository-Mutationen und externe Produktionsmutationen bleiben getrennt

Der ARB-Mechanismus darf nach SA4B Repository-Code, Tests, Konfiguration und Dokumentation innerhalb des REM autonom bearbeiten.

Externe Produktionsmutation wird dadurch **nicht** autorisiert. Für Supabase, Render, Stripe oder andere Production Targets gilt weiterhin:

`repository PR merged → read-only production precheck → separate explicit Owner mutation approval → non-authorizing handoff → authorized mutation executor → post-verification`

Nicht delegierbare Owner-Aktionen aus ESS-0021/ADR-0065 bleiben unverändert.

### 8. Keine doppelten Architekturzustände

Folgende Source-of-Truth-Regel ist verbindlich:

| Information | Canonical source |
|---|---|
| Phase/Block status | `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` |
| Systemadmin enablement stage | `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` |
| Human PR authorization/gate | aktuelle `HUMAN_OWNER_PR_APPROVAL_POLICY.md` + ADR-0069 |
| Security/authority | ESS/ADR/Governance Policies |
| Per-EU execution boundary | Roadmap Block Contract bound to REM |
| Runtime authorization | REM + Agent IAM + trusted host |
| Side-effect evidence | M5 append-only audit |
| Requirement→implementation→test→evidence | Traceability matrices |

Ein Contract, Issue, PR-Body oder Agent-Workspace darf keinen konkurrierenden Phase-Status führen.

## Security invariants

1. **Least privilege per EU**, nicht nur pro Gesamtblock.
2. **Fresh main per EU**; kein Branch-Reuse.
3. **Human merge boundary** zwischen allen PR-Checkpoints.
4. **Current Human-gate architecture is reused, not duplicated.**
5. **Fail closed** bei Drift, Overlap, Audit-Ausfall oder unklarer Authority.
6. **No self-authority mutation** durch den Systemadmin.
7. **No arbitrary-command transport** aus Issue-/Roadmap-Text in den Execution Host.
8. **Permit before side effect** für jede mutierende Capability.
9. **Durable terminal outcome** nach jeder mutierenden Capability.
10. **External production writes are separate authority.**
11. **Block status derives from canonical Roadmap + Evidence**, nicht aus Agent-Selbstauskunft.

## Consequences

### Positive

- Ein Owner kann einen größeren, klar zerlegten Roadmap-Block einmalig freigeben.
- Der Systemadmin kann innerhalb dieses Blocks mehrere technische PRs autonom vorbereiten.
- Die bereits kanonische Human-Owner-Comment-Gate-/CI-Architektur wird wiederverwendet statt parallel nachgebaut.
- Human Review/Merge bleibt an jedem riskanten Integrationspunkt erhalten.
- Per-EU Scope reduziert Blast Radius gegenüber einer globalen Path-Allowlist.
- Branch-/Evidence-/Audit-Kette bleibt vollständig rekonstruierbar.
- Roadmap und Runtime-Contract haben getrennte Aufgaben und erzeugen keinen doppelten Architekturstatus.

### Trade-offs

- SA4B benötigt zusätzliche Control-Plane-/Execution-Host-Implementierung.
- Ein größerer REM-Block muss präzise genug zerlegt sein, damit per-EU Scopes enforcebar sind.
- Mehrere PR-Checkpoints reduzieren Autonomie bewusst zugunsten von kontrollierter Integration.

## Rollback

Diese ADR ist zunächst dokumentations-/governance-seitig. Rollback erfolgt durch geschützten Git-Revert.

Falls SA4B später aktiviert wurde, muss vor Governance-Rollback das betreffende REM revoked bzw. der Kill Switch aktiviert werden. Offene Systemadmin-Branches/PRs werden fail-closed gestoppt und nach Evidence-Sicherung geschlossen/gelöscht.

## Exit gate

ADR-0070 ist erst operational umgesetzt, wenn SA4B einen realen Code/Test-Pilot mit mindestens zwei getrennten Execution Units und zwei Human-Merge-Checkpoints nachweist, einschließlich Branch-Löschung und audit-bound BRANCH/COMMIT/PR/CI_REQUEST Evidence.
