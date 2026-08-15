# M8 (Integrated Roadmap Phase I1) — Cutover-Readiness-Matrix und Exit-Gate-Sync

Status: **DOCUMENTATION / EVIDENCE SYNC — kein Code, keine Mutation, keine Cutover-Freigabe**
Datum: 2026-08-15
Roadmap phase: I1 (`docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md`, ROADMAP-INTEGRATED-DC-SA-0001)
Authority: `docs/runbooks/M8_AGENT_CUTOVER.md` (`## Exit Gate`, `## Cutover Sequence`),
`src/platform/Security/providerProfile.ts` (`ProviderCutoverEvidence`, `evaluateProviderCutoverReadiness()`)
Executor: direkte Owner-instruierte Claude-Code-Sitzung, ausgeführt als Option A („Dokumentations- und
Evidence-Sync") aus der I1-Fortsetzungsanweisung des Owners

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

- **`## Exit Gate`** (9 Punkte, Zeilen 159–172): die Bedingungen, unter denen M8 als Ganzes
  `COMPLETE / VERIFIED PASS` gilt.
- **`## Cutover Sequence`** (10 Schritte, Zeilen 100–112): der Ablaufplan, wie ein Provider-Cutover
  durchzuführen ist.

Diese Datei verwendet ausschließlich die tatsächliche **9-Punkte-Exit-Gate-Liste** als Zählbasis
(siehe Abschnitt 2). Die „1–3, 5, 8–10"-Nummerierung aus der Integrated Roadmap referenziert
vermutlich eine Mischung aus beiden Listen; da die Integrated Roadmap selbst keine über
`M8_AGENT_CUTOVER.md` hinausgehende Authority beansprucht (Abschnitt 2 dort: „Es ersetzt keine
restriktivere ADR-, ESS-, IAM-, REM-, Runbook- oder Human/Owner-Authority"), bleibt die Runbook-Liste
maßgeblich. Dies ist keine inhaltliche Korrektur, nur eine Zählbasis-Klarstellung für nachfolgende
Sitzungen.

## 2. Exit-Gate-Status (9/9 Punkte, `M8_AGENT_CUTOVER.md` Zeilen 161–171)

| # | Kriterium | Status | Evidence |
|---|---|---|---|
| 1 | M7 ist verifiziert | **PASS** | `docs/evidence/m7/M7_PHASE0_AND_REPOSITORY_CONTROLS_EVIDENCE.md`; M7 `COMPLETE / VERIFIED PASS` |
| 2 | Privilegierte unterstützte Provider nutzen den provider-neutralen Control Plane als kanonischen Pfad | **PARTIAL** | Nur 1 von 4 Profilen (`chatgpt-github-connector`) hat einen realen Aufrufer (SA3B/SA4/Work-Package-Host); Claude Code, Google AI Studio, NotebookLM haben keinen |
| 3 | Policy-Equivalence-Tests bestehen | **PASS** (für implementierten Scope) | `tests/unit/providerProfile.test.ts` (23+ Tests), `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` |
| 4 | Direkte provider-spezifische privilegierte Bypässe sind verweigert/deaktiviert | **PASS** | `docs/evidence/m8/M8_PROVIDER_BYPASS_ROUTE_AUDIT_EXIT_GATE_4_EVIDENCE.md`, `tests/unit/adminRouterBypassAudit.test.ts` (PR #328, verifiziert) |
| 5 | Research-Profile scheitern an Mutationstests | **PASS** | `tests/unit/providerProfile.test.ts:54,160,221,346` — konstruktorseitig erzwungen + 3 unabhängige Negative Tests, inkl. NotebookLM |
| 6 | Rollback-zu-read-only ist bewiesen | **PASS** (für den einen verdrahteten Pfad) | `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §7 — zwei unabhängige Hebel (IAM-Kill-Switch, Provider-Profil-Registry-Rollback), End-to-End durch die reale SA3B-Kette bewiesen |
| 7 | Audit-Korrelation ist vollständig | **PASS** | `docs/evidence/m8/M8_AUDIT_CORRELATION_EXIT_GATE_7_EVIDENCE.md` (PR #308) |
| 8 | Evidence + Roadmap/Traceability sind synchronisiert | **IN PROGRESS** (dieses Dokument) | Dieser Sync-Pass; siehe Abschnitt 5 |
| 9 | Arbeitsbranches sind gelöscht | **N/A für M8-Scope** | Siehe Abschnitt 4 — kein offener M8-spezifischer Arbeitsbranch gefunden |

**Ergebnis: 6 von 9 Punkten `PASS`, 1 `PARTIAL`, 1 `IN PROGRESS` (durch dieses Dokument adressiert), 1
`N/A`.** M8 als Ganzes bleibt `COMPLETE / VERIFIED PASS` erst, wenn Punkt 2 für alle vier Profile
geschlossen ist — das ist der einzige materiell blockierende offene Punkt.

## 3. Formale Cutover-Readiness-Matrix (4 Provider-Profile)

Basierend auf `evaluateProviderCutoverReadiness()` (`src/platform/Security/providerProfile.ts:292`)
und dem aktuell tatsächlich existierenden Evidence-Korpus. Diese Funktion selbst hält keinen
Zustand — sie ist ein reines Gate, das vom Aufrufer gelieferte Evidence-Booleans prüft. Die
folgende Tabelle bewertet, welchen Wert jedes der sechs `ProviderCutoverEvidence`-Felder heute
*ehrlich* für jedes Profil hätte, basierend auf dem tatsächlichen Evidence-Stand — nicht auf einer
tatsächlichen Codeausführung des Gates gegen Live-Daten (dafür gibt es keinen Aufrufer, der es mit
produktionsrelevanten Daten füttert).

### 3.1 `chatgpt-github-connector` (mutierendes Profil)

Wichtige Präzisierung: Der bisher einzige real verdrahtete Aufrufer ist **nicht** eine interaktive
ChatGPT-Sitzung, sondern der Systemadmin-GitHub-Actions-Host (SA3B/SA4/Work-Package-Runner,
`scripts/systemadmin/runSa4Pilot.mjs:7`, `scripts/systemadmin/runWorkPackage.mjs:18`,
`.github/workflows/systemadmin-roadmap-executor.yml:117`), der den appId-Literal
`'chatgpt-github-connector'` verwendet, weil das Profil als „GitHub-Connector-förmiger Principal"
modelliert ist — nicht weil eine echte ChatGPT-Instanz je real aufgerufen hätte. Das ist keine neue
Erkenntnis, sondern eine explizite Klarstellung, um „real caller wired" nicht als „ChatGPT selbst
läuft produktiv" misszuverstehen.

| Evidence-Feld | Wert | Beleg |
|---|---|---|
| `realCallerVerified` | `true` | SA3B/SA4/Work-Package-Host, echte OIDC-JWKS-Signaturprüfung, mehrere reale Runs (z. B. Run-IDs 31891824130, 31893202838, 31893623159, 31894252190, alle `success`) |
| `canonicalControlPlanePathVerified` | `true` | Volle Kette OIDC → SA3 → SA2 → SA1 → M4 (+ M8-Provider-Profil-Gate) |
| `providerSpecificBypassDenied` | `true` | `docs/evidence/m8/M8_PROVIDER_BYPASS_ROUTE_AUDIT_EXIT_GATE_4_EVIDENCE.md` |
| `auditCorrelationVerified` | `true` | `docs/evidence/m8/M8_AUDIT_CORRELATION_EXIT_GATE_7_EVIDENCE.md` |
| `rollbackToReadOnlyVerified` | `true` | `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §7 |
| `externalHostConfigurationVerified` | **`false` / NICHT VERIFIZIERT** | Kein Dokument in `docs/evidence/m8/` bestätigt eine eigenständige Prüfung der GitHub-seitigen OIDC-Trust-/Environment-/Branch-Protection-Konfiguration als externes Host-Setup — nur das Laufzeitverhalten (erfolgreiche echte Runs) ist belegt, nicht eine separate Konfigurationsverifikation am Host selbst |

**Rechnerisches Ergebnis bei `evaluateProviderCutoverReadiness('chatgpt-github-connector', {...})`:**
mit den obigen Werten `BLOCKED`, `missingEvidence: ['externalHostConfigurationVerified']`. Dies ist
der einzige fehlende Baustein für dieses eine Profil — real, nicht synthetisch. Diese Sitzung
verifiziert diesen Punkt bewusst nicht selbst: eine GitHub-Host-Konfigurationsprüfung ist entweder
ein separates, klar scoped Evidence-Arbeitspaket oder direkte Owner-Verifikation, kein impliziter
Nebeneffekt eines Doku-Sync-Passes.

### 3.2 `claude-code-cli` (mutierendes Profil)

| Evidence-Feld | Wert | Beleg |
|---|---|---|
| `realCallerVerified` | **`false`** | Kein realer Aufrufer verdrahtet |
| `canonicalControlPlanePathVerified` | **`false`** | N/A ohne Aufrufer |
| `providerSpecificBypassDenied` | `true` | Gilt provider-unabhängig (Abschnitt 2, Punkt 4) — kein Bypass existiert für irgendeinen Provider |
| `auditCorrelationVerified` | **`false`** | N/A ohne Aufrufer |
| `rollbackToReadOnlyVerified` | **`false`** | N/A ohne Aufrufer |
| `externalHostConfigurationVerified` | **`false`** | N/A ohne Aufrufer |

**Ergebnis: `BLOCKED`, 4 von 6 Feldern fehlend.**

**Struktureller Sonderfall (bereits dokumentiert, hier nur referenziert):** Diese und jede
interaktive Claude-Code-Sitzung (inkl. dieser Sitzung selbst) läuft mit MCP-Tool-Zugriff, der von
der äußeren CCR-/Sitzungs-Laufzeitumgebung gewährt wird, **nicht** durch `agentIam.ts` oder
`providerProfile.ts` vermittelt. Das ist keine Lücke in diesem Repository-Code, sondern eine
Eigenschaft außerhalb des Repository-Kontrollradius — siehe
`docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §1.2 und
`docs/architecture/GENERALIZED_SYSTEMADMIN_EXECUTION_HOST_DESIGN.md` (Modell-B-Diskussion). Ein
„realer Aufrufer" für `claude-code-cli` im Sinne dieses Gates würde einen dedizierten,
code-adressierbaren Aufrufer erfordern (analog zum SA3B-GitHub-Actions-Host) — nicht die
interaktive Sitzung selbst, die strukturell nicht auf diese Weise gegated werden kann.

**Nachtrag 2026-08-15 (I1 Option B):** `docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md`
formalisiert diese Frage vollständig — zwei strukturell verschiedene Wege wurden bewertet: (1)
Claude als reiner Content-Generator ohne eigenen Tool-Zugriff innerhalb eines Model-A-Work-Package
(buildbar, bedient aber ein anderes, enger gefasstes Profil ohne mutierende Capability, nicht
`claude-code-cli` selbst), (2) ein echter agentischer Claude-Code-Host mit eigenem Tool-Zugriff
(bedient das Profil wörtlich, ist aber durch dieselbe ungelöste Tool-Call-Vermittlungslücke
blockiert, die Modell B bereits ausschließt). Ergebnis: kein sicherheitsarchitektonisch
vertretbarer Weg zu einem realen `claude-code-cli`-Aufrufer existiert heute — `BLOCKED` ist der
korrekte, nicht der unvollständige Zustand.

### 3.3 `google-ai-studio` (Development Plane, nicht-mutierend)

`evaluateProviderCutoverReadiness('google-ai-studio', ...)` → **`NOT_APPLICABLE`** — das Profil
besitzt keine mutierende Capability (`docs/evidence/m8/M8_PROVIDER_CUTOVER_READINESS_NO_GEMINI_EVIDENCE.md`).
Kein privilegierter Cutover erforderlich oder möglich. Keine Gemini-API-/Runtime-Integration
existiert oder ist geplant.

### 3.4 `notebooklm` (Research Plane, nicht-mutierend)

`evaluateProviderCutoverReadiness('notebooklm', ...)` → **`NOT_APPLICABLE`** — Research-only-Profil,
konstruktorseitig ohne mutierende Capability (`tests/unit/providerProfile.test.ts:346`). Kein
privilegierter Cutover erforderlich oder möglich.

### 3.5 Zusammenfassung

| Provider | Mutierend? | Readiness | Fehlende Bausteine |
|---|---|---|---|
| `chatgpt-github-connector` | Ja | `BLOCKED` | 1 Feld: `externalHostConfigurationVerified` |
| `claude-code-cli` | Ja | `BLOCKED` | 4 Felder — kein Aufrufer existiert; strukturell nicht code-adressierbar für die interaktive Sitzung |
| `google-ai-studio` | Nein | `NOT_APPLICABLE` | — |
| `notebooklm` | Nein | `NOT_APPLICABLE` | — |

Kein Provider ist heute `READY`. Exit-Gate-Punkt 2 („privilegierte Provider nutzen den kanonischen
Pfad") bleibt entsprechend `PARTIAL`.

## 4. Branch-Hygiene-Befund (Exit-Gate-Punkt 9)

Vollständige Auflistung aller Remote-Branches zum Zeitpunkt dieses Syncs:

| Branch | Herkunft | Bewertung |
|---|---|---|
| `main` | — | kanonisch |
| `agent/pr-template-contract-hardening-2026-08-15` | PR #331 (bereits gemergt, PR-Template-Governance, kein M8-Bezug) | Merge-Rest, sicher löschbar, aber **außerhalb des M8-Scopes** — gehört zu einem anderen Arbeitsthema |
| `claude/seo-engine-db-migration-bmgb7o` | vermutlich aktive parallele Sitzung (SEO-Engine-Migration) | **Nicht anfassen** — kein M8-Bezug, mutmaßlich aktive fremde Arbeit |
| `claude/security-audit-environment-update-i7lvfm` | diese Sitzung (durch feste Harness-Vorgabe an diesen Branch gebunden) | intentional langlebig; wird nach jedem Merge sofort wieder frisch gegen `main` synchronisiert |

**Bewertung für Exit-Gate-Punkt 9:** Kein offener Arbeitsbranch aus M8-Cutover-Arbeit selbst
existiert. Die beiden fremden Branches sind entweder bereits gemergter Rest eines anderen Themas
oder mutmaßlich aktive Arbeit einer anderen Sitzung — beides liegt außerhalb des Scopes dieses
Doku-Sync-Passes und wird hier bewusst **nicht** gelöscht (Option C aus der I1-Anweisung wäre der
korrekte, separat zu autorisierende nächste Schritt, falls gewünscht). Punkt 9 gilt für M8
spezifisch daher als `N/A` — nicht blockierend.

## 5. Roadmap/Traceability-Sync (Exit-Gate-Punkt 8)

Im selben Arbeitsschritt aktualisiert:
- `docs/runbooks/M8_AGENT_CUTOVER.md` — Status-Header aktualisiert (bisher „PLANNED — EXECUTION
  BLOCKED BY M7", Datum 2026-08-12 — veraltet, da M7 seit 2026-08-14 `VERIFIED PASS` ist). Exit Gate
  und Cutover Sequence selbst (normativer Inhalt) bleiben unverändert.
- `docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` — M8-Zeile um Cross-Reference zu diesem Dokument
  ergänzt.
- `docs/traceability/AI_AGENT_M0_M9_TRACEABILITY_MATRIX.md`,
  `docs/traceability/DEVELOPMENT_CHAIN_DOCUMENT_TRACEABILITY_MATRIX.md` — M8-Zeilen um
  Cross-Reference zu diesem Dokument ergänzt.

`docs/roadmaps/ROADMAP_CONSOLIDATION_MASTER_INDEX.md` und
`docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` selbst wurden bereits in PR #332
korrekt konsolidiert und benötigen für diesen Sync keine inhaltliche Änderung — beide referenzieren
den M8-Status bereits akkurat als „Phase 0 + Teil-Gates VERIFIED, Exit-Gate offen" / „IN PROGRESS".

## 6. Was dieses Dokument NICHT tut

- Es aktiviert, verdrahtet oder ändert keinen Aufrufer für Claude Code, Google AI Studio oder
  NotebookLM.
- Es verifiziert nicht die GitHub-host-seitige OIDC-/Environment-Konfiguration für
  `chatgpt-github-connector` — das bleibt offen (Abschnitt 3.1).
- Es löscht keine Branches (Abschnitt 4).
- Es erklärt M8 oder Exit-Gate-Punkt 2 nicht für erfüllt — beide bleiben `PARTIAL`/`BLOCKED`.
- Es autorisiert keine Fortsetzung zu I2 (M9) — I2 bleibt laut Integrated Roadmap `BLOCKED` bis I1
  `VERIFIED PASS` und Owner-Bestätigung vorliegen.

## Verwandte Dokumente

- `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` (ROADMAP-INTEGRATED-DC-SA-0001)
- `docs/runbooks/M8_AGENT_CUTOVER.md`
- `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md`
- `docs/evidence/m8/M8_AUDIT_CORRELATION_EXIT_GATE_7_EVIDENCE.md`
- `docs/evidence/m8/M8_PROVIDER_BYPASS_ROUTE_AUDIT_EXIT_GATE_4_EVIDENCE.md`
- `docs/evidence/m8/M8_PROVIDER_CUTOVER_READINESS_NO_GEMINI_EVIDENCE.md`
- `docs/evidence/m8/M8_SA_P05_CUTOVER_SIMULATOR_EVIDENCE.md`
- `docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md` (I1 Option B — Design-Klarstellung, warum `claude-code-cli` heute keinen vertretbaren realen Aufrufer haben kann)
- `src/platform/Security/providerProfile.ts`
