# WP-M0 — Owner-Review-Paket (Marketing Agent Governance)

Status: **ENTSCHIEDEN — OWNER-ACCEPT 2026-08-16**
Datum: 2026-08-16 (aktualisiert nach ADR-0085 und nach der Owner-Entscheidung)
Roadmap: SEO-GM-ROADMAP-0002 §5.3, WP-M0
Vorbereitet von: Claude Code (Implementierungs-Host, **keine** Autorisierungsinstanz)
Entscheidungsberechtigt: CAPITAL-AI OWNER (`SvenKulessa`)

## 1. Was dieses Dokument ist

WP-M0 hat als Definition of Done „Dokumente accepted; **keine** Runtime-Capability".
Die Annahme (`PROPOSED` → `ACCEPTED`) ist ein Owner-Akt. Sie kann weder durch einen
Agenten noch durch Repository-Schreibrechte, Modellidentität oder Review-Vorbereitung
ersetzt werden (CLAUDE.md „Authorized principals", ADR-0039, ESS-0019).

**Korrektur gegenüber einer früheren Fassung dieses Dokuments.** Hier stand zunächst,
die Annahme erfordere einen frischen TOTP-Step-up. Das gilt für **geschützte Rollbacks**
nach CLAUDE.md (Consent, CSP, IAM), nicht für eine Dokumentannahme der Checkklasse D.
Maßgeblich ist `HUMAN_OWNER_PR_APPROVAL_POLICY.md` in der am 2026-08-16 durch
Owner-Entscheidung vereinfachten Fassung: PR → Governance-Checks → CI → Owner-Entscheidung
→ Human Merge. Die starke Passkey/WebAuthn-Bindung greift erst ab **M10** und ist durch M9
blockiert.

Dieses Dokument bereitet die Entscheidung vor: Paketinventar, geprüfter Ist-Zustand,
blockierende Befunde, Entscheidungspunkte und die exakte Reichweite einer Annahme.
Es **erteilt keine Freigabe** und ändert keinen Status.

## 2. Paketinventar

WP-M0 verlangt: „Governance-Paket: ESS-0024, ADR-0080, Policy, Traceability,
inaktives Profil".

| # | Artefakt | Umfang | Status im Dokument | Befund |
|---|---|---:|---|---|
| 1 | `.ai/skills/ESS-0024-Marketing-Roadmap-Executor.md` | 235 Z. | `PROPOSED / NOT ENABLED` | inhaltlich vollständig; Nummernkollision **behoben (ADR-0085)** |
| 2 | `docs/adr/ADR-0080-...-content-automation-boundary.md` | 160 Z. | `PROPOSED` | auf Repository-Standard ausgearbeitet (B3 behoben) |
| 3 | `docs/governance/MARKETING_AGENT_ROADMAP_EXECUTION_POLICY.md` | 284 Z. | `DRAFT / NOT ACTIVE` | vollständig, Aktivierungsregel §18 sauber |
| 4 | `docs/traceability/MARKETING_AGENT_TRACEABILITY_MATRIX.md` | 198 Z. | — | vollständig, enthält eigene MA0-Checkliste §7 |
| 5 | `.ai/contracts/marketing-roadmap-execution-profile.json` | 124 Z. | `DRAFT_NOT_ENABLED` | korrekt inaktiv: `READ/ANALYZE/PLAN`, Kill-Switch definiert |

Ergänzend referenziert: `docs/architecture/AUTONOMOUS_CONTENT_ENGINE_ARCHITECTURE.md`,
`docs/governance/AUTONOMOUS_AGENT_CONCEPT_GATE.md`.

## 3. Blockierende Befunde

Drei Befunde wurden erhoben. **Alle drei sind behoben** — B1 und B2 unter ADR-0085,
B3 durch die Ausarbeitung von ADR-0080 auf Repository-Standard.
**Es bleibt kein dokumentarischer Blocker vor der Owner-Entscheidung.**

### B1 — ESS-0022 war doppelt vergeben — BEHOBEN (ADR-0085)

Zwei Dokumente trugen dieselbe Nummer, beide vom 2026-08-12, beide `PROPOSED`:

| Datei | Domäne | Verankerung |
|---|---|---|
| `ESS-0022-Marketing-Roadmap-Executor.md` | Marketing | ADR-0080, SEO-GM-ROADMAP-0002, Policy, Traceability, Profil |
| `ESS-0022-Passkey-Only-Owner-PR-Authorization.md` | DEVELOPMENT Chain M10 | ADR-0066, M10-Runbook, M10-Threat-Model, `DEVELOPMENT_CHAIN_ROADMAP.md`, `architecture/ROADMAP.md`, 2 Traceability-Matrizen |

ESS-0022 §17 behauptet: „`ESS-0022` was checked as unoccupied in the current repository
before this draft was created." Diese Prüfung war nicht zutreffend.

Das ist dieselbe Defektklasse wie die ADR-0068-Kollision, die **ADR-0081** bereinigt hat —
ADR-0081 hat jedoch ausschließlich den **ADR**-Nummernraum bereinigt, nicht den ESS-Raum.

**Auflösung.** Unter **ADR-0085** wurde die Marketing-Spezifikation auf **ESS-0024**
umgenummert; `ESS-0022` bleibt die Passkey-Spezifikation. Grund: Die Passkey-Variante ist
erheblich breiter verankert und berührt Owner-IAM/Step-up. Inhalt unverändert, alle
Marketing-Referenzen nachgezogen, keine Passkey-/M10-Datei angefasst.

### B2 — ESS-Registry endete bei ESS-0018 — BEHOBEN (ADR-0085)

`.ai/registry/ess-registry.json` enthielt 24 Einträge und endete bei **ESS-0018**.
`freeNumberSpaceStartsAt` stand auf `ESS-0019`. Nicht registriert waren:

`ESS-0019`, `ESS-0020`, `ESS-0021`, `ESS-0022` (×2), `ESS-0023`

(Stand vor ADR-0085.)

Das war die **Ursache von B1**: ohne gepflegte Registry wurden Kollisionsprüfungen gegen
Dateinamen statt gegen die Registry gemacht, und zwei am selben Tag entstandene Entwürfe
griffen dieselbe Nummer.

Für WP-M0 war das unmittelbar bindend, denn zwei Artefakte des Pakets machen die
Registry-Pflege zur Vorbedingung ihrer eigenen Gültigkeit:

- ESS-0024 §17: Registry MUSS im finalen Human-approved PR aktualisiert werden,
  *bevor* die Spezifikation als publizierte Authority gilt;
- Execution Policy §18: „the canonical registry/traceability entries are updated"
  ist Aktivierungsbedingung.

**Auflösung.** Unter **ADR-0085** wurde die Registry um `ESS-0019` bis `ESS-0024`
ergänzt; `freeNumberSpaceStartsAt` steht auf `ESS-0025`. Jede ESS-Datei hat jetzt genau
einen Registry-Eintrag, jeder Eintrag zeigt auf eine existierende Datei. Neue Nummern
werden ausschließlich gegen die Registry vergeben.

**Damit ist das Registry-Hindernis vor WP-M0 entfallen.**

### B3 — ADR-0080 trug seine Rolle inhaltlich nicht — BEHOBEN

ADR-0080 ist die Entscheidungsautorität für eine vollständige Agenten-Abgrenzung,
umfasst aber 22 Zeilen und besteht aus Numbering note, „Decision (summary)" und
Referenzen. Es fehlen:

- Context / Problemstellung
- verworfene Alternativen
- Consequences
- Verifikation / Definition of Done
- `Implementation-Status` (der Shadow-Validator meldet dies als INFO)

Zum Vergleich: ADR-0068 (SA4) liefert Context, kanonische Kette und exakten
Pilot-Output; ADR-0035 liefert eine 10-Punkte-DoD. ADR-0080 ist inhaltlich eine
Zusammenfassung von ESS-0024, nicht eine eigenständig prüfbare Entscheidung.

Eine Annahme in diesem Zustand hätte eine Authority erzeugt, gegen die später kein
Abgleich möglich gewesen wäre — es gab keine DoD, an der man hätte messen können.

**Auflösung.** ADR-0080 wurde am 2026-08-16 auf den Standard von ADR-0082/ADR-0035
gehoben: Context (drei zusammenlaufende Entwicklungen und die daraus folgende Gefahr der
Authority-Vererbung), fünf verworfene Alternativen mit Begründung, Consequences nach
positiv/negativ/neutral, sechs Security-Invarianten sowie eine prüfbare Definition of Done
mit Dokumentations-, Enforcement- und Runtime-Gates. `Implementation-Status` ist ergänzt
(`🔴 NOT ENABLED`), der Shadow-Validator meldet dazu keinen INFO-Befund mehr.

**Die Entscheidung selbst ist unverändert**; ausgearbeitet wurde ausschließlich ihre
Herleitung und Prüfbarkeit. Der Status bleibt `PROPOSED`.

## 4. Prüfung gegen den Autonomous Agent Concept Gate

`AUTONOMOUS_AGENT_CONCEPT_GATE.md` verlangt acht Bestandteile, bevor ein
privilegierter Agent implementiert werden darf:

| # | Anforderung | Erfüllt | Nachweis |
|---|---|---|---|
| 1 | Deep Research / Best-Practice-Vergleich | ja | ESS-0024 §2: NIST AI RMF, NIST SSDF, ISO/IEC 42001, OWASP Agentic |
| 2 | Read-only-Inspektion des Repos + Produktions-Evidence | ja | SEO-GM-ROADMAP-0002 §4.3; Content-Engine-Architektur |
| 3 | Gap-Analyse gegen DevelopmentChain-Stand | teilweise | §4.3 benennt Lücken (`generateSeries` fehlt), keine eigene Gap-Tabelle |
| 4 | ESS-Spezifikation | ja | ESS-0024, registriert (ADR-0085) |
| 5 | ADR-Entscheidung | ja | ADR-0080 mit Context, Alternativen, Consequences und DoD |
| 6 | Traceability- und Test-Gates | ja | Traceability-Matrix; ESS-0024 §13 (12 Negativtests) |
| 7 | Rollback- und Kill-Switch-Definition | ja | Policy §14; Profil `killSwitch` |
| 8 | Explizite Owner-Freigabe des Roadmap-Stands | **offen** | = WP-M0, dieser Review |

## 5. Entscheidungspunkte für den Owner

1. **Annahme (die eigentliche WP-M0-Entscheidung):** Wechseln ESS-0024 und ADR-0080 von
   `PROPOSED` auf `ACCEPTED`? Reichweite siehe Abschnitt 6.
2. **Concept Gate Punkt 3:** Die Gap-Analyse gegen den DevelopmentChain-Stand ist über
   SEO-GM-ROADMAP-0002 §4.3 abgedeckt, aber nicht als eigene Tabelle geführt. Genügt das,
   oder soll eine eigene Gap-Analyse nachgezogen werden?
3. **Folgebefund F1 (optional, eigener Vorgang):** ESS-0012 ist ebenfalls doppelt belegt
   (siehe ADR-0085). Wird das jetzt oder später aufgelöst?
4. **Registry-Absicherung (optional):** Soll die ESS-Registry-Pflege wie bei ADRs durch
   einen Validator abgesichert werden, damit sich B1/B2 nicht wiederholen?

Erledigt und nicht mehr zu entscheiden: B1, B2 (ADR-0085) und B3 (ADR-0080 ausgearbeitet).

## 6. Reichweite einer Annahme

**Eine Annahme würde bewirken:**

- ESS-0024 und ADR-0080 wechseln von `PROPOSED` nach `ACCEPTED`;
- die Marketing-Agent-Identität `capital-ai-marketing-roadmap-executor` ist als
  Spezifikation gültig und von ESS-0021 (Systemadmin) abgegrenzt;
- die Execution Policy wird zitierfähige Grundlage — **nicht** ausführbare Authority;
- WP-N1 bis WP-N4 (Content-Kette) sind planerisch entsperrt.

**Eine Annahme würde ausdrücklich NICHT bewirken:**

- keine Runtime-Capability (ESS-0024 §4: `READ / ANALYZE / PLAN only`);
- keine Repository-Mutation: `BRANCH`, `COMMIT`, `PR`, `CI_REQUEST` bleiben ungesetzt;
- `MERGE` bleibt dauerhaft verboten (ESS-0024 §5);
- `DEPLOY_REQUEST` und `PRODUCTION_MUTATION` erfordern eigene spätere ADRs;
- kein externes Social Publishing — das ist eine externe Geschäftsmutation (ADR-0080);
- keine Aktivierung der Policy: deren §18 verlangt zusätzlich VERIFIED PASS der
  SA-Host-Grundlagen, der Marketing-Negativtests und ein erstes Owner-Mandat.

## 7. Empfohlener Weg

1. ~~B1 + B2: ESS-Nummernraum bereinigen und Registry nachziehen~~ — **erledigt**
   unter **ADR-0085** (2026-08-16).
2. ~~B3: ADR-0080 auf Repository-Standard heben~~ — **erledigt** (2026-08-16).
3. **Owner-Annahme von ESS-0024 + ADR-0080** — offen, siehe Abschnitt 5.
4. Anschließend die fünf offenen Punkte aus `MARKETING_AGENT_TRACEABILITY_MATRIX.md` §7
   abarbeiten (Registry, ADR-/Traceability-Index, `architecture/ROADMAP.md`,
   M0–M10-Integration, MA1-Mandatsschema).

## 8. Aktueller Autorisierungsstand

Unverändert `READ / ANALYZE / PLAN` als konzeptionelles Profil.
Kein Dokument dieses Pakets autorisiert Repository-Mutation, CI-Requests, Deployment,
Produktionsmutation, Social Publishing oder Merge.

## 9. Owner-Entscheidung (2026-08-16)

**ACCEPT** für `ESS-0024` und `ADR-0080`.

Wörtlich protokolliert im Work Claim
`.ai/work-claims/WP-M0-MARKETING-GOVERNANCE-OWNER-ACCEPT-2026-08-16.json`
(Feld `ownerDecision.verbatimAnswer`).

Vollzogen:

| Artefakt | vorher | nachher |
|---|---|---|
| `ADR-0080` | `PROPOSED` | `Accepted (Owner 2026-08-16)` |
| `ESS-0024` | `PROPOSED / NOT ENABLED` | `ACCEPTED / NOT ENABLED` |
| `ess-registry.json` (ESS-0024) | `proposed` | `published` |
| SEO-GM-ROADMAP-0002 §5.3 WP-M0 | offen | **ERFÜLLT** |

Unverändert geblieben — die Annahme erteilt keine Fähigkeit:

- `marketing-roadmap-execution-profile.json` bleibt `DRAFT_NOT_ENABLED` / `READ, ANALYZE, PLAN`
- `MARKETING_AGENT_ROADMAP_EXECUTION_POLICY.md` bleibt `DRAFT / NOT ACTIVE`;
  ihr §18 verlangt zusätzlich VERIFIED PASS der SA-Host-Grundlagen, der
  Marketing-Negativtests und ein erstes Owner-Mandat
- `ADR-0080` verbleibt in `docs/adr/`, **nicht** in `resolved/`: seine Enforcement- und
  Runtime-Gates sind offen, `Implementation-Status` bleibt `🔴 NOT ENABLED`
- Merge ist **nicht** autorisiert; er bleibt Human/Owner-only

Nächstes Marketing-Paket laut Roadmap: **WP-N1** (`POST /api/social-media/generate`,
Text-Packages ohne Publish).
