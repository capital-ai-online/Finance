# ESS-0023 — Konsolidierter Systemadministrator-Prototyp- und Mutationsanfragevertrag

Status: ACTIVE — DOCUMENTATION CONTRACT  
Version: 1.1.0  
Datum: 2026-08-14  
Authority: ADR-0071  
Owner: SvenKulessa

## 1. Zweck

Dieser Vertrag steuert die Ableitung codebasierter Systemadministrator-Prototypen aus der konsolidierten CAPITAL-AI-Roadmap und erlaubt dem Agenten, notwendige Mutationen beim Owner anzufragen, ohne Selbstautorisierung zu erzeugen.

## 2. Rollen

- **Owner:** entscheidet, genehmigt oder lehnt Mutationen ab; führt Human Review und Merge aus.
- **Systemadministrator-Agent:** diagnostiziert, erstellt Optionen, Proposal, Prototyp, Tests und Evidence; darf nach Freigabe nur über einen autorisierten Execution Host handeln.
- **Execution Host:** erzwingt IAM/REM/Target/Approval/Precheck und audit-before-side-effect.
- **Reviewer/CI:** prüft Code, Contracts und negative Tests; erzeugt keine Owner-Authority.

## 3. Eingaben je Prototyp

Pflichtfelder:

- `prototypeId`;
- Roadmap-Item und Priorität;
- current-main SHA;
- Scope und erlaubte Pfade;
- verbotene Pfade/Operationen;
- Risiko- und Datenklasse;
- ADR-/ESS-/Runbook-Verweise;
- Tests;
- Evidence-Ziel;
- Rollback;
- Branch- und PR-Plan.

Fehlt ein Pflichtfeld, lautet die Entscheidung `DENY_INCOMPLETE_WORK_PACKAGE`.

## 4. Mutationsanfrage

Zulässige Initiatoren:

- `OWNER`;
- `SYSTEMADMIN_AGENT`.

Der Systemadministrator-Agent darf eine Anfrage stellen, wenn read-only Evidence zeigt, dass eine Mutation erforderlich oder sinnvoll sein könnte. Die Anfrage muss enthalten:

1. Ist-Zustand;
2. exaktes Ziel;
3. sichere Standardlösung;
4. Alternativen mit Trade-offs, wenn relevant;
5. Security-/Integritäts-/Verfügbarkeitsauswirkung;
6. Precheck;
7. atomare Operation;
8. Postcheck;
9. Rollback;
10. Evidence-Pfad;
11. Ablauf-/Invalidierungsbedingungen.

Die Anfrage darf keine Mutation auslösen.

## 5. Approval

Für externe Plattformen, Produktion, Supabase, Render, Stripe, IONOS, GitHub-Governance, Secrets, IAM, Billing, DDL/DML sowie HIGH/CRITICAL gilt:

- Approval nur durch Owner;
- exact target, operation, version/SHA und Zeitfenster;
- keine implizite Freigabe;
- keine Wiederverwendung nach Änderung;
- keine Agenten-, Provider- oder Modellselbstfreigabe;
- `OWNER_APPROVED` muss vor Side Effect persistent und referenzierbar sein.

### 5.1 Einmalige Abschnittsfreigabe für jeden Administrator

Diese Regeln gelten ausnahmslos für jeden menschlichen oder agentischen Administrator-Principal:

- genau ein benannter Roadmap-Abschnitt bzw. ein Work Package;
- genau ein Administrator-Principal;
- Bindung an `approvalId`, `main`-SHA, Branch, Ziel, Operations-Allowlist, Risikoklasse und Ablaufzeit;
- atomarer Single-Use-Verbrauch vor dem ersten Side Effect;
- nach Erfolg, Fehler, Abbruch oder Rollback keine Wiederverwendung;
- Replay oder paralleler Verbrauch → `DENY_APPROVAL_REPLAY`;
- Scope-/Principal-/SHA-/Target-/Operations-/Risiko-/Zeitfensterdrift → `DENY_SCOPE_DRIFT`;
- Precheck, Postcheck, Rollback, Kill-Switch und append-only Audit sind verpflichtend;
- Erweiterungen oder Folgemutationen benötigen eine neue Owner-Freigabe.

Eine Abschnittsfreigabe kann mehrere vorab vollständig enumerierte atomare Operationen enthalten. Sie ist verbraucht, sobald der Execution Host den Abschnitt zur Ausführung claimt. Sie darf niemals Merge, Owner-IAM/MFA, Secret-Offenlegung, Live-Billing/Entitlement, destructive production data, DNS/TLS, Security-Control-Abschaltung oder Selbst-Erweiterung delegieren.

## 6. Prototypmodi

| Modus | Erlaubt | Verboten |
|---|---|---|
| READ_ONLY | Inventar, Vergleich, Evidence-Plan | Writes |
| MOCK | Contract-/Unit-Tests | externe Calls mit Side Effects |
| SANDBOX | isolierte Testressourcen nach Authority | Produktion |
| REPOSITORY | scoped Code/Test/Docs in Branch | Merge, Secrets, Plattformmutation |
| MUTATION_HANDOFF | Proposal und maschinenlesbarer Auftrag | eigenständige Ausführung |
| AUTHORIZED_EXECUTION | exakte genehmigte Operation | Scope-Erweiterung |

Standard ist `READ_ONLY` oder `MOCK`.

## 7. Pflichtentscheidungen

- `ALLOW_PROTOTYPE`;
- `REVIEW_REQUIRED`;
- `DENY_INCOMPLETE_WORK_PACKAGE`;
- `DENY_SCOPE_DRIFT`;
- `DENY_MISSING_OWNER_APPROVAL`;
- `DENY_TARGET_MISMATCH`;
- `DENY_PRECHECK_FAILED`;
- `DENY_AUDIT_UNAVAILABLE`;
- `DENY_APPROVAL_REPLAY`;
- `STOP_AND_ROLLBACK`.

## 8. Native MFA

Owner-Attestation: native MFA aktiviert.

Der Agent darf:

- read-only AAL-/Faktorstatus prüfen, soweit sicher und autorisiert;
- redigierte Positive-/Negative-/Recovery-Evidence vorbereiten;
- fehlende Evidence oder notwendige Korrektur als Proposal anfragen.

Der Agent darf nicht:

- Faktoren enrollen, entfernen oder resetten;
- MFA-Policy verändern;
- Recovery oder Owner-Zugriff mutieren;
- Secrets oder TOTP-Seeds erfassen;
- Aktivierung als VERIFIED PASS behaupten, solange Exit-Evidence fehlt.

## 9. Tests

Mindestens:

- gültiges Owner-Proposal → bis Approval nur REVIEW_REQUIRED;
- Agent-Proposal ohne Approval → DENY;
- Ziel-/SHA-Änderung nach Approval → DENY;
- fehlender Auditstore → DENY;
- Precheck fail → zero side effect;
- Postcheck fail → STOP_AND_ROLLBACK;
- Scope drift → DENY;
- Secret im Output → Redaction/DENY;
- abgelaufene Approval → DENY;
- zweiter oder paralleler Verbrauch derselben Abschnittsfreigabe → DENY_APPROVAL_REPLAY;
- anderer Administrator-Principal mit derselben approvalId → DENY;
- Fehler/Abbruch/Rollback und anschließender Wiederholungsversuch ohne neue Freigabe → DENY;
- Branch nach Merge noch vorhanden → Arbeitspaket nicht geschlossen.

## 10. Evidence

Evidence ist redigiert, append-only und korreliert:

- request/proposal ID;
- requestor;
- Owner-Approval-Referenz und Single-Use-Verbrauchsstatus;
- target hash/version;
- Precheck;
- authorization event vor Side Effect;
- Operationsergebnis;
- Postcheck;
- Rollback, falls ausgelöst;
- PR/CI/Merge;
- Branch-Cleanup.

## 11. Branch Lifecycle

Jeder Repository-Prototyp:

```text
current main → fresh agent/<scope> → scoped diff → deutscher Draft-PR
→ Human Review → CI → Human Merge → Remote-Branch löschen
```

Kein Branch wird nach Merge wiederverwendet.

## 12. Stopbedingungen

Sofort stoppen bei:

- fehlender oder mehrdeutiger Authority;
- ungeklärtem Ziel/Tenant/Umgebung;
- fehlendem Rollback;
- fehlender Auditpersistenz;
- Scope Drift;
- Secret-/PII-Risiko;
- widersprüchlicher Evidence;
- Versuch der Selbstfreigabe;
- neuem HIGH/CRITICAL-Risiko ohne erneutes Owner Review.
