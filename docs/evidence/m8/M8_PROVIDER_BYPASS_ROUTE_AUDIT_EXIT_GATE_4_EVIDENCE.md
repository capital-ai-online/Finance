# M8 — Provider-spezifische Bypass-Route: Vollständiges Router-Audit (Exit-Gate-Punkt 4)

Status: **VERIFIED PASS** — kein deaktivierbarer, provider-spezifischer privilegierter
Bypass-Pfad im Repository gefunden, vollständiges Router-Mount-Audit durchgeführt
Datum: 2026-08-15
Roadmap phase: M8
Authority: `docs/runbooks/M8_AGENT_CUTOVER.md` Abschnitt „Cutover Sequence" Punkt 6
(„explicitly disable/deprecate provider-specific canonical admin routes") und „Exit Gate" Punkt 4
(„direct provider-specific privileged bypasses are denied/deactivated")
Executor: direkte Owner-instruierte Claude-Code-Sitzung (Owner-Anweisung „Direkte
Provider-Bypass-Routen deaktivieren", nach AskUserQuestion aus „fahre mit der Roadmap fort")

## 0. Ausgangslage

`docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` listete „externe Connector-Bypass-Deaktivierung"
bislang als offenen M8-Punkt, ohne dass zuvor ein systematisches, vollständiges Audit aller
HTTP-Routen im Repository dokumentiert war. `src/platform/Security/providerProfile.ts` definiert
bereits (aus paralleler Sitzungsarbeit, PR #316) `ProviderCutoverEvidence.providerSpecificBypassDenied:
boolean` als eines von sechs Evidence-Feldern für `evaluateProviderCutoverReadiness()` — diese
Funktion prüft nur, dass der Aufrufer dieses Feld als `true` liefert; sie verifiziert selbst
nichts. Diese Sitzung liefert die tatsächliche, verifizierte Grundlage für dieses Feld.

## 1. Methodik

Vollständige Inventur aller `express.Router()`-Instanzen im Repository und ihrer Mount-Punkte
(`server/routes/registerApplicationRoutes.ts`), für jede geprüft: (a) welcher Autorisierungspfad
greift, (b) ob dieser Pfad provider-spezifisch ist (an eine bestimmte KI-Provider-Identität
gebunden, unter Umgehung der geteilten Kette) oder provider-neutral. Zusätzlich Grep über
`server/` und `src/` nach provider-spezifischen Header-/Env-/Bypass-Mustern
(`x-chatgpt`, `x-claude`, `CHATGPT_*`, `CLAUDE_CODE_*`, `GOOGLE_AI_STUDIO_*`, `NOTEBOOKLM_*`,
hartkodierte API-Key-Vergleiche, `bypass`/`BYPASS`-Marker). Kernbefunde stichprobenartig selbst
gegengeprüft (Router-Mount-Liste und `checkAdminAccess`-Definition direkt gelesen), nicht nur aus
dem Recherche-Agenten übernommen.

## 2. Vollständige Router-Mount-Inventur

(`server/routes/registerApplicationRoutes.ts:61-85`, per direktem Read verifiziert)

| Mount | Router (Datei) | Autorisierung | Provider-spezifischer Bypass? |
|---|---|---|---|
| `/api/admin/hygiene` | `hygieneRouter` (`server/documentHygiene.ts`) | `checkAdminAccess` (geteilt) | Nein |
| `/api/admin` | `systemEventsRouter` (`server/systemEvents.ts`) | `checkAdminAccess` (geteilt) | Nein |
| `/api/admin` | `versionManagerRouter` (`src/platform/VersionManager/versionManager.ts`) | `checkAdminAccess` + `requireStepUp` (mutierender Bump) | Nein |
| `/api/admin/diagnostics` | `adminDiagnosticsRouter` (`server/adminDiagnostics.ts`) | `checkAdminAccess` (Lesen), zusätzlich `requireStepUp` + OWNER_ONLY_ROLES (Capability-Grant/-Revoke, Approvals), zusätzliche Capability-Prüfung in `AdminDiagnosticsAgent` | Nein |
| `/api/admin/supervisor` | `supervisorRouter` (`server/supervisorRouter.ts`) | `checkAdminAccess` (geteilt) | Nein |
| `/api/admin/agent-evaluation` | `createAgentEvaluationRouter` (`server/agentEvaluationRouter.ts`) | `checkAdminAccess` (geteilt) | Nein |
| `/api/scoring/explain` | `createScoreExplainabilityRouter` (`server/scoreExplainability.ts`) | `checkAdminAccess` (geteilt) | Nein |
| `/api/compliance` | `complianceRouter` (`src/platform/Compliance/router.ts`) | `checkAdminAccess` auf jeder Route | Nein |
| `/api/seo` | `seoEngineRouter` (`server/routes/seoEngineRoutes.ts`) | `checkAdminAccess` auf jeder Route | Nein |
| `/api/auth` | `stepUpRouter` (`server/stepUp.ts`) | `requireAuth` (Supabase-Identität) | Nein — Nutzer-Self-Service-TOTP, kein Admin-/Provider-Pfad |
| `/api/internal/systemadmin-execution` | `systemadminExecutionBrokerRouter` (`server/systemadmin/systemadminExecutionBrokerRouter.ts`) | Volle SA3/SA3B-Kette: `verifyGitHubActionsOidcToken` (echte JWKS-Signaturprüfung) → `authorizeSystemadminAuditedExecution` (komponiert SA2→SA1→M4 und seit demselben Tag zusätzlich den M8-Provider-Profil-Gate `checkProviderProfileScope`) | Nein — dies ist der einzige KI-Agent-erreichbare privilegierte Pfad, und er **ist** der provider-neutrale Broker selbst |

Alle übrigen `express.Router()`-Deklarationen in `server/` und `src/` gewähren keine
privilegierte/Admin-Capability (repository-weit enumeriert, jeweils Mount-Punkt und Guard
nachverfolgt).

`checkAdminAccess` ist einmalig definiert (`src/platform/Security/authMiddleware.ts:185`) und wird
konsistent von allen Admin-Routern importiert — kein Router implementiert eine eigene,
bespoke Zugriffsprüfung.

## 3. `src/agents/*.ts`-Erreichbarkeit

- `src/agents/adminDiagnosticsAgent.ts` — ausschließlich in `server/adminDiagnostics.ts`
  instanziiert (siehe Tabelle oben, korrekt gegated). Kein anderer Zugriffspfad.
- `classificationAgent.ts`, `cryptoClassificationAgent.ts`, `cryptoOnChainAgent.ts`,
  `cryptoRiskAgent.ts`, `cryptoSentimentAgent.ts`, `fundamentalsAgent.ts`, `riskAgent.ts`,
  `valuationAgent.ts` — ausschließlich referenziert von `server/agentEvaluation.ts` (hinter dem
  gegateten `/api/admin/agent-evaluation`) und `server/scoreExplainability.ts` (hinter dem
  gegateten `/api/scoring/explain`). Finanzanalyse-Inferenz-Agenten (LLM-Content-Generierung),
  keine privilegierten Ausführungs-/Admin-Agenten, kein eigenständiger HTTP-Einstiegspunkt.

## 4. Provider-spezifische Secrets/Bypass-Middleware

Kein Treffer, der auf eine lebende Bypass-Route hindeutet. `server/anthropicClient.ts` /
`server/openaiClient.ts` sind reine Inferenz-SDK-Wrapper (Auswahl, welches LLM eine
Finanzanalyse-Anfrage beantwortet), gegated nur über Env-Var-Präsenz — keine
Autorisierungsprimitive, keine Rechtevergabe.

## 5. Der eine bereits dokumentierte, nicht code-adressierbare Vorbehalt

`docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` Abschnitt 1.2 dokumentiert bereits,
dass eine laufende interaktive Sitzung (wie diese) MCP-Tool-Aufrufe direkt tätigt, ohne durch
`agentIam.ts` zu laufen. Das ist real, aber **keine Route und keine Datei in diesem Repository** —
es ist eine Eigenschaft der äußeren CCR-/Sitzungs-Laufzeitumgebung, außerhalb des
Repository-Codeumfangs. Es kann nicht als „Route deaktivieren" im Sinne von Cutover-Sequenz-Punkt
6 behandelt werden, da keine Route existiert; die Evidence-Doku grenzt das bereits korrekt ab und
markiert es stattdessen als offene Architekturfrage (siehe
`docs/architecture/GENERALIZED_SYSTEMADMIN_EXECUTION_HOST_DESIGN.md`, Modell-B-Diskussion).

## 6. Bewertung gegen Cutover-Sequenz Punkt 6 / Exit-Gate Punkt 4

Punkt 6 verlangt, dass eine provider-spezifische kanonische Admin-Route existiert, die deaktiviert
werden kann. Nach vollständigem Sweep aller Router-Mounts und ihrer Guards in `server/` und `src/`
**existiert keine solche Route** — jede Admin-nahe HTTP-Oberfläche nutzt `checkAdminAccess`
(menschliches IAM) und die einzige KI-Agent-erreichbare privilegierte Oberfläche (SA3B-Broker)
nutzt die volle OIDC- + SA3→SA2→SA1→M4(+M8-Provider-Profil)-Kette. **Es gibt nichts zu
deaktivieren.**

Das ist der berichtenswerte Befund für Punkt 6: er ist **vacuously erfüllt** — es gab von Anfang an
keine parallele/legacy provider-spezifische Admin-Route in dieser Codebasis. Dieser Befund stimmt
unabhängig mit der bereits am selben Tag von einer anderen Sitzung dokumentierten Schlussfolgerung
überein (`docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §1.1: „ChatGPT/Gemini/
Google-AI-Studio/NotebookLM-Referenzen sind fast ausschließlich Dokumentation/ADR, kein echter
Ausführungspfad existiert").

**Für `evaluateProviderCutoverReadiness()`** (`src/platform/Security/providerProfile.ts`)
bedeutet das: `ProviderCutoverEvidence.providerSpecificBypassDenied = true` ist für den aktuellen
Repository-Stand real, verifiziert begründbar — vorausgesetzt, die übrigen fünf Evidence-Felder
(realCallerVerified, canonicalControlPlanePathVerified, auditCorrelationVerified,
rollbackToReadOnlyVerified, externalHostConfigurationVerified) werden unabhängig davon jeweils
für den konkreten Provider verifiziert. Dieses Dokument liefert ausschließlich die Evidence für
das Bypass-Feld, nicht für die anderen fünf.

## 7. Nicht Bestandteil dieser Untersuchung

- Keine Code-Änderung — es gab nichts zu deaktivieren.
- Keine Bewertung der übrigen fünf `ProviderCutoverEvidence`-Felder.
- Keine Aussage zum M8-Exit-Gate als Ganzes — Punkt 2 (weitere Provider ohne echten Aufrufer) und
  Punkt 9 (Branch-Cleanup) bleiben unabhängig davon offen bzw. zu verifizieren.
- Keine Aktivierung von `evaluateProviderCutoverReadiness()` gegen einen echten Provider — das
  bleibt eine separate, vom Owner zu autorisierende Cutover-Entscheidung.

## 8. Audit-Erweiterung — Quality Center Operationalization (2026-08-21)

PR #464 ergänzt mit `/api/admin/quality-center` eine neue admin-nahe, ausschließlich lesende
Quality-Evidence-Oberfläche. Die bestehende M8-Regressionsprüfung hat diese neue Mount-Position
korrekt als auditpflichtig erkannt.

| Mount | Router (Datei) | Autorisierung | Provider-spezifischer Bypass? |
|---|---|---|---|
| `/api/admin/quality-center` | `qualityCenterRouter` (`server/qualityCenter.ts`) | `checkAdminAccess(req, 'quality-center:read', DIAGNOSTIC_ZONE_ROLES)`; ausschließlich `GET`; Snapshot muss zusätzlich an die bestehende Runtime-Release-Commit-Identität gebunden sein | Nein |

Die Route führt keinen provider-spezifischen Authentifizierungs- oder Autorisierungspfad ein,
exponiert keine Mutationsmethode und erzeugt keinen Live-Repository-Scan im HTTP-Requestpfad.
Damit bleibt der ursprüngliche M8-Befund unverändert: privilegierte Admin-nahe Routen verwenden
die bestehenden gemeinsamen Guard-/Broker-Grenzen statt einer provider-spezifischen Bypass-Route.

## Verwandte Dokumente

- `docs/runbooks/M8_AGENT_CUTOVER.md` — Cutover Sequence, Exit Gate
- `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` — Phase-0-Inventur, unabhängig
  übereinstimmender Befund
- `docs/evidence/m8/M8_PROVIDER_CUTOVER_READINESS_NO_GEMINI_EVIDENCE.md` — definiert den
  Readiness-Gate, den dieses Dokument mit Evidence für ein Feld versorgt
- `src/platform/Security/providerProfile.ts` — `ProviderCutoverEvidence`,
  `evaluateProviderCutoverReadiness()`
- `server/routes/registerApplicationRoutes.ts`, `src/platform/Security/authMiddleware.ts`
- `server/qualityCenter.ts` — read-only Quality-Center-Adminroute aus PR #464
