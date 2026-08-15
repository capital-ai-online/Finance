# M8 — Audit-Korrelation Exit-Gate-Punkt 7

Status: IMPLEMENTED / PR-CI PENDING  
Datum: 2026-08-15  
Baseline: `main@fafba177101ff0a19d71c6ddea3605df93d9036d`  
Authority: ADR-0059, ADR-0062, ESS-0019, `docs/runbooks/M8_AGENT_CUTOVER.md`

## Ziel

M8-Exit-Gate-Punkt 7 verlangt eine vollständige, manipulationsgeschützte Korrelation zwischen der Autorisierungsentscheidung und dem terminalen Ausführungsergebnis.

## Read-only Befund

Der produktive SA3B-Pfad schrieb bereits zwei append-only Ereignisse und verband das Outcome über `authorizationAuditReference`. Nicht vollständig technisch gebunden waren jedoch:

- die gemeinsame Identität aus Request-, Trace- und Session-ID;
- Provider-/Modellattribution im terminalen Outcome;
- Toolattribution im terminalen Outcome;
- ein expliziter Fail-closed-Test gegen manipulierte Korrelation.

Die regulären Produktclients `server/anthropicClient.ts`, `server/openaiClient.ts` und `src/services/agentModelRouting.ts` sind keine privilegierten Bypass-Pfade und wurden deshalb nicht gelöscht. Die interaktiven Connector-Berechtigungen liegen außerhalb des Repository-Codes.

## Umsetzung

`server/agentAudit/systemadminAuditedExecution.ts`:

1. erzeugt vor dem Autorisierungsinsert eine deterministische `auditCorrelationId` aus `requestId + traceId + sessionId`;
2. verweigert fehlende Korrelationsbestandteile vor jeder Evidence-Erzeugung;
3. bindet die Korrelations-ID an Autorisierung, Permit und Outcome;
4. prüft vor dem Outcome, dass Referenz und Korrelations-ID unverändert sind;
5. übernimmt Provider, Modell und Tool vom autorisierten Kontext in das Outcome;
6. schreibt Authorization-Referenz und vollständige Korrelationsattribute in das zweite append-only Ereignis.

## Negative Tests

`tests/unit/systemadminAuditedExecution.test.ts` beweist:

- manipulierte `auditCorrelationId` → DENY vor Outcome-Insert;
- fehlende Session-ID → fail closed vor Autorisierungsinsert;
- Authorization und Outcome besitzen dieselbe Korrelations-ID;
- Provider, Modell und Tool bleiben durch beide Ereignisse erhalten;
- sensible Prompt-/Response-Payloads bleiben weiterhin ausgelassen.

## Bypass-Bewertung

Es wurde kein löschbarer privilegierter In-Repo-Bypass nachgewiesen. Der einzige kanonische Repository-Mutationspfad bleibt SA3B/SA4 mit Provider-Profile-, REM-/IAM- und Audit-Gates. Externe interaktive Tool-Grants können nur auf Host-/Connector-Ebene deaktiviert werden und werden nicht durch das Löschen regulärer Finanzanalyseclients vorgetäuscht.

## Validierung

- TypeScript/Lint: PENDING PR-CI
- Unit Tests: PENDING PR-CI
- Production Build: PENDING PR-CI
- Governance/Security: PENDING PR-CI

M8-Punkt 7 darf erst nach erfolgreicher CI, Human Merge und Branch-Cleanup als `VERIFIED PASS` markiert werden.
