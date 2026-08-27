# Frontend-Orchestrator FO-05 — API Client & Polling Lifecycle

**Datum:** 2026-08-27  
**Arbeitsauftrag:** Chat-Priorität `FO-05 — Orchestrator API Client + Polling Lifecycle`  
**Branch-Basis bei Implementierungsstart:** `main@fe2d3193839132e5f3ce939be60c0d6232689768`  
**Finaler Main-Sync:** `main@72333ebbc72a805ce32265f5e2ca08ec9fe30c83`  
**Vorgänger:** FO-04 / PR #545; Security-Quick-Win F-01 aus PR #550 wird wiederverwendet.

## Ziel

Die administrative Request-Orchestrator-Telemetrie soll ohne blinde Hintergrundlast, Request-Überlappung oder veraltete Erfolgsdarstellung arbeiten. AuthN/AuthZ, Backend-Metriksemantik und FO-03-Konfigurationsgrenzen bleiben unverändert.

## Repository-Ist-Zustand vor FO-05

PR #550 hatte bereits den 401/403/429-Abbruch ergänzt. Offen blieben:

- `setInterval(..., 2000)` ohne Request-Abschluss als Taktgeber,
- kein `AbortController` für Stats-/Modell-Reads,
- keine Pause für verborgene Tabs,
- kein bounded Backoff bei transienten Fehlern,
- keine explizite `fresh/stale/paused/refused`-Darstellung,
- Orchestrator-API-Aufrufe und DTOs lagen weiterhin direkt in der Legacy-Komponente.

## Finaler Main-Sync / Korrelation

Während der ersten PR-Prüfung wurde PR #554 auf `main` gemergt. Der neue Main-Stand `72333ebbc72a805ce32265f5e2ca08ec9fe30c83` revertiert ausschließlich Commodity-P3B-Artefakte:

- `.ai/work-claims/COMMODITY-P3B-UNIVERSE-SLA-2026-08-26.json`,
- `docs/evidence/sc-md/SC_COMMODITY_P3B_UNIVERSE_SLA_2026-08-26.md`,
- `src/services/commodityUniverseSla.ts`,
- `tests/unit/commodityUniverseSla.test.ts`.

Es besteht kein Datei-, API-, Dependency-, IAM-, Security- oder Frontend-Architektur-Overlap mit FO-05. Der FO-05-Snapshot wurde deshalb vollständig auf dem neuen Main-Tree neu aufgebaut; die Commodity-Revert-Änderungen bleiben erhalten.

## Primärquellen / Best-Practice-Abgleich

- React `useEffect`: Setup und Cleanup sollen symmetrisch sein; Fetch-Effekte benötigen Cancel/Ignore gegen Race Conditions.  
  https://react.dev/reference/react/useEffect
- React Effects Guide: Fetch-Cleanup soll Requests abbrechen oder irrelevante Ergebnisse ignorieren.  
  https://react.dev/learn/synchronizing-with-effects
- MDN Page Visibility API: `visibilitychange` eignet sich, um unnötige Hintergrundarbeit bei verborgenem Dokument zu stoppen.  
  https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
- MDN AbortController: `abort()` bricht Fetch- und Response-Verarbeitung kontrolliert ab.  
  https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort
- TanStack Query Polling: unterstützt `refetchInterval` und standardmäßig pausiertes Background-Polling. Die Bibliothek wurde als Referenz geprüft, aber für einen einzelnen Admin-Consumer nicht eingeführt.  
  https://tanstack.com/query/latest/docs/framework/react/guides/polling

## Lösungsentscheidung

### Gewählt

Native React-/Browser-Lösung mit vorhandener Repository-Infrastruktur:

1. `src/features/governance/ui/orchestrator/orchestratorApi.ts`
   - typisierte DTOs,
   - ein zentraler `requestJson()`-Pfad,
   - alle vier Orchestrator-Endpunkte über vorhandenes `authFetch`,
   - `AbortSignal` für automatische Read-Requests.

2. `src/features/governance/ui/orchestrator/useOrchestratorTelemetry.ts`
   - neue produktive Polling-Authority im kanonischen Governance-Feature-Slice,
   - single-flight Stats-Read,
   - `setTimeout` erst nach Abschluss des vorherigen Reads,
   - Abort bei Unmount, Tab-Hide und ersetzendem manuellen Refresh,
   - Pause über `visibilitychange`, sofortige Aktualisierung bei Rückkehr,
   - bounded Backoff 2s → 4s → 8s → 16s → max. 30s,
   - 401/403/429 bleiben hard-stop/refused,
   - `lastUpdatedAt` und explizite Freshness-Zustände.

3. `src/lib/orchestratorPollPolicy.ts`
   - bestehende F-01-Policy wiederverwendet und um testbare Backoff-/Abort-Semantik ergänzt.

4. `src/components/OrchestratorPanel.tsx`
   - bleibt Legacy-Consumer,
   - keine neue Polling-Authority mehr,
   - zeigt Lifecycle-Status und letzten erfolgreichen Stand,
   - Config/Reset konsumieren denselben typisierten API-Adapter.

### Nicht gewählt: TanStack Query

Aktuell funktional geeignet und aktiv gepflegt, aber für diesen begrenzten Consumer wäre die Einführung eine neue App-weite Server-State-Dependency inklusive Provider-/Cache-/Policy-Entscheidungen. Der bestehende Scope benötigt weder Query-Cache noch Cross-View-Deduplizierung. Eine spätere app-weite Server-State-Standardisierung kann TanStack Query erneut bewerten.

## Invarianten

- `authFetch` bleibt einzige Frontend-Auth-Authority für die Orchestrator-API.
- 401/403/429 werden nicht automatisch wiederholt.
- Kein paralleler automatischer Stats-Poll.
- Verborgene Tabs erzeugen keinen Stats-Poll.
- Abort ist ein kontrollierter Lifecycle-Zustand und erhöht den Failure-Counter nicht.
- Transiente Fehler behalten den letzten erfolgreichen Snapshot sichtbar und markieren ihn als stale.
- Backend-API, Rate-Limit-/Queue-Semantik und Admin-Rollenvertrag werden nicht verändert.
- Keine Render-, Supabase-, Stripe-, Secret-, Schema- oder Deployment-Mutation.

## Tests / Regression

- `tests/unit/orchestratorPollPolicy.test.ts`
  - Refusal-Codes,
  - bounded Backoff,
  - Failure-Counter-Normalisierung,
  - Abort-Erkennung.
- `tests/unit/orchestratorPollingLifecycle.test.ts`
  - Feature-Slice-Authority,
  - kein `setInterval`,
  - Single-Flight/Abort,
  - Page Visibility,
  - Freshness/Last-Success/Retry-Anzeige,
  - Config/Reset über typed client.
- `tests/unit/orchestratorAdminReadBoundary.test.ts`
  - serverseitige Admin-Guards unverändert,
  - alle Frontend-Endpunkte weiter über `authFetch`, jetzt zentral im typed client,
  - Refusal-Stopp nach Hook-Extraktion erhalten.

## ADR / ESS

Kein neuer ADR/ESS erforderlich: FO-05 führt keine neue Trust Boundary, kein neues IAM-/API-Protokoll und keine neue Plattformabhängigkeit ein. Es implementiert die bereits priorisierte Frontend-Lifecycle-Härtung innerhalb der bestehenden Orchestrator-/Governance-Grenzen. Die Verhaltensänderung ist über dieses Evidence-Artefakt und ausführbare Regressionen traceable.

## Rollback

Repository-only. Rücksetzung über Human-reviewed `git revert` des späteren Merge-Commits. Keine externe Plattformmutation zurückzusetzen.
