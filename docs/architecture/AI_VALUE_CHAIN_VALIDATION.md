# CAPITAL-AI AI Value Chain Validation

## Enterprise Report

### Document ID

ARCH-CHAIN-0001

### Version

1.1.0

### Status

Enterprise Analysis — Approved for Governance Review

### Basis

ESS-0001-CONTRACTS Chapter 8, 9, 10, 15, 17, 18, 19

ESS-0001 Chapter 7, 8, 9

ESS-0002, ESS-0003

**Provider-set correction (Owner 2026-08-16):** Google AI Studio is **not** part of the active DEVELOPMENT Chain / AI value chain. Canonical agent providers are **ChatGPT, Claude and Grok**. See `docs/evidence/m8/M8_PROVIDER_SET_CORRECTION_2026-08-16.md` and `docs/architecture/ai-agent/AI_AGENT_PROVIDER_PROFILE_CONTRACT.md`.

---

# Enterprise Purpose

Dieser Report prüft die vollständige AI-Wertschöpfungskette des CAPITAL-AI Core.

Geprüft wird verbindlich

- ob jede Stufe existiert
- ob jede Stufe automatisch Events erzeugt
- ob die Documentary Engine bei jeder relevanten Änderung ausgelöst wird
- ob die Versionierung vollständig integriert ist
- ob der Knowledge Graph automatisch aktualisiert wird
- ob der Digital Twin jederzeit synchron bleibt

---

# Geprüfte Kette

**Normative operational chain (Owner 2026-08-16):**

```text
ChatGPT / Claude / Grok   (Research + controlled Execution clients under provider-neutral Control Plane)
        ↓
Documentary Engine
        ↓
Supervisor
        ↓
Platform Director
        ↓
Version Manager
        ↓
Release
        ↓
Production
```

Historical diagrams that listed "Google AI Studio" as Stage 1 are superseded for operational authority. Provider products are interchangeable **profiles**; authorization remains CAPITAL-AI-owned (ADR-0057, ADR-0062).

Diese Kette ist seit ESS-0001-CONTRACTS Chapter 17 normativ definiert; die Provider-Namen sind Owner-korrigiert.

---

# Bewertungsschlüssel

| Stufe | Bedeutung |
|---|---|
| **Definiert** | vertraglich beschrieben |
| **Implementiert** | im Repository lauffähig vorhanden |
| **Automatisiert** | ereignisgesteuert ohne manuelle Auslösung |

---

# Stufenbewertung

## Stufe 1 — Agent Provider Clients (ChatGPT / Claude / Grok)

| Kriterium | Ergebnis | Nachweis |
|---|---|---|
| Verantwortung definiert | ✓ | Chapter 10, AI Responsibility Contract; Provider Profile Contract |
| Eingangs- und Ausgangsartefakte definiert | ✓ | Chapter 17; M8 profiles |
| Erzeugt Events | ✗ | kein DesignProposedEvent-Mechanismus |
| Übergabe dokumentiert | ◐ | Handoff / work-claims; Control Plane profiles present |

**Befund CHAIN-01 (updated 2026-08-16)**

Die Stufe ist als provider-neutrale Client-Ebene definiert. Google AI Studio ist **retired**. Canonical registry: `chatgpt-github-connector`, `claude-code-cli`, `grok-xai-connector`.

**Stufe** High

---

## Stufe 2 — Controlled Implementation (Claude Code / ChatGPT / Grok under Control Plane)

| Kriterium | Ergebnis | Nachweis |
|---|---|---|
| Verantwortung definiert | ✓ | Chapter 10 |
| Contracts verfügbar | ✓ | ESS-0001, Provider Profile, agentIam |
| Knowledge Graph als Eingang verfügbar | ✗ | `.ai/knowledge/` leer |
| Impact Analyse als Eingang verfügbar | ✗ | keine Impact-Analyse-Implementierung |
| Erzeugt Events | ✗ | kein `ImplementationCompletedEvent` |
| Erzeugt Metadaten | ◐ | Manifeste vorhanden, unvollständig |

**Befund CHAIN-02**

Die Stufe arbeitet ohne die vertraglich vorgeschriebenen Eingangsartefakte (Knowledge Graph).

**Stufe** Critical

---

## Stufe 3 — Documentary Engine

| Kriterium | Ergebnis | Nachweis |
|---|---|---|
| Verantwortung definiert | ✓ | ESS-0001 |
| Komponente vorhanden | ◐ | Teils implementiert (Discovery, Drift Detector Phase B) |
| Wird automatisch ausgelöst | ✗ | kein voller Auslösemechanismus |

**Stufe** Critical

---

## Stufe 4 — Supervisor

| Kriterium | Ergebnis | Nachweis |
|---|---|---|
| Verantwortung definiert | ✓ | ESS-0002 |
| Komponente vorhanden | ✓ | `src/platform/Supervisor/supervisor.ts` |
| Task Routing / Retry | ✓ | `routeTask`, `executeSupervised` |
| Agent Provider Chain Observation | ✓ | `observeAgentProviderChain` (ChatGPT/Claude/Grok) |
| Lightweight Findings | ✓ | from failed executions + inventory |
| Vollständige ESS-0002 Domains / Twin | ✗ | noch unvollständig |
| Entscheidet niemals | ✓ | Read-only / recommendation only |

**Befund CHAIN-04 (updated 2026-08-16)**

Runtime Supervisor is implemented for routing, supervised execution, approved actions, and agent-provider observation. Full ESS-0002 finding lifecycle and Digital Twin blocking remain open.

**Stufe** High (improved from Critical for core runtime path)

---

## Stufe 5 — Platform Director

| Kriterium | Ergebnis | Nachweis |
|---|---|---|
| Verantwortung definiert | ✓ | ESS-0003, ADR-0006 |
| Komponente vorhanden | ◐ | Verzeichnisgerüst |

**Stufe** High

---

## Stufe 6–8 — Version Manager / Release / Production

Unchanged in substance from v1.0.0: partial legacy implementation; automation gaps remain.

---

# Related Documents

- `docs/evidence/m8/M8_PROVIDER_SET_CORRECTION_2026-08-16.md`
- `docs/architecture/ai-agent/AI_AGENT_PROVIDER_PROFILE_CONTRACT.md`
- `docs/reports/SUPERVISOR_SYSTEMADMIN_COMPLIANCE_AI_VALUE_CHAIN_REPORT.md`
- ARCH-GAP-0001, ARCH-CONS-0001, ARCH-MAT-0001

---

# Version History

| Version | Status | Beschreibung |
|---|---|---|
| 1.0.0 | Initial Release | Vollständige Validierung der AI-Wertschöpfungskette |
| 1.1.0 | Provider-set correction | Google AI Studio retired; ChatGPT/Claude/Grok canonical; Supervisor observation noted |

---

# End of Document

ARCH-CHAIN-0001  
CAPITAL-AI AI Value Chain Validation  
Version 1.1.0
