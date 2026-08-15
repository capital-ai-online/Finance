# Archive Note — 2026-08-15

**Document ID:** ARCHIVE-NOTE-2026-08-15  
**Authority:** DOCUMENTATION_HYGIENE_POLICY + ROADMAP-INTEGRATED-DC-SA-0001  

## Zweck

Dieses Notiz dokumentiert die richtlinienkonforme Behandlung von Dokumenten, die durch die neue Integrated Roadmap und die SEO-GM-Konsolidierung als SUPERSEDED gelten.

## Verschiebungsvorschläge (noch nicht im Remote-Repo ausgeführt)

| Quell-Pfad | Ziel | Begründung |
|------------|------|------------|
| `docs/roadmaps/MARKETING_AGENT_ROADMAP.md` | `docs/archive/legacy/` (oder Status SUPERSEDED belassen) | Durch SEO-GM-ROADMAP-0002 ersetzt |
| `docs/seo/SEO_MANAGEMENT_ROADMAP.md` | `docs/archive/legacy/` | Durch SEO-GM-ROADMAP-0002 ersetzt |
| `docs/architecture/ARCHITECTURE_GAP_REPORT.md` | `docs/archive/evidence/` | Historischer Snapshot (viele Gaps inzwischen geschlossen); Evidence-Wert erhalten |

## Regel

- Keine Löschung von Evidence.
- Canonical Documents behalten stabile documentId.
- Pfad ist mutable Metadata.
- Jede reale Verschiebung im Repo erfordert Human/Owner-Review + PR + Merge gemäß DEVELOPMENT Chain Branch Lifecycle.

## Nächster Schritt

Owner entscheidet, ob die physische Verschiebung als Bounded Systemadmin Work-Package oder als normale Human-PR ausgeführt wird.
