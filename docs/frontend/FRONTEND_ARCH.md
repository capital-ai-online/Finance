# 🎨 Frontend Architecture & Interface Guidelines
**Project: Jenova Nexus (AIF-CORE)**
**Framework: React 18 / Vite / Tailwind CSS / Motion**

---

## 🗺️ Architectural Concept

The Frontend is structured as an **Event-Driven Single Page Application (SPA)** with responsive, rich interfaces, glassmorphism aesthetics, and strict performance metrics.

---

## 🎨 Visual Identity & Component Guidelines

### 1. The Design Aesthetic (Cyber Slate Theme)
- **Primary Background**: Absolute black (`bg-black`) to provide high visual contrast.
- **Backdrop Containers**: Semi-transparent dark slate panels styled with glassmorphism overlays:
  ```tailwind
  bg-white/5 border border-white/10 backdrop-blur-md rounded-xl p-6
  ```
- **Accent Palettes**:
  * **Cyber Green (Success/Active)**: For verified assets or indicators (`text-green-400`).
  * **AIF Gold (Premium)**: For premium sections or main CTA highlights (`text-aif-gold-DEFAULT`).
  * **Neon Purple / Cyan**: For abstract neural backdrop graphics to reinforce the AI theme.

### 2. Interaction Design (Motion guidelines)
All views and transitions must feel highly responsive, organic, and fluid.
- Use `motion` for staggered entrances, fade-ins, and button presses.
- Keep exit animations fast (`duration: 0.2`) to prevent UI sluggishness.

---

## 📦 Directory Layout Standards

```
/src
  ├── main.tsx           # Application entry point (keeps clean mounts)
  ├── App.tsx            # Main router and user session synchronizer
  ├── index.css          # Tailwind setup, custom font rules, keyframe animations
  ├── types.ts           # Unified type declarations for core structures
  └── components/        # Isolated, modular, and single-purpose sub-components
        ├── Screener.tsx          # Real-time asset overview and screener
        ├── MarketScreener.tsx    # Multi-metric filtering matrix
        ├── BacktestEngine.tsx    # Algorithmic backtest simulation
        ├── BuffetValueCheck.tsx  # Graham & DCF valuation calculator
        └── MarkdownOrchestrator.tsx # NEW: System documentation review center
```

---

## 🚀 Responsive Design Practices
* Use mobile-first prefixes (`md:grid-cols-3`) to guarantee visual coherence across smartphones, tablets, and 4K displays.
* Touch target surfaces must never be smaller than **44px** on touch-enabled device viewports.
* Always bind canvas elements or charts (e.g. Recharts layouts) to fluid container nodes using reactive resize hooks rather than hardcoded dimensions.
