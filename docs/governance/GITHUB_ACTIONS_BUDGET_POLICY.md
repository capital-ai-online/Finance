# GitHub-Actions-Budgetrichtlinie — 15 EUR/Monat

**Status:** Verbindlich  
**Geltungsbereich:** `SvenKulessa/Finance`, alle menschlichen und KI-basierten Contributors (einschließlich ChatGPT, Claude und weiterer Agenten)  
**Budget:** maximal 15 EUR GitHub-Actions-Zusatzkosten pro Kalendermonat

## 1. Ziel und Grundsatz

GitHub Actions ist eine begrenzte CI-Ressource. Jeder Contributor MUSS Testläufe minimieren und vorhandene CI-Evidence wiederverwenden. Ein neuer Commit, Rebase, Branch-Sync oder manueller Re-Run darf nicht allein dazu dienen, einen bereits grünen Check erneut auszuführen.

Das GitHub-Budget von 15 EUR ist eine Obergrenze und kein Verbrauchsziel. Die Pipeline ist so auszulegen, dass sie primär innerhalb des im GitHub-Plan enthaltenen Freikontingents arbeitet.

## 2. Verbindliche Run-Limits

### Pull Request

- Pro PR-Head-SHA ist genau **ein vollständiger technischer Linux-Testlauf** zulässig.
- Ein zusätzlicher Linux-Job ist nur für eine spezialisierte, nicht duplizierende Sicherheits-/Governance-Prüfung zulässig.
- Maximales reguläres Runner-Budget je PR-Head-SHA: **30 Linux-Runner-Minuten**.
- Nach einem fehlgeschlagenen Lauf ist genau **ein gezielter Wiederholungslauf nach einer tatsächlichen Korrektur** zulässig.
- `Re-run all jobs` ohne Code-/Konfigurationsänderung ist untersagt, außer bei dokumentierter GitHub-/Runner-Infrastrukturstörung.
- Mehrere kleine Fix-Commits sollen lokal oder durch vorhandene Evidence gesammelt validiert werden; nicht jeder Zwischenstand soll einen neuen Remote-CI-Lauf erzeugen.

### main

- Pro Merge-SHA ist genau **ein vollständiger Produktions-CI-Lauf** zulässig.
- Der Render-Deploy darf nur aus diesem erfolgreichen `main`-Lauf für den exakt geprüften SHA ausgelöst werden.
- Kein zusätzlicher GitHub-Actions-Lauf darf nur zur Deployment-Verifikation gestartet werden.

### Dokumentations-/Metadatenänderungen

- Änderungen ausschließlich an `docs/**`, Markdown-Dateien oder nicht ausführbaren Repository-Metadaten sollen keinen vollständigen Node-/Docker-Testlauf auslösen, sofern keine Workflow-, Security-, Runtime- oder Deployment-Invariante betroffen ist.

## 3. Verbotene Kostenmuster

Folgende Muster sind nicht zulässig:

1. identische `npm ci`, TypeScript-, Unit-Test- und Production-Build-Sequenzen in mehreren Workflows für denselben PR-SHA;
2. vollständiger Docker-Build in mehr als einem Workflow für denselben SHA;
3. manuelle Re-Runs zur Statuskosmetik;
4. Branch-Synchronisierung ohne tatsächliche `main`-Drift;
5. automatisches Polling durch Agenten, das neue Actions-Runs auslöst;
6. Matrix-Builds, macOS- oder Windows-Runner ohne explizite Architekturentscheidung;
7. größere GitHub-hosted Runner ohne explizite Freigabe;
8. CI-Commits, deren einziger Zweck die erneute Auslösung unveränderter Tests ist.

## 4. Docker-Regel

Der vollständige Docker-Image-Build ist teuer und wird deshalb selektiv ausgeführt:

- immer auf `main` vor dem Render-Deploy;
- auf Pull Requests nur, wenn Docker-/Runtime-/Dependency-/Deployment-relevante Dateien verändert wurden, insbesondere `Dockerfile`, `.dockerignore`, `package.json`, `package-lock.json`, `server/**`, Runtime-Guards oder Docker-Security-Skripte;
- nicht für reine UI-, Text- oder Dokumentationsänderungen, sofern keine Runtime-Invariante betroffen ist.

Die statische Docker-Hardening-Policy darf weiterhin als kostengünstiger Bestandteil des normalen technischen Gates laufen.

## 5. Budgetsteuerung

GitHub Billing MUSS mit einem monatlichen Actions-Budget von maximal **15 EUR** und aktivierter Stop-Regel am Budgetlimit betrieben werden. Empfohlene Warnschwellen:

- 50 %: Kostenprüfung;
- 75 %: keine optionalen Remote-Testläufe mehr;
- 90 %: nur merge-/produktionskritische CI;
- 100 %: Hard Stop; keine Budgeterhöhung ohne bewusste Owner-Entscheidung.

Ein KI-Agent darf das Budget, Spending Limit oder Billing-Konfigurationen niemals selbst erhöhen.

## 6. Agentenrichtlinie für ChatGPT, Claude und andere KI-Systeme

Vor jedem Commit oder PR-Update MUSS ein Agent:

1. prüfen, ob der aktuelle PR-Head bereits valide CI-Evidence besitzt;
2. Änderungen bündeln, statt mehrere CI-auslösende Mikro-Commits zu erzeugen;
3. keinen manuellen Re-Run auslösen, wenn kein technischer Grund besteht;
4. bei einem CI-Fehler zuerst Logs/Root Cause analysieren und erst danach einen korrigierenden Commit erzeugen;
5. vorhandene grüne Evidence nicht durch unnötiges Rebase/Synchronisieren invalidieren;
6. bei absehbarer Überschreitung der Limits den Owner informieren und keine zusätzliche kostenpflichtige CI auslösen.

## 7. Pipeline-Zielbild

```text
Pull Request
  -> 1x Build/Test-Gate
  -> nur betroffene Spezial-Gates
  -> kein Production Deploy

Merge nach main
  -> 1x vollständiges Production-Gate
  -> 1x Docker-Image-Build
  -> Render Deploy Hook für exakt geprüften SHA
```

`PR Technische Validierung` darf künftig keine zweite vollständige Kopie des normalen CI-Gates darstellen. Doppelte Test-/Build-Arbeit ist zu entfernen oder in einen einzigen wiederverwendbaren Workflow zu konsolidieren.

## 8. Ausnahmeprozess

Eine Überschreitung der Run-Limits ist nur zulässig bei:

- GitHub-Infrastrukturfehlern;
- sicherheitskritischen Incident-Fixes;
- notwendiger reproduzierbarer Fehleranalyse, die lokal nicht möglich ist.

Die Ausnahme MUSS im PR mit Grund und zusätzlicher Run-Anzahl dokumentiert werden.

## 9. Review

Die Richtlinie wird überprüft, sobald einer der folgenden Fälle eintritt:

- GitHub-Plan oder Actions-Preise ändern sich;
- das monatliche Budget von 15 EUR wird zweimal innerhalb von drei Monaten zu mehr als 75 % ausgeschöpft;
- ein Self-hosted Runner eingeführt wird;
- die CI-Architektur wesentlich geändert wird.
