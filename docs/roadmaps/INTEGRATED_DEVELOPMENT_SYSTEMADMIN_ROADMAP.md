# CAPITAL-AI Integrated Development Chain + Systemadmin Roadmap

**Document ID:** ROADMAP-INTEGRATED-DC-SA-0001  
**Status:** ACTIVE — CANONICAL EXECUTION ROADMAP  
**Version:** 1.0.4  
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
- **Kill-Switch-Live-Drill erledigt (2026-08-16):** Owner-Wahl „Kill-Switch-Live-Drill (empfohlen)" via `AskUserQuestion` → `docs/evidence/m9/M9_KILL_SWITCH_LIVE_DRILL_2026-08-16.md`. Alle vier realen mutierenden Capabilities gegen die live-wired SA3B-Kette angegriffen und verweigert; READ/ANALYZE/PLAN bleiben erhalten; 9 neue Tests, 1086/1086 gesamt PASS. Trägt zu M9-Exit-Gate-Punkt 3 bei (teilweise — nur SA3B als einziger produktiver Aufrufer).
- Nächster Schritt: Owner wählt den nächsten konkreten Drill (Rollback/Recovery empfohlen als nächststärkste Grundlage) — siehe Priorisierungsvorschlag im Inventory-Dokument §5.

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

---

**End of Document**  
ROADMAP-INTEGRATED-DC-SA-0001  
CAPITAL-AI Integrated Development Chain + Systemadmin Roadmap  
Version 1.0.4
