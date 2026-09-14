# CAPITAL-AI Universe Branding — Owner Decision Evidence & FE Handoff

**Status:** `OWNER-DIRECTED DECISION EVIDENCE — NON-AUTHORIZING ROUTING PROJECTION`  
**Date:** 2026-09-14  
**Repository:** `capital-ai-online/Finance`  
**Correlation baseline:** `main@c6d36c216801f16788d205664ab4cfdf0c970dca`  
**Current Project:** `CAPITAL-AI-GOV`  
**Current Project Folder:** `docs/projects/governance/`  
**Primary PVC:** `PVC-05 — Platform Director`  
**Primary Owner:** `CAPITAL-AI-GOV / Platform Director`  
**Target Project:** `CAPITAL-AI-FE`  
**Target Project Folder:** `docs/projects/frontend/`

> This file preserves the Owner decision and the owner-correct execution handoff. It is not a second design-token, palette, Blueprint, Component or Frontend authority. The machine-readable branding/design authority remains `docs/frontend/design-tokens.json`; brandmark geometry remains `docs/frontend/brandmark.json`.

## 1. Current-main authority correlation

Current main already defines the required architecture boundary:

- `docs/frontend/FRONTEND_ARCH.md` is the Frontend source-tree/dependency/presentation architecture authority.
- `docs/frontend/design-tokens.json` plus `docs/frontend/PHASE0_DESIGN_TOKENS.md` are the canonical Branding-/Design-Token authority and renderer projection.
- `docs/frontend/brandmark.json` contains geometry plus semantic token references only; color/typography values remain owned by `design-tokens.json`.
- Web, PDF, Social and external renderers consume the same token authority rather than defining parallel palettes.
- Suspended `ADR-0004` is non-authorizing. Existing Accepted PDF/Media ADRs consume the canonical token source and do not establish a competing application-wide palette.

**Architecture decision:** the Owner direction below changes token values, naming and presentation policy inside an already-established authority boundary. It does **not** introduce a new architecture plane. Therefore this Governance slice creates **no new ADR or ESS and no ADR/ESS supersession**. If a later FE correlation discovers a genuinely new material architecture rule, that finding must be routed separately under then-current authority rather than bootstrapped from this evidence record.

## 2. Owner decision — CAPITAL-AI Universe branding

### 2.1 Primary brand pair

| Role | Owner name | Value | State |
|---|---|---:|---|
| Primary canvas | **Vader Black** | `#08080C` | `ACTIVE` |
| Primary / premium / focus | **Capital Gold** | `#F9BF21` | `ACTIVE` |

User-facing and newly authored branding language uses **Capital Gold**. Historical/technical `AIF Gold` aliases may remain only while an actual consumer still requires them; alias cleanup follows normal zero-consumer/contract-migration rules.

### 2.2 Asset-Universe brands

| Asset Universe | Owner brand name | Color | Owner state | Required FE treatment |
|---|---|---:|---|---|
| Crypto | **Krypto Purple** | `#8D26FF` | `ACTIVE` | New German UI/branding surfaces spell **Krypto** with K. Existing technical contract/API identifiers are not renamed without a separate contract migration. |
| Stock | **Deadly Green** | `#44DE88` | `ACTIVE` | Consume the canonical asset-class token; no local hardcoded palette. |
| Index | **Pluto Blue** | `#60A5FA` | `ACTIVE` | Consume the canonical asset-class token; no local hardcoded palette. |
| Forex | **StarTroops Magenta** | `#E879F9` | `ACTIVE` | Consume the canonical asset-class token; no local hardcoded palette. |
| Commodity | **Meteor Amber** | `#FF9F1C` | `OWNER-DESIGN-PROPOSAL` | Preserve as a proposal only. Do **not** promote it to productive canonical token state without a separate Owner activation decision. |
| Bond | — | — | `DISABLED` | Remove Bond/Anleihen from productive CAPITAL-AI-Universe navigation, filters, rankings, presentation and selectable Frontend surfaces. Do not delete DATA/FINTECH/domain contracts, stable technical identifiers or backend capability solely because presentation is disabled. |

Current-main token delta to be materialized by the FE owner:

- `assetClass.crypto`: `#22D3EE` → `#8D26FF`;
- `assetClass.stock`: remains `#44DE88`;
- `assetClass.index`: remains `#60A5FA`;
- `assetClass.forex`: `#8D26FF` → `#E879F9`;
- `assetClass.commodity`: current productive value remains unchanged until `Meteor Amber #FF9F1C` is separately activated;
- `assetClass.bond`: may remain as a technical/compatibility token while consumers exist, but must not make Bond a productive selectable/presented Universe.

Asset-class color remains presentation metadata and never implies BUY/SELL, score quality, readiness, eligibility or execution authority.

## 3. Pattern badges — direction and strength model

Pattern direction and Pattern strength are independent from Asset-Universe color.

Canonical direction bases remain:

- `BUY` → `color.score.best` / `#44DE88`;
- `SELL` → `color.score.worst` / `#F87171`.

The required six visible semantic variants are:

- `BUY strong`
- `BUY medium`
- `BUY weak`
- `SELL strong`
- `SELL medium`
- `SELL weak`

### Deterministic intensity projection

To preserve readable foreground contrast while making strength visibly deterministic, the foreground stays at the canonical BUY/SELL base token and strength changes only the base-derived background/border alpha:

| Strength | Foreground | Background from direction base | Border from direction base |
|---|---:|---:|---:|
| `strong` | `100%` | `18%` | `45%` |
| `medium` | `100%` | `10%` | `30%` |
| `weak` | `100%` | `5%` | `18%` |

This keeps the current medium visual level (`bg .../10`, `border .../30`) as the center step while defining deterministic stronger/weaker projections. Strength remains exposed by text/icon semantics as well; color/alpha is never the sole carrier.

A verified neutral Pattern direction, where the current domain contract supplies one, remains neutral and must not be coerced into BUY or SELL.

### Missing evidence invariant

The existing canonical rule remains unchanged:

- `renderWhenMissing=false`;
- `missingState=omit`;
- no placeholder badge;
- missing Pattern evidence must not synthesize a Pattern, BUY/SELL direction or strength.

## 4. Bond deactivation boundary

`Bond / Anleihen = DISABLED` is a **presentation/product-surface decision**, not a DATA/FINTECH domain shutdown.

FE must remove productive Bond exposure from at least the correlated Universe surfaces: navigation, filters, ranking groups/cards, user-selectable asset-class controls and other Frontend Universe presentation. Stable technical identifiers/types may remain where required for API compatibility, domain contracts, historical evidence or foreign-owner runtime capability.

Deletion, retirement or semantic modification of DATA/FINTECH Bond contracts requires a separate owner-side decision in the owning project and is explicitly outside this GOV slice.

## 5. Directly executable CAPITAL-AI-FE handoff prompt

```yaml
prompt:
  id: "CAPITAL-AI-FE-UNIVERSE-BRANDING-KIT"
  mode: "CURRENT_MAIN_CORRELATION_AND_SCOPED_IMPLEMENTATION"
  repository: "capital-ai-online/Finance"

  current_project: "CAPITAL-AI-FE"
  project_folder: "docs/projects/frontend/"
  primary_productive_pvc: "N/A — cross-cutting Frontend"
  primary_owner: "CAPITAL-AI-FE"

  source_owner_decision:
    project: "CAPITAL-AI-GOV"
    evidence: "docs/projects/governance/evidence/UNIVERSE_BRANDING_OWNER_DECISION_2026-09-14.md"

  objective: >
    Materialisieren Sie die Owner-definierte CAPITAL-AI Universe Palette und
    Pattern-Badge-Intensitäten ausschließlich über die bestehende kanonische
    Frontend Branding-/Design-Token-Authority. Erzeugen Sie keine zweite
    Palette, BrandingKit-, Blueprint-, Component-Token- oder Scoring-Authority.

  mandatory_start:
    - "aktuellen main SHA ermitteln"
    - "/AGENTS.md vollständig aus exakt diesem current main lesen"
    - "docs/projects/README.md und docs/projects/PROJECT_VALUE_CHAIN.md lesen"
    - "docs/projects/frontend/README.md und ROADMAP.md lesen"
    - "docs/frontend/FRONTEND_ARCH.md und FRONTEND_ROADMAP.md lesen"
    - "docs/frontend/design-tokens.json, brandmark.json und PHASE0_DESIGN_TOKENS.md lesen"
    - "offene PRs, aktive Writer, changed-file/semantic/namespace/authority overlap prüfen"
    - "relevante Accepted ADR/Active ESS nur im tatsächlich betroffenen Scope korrelieren"

  canonical_authority:
    design_tokens: "docs/frontend/design-tokens.json"
    brandmark_geometry: "docs/frontend/brandmark.json"
    frontend_architecture: "docs/frontend/FRONTEND_ARCH.md"

  required_active_values:
    vader_black: "#08080C"
    capital_gold: "#F9BF21"
    krypto_purple: "#8D26FF"
    deadly_green: "#44DE88"
    pluto_blue: "#60A5FA"
    startroops_magenta: "#E879F9"

  commodity_proposal:
    name: "Meteor Amber"
    value: "#FF9F1C"
    state: "OWNER-DESIGN-PROPOSAL"
    rule: "nicht als produktiven kanonischen Token aktivieren, solange keine separate Owner-Aktivierung vorliegt"

  bond:
    state: "DISABLED"
    frontend_requirement: >
      Bond/Anleihen aus produktiven Universe-Navigationen, Filtern, Rankings,
      Karten und auswählbaren Frontend-Oberflächen entfernen.
    exclusion: >
      Keine DATA-/FINTECH-/API-Domainverträge oder stabilen technischen
      Identifier löschen oder umbenennen, sofern deren Owner dies nicht separat autorisiert.

  naming:
    visible_german_crypto: "Krypto"
    capital_gold: "Capital Gold"
    compatibility_rule: >
      Bestehende technische contract/API identifiers und Legacy-Aliase nur
      nach separater Contract-/Zero-Consumer-Migration umbenennen oder löschen.

  pattern_badges:
    buy_base: "color.score.best"
    sell_base: "color.score.worst"
    required_variants:
      - "BUY strong"
      - "BUY medium"
      - "BUY weak"
      - "SELL strong"
      - "SELL medium"
      - "SELL weak"
    intensity:
      strong: { foreground: "100%", background: "18%", border: "45%" }
      medium: { foreground: "100%", background: "10%", border: "30%" }
      weak: { foreground: "100%", background: "5%", border: "18%" }
    missing_pattern:
      renderWhenMissing: false
      missingState: "omit"
      synthetic_signal: "PROHIBITED"
    accessibility: "Richtung und Stärke zusätzlich textlich/iconisch kommunizieren; Farbe nie allein"

  implementation_scope:
    - "kanonische Token-Registry und ihre dokumentierte Renderer-Projektion aktualisieren"
    - "Web-Token-Projektion aus der Registry nachziehen; keine lokalen Hex-Paletten"
    - "Universe-/Ranking-/Filter-/Navigation-Consumer auf semantische Tokens und Bond-DISABLED korrelieren"
    - "Pattern-Badge-Consumer auf das deterministische Direction×Strength-Modell umstellen"
    - "bestehende Missing-Evidence-Invariante beibehalten"
    - "bestehende Branding-/Frontend-Korrelationstests erweitern statt eine zweite Test-/Authority-Schicht einzuführen"

  likely_consumer_surfaces_to_correlate:
    - "src/features/screening/ui/RankingBoard.tsx"
    - "src/components/Screener.tsx"
    - "src/components/FavoriteAssetPatternSlots.tsx"
    - "src/index.css"
    - "tests/unit/brandingV62Projection.test.ts"
    - "tests/unit/designMediaFrontendCorrelation.test.ts"

  prohibitions:
    - "keine GOV-Designruntime"
    - "keine zweite Palette oder Token-Registry"
    - "keine Frontend-lokale Scoring-/Pattern-Evidence-Authority"
    - "keine synthetischen Pattern-/BUY-/SELL-Signale bei fehlender Evidence"
    - "keine Domainvertrags-Löschung für Bond aus dem Frontend-Slice"
    - "Meteor Amber nicht stillschweigend von Proposal zu Active hochstufen"

  validation:
    - "Frontend architecture check"
    - "Branding-/Design-Token-Korrelationstests"
    - "Pattern-/Missing-Evidence-Regression"
    - "TypeScript"
    - "betroffene Unit-/Contract-Tests"
    - "Production Build"
    - "exakte Final-Head-Korrelation gegen current main und offene Writer"
    - "NOT RUN niemals als PASS ausgeben"

  exit_gate:
    - "eine einzige Branding-/Design-Token-Authority"
    - "aktive Universe-Farben entsprechen der Owner-Entscheidung"
    - "Commodity bleibt bis Owner-Aktivierung Proposal"
    - "Bond ist produktiv im Frontend nicht auswählbar/sichtbar, Domainverträge bleiben unberührt"
    - "sechs BUY/SELL×Strength-Badgevarianten deterministisch token-abgeleitet"
    - "missing Pattern evidence bleibt omit"
    - "keine parallele Architektur"
```

## 6. Governance exit decision

- One canonical Branding-/Design-Token authority: **CONFIRMED**.
- Universe colors and states: **OWNER-DEFINED**, with Commodity explicitly remaining `OWNER-DESIGN-PROPOSAL`.
- Bond deactivation boundary: **DEFINED — presentation only; no foreign-domain deletion**.
- Pattern Badge intensity model: **DEFINED — direction-base token × deterministic strength projection; missing evidence omitted**.
- Parallel GOV design architecture: **NONE CREATED**.
- ADR/ESS supersession: **NOT REQUIRED by current-main correlation**.
- Runtime implementation: **ROUTED TO CAPITAL-AI-FE; not performed by CAPITAL-AI-GOV**.
