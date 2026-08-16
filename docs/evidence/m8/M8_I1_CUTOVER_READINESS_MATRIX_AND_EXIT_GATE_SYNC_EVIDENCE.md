# M8 (Integrated Roadmap Phase I1) — Cutover-Readiness-Matrix und Exit-Gate-Sync

Status: **DOCUMENTATION / EVIDENCE SYNC — kein Code, keine Mutation, keine Cutover-Freigabe**
Datum: 2026-08-15 · **Nachtrag 2026-08-16**
Roadmap phase: I1 (`docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md`, ROADMAP-INTEGRATED-DC-SA-0001)
Authority: `docs/runbooks/M8_AGENT_CUTOVER.md` (`## Exit Gate`, `## Cutover Sequence`),
`src/platform/Security/providerProfile.ts` (`ProviderCutoverEvidence`, `evaluateProviderCutoverReadiness()`)
Executor: 2026-08-15 Claude-Code (Option A Sync); 2026-08-16 Grok (Punkte A–C)

## 0. Zweck und Abgrenzung

Dieses Dokument erfüllt Option A der I1-Fortsetzungsanweisung: Status-Sync von
`DEVELOPMENT_CHAIN_ROADMAP.md` und `M8_AGENT_CUTOVER.md`, eine formale Cutover-Readiness-Matrix für
alle vier Provider-Profile, Exit-Gate-Fortschritt und Traceability-Anpassung.

**Es enthält keine Code-Änderung, keine Mutation, keine Cutover-Aktivierung.** Gemäß Integrated
Roadmap Abschnitt 3: „Documentation readiness authorizes never blocked phase execution." Diese Datei
autorisiert nichts — sie dokumentiert nur den verifizierten Ist-Zustand.

## 1. Terminologie-Klarstellung: Exit Gate vs. Cutover Sequence

`docs/runbooks/M8_AGENT_CUTOVER.md` definiert zwei separate Listen, die in der Integrated Roadmap
(„Exit-Gate-Punkte 1–3, 5, 8–10") vermischt zitiert werden:

- **`## Exit Gate`** (9 Punkte): die Bedingungen, unter denen M8 als Ganzes `COMPLETE / VERIFIED PASS` gilt.
- **`## Cutover Sequence`** (10 Schritte): der Ablaufplan, wie ein Provider-Cutover durchzuführen ist.

Diese Datei verwendet ausschließlich die tatsächliche **9-Punkte-Exit-Gate-Liste** als Zählbasis.

## 2. Exit-Gate-Status (9 Punkte)

| # | Kriterium | Status | Evidence |
|---|---|---|---|
| 1 | M7 ist verifiziert | **PASS** | M7 `COMPLETE / VERIFIED PASS` |
| 2 | Privilegierte unterstützte Provider nutzen den provider-neutralen Control Plane als kanonischen Pfad | **PENDING OWNER SCOPE** | `chatgpt-github-connector` READY (alle 6 Felder); non-mutating NOT_APPLICABLE; `claude-code-cli` strukturell BLOCKED — siehe `M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md` |
| 3 | Policy-Equivalence-Tests bestehen | **PASS** | `tests/unit/providerProfile.test.ts`, Phase-0-Evidence |
| 4 | Direkte provider-spezifische privilegierte Bypässe sind verweigert/deaktiviert | **PASS** | Bypass-Route-Audit + `adminRouterBypassAudit.test.ts` |
| 5 | Research-Profile scheitern an Mutationstests | **PASS** | konstruktorseitig + Negative Tests |
| 6 | Rollback-zu-read-only ist bewiesen | **PASS** | Phase-0-Evidence §7 (SA3B-Pfad) |
| 7 | Audit-Korrelation ist vollständig | **PASS** | `M8_AUDIT_CORRELATION_EXIT_GATE_7_EVIDENCE.md` |
| 8 | Evidence + Roadmap/Traceability sind synchronisiert | **IN PROGRESS** | dieser PR (A–C) |
| 9 | Arbeitsbranches sind gelöscht | **N/A für M8-Scope** | kein offener M8-Cutover-Branch |

**Ergebnis vor Owner-Entscheidung:** 6 PASS, 1 PENDING OWNER SCOPE (Punkt 2), 1 IN PROGRESS (Punkt 8), 1 N/A. M8 Closure und M9 bleiben an ausdrückliche Owner-Akzeptanz von Punkt 2 gebunden.

## 3. Formale Cutover-Readiness-Matrix (4 Provider-Profile)

### 3.1 `chatgpt-github-connector` (mutierendes Profil)

Der reale Aufrufer ist der Systemadmin-GitHub-Actions-Host (SA3B/SA4/Work-Package-Runner) mit
appId-Literal `'chatgpt-github-connector'` — nicht eine interaktive ChatGPT-Sitzung.

| Evidence-Feld | Wert | Beleg |
|---|---|---|
| `realCallerVerified` | `true` | SA3B/SA4/Work-Package-Host, echte OIDC-JWKS-Läufe |
| `canonicalControlPlanePathVerified` | `true` | OIDC → SA3 → SA2 → SA1 → M4 (+ M8 Profile-Gate) |
| `providerSpecificBypassDenied` | `true` | `M8_PROVIDER_BYPASS_ROUTE_AUDIT_EXIT_GATE_4_EVIDENCE.md` |
| `auditCorrelationVerified` | `true` | `M8_AUDIT_CORRELATION_EXIT_GATE_7_EVIDENCE.md` |
| `rollbackToReadOnlyVerified` | `true` | `M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §7 |
| `externalHostConfigurationVerified` | **`true`** | **`M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md` (2026-08-16)** |

**Rechnerisches Ergebnis:** `evaluateProviderCutoverReadiness('chatgpt-github-connector', completeEvidence)` → **`READY`**.

### 3.2 `claude-code-cli` (mutierendes Profil)

| Evidence-Feld | Wert |
|---|---|
| `realCallerVerified` | `false` |
| `canonicalControlPlanePathVerified` | `false` |
| `providerSpecificBypassDenied` | `true` |
| `auditCorrelationVerified` | `false` |
| `rollbackToReadOnlyVerified` | `false` |
| `externalHostConfigurationVerified` | `false` |

**Ergebnis: `BLOCKED`.** Strukturell kein vertretbarer realer Aufrufer — siehe
`docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md`.

### 3.3 `google-ai-studio` / 3.4 `notebooklm`

Beide → **`NOT_APPLICABLE`** (keine mutierende Capability).

### 3.5 Zusammenfassung (Nachtrag 2026-08-16)

| Provider | Mutierend? | Readiness | Fehlende Bausteine |
|---|---|---|---|
| `chatgpt-github-connector` | Ja | **`READY`** | — |
| `claude-code-cli` | Ja | `BLOCKED` | 4 Felder; strukturell |
| `google-ai-studio` | Nein | `NOT_APPLICABLE` | — |
| `notebooklm` | Nein | `NOT_APPLICABLE` | — |

## 4. Branch-Hygiene (Exit-Gate-Punkt 9)

Unverändert: kein offener M8-Cutover-Arbeitsbranch. Punkt 9 = N/A für M8-Scope.

## 5. Roadmap/Traceability-Sync (Exit-Gate-Punkt 8)

2026-08-15 Sync (Runbook-Header, Roadmap-Crossref, Traceability) plus 2026-08-16:

- `M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md`
- `M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md`
- Runbook-Status-Header
- Roadmap / Traceability-Nachzüge in diesem PR

## 6. Was dieses Dokument NICHT tut

- Kein Aufrufer für Claude Code / Google AI Studio / NotebookLM.
- Kein Self-Closure von M8 ohne Owner-ACCEPT auf Scope-Entscheidung.
- Kein Start von M9.
- Keine Branch-Löschungen fremder Themen.

## 7. Nachtrag 2026-08-16 — Punkte A–C

| Punkt | Ergebnis |
|---|---|
| A | `externalHostConfigurationVerified` für `chatgpt-github-connector` → **PASS** |
| B | Scope-Entscheidung Exit-Gate-2 als **PROPOSED** dokumentiert (Owner ACCEPT/REJECT/DEFER) |
| C | Docs-PR inkl. Matrix/Runbook/Roadmap-Sync; Merge + Owner-Entscheidung bleiben Human |

## Verwandte Dokumente

- `docs/evidence/m8/M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md`
- `docs/evidence/m8/M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md`
- `docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md`
- `docs/runbooks/M8_AGENT_CUTOVER.md`
- `src/platform/Security/providerProfile.ts`
