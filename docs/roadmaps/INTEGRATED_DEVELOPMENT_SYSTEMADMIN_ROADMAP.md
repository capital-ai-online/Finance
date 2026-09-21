# CAPITAL-AI Integrated Development Chain + Systemadmin Roadmap

**Document ID:** ROADMAP-INTEGRATED-DC-SA-0001  
**Document role:** roadmap / non-authorizing projection  
**Status:** ACTIVE — NON-AUTHORIZING CURRENT-STATE PROJECTION  
**Version:** 2.0.0  
**Date:** 2026-08-25  
**Repository:** SvenKulessa/Finance  
**Current-state index (non-authorizing):** `docs/architecture/ROADMAP.md` / `AUTH-GOV-DEVELOPMENT-CHAIN-STATUS`  
**Execution trust root:** `/AGENTS.md@CURRENT_MAIN`; ADR-0096 remains a Governance subject-matter architecture constraint  
**Owner:** SvenKulessa

---

## 1. Zweck und Authority-Grenze

Dieses Dokument projiziert den Zusammenhang zwischen DevelopmentChain (M0–M10) und dem
Systemadmin-Arbeitsmodell. Es ist **keine eigene Ausführungs-, Merge-, Deployment-, IAM- oder
Produktions-Mutationsauthority**.

Der frühere Stand bis Version 1.0.24 bezeichnete dieses Dokument als „einzige kanonische
Ausführungsroadmap". Diese Rollenbehauptung ist durch ADR-0096 und den heutigen Governance
Control Plane überholt. Die aktuelle Ausführungs- und Statusauflösung erfolgt über:

1. `/AGENTS.md` als Repository Trust Root;
2. `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` nur als stabiler historischer Alias, der exklusiv auf `/AGENTS.md@CURRENT_MAIN` auflöst; es existiert keine eigenständige DevelopmentChain-Ausführungspolicy;
3. `docs/architecture/ROADMAP.md` als nicht autorisierender current-state DevelopmentChain Status Index;
4. stabile ADR-/ESS-/Authority-/Control-Registries für fachliche und technische Authorities;
5. Human/Owner-Entscheidungen für Merge und geschützte externe Mutationen.

Roadmaps, historische Runbooks und Evidence dürfen diese Authority-Reihenfolge nicht umkehren.

---

## 2. Aktuelle integrierte Phasenprojektion

| Phase | DevelopmentChain | Systemadmin-Bezug | Aktueller Status | Authority-/Mutation-Grenze |
|---|---|---|---|---|
| I0 | M0–M7 Baseline | SA0–SA4 Baseline | **VERIFIED PASS** | Erhalten; keine historische Evidence als neue Authority interpretieren |
| I1 | M8 Agent Cutover | Work-Package-/Provider-Control-Plane | **COMPLETE / VERIFIED PASS** | Provider-/Capability-Erweiterungen nur über aktuelle Governance |
| I2 | M9 Assurance / Incident / Break-Glass | Assurance Evidence | **COMPLETE / VERIFIED PASS** | Historische Drill-Evidence bleibt Evidence; neue Mutationen benötigen heutigen Scope/Gates |
| I3 | M10 Passkey Owner PR Authorization | Passkey/WebAuthn-Evidence | **HISTORISCH VERIFIZIERT; CURRENT ENFORCEMENT `RETIRED / OFF`** | M10 darf nicht aus alter Evidence reaktiviert werden; neue explizite Owner-Entscheidung + aktuelle Prerequisites erforderlich |
| I4 | Closure / SA5 external mutation | Bounded External Mutation | **NICHT DURCH DIESE ROADMAP AUTORISIERT** | Separate aktuelle ADR/Owner-Authority und jeweilige Production-Mutation-Gates erforderlich |

### M10-Klarstellung

M10 besitzt historische Implementierungs-, Incident- und Verification-Evidence. Der aktuelle
Trust Root setzt den produktiven M10-/`AUTHORIZE_PR_CI`-Pfad ausdrücklich auf **`RETIRED / OFF`**. Seine Abwesenheit ist kein Implementierungsgap. Human/
CODEOWNER-Review und Human Merge bleiben maßgeblich. Dieses Dokument kann den Gate-Zustand nicht
ändern.

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
- Passkey-Enrollment und Recovery-Material;
- M10-Reaktivierung;
- SA5 External Mutation;
- Änderungen mit HIGH/CRITICAL-Sicherheitswirkung außerhalb eines expliziten aktuellen Scopes.

---

## 5. Dokumentationshygiene und kanonische Pfade

### Current-state / authorizing

- `/AGENTS.md` — Repository Trust Root;
- `docs/architecture/ROADMAP.md` — current-state DevelopmentChain Status Index;
- `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` — historischer Alias; aktuelle Semantik ausschließlich aus `/AGENTS.md@CURRENT_MAIN`;
- `docs/governance/authority-registry.json` — stabile Authority-Identitäten;
- `docs/governance/control-catalog.json` — Governance-/Security-Control-Katalog;
- `docs/adr/registry.json` und `.ai/registry/ess-registry.json` — ADR-/ESS-Namespace und Lifecycle.

### Projektionen / historische Referenzen

- `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` — **historical/non-authorizing** für den heutigen Ausführungsstatus;
- `docs/roadmaps/SYSTEMADMIN_AGENT_ROADMAP.md` — fachliche Roadmap-Projektion, keine Mutationsauthority;
- `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` — Portfolio-/Konsolidierungsprojektion;
- dieses Dokument — integrierte **non-authorizing** Projektion.

Historische Evidence unter `docs/evidence/**` und `.ai/evidence/**` bleibt erhalten. Der frühere
Text dieser Roadmap bleibt zusätzlich vollständig über die Git-Historie nachvollziehbar; die
Konsolidierung auf Version 2.0.0 entfernt keine zugrunde liegenden Evidence-Artefakte.

---

## 6. Historischer Statusüberblick

| Zeitraum / Versionen | Historischer Inhalt | Heutige Einordnung |
|---|---|---|
| 1.0.0–1.0.2 | Integration DevelopmentChain/Systemadmin, M8 Abschluss | Evidence-/Projektionshistorie |
| 1.0.3–1.0.18 | M9 Inventory, Drills, Break-Glass, Independent Review, Closure | M9 **COMPLETE / VERIFIED PASS**; Detail-Evidence unter `docs/evidence/m9/**` |
| 1.0.19–1.0.24 | M10 Phasen 1–3, Live-Wiring und Produktions-Incident-Fixes | historische M10-Evidence; **keine aktuelle Gate-Autorisierung** |
| 2.0.0 | Rollen-/Status-Konsolidierung gegen ADR-0096 und aktuellen Control Plane | current non-authorizing projection |

Die vor Version 2.0.0 intern widersprüchlichen Kopf-/Footer-Versionen (`1.0.12`, `1.0.22`) und die
Version-History bis `1.0.24` werden hiermit auf einen eindeutigen Dokumentstand konsolidiert.

---

## 7. Aktuelle Korrelationen / offene Grenzen

- **M9:** formal geschlossen; alte Roadmap-Texte, die M9 als „not yet started" oder „active focus"
  führen, sind nicht current-state-authorizing.
- **M10:** historisch implementiert/verifiziert, aktuell `SUSPENDED / OFF`; keine Reaktivierung in
  diesem Dokument.
- **Deployment:** Render native Auto Deploy bleibt OFF; Production Promotion folgt dem aktuellen
  verifizierten-main-/exact-SHA-Deployment-Control-Plane.
- **AuthN/AuthZ:** Supabase MFA/AAL2 und M10-WebAuthn besitzen eigene Authorities/Evidence; Social
  Media OAuth wird durch ADR-0026/ADR-0027 und das aktuelle OAuth Threat Model korreliert.
- **Externe Mutationen:** Repository-Merge, Roadmap-Status oder historische Evidence autorisieren
  keine Render-, Supabase-, Stripe-, Provider-Console- oder Secret-Mutation.

---

## 8. Current next action

Aktuelle Arbeit wird ausschließlich nach `/AGENTS.md@CURRENT_MAIN` aus kanonischem Projekt-/Roadmap-Status oder frischer Human/Owner-Direction ausgewählt. Current-state Index, ADR/ESS, Quick Wins und Reports sind dabei nicht autorisierende Status- bzw. Subject-Matter-Eingaben. Vor jedem neuen Work Package sind current `main`, offene Writer/PRs, Scope-Korrelationen und die wirksamen Governance-/Security-Constraints erneut zu prüfen.

Für M10 gilt bis zu einer neuen expliziten Owner-Reaktivierungsentscheidung unverändert:

```text
AUTHORIZE_PR_CI = RETIRED / OFF
HUMAN/CODEOWNER REVIEW = REQUIRED
HUMAN MERGE = REQUIRED
```

---

## Related Documents

- `AGENTS.md`
- `docs/architecture/ROADMAP.md`
- `AUTH-GOV-DEVELOPMENT-CHAIN-EXECUTION` (historical alias -> `AGENTS.md`)
- `docs/governance/DOCUMENTATION_HYGIENE_POLICY.md` (historical/documentary projection only)
- `docs/governance/authority-registry.json`
- `docs/governance/control-catalog.json`
- `docs/adr/ADR-0096-governance-control-plane-authority-and-supersession.md`
- historical DevelopmentChain/Systemadmin roadmap snapshots in Git/archive provenance
- `docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md`
- `docs/evidence/m8/M8_CLOSURE_EVIDENCE.md`
- `docs/evidence/m9/M9_CLOSURE_EVIDENCE.md`
- `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`
- `docs/architecture/ai-agent/M10_PASSKEY_OWNER_PR_AUTHORIZATION_THREAT_MODEL.md`

---

**End of Document**  
ROADMAP-INTEGRATED-DC-SA-0001  
CAPITAL-AI Integrated Development Chain + Systemadmin Roadmap  
Version 2.0.0
