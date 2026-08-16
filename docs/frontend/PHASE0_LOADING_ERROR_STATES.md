# Phase 0 — Loading & Error State Patterns

**Status:** SPEC READY  
**Stand:** 16. August 2026  
**Ziel:** Einheitliche UX für Loading, Empty, Error und DATA_UNAVAILABLE

---

## 1. State-Modell

| State | Wann | UI-Intent |
|-------|------|-----------|
| `idle` | Noch keine Anfrage | Placeholder / CTA |
| `loading` | Request läuft | Skeleton oder subtiler Indicator — kein Layout-Jump |
| `ready` | Daten verifiziert | Score / Content |
| `partial` | Teilweise Daten | Content + Warnhinweis |
| `data_unavailable` | Provider/Daten fehlen | Neutrales Badge + Erklärung, kein Fake-Score |
| `error` | Technischer Fehler | Fehlertext + Retry, fail-closed |
| `reject` | Business-Entscheidung negativ | Status-Badge REJECT, nachvollziehbar |

**Direktive (AGENTS.md):** Keine Fake-/Mock-Daten an Endnutzer. `DATA_UNAVAILABLE` und Errors müssen klar unterscheidbar sein.

---

## 2. Visuelle Konventionen (an Tokens gebunden)

| State | Farbe / Pattern | Badge-Text |
|-------|-----------------|------------|
| READY | semantic.success `#4ade80` | `READY` |
| REJECT | semantic.danger `#f87171` | `REJECT` |
| OBSERVE | semantic.warning `#fbbf24` | `OBSERVE` |
| DATA_UNAVAILABLE | semantic.muted / status.dataUnavailable | `DATA_UNAVAILABLE` |
| ERROR | danger + `role="alert"` | kontextabhängig |
| LOADING | Skeleton (`animate-pulse` auf Glass-Flächen) oder Spinner in Gold/Cyan | — |

Badge-Mindestinhalt: **Farbe + Text** (nicht nur Farbe) — A11y.

---

## 3. Skeleton-Pattern (Empfehlung)

```text
Container: gleiche Glass-Card-Struktur wie Ready-State
Blöcke: bg-white/5 rounded-md animate-pulse
Höhe: typische Score-/Textzeilen nachbilden (CLS vermeiden)
Dauer: bis Daten oder Error/Unavailable
```

Reduced-motion: `animate-pulse` durch statischen Placeholder ersetzen.

---

## 4. Error-Pattern

1. Kurze, verständliche Meldung (kein Stack-Trace an Endnutzer)
2. Optional: Request-/Evidence-ID für Support (ohne PII)
3. Primäraktion: **Erneut versuchen**
4. Sekundär: Support / Status-Seite falls vorhanden
5. `role="alert"` oder live-region für Screenreader

---

## 5. DATA_UNAVAILABLE-Pattern

1. Kein numerischer Score vortäuschen
2. Badge `DATA_UNAVAILABLE`
3. Ein Satz: warum (z. B. Provider, Asset-Typ, Berechtigung)
4. Optional: welche Faktoren fehlen (ohne interne Secrets)

---

## 6. Implementierungs-Reihenfolge (nach Phase 0 Spec)

1. Gemeinsame Badge-Primitive (StatusBadge)
2. Shared Skeleton-Bausteine für Score-Cards
3. Vereinheitlichung in `Dashboard`, `AssetUniverseDashboard`, `Screener`, `CryptoScoringEnterprise`
4. Empty States für Watchlist / Search

---

## 7. Abnahme Phase 0

- [x] State-Modell dokumentiert
- [x] Visuelle Konventionen an Tokens gekoppelt
- [ ] Mindestens eine Referenz-Implementierung (StatusBadge) in Code-PR
- [ ] Inventory der aktuellen ad-hoc Loading/Error-Stellen (Stichprobe)
