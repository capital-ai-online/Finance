# Phase 0 — Design Tokens

**Status:** IN PROGRESS  
**Stand:** 16. August 2026  
**Quelle:** `src/index.css` (`@theme`), `docs/frontend/FRONTEND_ARCH.md`  
**Artefakt:** `docs/frontend/design-tokens.json`

---

## Zweck

Formale Extraktion und Erweiterung der Design-Tokens als Single Source of Truth für Phase 0–1. Runtime bleibt Tailwind CSS 4 `@theme` in `src/index.css`; JSON dient Dokumentation, Audits und künftigem Storybook.

---

## Bereits im Code vorhanden (`src/index.css`)

| Token | Wert | Verwendung |
|-------|------|------------|
| `--color-background` | `#18181b` | Canvas |
| `--color-foreground` | `#FFFFFF` | Primärtext |
| `--color-border` | `rgba(255,255,255,0.08)` | Borders |
| `--color-aif-gold-*` | light / DEFAULT / dark / muted | Premium, Fokus, CTA |
| `--color-aif-neon-cyan` | `#0DDDDD` | Neural / Live |
| `--color-aif-neon-purple` | `#B026FF` | Accent |
| `--font-sans` | Poppins | Body |
| `--font-display` | Montserrat | Headings |
| `--font-mono` | JetBrains Mono | Scores, Code |
| Focus ring | `2px solid #F5C453`, offset 4px | `*:focus-visible` |

---

## Neu formalisiert (Phase 0 — dokumentiert, noch nicht alle in `@theme`)

### Semantic Status Colors

| Status | Farbe | Intent |
|--------|-------|--------|
| READY | `#4ade80` (green-400) | Verifiziert / freigegeben |
| REJECT | `#f87171` (red-400) | Abgelehnt / Fail |
| OBSERVE | `#fbbf24` (amber-400) | Beobachten / Grenzfall |
| DATA_UNAVAILABLE | `rgba(255,255,255,0.35)` | Keine Daten |

### Spacing & Radius (Empfehlung Phase 1)

- Card padding: `1.5rem` (`p-6`)
- Inter-card gap (Whitespace-Quick-Win): `2rem` (`gap-8`)
- Primary radius: `0.75rem` (`rounded-xl`)

### Motion

- Exit / snappy: `0.2s` (laut FRONTEND_ARCH)
- Standard easing: `cubic-bezier(0.4, 0, 0.6, 1)`
- Reduced-motion: `prefers-reduced-motion` respektieren (Phase 4 / parallel)

---

## Glassmorphism Card (kanonisches Pattern)

```text
bg-neutral-950/40 border border-white/10 backdrop-blur-md rounded-xl p-6
```

---

## Nächste Code-Schritte (optional, eigener PR)

1. Semantic status colors in `@theme` aufnehmen (`--color-status-ready` etc.)
2. Spacing-Tokens für section/card in `@theme` spiegeln
3. `prefers-reduced-motion` Utility für Neural-/Gold-Animationen

---

## Abnahme Phase 0 (Tokens)

- [x] Tokens aus `index.css` inventarisiert
- [x] `design-tokens.json` angelegt
- [x] Semantic Status + Spacing dokumentiert
- [ ] Optional: `@theme`-Erweiterung in Runtime-PR
