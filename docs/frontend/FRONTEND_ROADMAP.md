# CAPITAL-AI Frontend Roadmap

**Projekt:** capital-ai.online  
**Repository:** SvenKulessa/Finance  
**Version:** 1.5  
**Stand:** 19. August 2026  
**Owner:** Sven Kulessa / Capital-AI  
**Bezug:** `docs/frontend/FRONTEND_ARCH.md`, `src/index.css` (@theme), public mirror: `SvenKulessa/capital-ai-frontend`

Dieses Dokument ist die **kanonische Frontend-Roadmap** für die Weiterentwicklung des React-19-Clients hin zu einem State-of-the-Art Design- und UX-Niveau (2026).

---

## 1. Vision

Das Frontend soll sich von einem funktionalen, dichten Dashboard zu einem **ruhigen, präzisen und institutionell wirkenden Cockpit** entwickeln:

- Klare visuelle Hierarchie
- Reduzierte kognitive Last
- Exzellente Data-Visualisierung (Recharts / D3)
- AI-native Interaktionen (Explainability, Conversational Layer)
- Hohe Accessibility (WCAG 2.2 AA / BFSG / EN 301 549) & Performance
- Konsistentes Design-System auf Basis der bestehenden Cyber-Slate / Glassmorphism-Identität

Zielbild: Vergleichbar mit modernen FinTech-/Quant-Interfaces (Linear-ähnliche Präzision + TradingView-Datenqualität + AI-Conversational Layer).

---

## 2. Aktueller Stand (Kurzbewertung)

**Stärken**
- Starke thematische Dark-Theme-Identität (`#18181b`, AIF-Gold, Neon-Cyan/Purple)
- Klare Status-Kommunikation (READY / REJECT / DATA_UNAVAILABLE) über `StatusBadge`-Primitive; siteweite Migration läuft
- Gute Grundstruktur für Multi-Asset-Scoring (`Dashboard`, `AssetUniverseDashboard`, `Screener`, `CryptoScoringEnterprise`)
- Responsive Basis und Motion-Integration vorhanden
- Fokus-Outline, Reduced-Motion und Glassmorphism-Patterns in `index.css` / `FRONTEND_ARCH.md`
- Dashboard-Shell und ausgewählte schwere Sekundäransichten nutzen native Dynamic Imports / `React.lazy`
- `MarketScreener` nutzt Phase-1-Layout-/Hit-Target-Primitives und eine klar dominierende Scan-Aktion
- bekannte Dashboard-P1-Semantikfunde (Profil, Close-Controls, Breadcrumb) sind im Source behoben

**Schwächen / offene Evidence**
- Hohe Informationsdichte in großen Komponenten (insbesondere `Dashboard.tsx`)
- Card-Hierarchie und Whitespace noch nicht überall konsistent
- Score-Visualisierungen und Multi-Faktor-Matrix können noch prominenter werden
- Fehlendes starkes Produkt-Onboarding & progressive Disclosure
- Kein Storybook / keine dokumentierte Component Library
- Live Lighthouse-/axe-/Core-Web-Vitals-Evidence noch nicht erhoben
- app-weite 44×44-/Semantik-/Focus-Prüfung bleibt über die behobene Kernstichprobe hinaus offen

---

## 3. Roadmap-Phasen

### Phase 0 – Fundament (Woche 1–2) — **DONE / LIVE-EVIDENCE PENDING**
**Ziel:** Stabile Basis schaffen

- [x] Design-Tokens formalisieren — `docs/frontend/design-tokens.json` + `PHASE0_DESIGN_TOKENS.md`
- [x] Accessibility-Audit-Checkliste — `PHASE0_ACCESSIBILITY_AUDIT.md`
- [x] Performance-Baseline-Protokoll — `PHASE0_PERFORMANCE_BASELINE.md`
- [x] Statische Performance-/Accessibility-Evidence mit QW-Paket A aktualisiert
- [x] Einheitliche Error- und Loading-States spezifiziert — `PHASE0_LOADING_ERROR_STATES.md`
- [x] Component Inventory finalisieren — `docs/frontend/COMPONENT_INVENTORY.md`
- [x] StatusBadge-Primitive + Referenz-Call-Sites — `src/components/StatusBadge.tsx`
- [ ] Storybook-Grundlage vorbereiten (optional, parallel)
- [ ] Live Lighthouse / axe-Messung dokumentieren
- [ ] Produktions-Build-/Chunk-Evidence dokumentieren

**Deliverables:** Tokens, Specs, Inventory, StatusBadge, statische Evidence ✅ · Live Evidence ⏳

---

### Phase 1 – Visual Design System & Look & Feel (Woche 3–6) — **IN PROGRESS**
**Ziel:** Professionelles, ruhiges Erscheinungsbild

- [ ] Dark-Theme verfeinern (präzisere Semantic Colors auf Basis AIF-Gold / Neon)
- [x] Mehr Whitespace und klarere Card-Hierarchie — Utilities + Enterprise/Universe/AssetUniverse/MarketScreener
- [x] Hintergrund-Partikel / Neural-Animationen abschwächen + `prefers-reduced-motion`
- [x] Dashboard-Sprungnavigation auf 44×44-Projektpolicy bringen
- [x] MarketScreener Primary CTA / Search-/Error-Semantik / Hit Targets verbessern
- [x] Dashboard-Shell via `React.lazy()` vom initialen App-Modul trennen
- [x] Schwere Sekundäransichten `BacktestEngine`, `SentimentDashboard`, `AdminPortal` hinter native Lazy-Grenzen verschieben
- [x] Regression Guard gegen erneute manuelle `manualChunks`-Vendor-Aufteilung ergänzen
- [x] bekannte Dashboard-P1-Semantikfunde beheben (Profil, Drawer Close, Push Close, Breadcrumb)
- [x] Primary-CTA-Stichprobe für MarketScreener, Free/Gast-Dashboard und Myworkspace abschließen
- [x] Einheitliche Badge-Primitive (`StatusBadge`); siteweite Migration noch offen
- [ ] Score-Gauges und Multi-Faktor-Matrix visuell vervollständigen und prominent platzieren
- [ ] Typografie-Upgrade (bestehende Poppins / Montserrat / JetBrains Mono nutzen und Tracking optimieren)
- [ ] Icon-Library (lucide-react) vereinheitlichen
- [ ] Button-/IconButton-/Chip-/Skeleton-Primitives als QW-Paket B extrahieren

**QW-Paket A Status:** **SOURCE-SCOPE COMPLETE / BUILD + LIVE EVIDENCE PENDING**  
Details: `PHASE1_QUICK_WINS.md`

---

### Phase 2 – Information Architecture & UX (Woche 5–10)
**Ziel:** Klare Struktur und geführte Nutzung

- [x] Erste Progressive-Disclosure-Basis über Dashboard-Accordion-Navigation vorhanden
- [ ] Progressive Disclosure systematisch auf Kernansichten ausweiten
- [ ] Primäre Hierarchie: Score → Kurzanalyse → Detail-Matrix
- [ ] Verbesserte Asset-Suche & Filter-UX anwendungsweit (MarketScreener als Referenz)
- [ ] Produkt-Onboarding / First-Time-User-Flow
- [ ] Empty States, Skeleton Loaders, Success/Error Feedback
- [ ] Secondary Navigation überarbeiten (weniger parallele CTAs)
- [ ] Command-Palette (Power-User) vorbereiten

**Deliverables:** UX-Flows, Wireframes, aktualisierte Navigation

---

### Phase 3 – Interaktionen & Data Visualization (Woche 8–14)
**Ziel:** Polierte Interaktionen und starke Visualisierungen

- [ ] Mikro-Interaktionen und sanfte Transitions (Motion)
- [ ] Interaktive Multi-Faktor-Bewertungsmatrix
- [ ] Verbesserte Score-Visualisierungen (Gauge, Trend, Breakdown) mit Recharts / D3
- [ ] Keyboard-Navigation und Focus-Management
- [ ] Live-Daten-Feedback (subtil)
- [ ] Export- und Share-Funktionen für Scores

**Deliverables:** Interaktive Komponenten, Data-Viz Specs

---

### Phase 4 – Mobile & Accessibility (parallel ab Woche 4)
**Ziel:** Exzellente mobile und barrierefreie Erfahrung

- [x] 44×44-Policy als `.ui-hit` etabliert
- [x] Touch-optimierte Controls in Enterprise / Universe / AssetUniverse / MarketScreener
- [x] Dashboard-Sprungnavigation 44×44 trotz kompakter Darstellung
- [x] MarketScreener Search-/Remove-/Error-Semantik verbessert
- [x] bekannte Dashboard-P1-Semantikfunde behoben
- [ ] Mobile Informationsarchitektur optimieren
- [ ] Vollständige Screenreader-Unterstützung
- [ ] Kontrast- und Fokus-Optimierung app-weit
- [x] Reduced-Motion Support (`prefers-reduced-motion` in `index.css`)
- [ ] axe/Lighthouse + Tastatur-Smoke-Test als Evidence abschließen

**Deliverables:** Mobile Specs, Accessibility-Checklist (grün)

---

### Phase 5 – AI-native Features & Skalierung (ab Monat 4+)
**Ziel:** Zukunftssicher und AI-first

- [x] Erste AI-Zusammenfassungs-/Explainability-Ansätze in bestehenden Analyse-Surfaces vorhanden
- [ ] Conversational Layer (Chat über Scores & Analysen) konsolidieren
- [ ] Personalisierte Dashboards / Saved Views
- [ ] Explainability-UI („Warum dieser Score?“) systematisieren
- [ ] Vollständiges Design-System + Storybook
- [ ] Komponenten-Bibliothek dokumentieren
- [ ] Theming & mögliche Light-Mode-Option (optional)

**Deliverables:** AI-Chat-Interface, personalisierte Views, Design-System v1.0

---

## 4. Quick Wins — aktueller Status

1. **Mehr Abstand zwischen den Hauptkarten** → ✅ Enterprise + Universe + AssetUniverse + MarketScreener
2. **Score- und Matrix-Bereiche vollständig sichtbar und prominent** → 🟡 teilweise; Folgearbeit
3. **Einheitliche Status-Badges** → 🟡 `StatusBadge`-Primitive live; siteweite Migration offen
4. **Mobile Chip-/Button-Größen** → 🟡 44×44-Policy auf Kern-Surfaces und identifizierte Dashboard-P1-Controls erweitert; app-weite Migration offen
5. **Hintergrund / Neural-Pulse abschwächen** → ✅ Motion reduziert + Reduced Motion + Dashboard/Landing-Layer gedämpft
6. **Klare primäre Aktion pro Viewport** → ✅ Kernstichprobe; app-weite Design-System-Regel folgt
7. **Critical-Path entlasten** → ✅ Dashboard-Shell + Backtest/Sentiment/Admin native lazy; Build-Evidence offen
8. **Chunk-Regressionsschutz** → ✅ kein `manualChunks`; statischer Test schützt Strategie
9. **Dashboard-Semantik** → ✅ identifizierte P1/P2-Kernfunde behoben und durch Regressionstest geschützt

Details: `docs/frontend/PHASE1_QUICK_WINS.md`

---

## 5. Erfolgsmetriken

- Lighthouse Performance ≥ 90
- Accessibility Score ≥ 95
- Keine kritischen axe-Verstöße in Kernansichten
- Reduktion der Time-to-First-Score
- Schwere sekundäre Views nicht unnötig im initialen Critical Path
- Positive Nutzer-Feedback zu Klarheit und Übersichtlichkeit
- Komponenten-Wiederverwendbarkeit > 80 %

**Evidence-Regel:** Erfolgsmetriken werden erst als erreicht markiert, wenn reproduzierbare Messungen vorliegen.

---

## 6. Nächste Schritte

1. **QW-Paket A verifizieren:** Klasse-C-CI/Production Build durchführen und Async-Chunk-Evidence festhalten
2. **QW-Paket A verifizieren:** Lighthouse / axe / Tastatur-Smoke-Evidence eintragen
3. **QW-Paket B:** `Button` / `IconButton` / `Chip` / `Skeleton`-Primitives extrahieren und app-weite Migration beginnen
4. **Phase 2:** IA, Progressive Disclosure, Produkt-Onboarding und Loading/Empty States systematisch fortsetzen
5. **Data Viz:** Score-/Matrix-Prominenz und nicht-farbabhängige Chart-Semantik verbessern
6. Öffentlicher Mirror `SvenKulessa/capital-ai-frontend` nur bei bewusstem Synchronisationsbedarf aktualisieren

---

*Dokument erstellt am 16.08.2026 · Version 1.5 / QW-Paket A Source-Scope abgeschlossen am 19.08.2026; Build/Live Evidence pending.*
