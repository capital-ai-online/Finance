# Phase 0 — Accessibility Audit Checklist

**Status:** BASELINE / IN PROGRESS  
**Stand:** 19. August 2026  
**Ziel:** WCAG 2.2 AA · BFSG · EN 301 549  
**Bezug:** `FRONTEND_ARCH.md`, `src/index.css`, `PHASE1_QUICK_WINS.md`

---

## 1. Bereits vorhanden (Code-Evidence)

| Kontrolle | Evidence | Status |
|-----------|----------|--------|
| Fokus-Outline | `*:focus-visible { outline: 2px solid #F5C453; outline-offset: 4px }` | PASS (Basis) |
| Min. Hit-Target Policy | `--ui-hit-min: 44px`, `.ui-hit`; Dashboard-Sprungnavigation + zentrale Close-Controls 44×44 | PARTIAL PASS — app-weite Prüfung offen |
| Reduced Motion | `prefers-reduced-motion` deaktiviert Neural-/Gold-/Brand-Animationen | PASS (Basis) |
| Decorative Neural Layer | Dashboard/Landing Root-Layer Opacity 0.4 + pointer-events none | PASS (Phase-1 Basis) |
| MarketScreener Search | programmatisches Label via `label` + `htmlFor`/`id` | PASS |
| MarketScreener Remove | Icon-Buttons mit `aria-label` + `.ui-hit` | PASS |
| MarketScreener Fehler | `role="alert"` | PASS |
| Dashboard Drawer-Profil | semantischer Link statt `div onClick` | PASS |
| Dashboard Drawer Close | `button`, `aria-label`, `.ui-hit`, dekoratives X `aria-hidden` | PASS |
| Dashboard Breadcrumb | semantischer Button statt klickbarem `span`, `.ui-hit` | PASS |
| Push Notification Close | `button`, dynamischer zugänglicher Name, `.ui-hit` | PASS |
| Lazy Loading Feedback | Dashboard, Backtest, Sentiment, Admin mit `role="status"` + `aria-live="polite"` | PASS (Code-Evidence) |
| Responsive Grids | `grid-cols-1 md:… lg:…` Pattern in Architektur | PARTIAL |
| Dark Contrast Base | `#18181b` + weißer Text | Basis ok — Komponenten prüfen |

---

## 2. Audit-Checkliste (manuell / Tools)

### 2.1 Wahrnehmung (Perceivable)

- [ ] Kontrast Text/Hintergrund ≥ 4.5:1 (Normaltext), ≥ 3:1 (Large Text / UI)
- [ ] Gold auf Dark (`#F5C453` auf `#18181b`) verifizieren
- [ ] Statusfarben (grün/rot/amber) nicht allein farbcodiert — Icon/Text ergänzen
- [ ] Charts: nicht nur Farbe (Pattern/Label)
- [ ] Bilder/Logos: `alt`-Texte (`AssetLogo`, `CapitalAiLogo`)

### 2.2 Bedienbarkeit (Operable)

- [ ] Alle interaktiven Elemente app-weit per Tastatur erreichbar — Dashboard-P1-Stichprobe behoben; vollständiger Walkthrough ausstehend
- [x] Sichtbarer globaler Fokus-Baseline-Stil vorhanden
- [ ] Hit-Targets ≥ 44×44 px vollständig — MarketScreener, Dashboard-Sprungnavigation, Drawer Close, Breadcrumb und Push Close umgesetzt; weitere Surfaces offen
- [ ] Keine Tastaturfalle in Modals (`StepUpModal`, `SubscriptionModal`, `ComplianceConsentModal`)
- [ ] Skip-Link oder äquivalente Landmark-Navigation (optional Phase 4)

### 2.3 Verständlichkeit (Understandable)

- [ ] Form-Labels anwendungsweit (Auth, Profile, Checkout)
- [x] MarketScreener-Suchfeld programmatisch beschriftet
- [x] MarketScreener technischer Fehlerzustand mit `role="alert"`
- [x] zentrale Dashboard-Icon-Close-Controls der Stichprobe besitzen zugängliche Namen
- [ ] Fehlermeldungen anwendungsweit programmatisch verknüpft (`aria-describedby` / `role="alert"`)
- [x] Sprache der öffentlichen Seite über `index.html` auf `lang="de"`

### 2.4 Robustheit (Robust)

- [ ] Semantische HTML-Rollen anwendungsweit — bekannte Dashboard-P1-Verstöße behoben, vollständiger Scan offen
- [ ] ARIA nur wo nötig und korrekt
- [ ] Screenreader-Smoke-Test: Dashboard, Screener, Score-Card, Modal

### 2.5 Motion

- [x] `prefers-reduced-motion`: Neural-Pulse, Gold-Pulse, Brand-Border abschaltbar
- [x] Dashboard-/Landing-Neural-Layer visuell gedämpft
- [ ] Exit-Animationen ≤ 0.2s bzw. vollständig reduced-motion-kompatibel anwendungsweit prüfen

---

## 3. Priorisierte Fundstellen — Stand 19.08.2026

| Priorität | Bereich | Befund | Status / nächster Schritt |
|-----------|---------|--------|--------------------------|
| P1 | `Dashboard.tsx` Drawer-Profil | klickbares `div onClick` | ✅ behoben: semantischer Link mit zugänglichem Namen |
| P1 | `Dashboard.tsx` Drawer Close | kleiner Icon-only X-Button | ✅ behoben: `.ui-hit` + `aria-label` |
| P1 | `Dashboard.tsx` Push Notification Close | Icon-only X ohne Zielgröße/Name | ✅ behoben: `.ui-hit` + dynamisches `aria-label` |
| P2 | `Dashboard.tsx` Breadcrumb | klickbarer `span` | ✅ behoben: semantischer `.ui-hit`-Button |
| P2 | Charts (`Charts.tsx`, Recharts/D3) | mögliche Farbabhängigkeit | Labels / Patterns + axe/manueller Check |
| P2 | Modals | Focus-Trap nicht vollständig verifiziert | explizite Focus-Management-Prüfung |
| P2 | App-weite Chips / Filter | 44×44 noch nicht flächendeckend | nach Button/IconButton-Primitive konsolidieren |

### Bereits behobene Phase-1-Funde

- MarketScreener Search erhält programmatisches Label.
- MarketScreener Remove-Controls besitzen zugängliche Namen und 44×44-Ziel.
- MarketScreener Error ist programmatisch angekündigt.
- Dashboard-Sprungnavigation erfüllt die 44×44-Projektpolicy.
- Dashboard Drawer-Profil ist semantisch tastaturerreichbar.
- Dashboard Drawer-/Push-Close-Controls besitzen zugängliche Namen und 44×44-Ziele.
- Dashboard-Breadcrumb verwendet ein semantisches Control.
- Lazy-Loading-Fallbacks werden als Status angekündigt.
- Dekorative Neural-Layer sind gedämpft; Reduced Motion bleibt aktiv.

---

## 4. Empfohlene Tools / Evidence

1. Chrome Lighthouse → Accessibility Score (Ziel ≥ 95)
2. axe DevTools / axe-core auf Public-/Guest- und authentifizierten Kernansichten
3. Tastatur-only Walkthrough (Tab / Shift+Tab / Enter / Esc)
4. Optional: VoiceOver / NVDA Smoke-Test

**Evidence-Regel:** Keine Accessibility-Scores als PASS dokumentieren, solange kein reproduzierbarer Browserlauf vorliegt.

---

## 5. Abnahme Phase 0 (A11y)

- [x] Checkliste dokumentiert
- [x] Phase-1-Code-Evidence und konkrete Source-Funde eingetragen
- [x] bekannte P1-Dashboard-Semantikfunde behoben
- [ ] Lighthouse Accessibility Score gemessen und notiert
- [ ] axe-Findings für Kernansichten dokumentiert
- [ ] Kritische Failures (Fokus, Kontrast, Hit-Target) final bewertet
- [ ] Keine neuen BLOCKER ohne Ticket/Backlog-Eintrag

**Hinweis:** Vollständige VERIFIED PASS erst nach Live-Messung + verbleibenden Phase-1/4-Fixes.
