# Phase 0 — Design Tokens

**Status:** IN PROGRESS  
**Stand:** 19. August 2026  
**Quelle:** `src/index.css` (`@theme`), `docs/frontend/FRONTEND_ARCH.md`  
**Artefakt:** `docs/frontend/design-tokens.json`

---

## Zweck

Formale Extraktion und Erweiterung der Design-Tokens als Single Source of Truth für Phase 0–1. Runtime bleibt Tailwind CSS 4 `@theme` in `src/index.css`; JSON dient Dokumentation, Audits sowie als build-time Quelle für renderer-spezifische Adapter.

Für PDF-Ausgaben gilt seit ADR-0091/ADR-0092: `vite.config.ts` liest die benötigten Produkt-/Print-Tokens und injiziert daraus den Renderer-Contract `__CAPITAL_AI_PDF_BRAND__`. Aktive PDF-Komponenten pflegen dadurch keine eigene Farbpalette.

> **Format-Hinweis:** Das bestehende JSON-Artefakt verwendet weiterhin das historisch eingeführte `value`/`type`-Format. Die PDF-Bridge kann zusätzlich `$value` lesen, eine vollständige repository-weite Migration auf den stabilen DTCG-2025.10-Contract ist jedoch ein eigener Design-System-Change und nicht Teil der PDF-Finalisierung.

---

## Im Runtime-Code vorhanden (`src/index.css`)

| Token | Wert | Verwendung |
|-------|------|------------|
| `--color-background` | `#18181b` | Canvas |
| `--color-foreground` | `#FFFFFF` | Primärtext |
| `--color-border` | `rgba(255,255,255,0.08)` | Borders |
| `--color-aif-gold-*` | light / DEFAULT / dark / muted | Premium, Fokus, CTA, PDF-Branding |
| `--color-aif-neon-cyan` | `#0DDDDD` | Neural / Live / PDF-Akzent |
| `--color-aif-neon-purple` | `#B026FF` | Accent / PDF-Akzent |
| `--font-sans` | Poppins | Body |
| `--font-display` | Montserrat | Headings |
| `--font-mono` | JetBrains Mono | Scores, Code |
| Focus ring | `2px solid #F5C453`, offset 4px | `*:focus-visible` |

---

## Renderer-spezifische Print-Tokens

Die folgenden Werte sind bewusst als **Print-Adapter** formalisiert. Sie sind keine neue Markenpalette, sondern drucktaugliche Neutral-/Linkwerte unterhalb der Produkt-SSOT.

| Token | Wert | Verwendung |
|-------|------|------------|
| `color.print.textPrimary` | `#1D2430` | Primärtext auf hellen PDF-Flächen |
| `color.print.textSecondary` | `#64748B` | Metadaten / sekundärer Text |
| `color.print.surfaceLight` | `#F8FAFC` | Helle Report-Panels / Codeflächen |
| `color.print.borderLight` | `#E2E8F0` | Tabellen / Divider |
| `color.print.link` | `#005F66` | kontrastreicher Print-Link aus der Cyan-Familie |

`vite.config.ts` konvertiert die Hex-Tokens für jsPDF deterministisch in RGB-Tupel. Der NotebookLM-/WeasyPrint-Exporter liest dieselben Tokens direkt.

---

## Semantic Status Colors

| Status | Farbe | Intent |
|--------|-------|--------|
| READY | `#4ade80` (green-400) | Verifiziert / freigegeben |
| REJECT | `#f87171` (red-400) | Abgelehnt / Fail |
| OBSERVE | `#fbbf24` (amber-400) | Beobachten / Grenzfall |
| DATA_UNAVAILABLE | `rgba(255,255,255,0.35)` | Keine Daten |

### Spacing & Radius

- Card padding: `1.5rem` (`p-6`)
- Inter-card gap: `2rem` (`gap-8`)
- Primary radius: `0.75rem` (`rounded-xl`)

### Motion

- Exit / snappy: `0.2s`
- Standard easing: `cubic-bezier(0.4, 0, 0.6, 1)`
- Reduced-motion: `prefers-reduced-motion` respektieren

---

## Glassmorphism Card (kanonisches Pattern)

```text
bg-neutral-950/40 border border-white/10 backdrop-blur-md rounded-xl p-6
```

---

## Renderer-Verträge

### Web / React

- `src/index.css` / Tailwind `@theme`
- Poppins / Montserrat / JetBrains Mono als Produktrollen

### Client-PDF / jsPDF

- `src/platform/PdfReporting/pdfBrand.ts`
- build-time Tokens aus `docs/frontend/design-tokens.json`
- PDF-safe Helvetica/Courier als tatsächlich verfügbare Renderer-Fallbacks
- CAPITAL-AI Vektor-Emblem aus Zeichenprimitiven
- Accessibility-Profil `client-jsPDF` / `metadata-only`

### Documentation-PDF / WeasyPrint

- `scripts/docs/export_notebooklm_pdfs.py`
- direkte Token-Lektüre
- lokale DejaVu-Fallbacks für reproduzierbare Druckausgabe
- CAPITAL-AI Internal Brand
- Accessibility-Profil `documentation-weasyprint`, tagged PDF/UA-1 mit separatem Verifikationsgate

---

## Abnahme Phase 0 / PDF-Adapter

- [x] Tokens aus `index.css` inventarisiert
- [x] `design-tokens.json` angelegt
- [x] Semantic Status + Spacing dokumentiert
- [x] Print-Tokens für PDF-Renderer formalisiert
- [x] jsPDF Build-Time-Adapter aus Token-SSOT abgeleitet
- [x] WeasyPrint liest dieselbe Token-SSOT
- [ ] Optional außerhalb dieses Scopes: repository-weite DTCG-2025.10-Formatmigration
