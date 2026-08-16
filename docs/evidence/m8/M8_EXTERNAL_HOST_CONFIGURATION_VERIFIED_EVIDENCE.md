# M8 — externalHostConfigurationVerified (chatgpt-github-connector)

Status: **VERIFIED PASS** (read-only Host-Konfigurationsnachweis)
Datum: 2026-08-16
Roadmap phase: M8 / Integrated Roadmap I1
Authority: `docs/runbooks/M8_AGENT_CUTOVER.md`, `src/platform/Security/providerProfile.ts` (`ProviderCutoverEvidence.externalHostConfigurationVerified`), ADR-0062, ESS-0019
Executor: Owner-instruierte Grok-Sitzung (Punkt A–C)
Baseline: `main@fc03e327a01df458595b1210d74d109fd895b717`

## 0. Zweck und Abgrenzung

`docs/evidence/m8/M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md` §3.1 markierte
`externalHostConfigurationVerified` für `chatgpt-github-connector` als **false**, weil nur
Laufzeit-Erfolge (echte SA3B/SA4-Runs) belegt waren, nicht eine **separierte** Prüfung der
GitHub-seitigen OIDC-/Workflow-/Trust-Konfiguration.

Dieses Dokument schließt genau dieses Feld. Es:

- ändert **keinen** Code und **keine** Host-Konfiguration;
- aktiviert **keinen** Cutover;
- erklärt M8 **nicht** eigenständig für `COMPLETE / VERIFIED PASS` (siehe Scope-Entscheidung).

## 1. Was „externalHostConfigurationVerified“ bedeutet

Für den einzigen real verdrahteten mutierenden Provider (`chatgpt-github-connector` = SA3B/SA4/
Work-Package-Host-Principal) muss die **Host-Seite** (GitHub Actions) nachweisbar so konfiguriert
sein, dass:

1. OIDC-Token nur von freigegebenen Workflows aus `main` ausgestellt und akzeptiert werden;
2. Audience, Issuer, Actor, Repository und Workflow-Ref fail-closed geprüft werden;
3. Privilegien minimal und auf dokumentierte Capabilities begrenzt sind;
4. Ingress nur über Owner-gesteuerte Issue-Titel-Präfixe erfolgt;
5. Branch-Protection/`main`-Ruleset Agenten am direkten `main`-Schreiben hindert.

## 2. Geprüfte Konfigurationsartefakte (Repository-Stand)

### 2.1 OIDC-Verifikationsvertrag (Server)

Datei: `server/systemadmin/githubActionsOidc.ts`

| Konstante / Regel | Wert / Verhalten |
|---|---|
| Issuer | `https://token.actions.githubusercontent.com` |
| Audience | `capital-ai-systemadmin-execution` |
| Repository | `SvenKulessa/Finance` (ID `1284319285`) |
| Owner / Actor | `SvenKulessa` (ID `84307769`) |
| Erlaubte Workflow-Refs | nur `systemadmin-roadmap-executor.yml@refs/heads/main`, `systemadmin-sa4-pilot.yml@refs/heads/main`, `systemadmin-work-package-runner.yml@refs/heads/main` |
| Event | nur `issues` |
| Ref | nur `refs/heads/main` |
| Signatur | RS256 + GitHub JWKS, kid-gebunden |
| Uhrzeit | exp/iat/nbf mit 60s Clock-Skew |

Jeder abweichende Claim → `fail()` (fail-closed). Unbekannte Workflow-Refs werden explizit abgelehnt.

### 2.2 SA3B Execution Host Workflow

Datei: `.github/workflows/systemadmin-roadmap-executor.yml`

| Aspekt | Konfiguration |
|---|---|
| Trigger | `issues: [opened]` |
| Ingress-Gate | `github.event.issue.user.login == 'SvenKulessa'` **und** Titel beginnt mit `[SA3B-PROBE]` |
| Permissions | `contents: write`, `issues: write`, `id-token: write` |
| Checkout | `ref: main`, `persist-credentials: false` |
| OIDC-Anforderung | Audience `capital-ai-systemadmin-execution` über `ACTIONS_ID_TOKEN_REQUEST_*` |
| Broker | `https://capital-ai.online/api/internal/systemadmin-execution/authorize` mit Bearer-OIDC |
| Principal appId | `chatgpt-github-connector` |
| Side-Effect-Reihenfolge | durable Authorization Evidence **vor** Branch-Erzeugung; Outcome append-only; Rollback bei Outcome-Fehler |
| Mandat | nur `.ai/mandates/REM-SA3B-PROBE-001.json` mit `status: OWNER_APPROVED` |

### 2.3 SA4 Pilot Workflow

Datei: `.github/workflows/systemadmin-sa4-pilot.yml`

| Aspekt | Konfiguration |
|---|---|
| Trigger | `issues: [opened]` |
| Status | **deaktiviert** (`false &&` in `if:`) nach COMPLETE / VERIFIED PASS |
| Permissions | analog SA3B + `pull-requests: write` |
| OIDC | `id-token: write` |
| Self-blocking | Zielartefakt bereits auf `main` → Pilot-Skript blockiert Dauerbetrieb |

### 2.4 Work-Package Runner (ADR-0074)

Datei: `.github/workflows/systemadmin-work-package-runner.yml`

| Aspekt | Konfiguration |
|---|---|
| Trigger | Owner + Titelpräfix `[SYSTEMADMIN-WORK-PACKAGE]` |
| Permissions | `contents/pull-requests/issues/id-token: write` |
| Auswahl | Issue wählt nur **welches** bereits gemergte Katalog-Paket läuft; Inhalt kommt aus trusted `main`-Code |
| REM-Gate | Ausführung scheitert, solange gebundenes Mandat nicht `OWNER_APPROVED` ist |

### 2.5 Branch- / Main-Protection (Policy-Evidence)

Datei: `.github/policies/main-production-protection.expected.json`

| Regel | Wert |
|---|---|
| Target | `refs/heads/main` |
| Pull-Request required | true |
| Required status checks | `build-and-test`, `GitGuardian Security Checks` |
| Strict status checks | true |
| Non-fast-forward protection | true |
| CODEOWNER review | true |
| Bypass actors | `[]` |
| Agent direct main push | deny (`deny_direct_main_push_for_agents: true`) |
| Agent branch prefixes | `agent/`, `claude/`, `gemini/`, `copilot/`, `ai/` |

## 3. Laufzeit-Korrelation (bereits vorhandene Evidence, nicht ersetzt)

Die Host-Konfiguration ist **zusätzlich** durch reale Läufe belegt (nicht allein dokumentarisch):

- SA3B positive Probe: Issue #223, Run `31574111075` — OIDC → Broker ALLOW → BRANCH → Outcome SUCCESS (`docs/evidence/sa3b/SA3B_EXECUTION_HOST_BINDING_EVIDENCE.md`)
- SA3B stale-base negative: Issue #224, Run `31574221718` — DENY vor OIDC/Broker/Side-Effect
- Weitere erfolgreiche Host-Runs in M8-Evidence referenziert (u. a. 31891824130, 31893202838, 31893623159, 31894252190)

Dieses Dokument ergänzt die **Konfigurationssicht**; die Laufzeit-Evidence bleibt in den SA3B/M8-Dateien.

## 4. Bewertung gegen `ProviderCutoverEvidence`

Für `chatgpt-github-connector`:

| Feld | Wert nach diesem Dokument |
|---|---|
| `realCallerVerified` | `true` (unverändert, SA3B/SA4) |
| `canonicalControlPlanePathVerified` | `true` (unverändert) |
| `providerSpecificBypassDenied` | `true` (unverändert, Exit-Gate 4) |
| `auditCorrelationVerified` | `true` (unverändert, Exit-Gate 7) |
| `rollbackToReadOnlyVerified` | `true` (unverändert, Exit-Gate 6) |
| `externalHostConfigurationVerified` | **`true`** (dieses Dokument) |

Damit liefert `evaluateProviderCutoverReadiness('chatgpt-github-connector', completeEvidence)` rechnerisch **`READY`**, sofern alle sechs Booleans true übergeben werden.

## 5. Explizit nicht behauptet

- Keine Verifikation der GitHub-UI-Ruleset-Live-Ansicht jenseits der committed expected-policy und beobachteten Merge-Gates.
- Keine Behauptung, dass `claude-code-cli` einen Host hat.
- Keine Freigabe von M9.
- Keine Änderung an Secrets, Environments oder Rulesets in dieser Sitzung.

## Verwandte Dokumente

- `docs/evidence/m8/M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md`
- `docs/evidence/m8/M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md`
- `docs/evidence/sa3b/SA3B_EXECUTION_HOST_BINDING_EVIDENCE.md`
- `server/systemadmin/githubActionsOidc.ts`
- `.github/workflows/systemadmin-roadmap-executor.yml`
- `.github/policies/main-production-protection.expected.json`
