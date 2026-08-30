# Work Package Pack — VC-H Implementierung *-1 (Spezifikation)

**Document ID:** WP-VC-H-IMPLEMENT-2026-08-30  
**Status:** SPECIFIED / RUNTIME NOT STARTED  
**Date:** 2026-08-30  
**Baseline:** `main@4e3de6f489989e64962225874dd7dd69400fcd95`  
**Depends on:** WP-VC-H-INVENTORY-2026-08-30 (`*-0` DONE via #610)  
**Class:** D in this PR; runtime follow-ups are Klasse C and require a fresh branch  
**Does not authorize:** Merge, Deploy, Scoring-Promotion, Provider-Mutation, M10

Owner-Auftrag 2026-08-30: offene Folgeschritte auf einem frischen Branch binden. Dieses Paket **spezifiziert** die ersten Implementierungsstufen. Es implementiert sie nicht im Runtime-Code.

## Gemeinsame Invarianten

- `package.json#version` bleibt einzige Plattform-Versionsautorität (`0.6.0`).
- Scoring bleibt `ScoringModelRegistry → ScoringDispatcher → Domain Executor` (ADR-0087).
- Kein zweiter EventMesh, kein zweiter Knowledge-Store, ESS-0004 bleibt SUSPENDED.
- Jede Runtime-Stufe braucht einen eigenen Claim und Human-Merge.

## Spezifizierte Folgestufen

| WP | Ziel | Erster Code-Ort | DoD (Runtime-PR) |
|---|---|---|---|
| PROD-1 | Production/main/PR-Head Identitäten nur aus trusted Preflight | bestehendes `scripts/pr/productionPreflight.mjs` — Marker-Self-Heal ist mit #612 auf main | Preflight-ID bindet Production `commitSha`, `main`, Head; Handoff-SHAs als STALE markiert |
| SUP-1 | Finding-Lifecycle Persistenz, keine Merge-Authority | `src/platform/Supervisor/` | Findings haben Status NEW/OPEN/CLOSED; Persistenz fail-closed; SUP-3 Negativtests getrennt |
| VM-2 | README/Manifest-Drift gegen `package.json#version` | `src/platform/VersionManager/` + bestehender `readme:check` | Test FAIL wenn Component-README neuer als Plattformversion wirbt |
| PD-1 | Entscheidungsfindung nur als Projection, Approval bleibt Human | `src/platform/PlatformDirector/` | Decision Record ohne APPROVED erzeugt kein `PlatformDecisionEvent` |
| REL-1 | Release-Evidence an productionSHA binden | `src/platform/Release/` | Evidence-Datei nennt exakten Production-SHA; kein Deploy-Trigger |
| DQ-1 | Zentrale Negativtests Missing/Stale → kein Neutral-Score | Domain-Tests unter bestehendem SPT/Crypto-Vertrag | mind. ein FAIL-Pfad je Consumer ohne neue Score-Engine |
| EM-1 | `server/systemEvents.ts` nur Adapter auf EventMesh | `src/platform/EventMesh/` | kein zweiter Bus; Legacy-Log bleibt Consumer |
| KG-1 | Knowledge-Index nur aus approved Registries | `src/platform/Knowledge/` | Scoring/MarketData/Secrets bleiben DENY (KG-3) |

PD-1 bleibt hinter Owner-ACCEPT für Runtime. SUP-1 / VM-2 / DQ-1 sind die ersten Runtime-Kandidaten nach Merge dieses Spezifikations-PRs.

## Explizit nicht in diesem PR

- Runtime-Dateien unter `src/**` und `server/**`
- `scripts/pr/**` (bereits in #612 gemergt)
- `.github/workflows/**`
- Ruleset-Apply
- M10-Reaktivierung
