# CAPITAL-AI Governance Library Report

**Document ID:** GOV-LIB-2026-08-15  
**Repo:** `SvenKulessa/Finance`  
**Zweck:** Kompakte, dauerhafte Bibliothek für Grok-Projektgedächtnis und Agenten-Kontext

## 1. Executive Summary

CAPITAL-AI betreibt eine **stark spezifizierte, fail-closed Multi-Agent-Governance** für eine produktive FinTech-/Investment-Webanwendung (`capital-ai.online`).

**Kernprinzipien (unverhandelbar):**
1. Technische CI ≠ Autorisierung zu PR-Erstellung oder Merge  
2. Human/Owner sieht Diff + Viewed + Review (`💪`/`okay`) **vor** teurem `build-and-test`  
3. Strengste PR-Klasse (D < C < R < M) gilt für den ganzen PR  
4. Externe Plattformmutation braucht eigene Approval- und Evidence-Kette  
5. CI-Trust-Root darf sich nicht selbst bootstrapen (ADR-0069)

## 2. Schlüssel-ADRs (Auszug)

| ADR | Thema |
|-----|--------|
| 0039 | Human-authorized PR creation; advisory Work-Claims |
| 0047 | GitHub authoritative pre-merge CI gate |
| 0069 | Human/Owner gate; kein selbstreferenzieller CI-Bootstrap |
| 0073 | CI consolidation `build-and-test` |
| 0081 | ADR namespace cleanup, shadow validator, weekly score |

## 3. Operative Enforcement

- `.github/pull_request_template.md` v1.3.5
- `scripts/pr/classifyPrScope.mjs`, `validatePrBody.mjs`
- Owner-Gate vor teurer CI
- Shadow: `npm run governance:shadow-adr` / `npm run governance:score` (advisory)

## 4. Hinweis

Vollständige Analyse siehe ursprüngliche Grok-Bibliotheksfassung und `docs/architecture/GOVERNANCE_MATURITY_REPORT.md`. Dieser Repo-Pfad ist die versionierte Ankerkopie für Agents und Audits.

---
End of GOV-LIB-2026-08-15
