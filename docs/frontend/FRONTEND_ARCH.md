# 🎨 Frontend Architecture & Interface Guidelines
**Project: CAPITAL-AI**  
**Framework:** React 19 / Vite 6 / Tailwind CSS 4 / Motion  
**Financial-data amendment:** ADR-0097 v1.1.0 (2026-08-20)

---

## 🗺️ Architectural Concept: Event-Driven SPA
The frontend is constructed as an **Event-Driven Single Page Application (SPA)** that runs within isolated, secure browser contexts. We combine deep cyber-slate aesthetics with strict performance, responsiveness, accessibility, and evidence-integrity guidelines.

### Financial-data consumer boundary

Frontend modules must distinguish **catalog metadata** from **verified financial observations**:

```text
/api/registry/assets
  -> symbol / name / asset class / contract metadata
  -> user selects a relevant asset
  -> verified quote / context / display endpoint
  -> value + status + provenance + freshness
```

Rules from ADR-0097:

- `/api/registry/assets` must not be treated as a source of verified price/fundamental values.
- Financial values are hydrated progressively from the applicable verified endpoint.
- Missing evidence remains unavailable/partial; the frontend does not manufacture zero/default finance values.
- Domain-specific modules can narrow the global asset catalog to their valid domain. `BuffetValueCheck.tsx` is therefore **stock-only**.
- `BuffetValueCheck.tsx` consumes `verified-asset-display/1.0.0` per selected stock and must not display Crypto, Forex, Commodity, Index or Bond assets in its selector.
- Display/research evidence is not an execution-price contract.

---

## 🎨 Visual Identity & Glassmorphism Design System

### 1. Cyber Slate Aesthetic & Palette
- **Main Canvas Background**: Deep, rich absolute black (`bg-black`) to ensure maximum visual contrast and legibility under varying lighting conditions.
- **Glassmorphism Panels**: Interactive modules, cards, and drawers are rendered as semi-transparent dark slate backings styled with fine border borders:
  ```tailwind
  bg-neutral-950/40 border border-white/10 backdrop-blur-md rounded-xl p-6
  ```
- **Branding Highlights**:
  * **Cyber Green (Success)**: Reflects validated parameters, stable setups, or favorable scoring states (`text-green-400`).
  * **AIF Gold (Premium Highlight)**: Used strictly for premium features, high-priority scoring tiers, and focal calls-to-action (`text-aif-gold-DEFAULT`).
  * **Neon Purple / Cyan**: Abstract background neural vector paths to reinforce the high-performance AI engine concept.

### 2. Kinetic Interaction Design (Motion Guidelines)
Every transition, page load, or button interaction must feel responsive, organic, and fluid.
* Use `motion` for staggered listings, fade-ins, and drawer slide-overs.
* Keep exit animation times tight (`duration: 0.2`) to maintain a snappy, high-speed UX feel.

---

## 📦 Directory Structure Standards

The codebase enforces a modular, decoupled structure:

```text
/src
  ├── main.tsx           # React mounting/routing entry
  ├── App.tsx            # Main layout/session controller
  ├── index.css          # Tailwind CSS / design tokens
  ├── types.ts           # Shared types
  ├── hooks/             # Reactive state hooks
  ├── services/          # Client/domain service contracts where applicable
  └── components/        # Independent UI nodes
        ├── Screener.tsx          # Multi-asset screener
        ├── BacktestEngine.tsx    # Backtesting mask
        ├── BuffetValueCheck.tsx  # Stock-only Graham/DCF + verified fundamentals
        └── MarkdownOrchestrator.tsx # Documentation/compliance hub
```

Financial provider secrets and provider orchestration remain server-side; components call internal API boundaries instead of keyed upstream APIs directly.

---

## 📱 Mobile-First Desktop Precision (BFSG Accessibility)
* **Hit Target Sizing**: In accordance with German **BFSG** and European **EN 301 549** standards, touch-sensitive navigation items, action chips, and buttons should provide an accessible target area appropriate to their interaction context, with the established project target of at least 44x44px for primary touch controls.
* **Responsive Reflows**: Enforce mobile-first responsive grid layouts (e.g. `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).
* **Reactive Size Handling**: Bind charts, tables, and canvases to responsive parent layouts rather than assuming a fixed viewport.

---

## Related documents

- `docs/adr/ADR-0097-verified-asset-display-progressive-hydration.md`
- `docs/frontend/COMPONENT_INVENTORY.md`
- `docs/architecture/DATENQUALITAETSSCHICHT.md`
- `docs/backend/BACKEND_ARCH.md`
