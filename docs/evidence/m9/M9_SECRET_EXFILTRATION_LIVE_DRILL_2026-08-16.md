# M9 — Secret/Data-Exfiltration Live-Drill Evidence (2026-08-16)

Status: DRILL COMPLETE — PASS (Assurance Domain 4; M9 overall remains NOT COMPLETE)
Authority: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` §„Assurance Domains" 4,
§„Evidence Schema"; Owner-Autorisierung: explizite Wahl „Secret/Exfiltration-Drill (empfohlen)"
via `AskUserQuestion` in dieser Sitzung, 2026-08-16, im Anschluss an
`docs/evidence/m9/M9_AUTHORIZATION_BYPASS_LIVE_DRILL_2026-08-16.md`.

## 0. Zweck und Abgrenzung

Dieser Drill erfüllt **Assurance Domain 4 (Secret / Data Exfiltration)** und trägt zu
**M9-Exit-Gate-Punkt 2** bei. Er ist **nicht** M9-Closure.

**Ansatz:** Anders als eine isolierte Prüfung der Redaction-Funktion selbst (bereits vorhanden,
`tests/unit/telemetryContract.test.ts`), pflanzt dieser Drill jede vom Runbook benannte
Secret-/PII-Kategorie in `context.metadata` eines **echten**
`authorizeSystemadminAuditedExecution()`-Aufrufs und inspiziert den tatsächlich erfassten
Supabase-Insert-Payload — die reale Kette, nicht nur die Redaction-Funktion in Isolation.

## 1. Gefundene und geschlossene Lücken

Der Drill fand zwei reale, bisher unentdeckte Lücken in den bestehenden Redaction-Mechanismen und
schloss beide additiv, bevor die eigentlichen Drill-Tests geschrieben wurden:

### 1.1 Camelcase-Präfix-Lücke (PII_KEY_PATTERN, PROHIBITED_PAYLOAD_KEY)

Beide Schlüssel-Regex in `src/platform/Telemetry/redaction.ts` (`PII_KEY_PATTERN`) und
`server/agentAudit/agentAuditWriter.ts` (`PROHIBITED_PAYLOAD_KEY`) verankern auf `[_-]` oder
Zeichenketten-Grenze. Ein zusammengesetzter camelCase-Schlüssel wie `customerEmail`,
`creditCard` oder `fullRequestBody` — die im TypeScript-Code dieses Repositories die übliche
Namenskonvention sind — rutschte dadurch **unredigiert** durch, während das gleichwertige
`customer_email`/`credit_card`/`full_request_body` korrekt erkannt wurde:

```
PII_KEY_PATTERN.test('customerEmail')  // false  (Lücke)
PII_KEY_PATTERN.test('customer_email') // true
PII_KEY_PATTERN.test('creditCard')     // false  (Lücke)
```

**Schließung (additiv, beide Dateien identisch):** eine neue `normalizeKeyForMatching()`-Hilfsfunktion
fügt vor jedem Regex-Test an jedem lower→upper-camelCase-Übergang einen Unterstrich ein
(`customerEmail` → `customer_Email`), bevor die bestehenden Muster unverändert angewendet werden.
Snake_case- und einfache Kleinbuchstaben-Schlüssel sind durch die Transformation unverändert
(Idempotenz für bereits-passende Fälle) — die volle bestehende Testsuite (1110 Tests) bleibt grün,
was belegt, dass kein bestehendes Verhalten geschwächt wurde.

### 1.2 Fehlende TOTP-/Recovery-/Backup-Code-Abdeckung (SECRET_KEY_PATTERN)

`SECRET_KEY_PATTERN` deckte `secret`/`token`/`password`/`api-key`/`service-role`/`private-key`
etc. ab, aber keine explizite TOTP-Code- oder Recovery-/Backup-Code-Benennung (`totpCode`,
`recoveryCode`, `backupCode`) — obwohl das Runbook „TOTP secrets/codes" und „recovery codes" als
eigene, benannte Kategorien führt und dieses Repository aktive TOTP/AAL2-Infrastruktur besitzt
(`docs/runbooks/M5A_SUPABASE_TOTP_AAL2_HARDENING.md`). **Schließung:** `totp`, `recovery[_-]?code`,
`backup[_-]?code` als weitere Alternativen im bestehenden, bereits unverankerten
`SECRET_KEY_PATTERN` ergänzt (reine Erweiterung, kein bestehendes Alternativ-Muster geändert).

**Nicht Gegenstand dieser Schließung:** „Passkey private/biometric material" — WebAuthn-Passkeys
geben private Schlüssel/biometrische Daten laut Protokoll-Design serverseitig nie preis; es gibt
keinen Codepfad in diesem Repository, der solche Daten überhaupt server-seitig empfängt. Eine
Redaction-Regel dafür wäre rein defensiv ohne entsprechenden realen Angriffspfad — als
Beobachtungspunkt festgehalten, nicht als Lücke behandelt.

## 2. Drill-ID und Metadaten (Runbook „Evidence Schema")

| Feld | Wert |
|---|---|
| Drill-ID | `M9-DRILL-SECRET-EXFIL-2026-08-16-01` |
| Datum/Zeit | 2026-08-16T11:01:21Z |
| Exakte Baseline | Commit `56f2c031b51b3d68c20fc3433ac1ddb415e6080e` (main, nach Merge PR #389) |
| Actor/Human-Owner | SvenKulessa (explizite `AskUserQuestion`-Wahl, siehe §0) |
| Agent/App/Ausführungs-Host | Claude Code (`claude-code-cli`), Claude Sonnet 5, Claude Code Remote Session |
| Policy-/Contract-Versionen | ADR-0059 (Audit), Telemetry O1 Baseline, ADR-0063 (M9, `PROPOSED`) |
| Capability/Risiko/Ziel | `PR` (Default), Ziel `github:SvenKulessa/Finance`, Audit-Tabelle `agent_audit_events` |

## 3. Angriffs-/Testaufbau

Drei neue Tests in `tests/unit/systemadminAuditedExecution.test.ts`, Describe-Block „M9
Secret/Exfiltration Live-Drill (I2 Assurance, 2026-08-16)". Ein gemeinsames Set gepflanzter
Werte deckt jede Runbook-Kategorie ab:

| Runbook-Kategorie | Gepflanzter Schlüssel/Wert |
|---|---|
| API keys | `apiKey: 'sk_live_...'` |
| Bearer tokens | `authorizationHeader: 'Bearer abc.def.ghi'` |
| Service-role secrets | `serviceRoleKey: 'sb_service_role_...'` |
| Passwords | `password: 'CorrectHorseBatteryStaple123!'` |
| TOTP secrets/codes | `totpSecret: 'JBSWY3DPEHPK3PXP'` |
| Recovery codes | `recoveryCode: 'ABCD-1234-EFGH-5678'` |
| Private key material | `privateKey: '-----BEGIN PRIVATE KEY-----...'` |
| Customer PII | `customerEmail: 'jane.doe@example.com'`, `creditCard: '4242424242424242'` |
| Full sensitive request bodies | `fullRequestBody: '{"secret":"must not persist raw"}'` |

1. **Redaction/Omission je Kategorie:** alle zehn Werte werden im real erfassten
   Supabase-Insert-Payload (`mocks.insert`) auf `[REDACTED]` oder `[OMITTED]` geprüft — nie der
   Rohwert.
2. **Kein wiederverwendbares Secret persistiert:** der gesamte serialisierte Insert-Payload wird
   auf das Vorkommen jedes einzelnen Rohwerts geprüft (`JSON.stringify(...).not.toContain(...)`) —
   die stärkste, wörtlichste Form des Runbook-Kriteriums „no reusable secret persists".
3. **Nicht überbreit:** ein zusätzliches, offensichtlich unbedenkliches Feld (`purposeNote`) bleibt
   im selben Aufruf unverändert erhalten — beweist, dass Redaction präzise, nicht pauschal ist.

## 4. Erwartetes vs. tatsächliches Ergebnis

| Runbook-Erwartung (Domain 4) | Tatsächliches Ergebnis |
|---|---|
| API keys → redigiert | ✅ |
| Bearer tokens → redigiert | ✅ |
| Service-role secrets → redigiert | ✅ |
| Passwords → redigiert | ✅ |
| TOTP secrets/codes → redigiert | ✅ (Lücke geschlossen, §1.2) |
| Recovery codes → redigiert | ✅ (Lücke geschlossen, §1.2) |
| Passkey private/biometric material | N/A — kein Codepfad empfängt dies serverseitig (§1.2) |
| Full sensitive prompts/request bodies → omittiert | ✅ (Camelcase-Lücke geschlossen, §1.1) |
| Customer PII → redigiert | ✅ (Camelcase-Lücke geschlossen, §1.1) |
| Redaction/omission; no reusable secret persists | ✅ wörtlich bewiesen (Test 2 oben) |

**Testlauf:** `npx vitest run` — **1110 Tests, 189 Dateien, alle PASS** (davon neu: 3, in
`tests/unit/systemadminAuditedExecution.test.ts`). `npm run lint` (`tsc --noEmit`) PASS.

## 5. Seiteneffekt-/Rollback-Zustand

Produktionscode-Änderung (additiv, siehe §1) in `src/platform/Telemetry/redaction.ts` und
`server/agentAudit/agentAuditWriter.ts` — kein realer Seiteneffekt in diesem Drill selbst (gemockte
Audit-Senke wie bei allen SA3B-Tests). Rückgängig zu machen via `git revert`; die Fixes sind rein
additiv (breitere Redaction, kein bestehendes Muster geschwächt), belegt durch die unveränderte
grüne volle Testsuite vor und nach der Änderung.

## 6. Residual Findings

- **Passkey/biometrisches Material** (§1.2): bewusst nicht abgedeckt, da kein realer Codepfad dies
  serverseitig empfängt — als Beobachtungspunkt, kein Blocker.
- **Weitere camelCase-Präfixe:** die Schließung in §1.1 deckt lower→upper-Übergänge ab; ein
  Schlüssel, der ausschließlich in GROSSBUCHSTABEN geschrieben ist und ein PII-Wort ohne jede
  Groß-/Kleinschreibungs-Grenze enthält (z. B. `CUSTOMEREMAIL`), würde weiterhin nicht matchen —
  in diesem Repository kommt eine solche Schreibweise nicht vor (durchgängig camelCase/snake_case),
  daher kein praktischer Fund, aber als theoretischer Randfall dokumentiert.

## 7. Bezug zum M9-Exit-Gate

- Punkt 2 „all required authorization/injection/replay/exfiltration/audit drills PASS": trägt den
  Exfiltration-Anteil vollständig bei (alle anwendbaren Runbook-Kategorien belegt; Passkey/
  biometrisch als N/A begründet).
- M9 bleibt insgesamt `PLANNED — EXECUTION BLOCKED BY M8` im Runbook-Kopf, bis auch die übrigen
  Exit-Gate-Punkte erfüllt sind; dieser Drill allein schließt M9 nicht ab.

## Related Documents

- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/evidence/m9/M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md`
- `tests/unit/systemadminAuditedExecution.test.ts`
- `tests/unit/telemetryContract.test.ts`
- `src/platform/Telemetry/redaction.ts`
- `server/agentAudit/agentAuditWriter.ts`
