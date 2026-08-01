# Supervisor

## Enterprise Component

Status: Implemented

Version: 1.1.0

Owner: CAPITAL-AI

---

## Purpose

ARCH-AUDIT-0002 (H4, Kapitel 4.4) stellte fest, dass dieses Verzeichnis in null
TypeScript-Dateien bestand und „Supervisor" lediglich der Name eines Frontend-Dashboards war,
ohne Steuerungslogik dahinter. `supervisor.ts` ist die reale Komponente, die diese Lücke
schließt.

Der Befund nannte sieben erwartete Fähigkeiten. Ehrliche Bestandsaufnahme statt
Vollständigkeitsbehauptung:

**Implementiert:**
- **Task Routing / Tool Selection** — `routeTask()` bildet jede Anlageklasse auf die
  zuständige Scoring-Engine ab (Crypto/DeFi/Meme → `crypto_orchestrator`, Rohstoffe →
  `rawmaterials_orchestrator`, Aktien/Forex → `traditional_asset_engine`, siehe H1).
- **Execution Control / Retry / Recovery / Self-Healing** — `executeSupervised()` führt eine
  übergebene asynchrone Aufgabe mit echtem Retry-mit-Backoff aus (Standard: 2 zusätzliche
  Versuche, Backoff verdoppelt sich je Versuch), statt beim ersten Fehlschlag aufzugeben.
  Jede Ausführung wird in einem Ringpuffer aufgezeichnet und über
  `GET /api/admin/supervisor/status` (server/supervisorRouter.ts) abrufbar.

**Nicht implementiert (mit Begründung):**
- **Conflict Resolution** — setzt mehrere konkurrierende Quellen für dieselbe Entscheidung
  voraus. Die aktuelle Architektur hat pro Anlageklasse genau eine autoritative Engine, es
  gibt aktuell keinen echten Konflikt aufzulösen.

---

## ESS Reference

ESS-0001

ESS-0001-CONTRACTS

---

## ADR References

ADR-0018 (Enterprise Event Mesh) — `executeSupervised()` veröffentlicht bei endgültig
fehlgeschlagenen Aufgaben ein `SupervisorAlertEvent` über die Event Mesh.

---

## Dependencies

EventMesh (`src/platform/EventMesh/Core/EventBus.ts`) für die Veröffentlichung von
`SupervisorAlertEvent`.

---

## Events

Siehe `manifest.json` — produziert `SupervisorAlertEvent` (real, bei endgültig
fehlgeschlagenen supervised Tasks) und `CriticalArchitectureViolationEvent` (deklariert,
noch kein Producer-Code); konsumiert `GovernanceViolationDetectedEvent` und
`EventRoutingFailedEvent` (deklariert, noch kein Consumer-Code).

---

## Notes

Aktuell an zwei realen Aufrufstellen in `server.ts` verankert: `recordDailySnapshots()` (N1)
und `evaluateAlerts()` (H2) - beide vorher "best-effort, bei erstem Fehlschlag aufgeben",
jetzt mit echtem Retry.
