# FO-03 — Request-Orchestrator Config Validation

**Datum:** 2026-08-26  
**Scope:** `POST /api/orchestrator/config`  
**Status:** Implementierungs-Evidence auf Branch `fix/frontend-orchestrator-config-validation-2026-08-26`; nicht merge-autorisierend.

## Ausgangslage

Der administrative Konfigurationspfad war bereits durch die kanonische IAM-Zone `orchestrator-config` geschützt. Die fachlichen Werte wurden jedoch nur mit `typeof value === 'number'` gefiltert und anschließend unmittelbar auf den Singleton angewandt. Dadurch waren unter anderem negative, nullnahe, gebrochene und unangemessen hohe Werte möglich. Gemischte Payloads besaßen keine explizite atomare Validierungsgrenze.

## Kanonische Policy

FO-03 führt eine einzelne serverseitige Policy in `src/lib/orchestratorConfigPolicy.ts` ein:

| Feld | Typ | Minimum | Maximum |
|---|---|---:|---:|
| `concurrencyLimit` | endliche Ganzzahl | 1 | 10 |
| `maxQueueSize` | endliche Ganzzahl | 2 | 30 |
| `maxRequestsPerWindow` | endliche Ganzzahl | 5 | 100 |

Die Grenzen entsprechen den bereits produktiv dargestellten Admin-Reglern, werden aber serverseitig autoritativ erzwungen. Der Browser bleibt untrusted und kann die Policy nicht umgehen.

## Fail-closed Verhalten

Die Route validiert den vollständigen Request-Body vor jeder Mutation.

Abgelehnt werden:

- Nicht-Objekt-Bodies und Arrays;
- leere Konfigurationsobjekte;
- unbekannte Felder;
- Strings/Booleans/null statt Zahlen;
- `NaN`/`Infinity` bei internen Aufrufern;
- gebrochene Zahlen;
- Werte außerhalb der fachlichen Min-/Max-Grenzen.

Fehlerantwort:

- HTTP `400`;
- `code = ORCHESTRATOR_CONFIG_INVALID`;
- strukturierte, wertfreie Issues mit Feld, Fehlerklasse und erwarteter Policy.

Es werden keine eingereichten Werte, Tokens oder Secrets in der Fehlerantwort protokolliert oder gespiegelt.

## Atomarität

`orchestrator.updateConfig(...)` wird erst aufgerufen, wenn **alle** gelieferten Felder gültig sind. Ein Payload mit einem gültigen und einem ungültigen Feld darf daher keinen Teilzustand erzeugen.

Expliziter Regressionstest:

```text
concurrencyLimit=5 (gültig)
maxQueueSize=1 (ungültig)
maxRequestsPerWindow=50 (gültig)
=> HTTP 400
=> concurrencyLimit/maxQueueSize/maxRequestsPerWindow bleiben vollständig unverändert
```

## Tests

- `tests/unit/orchestratorConfigPolicy.test.ts`
  - Min-/Max-Grenzen;
  - Partial Patch;
  - Nicht-Objekt-/Empty-Body;
  - Range-Fehler;
  - Fraction/NaN/Infinity/String;
  - unbekannte Felder.
- `tests/integration/orchestratorConfigValidation.test.ts`
  - echter Express-Router über `node:http`;
  - gültiger Partial Patch;
  - `400`-Semantik;
  - atomare Nicht-Mutation bei invalidem Misch-Payload;
  - Unknown-Field-/Empty-Payload-DENY.

Die vorhandene FO-01 HTTP-AuthZ-Evidence bleibt unverändert maßgeblich für Authentisierung/Autorisierung. FO-03 verändert weder Rollen noch IAM-Authority.

## Architektur / Governance

- **Roadmap/Arbeitspunkt:** FO-03 — Config Validation fail-closed.
- **ADR:** Keine neue ADR erforderlich; bestehende Sicherheits- und Autoritätsgrenzen werden gehärtet, nicht neu definiert.
- **ESS:** Kein neuer Contract außerhalb der vorhandenen Orchestrator-Konfiguration.
- **Externe Mutation:** Keine.
- **Dependencies:** Keine neue Dependency.
- **Threat Model:** Kein neues separates Threat Model erforderlich. Die bestehende Admin-Trust-Boundary wird nicht erweitert; untrusted Input wird innerhalb derselben Boundary enger validiert.

## Best-Practice-Abgleich

OWASP Input Validation empfiehlt frühe serverseitige syntaktische und semantische Validierung. OWASP REST Security fordert insbesondere Typ-, Range- und Formatprüfung sowie die Ablehnung unerwarteter/illegaler Inhalte. FO-03 setzt diese Regeln ohne zusätzliche Abhängigkeit um.

Primär-/maßgebliche Quellen:

- OWASP Cheat Sheet Series — Input Validation Cheat Sheet
- OWASP Cheat Sheet Series — REST Security Cheat Sheet
- OWASP Cheat Sheet Series — Business Logic Security Cheat Sheet

## Rest-Risiken / Folgeschritte

FO-03 ändert bewusst nicht:

- FO-04 Telemetry-Truth-/UI-Semantik;
- FO-05 Polling-/API-Client-Lifecycle;
- Multi-Instance-State/Distributed Rate Limiting;
- BB-2/BB-8 Frontend-Migration.

Diese Punkte bleiben getrennte Arbeitspakete, um Scope und Reviewbarkeit zu erhalten.
