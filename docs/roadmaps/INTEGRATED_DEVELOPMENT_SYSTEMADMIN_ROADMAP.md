# CAPITAL-AI Integrated Development Chain + Systemadmin Roadmap

**Document ID:** ROADMAP-INTEGRATED-DC-SA-0001  
**Status:** ACTIVE — CANONICAL EXECUTION ROADMAP  
**Version:** 1.0.12  
**Date:** 2026-08-16  
**Repository:** SvenKulessa/Finance  
**Authority:** ADR-0071, ESS-0023, DEVELOPMENT_CHAIN_EXECUTION_POLICY, SYSTEMADMIN_AGENT_ROADMAP_EXECUTION_POLICY, DOCUMENTATION_HYGIENE_POLICY  
**Owner:** SvenKulessa  

---

## 1. Zweck

Dieses Dokument ist die **einzige kanonische Ausführungsroadmap**, die die DEVELOPMENT Chain (M0–M10) und den Systemadmin-Agenten (SA0–SA5) verbindet.  

Es nimmt alle offenen Lücken, Verbesserungsvorschläge und Evidence-Gaps aus den bisherigen Einzel-Roadmaps, dem Architecture Gap Report und den Konsolidierungs-Indizes auf und überführt sie in einen sequenziellen, fail-closed Ausführungsplan.

**Es ersetzt keine restriktivere ADR-, ESS-, IAM-, REM-, Runbook- oder Human/Owner-Authority.**  
Bei Widerspruch gilt immer die restriktivere Regel.

---

## 2. Verbindliche Authority-Reihenfolge

1. Verifizierte Runtime-, Code- und Produktions-Evidence  
2. Ausdrückliche Human/Owner-Freigabe  
3. Spezifische ADR / ESS / IAM / REM / Runbook  
4. Diese Integrated Roadmap  
5. Fach-Roadmaps (SEO-GM, S1, Documentary etc.)  
6. Historische / SUPERSEDED Indizes (nur Evidence-Wert)

---

## 3. Integrierte Phasen-Matrix

| Phase | DEVELOPMENT Chain | Systemadmin | Execution State | Mutation Gate | Next Gate |
|-------|-------------------|-------------|-----------------|---------------|-----------|
| **I0** | M0–M7 Baseline | SA0–SA4 Baseline | **VERIFIED PASS** | read-only preserve | I1 |
| **I1** | M8 Agent Cutover (Abschluss) | Work-Package Catalog Nutzung | **VERIFIED PASS** (2026-08-16) — alle 9 Exit-Gate-Punkte PASS; Exit-2 unter Owner-akzeptiertem Scope geschlossen (`M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md`, `OWNER_ACCEPTED`) | repository only, REM-bound | I2 unblocked |
| **I2** | M9 Assurance / Incident / Break-Glass | SA-Prototyp-Anfragen (ESS-0023) | **UNBLOCKED — not yet started** (M8 VERIFIED PASS) | drills + evidence, jeder Drill einzeln Owner-autorisiert | I3 nach VERIFIED PASS |
| **I3** | M10 Passkey-only Owner PR Authorization | SA5 Design-Vorbereitung | **BLOCKED** | exact-state WebAuthn | I4 nach VERIFIED PASS |
| **I4** | DevelopmentChain Closure | SA5 Bounded External Mutation Design | **BLOCKED** | separate ADR + Owner Approval | Production Mutation möglich |

**Regel:** Documentation readiness authorizes never blocked phase execution.

---

## 4. I1 — M8 Agent Cutover (aktueller ausführbarer Fokus)

### Goal
Provider-neutraler Agent-Cutover: privilegierte Execution über denselben Control-Plane-Pfad mit identischer Capability-Policy. Kein provider-spezifischer privilegierter Bypass bleibt kanonisch.

### Stand 2026-08-16 (Evidence) — I1 abgeschlossen

- Phase 0 + Provider-Profile + SA3B-Verdrahtung + Rollback + Bypass-Audit + Audit-Korrelation: **VERIFIED PASS**
- `chatgpt-github-connector`: alle 6 `ProviderCutoverEvidence`-Felder **true** inkl. `externalHostConfigurationVerified` (`docs/evidence/m8/M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md`) → Readiness **READY**
- Kanonisches Provider-Set korrigiert 2026-08-16 (PR #365, `docs/evidence/m8/M8_PROVIDER_SET_CORRECTION_2026-08-16.md`): **ChatGPT, Claude, Grok**. `google-ai-studio` / `notebooklm` / `gemini` sind jetzt **RETIRED** (DENY im Control Plane), nicht mehr Teil der Matrix
- `claude-code-cli`: **BLOCKED** strukturell (`docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md`) — kein unterstützter privilegierter Produktionspfad
- `grok-xai-connector`: **BLOCKED** aus demselben strukturellen Grund (interaktive, host-vermittelte Connector-Sitzung ohne code-adressierbaren Execution-Host) — kein unterstützter privilegierter Produktionspfad
- Exit-Gate-Punkt 2: **OWNER_ACCEPTED** (2026-08-16, explizite Owner-Antwort "ACCEPT (empfohlen)" via `AskUserQuestion`) — `docs/evidence/m8/M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md`
- M8 Closure: `docs/evidence/m8/M8_CLOSURE_EVIDENCE.md` — **COMPLETE / VERIFIED PASS**

### Systemadmin-Rolle in I1

- Darf bounded Work-Packages aus dem generalisierten Catalog (ADR-0074) für M8-Dokumentation und Tests ausführen
- Darf Mutation Proposals an den Owner stellen (ESS-0023)
- Darf **keine** Provider-Profile oder IAM-Regeln eigenmächtig erweitern
- Execution nur über trusted GitHub Actions Host + OIDC + REM

### Exit Gate I1 (Runbook-9-Punkte, maßgeblich) — 9/9 PASS

1. M7 verified — **PASS**
2. Privileged supported providers on Control Plane — **PASS** (Owner-akzeptierter Scope: mutierende Provider mit produktivem Host = `chatgpt-github-connector`)
3. Policy equivalence — **PASS**
4. No provider-specific privileged bypass — **PASS**
5. Research profiles fail mutation — **PASS**
6. Rollback-to-read-only — **PASS**
7. Audit correlation — **PASS**
8. Evidence + Traceability sync — **PASS** (dieser PR + `M8_CLOSURE_EVIDENCE.md`)
9. Work branches deleted — **N/A / PASS** (kein offener M8-Cutover-Branch)

---

## 5. I2 — M9 Assurance (nach I1)

### Goal
Nachweis, dass die Control Plane gegen Injection, Authorization-Bypass, Replay, Exfiltration, Audit-Outage und Kill-Switch resistent ist und Break-Glass + Rollback funktionieren.

### Required Deliverables
- Prompt/Tool-Injection-Tests
- Authorization-Bypass-Negative-Tests
- Replay/Idempotency-Proof
- Secret/Data-Exfiltration-Guard
- Audit-Completeness + Outage-Verhalten
- Mutation Kill-Switch
- Break-Glass-Procedure (real drill)
- Rollback/Recovery-Drill
- Independent Evidence Review
- Kein unowned CRITICAL Control

### Systemadmin-Rolle
- Darf Assurance-Evidence-Work-Packages ausführen
- Darf Kill-Switch- und Break-Glass-Proposals formulieren
- Ausführung der Drills bleibt Human/Owner-gesteuert

**Startbedingung:** M8 `COMPLETE / VERIFIED PASS` inkl. Owner-ACCEPT auf Exit-Gate-2-Scope.

---

## 6. I3 — M10 Passkey-only Owner PR Authorization

### Goal
Exact-state WebAuthn (Passkey) mit User-Verification für `AUTHORIZE_PR_CI` (Legacy-Emoji/Checkbox-Gates sind bereits retired; M10 ist die nächste starke Schicht).

### Sequence
```
PR OPEN/UPDATE
→ Human file review / Viewed
→ exact PR-state resolution
→ server-generated single-use WebAuthn challenge
→ Owner passkey assertion (UV required)
→ server verifies RP/origin/credential/signature/UP/UV/state freshness
→ immutable approval evidence
→ exactly one CI request consumes approval
→ build-and-test
→ Human merge
```

### Systemadmin-Rolle
- Darf Shadow-Mode und Threat-Model-Evidence liefern
- Darf **keine** Passkey-Enrollment oder Recovery-Codes mutieren

---

## 7. I4 — SA5 + DevelopmentChain Closure

Nach M10 `VERIFIED PASS`:
- SA5 Bounded External Mutation Design (separate ADR erforderlich)
- DEVELOPMENT Chain Closure Evidence
- Alle Arbeitsbranches gelöscht
- Traceability-Matrix vollständig

---

## 8. Übernommene Lücken & Verbesserungsvorschläge

### Aus Architecture Gap Report (historisch, teilweise geschlossen)
- Event-Bus und Registry existieren jetzt (EventMesh)
- Tests existieren in großer Zahl
- Viele Metadata-Gaps sind durch spätere ADRs geschlossen
- Verbleibend: kontinuierliche Manifest- und component.yaml-Hygiene, Digital-Twin-Verträge, vollständige AI-Orchestration-Contracts

### Aus aktuellen Roadmaps
- S1 Security Hardening Revalidation (F-01–F-18 gegen current main)
- Documentary Event Value Chain (D0 Baseline)
- SEO-GM-ROADMAP-0002 (Single Point of Trust)
- AI-Content-Transparency-Contract (P0)
- Continuous Vocabulary Governance

### Verbesserungsvorschläge (Best Practice / SOTA 2026)
1. **Parallelisierung mit Isolation** — Bounded Work-Packages dürfen parallel laufen, solange Path-Overlap und Capability-Ceiling fail-closed geprüft werden (bereits teilweise in ADR-0074)
2. **SLSA Level 4 Ziel** — aktuelle cosign keyless + OIDC ist stark; nächster Schritt: in-toto + Rekor permanente Transparenz
3. **Passkey + Hardware-Bound** — M10 bereits geplant; Hardware-Attestation als optionale Stufe
4. **Observability Correlation** — OpenTelemetry End-to-End von Agent-Action bis Deploy-Identity (teilweise in M5/M7)
5. **Document Hygiene Automation** — H5 Gate bereits in Unit-Tests; ausbauen auf automatische SUPERSEDED → archive Verschiebung

Alle Punkte werden in die jeweiligen Phasen (I1–I4) oder als parallele Bounded Work-Packages aufgenommen.

---

## 9. Dokumentationshygiene — Archivierung

Gemäß `docs/governance/DOCUMENTATION_HYGIENE_POLICY.md` und `docs/archive/README.md`:

### Sofort als SUPERSEDED markieren und nach `docs/archive/legacy/` verschieben (bzw. Status setzen)
- `docs/roadmaps/MARKETING_AGENT_ROADMAP.md` → bereits als SUPERSEDED markiert (SEO-GM)
- `docs/seo/SEO_MANAGEMENT_ROADMAP.md` → bereits als SUPERSEDED markiert (SEO-GM)
- `docs/architecture/ARCHITECTURE_GAP_REPORT.md` → historischer Snapshot (viele Gaps geschlossen); Evidence-Wert behalten unter `docs/archive/evidence/`

### Beibehalten (kanonisch)
- `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` (Detail-Phasen)
- `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` (Detail-SA)
- `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` (Portfolio-Index)
- Diese Integrated Roadmap (neue kanonische Ausführungsautorität)

### Regel
Historische Evidence wird **niemals gelöscht**, nur archiviert. Canonical Documents behalten stabile `documentId`. Pfad ist mutable Metadata.

---

## 10. Branch- & Mutation-Lifecycle (unverändert)

```
current main
→ fresh scoped branch
→ REM / Handoff / Owner Approval (wenn mutation)
→ audited actions (BRANCH → COMMIT → PR)
→ Human file review + CI
→ Human merge
→ branch delete
→ append-only Evidence
→ Roadmap / Traceability Sync
→ next phase
```

Kein Agent darf `main` direkt schreiben.  
Kein Document erzeugt eigene Authority.

---

## 11. Current Next Action (I1 abgeschlossen → I2)

**I1 erledigt (2026-08-16):**
1. PR `docs/m8-exit-gate-a-b-c-2026-08-16` gemergt (PR #362)
2. Owner hat in `docs/evidence/m8/M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md` **ACCEPT** gesetzt (explizite Antwort via `AskUserQuestion`)
3. M8 Closure Evidence (`docs/evidence/m8/M8_CLOSURE_EVIDENCE.md`) + Roadmap-Status `VERIFIED PASS` + Freigabe I2/M9 — dieser PR

**I2 (M9 Assurance) ist jetzt der aktive Fokus, aber:**
- Kein einzelner M9-Drill (Prompt/Tool-Injection, Authorization-Bypass, Replay, Exfiltration, Audit-Outage, Kill-Switch, Break-Glass, Rollback) startet automatisch — jeder braucht eine eigene, konkrete Owner-Anweisung.
- **I2-Bestandsaufnahme erledigt (2026-08-16):** `docs/evidence/m9/M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md` — Prerequisite Gate 7/7 erfüllt, Bestand je Assurance-Domain bewertet (stärkste Grundlage: Kill-Switch/Rollback, schwächste: Prompt/Tool-Injection und Break-Glass — Letzteres braucht zuerst einen Owner-Proposal, da ADR-0063 noch `PROPOSED` ist), priorisierter Vorschlag für die Drill-Reihenfolge dokumentiert.
- **Kill-Switch-Live-Drill erledigt (2026-08-16):** Owner-Wahl „Kill-Switch-Live-Drill (empfohlen)" via `AskUserQuestion` → `docs/evidence/m9/M9_KILL_SWITCH_LIVE_DRILL_2026-08-16.md`. Alle vier realen mutierenden Capabilities gegen die live-wired SA3B-Kette angegriffen und verweigert; READ/ANALYZE/PLAN bleiben erhalten; 9 neue Tests. Trägt zu M9-Exit-Gate-Punkt 3 bei (teilweise — nur SA3B als einziger produktiver Aufrufer).
- **Rollback/Recovery-Live-Drill erledigt (2026-08-16):** Owner-Wahl „Rollback/Recovery-Drill (empfohlen)" via `AskUserQuestion` → `docs/evidence/m9/M9_ROLLBACK_RECOVERY_LIVE_DRILL_2026-08-16.md`. Provider-Profil-Registry-Rollback-Hebel für alle 3 kanonischen Provider als Baseline→Rollback→Recovery-Sequenz bewiesen, inkl. Registry-Unveränderlichkeitsnachweis; 4 neue Tests. Trägt zu M9-Exit-Gate-Punkt 5 bei (teilweise).
- **Audit-Outage-Live-Drill erledigt (2026-08-16):** Owner-Wahl „Audit-Outage-Drill (empfohlen)" via `AskUserQuestion` → `docs/evidence/m9/M9_AUDIT_OUTAGE_LIVE_DRILL_2026-08-16.md`. Terminal-Outage-Fehlerinjektion, struktureller Append-only-Beweis, end-to-end-Korrelation für echte mutierende Capability; 3 neue Tests. Trägt zu M9-Exit-Gate-Punkt 2 bei (teilweise — Audit-Anteil).
- **Replay/Idempotency-Live-Drill erledigt (2026-08-16):** Owner-Wahl „Replay/Idempotency-Drill (empfohlen)" via `AskUserQuestion` → `docs/evidence/m9/M9_REPLAY_IDEMPOTENCY_LIVE_DRILL_2026-08-16.md`. Fand und schloss eine reale Integrationslücke (Envelope-Replay-Schutz existierte, war aber nicht über den realen SA3B-Aufrufer erreichbar — additiv nachverdrahtet nach `killSwitchActive`-Präzedenzfall); 5 neue Tests. Trägt zu M9-Exit-Gate-Punkt 2 bei (Replay-Anteil vollständig).
- **Authorization-Bypass-Live-Drill erledigt (2026-08-16):** Owner-Wahl „Authorization-Bypass-Negativtests (empfohlen)" via `AskUserQuestion` → `docs/evidence/m9/M9_AUTHORIZATION_BYPASS_LIVE_DRILL_2026-08-16.md`. Alle 9 Runbook-Angriffsvektoren jetzt über die reale SA3B-Kette bewiesen (6 neu getestet, 3 bereits live bewiesen zitiert); 7 neue Tests. Trägt zu M9-Exit-Gate-Punkt 2 bei (Authorization-Bypass-Anteil vollständig).
- **Secret/Exfiltration-Live-Drill erledigt (2026-08-16):** Owner-Wahl „Secret/Exfiltration-Drill (empfohlen)" via `AskUserQuestion` → `docs/evidence/m9/M9_SECRET_EXFILTRATION_LIVE_DRILL_2026-08-16.md`. Fand und schloss zwei reale Redaction-Lücken (camelCase-Präfix-Schlüssel wie `customerEmail`; fehlende TOTP/Recovery/Backup-Code-Benennungen); alle Runbook-Kategorien über die reale SA3B-Kette bewiesen; 3 neue Tests. Trägt zu M9-Exit-Gate-Punkt 2 bei (Exfiltration-Anteil vollständig).
- **Prompt/Tool-Injection-Live-Drill erledigt (2026-08-16):** Owner-Wahl „Prompt/Tool-Injection-Tests (empfohlen)" via `AskUserQuestion` → `docs/evidence/m9/M9_PROMPT_TOOL_INJECTION_LIVE_DRILL_2026-08-16.md`. Beweist, dass alle typisierten Autorisierungsfelder gegen adversarielle Payloads immun sind (18 neue Tests).
- **Untrusted-Content-Detector-Arbeitspaket erledigt (2026-08-16):** Owner-Wahl „Untrusted-Content-Detector-Arbeitspaket (empfohlen)" via `AskUserQuestion` → `docs/evidence/m9/M9_UNTRUSTED_CONTENT_DETECTOR_WORK_PACKAGE_2026-08-16.md`. Löst den offenen Fund des vorherigen Drills auf: kein Detektor gebaut, stattdessen architekturell bewiesen, dass aktuell kein Codepfad Freitext in Autorisierung überführt (vorher **ungetestete** Issue-Validatoren `validateSa4PilotIssue.mjs`/`validateWorkPackageIssue.mjs`/`validateExecutionIssue.mjs` jetzt mit 38 neuen Tests); `package.json` `test`-Skript erweitert, damit diese in CI laufen. Trägt zu M9-Exit-Gate-Punkt 2 bei (Injection-Anteil jetzt vollständig).
- **Break-Glass-Proposal ACCEPTED + Logik-Ebene implementiert (2026-08-16):** Owner-Wahl „M9 zuerst fertigstellen" (nach Anfrage, mit M10/Passkey fortzufahren — laut Runbook durch M9-Vollständigkeit gesperrt), dann „ACCEPT" auf `docs/evidence/m9/M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md` (additives, eng begrenztes REM-Mandat, max. 30 Min, eine Capability, Owner-AAL2-Step-up-Aktivierung über den bestehenden M5A-Mechanismus). Implementiert als reine, getestete Policy-Logik (`src/platform/Security/breakGlass.ts`, 27 neue Tests inkl. Live-Beweis über die reale SA3B-Kette) — siehe `docs/evidence/m9/M9_BREAK_GLASS_LOGIC_IMPLEMENTATION_2026-08-16.md`. **Kein live erreichbarer Endpunkt, kein Drill ausgeführt, ADR-0063 bleibt PROPOSED** — beides eigene, separat zu autorisierende nächste Schritte.
- **Break-Glass Live-Wiring erledigt (2026-08-16):** Owner-Wahl „Break-Glass live verdrahten (empfohlen)" via `AskUserQuestion` → `docs/evidence/m9/M9_BREAK_GLASS_LIVE_WIRING_2026-08-16.md`. Echter, Owner+Step-up-gated HTTP-Endpunkt (`server/systemadmin/breakGlassRouter.ts`, gemountet unter `/api/systemadmin/break-glass`), In-Memory-Widerruf-Persistenz (begründet gegen eine neue Supabase-Tabelle entschieden), 10 neue HTTP-Level-Tests. Dokumentierter, unbehobener Nebenbefund: `requireStepUp()` filtert `purpose` beim Konsum nicht (betrifft alle Step-up-gated Endpunkte). **Kein Drill ausgeführt, ADR-0063 bleibt PROPOSED.**
- **Break-Glass-Drill ausgeführt und Post-Event-Review Owner-signiert (2026-08-16):** Owner-Wahl „Break-Glass-Drill durchführen (empfohlen)" via `AskUserQuestion` → `docs/evidence/m9/M9_BREAK_GLASS_LIVE_DRILL_2026-08-16.md`. Alle 8 Runbook-Anforderungen an Assurance Domain 7 geprüft und bestanden. Während der Drill-Vorbereitung wurde eine reale Lücke gefunden und additiv geschlossen: explizite Widerruf-Durchsetzung fehlte in der realen Autorisierungskette (Router-`revoked`-Zustand wirkte bisher nur auf `/status`, nicht auf die tatsächliche Autorisierungsentscheidung) — neues, im OWNER-akzeptierten Proposal §2.7 bereits spezifiziertes `breakGlassRevoked`-Flag in `roadmapExecutionMandate.ts` (`evaluateMandateScope`), auf den `REM-BREAK-GLASS-*`-Namensraum beschränkt. 5 neue Tests. Der laut Proposal §2.8 verpflichtende Post-Event-Review (`.ai/evidence/break-glass/BREAK-GLASS-M9-DRILL-2026-08-16-01-POST-REVIEW.md`) wurde vom Owner explizit signiert ("signing" / "führe signature durch", 2026-08-16) — **M9-Exit-Gate-Punkt 4 gilt damit als formal erfüllt.** Zwei nicht-blockierende Folgepunkte bleiben dokumentiert offen (Broker-Anbindung des Widerruf-Hebels; `requireStepUp()`-`purpose`-Filter). ADR-0063 bleibt PROPOSED.
- **Independent Evidence Review erledigt (2026-08-16):** Owner-Anweisung „führe Independent evidence Review durch bevor ich den pull request merge" (PR #404 wurde vom Owner bereits gemergt, bevor der Review abschloss — transparent kommuniziert, keine Rücknahme). Durchgeführt von einem frischen, an keiner M9-Implementierung beteiligten Sub-Agenten (keine Selbstprüfung) → `docs/evidence/m9/M9_INDEPENDENT_EVIDENCE_REVIEW_2026-08-16.md`. Gesamtverdikt „Ja, mit Vorbehalten" — kein CRITICAL-Fund, `npm run lint`/`npx vitest run` unabhängig neu ausgeführt (195/1204, deckungsgleich), repository-weiter Skip-Test-Scan ohne Treffer. 4 dokumentierte Folgepunkte (F1: Break-Glass-Widerruf-Hebel ohne realen Broker-Aufrufer; F2: `requireStepUp()`-`purpose`-Filter fehlt, jetzt MEDIUM–HIGH eingestuft statt nur als Nebenbefund; F3: Mocked-Supabase-Vorbehalt in 3 von 8 Domain-Dokumenten nicht explizit wiederholt; F4: Runbook-Kopf und Traceability-Matrix zeigen weiterhin „BLOCKED BY M8", veraltet). **M9-Exit-Gate-Punkt 6 gilt als formal erfüllt.** M9 als Ganzes bleibt wegen Punkt 9 (Traceability-Sync, F4) und Punkt 10 (Branch-Bereinigung, ungeklärt) weiterhin nicht `COMPLETE / VERIFIED PASS`.
- **Exit-Gate-Punkte 9 und 10 adressiert (2026-08-16):** Owner-Anweisung „fahre mit den letzten Schritten um M9 fort" → `docs/evidence/m9/M9_EXIT_GATE_ITEMS_9_10_2026-08-16.md`. Punkt 9: Runbook-Status-Header (`M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`) und Traceability-Matrix-Zeile korrigiert von „BLOCKED BY M8" zu „IN PROGRESS — NOT YET COMPLETE / VERIFIED PASS" (bewusst keine pauschale COMPLETE-Behauptung, da mehrere Punkte laut Review nur teilweise erfüllt sind). Punkt 10: verifiziert, dass der Review-Fund auf einer veralteten, nicht-geprunten lokalen Branch-Ansicht beruhte — nach `git fetch --prune` existiert auf dem geteilten Repository kein M9-zuordenbarer verwaister Branch. **M9-Exit-Gate-Punkte 1, 6, 7, 9, 10 jetzt vollständig erfüllt; Punkte 2, 3, 4, 5, 8 bleiben laut Independent Review teilweise erfüllt.**
- **M9 formal COMPLETE / VERIFIED PASS (2026-08-17):** Owner-Wahl „F2 beheben, dann M9 formal COMPLETE erklären (empfohlen)" via `AskUserQuestion`, nach einer Owner-Anweisung „starte mit M10 der Passkey autorisierung für pull requests" die zunächst erneut den M9-Gate-Check auslöste (Owner-Antwort: „doch erst M9 vollständig abschließen" — Gate bestätigt, nicht übergangen). Der einzige tatsächlich behebbare Independent-Review-Fund wurde geschlossen: `requireStepUp()` (`src/platform/Security/authMiddleware.ts`) verlangt jetzt ein Pflicht-`purpose`-Argument, gegen den bei Ausstellung gespeicherten Wert geprüft — betrifft alle drei realen Aufrufer (`adminDiagnostics.ts`, `breakGlassRouter.ts`, `versionManager.ts`), 3 neue Tests, siehe `docs/evidence/m9/M9_STEPUP_PURPOSE_FILTER_FIX_2026-08-17.md`. Die verbleibenden strukturellen Residuen (F1, F3, SA3B-Only-Aufrufer-Beschränkung) wurden vom Owner explizit als für diesen Entwicklungsstand ausreichend akzeptiert. **Alle 10 Exit-Gate-Punkte erfüllt** — Autoritatives Abschlussdokument: `docs/evidence/m9/M9_CLOSURE_EVIDENCE.md`. Runbook-Status-Header und Traceability-Matrix auf `COMPLETE / VERIFIED PASS` aktualisiert. **M10-Prerequisite-Gate ist erfüllt.**
- **M10 Phase 1 (Trusted PR State Resolver) implementiert (2026-08-17):** Owner-Wahl „Phase 1: Trusted PR State Resolver (empfohlen)" via `AskUserQuestion` → `docs/evidence/m10/M10_PHASE1_TRUSTED_PR_STATE_RESOLVER_2026-08-17.md`. Neues `server/m10/githubPrStateResolver.ts` — löst Base-/Head-SHA, sortierte Datei-Liste und kanonischen Diff-Digest immer frisch über eine injizierte GitHub-API-Abhängigkeit auf; die Anfrage-Signatur (`{repository, prNumber}`) kann strukturell keinen agentengelieferten Hash als autoritativ akzeptieren (ADR-0066-Anforderung). Reale `fetch()`-basierte GitHub-Implementierung enthalten, aber bewusst nicht verdrahtet — kein neuer Dependency (kein Octokit). 19 neue Tests, inkl. TOCTOU- und Diff-Substitutions-Abwehrbeweisen. Datei zur SA3-Self-Authority-Denylist hinzugefügt. **Kein HTTP-Endpunkt, keine WebAuthn-Challenge (Phase 2), ADR-0066 bleibt PROPOSED** — jeweils eigene, separat zu autorisierende nächste Schritte.
- **M10 Phase 2 (Challenge Issuance) implementiert (2026-08-17):** Owner-Anweisung „start Phase 2" → `docs/evidence/m10/M10_PHASE2_CHALLENGE_ISSUANCE_2026-08-17.md`. Neues `server/m10/challengeIssuance.ts` — `issueM10Challenge()` löst intern immer frisch über Phase 1 auf (nimmt nie einen bereits aufgelösten Kontext vom Aufrufer entgegen), erzeugt kryptographisch zufällige, 2 Minuten gültige Einmal-Challenges über die bereits bestehende `generateOpaqueToken()`. Austauschbare `M10ChallengeStore`-Schnittstelle (`save`/`get`/`markConsumed`/`revoke`) statt einer festen Persistenz-Entscheidung — In-Memory-Referenzimplementierung für Tests, echte Backend-Wahl bewusst dem Live-Wiring-Schritt überlassen. Kanonischer Autorisierungs-Digest exakt nach ADR-0066-§3-Formel implementiert. 18 neue Tests, inkl. Einmal-Verbrauch-Beweis (Replay schlägt fehl) und Digest-Bindung an Head-SHA/Diff/ChallengeId. Datei zur SA3-Self-Authority-Denylist hinzugefügt. **Keine WebAuthn-Verifikation (Phase 4), kein HTTP-Endpunkt, ADR-0066 bleibt PROPOSED.**
- **M10 Phase 3 (Owner Credential Enrollment, Code/Logik) implementiert (2026-08-17):** Owner-Wahl „@simplewebauthn/server hinzufügen (empfohlen)" via `AskUserQuestion`, dann Owner-Anweisung „start Phase 3" → `docs/evidence/m10/M10_PHASE3_OWNER_CREDENTIAL_ENROLLMENT_2026-08-17.md`. Neue Dependency `@simplewebauthn/server` (Owner-autorisiert, 0 `npm audit`-Schwachstellen) für echte WebAuthn-Attestation-Verifikation statt Eigenimplementierung. Neues `server/m10/credentialEnrollment.ts` — `beginM10CredentialEnrollment()`/`completeM10CredentialEnrollment()`/`revokeM10Credential()` sind strukturell Owner-only (lehnen jede Nicht-Owner-ID sofort ab), verlangen `userVerification: 'required'` (nicht die laxere Bibliotheks-Vorgabe), verbrauchen die Registrierungs-Challenge bei jedem Verifikationsversuch (auch bei Fehlschlag), persistieren ausschließlich minimales öffentliches Credential-Material (nie privater Schlüssel/Attestation-Objekt/biometrische Daten). 20 neue Tests. **Kein echtes Owner-Enrollment fand statt** — strukturell unmöglich für einen Agenten, erfordert einen realen Browser/Authenticator. Kein HTTP-Endpunkt, keine Persistenz-Entscheidung, ADR-0066 bleibt PROPOSED.
- **M10 Phase 3 live verdrahtet (2026-08-17):** Owner-Anfrage „Passkey enrollment" → Feststellung, dass Enrollment mangels Live-Wiring technisch noch nicht möglich war → Owner-Wahl „Live-Wiring jetzt bauen (empfohlen)" via `AskUserQuestion` → `docs/evidence/m10/M10_PHASE3_LIVE_WIRING_2026-08-17.md`. Neue Supabase-Migration (`m10_registration_challenges`, `m10_owner_credentials`, Service-Role-only RLS, noch nicht angewendet — geschieht beim Merge/Deploy), Supabase-gestützte Store-Implementierungen, echter Owner+Step-up-gated HTTP-Endpunkt (`/api/m10/credential-enrollment/*`), neue Dependency `@simplewebauthn/browser` (0 Audit-Schwachstellen), minimale Owner-UI (neuer Tab im Supervisor-Dashboard). 28 neue Tests; `vite build`/`esbuild`-Produktionsbuilds beide verifiziert. **Kein echtes Owner-Enrollment fand statt** — bleibt zwingend eine eigene, ausschließlich vom Owner selbst durchführbare Aktion, jetzt aber nach Merge/Deploy technisch möglich.
- **M10 Phase 3 Produktions-Incident gefunden und behoben (2026-08-17):** Owner-Bericht „die Passkey Registrierung im Supervisor Dashboard registriert die Passkey erstellung nicht" → `docs/evidence/m10/M10_PHASE3_PRODUCTION_INCIDENT_FIX_2026-08-17.md`. Zwei unabhängige Ursachen gefunden: (1) Die in PR #411 beschriebene Annahme, die Migration rolle automatisch über den Deploy-Prozess aus, war falsch — es existiert kein solcher Automatismus in diesem Repository (verifiziert per Grep über alle Workflows, fehlende `supabase/config.toml`, historischer Präzedenzfall in einer älteren Migration); `mcp__Supabase__list_tables` bestätigte, dass beide Phase-3-Tabellen in Produktion fehlten. Nach expliziter Owner-Freigabe („Ja, Migration jetzt gegen Produktion anwenden (empfohlen)" via `AskUserQuestion`) wurde die bereits per PR #411 review-geprüfte, rein additive Migration via `mcp__Supabase__apply_migration` direkt angewendet — beide Tabellen existieren jetzt mit aktivem RLS, `mcp__Supabase__get_advisors` zeigt keinen neuen Fund. (2) Mehrere Store-Aufrufe in `credentialEnrollment.ts` waren nicht gegen Fehler abgesichert — ein von der echten Supabase-Store-Implementierung geworfener Fehler propagierte unbehandelt, statt eine saubere `DENY`-Antwort zu liefern; jetzt mit try/catch um jeden Store-Aufruf in allen drei Funktionen behoben. 6 neue Regressionstests (200 Dateien/1298 Tests gesamt, alle PASS). Die Migration ist bereits unabhängig vom Code-Deploy in Produktion wirksam; der Code-Fix erreicht Produktion mit dem nächsten Deploy.
- Nächster Schritt: Owner registriert nach diesem Deploy selbst einen echten Passkey über den Dashboard-Tab, oder entscheidet über Phase 4 (Assertion Verification) bzw. die Live-Verdrahtung der Phasen 1-2 (`docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`).

**Nicht ausführbar ohne separate Owner-Freigabe:**
- M9-Drills / M10 / SA5
- Claude-Code Real-Caller (eigenes ADR erforderlich)
- Jede Produktions-, IAM-, Secret-, Deploy- oder HIGH/CRITICAL-Mutation

---

## 12. Abschlusskriterien der Integrated Roadmap

Die Roadmap gilt als geschlossen, wenn:

- I0–I4 alle `VERIFIED PASS`
- P0/P1 Prioritäten geschlossen oder Owner-akzeptiert
- Kein unowned HIGH/CRITICAL Control
- Alle produktiven Mutationen Owner-genehmigt und evidence-gebunden
- Traceability-Matrix vollständig
- Alle SUPERSEDED-Dokumente archiviert
- Alle gemergten Arbeitsbranches gelöscht

---

## Related Documents

- `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`
- `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md`
- `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md`
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`
- `docs/governance/SYSTEMADMIN_AGENT_ROADMAP_EXECUTION_POLICY.md`
- `docs/governance/DOCUMENTATION_HYGIENE_POLICY.md`
- `docs/contracts/DEVELOPMENT_CHAIN_MUTATION_HANDOFF_CONTRACT.md`
- `docs/adr/ADR-0071-consolidated-roadmap-and-requested-systemadmin-mutations.md`
- `docs/adr/ADR-0074-generalized-systemadmin-work-package-catalog.md`
- `.ai/skills/ESS-0023-Consolidated-Systemadmin-Prototype-and-Mutation-Request.md`
- `docs/evidence/m8/M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md`
- `docs/evidence/m8/M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md`

---

## Version History

| Version | Date       | Description                                      |
|---------|------------|--------------------------------------------------|
| 1.0.0   | 2026-08-15 | Initial Integrated Roadmap — connects DC + SA, absorbs all open gaps and improvement suggestions |
| 1.0.1   | 2026-08-16 | I1 sync: externalHostConfigurationVerified PASS; Exit-Gate-2 Scope-Proposal; M9 remains blocked |
| 1.0.2   | 2026-08-16 | I1 COMPLETE / VERIFIED PASS: Owner accepted Exit-Gate-2 scope decision; M8 Closure Evidence; I2 (M9) unblocked as a phase, each drill still separately Owner-authorized |
| 1.0.3   | 2026-08-16 | I2 entry: read-only inventory/gap analysis (`M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md`) — no drill executed; priority proposal for Owner drill selection |
| 1.0.4   | 2026-08-16 | I2: Kill-Switch-Live-Drill Owner-authorized and executed (`M9_KILL_SWITCH_LIVE_DRILL_2026-08-16.md`); contributes to M9 Exit Gate item 3 (partial, SA3B only) |
| 1.0.5   | 2026-08-16 | I2: Rollback/Recovery-Live-Drill Owner-authorized and executed (`M9_ROLLBACK_RECOVERY_LIVE_DRILL_2026-08-16.md`); contributes to M9 Exit Gate item 5 (partial) |
| 1.0.6   | 2026-08-16 | I2: Audit-Outage-Live-Drill Owner-authorized and executed (`M9_AUDIT_OUTAGE_LIVE_DRILL_2026-08-16.md`); contributes to M9 Exit Gate item 2 (partial, audit portion) |
| 1.0.7   | 2026-08-16 | I2: Replay/Idempotency-Live-Drill Owner-authorized and executed (`M9_REPLAY_IDEMPOTENCY_LIVE_DRILL_2026-08-16.md`); closed a real integration gap (envelope replay guard now wired to the real SA3B caller); contributes to M9 Exit Gate item 2 (replay portion, complete) |
| 1.0.8   | 2026-08-16 | I2: Authorization-Bypass-Live-Drill Owner-authorized and executed (`M9_AUTHORIZATION_BYPASS_LIVE_DRILL_2026-08-16.md`); all 9 runbook attack vectors now proven through the real SA3B chain; contributes to M9 Exit Gate item 2 (authorization-bypass portion, complete) |
| 1.0.9   | 2026-08-16 | I2: Secret/Exfiltration-Live-Drill Owner-authorized and executed (`M9_SECRET_EXFILTRATION_LIVE_DRILL_2026-08-16.md`); closed two real redaction gaps (camelCase-prefixed keys, missing TOTP/recovery/backup-code coverage); contributes to M9 Exit Gate item 2 (exfiltration portion, complete) |
| 1.0.10  | 2026-08-16 | I2: Prompt/Tool-Injection-Live-Drill Owner-authorized and executed (`M9_PROMPT_TOOL_INJECTION_LIVE_DRILL_2026-08-16.md`); proved typed authorization fields immune to adversarial payloads; found and documented (not fixed) that the credentialExposureDetected/untrustedScopeElevationDetected checkpoint gates have no real content-scanning detector behind them yet — recommended as its own work package before M9 closure |
| 1.0.11  | 2026-08-16 | I2: Untrusted-Content-Detector work package Owner-authorized and executed (`M9_UNTRUSTED_CONTENT_DETECTOR_WORK_PACKAGE_2026-08-16.md`); resolved prior finding architecturally rather than building a speculative detector; added 38 tests for the previously-untested Issue-validator boundary; contributes to M9 Exit Gate item 2 (injection portion, now complete) |
| 1.0.12  | 2026-08-16 | I2: Break-Glass design proposal Owner-ACCEPTED and policy-logic layer implemented + tested (`M9_BREAK_GLASS_DESIGN_PROPOSAL_2026-08-16.md`, `M9_BREAK_GLASS_LOGIC_IMPLEMENTATION_2026-08-16.md`); explicitly not live-wired, no drill executed, ADR-0063 remains PROPOSED |
| 1.0.13  | 2026-08-16 | I2: Break-Glass live-wiring Owner-authorized and executed (`M9_BREAK_GLASS_LIVE_WIRING_2026-08-16.md`); real Owner+step-up-gated HTTP endpoint (`/api/systemadmin/break-glass`), in-memory revocation persistence, 10 new HTTP-level tests; documented but unresolved finding that `requireStepUp()` does not filter `purpose` at consumption (affects all step-up-gated endpoints); still no drill executed, ADR-0063 remains PROPOSED |
| 1.0.14  | 2026-08-16 | I2: Break-Glass drill Owner-authorized and technically executed (`M9_BREAK_GLASS_LIVE_DRILL_2026-08-16.md`); all 8 runbook requirements for Assurance Domain 7 proven, including a real revocation-enforcement gap found and closed additively (`breakGlassRevoked` flag in `roadmapExecutionMandate.ts`, per the already-accepted proposal §2.7); 5 new tests; mandatory Post-Event-Review artifact created (`.ai/evidence/break-glass/BREAK-GLASS-M9-DRILL-2026-08-16-01-POST-REVIEW.md`) but Owner signature still pending — M9 Exit Gate item 4 not formally satisfied until signed; ADR-0063 remains PROPOSED |
| 1.0.15  | 2026-08-16 | I2: Owner explicitly signed the Break-Glass Post-Event-Review ("signing" / "führe signature durch") — M9 Exit Gate item 4 ("break-glass drill PASS") now formally satisfied; two non-blocking follow-ups remain documented (revocation-lever broker binding; `requireStepUp()` purpose filter); ADR-0063 remains PROPOSED |
| 1.0.16  | 2026-08-16 | I2: Required Independent Review executed by a fresh sub-agent with no prior M9 involvement (`M9_INDEPENDENT_EVIDENCE_REVIEW_2026-08-16.md`) — M9 Exit Gate item 6 now formally satisfied; verdict "yes, with caveats", no CRITICAL finding, 4 documented follow-ups (F1-F4, incl. a stale runbook/traceability-matrix status blocking Exit Gate item 9, and the `requireStepUp()` purpose-filter gap now graded MEDIUM-HIGH); M9 overall still not `COMPLETE / VERIFIED PASS` pending items 9 and 10 |
| 1.0.17  | 2026-08-16 | I2: Exit Gate items 9 and 10 addressed (`M9_EXIT_GATE_ITEMS_9_10_2026-08-16.md`) — runbook status header and traceability matrix corrected from stale "BLOCKED BY M8" to "IN PROGRESS — NOT YET COMPLETE / VERIFIED PASS" (item 9); verified via `git fetch --prune` that no M9-attributable orphaned branch exists on the shared repository, the earlier finding was a stale unpruned local branch cache (item 10); Exit Gate items 1, 6, 7, 9, 10 now fully satisfied, items 2, 3, 4, 5, 8 remain partially satisfied per the Independent Review; M9 overall still not `COMPLETE / VERIFIED PASS` |
| 1.0.18  | 2026-08-17 | I2/M9 CLOSED: `requireStepUp()` purpose-filter fixed (Independent Review Finding F2 — `purpose` now a required parameter, checked against the value stored at issuance, covering all three real callers) with 3 new tests (`M9_STEPUP_PURPOSE_FILTER_FIX_2026-08-17.md`); remaining structural residuals (SA3B-only-caller scope, mocked-Supabase methodology) explicitly Owner-accepted; **M9 is formally `COMPLETE / VERIFIED PASS`** — all 10 Exit Gate items satisfied (`M9_CLOSURE_EVIDENCE.md`); M10 prerequisite gate now satisfied |
| 1.0.19  | 2026-08-17 | I3 (M10) begins: Phase 1 (Trusted PR State Resolver) Owner-authorized and implemented (`M10_PHASE1_TRUSTED_PR_STATE_RESOLVER_2026-08-17.md`) — `server/m10/githubPrStateResolver.ts` always re-derives base/head SHA and a canonical sorted file-set/diff digest from a live, injected GitHub API call; the request signature structurally cannot accept an agent-supplied hash as authoritative; 19 new tests including TOCTOU and diff-substitution defenses; real fetch()-based GitHub implementation included but not wired to any route; no new dependency added; ADR-0066 remains PROPOSED |
| 1.0.20  | 2026-08-17 | I3 (M10): Phase 2 (Challenge Issuance) Owner-authorized and implemented (`M10_PHASE2_CHALLENGE_ISSUANCE_2026-08-17.md`) — `server/m10/challengeIssuance.ts` issues a 2-minute single-use challenge always bound to a freshly Phase-1-resolved PR state; swappable `M10ChallengeStore` interface (unused/consumed/revoked lifecycle) with an in-memory reference implementation, no production persistence decision made yet; canonical authorization digest implemented per ADR-0066 §3's exact formula; 18 new tests including single-use replay protection and digest-binding proofs; ADR-0066 remains PROPOSED |
| 1.0.21  | 2026-08-17 | I3 (M10): Phase 3 (Owner Credential Enrollment, code/logic only) Owner-authorized and implemented (`M10_PHASE3_OWNER_CREDENTIAL_ENROLLMENT_2026-08-17.md`) — new dependency `@simplewebauthn/server` added with explicit prior Owner authorization (0 audit vulnerabilities) for real WebAuthn attestation verification instead of a hand-rolled implementation; `server/m10/credentialEnrollment.ts` structurally refuses any non-canonical owner id, requires User Verification, persists only minimal public credential material, consumes the registration challenge on every verification attempt (success or failure); 20 new tests; no real Owner enrollment was performed - structurally impossible for an agent, requires a real browser/authenticator; ADR-0066 remains PROPOSED |
| 1.0.22  | 2026-08-17 | I3 (M10): Phase 3 live-wired Owner-authorized and implemented (`M10_PHASE3_LIVE_WIRING_2026-08-17.md`) — new Supabase migration (`m10_registration_challenges`, `m10_owner_credentials`, Service-Role-only RLS, not yet applied to a real instance), Supabase-backed store implementations, real Owner+step-up-gated HTTP endpoint (`/api/m10/credential-enrollment/*`), new dependency `@simplewebauthn/browser` (0 audit vulnerabilities), minimal Owner enrollment UI (new SupervisorDashboard tab); 28 new tests; `vite build`/esbuild production builds both verified; still no real Owner enrollment performed - now technically possible after merge/deploy, remains an Owner-only action; ADR-0066 remains PROPOSED |
| 1.0.23  | 2026-08-17 | I3 (M10): Production incident found and fixed after live-wiring (`M10_PHASE3_PRODUCTION_INCIDENT_FIX_2026-08-17.md`) — Owner-reported bug ("Passkey-Registrierung registriert nicht") root-caused to (1) the Phase 3 migration having never actually been applied to production (this repo has no automated migration-deployment path; the earlier claim that it "rolls out through the existing deploy process" was verified false) — Owner-authorized via `AskUserQuestion` ("Ja, Migration jetzt gegen Produktion anwenden (empfohlen)"), applied directly via `mcp__Supabase__apply_migration`, both tables now live in production with RLS enabled and zero new security-advisor findings; and (2) unhandled store exceptions in `credentialEnrollment.ts` causing silent failure instead of a clean `DENY` — fixed with try/catch around every store call in all three exported functions; 6 new regression tests (200 files/1298 tests total, all PASS); lesson documented that migrations in this repository are always applied manually, never assume auto-deployment; ADR-0066 remains PROPOSED |

---

**End of Document**  
ROADMAP-INTEGRATED-DC-SA-0001  
CAPITAL-AI Integrated Development Chain + Systemadmin Roadmap  
Version 1.0.22
