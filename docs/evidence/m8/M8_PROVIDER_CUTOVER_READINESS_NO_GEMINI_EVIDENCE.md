# M8 — Provider Cutover Readiness Gate (ohne Gemini-Runtime)

Status: IMPLEMENTED / PR-CI PENDING  
Datum: 2026-08-15  
Baseline: `main@c7bb16c9d02025da703c28fee2b92f7291842efc`  
Authority: ADR-0062, ESS-0019, `docs/runbooks/M8_AGENT_CUTOVER.md`

## Owner-Entscheidung

Gewählte Sicherheitsoption: fail-closed Cutover Readiness Gate. Zusätzliche Vorgabe: keine Gemini-API oder Gemini-Runtime-Integration; die APIs wurden bereits vollständig entfernt.

## Implementierung

`evaluateProviderCutoverReadiness()` erlaubt einen privilegierten Provider-Cutover nur, wenn folgende Evidence vollständig vorliegt:

1. realer Aufrufer;
2. kanonischer provider-neutraler Control-Plane-Pfad;
3. DENY eines provider-spezifischen Bypasses;
4. vollständige Audit-Korrelation;
5. Rollback auf Read-only;
6. verifizierte externe Host-/Connector-Konfiguration.

Fehlt ein Nachweis, bleibt der mutierende Provider `BLOCKED`.

## Provider-Abgrenzung

- `chatgpt-github-connector`: mutierendes Profil; Readiness nur mit vollständiger Evidence.
- `claude-code-cli`: mutierendes Profil; aktuell ohne bestätigte externe Host-/Bypass-Evidence blockiert.
- `google-ai-studio`: Development Plane ohne mutierende Capability; privilegierter Cutover `NOT_APPLICABLE`. Keine Gemini-API-/Runtime-Integration.
- `notebooklm`: Research Plane; privilegierter Cutover `NOT_APPLICABLE`.
- `gemini`: kein Registry-Profil; unbekannter/entfernter Alias bleibt `BLOCKED`.

## Sicherheitswirkung

Der Gate kann Berechtigungen nicht erweitern. Er bewertet nur die zusätzliche Cutover-Reife eines bereits definierten Profils. Provider-/Modellnamen verleihen keine Authority. Externe Connector-Grants müssen am jeweiligen Host verifiziert werden; Repository-Evidence allein genügt nicht.

## Tests

- vollständige Evidence → `READY` für mutierendes Profil;
- fehlende Bypass-/Host-Evidence → `BLOCKED`;
- Google AI Studio → `NOT_APPLICABLE`, keine BRANCH-/PR-Capability;
- NotebookLM → `NOT_APPLICABLE`;
- Gemini-Alias → `BLOCKED`.

CI-/Build-Nachweise: PENDING PR-CI.
