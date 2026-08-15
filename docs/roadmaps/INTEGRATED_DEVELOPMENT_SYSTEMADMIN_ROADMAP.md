# CAPITAL-AI Integrated Development Chain + Systemadmin Roadmap

**Document ID:** ROADMAP-INTEGRATED-DC-SA-0001  
**Status:** ACTIVE — CANONICAL EXECUTION ROADMAP  
**Version:** 1.0.0  
**Date:** 2026-08-15  
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
| **I1** | M8 Agent Cutover (Abschluss) | Work-Package Catalog Nutzung | **IN PROGRESS** (Phase 0 + Teil-Gates VERIFIED) | repository only, REM-bound | I2 nach VERIFIED PASS |
| **I2** | M9 Assurance / Incident / Break-Glass | SA-Prototyp-Anfragen (ESS-0023) | **BLOCKED** | drills + evidence | I3 nach VERIFIED PASS |
| **I3** | M10 Passkey-only Owner PR Authorization | SA5 Design-Vorbereitung | **BLOCKED** | exact-state WebAuthn | I4 nach VERIFIED PASS |
| **I4** | DevelopmentChain Closure | SA5 Bounded External Mutation Design | **BLOCKED** | separate ADR + Owner Approval | Production Mutation möglich |

**Regel:** Documentation readiness authorizes never blocked phase execution.

---

## 4. I1 — M8 Agent Cutover (aktueller ausführbarer Fokus)

### Goal
Provider-neutraler Agent-Cutover: alle Provider (ChatGPT, Claude Code, Google AI Studio, NotebookLM) laufen über denselben Control-Plane-Pfad mit identischer Capability-Policy. Kein provider-spezifischer privilegierter Bypass bleibt kanonisch.

### Offene Lücken (aus Evidence + Roadmap)
- Claude Code / Google AI Studio / NotebookLM haben noch keinen realen Caller
- Provider-Cutover-Sequenz nicht ausgeführt
- Branch-Cleanup nach Cutover offen
- Exit-Gate-Punkte 1–3, 5, 8–10 noch nicht vollständig geschlossen

### Required Sequence
1. Fresh branch from current `main`
2. Real Caller-Wiring für alle verbleibenden Provider (additiv, nie ersetzend)
3. Policy-Equivalence-Tests erweitern
4. Full Cutover-Sequenz (shadow → active) mit Rollback-Beweis
5. Branch-Cleanup aller Cutover-Arbeitsbranches
6. Positive + Negative Tests + Evidence unter `docs/evidence/m8/`
7. Human/Owner Review + CI + Merge
8. Roadmap + Traceability Sync → Status `VERIFIED PASS`

### Systemadmin-Rolle in I1
- Darf bounded Work-Packages aus dem generalisierten Catalog (ADR-0074) für M8-Dokumentation und Tests ausführen
- Darf Mutation Proposals an den Owner stellen (ESS-0023)
- Darf **keine** Provider-Profile oder IAM-Regeln eigenmächtig erweitern
- Execution nur über trusted GitHub Actions Host + OIDC + REM

### Exit Gate I1
- Alle 4 Provider-Profile haben realen Caller
- Kein provider-spezifischer Bypass existiert (CI-Guard vorhanden)
- Rollback-to-read-only bewiesen
- Alle Cutover-Branches gelöscht
- Evidence + Traceability synchron
- Owner bestätigt `VERIFIED PASS`

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

---

## 6. I3 — M10 Passkey-only Owner PR Authorization

### Goal
Ersetze Legacy-`💪`/`okay`- und Checkbox-Authorization durch exact-state WebAuthn (Passkey) mit User-Verification.

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

Legacy bleibt autoritativ bis `VERIFIED PASS`.

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

## 11. Current Next Action (I1)

**Sofort ausführbar:**
1. Owner-Anweisung für nächstes konkretes M8-Element (z. B. Claude-Code-Caller oder Cutover-Sequenz)
2. Optional: Bounded Systemadmin Work-Package für M8-Evidence/Tests über den generalisierten Runner
3. Parallel: SUPERSEDED-Dokumente gemäß Hygiene-Policy archivieren

**Nicht ausführbar ohne separate Owner-Freigabe:**
- M9 / M10 / SA5
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

---

## Version History

| Version | Date       | Description                                      |
|---------|------------|--------------------------------------------------|
| 1.0.0   | 2026-08-15 | Initial Integrated Roadmap — connects DC + SA, absorbs all open gaps and improvement suggestions |

---

**End of Document**  
ROADMAP-INTEGRATED-DC-SA-0001  
CAPITAL-AI Integrated Development Chain + Systemadmin Roadmap  
Version 1.0.0
