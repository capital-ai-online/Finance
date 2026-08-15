# ADR-0076: Naming & Repository Convention Validator als Capability des Enterprise Version Managers

## Status

Angenommen — 2026-08-03

## Numbering note

Formerly filed as ADR-0020 (number collision with multi-provider market-data routing). Content unchanged; number reassigned under ADR-0081.

## Kontext

CAPITAL-AI besitzt mit ESS-0004 bereits einen Enterprise Version Manager. Naming-, Repository- und Exception-Regeln aus ESS-0001-CONTRACTS sowie ADR-0011 sollen maschinell prüfbar sein — getrennt vom technischen Deployment-Gate.

## Entscheidung

Der Enterprise Version Manager erhält eine **Naming & Repository Convention Validator**-Capability unter `src/platform/VersionManager/repositoryConventionValidator.ts`, aufrufbar über `scripts/automation/validateRepositoryConventions.ts`.

Die Capability ist **read-only** und prüft u. a. Projektidentität `capital-ai`, SemVer, package/lock-Sync, ADR-/ESS-Dateinamenskonventionen, PascalCase, Case-Kollisionen und Exception-Registry.

### Betriebsmodi

- Advisory: `npm run repository:validate:advisory` (nicht blockierend)
- Strict: `npm run repository:validate` (Governance-Check, **kein** Deployment-Gate)

`predeploy:check` darf diesen Validator nicht aufrufen.

## Referenzen

ESS-0001-CONTRACTS, ESS-0004, ADR-0011, ADR-0019, ADR-0081
