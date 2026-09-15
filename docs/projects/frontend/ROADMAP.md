# CAPITAL-AI-FE — Canonical Roadmap

**Project:** `CAPITAL-AI-FE`  
**Folder:** `docs/projects/frontend/`  
**Role:** cross-cutting Frontend architecture, presentation and UX execution  
**Status:** `ACTIVE — CANONICAL PROJECT ROADMAP`  
**Reconciliation:** 2026-09-14 — PR #900/#901 contents folded into this file  
**Baseline:** `main@7f06828841546aa07a9ddca63ec8a7eca77e92d6`  
**Trust root:** `/AGENTS.md@current-main`

## Reconciliation rule

This file is the single active project execution projection. Dated active sidecar roadmaps and pointer-only `ROADMAP.md` files are removed after this fold. Archive/superseded copies remain as historical ledger and are not an execution source. Non-terminal pre-2026-09-13 work packages remain in force with their existing IDs, constraints, dependencies and exit gates unless a later section explicitly replaces them. Terminal `DONE/CLOSED/VERIFIED/RETIRED/SUPERSEDED` history is retained as ledger, not reopened. PR #900 remains a derived documentary source only.

## PR #900 / #901 work packages

### FE-CARRY-01 — Existing non-terminal Frontend backlog
Carry forward every non-terminal FE architecture, design-system, presentation, UX, testing and consumer-integration item.

### FE-PR900-01 — Universe branding consumers
Finish current-main materialization of Branding Kit/Universe design consumers. Preserve Vader Black, Capital Gold, Krypto Purple, Aktien Deadly Green, Indizes Pluto Blue and Forex Star Troops Magenta plus three signal-intensity badge levels.

### FE-PR900-02 — Bond presentation removal
Verify search/filter/tab/card/newsfeed surfaces do not expose Bond as user-selectable while stable technical identifiers remain where required. Visible German spelling remains `Krypto`.

### FE-PR900-03 — Canonical ranking consumer
Keep the current RankingBoard as canonical presentation consumer; do not add frontend-local scoring authority or synthetic score fills.

### FE-PR900-04 — Exact-head validation
Run design/pattern regression, TypeScript, FE architecture checks, tests and build on the final exact branch head for implementation slices.

## Carried-forward baseline (pre-2026-09-13)

Detailed Frontend state remains in `docs/frontend/FRONTEND_ROADMAP.md`, `FRONTEND_ARCH.md` and `COMPONENT_INVENTORY.md`. This project file does not create a second Frontend architecture or scoring authority.

Current composition order absent a newer Owner priority: BB-2E Navigation/Drawer → BB-2F Header/Shell → BB-2G Dashboard Home / MyWorkspace.

Class A canonicalize-now: Buffett Value Check, Sentiment Dashboard, Momentum Dashboard, Asset-Universe model visuals, Crypto category/subclass workspace, Social visualization projection.

Frontend never becomes scoring/data/entitlement/IAM/Governance/Social-publishing authority.

## Dependencies
DATA/FINTECH verified scoring/data, QM checks, SEO technical handoffs, SOCIAL render/publish ownership.

## Project exit gate
One active FE roadmap; design tokens are canonical/consumed consistently, disabled Bond presentation stays absent and required exact-head checks are evidenced.


## FE-CONSENT-V3 — CookieHub ablösen / Owner-Variante A

**Priorität:** 5/5. **Owner:** CAPITAL-AI-FE, kein eigener produktiver PVC. **Executor:** CAPITAL-AI-OPS.
**Owner-Freigabe:** „Variante A freigegeben“ (2026-09-15). **Status:** IMPLEMENTED_ON_BRANCH / VALIDATION_PARTIAL / PRODUCTION_NOT_PROVEN.

CookieConsent v3.1.0 lokal ausliefern, Konfiguration versionieren, neue Einwilligung verlangen, GA4 nur nach gültigem Opt-in laden und AdSense vollständig pausieren. Einstellungen müssen auf jeder Route wieder geöffnet werden können. Bestehende Login-/Landing-Consumer behalten den kompatiblen Settings-Aufruf. Der Providerwechsel ersetzt keine Security-/Compliance-Assurance.

**Evidence:** `evidence/COOKIECONSENT_V3_MIGRATION_2026-09-15.md`.
**Exit:** geschützte Invarianten und Verhaltenstests bestanden; TypeScript/Build/FE-Gates auf dem endgültigen Head; Browserprüfung für Mobile, Pointer/Overlay, Speichern, Wiederöffnung, Reload-Persistenz und Widerruf; COMP-Bewertung des Consent-Nachweises. Keine Production Acceptance aus Repositorytests.
**Folgeschritt:** AdSense-CMP-/TCF-Eignung separat klären; bis zur separaten Freigabe bleiben Anzeigen aus.
