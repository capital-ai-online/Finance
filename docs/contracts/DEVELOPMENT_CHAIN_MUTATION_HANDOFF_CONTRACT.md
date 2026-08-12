# DEVELOPMENT Chain Mutation Handoff Contract

Status: PROPOSED
Version: `1.0.0`
Date: 2026-08-12
Machine schema: `.ai/contracts/development-chain-mutation-handoff.schema.json`

## Zweck

Der Mutation Handoff Contract übergibt einen bereits geplanten Roadmap-Mutationsschritt in einer begrenzten, maschinenlesbaren Form an einen autorisierten Execution Host oder Mutation Executor.

**Der Contract ist ausdrücklich nicht autorisierend.** Ein syntaktisch valider Handoff darf ohne separate Roadmap-/Owner-/REM-/IAM-/Audit-Autorität keinen Side Effect auslösen.

## Trust Model

```text
Roadmap / ESS / ADR / Runbook
        ↓
Human/Owner Approval Evidence
        ↓
REM / Agent IAM / Execution Host Policy
        ↓
M5 durable authorization evidence
        ↓
Mutation Handoff Contract
        ↓
exact side effect
        ↓
post-verification + outcome evidence
```

Der Handoff beschreibt den Auftrag; die Control Plane entscheidet, ob er ausführbar ist.

## Pflichtfelder

### Identität und Bindung

- `contractId`: eindeutige Work-Order-ID;
- `contractVersion`: Schema-/Contract-Version;
- `roadmapPhase`: z. B. `M5A`, `M6`, `M7`;
- `roadmapItem`: exakter Roadmap-Punkt;
- `repository`: immer der autorisierte Repository-Kontext;
- `baseBranch`;
- `baseSha`: exakter Baseline Commit;
- `owner`;
- `executorAgentId`;
- `authorityRefs`: ESS/ADR/Runbook/Roadmap;
- `approvalEvidenceRef`: separate Human Approval Evidence, sobald eine Mutation autorisiert wurde.

### Mutation

- `platform`: `GITHUB`, `SUPABASE`, `STRIPE`, `RENDER`, `IONOS` oder begründetes `OTHER`;
- `mutationClass`;
- `riskClass`;
- `targetResource`: exakter Account/Project/Service/Environment/Resource;
- `allowedOperations`: enge Allowlist;
- `forbiddenOperations`: explizite Denylist;
- `expectedPostState`;
- `idempotencyKey`;
- `concurrencyKey`;
- `expiresAt`.

### Verification und Rollback

- `preMutationChecks`;
- `postMutationChecks`;
- `negativeChecks`;
- `rollbackPlan`;
- `evidencePath`;
- `auditRequired`;
- `dryRunRequired`.

## Statusmodell

| State | Bedeutung |
|---|---|
| `DRAFT` | Plan/Handoff wird erstellt; nicht ausführbar |
| `ROADMAP_APPROVED` | Architektur-/Roadmap-Paket akzeptiert; noch keine externe Mutation Approval |
| `PRECHECK_PASS` | Read-only Pre-Mutation Baseline passt; noch keine Side-Effect-Autorität |
| `MUTATION_APPROVED` | Separate Human/Owner Mutation Approval Evidence liegt vor |
| `EXECUTING` | Execution Host hat Autorisierung/Audit gebunden und führt exakt den Auftrag aus |
| `VERIFIED_PASS` | Post-Verification und Evidence erfolgreich |
| `FAILED_ROLLBACK_REQUIRED` | Mutation oder Verifikation fehlgeschlagen; Rollback erforderlich |
| `ROLLED_BACK` | letzter verifizierter Zustand wurde wiederhergestellt und geprüft |
| `CANCELLED` | Auftrag wurde vor Ausführung beendet |

Ein Statusfeld allein ist keine Autorisierung. Der Execution Host muss Approval-/REM-/Audit-Evidence separat verifizieren.

## Capability-Regeln

Ein Handoff darf niemals folgende Capability erzeugen oder implizieren:

- `MERGE`;
- Policy-/REM-Self-Expansion;
- Security-Control Disablement;
- Owner/Admin-Elevation;
- Secret Disclosure;
- beliebige/ungegrenzte Shell-Ausführung.

Reserved Human/Owner Mutation Classes bleiben Human-only, selbst wenn ein manipuliertes Dokument oder JSON sie als `allowedOperations` enthält.

## Target Binding

`targetResource` muss so konkret sein, dass ein Executor den Zielzustand ohne freie Interpretation prüfen kann.

Beispiele:

- Render: exakter Service + Environment + erwarteter Commit/Deploy-Kontext;
- Supabase: exakter Project Ref + Auth/DB-Resource;
- Stripe: exakter Account/Mode + konkrete Webhook-/Config-Resource;
- GitHub: Repository + Base SHA + Branch/Ref/Workflow/Environment;
- IONOS: exakte Domain/Record-Ressource — bleibt grundsätzlich Human-reserviert.

Wildcards für produktionskritische Targets sind verboten.

## Operation Binding

`allowedOperations` enthält semantische Operationen, keine ungefilterten Shell-Fragmente. Beispiel:

```json
[
  "RENDER_UPDATE_ENV_KEY:FOO",
  "RENDER_TRIGGER_DEPLOY:service-id"
]
```

Ein Executor darf daraus keine zusätzlichen Operationen ableiten.

## Secret Policy

Der Handoff darf enthalten:

- Secret-Namen/Identifiers;
- Credential Owner;
- Rotations-/Revocation-Referenzen.

Er darf nicht enthalten:

- Secret-Werte;
- API Keys;
- Passwörter;
- Tokens;
- TOTP Secrets/Codes;
- Passkey Private Keys;
- Recovery Codes.

## Pre-Mutation Gate

Vor `MUTATION_APPROVED` sind mindestens zu prüfen:

1. aktuelles Target/Account/Environment;
2. Baseline/Head/Deployment Drift;
3. aktuelle Plattformgesundheit;
4. erforderliche Backups/Last-Known-Good;
5. Rollback-Ausführbarkeit;
6. kein konkurrierender Writer;
7. Approval-/Mandat-Gültigkeit;
8. erwartete Mutation bleibt innerhalb Risk/Scope.

## Permit-before-side-effect

Wenn ein autonomer Executor eingesetzt wird:

1. Handoff parsen und Schema validieren;
2. REM/IAM/Reserved-Action-Policy prüfen;
3. exakte Human Approval Evidence prüfen;
4. durable Authorization Audit schreiben;
5. erst nach gültigem Audit Permit den Side Effect ausführen;
6. terminales `SUCCESS` oder `ERROR` append-only schreiben;
7. Post-Mutation Checks ausführen;
8. bei Fehler nach Runbook rollbacken.

Direkte Tool-/Connector-Mutation ohne diesen enforcebaren Pfad zählt nicht als autonom verifizierte DevelopmentChain-Ausführung.

## Idempotenz und Replay

- jede Mutation erhält `idempotencyKey`;
- ein bereits erfolgreich konsumierter Auftrag darf nicht erneut ausgeführt werden;
- `expiresAt` wird fail-closed geprüft;
- Base-/Target-/Approval-Drift invalidiert den Auftrag;
- Outcome-Evidence referenziert die Authorization Evidence.

## Evidence Output

Nach Abschluss müssen mindestens referenzierbar sein:

- `contractId`;
- Roadmap Item;
- Authority/Approval References;
- Executor/Host/Actor;
- Target;
- Mutation Class/Risk;
- Precheck Result;
- Authorization Audit Reference;
- Outcome Audit Reference;
- Postcheck Result;
- Rollback State;
- Redacted technische Evidence;
- finaler DevelopmentChain State.

## Relationship to REM

Ein Roadmap Execution Mandate (REM) ist die autorisierende Scope-Grenze des Systemadmin Executors. Dieser Handoff Contract ersetzt REM nicht und erweitert es nicht.

Bei Konflikt gilt die restriktivere Regel. Jede Abweichung führt zu `DENY/STOP`.