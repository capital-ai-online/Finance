# 🎨 Frontend Architecture & Interface Guidelines
**Project: CAPITAL-AI**  
**Framework:** React 19 / Vite 6 / Tailwind CSS 4 / Motion  

---

## 🗺️ Architectural Concept: Event-Driven SPA
The frontend is constructed as an **Event-Driven Single Page Application (SPA)** that runs within isolated, secure browser contexts. We combine deep cyber-slate aesthetics with strict performance, responsiveness, and accessibility guidelines.

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

The codebase enforces a highly modular, decoupled structure:

```
/src
  ├── main.tsx           # Clean React 19 mounting and routing entry
  ├── App.tsx            # Main layout controller and session context synchronizer
  ├── index.css          # Tailwind CSS 4 directives, custom system-font rules
  ├── types.ts           # Unified type, interface, and enum declarations
  ├── hooks/             # Reactive state hooks (e.g. useSubscription)
  └── components/        # Independent, single-purpose, isolated UI nodes
        ├── Screener.tsx          # Real-time quantitative stock screener
        ├── BacktestEngine.tsx    # Interactive portfolio backtesting mask
        ├── BuffetValueCheck.tsx  # Benjamin Graham DCF calculator
        └── MarkdownOrchestrator.tsx # Interactive documentation & compliance hub
```

---

## 📱 Mobile-First Desktop Precision (BFSG Accessibility)
* **Hit Target Sizing**: In accordance with German **BFSG** and European **EN 301 549** standards, all touch-sensitive navigation items, action chips, and buttons must have a minimum tap area of **44x44px**.
* **Responsive Reflows**: Enforce mobile-first responsive grid layouts (e.g., `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`) to guarantee perfect responsiveness across mobile smartphones, tablets, and 4K desktop screens.
* **Reactive Size Handling**: Never hardcode dimensions for charts, tables, or canvases. Always bind them to parent nodes using ResizeObservers or responsive layouts to adapt instantly to viewport changes.
