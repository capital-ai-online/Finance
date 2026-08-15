# Generalisierter Systemadministrator-Ausführungshost — Architektur-Diskussionspapier

Status: DISCUSSION PAPER — kein ADR, keine Implementierung, kein neues Mandat. Reine
Architekturanalyse auf Owner-Anfrage ("Design für echten Ausführungs-Host skizzieren").
**Nachtrag 2026-08-15:** Modell A (Abschnitt 3) wurde inzwischen auf separate Owner-Anweisung
tatsächlich umgesetzt und end-to-end real bewiesen (nicht nur strukturell getestet) — siehe
`docs/adr/ADR-0074-generalized-systemadmin-work-package-catalog.md`, `VERIFIED PASS` seit
2026-08-15 (Issue #325, PR #326). Modell B (Abschnitt 3/4) bleibt unverändert unbegonnen; der in
Abschnitt 4 identifizierte Blocker (Tool-Call-Vermittlungsschicht) wurde nicht angegangen.
Datum: 2026-08-15
Authority-Referenzen: `.ai/skills/ESS-0021-Systemadmin-Roadmap-Executor.md`,
`docs/adr/ADR-0065-systemadmin-roadmap-execution-mandate.md`,
`docs/adr/ADR-0067-systemadmin-github-actions-execution-host.md`,
`docs/adr/ADR-0068-first-bounded-autonomous-work-package.md`,
`docs/governance/ROADMAP_EXECUTION_MANDATE.schema.json`

## 0. Anlass

Owner-Anweisung: "fahre mit der Ausführung des Systemadministrators fort, der die
DevelopmentChain Roadmap codebasiert umsetzt". Vor diesem Dokument wurde geklärt, dass es aktuell
**keinen** wiederverwendbaren, generalisierten Ausführungshost gibt — nur zwei verbrauchte
Einzelnachweise (SA3B, SA4). Dieses Dokument beschreibt, was ein echter, sicherer,
generalisierter Host tatsächlich bräuchte, ohne ihn zu bauen.

## 1. Bestandsaufnahme: was heute existiert

| Host | Workflow | Fähigkeit | Status |
|---|---|---|---|
| SA3B | `.github/workflows/systemadmin-roadmap-executor.yml` | Erzeugt genau einen leeren Branch unter Audit (`BRANCH`-Capability only) | COMPLETE/VERIFIED PASS als Nachweis, reaktiviert für exakt dasselbe Probe-Mandat (`REM-SA3B-PROBE-001`, `allowedPaths: ["docs/evidence/sa3b/**"]`) |
| SA4 | `.github/workflows/systemadmin-sa4-pilot.yml` | Erzeugt Branch, committet **eine hartkodierte, deterministische Datei** (`docs/evidence/sa4/SA4_FIRST_AUTONOMOUS_WORK_PACKAGE.md`), öffnet Draft-PR | Permanent deaktiviert (`if: false && ...`); Zieldatei bereits auf `main` gemergt → self-blocking selbst bei Reaktivierung |

Beide Hosts teilen ein zentrales, bewusstes Sicherheitsmuster (ADR-0068): der Issue-Body (der
einzige externe Eingabekanal) wird strikt validiert (`scripts/systemadmin/validateExecutionIssue.mjs`
/ `validateSa4PilotIssue.mjs`) und darf **niemals** Dateiinhalt, Shell-Befehle, beliebige Pfade
oder Workflow-Definitionen liefern — nur eng begrenzte Metadaten (z. B. welche vordefinierte
Branch-Namenskonvention). Der tatsächliche Dateiinhalt kommt aus vertrauenswürdigem, bereits
auf `main` gemergtem Code. Diese Eigenschaft ist der Grund, warum SA4 überhaupt sicher betrieben
werden konnte: es gibt buchstäblich keinen Codepfad, über den externer Text zu ausgeführtem Code
oder beliebigem committetem Inhalt wird.

`server/systemadmin/systemadminExecutionBrokerRouter.ts` verschärft das zusätzlich: der Broker
kennt **hartkodiert genau zwei** Workflow-Referenzen und bildet sie 1:1 auf genau zwei Mandate ab
(`expectedMandateForWorkflow()`). Ein drittes Mandat für ein drittes, neues Arbeitspaket würde vom
Broker heute mit `workflow-mandate-binding-mismatch` abgelehnt, auch wenn die Mandat-JSON-Datei
selbst schemakonform und Owner-approved wäre. Eine Generalisierung erfordert also **Code-Änderungen
am Broker selbst**, nicht nur eine neue Mandat-Datei.

## 2. Zieldefinition: was "codebasiert die Roadmap umsetzt" tatsächlich bedeutet

ESS-0021 Abschnitt 5 beschreibt die eigentlich gewünschte autonome Schleife:

```
main/Roadmap/Evidence lesen → nächstes Arbeitspaket wählen → Preflight →
frischer Branch → Code/Doku/Tests IMPLEMENTIEREN → gezielte Checks →
Security-Selbstprüfung → committen → iterieren → PR öffnen/aktualisieren →
CI-Mängel im Scope beheben → STOPP bei Human/Owner-Review
```

Der Schritt "Code/Doku/Tests implementieren" ist bei SA3B/SA4 nicht vorhanden — beide Hosts
kennen ihren gesamten Output bereits zur Build-Zeit (leerer Branch bzw. eine fixe Datei). Ein
Host, der **beliebige** Roadmap-Arbeitspakete umsetzt, muss zur Laufzeit entscheiden, welchen
Code er schreibt. Das ist der eigentliche, bislang ungelöste Kern dieser Anfrage.

## 3. Zwei grundsätzlich verschiedene Modelle

### Modell A — Katalog vorab genehmigter Skripte (Erweiterung des SA4-Musters)

Für jedes einzelne, vom Owner freigegebene Arbeitspaket wird ein eigenes, kleines,
menschlich/interaktiv geschriebenes und review­tes Skript auf `main` gemergt (analog
`runSa4Pilot.mjs`, aber pro Paket). Der Issue-Body wählt nur **welches** bereits gemergte Skript
läuft, plus eng begrenzte Parameter — nie Freitext, nie Code.

- **Vorteil:** verändert das bestehende Sicherheitsmuster nicht. Jede einzelne Änderung wurde
  bereits vor dem Merge auf `main` von einem Menschen (oder dieser interaktiven Sitzung, mit
  anschließender Owner-Freigabe) inhaltlich geprüft — der GitHub-Actions-Host führt nur eine
  bereits genehmigte Änderung *aus*, er *entscheidet* nichts.
- **Nachteil:** das ist keine "autonome Umsetzung neuer Arbeitspakete" im eigentlich gemeinten
  Sinn — die kreative/analytische Arbeit (welchen Code schreiben) bleibt vollständig
  vorgelagert. Es automatisiert **Ausführung**, nicht **Implementierung**. Skaliert linear mit
  der Anzahl vorab genehmigter Pakete; jedes neue Paket braucht wieder ein neues Skript + Review
  + Broker-Erweiterung (siehe Abschnitt 1).

### Modell B — LLM-gestützter Host mit echter Laufzeit-Implementierung

Der Workflow ruft innerhalb des GitHub-Actions-Runners ein LLM (z. B. über die Anthropic-API) mit
eingeschränktem Tool-Zugriff auf (Datei lesen/schreiben, Tests ausführen, `git`/`gh`), das anhand
der im Issue beschriebenen Aufgabe tatsächlich Code generiert und committet.

Das entspricht dem, was in dieser interaktiven Sitzung ohnehin bereits geschieht — nur ohne einen
Menschen, der bei jedem Schritt zusieht.

**Das ist der Fall, für den heute keine tragfähige Sicherheitsarchitektur existiert.** Grund:

- Die heutige Autorisierung (`authorizeSystemadminAuditedExecution` → Broker → Permit) prüft
  **eine grobkörnige Absicht** einmal vorab ("ich möchte jetzt Capability X auf Ziel Y ausführen")
  und erlaubt danach genau **eine** konkrete Git-Operation (ein Branch, ein Commit, ein PR).
  Ein LLM mit echter Werkzeugschleife führt aber potenziell **Dutzende bis Hunderte** einzelne
  Tool-Aufrufe pro Lauf aus (Datei lesen, Datei schreiben, `grep`, Testlauf, erneutes Schreiben …).
  Es gibt aktuell **keinen Mechanismus**, der `mandate.allowedPaths`/`allowedCapabilities` auf
  **jeden einzelnen** dieser Tool-Aufrufe anwendet — nur auf die drei groben Git-Endoperationen.
- Das ist exakt die in `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` Abschnitt 1.2
  dokumentierte, als dauerhafte Scope-Grenze offengelegte Lücke dieser Sitzung selbst: die
  Tool-Aufrufe eines laufenden LLM-Agenten sind strukturell nicht durch `agentIam.ts` vermittelt,
  weil die Berechtigung von der äußeren Ausführungsumgebung kommt, nicht vom Repository-Code. Ein
  LLM-Host **innerhalb** von GitHub Actions hat exakt dasselbe Problem — nur ohne den einzigen
  Kompensationsfaktor, den die interaktive Sitzung heute hat: einen Menschen, der in Echtzeit
  zusieht und jederzeit unterbrechen kann.
- Der Issue-Body wird zur Aufgabenbeschreibung des LLM — klassische Prompt-Injection-Fläche. Der
  Trigger ist zwar auf `github.event.issue.user.login == 'SvenKulessa'` beschränkt, das
  reduziert externe Angreifer, aber nicht das Risiko, dass ein Issue-Text (z. B. aus einer
  externen Quelle kopiert) unbeabsichtigt Anweisungen enthält, die das LLM als Instruktion statt
  als zu bearbeitenden Inhalt interpretiert.

## 4. Anforderungen, die ein echter Modell-B-Host erfüllen müsste

Diese Liste ist der eigentliche Kern eines künftigen ADR, falls Modell B je verfolgt wird — hier
nur als Anforderungskatalog, nicht spezifiziert:

1. **Tool-Call-Vermittlungsschicht ("Interceptor").** Jeder einzelne Datei-/Shell-Zugriff des
   LLM-Agenten muss vor Ausführung gegen `mandate.allowedPaths`/`allowedCapabilities` geprüft
   werden — eine Erweiterung von `evaluateAgentAuthorization()`/`checkProviderProfileScope()` von
   "einmal pro Anfrage" auf "einmal pro Tool-Aufruf, mit demselben REM im Kontext". Ohne das ist
   jede weitere Anforderung in dieser Liste wirkungslos, weil `allowedPaths` nicht durchsetzbar
   wäre.
2. **Broker-Generalisierung.** `systemadminExecutionBrokerRouter.ts` müsste von der hartkodierten
   Zwei-Workflow-Zuordnung (Abschnitt 1) auf eine generische, mandatgetriebene Zuordnung
   umgestellt werden, ohne die bestehende OIDC-Workflow-Identitätsbindung zu schwächen.
3. **Getrennte Vertrauenszonen für Anweisung vs. Inhalt.** Der Issue-Body darf als
   Aufgabenbeschreibung dienen, muss aber im Prompt-Aufbau eindeutig von zitiertem/gelesenem
   Repository-Inhalt getrennt sein — dasselbe Prinzip, das diese Sitzung bereits auf externe
   PR-/Review-Inhalte anwendet (`untrusted-keys`, `trust="relay"` in den Event-Umschlägen).
4. **Feingranulares Audit.** Nicht nur Branch/Commit/PR-Ereignisse, sondern jeder einzelne
   Tool-Aufruf müsste mit `mandateId + roadmapItem + Tool + Pfad + Entscheidung` korreliert und
   in der M5-Audit-Kette persistiert werden (ESS-0021 Abschnitt 9 verlangt das bereits konzeptionell,
   aber ohne die technische Granularität, die ein LLM-Agent-Loop erzeugt).
5. **Sofort wirksamer Kill-Switch.** `killSwitch.enabled` müsste einen laufenden mehrere-Minuten
   -Agentenlauf unterbrechen können, nicht nur künftige Anfragen blockieren — heute prüft die
   Kette den Kill-Switch nur bei der einmaligen Vorab-Autorisierung.
6. **CI-/Kosten-Deckel.** Ein LLM-Agent-Loop mit potenziell vielen API-Aufrufen braucht ein
   hartes Zeit-/Kosten-Limit pro Lauf (`ciBudgetPolicyRef` existiert bereits als Konzept, aber
   nicht für LLM-API-Kosten).
7. **Unveränderter Human-Gate.** Merge bleibt in jedem Modell ausschließlich Owner-Aktion — das
   ist bereits heute vollständig durch die Abwesenheit einer `MERGE`-Capability im gesamten
   System strukturell erzwungen (`agentIam.ts`) und müsste unverändert bleiben.

Punkt 1 ist der Blocker: ohne ihn ist jeder weitere Punkt Kosmetik, weil `allowedPaths` nicht
technisch durchsetzbar wäre — ein LLM-Agent könnte trotz engem Mandat jede Datei im Repository
lesen und schreiben, sobald er einmal grob autorisiert ist.

## 5. Offene Fragen, falls Modell B verfolgt werden soll

- Welcher LLM-Provider/welches Modell läuft innerhalb des GitHub-Actions-Runners, und wie werden
  dessen API-Zugangsdaten als GitHub-Actions-Secret verwaltet (eigene Rotations-/Exposure-Fragen,
  die über den bestehenden GitHub-OIDC-Mechanismus hinausgehen, der für den Broker-Zugriff selbst
  bereits gelöst ist)?
- Ist ein **unbeaufsichtigter** Host mit Punkt 1–6 tatsächlich sicherer oder wertvoller als der
  heutige Zustand — eine interaktive Sitzung, die dieselbe Arbeit macht, aber mit einem Menschen,
  der jeden PR vor Merge sieht und jederzeit "stop" sagen kann? Diese gesamte Sitzung (M7-Abschluss,
  M8-Elemente, P2-1-Bestandsaufnahme, F1/F4-Fixes) wurde bereits **codebasiert** über die
  DEVELOPMENT-Chain-Roadmap umgesetzt — nur eben interaktiv, nicht über einen unbeaufsichtigten
  GitHub-Actions-Host. Der Mehrwert eines Modell-B-Hosts wäre in erster Linie Durchsatz
  (mehrere Läufe parallel/über Nacht), nicht neue Fähigkeit.
- Falls gewünscht: welches wäre das erste, bewusst kleine Zielarbeitspaket für einen Modell-B-Piloten
  — analog zu SA4s "eine Datei, ein PR" -Ansatz, aber mit echter (wenn auch trivialer)
  Laufzeit-Entscheidung statt hartkodiertem Inhalt?

## 6. Empfehlung

Modell A ist mit dem bestehenden Sicherheitsmuster sofort erweiterbar, liefert aber keine echte
autonome Implementierung — nur wiederholbare Ausführung bereits genehmigter Änderungen. Modell B
ist das, was mit "codebasiert die Roadmap umsetzen" wahrscheinlich eigentlich gemeint ist, hat
aber einen ungelösten Kernblocker (Punkt 1, Tool-Call-Vermittlung) und würde eine eigene,
mehrstufige Roadmap-Phase mit eigenem ADR und eigenem Sicherheits-Review rechtfertigen — nicht als
Erweiterung von M8 oder P2-1, sondern als eigenständiges Vorhaben. Diese Sitzung empfiehlt, Modell
B nicht ungeprüft zu beginnen, bevor Punkt 1 konzeptionell gelöst ist, und in der Zwischenzeit die
DEVELOPMENT-Chain-Roadmap wie bisher interaktiv fortzusetzen.

## 7. Nicht Bestandteil dieses Dokuments

- Keine Implementierung, kein neuer Workflow, kein neuer Broker-Code.
- Kein neues REM-Mandat (weder Entwurf noch Freigabe).
- Kein neues ADR — dieses Dokument ist bewusst ein Diskussionspapier mit niedrigerer Verbindlichkeit.
- Keine Entscheidung, ob Modell B überhaupt verfolgt wird — das ist eine Owner-Entscheidung, die
  dieses Dokument vorbereitet, aber nicht trifft.

## Verwandte Dokumente

- `.ai/skills/ESS-0021-Systemadmin-Roadmap-Executor.md`
- `docs/adr/ADR-0067-systemadmin-github-actions-execution-host.md`,
  `docs/adr/ADR-0068-first-bounded-autonomous-work-package.md`
- `docs/evidence/m8/M8_PHASE0_AND_PROVIDER_PROFILE_EVIDENCE.md` Abschnitt 1.2 (Interaktive-Sitzung-
  Bypass-Befund, dieselbe Grenzfrage)
- `server/systemadmin/systemadminExecutionBrokerRouter.ts`,
  `.github/workflows/systemadmin-roadmap-executor.yml`,
  `.github/workflows/systemadmin-sa4-pilot.yml`
