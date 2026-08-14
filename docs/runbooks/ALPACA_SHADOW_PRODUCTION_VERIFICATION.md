# Alpaca-Shadow: Produktionsverifikation und Laufzeitgrenzen

Stand: 2026-08-14  
Scope: read-only Repository-Änderung; keine Render-, Supabase-, Stripe- oder Trading-Mutation.

## Ziel

Der Produktionsstart prüft Alpaca einmalig über den bestehenden read-only Endpoint
`GET /v2/stocks/{symbol}/trades/latest`. Das Ergebnis ist beobachtend und bleibt vollständig
vom kanonischen Preis- und Scoringpfad getrennt.

## Redigierte Startdiagnose

Erlaubte Felder:

- `configured`
- `authenticated`
- `state`
- `symbol`
- `feed`
- `retrievedAt`

Nicht protokolliert werden Key-ID, Secret, Preis, Response-Body, Fehlerdetail oder Header.
`READY`, `STALE` und `DEGRADED` belegen eine erfolgreiche Authentisierung; `UNAVAILABLE`
und `NOT_CONFIGURED` bleiben nicht-blockierende, sichtbare Shadow-Zustände. Der Smoke-Test
beeinflusst weder Server-Readiness noch Marktpreise oder Scores.

## Produktionsgrenze Document Hygiene

Die Produktionslaufzeit ist read-only:

- kein File-Watcher;
- kein Erzeugen von `uploads/document_hygiene.json`;
- kein ADR-Seeding;
- keine lokalen Document-Hygiene-Mutationen;
- schreibende Admin-Routen antworten fail-closed mit
  `503 / DOCUMENT_HYGIENE_READ_ONLY`.

Lokale Entwicklungs- und Testumgebungen behalten das bestehende schreibende Werkzeugverhalten.

## Verifikation nach Merge

1. Main-CI und Deployment-Identität müssen PASS sein.
2. Render-Boot-Logs müssen die read-only Meldung der Document Hygiene ohne
   `CAPITAL_AI_RUNTIME_ARTIFACT_READ_ONLY`-Write-Fehler zeigen.
3. Genau eine redigierte `Alpaca shadow startup smoke`-Diagnose prüfen.
4. Keine Credentials oder Provider-Response-Inhalte dürfen im Log stehen.
5. Kanonischen Quote-/Scorepfad auf unveränderten Provider und unveränderten Score prüfen.

## Rücksetzung

Ein human-autorisierter Revert-PR stellt den vorherigen Codezustand wieder her. Es gibt keine
Daten- oder Schemarücksetzung, weil dieser PR keine externe Mutation ausführt.

## Nachgelagerter, blockierter Schritt

Der produktive Outbox-Fehler wegen der fehlenden Supabase-RPC
`public.claim_outbox_job(p_lease_owner, p_lease_seconds)` ist nicht Teil dieses PRs.
Die Migration benötigt eine separate Owner-Autorisierung, Pre-Mutation-Baseline,
Rollback-Runbook und Post-Mutation-Verifikation. Bis dahin bleibt dieser Schritt blockiert.
