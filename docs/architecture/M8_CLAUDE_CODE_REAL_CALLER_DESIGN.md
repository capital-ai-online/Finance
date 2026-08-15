# M8 (I1) — Was ein "realer Aufrufer" für `claude-code-cli` bedeuten müsste

Status: **DESIGN-DISKUSSION — keine Implementierung, keine Mutation, kein neuer realer Aufrufer**
Datum: 2026-08-15
Roadmap phase: I1 (`docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md`, Option B:
„Claude-Code-Caller / Design-Evidence")
Authority: `docs/runbooks/M8_AGENT_CUTOVER.md`, `src/platform/Security/providerProfile.ts`,
`docs/architecture/GENERALIZED_SYSTEMADMIN_EXECUTION_HOST_DESIGN.md` (Modell A/B),
`docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §1.2

## 0. Zweck

`docs/evidence/m8/M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md` §3.2 stellt fest,
dass `claude-code-cli` `BLOCKED` bleibt, weil kein realer Aufrufer existiert — 4 von 6
`ProviderCutoverEvidence`-Feldern fehlen strukturell. Dieses Dokument formalisiert **was genau**
„realer Aufrufer" für dieses eine Profil bedeuten müsste, und warum das keine triviale
Nachbau-Aufgabe der SA3B/SA4-Vorlage ist. Es entscheidet nichts und baut nichts — das bleibt eine
separate, vom Owner zu autorisierende Folgearbeit.

## 1. Warum die interaktive Sitzung selbst niemals zählt

Bereits abschließend dokumentiert (`M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §1.2): jede
interaktive Claude-Code-Sitzung — einschließlich dieser — erhält ihren MCP-Tool-Zugriff von der
äußeren CCR-/Sitzungs-Laufzeitumgebung, nicht durch `agentIam.ts` oder `providerProfile.ts`
vermittelt. Es gibt kein In-Repo-Credential, das diese Sitzung selbst als „Aufrufer" registrieren,
gaten oder deaktivieren könnte. Ein „realer Aufrufer" im Sinne von `realCallerVerified` muss daher
zwingend etwas **anderes** sein als „ein Mensch chattet mit Claude Code" — er muss ein
code-adressierbarer, vom Repository selbst gategater Ausführungspfad sein, analog zu SA3B/SA4.

## 2. Zwei strukturell verschiedene Wege, das zu bauen

### 2.1 Weg 1 — Claude als reiner Content-Generator innerhalb eines Model-A-Work-Package (buildbar heute)

Der bestehende ADR-0074-Katalog (`scripts/systemadmin/workPackages/`) erlaubt bereits, dass ein
Work-Package-Modul einen beliebigen deterministischen `generate()`-Aufruf macht — Node-Code, der
Markdown/Code-Text produziert. **Nichts hindert ein solches Modul daran, innerhalb von `generate()`
einen einzelnen, nicht-agentischen Anthropic-API-Aufruf zu machen** (fixer System-Prompt, fixe
Eingabe, reine Textantwort, **kein** Tool-Zugriff für das Modell selbst), dessen Ausgabe
anschließend — wie jede andere `generate()`-Ausgabe auch — deterministisch validiert und vom
umgebenden Script committet wird. Das Modell bekäme dabei **keinerlei** eigene Datei-, Shell- oder
Git-Capability; die gesamte BRANCH→COMMIT→PR-Kette bliebe exakt wie heute vollständig
skriptgesteuert und IAM-gegated.

**Sicherheitseigenschaft:** identisch zu Modell A — kein neuer Autorisierungsmechanismus nötig, weil
das Modell nie einen eigenen Tool-Aufruf tätigt, der vermittelt werden müsste. Das ist **kein**
Modell-B-Host.

**Aber:** Das wäre ehrlicherweise kein „`claude-code-cli`"-Aufrufer im Sinne der
`ProviderProfile`-appId — es wäre ein bloßer Anthropic-API-Textgenerierungsaufruf innerhalb eines
Model-A-Work-Package, näher verwandt mit einer neuen `appId` wie
`anthropic-api-content-generation` als mit „Claude Code, das mit eigenen Werkzeugen agiert". Die
`claude-code-cli`-Profildefinition selbst (`src/platform/Security/providerProfile.ts:101`)
modelliert explizit einen Agenten mit Tool-Zugriff (`allowedCapabilities` umfasst `BRANCH`/`COMMIT`
etc.), nicht eine reine Textgenerierungs-Funktion. Weg 1 würde daher entweder (a) ein neues,
enger gefasstes Profil für reine Content-Generierung ohne mutierende Capability rechtfertigen
(analog zu `google-ai-studio`s Development-Plane-Einstufung — vermutlich `NOT_APPLICABLE` für
privilegierten Cutover, weil keine mutierende Capability benötigt wird), oder (b) das bestehende
`claude-code-cli`-Profil bliebe weiterhin `BLOCKED`, weil Weg 1 es nicht tatsächlich bedient.

### 2.2 Weg 2 — Echter agentischer Claude-Code-Host mit eigenem Tool-Zugriff (heute nicht buildbar)

Das wäre die wörtliche Bedienung des `claude-code-cli`-Profils: ein GitHub-Actions-Workflow, der
Claude Code (CLI oder Agent SDK) headless mit echtem Datei-/Shell-/Git-Zugriff aufruft, das anhand
einer Aufgabenbeschreibung tatsächlich autonom Code liest, schreibt, testet und committet — exakt
das in `GENERALIZED_SYSTEMADMIN_EXECUTION_HOST_DESIGN.md` als „Modell B" beschriebene und als
**nicht sicherheitsarchitektonisch tragfähig** bewertete Szenario.

Der dortige Blocker gilt hier unverändert und uneingeschränkt: die heutige Autorisierungskette prüft
eine grobkörnige Absicht **einmal** vorab und erlaubt danach genau **eine** Git-Endoperation; ein
echter Agentenlauf tätigt aber Dutzende bis Hunderte individuelle Tool-Aufrufe, von denen keiner
gegen `mandate.allowedPaths`/`allowedCapabilities` geprüft wird. Diese Lücke ist identisch mit der
Lücke, die diese Sitzung selbst hat (§1) — ein GitHub-Actions-interner Host hätte sie zusätzlich
**ohne** den einzigen Kompensationsfaktor, den die interaktive Sitzung heute bietet: einen Menschen,
der in Echtzeit zusieht.

Ein `claude-code-cli`-Aufrufer entlang Weg 2 wäre daher — unverändert gegenüber der bestehenden
Modell-B-Bewertung — erst zulässig, nachdem mindestens Anforderung 1 aus
`GENERALIZED_SYSTEMADMIN_EXECUTION_HOST_DESIGN.md` §4 (Tool-Call-Vermittlungsschicht) real existiert
und getestet ist. Das ist eine eigene, deutlich größere Architekturaufgabe, kein Bestandteil dieses
Dokuments und keine I1-Aufgabe.

## 3. Bewertung gegen `ProviderCutoverEvidence`

| Weg | `realCallerVerified` erreichbar? | Bedient tatsächlich `claude-code-cli`-Profil? | Aufwand |
|---|---|---|---|
| 1 — Content-Generator in Model-A-Work-Package | Ja, aber für ein **anderes**, enger gefasstes Profil (reine Textgenerierung ohne Tool-Zugriff) | Nein — `claude-code-cli` selbst bleibt unbedient | Klein, mit bestehender ADR-0074-Infrastruktur sofort machbar, falls Owner ein solches Profil separat definieren möchte |
| 2 — Echter agentischer Host | Ja, aber erst nach einer eigenständigen, großen Sicherheitsarchitektur-Erweiterung | Ja — das ist die einzige Weg, die das Profil wörtlich bedient | Groß, eigenes ADR erforderlich, aktuell nicht sicherheitsarchitektonisch tragfähig (siehe Referenzdokument §3) |

**Ergebnis: Für das `claude-code-cli`-Profil, wie es heute in `providerProfile.ts` definiert ist,
gibt es aktuell keinen sicherheitsarchitektonisch vertretbaren Weg zu einem realen Aufrufer.**
Weg 1 löst ein anderes Problem (Content-Generierung), Weg 2 ist durch eine bereits dokumentierte,
ungelöste strukturelle Lücke blockiert.

## 4. Empfehlung

- `claude-code-cli` bleibt für privilegierten Cutover `BLOCKED` — das ist der korrekte,
  sicherheitsarchitektonisch begründete Zustand, keine offene Aufgabe, die „einfach noch erledigt
  werden muss".
- Falls der Owner reine LLM-Content-Generierung innerhalb von Model-A-Work-Packages will (Weg 1),
  wäre der richtige nächste Schritt ein neues, eng gefasstes Provider-Profil (z. B.
  `anthropic-api-content-generation`, keine mutierende Capability, analog zu `google-ai-studio`) —
  nicht eine Erweiterung von `claude-code-cli`. Das wäre eine separate, klein scoped Owner-Anfrage,
  kein Bestandteil dieses Dokuments.
- Ein echter `claude-code-cli`-Aufrufer (Weg 2) bleibt an die in
  `GENERALIZED_SYSTEMADMIN_EXECUTION_HOST_DESIGN.md` §4 aufgeführten 7 Anforderungen gebunden,
  speziell Anforderung 1 (Tool-Call-Vermittlungsschicht) als Blocker. Diese Sitzung empfiehlt
  **nicht**, diese Architekturarbeit im Rahmen von I1 zu beginnen — das wäre ein eigenständiges,
  vom Owner zu priorisierendes Vorhaben mit eigenem ADR.

## 5. Auswirkung auf I1 / Exit Gate

Keine. Exit-Gate-Punkt 2 (`docs/runbooks/M8_AGENT_CUTOVER.md`) bleibt unverändert `PARTIAL`.
`ProviderCutoverEvidence` für `claude-code-cli` bleibt unverändert `BLOCKED`
(`docs/evidence/m8/M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md` §3.2). Dieses
Dokument liefert ausschließlich eine Design-Klarstellung, keine neue Evidence, keinen neuen Code.

## Verwandte Dokumente

- `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` (I1, Option B)
- `docs/evidence/m8/M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md`
- `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` §1.2
- `docs/architecture/GENERALIZED_SYSTEMADMIN_EXECUTION_HOST_DESIGN.md` (Modell A/B)
- `src/platform/Security/providerProfile.ts`
