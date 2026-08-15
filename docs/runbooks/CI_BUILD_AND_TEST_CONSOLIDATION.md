# Runbook — CI-Konsolidierung auf build-and-test

Status: OWNER ACTION REQUIRED BEFORE MERGE  
ADR: ADR-0073

## Vorher

Required Checks:

- `capital-ai-ci`
- `build-and-test`
- `GitGuardian Security Checks`

## Nachher

Required Checks:

- `build-and-test`
- `GitGuardian Security Checks`

## Owner-Schritte

1. Live-Ruleset `main-production-protection` öffnen.
2. Nur `capital-ai-ci` aus Required status checks entfernen.
3. Prüfen, dass `build-and-test` und GitGuardian erhalten bleiben.
4. Keine Bypass Actors hinzufügen.
5. Einstellung speichern.
6. Im Konsolidierungs-PR bestätigen, dass der Ruleset-Cutover abgeschlossen ist.
7. Erst danach Merge freigeben.

## Fail-Closed

Falls `capital-ai-ci` vor dem Merge weiterhin Required ist, darf der PR nicht gemergt werden.
Nach einem Merge würde sonst jeder neue PR auf einen nicht mehr existierenden Check warten.

## Erwarteter Nutzen

- ein statt zwei vollständiger Node-/Build-Läufe pro PR;
- geringere Actions-Kosten;
- unverändertes Owner-Gate;
- unveränderte technische Prüftiefe.
