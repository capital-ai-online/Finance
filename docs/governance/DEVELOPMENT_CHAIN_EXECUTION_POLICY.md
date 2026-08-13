# DEVELOPMENT Chain Execution Policy

Status: PROPOSED
Date: 2026-08-12
Scope: CAPITAL-AI `SvenKulessa/Finance`
Authority: `docs/architecture/ROADMAP.md`, `docs/roadmaps/AI_AGENT_M0_M9_IMPLEMENTATION_ROADMAP.md`, ESS-0019, ESS-0021, ADR-0039, ADR-0057..0066

## Zweck

Diese Policy definiert die verbindliche Ausführungslogik der CAPITAL-AI DEVELOPMENT Chain. Sie trennt Architektur-/Dokumentationsautorität, Repository-Implementierung, externe Plattformmutation, Verifikation und Human/Owner-Autorität voneinander.

Sie erteilt selbst **keine** Mutationsberechtigung. Jede konkrete Mutation benötigt die für den Roadmap-Punkt geltende ADR/ESS/REM-/Approval-Kette.

## Kanonische Kette

```text
READ-ONLY BASELINE
→ GAP / ROADMAP PACKAGE
→ ESS / ADR / RUNBOOK / TRACEABILITY
→ HUMAN/OWNER REVIEW
→ FRESH SCOPED BRANCH FROM CURRENT MAIN
→ REPOSITORY IMPLEMENTATION
→ PR / HUMAN FILE REVIEW / CI
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

Ein Schritt darf nicht übersprungen werden, wenn er für den konkreten Roadmap-Punkt als `REQUIRED` markiert ist.

## Grundprinzipien

1. **Roadmap vor Mutation.** Keine externe Plattformmutation ohne vorherige Roadmap-/ADR-/Runbook-Klassifikation.
2. **Sequenzielle Phasen.** M6–M10 bleiben geblockt, bis der jeweilige Vorgänger `VERIFIED PASS` ist.
3. **Fail closed.** Fehlende, abgelaufene, widersprüchliche oder nicht persistierbare Autorisierung führt zu `DENY/STOP`.
4. **Human Merge.** `MERGE` bleibt Human/Owner-only und wird keinem Agenten als Capability übertragen.
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
- Human File Review;
- finale Merge-Autorität;
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

Diese Plane führt keine externe Plattformmutation allein aufgrund einer Dokumentationsentscheidung aus.

### Development Implementation Plane — Google AI Studio

Google AI Studio ist die Entwicklungsumgebung für Anwendungscode, Architektur und Frontend. Produktionsreifer Code darf dort erstellt werden, wenn er ohne zusätzliche Codeänderung nach den Projektstandards promoviert werden kann.

Änderungen, die Stripe, Supabase oder Render als externe Plattform betreffen, werden in der Development Plane **nicht direkt ausgeführt**. Dort werden nur Code, Kommentare, Contracts und Production-Handoff-Instruktionen vorbereitet.

### Production Integration Plane — Claude

Claude ist für Produktionsüberführung, Staging/Integration und Backend-Konfiguration vorgesehen. Auch diese Plane erhält keine implizite Mutationsautorität: Für externe Zustandsänderungen gelten Roadmap, Owner Approval, Mutation Handoff, Control Plane, Audit und Post-Verification unverändert.

### Systemadmin / Mutation Executor

Der logische Mutation Executor darf nur innerhalb eines gültigen, Human/Owner-approved Mandats und eines technisch enforcebaren Execution Hosts mutieren.

Der Executor:

- konsumiert einen exakt gebundenen Auftrag;
- validiert Capability, Target, Risk, Base/Head und Gültigkeit;
- benötigt bei externer Mutation die separate Mutation Approval Evidence;
- erzeugt Audit-Evidence **vor** und **nach** dem Side Effect;
- darf keine beliebigen Shell-/Tool-Kommandos aus untrusted Input übernehmen;
- darf `MERGE` nicht ausführen;
- darf Reserved Human/Owner Actions nicht über einen Handoff-Contract delegieren.

Die konkrete Systemadmin-Host-/REM-Architektur bleibt autoritativ in ESS-0021, ADR-0065 und `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md`.

## Parallel Work / Concurrent Writer Gate

Vor jedem neuen Schreib-Workitem:

1. aktuellen `main` SHA auflösen;
2. offene PRs und deren Changed Files prüfen;
3. Zielpfade des neuen Workitems bestimmen;
4. bei Überschneidung `STOP/RESCOPE/SEQUENCE`;
5. bei keiner Überschneidung neuen Branch aus aktuellem `main` erzeugen.

Ein offener Agent-/Mutation-PR darf parallel zu einem Dokumentations-PR laufen, sofern deren Schreibmengen disjunkt bleiben und keine nicht gemergte Datei als normative Abhängigkeit vorausgesetzt wird.

## Branch- und Clone-Lifecycle

Verbindliche Sequenz:

```text
current main → fresh scoped branch → commits → PR → Human merge → branch delete
```

Für geklonte Repositories oder temporäre Worktrees gilt zusätzlich:

- niemals direkt auf `main` arbeiten;
- für jedes Workitem einen neuen Branch im Finance Repository verwenden;
- einen gemergten/supersedeten Branch niemals wiederverwenden;
- nach erfolgreichem PR-Merge den zugehörigen Remote-Branch im Finance Repository löschen;
- kurzlebige, nur für dieses Workitem erzeugte lokale Clone-/Worktree-Kopien nach Evidence-Sicherung entfernen.

Details: `docs/governance/DEVELOPMENT_CHAIN_BRANCH_LIFECYCLE_POLICY.md`.

## PR-/CI-Klassifikation

Es gilt `docs/governance/PR_CHECK_CLASSIFICATION.md`:

- `D` — Documentation-only;
- `C` — Application/Test/Configuration;
- `R` — Runtime/Dependency/Docker/Deployment;
- `M` — External Platform Mutation.

Die strengste zutreffende Klasse gilt. Redundante unveränderte CI-Läufe sind zu vermeiden; Sicherheits- oder Exit-Gates dürfen dafür nicht abgeschwächt werden.

## Mutation State Vocabulary

Jede externe Mutation verwendet mindestens einen der Zustände:

- `NOT REQUIRED`
- `PLANNED`
- `HUMAN APPROVED`
- `MUTATED`
- `VERIFIED PASS`
- `FAILED / ROLLED BACK`

Repository-only Vorarbeiten können zusätzlich `IMPLEMENTED / CI PENDING` verwenden, verändern aber den externen Mutation State nicht.

## Mutation Handoff

Der DevelopmentChain Handoff ist ein **nicht autorisierender** Arbeitsauftrag. Er beschreibt exakt, was geprüft, mutiert, verifiziert und bei Fehlern zurückgerollt werden soll.

Authority bleibt außerhalb des Handoffs:

```text
Roadmap/ADR/ESS
+ Human/Owner Approval
+ REM / Agent IAM / Execution Host Policy
+ M5 Audit
```

Contract:

- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`
- `.ai/contracts/development-chain-mutation-handoff.schema.json`

Ein valider JSON-Handoff ohne gültige Autorisierung muss weiterhin `DENY` ergeben.

## Evidence Minimum

Jeder geschlossene Roadmap-Punkt dokumentiert mindestens:

- Baseline SHA / Produktionsbaseline;
- Authority refs;
- Branch / PR / final Head / Merge SHA, soweit zutreffend;
- Checkklasse;
- Mutation Class / Platform / Target;
- Pre-Mutation Result;
- Human Approval Evidence Reference, wenn erforderlich;
- ausgeführte Mutation ohne Secrets;
- Post-Mutation positive und negative Verifikation;
- Audit-/Trace-Referenzen;
- Rollback State;
- finalen Status und Next Gate.

Template: `docs/evidence/templates/DEVELOPMENT_CHAIN_PHASE_EVIDENCE_TEMPLATE.md`.

## Stop- und Rollback-Regeln

`STOP` ist verpflichtend bei:

- unerwartetem Target/Account/Projekt/Environment;
- Baseline-/Head-Drift außerhalb der genehmigten Bindung;
- abgelaufener oder fehlender Approval Evidence;
- Open-PR-Overlap auf mutierenden Zielpfaden;
- fehlender Audit-Persistenz;
- fehlgeschlagenem Pre-Mutation Check;
- unbekanntem oder nicht reversierbarem Side Effect außerhalb des genehmigten Risikos;
- Post-Mutation-Verifikation `FAILED` oder `INCONCLUSIVE`.

Rollback erfolgt nach dem phase-/plattform-spezifischen Runbook. Ein fehlgeschlagener Schritt blockiert die nächste Roadmap-Phase.

## Phase-spezifische Runbooks

- M5A: `docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md`
- M6: `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md`
- M7: `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md`
- M8: `docs/runbooks/M8_AGENT_CUTOVER.md`
- M9: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- M10: `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`

## Closure Rule

Eine Phase wird nur geschlossen, wenn Roadmap, detaillierte Roadmap, Traceability, betroffene ESS/ADR, Evidence und Mutation State konsistent sind. Der Abschluss eines PRs allein ist kein DevelopmentChain Exit Gate.