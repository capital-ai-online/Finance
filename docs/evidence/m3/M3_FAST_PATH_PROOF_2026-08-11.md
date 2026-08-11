# M3 – Docs-only Fast-Path Proof

Status: VALIDATION PR
Datum: 2026-08-11
Baseline: `45e81c59ac47cf63d6961f5a7a41bf9a3011d9b8`

## Zweck

Dieses ausschließlich dokumentarische Artefakt dient als kontrollierter Post-Merge-Nachweis für den in M3 eingeführten Docs-only Fast Path.

## Erwartetes CI-Verhalten

Für diesen Pull Request MUSS der Required Check `build-and-test` erfolgreich bleiben, während die kostenintensiven Software-Gates übersprungen werden, da ausschließlich `docs/**` geändert wird.

Erwartet übersprungen:

- Git-2.55.0-Source-Build
- Node.js-/npm-Toolchain
- Dependency Installation und Audit
- TypeScript
- Unit Tests
- Production Build
- CSP-/Predeploy-Prüfungen
- Docker Build und Runtime-Metadaten

## Sicherheitsinvarianten

- Der Fast Path gilt ausschließlich für Pull Requests mit erlaubtem Dokumentationsscope.
- Änderungen an Code, Workflows, Dependencies, Runtime, Deployment oder Konfiguration erzwingen weiterhin Full Validation.
- Pushes auf `main` erzwingen weiterhin Full Validation unabhängig vom Dateiscope.
- `build-and-test` bleibt der Required Check; es wird kein Required Gate entfernt oder umbenannt.

## Exit-Kriterium

M3 darf erst nach erfolgreichem CI-Lauf dieses PRs als `COMPLETE` dokumentiert werden. Der CI-Lauf muss nachweisen, dass der Docs-only Fast Path aktiviert und der Required Check erfolgreich abgeschlossen wurde.
