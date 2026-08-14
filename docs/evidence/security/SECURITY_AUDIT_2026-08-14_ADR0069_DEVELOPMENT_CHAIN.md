# Sicherheitsaudit 2026-08-14 — ADR-0069 Trust Root, DevelopmentChain und Systemadmin-Prototyp

Status: AUDIT-BEFUND / KEINE MUTATION DURCHGEFÜHRT
Datum: 2026-08-14
Repository: `SvenKulessa/Finance`
Auditierte Baseline: `main@5ba4ab12f7c6d98912b95bf000ceb352d9297fcd` (PR #252 Merge)
Primäre Authority: `docs/adr/ADR-0069-human-owner-comment-gate-and-dispatched-pr-ci.md`
Weitere Authority: ADR-0065, ADR-0067, ADR-0068, ADR-0070, ESS-0021, `.github/policies/main-production-protection.expected.json`

Dieses Dokument ist ein reiner Befundbericht. Es erzeugt keine Autorität, aktiviert kein Mandat
und autorisiert keine Mutation. Alle Korrekturvorschläge bleiben Human/Owner-Entscheidungen.

---

## 1. Umgebungsabgleich

Die Arbeitsumgebung wurde gegen das aktuelle Remote-Repository abgeglichen.

| Prüfung | Ergebnis |
|---|---|
| `git fetch origin main` | `main` = `5ba4ab1`, Arbeitsstand identisch (0 ahead / 0 behind) |
| `git fsck --strict --no-dangling` | sauber, keine Objektfehler, keine dangling Objects |
| Offene Pull Requests | keine |
| Branches auf dem Remote | nur `main` und der Audit-Branch |

ADR-0069 lag in der Fassung **ACCEPTED — RECOVERY REVISION 2026-08-13** vor und wurde vollständig
als Prüfmaßstab verwendet.

---

## 2. Verifizierte Positivbefunde

Die folgenden Kontrollen wurden real ausgeführt beziehungsweise im Code nachvollzogen und sind intakt.

### 2.1 Build-, Test- und Guard-Kette

| Prüfung | Ergebnis |
|---|---|
| `npm run lint` (`tsc --noEmit`) | Exit 0 |
| `npx vitest run` | **780 Tests passed**, 2 skipped, 140 Testdateien passed, 1 skipped |
| `node --test scripts/pr/*.test.mjs` | 16/16 passed |
| `npm audit --omit=dev --audit-level=high` | 0 Vulnerabilities |
| `npm audit` (inkl. dev) | 0 / 0 / 0 / 0 / 0 |
| `verifyGoogleMarketingInvariants.ts` | 34 Invarianten verifiziert |
| `verifyProductionConfigInvariants.ts` | 11 Invarianten verifiziert |
| `verifyDockerHardening.mjs` | PASS |

### 2.2 ADR-0069 verbotene Bootstrap-Muster — nicht vorhanden

| Verbotenes Muster (ADR-0069) | Befund |
|---|---|
| 1. `workflow_dispatch --ref main` als alleiniger Required-Check-Executor | nicht vorhanden |
| 2. synthetischer `build-and-test` als alleiniger Ruleset-Check | nicht vorhanden |
| 3. Ersetzen des funktionierenden PR-CI-Pfads in einem Bootstrap-Merge | nicht vorhanden; `ci.yml` unverändert aktiv |
| 4. Aktivierung neuer Required-Check-Identity vor Shadow-PASS | nicht erfolgt |
| 5. PR-Body-/Auto-Status-Automation als Human-Autorisierungsquelle | nicht vorhanden |

Ergänzend geprüft und sauber:

- kein `pull_request_target` in irgendeinem Workflow;
- kein `checks: write`, kein `statuses: write`, keine `/check-runs`- oder `/statuses/`-Aufrufe,
  also kein synthetischer Check-Reporter;
- **alle** `uses:`-Referenzen auf unveränderliche 40-stellige Commit-SHAs gepinnt;
- **alle** Checkouts mit `persist-credentials: false`;
- `document-hygiene-*` und `lockfile-remediation` sind korrekt stillgelegt (`contents: read`, `if: false`).

### 2.3 Systemadmin-Ausführungshost (SA3B / SA4)

Die Vertrauenskette des Prototyps ist konsistent implementiert:

- **OIDC-Verifikation** (`server/systemadmin/githubActionsOidc.ts`): Issuer, Audience, RS256-Signatur
  gegen JWKS, `exp`/`iat`/`nbf` mit 60 s Skew, `sub`-Repository-Bindung, `repository_id`,
  `repository_owner_id`, `actor`/`actor_id` gegen den kanonischen Owner, `event_name == issues`,
  `ref == refs/heads/main` und Allowlist der beiden `workflow_ref`-Werte. Fail-closed.
- **Permit-before-side-effect**: Branch, Commit und PR werden jeweils erst nach `ALLOW` plus
  gültiger `supabase:agent_audit_events:*`-Referenz ausgeführt; Head-, Branch-, Mandats- und
  `requestedPaths`-Bindung wird hostseitig gegengeprüft.
- **Deterministische Nutzlast**: Der SA4-Host erzeugt den Dateiinhalt selbst und verifiziert ihn nach
  dem Commit per SHA-256 gegen den erwarteten Payload. Der auslösende Issue-Body kann keinen
  Dateiinhalt liefern.
- **Rollback bei Evidence-Ausfall**: Schlägt die Outcome-Persistierung fehl, werden Branch und
  Draft-PR wieder entfernt.
- **Self-Authority-Deny** (`SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS`): mutierende Capabilities auf die
  eigene Control-Plane werden verweigert.
- **Untrusted-Input-Validierung**: `validateExecutionIssue.mjs` und `validateSa4PilotIssue.mjs`
  erzwingen striktes JSON, 8-KiB-Limit, Key-Allowlist, feste Mandats-/Modus-/Roadmap-Werte,
  Lowercase-SHA-40 und einen engen Branch-Namespace.
- **Mandatsprüfung** (`roadmapExecutionMandate.ts`): `status == OWNER_APPROVED`, aktiver Kill-Switch,
  `validFrom`/`expiresAt`-Fenster, Pfad-Allowlist, `maxOpenPullRequests`, Owner als alleinige
  `revocationAuthority`, `SELF_MANDATE_EXPANSION` als verbotene Mutationsklasse.

### 2.4 Secrets

- Keine Secret-Dateien im Tracked Tree; nur Beispiel-/Manifest-/Krypto-Module.
- Keine Treffer für Inline-Muster (`sk-*`, `ghp_*`, `AIza*`, PEM-Private-Keys, JWT-Literale).

---

## 3. Befunde

### P0-1 — `main` ist serverseitig ungeschützt, obwohl das Promotion-Gate erfüllt ist

**Nachweis.** Die GitHub-API meldet für `main`: `"protected": false`. Es existiert kein Ruleset.
`.github/policies/main-production-protection.expected.json` bestätigt das selbst mit
`"current_server_ruleset": "absent"` und `"state": "shadow_validation_required"`.

Das in `docs/evidence/ci/P0_MAIN_PROTECTION_RECOVERY_2026-08-14.md` definierte Promotion-Gate
verlangt mindestens einen realen Pull Request mit `capital-ai-ci` PASS auf dem aktuellen Head.
**Dieses Gate ist erfüllt** — `capital-ai-ci` lief erfolgreich auf fünf realen Pull Requests
(#248 `2ac1b00`, #249 `680c1d2`, #250 `7a6c72b`, #251 `b81ee47`, #252 `b985613`).

Die Ruleset-Aktivierung (Exit-Gate P0, Schritt 4) ist jedoch **nicht erfolgt**. Damit sind seit
dem Merge von PR #247 fünf Merges nach `main` ohne jede serverseitige Merge-Protection gelaufen:
kein Required Check, kein Pull-Request-Zwang, kein Deletion-/Non-Fast-Forward-Schutz.

**Bewertung.** ADR-0069 §1 setzt voraus, dass „der zuletzt verifizierte, funktionierende Required
Check aktiv bleibt". Aktuell ist überhaupt kein Required Check aktiv. Das Human/Owner-Gate in
`ci.yml` ist funktional, aber nicht erzwungen — es ist umgehbar, indem ein PR gar nicht erst
geöffnet oder der Check nicht abgewartet wird. Die gesamte Fail-closed-Prämisse der
DevelopmentChain hat derzeit keine serverseitige Durchsetzung.

**Empfehlung.** Ruleset `main-production-protection` gemäß der bereits committeten Expected-Policy
als separate Owner-Admin-Mutation aktivieren — aber erst nach Klärung von P1-1 (siehe unten).

---

### P0-2 — Produktionsdeployment hängt an ungeschütztem `main` ohne Environment-Schutz

**Nachweis.** `.github/workflows/ci.yml:239-262` (`deploy-production`) feuert bei `push` auf
`refs/heads/main` den Render-Deploy-Hook mit `secrets.RENDER_DEPLOY_HOOK_URL`. Der Job deklariert
**kein** `environment:`. Die Expected-Policy führt `production_environment.status` als
`"owner-admin-handoff-required"`, das heißt: es existiert keine GitHub-Environment-Protection
(keine Required Reviewers, keine Deployment-Branch-Regel auf Secret-Ebene).

**Bewertung.** In Kombination mit P0-1 ergibt sich eine durchgehende Kette:
Schreibzugriff auf `main` ⇒ Push ⇒ `build-and-test` ⇒ automatischer Produktionsdeploy —
vollständig ohne Owner-Gate, ohne Required Check und ohne Deployment-Freigabe. Das ist der
schwerwiegendste Einzelbefund dieses Audits, weil er die Repository-Governance mit der
Produktionsumgebung kurzschließt.

**Empfehlung.** `environment: production` am `deploy-production`-Job deklarieren und das
GitHub-Environment mit Required Reviewer (Owner) sowie Deployment-Branch-Beschränkung auf `main`
konfigurieren. Der Deploy-Hook gehört als Environment-Secret, nicht als Repository-Secret.

---

### P1-1 — Die geplante Ruleset-Promotion würde die Human/Owner-Head-Evidence aus dem Merge-Gate entfernen

**Nachweis.** Der `owner-gate`-Job — Prüfung der beiden Owner-Checkboxen aus dem Body-Snapshot des
`edited`-Events plus current-head-gebundener Owner-Review mit exakt `💪` oder `okay` — existiert
**ausschließlich** in `.github/workflows/ci.yml:22-120`.

`.github/workflows/capital-ai-ci-shadow.yml` besitzt keinen solchen Gate: der Workflow geht direkt
von `checkout` in Build/Test. Die Expected-Policy listet aber als `required_status_checks`
**nur** `["capital-ai-ci"]` und setzt `required_approving_review_count: 0`.

**Bewertung.** Würde das Ruleset genau so aktiviert, wäre der einzige erzwungene Check ein reiner
Build-Check ohne jede Human/Owner-Attestation. ADR-0069 §5 („Human-Evidence bleibt current-head
gebunden": vollständiger Files-changed-Review, alle Dateien Viewed, current-head-Review `💪`/`okay`,
Owner-Attestation, Invalidierung durch neuen Commit) verlöre damit seine technische Durchsetzung —
und zwar durch genau den Migrationsschritt, der die Protection wiederherstellen soll.

**Empfehlung.** Vor der Promotion eine der beiden Varianten als eigene Change-Klasse nach
ADR-0069 §4 entscheiden:
1. Das Ruleset verlangt **beide** Kontexte (`capital-ai-ci` **und** den Owner-gegateten
   `build-and-test`); oder
2. der Owner-Gate-Job wird als vorgeschalteter `needs`-Job in `capital-ai-ci-shadow.yml`
   übernommen und vorher erneut im Shadow bewiesen.

Variante 1 ist die konservativere, weil sie den bereits verifizierten Pfad unangetastet lässt.

---

### P1-2 — Für `REM-M5A-REPOSITORY-001` existiert kein Ausführungspfad

**Nachweis.** Eine repository-weite Suche nach `REM-M5A` findet die Kennung ausschließlich in
`.ai/mandates/REM-M5A-REPOSITORY-001.json` selbst. Es gibt keine Referenz in Workflows, Hosts,
Validatoren oder im Broker.

Konkret blockieren drei unabhängige Stellen jede M5A-Ausführung über den SA-Pfad:

| Stelle | Bindung |
|---|---|
| `server/systemadmin/githubActionsOidc.ts` | `workflow_ref`-Allowlist enthält nur `systemadmin-roadmap-executor.yml` und `systemadmin-sa4-pilot.yml` |
| `systemadminExecutionBrokerRouter.ts:50-58` | `expectedMandateForWorkflow()` mappt nur auf `REM-SA3B-PROBE-001` / `REM-SA4-PILOT-001`; alles andere ⇒ HTTP 403 `workflow-mandate-binding-mismatch` |
| `scripts/systemadmin/validateSa4PilotIssue.mjs:40` und `runSa4Pilot.mjs:265-274` | harte Gleichheitsprüfung auf `REM-SA4-PILOT-001`, Modus `BOUNDED_DOC_PR`, Ein-Pfad-Allowlist `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md` |

**Bewertung.** `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md:80` und
`docs/roadmaps/M5A_SYSTEMADMIN_REPOSITORY_WORK_PACKAGE.md:11` erklären als nächsten zulässigen
Auftrag, dass der Systemadministrator das M5A-Code-/Test-Paket „über den auditierten SA4-Pfad"
ausführt. Der SA4-Pfad kann das strukturell nicht: er ist ein Ein-Zweck-Ein-Pfad-Host für ein
Dokument. Die Aktivierung des Mandats auf `OWNER_APPROVED` allein bewirkt daher nichts —
der erste Broker-Aufruf endet in einem 403.

Verschärfend: Die dafür nötige Control-Plane-Erweiterung berührt Pfade aus
`SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS`, die der Agent korrekterweise selbst nicht mutieren darf.
Der Erweiterungsschritt ist damit zwingend ein Human-authored Change.

**Empfehlung.** Vor jeder M5A-Aktivierung einen eigenen, human-verfassten SA-Host für
Code-/Test-Mandate spezifizieren (ADR + ESS-0021-Fortschreibung), inklusive Erweiterung der
`workflow_ref`-Allowlist und des Mandats-Mappings. Alternativ die Roadmap-Aussage korrigieren und
M5A explizit als Human-/Agent-PR-Arbeit außerhalb des SA4-Hosts kennzeichnen.

---

### P1-3 — Abgeschlossene Prototyp-Workflows bleiben dauerhaft scharf

**Nachweis.** `systemadmin-roadmap-executor.yml` (SA3B) und `systemadmin-sa4-pilot.yml` (SA4)
triggern beide auf `issues: [opened]` mit `contents: write`, `issues: write`, `id-token: write`
beziehungsweise zusätzlich `pull-requests: write`. Beide Roadmap-Einträge stehen auf
**COMPLETE / VERIFIED PASS**. `docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md` liegt auf
`main`, wodurch der SA4-Host durch seinen eigenen Ein-Schuss-Check (`runSa4Pilot.mjs:284-285`)
inzwischen permanent selbst blockiert.

**Bewertung.** Zwei privilegierte, issue-getriggerte Hosts bleiben unbegrenzt aktiviert, obwohl
ihr Auftrag erledigt ist und einer davon funktional tot ist. Das entspricht sinngemäß dem
ADR-0069-Verbotsmuster 6 („dauerhaft aktive Bootstrap-Work-Claims nach Abschluss des zugehörigen
PRs"). Die Angriffsfläche bleibt schmal (Issue-Autor muss der Owner sein, Titelpräfix, OIDC,
Broker-Entscheid, Mandatsfenster) — aber sie ist unnötig.

**Empfehlung.** Beide Workflows nach dem Muster von `lockfile-remediation.yml` stilllegen
(`workflow_dispatch`-only, `contents: read`, `if: false`) und als auditierbaren Nachweis behalten.

---

### P1-4 — Mandatsfenster laufen vor dem Roadmap-Schritt ab

| Mandat | `validFrom` | `expiresAt` | Status |
|---|---|---|---|
| `REM-SA3B-PROBE-001` | 2026-08-12 | **2026-08-19** | OWNER_APPROVED |
| `REM-SA4-PILOT-001` | 2026-08-12 | **2026-08-19** | OWNER_APPROVED |
| `REM-M5A-REPOSITORY-001` | 2026-08-14 | 2026-08-21 | DRAFT |

Die Ablaufprüfung in `roadmapExecutionMandate.ts:487-488` ist korrekt fail-closed. Faktisch bleibt
für M5A jedoch ein Fenster von sieben Tagen, das erst nutzbar wird, wenn P1-2 gelöst ist — was
mindestens einen ADR, eine Host-Implementierung und einen Human-Merge erfordert. Das Fenster ist
realistisch zu knapp und wird still ablaufen.

**Empfehlung.** Mandatsfenster erst dann setzen beziehungsweise verlängern, wenn der zugehörige
Ausführungspfad existiert und der Owner die Aktivierung tatsächlich vornimmt.

---

### P2-1 — Self-Authority-Schutzliste ist unvollständig

`SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS` (`server/agentAudit/systemadminAuditedExecution.ts:25-43`)
schützt 18 Pfade, lässt aber unter anderem aus:

- `src/platform/Security/roadmapExecutionMandate.ts` — **der Mandats-Validator selbst**
  (Status-, Ablauf-, Pfad- und Kill-Switch-Prüfung);
- `.ai/mandates/REM-M5A-REPOSITORY-001.json`;
- `.github/workflows/ci.yml`, `.github/workflows/capital-ai-ci-shadow.yml`;
- `.github/policies/main-production-protection.expected.json`;
- `scripts/security/verifyChangedWorkflowSecurity.mjs`.

Aktuell nicht ausnutzbar, weil die aktiven Mandate extrem enge `allowedPaths` besitzen. Sobald
M5A-Pfade nach `src/platform/Security/**` geöffnet werden, entfällt diese zufällige Absicherung.
Der Schutz sollte nicht von der Enge des jeweils aktuellen Mandats abhängen.

---

### P2-2 — M5A-Integrationstests würden in CI niemals ausgeführt

`vite.config.ts:25` beschränkt vitest auf `tests/unit/**/*.test.ts` und `tests/server/**/*.test.ts`.
`REM-M5A-REPOSITORY-001.allowedPaths` enthält aber `tests/integration/nativeMfaAal2.test.ts`.

Ein dort abgelegter M5A-Negativtest liefe **nie**, während CI grün meldet. Die Verzeichnisse
`tests/{integration,security,contract,architecture,e2e,performance}` sind sämtlich leer —
reines Gerüst, trotz der Roadmap-Anforderung „positive + negative Tests" je Phase und der
M9-Assurance-Drills.

**Empfehlung.** Entweder die vitest-`include`-Liste um die real genutzten Verzeichnisse erweitern,
oder die M5A-Pfadliste auf `tests/unit/**` beziehungsweise `tests/server/**` korrigieren.
Zusätzlich empfehlenswert: ein Guard, der Testdateien außerhalb der `include`-Muster meldet.

---

### P2-3 — Workflow-Sicherheitsprüfung erkennt gelöschte Workflows nicht

`scripts/security/verifyChangedWorkflowSecurity.mjs:11` filtert die geänderten Workflow-Dateien mit
`fs.existsSync(name)`. Eine im PR **gelöschte** Workflow-Datei fällt damit aus der Prüfung heraus
und wird nicht als sicherheitsrelevante Änderung gemeldet. Bei fehlendem Ruleset (P0-1) existiert
derzeit auch keine kompensierende Required-Check-Erzwingung.

---

## 4. Datenintegrität

| # | Befund | Ort |
|---|---|---|
| D-1 | Fremdschrift-Fragment `בלבד` (hebräisch, „nur") mitten in einem deutschen Security-Evidence-Dokument: „`contents: read` בלבד". Bytes `D7 91 D7 9C D7 91 D7 93`, eingebracht mit Commit `2ac1b00`. Einziger Fremdschrift-Treffer im gesamten Repository. | `docs/evidence/ci/P0_MAIN_PROTECTION_RECOVERY_2026-08-14.md:22` |
| D-2 | Roadmap-Baseline veraltet: dokumentiert `main@6205868…` (PR #251), tatsächlich `main@5ba4ab1…` (PR #252). Relevant, weil die M5A-Aktivierung ausdrücklich eine „exakte current-main-Bindung" verlangt. | `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md:5` |
| D-3 | ADR-0070 bezeichnet `capital-ai-ci` als „den bestehenden Required Check". `capital-ai-ci` ist kein Required Check — es existiert kein Ruleset. | `docs/adr/ADR-0070-…:Sicherheitsinvarianten` |
| D-4 | Traceability-Plane veraltet: `coverage.json.generatedAt = 2026-08-02` (12 Tage alt), 5 ESS ohne `implementedBy`, `components.testRatio = 0.16` bei 25 Komponenten. | `.ai/knowledge/traceability/*` |
| D-5 | Alle 20 Work-Claims tragen `"status": "active"`, obwohl die zugehörigen PRs (u. a. #75, #104, ADR-0037/0040-Pakete, Daten 2026-08-03 bis 2026-08-10) längst gemergt sind. Mehrere beanspruchen breite Globs (`src/platform/Security/`, `server/runtime/**`, `.ai/work-claims/**`, `scripts/pr/lib.mjs`), darunter genau Pfade, die M5A benötigt. `PR-75-pr-governance.json` verweist auf die nicht mehr existierende `.github/workflows/agent-branch-preflight.yml`. **Kein harter Blocker** — `validateWorkClaim.mjs` vergleicht ausschließlich gegen offene PRs, nicht gegen die Claim-Dateien auf `main`. Der Zustand ist aber irreführend und entspricht sinngemäß ADR-0069-Verbotsmuster 6. | `.ai/work-claims/*.json` |
| D-6 | Mojibake: `// Do not modifyâfile watching …` (zerschossener Gedankenstrich). | `vite.config.ts:16` |

Gegenprobe: Ein repository-weiter Scan über Hebräisch, Kyrillisch, Arabisch, CJK und Griechisch
ergab außer D-1 nur legitime mathematische Symbole (`Σ`, `σ`, `μ`, `Δ`, `Ω`, `λ`) in Scoring- und
Visualisierungsmodulen. Es gibt keine Hinweise auf breitflächige Textmanipulation.

---

## 5. Priorisierte Empfehlung

Reihenfolge bewusst so gewählt, dass keine Maßnahme eine spätere blockiert:

1. **P0-2** — `environment: production` am Deploy-Job plus Environment-Protection. Wirkt sofort und
   unabhängig vom Ruleset.
2. **P1-1** — Entscheidung über die Required-Check-Identität als eigene Change-Klasse nach
   ADR-0069 §4 (Empfehlung: Ruleset verlangt `capital-ai-ci` **und** den Owner-gegateten
   `build-and-test`).
3. **P0-1** — Ruleset gemäß Expected-Policy aktivieren, danach Merge-Protection an einem Test-PR
   ohne Bypass beweisen und `P0_MAIN_PROTECTION_RECOVERY_2026-08-14.md` auf `VERIFIED PASS` heben.
4. **P1-3** — SA3B/SA4-Workflows stilllegen.
5. **P1-2 / P1-4** — M5A-Ausführungspfad klären, bevor `REM-M5A-REPOSITORY-001` auf
   `OWNER_APPROVED` gesetzt wird; Mandatsfenster erst dann setzen.
6. **P2-1 bis P2-3** — Defense-in-Depth-Lücken schließen.
7. **D-1 bis D-6** — Dokumenten- und Metadatenkorrekturen.

---

## 6. Abgrenzung

- Es wurde **keine** produktive Konfiguration verändert (Supabase, Render, Stripe, Google, IONOS,
  GitHub-Rulesets, Environments, Secrets).
- Es wurde **kein** Mandat aktiviert, erweitert oder in seinem Status geändert.
- Es wurde **kein** geschützter Google-Marketing-, Consent-, CSP- oder IAM-Invariant berührt.
- Die Ausführung von `npm ci`, `lint`, `vitest`, `npm audit` und den drei Guard-Skripten erfolgte
  ausschließlich lokal und lesend.
- Sämtliche Korrekturen aus Abschnitt 5 bleiben Human/Owner-Entscheidungen; dieses Dokument ersetzt
  weder eine Owner-Freigabe noch eine ADR.

---

## 7. Nachtrag — durchgeführte Korrekturen (2026-08-14, Folge-Commit)

Auf Grundlage dieses Audits wurden die folgenden risikoarmen, rein code-/dokumentbasierten
Korrekturen im normalen Branch→PR→Human-Merge-Fluss umgesetzt. Keine davon mutiert
Produktion, GitHub-Admin-Einstellungen oder ein `OWNER_APPROVED`-Mandat.

| Befund | Umsetzung |
|---|---|
| P0-2 | `deploy-production` in `ci.yml` läuft jetzt nur noch für den echten `push`-auf-`main`-Pfad (Job-`if` statt Step-`if`) und trägt `environment: production`. PR-Events überspringen den Job vollständig (zuvor nur eine Echo-Ausgabe) — kein Verhaltensunterschied für PR-CI. **Wirkt erst, wenn der Owner das GitHub-Environment `production` mit Required-Reviewer-Schutz konfiguriert** — das ist eine GitHub-Admin-Mutation außerhalb des Repository-Codes und wurde nicht vorgenommen. |
| P1-3 | SA3B (`systemadmin-roadmap-executor.yml`) und SA4 (`systemadmin-sa4-pilot.yml`) per `false &&`-Präfix vor der bestehenden Job-Bedingung stillgelegt. Trigger, Permissions und der komplette auditierte Host-Code bleiben byte-identisch erhalten, damit `tests/unit/systemadminExecutionHostWorkflow.test.ts` und `tests/unit/systemadminSa4Contracts.test.ts` den Sicherheitsvertrag unverändert weiter verifizieren. Reaktivierung erfordert nur das Entfernen von `false &&`. |
| P2-1 | `SYSTEMADMIN_SA3_SELF_AUTHORITY_PATHS` (`server/agentAudit/systemadminAuditedExecution.ts`) und der Parallelring `SYSTEMADMIN_SELF_AUTHORITY_PATHS` (`src/platform/Security/roadmapExecutionMandate.ts`) um `REM-M5A-REPOSITORY-001.json`, `ci.yml`, `capital-ai-ci-shadow.yml`, `main-production-protection.expected.json`, `roadmapExecutionMandate.ts` selbst und `verifyChangedWorkflowSecurity.mjs` erweitert. |
| P2-2 | `vite.config.ts` lädt jetzt zusätzlich `tests/integration/**/*.test.ts`, damit ein künftiger `tests/integration/nativeMfaAal2.test.ts` (von `REM-M5A-REPOSITORY-001.allowedPaths` referenziert) tatsächlich in CI ausgeführt wird. |
| P2-3 | `verifyChangedWorkflowSecurity.mjs` erkennt jetzt gelöschte Workflow-Dateien (`git diff --name-status` statt `--name-only`) und verlangt für Löschungen explizite Owner-Review statt sie stillschweigend zu ignorieren. |
| D-1 | Fremdschrift-Fragment `בלבד` in `docs/evidence/ci/P0_MAIN_PROTECTION_RECOVERY_2026-08-14.md:22` **nicht verändert** — betrifft ein bereits gemergtes, append-only-artiges Evidence-Dokument auf `main`; Korrektur dort ist eine eigene, kleine Owner-Entscheidung und wird hier nicht mitgezogen, um dieses Audit-/Fix-Paket nicht mit unabhängigen historischen Evidence-Dateien zu vermischen. |
| D-2 | `DEVELOPMENT_CHAIN_ROADMAP.md`-Baseline auf `main@5ba4ab1` (PR #252) aktualisiert; zusätzlich Korrektur der SA4→M5A-Ausführungsaussage (siehe P1-2-Nachtrag). |
| D-3 | ADR-0070 korrigiert: `capital-ai-ci` heißt nicht mehr fälschlich „bestehender Required Check", sondern verweist auf den tatsächlichen Promotion-Status. |
| D-5 | Alle 20 `.ai/work-claims/*.json` von `status: active` auf `status: superseded` mit `supersededReason` umgestellt (append-only, keine Löschung); Legacy-Datei `RENDER-CI-GATE-2026-08-09.json` ohne bisheriges `status`-Feld ebenso ergänzt. |
| D-6 | Doppelt-UTF-8-kodierter Gedankenstrich in `vite.config.ts:16` repariert. |

**P1-2 (Nachtrag):** `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` wurde um eine explizite Korrektur
ergänzt, dass der SA4-Pfad `REM-M5A-REPOSITORY-001` strukturell nicht ausführen kann (Workflow-Ref-
Allowlist, Broker-Mandats-Mapping und `runSa4Pilot.mjs` sind hart auf `REM-SA4-PILOT-001` gebunden).
Ein neuer M5A-Ausführungshost wurde **nicht** implementiert — das ist eine neue privilegierte
Automations-Capability und erfordert einen eigenen, human-verfassten ADR mit Owner-Review, nicht
einen stillschweigenden Workaround in diesem Fix-Paket.

### Neuer Befund während der Umsetzung: ADR-Registry-Lücken (nicht behoben)

`npm run traceability:build` wurde probeweise ausgeführt, um D-4 (veraltete Traceability-Daten) zu
beheben. Der Lauf endet mit Exit-Code 1 und vier harten Befunden, die **bereits vor diesem Audit**
im Repository bestanden und nichts mit den hier vorgenommenen Änderungen zu tun haben:

- **ADR-0046 ist doppelt vergeben**: `docs/adr/ADR-0046-modern-supabase-key-contracts-and-ai-admin-control-plane.md`
  und `docs/adr/ADR-0046-vocabulary-governance-authority-and-namespace.md` sind zwei inhaltlich
  unabhängige ADRs mit identischer Nummer;
- **ADR-0030 fehlt vollständig**: `src/platform/Release/manifest.json` referenziert `ADR-0030`, aber
  keine `docs/adr/ADR-0030-*.md`-Datei existiert;
- **ADR-0056 fehlt in `docs/adr/adr_history.json`**: die Datei existiert
  (`ADR-0056-observability-telemetry-baseline.md`), ist aber nicht in der Historie registriert.

Die generierten Traceability-Artefakte (`matrix.json`, `coverage.json`, `orphans.json`,
`COVERAGE_REPORT.md`, neun `manifest.json`-Dateien) wurden **testweise erzeugt und danach wieder
verworfen** (`git checkout --`), weil ihre Regenerierung untrennbar mit diesen drei ungelösten
Registry-Lücken verknüpft ist. Eine Umnummerierung eines bereits `ACCEPTED`-ADRs ist eine
Dokumentations-Governance-Entscheidung (vgl. ADR-0044, Documentation-Governance-Validator) und keine
mechanische Korrektur — sie gehört vor die nächste Traceability-Regenerierung, nicht in dieses
Fix-Paket. D-4 bleibt bis dahin offen.

### Nicht umgesetzt — erfordert Owner-Admin-Mutation oder neue Autorität

Vier Punkte aus Abschnitt 5 wurden bewusst **nicht** umgesetzt, weil sie außerhalb dessen liegen,
was ein Repository-Code-Commit leisten kann oder darf:

1. **P0-1** — Aktivierung des GitHub-Rulesets `main-production-protection` (echte Admin-API-Mutation
   auf GitHub, kein Repository-Code);
2. **Owner-Environment-Schutz zu P0-2** — Anlegen/Konfigurieren des GitHub-Environments `production`
   mit Required-Reviewer (Owner-only, außerhalb des Repository-Codes; der Workflow-Code-Teil ist
   umgesetzt, siehe Tabelle oben);
3. **P1-1** — Endgültige Required-Check-Zusammensetzung des neuen Rulesets (Empfehlung bleibt: sowohl
   `capital-ai-ci` als auch den Owner-gegateten `build-and-test` verlangen) — an P0-1 gebunden;
4. **P1-4** — Mandatsfenster von `REM-SA3B-PROBE-001`/`REM-SA4-PILOT-001` (`OWNER_APPROVED`) wurden
   nicht verändert; nur der Owner mit frischem TOTP-Step-up darf ein bereits genehmigtes Mandat
   ändern.

Alle vier Punkte sind reine Entscheidungen des Human/Owner und werden hier ausdrücklich nicht
vorweggenommen.
