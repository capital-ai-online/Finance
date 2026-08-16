# M9 — Rollback/Recovery Live-Drill Evidence (2026-08-16)

Status: DRILL COMPLETE — PASS (Assurance Domain 8, provider-profile-registry lever only; M9
overall remains NOT COMPLETE)
Authority: `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md` §„Assurance Domains" 8,
§„Evidence Schema"; Owner-Autorisierung: explizite Wahl „Rollback/Recovery-Drill (empfohlen)" via
`AskUserQuestion` in dieser Sitzung, 2026-08-16, im Anschluss an
`docs/evidence/m9/M9_KILL_SWITCH_LIVE_DRILL_2026-08-16.md`.

## 0. Zweck und Abgrenzung

Dieser Drill erfüllt einen Teil von **Assurance Domain 8 (Rollback / Recovery)** und trägt zu
**M9-Exit-Gate-Punkt 5** bei. Er ist **nicht** M9-Closure.

**Abgedeckter Rollback-Hebel:** der zweite, unabhängige, bereits in
`M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §7 dokumentierte Hebel „Provider-Profil deaktivieren/
verengen" (Registry-Snapshot-Override in `checkProviderProfileScope`/
`evaluateProviderScopedAuthorization`). Der erste Hebel (IAM-`killSwitchActive`) wurde bereits am
2026-08-16 in `M9_KILL_SWITCH_LIVE_DRILL_2026-08-16.md` als eigener M9-Drill abgedeckt.

**Bewusst nicht Teil dieses Drills** (siehe Runbook „Drill Safety": „Prefer non-production,
synthetic, reversible and non-destructive targets"):

- **„Repository revert through new branch/PR"** — wird hier nicht als separate, künstliche
  Testmutation ausgeführt. Der Mechanismus ist in diesem Repository bereits durch jede einzelne
  bisher gemergte PR dieser Sitzung (und aller anderen Agenten-Sitzungen) im Alltag real bewiesen:
  jede Änderung erfolgt über einen PR gegen `main`, jeder gemergte Merge-Commit ist per `git revert`
  rücksetzbar (siehe PR-Vorlage §11 „Rücksetzverfahren", von dieser Sitzung in jedem eigenen PR
  ausgefüllt). Eine eigens für diesen Drill erzeugte Test-PR-Revert-Aktion wäre eine unnötige, rein
  demonstrative Repository-Mutation ohne zusätzlichen Erkenntniswert und widerspräche der
  „non-destructive"-Präferenz des Runbooks.
- **„Immutable artifact deployment rollback"** — bereits eigenständig durch M7 abgedeckt (siehe
  `docs/runbooks/M7_DEPLOYMENT_IDENTITY_MUTATION.md` „Exit Gate Closure"); nicht Gegenstand dieses
  I2-Drills.
- **„Credential revocation/rotation"** — laut Runbook nur „where explicitly in scope"; für diesen
  Drill nicht in Scope (keine Owner-Freigabe für eine echte Credential-Rotation eingeholt).

## 1. Drill-ID und Metadaten (Runbook „Evidence Schema")

| Feld | Wert |
|---|---|
| Drill-ID | `M9-DRILL-ROLLBACK-RECOVERY-2026-08-16-01` |
| Datum/Zeit | 2026-08-16T02:29:48Z |
| Exakte Baseline | Commit `d9b7feecf2389efea54cd6b99f8addb0eb7d28d0` (main, nach Merge PR #378) |
| Actor/Human-Owner | SvenKulessa (explizite `AskUserQuestion`-Wahl, siehe §0) |
| Agent/App/Ausführungs-Host | Claude Code (`claude-code-cli`), Claude Sonnet 5, Claude Code Remote Session |
| Policy-/Contract-Versionen | ADR-0058 (Agent IAM), ADR-0062/M8 Provider Profile Contract, ADR-0063 (M9, `PROPOSED`) |
| Capability/Risiko/Ziel | `BRANCH` (MEDIUM) und `READ` (LOW), alle 3 kanonischen Provider (`chatgpt-github-connector`, `claude-code-cli`, `grok-xai-connector`), Ziel `repo:SvenKulessa/Finance` |

## 2. Angriffs-/Testaufbau

Erweitert `tests/unit/providerProfile.test.ts` um den Describe-Block „M9 Rollback/Recovery
Live-Drill (I2 Assurance, 2026-08-16)" gegen die reale, unveränderte
`evaluateProviderScopedAuthorization()`-Funktion (komponierte Provider-Profile- + Agent-IAM-Prüfung,
nicht nur die isolierte Scope-Prüfung wie in der bereits gemergten M8-Evidence):

Für **alle drei kanonischen Provider** (nicht nur `chatgpt-github-connector` wie in der
M8-Vorarbeit):

1. **Baseline:** reale, ungerollte Registry erlaubt die reale mutierende Capability (`BRANCH`,
   MEDIUM-Risiko, mit Audit-Korrelations-ID) → `ALLOW`.
2. **Rollback:** ein narrower Registry-Snapshot (Profil auf `READ`/`ANALYZE` verengt) verweigert
   `BRANCH`, erlaubt weiterhin `READ`.
3. **Recovery:** die unmittelbar nächste Anfrage gegen die reale, ungerollte Registry ist wieder
   `ALLOW` — beweist, dass der Rollback ein reversibler Snapshot-Austausch ist, kein einseitiger
   Ratchet oder eine persistierte Mutation. Das ist der Kern der M9-Runbook-Erwartung „last-known-
   good state is restored".
4. **Unveränderlichkeits-Snapshot:** ein `JSON.parse(JSON.stringify(...))`-Snapshot der realen
   exportierten `PROVIDER_PROFILES`-Registry wird vor der gesamten Drill-Sequenz gezogen und am
   Ende gegen den aktuellen Zustand verglichen — über alle drei Provider und alle drei Phasen
   (Baseline/Rollback/Recovery) hinweg beweist dies, dass zu keinem Zeitpunkt die reale Registry
   mutiert wurde, nicht nur für ein einzelnes Feld wie in der M8-Vorarbeit.

## 3. Erwartetes vs. tatsächliches Ergebnis

| Runbook-Erwartung (Domain 8) | Tatsächliches Ergebnis |
|---|---|
| Provider profile rollback to read-only | ✅ Für alle 3 kanonischen Provider: `BRANCH` verweigert, `READ` erhalten, nach Rollback-Snapshot |
| Last-known-good state is restored | ✅ Unmittelbar nächste Anfrage gegen die reale Registry ist wieder `ALLOW` — für alle 3 Provider |
| … und independently verified | ✅ Vollständiger Vorher/Nachher-Registry-Snapshot-Vergleich (nicht nur Einzelfeld) beweist Nichtmutation der realen Registry über die gesamte Sequenz |

**Testlauf:** `npx vitest run` — **1090 Tests, 189 Dateien, alle PASS** (davon neu: 4, in
`tests/unit/providerProfile.test.ts`: 3× parametrisiert über die kanonischen Provider + 1×
Registry-Snapshot-Vergleich). `npm run lint` (`tsc --noEmit`) PASS.

## 4. Seiteneffekt-/Rollback-Zustand

Kein Seiteneffekt: alle Registry-„Rollbacks" in diesem Drill sind lokale, pro-Aufruf übergebene
Objekt-Snapshots (`registry`-Parameter), niemals eine Mutation der realen, exportierten
`PROVIDER_PROFILES`-Konstante — durch §3 explizit nachgewiesen. Kein Rollback erforderlich, da
nichts Reales verändert wurde.

## 5. Residual Findings

Kein neuer ungeklärter CRITICAL-Fund. Zwei bereits bekannte, offene Punkte bleiben unverändert und
sind nicht Gegenstand dieses Drills (siehe §0 „Bewusst nicht Teil dieses Drills" und
`M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md` §2.7/§3): Break-Glass ist nicht
implementiert (ADR-0063 weiterhin `PROPOSED`); ein Repository-Revert-Drill als eigens erzeugte
Testmutation wurde bewusst nicht durchgeführt (siehe Begründung §0).

## 6. Bezug zum M9-Exit-Gate

- Punkt 5 „rollback/recovery drill PASS": **teilweise erfüllt** — der Provider-Profil-Rollback-Hebel
  ist jetzt für alle 3 kanonischen Provider real bewiesen und unabhängig verifiziert (Recovery +
  Unveränderlichkeits-Snapshot). Der IAM-Kill-Switch-Hebel ist bereits durch den vorherigen Drill
  abgedeckt. „Repository revert" und „Deployment rollback" bleiben aus den in §0 genannten Gründen
  außerhalb des synthetischen Testumfangs, sind aber durch bestehende operative Praxis (jeder PR
  dieser Sitzung) bzw. M7-Evidence bereits belegt.
- M9 bleibt insgesamt `PLANNED — EXECUTION BLOCKED BY M8` im Runbook-Kopf, bis auch die übrigen
  Exit-Gate-Punkte erfüllt sind; dieser Drill allein schließt M9 nicht ab.

## Related Documents

- `docs/runbooks/M9_ASSURANCE_INCIDENT_BREAK_GLASS.md`
- `docs/evidence/m9/M9_I2_ENTRY_INVENTORY_AND_GAP_ANALYSIS_2026-08-16.md`
- `docs/evidence/m9/M9_KILL_SWITCH_LIVE_DRILL_2026-08-16.md`
- `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §7
- `tests/unit/providerProfile.test.ts`
- `src/platform/Security/providerProfile.ts`
