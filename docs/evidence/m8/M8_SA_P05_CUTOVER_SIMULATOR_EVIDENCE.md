# M8 SA-P05 – Cutover-Simulator Evidence

## Umfang

SA-P05 ergänzt einen rein deterministischen Sandbox-Simulator für Provider-Cutover-Entscheidungen.
Er ruft weder Provider noch Tools oder externe Mutation-Endpunkte auf.

## Sicherheitsinvarianten

- Der vorhandene M8 Readiness Gate wird vor jedem Shadow-Vergleich ausgewertet.
- Fehlende Caller-, Control-Plane-, Bypass-, Audit-, Rollback- oder Host-Evidence blockiert fail-closed.
- Die Kandidatenentscheidung läuft über die kanonische Provider-Profile- und Agent-IAM-Kette.
- Ein Shadow-Mismatch blockiert.
- Auch ein Match setzt immer `executionPermitted: false`; es ist ausschließlich Review-Evidence.
- Google AI Studio bleibt nicht-privilegierte Development Plane, NotebookLM Research-only.
- Entfernte oder unbekannte Aliase wie `gemini` bleiben blockiert; keine Gemini API oder Runtime wurde ergänzt.

## Negative Tests

Die Tests decken fehlende Host-Evidence, Kill-Switch-Mismatch, Replay, nicht privilegierte Profile
und unbekannte Provider ab. Damit besitzt der Prototyp keinen Pfad zu einer echten Mutation.

## Rollback

Der neue Simulator ist ein isoliertes, seiteneffektfreies Modul. Rollback erfolgt durch Entfernen
von `providerCutoverSimulator.ts` und seines Unit-Tests; Provider Registry und IAM bleiben unverändert.
