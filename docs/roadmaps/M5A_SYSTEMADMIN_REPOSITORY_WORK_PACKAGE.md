# M5A Systemadmin Repository Work Package

Status: CODE-SLICE-SPEZIFIKATION UMGESETZT — siehe `docs/evidence/m5a/M5A_REPOSITORY_IMPLEMENTATION_EVIDENCE.md`
Datum: 2026-08-14
Roadmap phase: M5A
Executor: direkte Owner-instruierte Claude-Code-Sitzung (nicht der SA4-Pfad — siehe Korrektur unten)
Mandate: `.ai/mandates/REM-M5A-REPOSITORY-001.json` (bleibt `DRAFT`; für diese Umsetzung nicht aktiviert)

## Korrektur 2026-08-14

Der ursprünglich vorgesehene Executor (`capital-ai-systemadmin-roadmap-executor` über den SA4-Pfad)
kann dieses Paket strukturell nicht ausführen (Audit-Befund P1-2, siehe
`docs/evidence/security/SECURITY_AUDIT_2026-08-14_ADR0069_DEVELOPMENT_CHAIN.md`). Der Owner hat
sich für direkte Implementierung im normalen Branch → PR → Human-Review → CI → Merge-Zyklus
entschieden. Die unten stehenden Code-Slices, Exit-Kriterien und Pflichtprüfungen blieben als
Spezifikation gültig und wurden vollständig umgesetzt; nur der Ausführungsweg hat sich geändert.

## Zweck

Dieses Paket übersetzt den nächsten ausführbaren DEVELOPMENT-CHAIN-Schritt in einen begrenzten, codebasierten Auftrag.

Es autorisiert durch seine Existenz keine Mutation. Aktivierung erfordert:

1. Merge dieses Governance-Pakets;
2. Human/Owner-Akzeptanz von ESS-0020 und ADR-0064;
3. exakte Aktualisierung des Mandats auf dann-current `main`;
4. Statuswechsel des Mandats von `DRAFT` zu `OWNER_APPROVED` mit Approval-Evidence;
5. SA1/SA2/SA3A/SA3B-Validierung und Permit-before-side-effect.

## Zulässiger Auftrag

Der Systemadministrator darf innerhalb des aktivierten REM:

- aktuellen MFA-/Step-up-Code analysieren;
- Native-MFA-Service für Supabase `enroll → challenge → verify` implementieren;
- zentrale serverseitige AAL2-Prüfung implementieren;
- Owner/Admin-AAL1-, stale- und Auth-Fehlerpfade fail-closed machen;
- bestehende purpose-bound Step-up-Tokens nur oberhalb AAL2 erhalten;
- positive und negative Tests ergänzen;
- redigierte M5A-Evidence erzeugen;
- frischen Branch, Commits und Draft-PR über den auditierten SA-Pfad erstellen;
- nach Human-/Owner-Gate genau einen finalen CI-Lauf anfordern.

## Verbotene Operationen

Der Systemadministrator darf in diesem Paket nicht:

- Supabase-Faktoren einschreiben, bestätigen, entfernen oder zurücksetzen;
- TOTP-Secrets, Codes, Factor-IDs, Recovery-Codes oder Tokens lesen/protokollieren;
- Supabase-Projekteinstellungen, Auth-Konfiguration oder Postgres-Schema verändern;
- Legacy-TOTP-/Recovery-Daten löschen;
- Render deployen oder Umgebungsvariablen verändern;
- Stripe, IONOS, Rulesets, Required Checks oder CODEOWNERS verändern;
- den eigenen REM erweitern;
- PRs approven oder mergen.

## Code-Slices

### Slice A — Authority und Service

- `src/platform/Security/nativeMfa.ts`
- `src/platform/Security/authMiddleware.ts`
- Tests: `tests/unit/nativeMfa.test.ts`, `tests/unit/authMiddlewareAal2.test.ts`

Exit:

- AAL1 für privilegierte Aktionen DENY;
- stale `aal2/aal1` DENY;
- Auth-/AAL-Fehler DENY;
- keine Clientmarker als Authority.

### Slice B — Enrollment/Login UI

- `src/components/TotpSettings.tsx`
- `src/components/LoginStepUpGate.tsx`
- Integrationstest: `tests/integration/nativeMfaAal2.test.ts`

Exit:

- supported Supabase native flow;
- unverified factor kein Erfolg;
- Session/AAL nach Verify neu bewertet;
- keine Secret-Ausgabe in Logs/Evidence.

### Slice C — Purpose-bound Step-up

- `server/stepUp.ts`
- bestehende `tests/unit/totp.test.ts` nur für Migration/Regression

Exit:

- Step-up ohne AAL2 DENY;
- wrong user/purpose/replay DENY;
- Legacy-TOTP kann keine privilegierte Autorität mehr allein erzeugen;
- Legacy-Recovery bleibt bis separatem Cutover erhalten.

## Pflichtprüfungen

Positive:

- native enroll/challenge/verify erreicht AAL2 in kontrolliertem Test;
- AAL2 + IAM-Rolle + erforderlicher Step-up erlaubt ausschließlich die Zielaktion.

Negative:

1. Owner/Admin AAL1;
2. enrolled/unverified factor;
3. falscher TOTP-Code;
4. ungültige/abgelaufene Challenge;
5. fehlender Faktor;
6. stale `aal2/aal1`;
7. Auth-/Netzwerkfehler;
8. Step-up ohne AAL2;
9. falscher User/Purpose;
10. Replay;
11. unauthorized factor reset;
12. unerlaubter Pfad oder REM-Scope-Erweiterung.

## Rollback

Repository-Rollback erfolgt durch Human-autorisierte Revert-PR. Legacy-Recovery und bestehende Faktorpfade werden bis zur späteren produktiven Verifikation nicht gelöscht. Ein fehlgeschlagener Code-Cutover darf keine automatische Faktorentfernung auslösen.

## Nachgelagerter Produktions-Handoff

Erst nach Repository-CI PASS wird ein separater nicht-autorisierender M5A-Supabase-Handoff vorbereitet. Native Owner-Faktor-Enrollments bleiben interaktive Human-/Owner-Aktionen. Autonome externe Mutation über SA5 bleibt bis M10 `VERIFIED PASS` blockiert.

## Definition of Done dieses Work Packages

- REM-Scope eingehalten;
- Code und Tests vollständig;
- alle Pflicht-Negativtests PASS;
- keine Secrets in Diff/Logs/Evidence;
- auditiertes BRANCH → COMMIT → PR;
- Human file review und aktuelle Head-Freigabe;
- CI PASS;
- Human merge;
- Remote-Branch gelöscht;
- M5A bleibt danach bis zur produktiven Owner-Faktor-Verifikation `IN PROGRESS`.
