# M8 — Closure Evidence (COMPLETE / VERIFIED PASS)

Status: **COMPLETE / VERIFIED PASS**
Datum: 2026-08-16
Roadmap phase: M8 (Development Chain), Integrated Roadmap Phase I1 (ROADMAP-INTEGRATED-DC-SA-0001)
Authority: `docs/runbooks/M8_AGENT_CUTOVER.md` (`## Exit Gate`), ADR-0062, ESS-0019,
`docs/evidence/m8/M8_PROVIDER_SET_CORRECTION_2026-08-16.md` (PR #365, kanonisches Provider-Set)
Executor: Owner-instruierte Claude-Code-Sitzung, unmittelbar nach expliziter Owner-Entscheidung
("ACCEPT (empfohlen)", via `AskUserQuestion`) zu `docs/evidence/m8/M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md`

## 0. Zweck

Dieses Dokument schließt M8 formal ab, nachdem der Owner die in
`M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md` §3 vorgeschlagene Scope-Entscheidung für Exit-Gate-Punkt 2
explizit akzeptiert hat (§5 dort, Status `OWNER_ACCEPTED`). Es fasst alle 9 Exit-Gate-Kriterien mit
ihrer jeweiligen Evidence-Quelle zusammen — es erzeugt keine neue Evidence, sondern konsolidiert die
bereits über mehrere PRs (#308, #316, #328, #334, #339, #362, #365) erarbeitete.

**Nachtrag noch vor Erstveröffentlichung:** Zwischen der Owner-ACCEPT-Entscheidung und dem Schreiben
dieses Dokuments hat der Owner das kanonische Provider-Set korrigiert (PR #365,
`docs/evidence/m8/M8_PROVIDER_SET_CORRECTION_2026-08-16.md`): **Google AI Studio ist nicht Teil der
DEVELOPMENT/AI-Wertschöpfungskette.** Kanonisch sind **ChatGPT, Claude, Grok**
(`chatgpt-github-connector`, `claude-code-cli`, `grok-xai-connector`); `google-ai-studio`,
`notebooklm`, `gemini` sind `RETIRED_PROVIDER_ALIASES` (DENY im Control Plane,
`evaluateProviderCutoverReadiness()` → `RETIRED`). Dieses Dokument verwendet durchgehend bereits das
korrigierte Drei-Provider-Set — es wurde nie mit dem alten Vier-Provider-Stand veröffentlicht.

## 1. Vollständiger Exit-Gate-Status (9/9, `M8_AGENT_CUTOVER.md` `## Exit Gate`)

| # | Kriterium | Status | Evidence |
|---|---|---|---|
| 1 | M7 ist verifiziert | **PASS** | M7 `COMPLETE / VERIFIED PASS` (2026-08-14), `docs/evidence/m7/M7_PHASE0_AND_REPOSITORY_CONTROLS_EVIDENCE.md` |
| 2 | Privilegierte unterstützte Provider nutzen den provider-neutralen Control Plane als kanonischen Pfad | **PASS** (unter Owner-akzeptiertem Scope) | `docs/evidence/m8/M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md` (`OWNER_ACCEPTED`, 2026-08-16) + `docs/evidence/m8/M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md` (chatgpt-github-connector READY, alle 6 `ProviderCutoverEvidence`-Felder `true`) |
| 3 | Policy-Equivalence-Tests bestehen | **PASS** | `tests/unit/providerProfile.test.ts` (kanonisches Drei-Provider-Set + RETIRED-DENY-Fälle), `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` |
| 4 | Direkte provider-spezifische privilegierte Bypässe sind verweigert/deaktiviert | **PASS** | `docs/evidence/m8/M8_PROVIDER_BYPASS_ROUTE_AUDIT_EXIT_GATE_4_EVIDENCE.md`, `tests/unit/adminRouterBypassAudit.test.ts` (PR #328) |
| 5 | Research-Profile scheitern an Mutationstests | **PASS** | `tests/unit/providerProfile.test.ts` (research-plane constructor-enforced + Negative Tests) |
| 6 | Rollback-zu-read-only ist bewiesen | **PASS** | `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §7 — zwei unabhängige Hebel (IAM-Kill-Switch, Provider-Profil-Registry-Rollback), End-to-End durch die reale SA3B-Kette |
| 7 | Audit-Korrelation ist vollständig | **PASS** | `docs/evidence/m8/M8_AUDIT_CORRELATION_EXIT_GATE_7_EVIDENCE.md` (PR #308) |
| 8 | Evidence + Roadmap/Traceability sind synchronisiert | **PASS** (dieser PR) | Dieses Dokument + Roadmap-/Traceability-Updates im selben PR |
| 9 | Arbeitsbranches sind gelöscht | **PASS / N/A** | `git ls-remote --heads origin` zum Zeitpunkt dieses PRs: kein offener M8-spezifischer Arbeitsbranch |

**Ergebnis: 9 von 9 Punkten `PASS`. M8 ist `COMPLETE / VERIFIED PASS`.**

## 2. Cutover-Readiness-Matrix (kanonisches Drei-Provider-Set, Stand 2026-08-16)

| Provider | Mutierend | Readiness | Grund |
|---|---|---|---|
| `chatgpt-github-connector` | Ja | **READY** | Realer, code-adressierbarer Aufrufer (SA3B/SA4/Work-Package-GitHub-Actions-Host); alle 6 `ProviderCutoverEvidence`-Felder `true`, inkl. `externalHostConfigurationVerified` (`M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md`) |
| `claude-code-cli` | Ja | **BLOCKED** | Strukturell — die interaktive CCR-Sitzung wird nicht durch `agentIam.ts` vermittelt; kein code-adressierbarer Aufrufer (`docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md`) |
| `grok-xai-connector` | Ja | **BLOCKED** | Dieselbe strukturelle Lücke wie `claude-code-cli` — laut `providerProfile.ts`s eigener Beschreibung ist die Authentisierungsquelle "Grok GitHub Connector / SuperGrok session (xAI); repository grants are host-side, not model identity", d. h. eine interaktive, host-vermittelte Sitzung ohne code-adressierbaren, OIDC-gegateten Execution-Host analog SA3B. Diese Sitzung hat keinen neuen Aufrufer für Grok gebaut oder verifiziert — der Status folgt direkt aus der bereits für Claude Code etablierten Analyse, symmetrisch angewendet |

`google-ai-studio` / `notebooklm` / `gemini` sind nicht mehr Teil der Matrix — `RETIRED`
(`evaluateProviderCutoverReadiness()` liefert für diese Aliase jetzt `{ status: 'RETIRED' }`, kein
`BLOCKED`/`NOT_APPLICABLE` mehr).

**Exit-Gate-Punkt 2 unter dem Owner-akzeptierten Scope** ("privileged supported providers" =
mutierende Provider mit produktivem Execution-Host): weiterhin ausschließlich
`chatgpt-github-connector` erfüllt diesen Scope. Die Owner-Entscheidung selbst ändert sich durch die
Provider-Set-Korrektur nicht — sie skaliert unverändert auf drei statt vier Profile, mit demselben
Ergebnis (ein READY, alle übrigen mutierenden Profile BLOCKED).

## 3. Was `COMPLETE / VERIFIED PASS` hier konkret bedeutet — und was nicht

**Bedeutet:**
- Der provider-neutrale Control Plane (SA3 → SA2 → SA1 → M4 + M8 Provider-Profil-Gate) ist der
  einzige kanonische privilegierte Pfad im Repository für den einen real verdrahteten mutierenden
  Provider (`chatgpt-github-connector`).
- Kein provider-spezifischer Admin-Bypass existiert (Exit-Gate 4).
- Rollback-zu-read-only und Audit-Korrelation sind für diesen Pfad bewiesen (Exit-Gate 6, 7).
- Retired Provider-Aliase (`google-ai-studio`, `notebooklm`, `gemini`) sind fail-closed als `DENY`/
  `RETIRED` markiert — sie benötigen und erhalten keinen privilegierten Cutover.
- `claude-code-cli` **und** `grok-xai-connector` bleiben bewusst außerhalb des unterstützten
  privilegierten Produktionsumfangs — laut Owner-akzeptierter Scope-Entscheidung **kein** offener
  Restpunkt, sondern der korrekte, sicherheitsarchitektonisch begründete Zustand für beide
  interaktiven Connector-Sitzungen, bis ein separates ADR einen tragfähigen realen Aufrufer definiert.

**Bedeutet NICHT:**
- Keine Aktivierung, kein neuer Aufrufer, keine Mutation für Claude Code, Grok, Google AI Studio,
  NotebookLM oder Gemini.
- Keine automatische Freigabe von M9-Drills — Integrated Roadmap Phase I2 (M9 Assurance) ist ab
  jetzt **nicht mehr durch M8 blockiert**, aber jeder einzelne M9-Drill (Prompt/Tool-Injection,
  Authorization-Bypass, Replay, Exfiltration, Audit-Outage, Kill-Switch, Break-Glass, Rollback)
  bleibt eine eigene, separat vom Owner zu autorisierende Handlung
  (`docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` §11: "Nicht ausführbar ohne
  separate Owner-Freigabe").
- Keine Schwächung von IAM, REM, Kill-Switch, Human-only-`MERGE`, oder der Owner-Entscheidungspflicht
  für Produktions-/IAM-/Secret-/Deploy-Mutation.

## 4. Autorisierungskette (vollständig, nachvollziehbar)

1. Grok-Sitzung (Owner-Auftrag "Punkt a bis c abarbeiten"): Evidence + Scope-Proposal erstellt, PR
   #362, vom Owner selbst gemergt (`merged_by: SvenKulessa`).
2. Claude-Code-Sitzung: Owner-Frage explizit gestellt ("Wie entscheidest du?" mit ACCEPT/REJECT/DEFER
   als getrennte Optionen, via `AskUserQuestion`).
3. Owner-Antwort: **"ACCEPT (empfohlen)"** — explizite, unzweideutige Wahl einer von drei klar
   unterscheidbaren Optionen, keine generische "mach weiter"-Anweisung.
4. Vor Veröffentlichung dieses Dokuments: Owner korrigiert das kanonische Provider-Set (PR #365,
   Google AI Studio raus, Grok rein). Diese Sitzung prüfte main erneut, bevor sie pushte, fand den
   noch offenen PR #365 und wartete auf dessen Entscheidung, statt ein bereits veraltetes Closure-
   Dokument zu veröffentlichen.
5. Diese Sitzung: Status-Flip in `M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md` auf `OWNER_ACCEPTED`, dieses
   Closure-Dokument (bereits mit dem korrigierten Drei-Provider-Set), Roadmap-/Traceability-Sync —
   alles additiv, keine Selbstfreigabe.

## Verwandte Dokumente

- `docs/evidence/m8/M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md`
- `docs/evidence/m8/M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md`
- `docs/evidence/m8/M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md`
- `docs/evidence/m8/M8_PROVIDER_BYPASS_ROUTE_AUDIT_EXIT_GATE_4_EVIDENCE.md`
- `docs/evidence/m8/M8_AUDIT_CORRELATION_EXIT_GATE_7_EVIDENCE.md`
- `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md`
- `docs/evidence/m8/M8_PROVIDER_SET_CORRECTION_2026-08-16.md`
- `docs/architecture/M8_CLAUDE_CODE_REAL_CALLER_DESIGN.md`
- `docs/runbooks/M8_AGENT_CUTOVER.md`
- `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md`
