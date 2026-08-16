# Phase 0 — Accessibility Audit Checklist

**Status:** BASELINE / IN PROGRESS  
**Stand:** 16. August 2026  
**Ziel:** WCAG 2.2 AA · BFSG · EN 301 549  
**Bezug:** `FRONTEND_ARCH.md`, `src/index.css` (`*:focus-visible`)

---

## 1. Bereits vorhanden (Code-Evidence)

| Kontrolle | Evidence | Status |
|-----------|----------|--------|
| Fokus-Outline | `*:focus-visible { outline: 2px solid #F5C453; outline-offset: 4px }` | PASS (Basis) |
| Min. Hit-Target Policy | FRONTEND_ARCH: 44×44 px dokumentiert | DOCUMENTED — Umsetzung prüfen |
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

- [ ] Alle interaktiven Elemente per Tastatur erreichbar
- [ ] Sichtbarer Fokus auf allen Controls (Modals, Chips, Tabs)
- [ ] Hit-Targets ≥ 44×44 px (Mobile + Desktop Touch)
- [ ] Keine Tastaturfalle in Modals (`StepUpModal`, `SubscriptionModal`, `ComplianceConsentModal`)
- [ ] Skip-Link oder äquivalente Landmark-Navigation (optional Phase 4)

### 2.3 Verständlichkeit (Understandable)

- [ ] Form-Labels (Auth, Profile, Checkout)
- [ ] Fehlermeldungen programmatisch verknüpft (`aria-describedby` / `role="alert"`)
- [ ] Sprache der Seite (`lang="de"` / dynamisch)

### 2.4 Robustheit (Robust)

- [ ] Semantische HTML-Rollen (button vs. div-onClick)
- [ ] ARIA nur wo nötig und korrekt
- [ ] Screenreader-Smoke-Test: Dashboard, Screener, Score-Card, Modal

### 2.5 Motion

- [ ] `prefers-reduced-motion`: Neural-Pulse, Gold-Pulse, Brand-Border dämpfen/abschalten
- [ ] Exit-Animationen ≤ 0.2s beibehalten, aber abschaltbar

---

## 3. Priorisierte Fundstellen (erste Stichprobe)

| Bereich | Risiko | Nächster Schritt |
|---------|--------|------------------|
| Große Composite-Komponenten (`Dashboard.tsx`, `AdminPanel.tsx`) | Dichte UI, viele Controls | Fokus-Reihenfolge & Hit-Targets |
| Status-Badges READY/REJECT/DATA_UNAVAILABLE | Nur Farbe | Badge-Primitive mit Icon + Text |
| Charts (`Charts.tsx`, Recharts/D3) | Farbabhängigkeit | Labels / Patterns |
| Modals | Fokus-Trap | Explizite Focus-Management-Prüfung |
| Chips / Filter | Mobile Hit-Target | 44px min height/width |

---

## 4. Empfohlene Tools (Baseline messen)

1. Chrome Lighthouse → Accessibility Score (Ziel ≥ 95)
2. axe DevTools / WAVE auf `https://capital-ai.online` (auth + guest)
3. Tastatur-only Walkthrough (Tab / Shift+Tab / Enter / Esc)
4. Optional: VoiceOver / NVDA Smoke-Test

---

## 5. Abnahme Phase 0 (A11y)

- [x] Checkliste dokumentiert
- [ ] Lighthouse Accessibility Score gemessen und notiert
- [ ] Kritische Failures (Fokus, Kontrast, Hit-Target) gelistet
- [ ] Keine neuen BLOCKER ohne Ticket/Backlog-Eintrag

**Hinweis:** Vollständige VERIFIED PASS erst nach Live-Messung + Fixes in Phase 1/4.
