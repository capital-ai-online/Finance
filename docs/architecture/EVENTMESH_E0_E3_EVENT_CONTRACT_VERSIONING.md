# EventMesh E0 + E3 — Event Contract Inventory & Versioning

Status: IMPLEMENTED IN DRAFT  
Date: 2026-08-10  
Authority: ESS-0013 / ESS-0013-CONTRACTS  
Foundation: D3 / PR #165 / main `65e9950b07cb8bad863ee387a811a52972697e11`

## E0 — Event Contract Inventory

`buildEventContractInventory()` erzeugt eine deterministische Producer-/Consumer-Matrix aus dem bestehenden `STANDARD_EVENT_CATALOG` und den deklarierten `events.produces` / `events.consumes` der Platform-Manifeste. Es wird keine zweite Event Registry eingeführt.

Erkannte Gap-Typen:
- `NO_PRODUCER`
- `NO_CONSUMER`
- `NO_AUTHORITY`
- `UNREGISTERED_EVENT`

Unregistrierte oder authority-lose Events sind im Automation Entry Point blockierend. Producer-/Consumer-Lücken bleiben sichtbare Evidence und werden nicht automatisch durch erfundene Komponentenbeziehungen geschlossen.

## E3 — Version-aware Event Contracts

`EventRuntimeVersionContext` ergänzt den bestehenden Event-Contract additiv um:
- `schemaVersion`
- `producerComponentVersion`
- `platformVersion`
- `sourceCommit`

Alle Versionen müssen strict SemVer sein; `sourceCommit` muss ein vollständiger 40-stelliger Git-SHA sein. Die bestehende `EventVersion`-Authority bleibt unverändert.

Compatibility Policy:
- gleiches Major + monotone Minor/Patch-Entwicklung: kompatibel;
- Major-Wechsel: breaking und nur über ADR/Contract-Migration zulässig;
- Downgrade: nicht kompatibel;
- keine automatische Contract-Migration durch EventMesh.

## Schutzgrenzen

- kein zweiter EventBus / keine zweite Event Registry;
- keine neuen fachlichen Event-Typen;
- keine autonome Producer-/Consumer-Zuordnung;
- keine Änderung an Stripe, Supabase, Render, DB-Schemas oder ENV Keys;
- keine neue GitHub-Actions-Vollpipeline;
- bestehende Human-/Governance-Grenzen bleiben unverändert.

## Exit

E0 ist erfüllt, wenn die kanonischen Events mit Producer-/Consumer-/Authority-Evidence inventarisierbar sind. E3 ist erfüllt, wenn Events eine validierbare Schema-/Producer-/Platform-/Commit-Versionsevidence tragen können und Breaking Changes fail-closed erkennbar sind.
