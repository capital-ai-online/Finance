# CAPITAL-AI Frontend Roadmap

**Projekt:** capital-ai.online  
**Repository:** SvenKulessa/Finance  
**Version:** 1.1  
**Stand:** 16. August 2026  
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
- Klare Status-Kommunikation (READY / REJECT / DATA_UNAVAILABLE)
- Gute Grundstruktur für Multi-Asset-Scoring (`Dashboard`, `AssetUniverseDashboard`, `Screener`, `CryptoScoringEnterprise`)
- Responsive Basis und Motion-Integration vorhanden
- Fokus-Outline und Glassmorphism-Patterns in `FRONTEND_ARCH.md` und `index.css` bereits definiert

**Schwächen**
- Hohe Informationsdichte in großen Komponenten (z. B. `Dashboard.tsx`)
- Zu wenig Whitespace und unklare Card-Hierarchie
- Hintergrund-/Neural-Animationen können ablenken
- Score-Visualisierungen und Multi-Faktor-Matrix noch nicht optimal prominent
- Fehlendes starkes Onboarding & progressive Disclosure
- Design-Tokens erst seit Phase 0 formal inventarisiert
- Kein Storybook / Component-Library-Dokumentation

---

## 3. Roadmap-Phasen

### Phase 0 – Fundament (Woche 1–2) — **IN PROGRESS**
**Ziel:** Stabile Basis schaffen

- [x] Design-Tokens formalisieren — `docs/frontend/design-tokens.json` + `PHASE0_DESIGN_TOKENS.md`
- [x] Accessibility-Audit-Checkliste — `PHASE0_ACCESSIBILITY_AUDIT.md` (Live-Messung pending)
- [x] Performance-Baseline-Protokoll — `PHASE0_PERFORMANCE_BASELINE.md` (Messung pending)
- [x] Einheitliche Error- und Loading-States spezifiziert — `PHASE0_LOADING_ERROR_STATES.md`
- [x] Component Inventory finalisieren — `docs/frontend/COMPONENT_INVENTORY.md`
- [ ] Storybook-Grundlage vorbereiten (optional, parallel)
- [ ] Live Lighthouse / axe-Messung dokumentieren
- [ ] StatusBadge-Primitive (erster Code-Schritt, eigener PR)

**Deliverables:**  
`design-tokens.json`, Phase-0-Docs, Inventory ✅ · Live-Baseline & erste Primitive ⏳

---

### Phase 1 – Visual Design System & Look & Feel (Woche 3–6)
**Ziel:** Professionelles, ruhiges Erscheinungsbild

- [ ] Dark-Theme verfeinern (präzisere Semantic Colors auf Basis AIF-Gold / Neon)
- [ ] Mehr Whitespace und klarere Card-Hierarchie (Glassmorphism-Panels)
- [ ] Hintergrund-Partikel / Neural-Animationen abschwächen oder deaktivierbar machen
- [ ] Einheitliche Card-, Badge- und Button-Stile
- [ ] Score-Gauges und Multi-Faktor-Matrix visuell vervollständigen und prominent platzieren
- [ ] Typografie-Upgrade (bestehende Poppins / Montserrat / JetBrains Mono nutzen und Tracking optimieren)
- [ ] Icon-Library (lucide-react) vereinheitlichen

**Deliverables:**  
Aktualisiertes Design-System, Visual Specs, verbesserte Hauptansicht (`Dashboard` / `AssetUniverseDashboard`)

---

### Phase 2 – Information Architecture & UX (Woche 5–10)
**Ziel:** Klare Struktur und geführte Nutzung

- [ ] Progressive Disclosure einführen
- [ ] Primäre Hierarchie: Score → Kurzanalyse → Detail-Matrix
- [ ] Verbesserte Asset-Suche & Filter-UX
- [ ] Onboarding / First-Time-User-Flow
- [ ] Empty States, Skeleton Loaders, Success/Error Feedback
- [ ] Secondary Navigation überarbeiten (weniger parallele CTAs)
- [ ] Command-Palette (Power-User) vorbereiten

**Deliverables:**  
UX-Flows, Wireframes, aktualisierte Navigation

---

### Phase 3 – Interaktionen & Data Visualization (Woche 8–14)
**Ziel:** Polierte Interaktionen und starke Visualisierungen

- [ ] Mikro-Interaktionen und sanfte Transitions (Motion)
- [ ] Interaktive Multi-Faktor-Bewertungsmatrix
- [ ] Verbesserte Score-Visualisierungen (Gauge, Trend, Breakdown) mit Recharts / D3
- [ ] Keyboard-Navigation und Focus-Management
- [ ] Live-Daten-Feedback (subtil)
- [ ] Export- und Share-Funktionen für Scores (bestehende PDF-Export-Pfade erweitern)

**Deliverables:**  
Interaktive Komponenten, Data-Viz Specs

---

### Phase 4 – Mobile & Accessibility (parallel ab Woche 4)
**Ziel:** Exzellente mobile und barrierefreie Erfahrung

- [ ] Touch-optimierte Chips und Bottom-Sheets (44×44 px)
- [ ] Mobile Informationsarchitektur optimieren
- [ ] Vollständige Screenreader-Unterstützung
- [ ] Kontrast- und Fokus-Optimierung (bestehende `*:focus-visible` erweitern)
- [ ] Reduced-Motion Support

**Deliverables:**  
Mobile Specs, Accessibility-Checklist (grün)

---

### Phase 5 – AI-native Features & Skalierung (ab Monat 4+)
**Ziel:** Zukunftssicher und AI-first

- [ ] Conversational Layer (Chat über Scores & Analysen)
- [ ] Personalisierte Dashboards / Saved Views
- [ ] Explainability-UI („Warum dieser Score?“ – Anbindung an `scoreExplainabilityAgent`)
- [ ] Vollständiges Design-System + Storybook
- [ ] Komponenten-Bibliothek dokumentieren
- [ ] Theming & mögliche Light-Mode-Option (optional)

**Deliverables:**  
AI-Chat-Interface, personalisierte Views, Design-System v1.0

---

## 4. Quick Wins (sofort umsetzbar)

1. Mehr Abstand zwischen den Hauptkarten
2. Score- und Matrix-Bereiche vollständig sichtbar und prominent machen
3. Einheitliche Status-Badges (READY / REJECT / DATA_UNAVAILABLE)
4. Mobile Chip-Layout und Button-Größen optimieren (BFSG)
5. Hintergrund-Grafiken / Neural-Pulse deaktivierbar oder stark reduzieren
6. Klare primäre Aktion pro Viewport definieren

---

## 5. Erfolgsmetriken

- Lighthouse Performance ≥ 90
- Accessibility Score ≥ 95
- Reduktion der Time-to-First-Score
- Positive Nutzer-Feedback zu Klarheit und Übersichtlichkeit
- Komponenten-Wiederverwendbarkeit > 80 %

---

## 6. Nächste Schritte

1. ~~Phase 0 Dokumentation~~ → **läuft** (Tokens + Specs)
2. Live Lighthouse / axe-Baseline eintragen
3. StatusBadge-Primitive als erster Code-PR
4. Regelmäßige Reviews (alle 2 Wochen)
5. Öffentlicher Mirror `SvenKulessa/capital-ai-frontend` bei Bedarf synchron halten

---

*Dokument erstellt am 16.08.2026 – Phase 0 gestartet 16.08.2026 – wird laufend aktualisiert.*
