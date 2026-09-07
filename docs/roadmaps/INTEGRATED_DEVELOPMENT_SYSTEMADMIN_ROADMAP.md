# CAPITAL-AI Integrated Development Chain + Systemadmin Roadmap

**Document ID:** ROADMAP-INTEGRATED-DC-SA-0001  
**Document role:** roadmap / non-authorizing projection  
**Status:** ACTIVE — NON-AUTHORIZING CURRENT-STATE PROJECTION  
**Version:** 2.1.0  
**Date:** 2026-09-07  
**Repository:** SvenKulessa/Finance  
**Current-state authority:** `docs/architecture/ROADMAP.md` / `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`  
**Governance authority:** ADR-0096 + `/AGENTS.md` + `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`  
**Owner:** SvenKulessa

---

## 1. Zweck und Authority-Grenze

Dieses Dokument projiziert den Zusammenhang zwischen der aktuellen DevelopmentChain und dem
Systemadmin-Arbeitsmodell. Es ist **keine eigene Ausführungs-, Merge-, Deployment-, IAM- oder
Produktions-Mutationsauthority**.

Der frühere Stand bis Version 2.0.0 enthielt eine aktive Projektion eines inzwischen stillgelegten
PR-Autorisierungsmechanismus. Diese Projektion ist nicht Teil des aktuellen Ausführungszustands.
Historische Details bleiben ausschließlich über die historischen Artefakte und Git-Historie
nachvollziehbar.

Die aktuelle Ausführungs- und Statusauflösung erfolgt über:

1. `/AGENTS.md` als Repository Trust Root;
2. `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` für den Branch-/PR-/Sync-Lifecycle;
3. `docs/architecture/ROADMAP.md` als current-state DevelopmentChain Status Index;
4. stabile ADR-/ESS-/Authority-/Control-Registries für fachliche und technische Authorities;
5. Human/Owner-Entscheidungen für Merge und geschützte externe Mutationen.

Roadmaps, historische Runbooks und Evidence dürfen diese Authority-Reihenfolge nicht umkehren.

---

## 2. Aktuelle integrierte Phasenprojektion

| Phase | DevelopmentChain | Systemadmin-Bezug | Aktueller Status | Authority-/Mutation-Grenze |
|---|---|---|---|---|
| I0 | Baseline | SA0–SA4 Baseline | **VERIFIED PASS** | Erhalten; keine historische Evidence als neue Authority interpretieren |
| I1 | Agent Cutover | Work-Package-/Provider-Control-Plane | **COMPLETE / VERIFIED PASS** | Provider-/Capability-Erweiterungen nur über aktuelle Governance |
| I2 | Assurance / Incident / Break-Glass | Assurance Evidence | **COMPLETE / VERIFIED PASS** | Historische Drill-Evidence bleibt Evidence; neue Mutationen benötigen heutigen Scope/Gates |
| I3 | Retired PR-authorization history | historische Owner-Authorization-Evidence | **HISTORICAL / NON-AUTHORIZING** | Kein aktueller Gate, keine Prerequisite und kein Restoration Target; historische Evidence erzeugt keine Authority |
| I4 | Closure / SA5 external mutation | Bounded External Mutation | **NICHT DURCH DIESE ROADMAP AUTORISIERT** | Separate aktuelle ADR/Owner-Authority und jeweilige Production-Mutation-Gates erforderlich |

### Retired-authorization clarification

Der frühere PR-Autorisierungsmechanismus besitzt historische Implementierungs-, Incident- und
Verification-Evidence. Er ist kein aktueller DevelopmentChain-Gate, keine aktive Runtime- oder
Discovery-Abhängigkeit und kein Restoration Target. Human/CODEOWNER-Review und Human Merge
bleiben nach den jeweils aktuellen Governance Controls maßgeblich. Dieses Dokument kann den
aktuellen Gate-Zustand nicht ändern.

---

## 3. Aktueller DevelopmentChain-Lifecycle

```text
CURRENT MAIN + OPEN-PR BASELINE
→ AUTHORITY / SECURITY / COMPLIANCE / REUSE PRE-CHECK
→ FRESH SCOPED BRANCH
→ SCOPED IMPLEMENTATION
→ AVAILABLE LOW-COST PRE-PR VALIDATION
→ FINAL MAIN RE-SYNC + OPEN-WRITER CORRELATION
→ PULL REQUEST
→ INDEPENDENT HOSTED CI
→ HUMAN/CODEOWNER REVIEW + MERGE DECISION
→ HUMAN MERGE
→ SEPARATE PRODUCTION-MUTATION / DEPLOYMENT CONTROL, IF APPLICABLE
→ POST-CHANGE EVIDENCE / TRACEABILITY SYNC
```

Kein Agent schreibt direkt auf `main`. Ein Work Claim koordiniert Writer-Konflikte, erzeugt aber
keine fachliche oder sicherheitsrelevante Authority. Kostenverursachende Hosted-CI-Prüfungen
werden nicht als Vor-PR-Ersatz für lokale/strukturelle Checks missbraucht.

---

## 4. Systemadmin-Grenzen

Der Systemadmin-Kontext darf innerhalb eines autorisierten Work Packages analysieren, Evidence
sammeln, Vorschläge erstellen und im konkret erlaubten Repository-Scope umsetzen. Er darf aus
Roadmap-Texten keine neue Berechtigung ableiten.

Insbesondere bleiben separat geschützt:

- Produktions-, Deploy-, Secret- und IAM-Mutationen;
- Provider- oder Capability-Erweiterungen;
- Owner-Authentifizierungs-, Enrollment- und Recovery-Material;
- Wiederherstellung stillgelegter Autorisierungsmechanismen;
- SA5 External Mutation;
- Änderungen mit HIGH/CRITICAL-Sicherheitswirkung außerhalb eines expliziten aktuellen Scopes.

---

## 5. Dokumentationshygiene und kanonische Pfade

### Current-state / authorizing

- `/AGENTS.md` — Repository Trust Root;
- `docs/architecture/ROADMAP.md` — current-state DevelopmentChain Status Index;
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md` — DevelopmentChain Execution Policy;
- `docs/governance/authority-registry.json` — stabile Authority-Identitäten;
- `docs/governance/control-catalog.json` — Governance-/Security-Control-Katalog;
- `docs/adr/registry.json` und `.ai/registry/ess-registry.json` — ADR-/ESS-Namespace und Lifecycle.

### Projektionen / historische Referenzen

- `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` — **historical/non-authorizing** für den heutigen Ausführungsstatus;
- `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` — **historical/non-authorizing execution history**;
- `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` — Portfolio-/Konsolidierungsprojektion;
- dieses Dokument — integrierte **non-authorizing** Projektion.

Historische Evidence unter `docs/evidence/**` und `.ai/evidence/**` bleibt erhalten. Frühere
Roadmap-Texte bleiben vollständig über die Git-Historie nachvollziehbar; diese Current-State-
Konsolidierung entfernt keine zugrunde liegenden Evidence-Artefakte.

---

## 6. Historischer Statusüberblick

| Zeitraum / Versionen | Historischer Inhalt | Heutige Einordnung |
|---|---|---|
| 1.0.0–1.0.2 | Integration DevelopmentChain/Systemadmin, M8 Abschluss | Evidence-/Projektionshistorie |
| 1.0.3–1.0.18 | M9 Inventory, Drills, Break-Glass, Independent Review, Closure | M9 **COMPLETE / VERIFIED PASS**; Detail-Evidence unter `docs/evidence/m9/**` |
| 1.0.19–1.0.24 | M10 Phasen 1–3, Live-Wiring und Produktions-Incident-Fixes | historische M10-Evidence; **keine aktuelle Gate-Autorisierung** |
| 2.0.0 | Rollen-/Status-Konsolidierung gegen ADR-0096 und damaligen Control Plane | historische Current-State-Projektion mit inzwischen stillgelegter Gate-Semantik |
| 2.1.0 | Current-State-Bereinigung stillgelegter PR-Autorisierungsprojektionen | aktuelle non-authorizing Projektion |

---

## 7. Aktuelle Korrelationen / offene Grenzen

- **M9:** formal geschlossen; alte Roadmap-Texte, die M9 als „not yet started" oder „active focus"
  führen, sind nicht current-state-authorizing.
- **Retired PR authorization:** historische Implementierung/Evidence bleibt Audit-Kontext; kein
  aktueller Gate, keine Runtime-/Discovery-Abhängigkeit und kein Restoration Target.
- **Deployment:** Render native Auto Deploy bleibt OFF; Production Promotion folgt dem aktuellen
  verifizierten-main-/exact-SHA-Deployment-Control-Plane.
- **AuthN/AuthZ:** aktuelle Supabase MFA/AAL2- und andere AuthN/AuthZ-Authorities werden ausschließlich
  aus den jeweils aktuellen ADR/ESS/Governance Controls aufgelöst; historische WebAuthn-Evidence
  erzeugt keine Authority.
- **Externe Mutationen:** Repository-Merge, Roadmap-Status oder historische Evidence autorisieren
  keine Render-, Supabase-, Stripe-, Provider-Console- oder Secret-Mutation.

---

## 8. Current next action

Aktuelle Arbeit wird ausschließlich aus dem jeweils gültigen current-state Index, ADR/ESS,
Owner-Prioritäten, Quick Wins oder explizit markierten Folgepunkten abgeleitet. Vor jedem neuen
Work Package sind current `main`, offene Writer/PRs, Scope-Korrelationen und die wirksamen
Governance-/Security-Authorities erneut zu prüfen.

Für stillgelegte Autorisierungsmechanismen gilt:

```text
CURRENT EXECUTION DEPENDENCY = NONE
RESTORATION TARGET = NONE
HUMAN/CODEOWNER REVIEW = REQUIRED
HUMAN MERGE = REQUIRED
```

---

## Related Documents

- `AGENTS.md`
- `docs/architecture/ROADMAP.md`
- `docs/governance/DEVELOPMENT_CHAIN_EXECUTION_POLICY.md`
- `docs/governance/SYSTEMADMIN_AGENT_ROADMAP_EXECUTION_POLICY.md`
- `docs/governance/DOCUMENTATION_HYGIENE_POLICY.md`
- `docs/governance/authority-registry.json`
- `docs/governance/control-catalog.json`
- `docs/adr/ADR-0096-governance-control-plane-authority-and-supersession.md`
- `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md`
- `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md`
- `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md`
- `docs/evidence/m8/M8_CLOSURE_EVIDENCE.md`
- `docs/evidence/m9/M9_CLOSURE_EVIDENCE.md`
- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md` — historical/non-authorizing redirect
- `docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md` — historical threat-model evidence

---

**End of Document**  
ROADMAP-INTEGRATED-DC-SA-0001  
CAPITAL-AI Integrated Development Chain + Systemadmin Roadmap  
Version 2.1.0