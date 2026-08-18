# CAPITAL-AI Governance Library Report

**Document ID:** GOV-LIB-2026-08-15  
**Repo:** `SvenKulessa/Finance`  
**Snapshot date:** 2026-08-15  
**Current-authority annotation:** 2026-08-19  
**Zweck:** Kompakte, dauerhafte Bibliothek für Agenten-Kontext und Audits

> **Lifecycle notice:** This document originated as a 2026-08-15 snapshot. Historical statements remain useful evidence, but current normative interpretation follows Accepted ADR-0069 including its Owner addendum of 2026-08-16, `HUMAN_OWNER_PR_APPROVAL_POLICY.md`, `DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`, and `GOVERNANCE_AUTHORITY_SUPERSESSION_POLICY.md` after Human Merge of ADR-0086.

## 1. Executive Summary

CAPITAL-AI betreibt eine **stark spezifizierte, fail-closed Multi-Agent-Governance** für eine produktive FinTech-/Investment-Webanwendung (`capital-ai.online`).

**Aktuelle Kernprinzipien:**

1. Technische CI ist technische Evidence und **keine** Merge-Autorisierung.
2. Das frühere Pre-CI-Ritual mit PR-Body-Checkboxen, `Viewed`-Attestation und Current-Head-Review `💪`/`okay` wurde durch Owner-Entscheidung/ADR-0069-Nachtrag am **2026-08-16 retired**. Vor M10 startet technische CI ohne dieses Ritual; Merge bleibt Human/Owner-only.
3. Die strengste zutreffende PR-Klasse (D < C < R < M) gilt für den ganzen PR.
4. Externe Plattformmutation benötigt eine eigene Approval-, Mutation- und Evidence-Kette.
5. Der CI-Trust-Root darf sich nicht selbst bootstrapen; die Recovery-Invarianten von ADR-0069 bleiben aktiv.
6. M10 führt nach kontrolliertem Cutover Passkey/WebAuthn für `AUTHORIZE_PR_CI` ein. Ein Agent darf Owner Enrollment oder M10-Cutover nicht als erledigt behaupten.
7. Dokumentrecency allein erzeugt keine Authority. Accepted Decisions und regulatorische Vorgaben haben Vorrang; Proposed/Draft-Artefakte sind nicht selbst autorisierend.

## 2. Schlüssel-ADRs (Auszug)

| ADR | Thema | Authority-Hinweis |
|-----|--------|------------------|
| 0039 | Human-authorized PR creation; advisory Work-Claims | `PROPOSED`; Design-/Prozessreferenz, nicht alleinige Accepted Authority |
| 0047 | GitHub authoritative pre-merge CI gate | Status im ADR prüfen |
| 0069 | Human/Owner gate; kein selbstreferenzieller CI-Bootstrap | **ACCEPTED**; Owner-Gate-Ritual seit 2026-08-16 retired |
| 0073 | CI consolidation `build-and-test` | aktuelle CI-Konsolidierung |
| 0081 | ADR namespace cleanup, shadow validator, weekly score | Governance-Hygiene |
| 0086 | Authority/Supersession + regulatory control mapping | Proposed in branch; wirksam erst nach Human Merge |

## 3. Operative Enforcement

- `.github/pull_request_template.md` v1.4.x oder neuer entsprechend aktuellem Contract
- `scripts/pr/classifyPrScope.mjs`, `validatePrBody.mjs`
- technische CI nach Checkklasse D/C/R/M
- Human/Owner-only Merge
- Shadow: `npm run governance:shadow-adr` / `npm run governance:score` (advisory subset; nicht Full-Governance-Score)
- M10 Passkey/WebAuthn: in Umsetzung, Controlled Cutover ausstehend

## 4. Regulatory / Benchmark Mapping

Der aktuelle Mapping-Anker ist `docs/compliance/AI_FINTECH_REGULATORY_CONTROL_MATRIX_2026-08-19.md`.

Er trennt ausdrücklich:

- EU AI Act — rechtliche Anwendbarkeit/use-case classification;
- DORA — nur bei tatsächlich in-scope Financial Entity/Activity;
- ISO/IEC 42001 — AIMS Benchmark, keine implizite Zertifizierung;
- NIST AI RMF / GenAI Profile — freiwillige Risk-Governance-Benchmarks.

## 5. Historischer Hinweis

Frühere Evidence, PRs und Reports dürfen das bis 2026-08-16 gültige Checkbox/Viewed/Emoji-Gate dokumentieren. Diese Referenzen sind historische Evidence und dürfen nicht als aktuelle Norm gelesen oder automatisch gelöscht werden.

---
End of GOV-LIB-2026-08-15 (current-authority annotation 2026-08-19)
