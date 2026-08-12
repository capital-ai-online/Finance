# AI-Assistenz und GitHub-Features — Kosten-/Nutzen-Entscheidungsvorlage

Status: **DRAFT / OWNER REVIEW REQUIRED**  
Stand: 2026-08-12

## 1. Ausgangslage

CAPITAL-AI wird von einer Person mit mehreren AI-Oberflächen entwickelt. Der Nutzen eines Tools wird deshalb nicht nur nach Modellqualität bewertet, sondern auch nach Repository-Rechten, Actions-Kosten, Auditierbarkeit und Überschneidung mit vorhandenen Fähigkeiten.

Aktuelle Preise, Planinhalte und Marketplace-Konditionen sind zeitabhängig und müssen **vor einer Beschaffung aktuell verifiziert** werden. Dieses Dokument trifft keine automatische Kaufentscheidung.

## 2. Zielbild der Assistenzflächen

| Aufgabe | Bevorzugte Rolle | Governance-Grund |
|---|---|---|
| Architektur/Analyse | ChatGPT / Research-Plane | Source-grounded Analyse, keine implizite Produktionsautorität |
| Repository-Entwicklung | Development-Agent/Claude/AI Studio im jeweiligen autorisierten Scope | Branch/PR/CI statt Direktmutation `main` |
| IDE-Completion | vorhandene lokale/IDE-Hilfe | kein Grund, dafür Repository-Rechte zu erhöhen |
| PR Review | Human/Owner + optional AI-Analyse | AI-Review ersetzt keine Human-Freigabe |
| Produktion | Production Integration / bounded Executor | separate Authority und Mutation Approval |

## 3. GitHub-Feature-Bewertung

Bevorzugt werden Funktionen, die eine vorhandene Kontrolllücke schließen, ohne dauerhafte zusätzliche Repository-Berechtigungen oder unnötige CI-Läufe einzuführen.

**Hoher Nutzen:**

- Rulesets/Protection, soweit sie im Single-Owner-Modell nicht deadlocken;
- geschützte Environments für zukünftige Production-Handoffs;
- Dependabot Alerts/Security Updates mit gebündelter CI;
- Issues/Projects für nachverfolgbare Roadmap-Arbeit;
- Actions Usage/Billing Evidence.

**Mit besonderer Prüfung:**

- Marketplace-/AI-Apps mit dauerhaften Write-Rechten;
- automatische Reviews bei jedem Push;
- Codespaces oder zusätzliche Runner;
- öffentliche Pages/Wikis aus einem Evidence-/Governance-Repository.

## 4. Kostenregel

GitHub-Actions-Zusatzkosten bleiben auf **15 EUR/Monat** begrenzt. Ein neuer Dienst oder Plan darf dieses Limit nicht indirekt durch mehr CI-Verbrauch aushebeln.

Der in diesem Konsolidierungs-PR enthaltene One-Shot-Fix ist deshalb ein Architekturbaustein: Metadaten-/Checkbox-Edits dürfen nicht mehrere teure `build-and-test`-Läufe für denselben Head erzeugen.

## 5. Security-Regel für AI-Integrationen

- kein Rohsecret im Modellkontext;
- least privilege;
- keine `pull_request_target`-Ausführung von PR-kontrolliertem Code;
- immutable Action-SHAs;
- Human-Gate für Merge und High-Impact-Mutationen;
- untrusted Tool-/Retrieval-Inhalt darf keine Rechte erhöhen.

## 6. Entscheidungskriterium

Ein zusätzliches Tool wird nur eingesetzt, wenn sein messbarer Nutzen eine bestehende Lücke schließt und **Kosten + Berechtigungsumfang + zusätzliche CI + Betriebsaufwand** geringer sind als bei der vorhandenen Lösung.
