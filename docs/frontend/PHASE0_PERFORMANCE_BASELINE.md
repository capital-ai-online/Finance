# Phase 0 — Performance Baseline

**Status:** PROCEDURE READY / MEASUREMENT PENDING  
**Stand:** 16. August 2026  
**Zielmetrik (Roadmap):** Lighthouse Performance ≥ 90 · Core Web Vitals grün

---

## 1. Messumgebung

| Parameter | Vorgabe |
|-----------|---------|
| URL | `https://capital-ai.online` (Landing + authentifizierter Dashboard-Pfad) |
| Tool | Chrome Lighthouse (Desktop + Mobile), optional PageSpeed Insights |
| Netzwerk | Default Lighthouse throttling |
| Build | Produktions-Build (`npm run build` / deployed Render) |
| Browser | Aktuelles Chrome, Clean Profile |

---

## 2. Core Web Vitals — Zielwerte

| Metrik | Gut | Ziel Phase 0 |
|--------|-----|--------------|
| LCP | ≤ 2.5 s | messen & dokumentieren |
| INP | ≤ 200 ms | messen & dokumentieren |
| CLS | ≤ 0.1 | messen & dokumentieren |
| TTFB | orientierend | notieren |
| Lighthouse Performance | ≥ 90 | Ziel |

---

## 3. Baseline-Protokoll (ausfüllen nach Messung)

### 3.1 Landing / Public

| Metrik | Desktop | Mobile | Datum | Notes |
|--------|---------|--------|-------|-------|
| Performance Score | | | | |
| LCP | | | | |
| INP | | | | |
| CLS | | | | |
| TBT | | | | |
| Bundle hints | | | | |

### 3.2 Authenticated Dashboard (Hauptcockpit)

| Metrik | Desktop | Mobile | Datum | Notes |
|--------|---------|--------|-------|-------|
| Performance Score | | | | |
| LCP | | | | |
| INP | | | | |
| CLS | | | | |
| Time-to-First-Score (UX) | | | | manuell stoppen |

---

## 4. Bekannte technische Hebel (aus Stack)

| Hebel | Hinweis |
|-------|---------|
| React 19 + Vite 6 | Code-Splitting prüfen (`Dashboard` / schwere Panels lazy?) |
| Recharts / D3 | Schwere Viz nicht im initialen Critical Path |
| Motion | Reduced-motion + weniger permanente Loops (Neural Pulse) |
| Fonts | Google Fonts: `display=swap` bereits in Import — Latenz beobachten |
| Bilder / AssetLogo | Caching, Größen, lazy |
| API-Wasserfälle | Time-to-First-Score = Frontend + Backend-Orchestrierung |

---

## 5. Phase-0-Abnahme

- [x] Messprotokoll definiert
- [ ] Mindestens eine Desktop- + eine Mobile-Messung dokumentiert
- [ ] Top-3 Performance-Findings priorisiert
- [ ] Keine Produktionsmutation ohne Owner-Freigabe

Messung kann Owner-seitig oder in einem späteren Evidence-PR nachgezogen werden.
