# Repository-Sichtbarkeit und Zusammenarbeitsmodelle — Bewertungsmatrix

Status: DRAFT / Entscheidungsvorlage
Stand: 2026-08-11
Repository: `SvenKulessa/Finance` (privat, 1 Collaborator)
Zweck: Die bewusste Vision „eine Person + AI-Agenten bauen eine autonome Webanwendung" ergebnisoffen gegen Alternativmodelle bewerten.

## 1. Ausgangslage

Die Vision ist kein Notbehelf, sondern eine Architekturentscheidung: Das Repository ist auf eine einzelne menschliche Person ausgelegt, die mit AI-Agenten arbeitet. Governance, CODEOWNERS, Work-Claims und die ESS-Spezifikationen sind konsequent darauf gebaut.

Diese Bewertung prüft trotzdem, ob ein anderes Modell messbar besser wäre — und macht die Rechnung transparent, statt die Vision vorauszusetzen.

## 2. Zwei harte Fakten, die jede Public-Variante vorentscheiden

### 2.1 Historien-Blocker

Die Git-Historie dieses Repositories enthält reale Produktions-Identifier, unter anderem:

- Render-Service-ID und Produktions-URL (`docs/evidence/m0/RENDER_DEPLOYMENT_EVIDENCE.md`);
- Supabase-Projekt-Referenz und vollständiges Tabelleninventar inklusive zweier offener HIGH-Advisor-Findings (`docs/evidence/m0/SUPABASE_SECURITY_EVIDENCE.md`);
- echte Stripe-Live-Price-IDs mit Preisen (`docs/production/evidence/PR_PRECHECK_2026-08-03_SUBSCRIPTION_ENTITLEMENTS_LIVE_REFRESH.md`) und eine reale Stripe-Event-ID (`docs/architecture/ROADMAP.md`);
- die vollständige Liste der 22 Secret-Namen aus dem Render-Secret-File (`scripts/security/secretFileManifest.ts`);
- eine präzise Karte der aktiven und der **fehlenden** Schutzmaßnahmen (`docs/evidence/m0/GITHUB_ENFORCEMENT_STATE_2026-08-10.md`, `.github/policies/main-production-protection.expected.json`).

**Ein Umschalten auf `visibility: public` veröffentlicht all das rückwirkend mit.** Keine Datei zu löschen hilft — die Historie bleibt abrufbar.

Konsequenz: Jede öffentliche Variante ist ausschließlich als **Neuanlage ohne Historie** vertretbar, niemals als Sichtbarkeitswechsel dieses Repositories. Das verschiebt Modell B und C von „Konfigurationsänderung" zu „Migrationsprojekt".

### 2.2 Lizenzlücke

Es existiert **kein `LICENSE`**, und `package.json` hat **kein `license`-Feld** (nur `"private": true`). Rechtlich bedeutet das: alle Rechte vorbehalten.

Für die Vision ist das ausreichend, solange das Repository privat ist. Sobald irgendetwas öffentlich wird, ist die Lizenzentscheidung **nicht optional**: Ein öffentliches Repository ohne Lizenz erlaubt nach den GitHub-Nutzungsbedingungen weiterhin Ansehen und Forken. Wer „eigene Ideen schützen" will und gleichzeitig veröffentlicht, muss aktiv wählen — z. B. eine Source-Available-Lizenz statt einer OSI-Open-Source-Lizenz.

## 3. Bewertete Modelle

| ID | Modell | Kurzbeschreibung |
| --- | --- | --- |
| **A** | Single-Private + AI-Agenten | Status quo und Vision: ein privates Repository, ein menschlicher Owner, Agenten über PR-Branches |
| **B** | Vollständig Public | Das Produkt als Open Source, ein Repository, öffentlich |
| **C** | Public-Showcase + privater Kern | Zwei Repositories: kuratierte öffentliche Doku/Demo, Produktkern privat |
| **D** | ESS-Methodik als OSS + privates Produkt | Nur das Governance-/ESS-Framework öffentlich, Scoring- und Produkt-IP strikt privat |
| **E** | Privat + externe Mitarbeitende mit Vertragsschutz | Zweite menschliche Identität unter NDA/Work-for-Hire, technisch minimal berechtigt |
| **F** | GitHub-Organisation statt Personal-Account | Alles privat, aber unter einer Organisation mit Rollen, Teams und Org-Secrets |

## 4. Kriterien und Gewichte

| Kriterium | Gewicht | Bewertungsrichtung (5 = am besten) |
| --- | --- | --- |
| K1 IP-/Ideenschutz | 25 % | 5 = Kern-IP nicht einsehbar |
| K2 Kosten unter dem 40-EUR-Deckel | 20 % | 5 = keine Zusatzkosten, ggf. Ersparnis |
| K3 Sicherheits-/Compliance-Wirkung | 15 % | 5 = wirksame Scanner/Kontrollen dort, wo der Produktivcode liegt |
| K4 Umsetzungsaufwand für eine Person | 15 % | 5 = kein Aufwand |
| K5 Vier-Augen-/Governance-Reifegrad | 10 % | 5 = echtes Vier-Augen-Prinzip erreichbar |
| K6 Marketing-/Reputationswert | 10 % | 5 = hohe Außenwirkung |
| K7 Rechtsrisiko | 5 % | 5 = geringstes Risiko |
| **Summe** | **100 %** | |

Die Gewichtung folgt der Vision: Ideenschutz und Budget dominieren, Reputation ist ein Nebenziel.

## 5. Bewertungsmatrix

| Kriterium (Gewicht) | A | B | C | D | E | F |
| --- | --- | --- | --- | --- | --- | --- |
| K1 IP-Schutz (25 %) | 5 | 1 | 4 | 4 | 3 | 5 |
| K2 Kosten (20 %) | 4 | 5 | 3 | 4 | 4 | 3 |
| K3 Sicherheitswirkung (15 %) | 2 | 4 | 2 | 2 | 3 | 3 |
| K4 Aufwand (15 %) | 5 | 1 | 2 | 3 | 3 | 3 |
| K5 Vier-Augen (10 %) | 1 | 3 | 1 | 2 | 5 | 4 |
| K6 Reputation (10 %) | 1 | 5 | 4 | 5 | 2 | 2 |
| K7 Rechtsrisiko (5 %) | 5 | 1 | 4 | 3 | 3 | 5 |
| **Gewichtete Summe** | **3,55** | **2,85** | **2,90** | **3,40** | **3,30** | **3,60** |
| **Rang** | 2 | 6 | 5 | 3 | 4 | **1** |

Rechenprobe für A: `5·0,25 + 4·0,20 + 2·0,15 + 5·0,15 + 1·0,10 + 1·0,10 + 5·0,05 = 1,25 + 0,80 + 0,30 + 0,75 + 0,10 + 0,10 + 0,25 = 3,55`.

### 5.1 Begründung der auffälligen Einzelwerte

- **A, K5 = 1:** Bei genau einem Collaborator existiert kein Vier-Augen-Prinzip. Das ist in `GITHUB_MAIN_PROTECTION_POLICY.md` bereits als Single-Owner-Ausnahme dokumentiert und durch GitHub Pro nicht lösbar.
- **A/C/D, K3 = 2:** Für private Repositories sind CodeQL und Secret Scanning nicht im Plan enthalten. Die Sicherheitswirkung ruht auf den repo-eigenen Gates (`scripts/security/*`) — wirksam, aber enger als eine Plattformlösung.
- **B, K2 = 5:** Öffentliche Repositories erhalten unbegrenzte Actions-Minuten, CodeQL und Push Protection kostenlos. Das ist der einzige belastbare Vorteil von B — und er wird durch K1 = 1 und K7 = 1 vollständig aufgezehrt.
- **B, K4 = 1:** Wegen §2.1 ist B kein Schalter, sondern eine Neuanlage ohne Historie mit anschließender Trennung von Evidence-, Governance- und Produktivdokumenten.
- **C, K4 = 2:** Zwei Repositories bedeuten doppelte Pflege und einen Synchronisationszwang, der zusätzlich mit der Registry-Pflicht der `DOCUMENTATION_HYGIENE_POLICY.md` kollidiert.
- **E, K5 = 5:** E ist das **einzige** Modell, das den Deadlock tatsächlich auflöst. Kein technisches Feature ersetzt eine zweite Person.
- **E, K1 = 3:** Der Schutz ist vertraglich, nicht technisch. Eine zweite Person mit Repo-Zugriff sieht die Scoring-IP.
- **F, K2 = 3:** Eine Organisation kostet pro Mitglied etwa dasselbe wie der bezahlte Personal-Tier — sie spart nichts, kostet aber bei zwei Identitäten doppelt.

### 5.2 Sensitivität — die Rangfolge an der Spitze ist nicht robust

**A (3,55) und F (3,60) liegen innerhalb der Messungenauigkeit dieser Methode.** Der Abstand von 0,05 Punkten rechtfertigt keine Migration. Bereits eine Erhöhung des K1-Gewichts von 25 % auf 30 % dreht die Reihenfolge zugunsten von A.

Belastbar sind dagegen die **Abstände nach unten**: B (2,85) und C (2,90) liegen deutlich hinter dem Feld, und zwar aus strukturellen Gründen, nicht wegen der Gewichtung.

## 6. Empfehlung

1. **Modell A beibehalten.** Die Vision ist tragfähig. Kein Alternativmodell erreicht einen Vorsprung, der den Migrationsaufwand einer Ein-Personen-Organisation rechtfertigt.
2. **Modell B und C ablehnen.** B opfert den gesamten IP-Schutz für Kostenvorteile, die im 40-EUR-Deckel ohnehin nicht der Engpass sind (siehe `PLATFORM_COST_BUDGET_POLICY.md` §2.1). C erzeugt dauerhafte Doppelpflege für einen Reputationsgewinn, den D billiger liefert.
3. **Modell D als optionalen Reputationskanal vormerken**, nicht als Priorität. Das ESS-Korpus (~570 KB, `.ai/skills/`) ist der eigenständigste Vermögenswert für Außenwirkung, weil es Methodik statt Produktlogik zeigt. Voraussetzung wäre eine Bereinigung interner Verweise und eine bewusste Lizenzwahl.
4. **Modell E ist der eigentliche Upgrade-Pfad**, sobald eine vertrauenswürdige zweite Identität verfügbar ist — es löst als einziges den Deadlock und aktiviert die vorhandene, sehr detaillierte `CODEOWNERS`.
5. **Modell F erst dann prüfen, wenn E eintritt.** E und F gehören zusammen: Eine Organisation lohnt sich, sobald es mehr als eine Identität zu verwalten gibt. Als Migration für einen Einzelnutzer ist F Aufwand ohne Gegenwert.

## 7. Zusammenarbeitsmodelle mit Schutz der eigenen Ideen

Falls Modell E umgesetzt wird, greifen drei Ebenen. Keine davon ersetzt die anderen.

### 7.1 Vertragsebene

Vor jedem Zugriff, nicht danach: Geheimhaltungsvereinbarung, Regelung der Rechteübertragung an Arbeitsergebnissen (in Deutschland überträgt das Urheberrecht sich nicht wie in „Work for Hire"-Rechtsordnungen — es werden Nutzungsrechte eingeräumt), Wettbewerbs- und Abwerbeklauseln, Regelung zum Umgang mit den Scoring-Verfahren nach Vertragsende.

Diese Punkte gehören fachlich geprüft; dieses Dokument ist keine Rechtsberatung.

### 7.2 Technische Ebene — abgestufter Zugriff

| Schutzgut | Mechanismus |
| --- | --- |
| Produktions-Secrets | Environment-Secrets im geschützten `production`-Environment; Collaborator erhält keinen Environment-Zugriff |
| Deploy-Fähigkeit | Deployment-Branch-Policy `main` plus Required Reviewer |
| Kritische Dateien | `CODEOWNERS` merge-wirksam schalten (`require_code_owner_review`) |
| Historie | Force-Push-Schutz für Agent-Branch-Präfixe |
| Scoring-IP | Rollenwahl `read`/`triage` statt `write`, sofern nur Approvals benötigt werden |

Zur Rollenwahl ist eine Genauigkeit nötig, die über Erfolg oder Deadlock entscheidet:

- Für eine **einfache Approval** genügt Lesezugriff. Eine zweite Identität mit `read` erfüllt `required_approving_review_count = 1`, ohne je auf `main` schreiben zu können.
- Für **`require_code_owner_review`** genügt das nicht: Als Code Owner anforderbar sind nur Identitäten mit Schreibzugriff. Wer die vorhandene `CODEOWNERS` merge-wirksam schalten will, muss der zweiten Identität `write` geben.

Das ist der eigentliche Zielkonflikt in Modell E: maximaler IP-Schutz (`read`) und volle Code-Owner-Durchsetzung (`write`) schließen sich aus. Empfehlung für den Einstieg: mit `read` und einer einfachen Approval-Pflicht beginnen — das löst den Deadlock, hält das IP-Risiko klein und lässt sich später erweitern.

### 7.3 Organisatorische Ebene

Die vorhandenen Work-Claims (`.ai/work-claims/`) und die ESS-Registry dokumentieren bereits, wer was wann bearbeitet hat. Das ist bei mehreren Beteiligten kein Verwaltungsaufwand, sondern die Nachweisgrundlage bei Streit über Urheberschaft.

## 8. Offene Owner-Entscheidungen

1. Soll eine Lizenzdatei angelegt werden, auch solange alles privat bleibt? Empfehlung: ja — eine explizite proprietäre Lizenzangabe ist eindeutiger als das Fehlen jeder Angabe.
2. Wird Modell D verfolgt? Wenn ja: welche Lizenz für das ESS-Korpus?
3. Gibt es einen realistischen Kandidaten für die zweite Identität aus Modell E?

## 9. Verwandte Dokumente

- `docs/governance/GITHUB_MAIN_PROTECTION_POLICY.md` — Single-Owner-Ausnahme und Promotion-Bedingung
- `docs/governance/GITHUB_PRO_ENABLEMENT_PLAN.md` — technische Umsetzung der Härtung
- `docs/governance/PLATFORM_COST_BUDGET_POLICY.md` — Kostendeckel, gegen den K2 bewertet wurde
- `docs/governance/DOCUMENTATION_HYGIENE_POLICY.md` — Registry-Pflicht, die Modell C zusätzlich belastet
