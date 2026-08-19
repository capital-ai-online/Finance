# Phase 0 — Performance Baseline

**Status:** STATIC EVIDENCE UPDATED / LIVE MEASUREMENT PENDING  
**Stand:** 19. August 2026  
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

> Keine Werte ohne reproduzierbare Messung eintragen. QW-Paket A liefert aktuell statische Code-Evidence, aber noch keine Lighthouse-/CWV-Messwerte.

### 3.1 Landing / Public

| Metrik | Desktop | Mobile | Datum | Notes |
|--------|---------|--------|-------|-------|
| Performance Score | | | | Messung ausstehend |
| LCP | | | | Messung ausstehend |
| INP | | | | Messung ausstehend |
| CLS | | | | Messung ausstehend |
| TBT | | | | Messung ausstehend |
| Bundle hints | | | | Dashboard nicht mehr statisch aus `App.tsx` importiert |

### 3.2 Authenticated Dashboard (Hauptcockpit)

| Metrik | Desktop | Mobile | Datum | Notes |
|--------|---------|--------|-------|-------|
| Performance Score | | | | Messung ausstehend |
| LCP | | | | Messung ausstehend |
| INP | | | | Messung ausstehend |
| CLS | | | | Messung ausstehend |
| Time-to-First-Score (UX) | | | | manuell stoppen |

---

## 4. Statische Performance-Evidence — QW-Paket A

| Hebel | Stand 19.08.2026 | Evidence / Erwartung |
|-------|------------------|----------------------|
| Dashboard Critical Path | ✅ umgesetzt | `src/App.tsx`: `Dashboard` via `React.lazy()` + dynamischem `import()` |
| Backtest | ✅ umgesetzt | öffentliche Fassade lazy; Implementierung in `BacktestEngineImpl.tsx`; jsPDF/Recharts nicht zwingend im Dashboard-Initialpfad |
| Sentiment Cockpit | ✅ umgesetzt | öffentliche Fassade lazy; Recharts-Implementierung in `SentimentDashboardImpl.tsx` |
| Admin Portal | ✅ umgesetzt | öffentliche Fassade lazy; umfangreicher Admin-Komponentenbaum in `AdminPortalImpl.tsx` |
| Manuelle Vendor-Chunks | ✅ vermieden | keine neue `manualChunks`-Konfiguration; PR-#288-Regressionsmuster wird nicht wiederholt |
| Neural Motion | ✅ reduziert | Root-Layer auf Opacity 0.4; `prefers-reduced-motion` deaktiviert dekorative Animationen |
| Fonts | 🟡 beobachten | Google Fonts weiterhin per CSS-Import mit `display=swap`; Netzwerk-Latenz muss Lighthouse bewerten |
| Bilder / AssetLogo | 🟡 offen | Caching, Größen und Lazy-Loading separat prüfen |
| API-Wasserfälle | 🟡 offen | Time-to-First-Score = Frontend + Backend-Orchestrierung; Live-Evidence erforderlich |

### Erwartete Build-Evidence

Der Produktions-Build muss bestätigen, dass mindestens folgende Grenzen als getrennte Async-Chunks erscheinen:

1. `Dashboard`
2. `BacktestEngineImpl`
3. `SentimentDashboardImpl`
4. `AdminPortalImpl`

**Wichtig:** Diese Chunk-Evidence ist noch nicht als PASS markiert, solange kein reproduzierbarer Produktions-Build ausgeführt wurde.

---

## 5. Bekannte technische Hebel (aus Stack)

| Hebel | Hinweis |
|-------|---------|
| React 19 + Vite 6 | Native Dynamic Imports weiter gezielt für seltene, schwere Views nutzen |
| Recharts / D3 | Schwere Viz nicht im initialen Critical Path |
| Motion | Reduced-motion + weniger permanente Loops (Neural Pulse) |
| Fonts | Google Fonts: `display=swap` bereits in Import — Latenz beobachten |
| Bilder / AssetLogo | Caching, Größen, lazy |
| API-Wasserfälle | Time-to-First-Score = Frontend + Backend-Orchestrierung |

---

## 6. Phase-0-Abnahme

- [x] Messprotokoll definiert
- [x] Statische Code-Splitting-/Motion-Evidence aktualisiert
- [ ] Produktions-Build / Chunk-Ausgabe dokumentiert
- [ ] Mindestens eine Desktop- + eine Mobile-Messung dokumentiert
- [ ] Top-3 Performance-Findings anhand echter Messwerte priorisiert
- [ ] Keine Produktionsmutation ohne Owner-Freigabe

Live-Messungen und Produktionswerte werden nicht aus Code-Evidence abgeleitet oder geschätzt.
