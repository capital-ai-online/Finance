# GitGuardian-/Snyk-App-Integration — historisches Owner-Runbook

Status: HISTORICAL / RETIRED / NON-AUTHORIZING  
Datum: 2026-08-14  
Retired: 2026-09-10  
ADR: `docs/adr/ADR-0070-gitguardian-snyk-external-app-integration.md`

> Historischer Record. Die folgenden früheren Betriebsanweisungen sind nicht mehr autorisierend. Für den aktuellen GitGuardian-Betrieb gilt `docs/runbooks/GITGUARDIAN_APP_INTEGRATION.md`.

## Zielzustand

- GitGuardian überwacht ausschließlich `SvenKulessa/Finance`.
- Snyk importiert ausschließlich `SvenKulessa/Finance`.
- Beide Anbieter arbeiten in Stufe 1 ohne Repository-Schreibrechte.
- Keine neuen GitHub-Actions-Workflows.
- Keine Required-Check-Promotion in diesem Arbeitsschritt.

## Vorprüfung

- [x] PR #248 ist gemerged.
- [x] `main`-Baseline ist `5e8471de10644a5432017d28d2f4ff0657d92dd5`.
- [x] Keine offenen PRs zum Prüfzeitpunkt.
- [x] GitGuardian-App ist laut Owner bereits installiert.
- [x] Snyk-Token ist laut Owner bereits gesetzt; Wert wurde nicht gelesen.
- [ ] Exakte GitGuardian-App-Berechtigungen im GitHub-UI geprüft.
- [ ] Snyk-GitHub-App/Repository-Import im Snyk-UI geprüft.

## GitGuardian prüfen

1. GitHub → Settings → Applications → Installed GitHub Apps → GitGuardian.
2. Repository access auf **Only select repositories** begrenzen.
3. Ausschließlich `SvenKulessa/Finance` auswählen.
4. Read-only Zugriff beibehalten.
5. Zusätzliche GitGuardian-Write-App/Honeytoken-Schreibrechte nicht aktivieren.
6. Historischen Scan und PR-Scanning im GitGuardian-Dashboard prüfen.
7. Keine Finding-Inhalte mit Secrets in PR-Kommentare kopieren.

## Honeytoken betreiben

Ergaenzt Regel 5 oben, ersetzt sie nicht. Regel 5 betrifft die **GitHub-App-Berechtigungen**: der
GitGuardian-App werden weiterhin keine Schreib-/Honeytoken-Rechte im Repository erteilt. Das
Honeytoken selbst wird ausserhalb der Anwendung erzeugt und der Laufzeit nur lesend bekannt
gemacht. CAPITAL-AI erzeugt, rotiert oder loescht keine Honeytokens.

### Einmalige Einrichtung (Owner)

1. Im GitGuardian-Dashboard unter *Honeytokens* ein Token vom Typ **AWS** erzeugen.
   Beschreibung so waehlen, dass die Auslegestelle spaeter erkennbar ist.
2. Die drei Werte als Environment-Variablen im Render-Service hinterlegen:
   - `GITGUARDIAN_HONEYTOKEN_ID` — die GitGuardian-Honeytoken-ID (nicht geheim, dient der Zuordnung)
   - `GITGUARDIAN_HONEYTOKEN_AKID` — die Decoy Access Key ID
   - `GITGUARDIAN_HONEYTOKEN_SECRET` — das Decoy Secret
   Alle drei muessen gemeinsam gesetzt sein. Unvollstaendige oder formal ungueltige Konfiguration
   deaktiviert den Tripwire fail-closed und schreibt eine Warnung, statt mit einem Token
   weiterzulaufen, das nie ausloesen wuerde.
3. Das Token an genau einer bewusst gewaehlten Stelle auslegen. Die Auslegestelle ist eine
   Owner-Entscheidung und wird nicht im Repository fixiert; sie bestimmt, welches Leck das Token
   nachweist. Das Token darf **nicht** in dieses Repository committet werden — der Wert liegt
   ausschliesslich in der Render-Umgebung und an der gewaehlten Auslegestelle.

### Zwei Erkennungswege

| Weg | Erkennt | Meldet an |
|---|---|---|
| GitGuardian | Verwendung des Decoy-Keys gegen AWS, ausserhalb unserer Infrastruktur | GitGuardian-Dashboard/-Alert |
| Eigener Tripwire (`server/security/honeytokenTripwire.ts`) | Verwendung gegen die eigene API | `security_events.event_type = 'honeytoken_touched'` + Operational-Log |

Der zweite Weg schliesst eine Luecke, die GitGuardian bauartbedingt nicht sieht: jemand probiert das
gefundene Credential gegen unsere eigenen Endpunkte aus.

### Verhalten im Trefferfall

- Der Request wird **nicht** blockiert und **nicht** verzoegert; die Antwort ist identisch zu der
  ohne Honeytoken. Ein abweichendes Verhalten wuerde das Decoy fuer den Angreifer erkennbar machen
  und den Mechanismus entwerten.
- Protokolliert werden Honeytoken-ID, Fundstelle (Header- bzw. Query-Name) und Art des Treffers
  (Access Key ID oder Secret) — niemals das Secret-Material selbst.
- Wiederholte Treffer derselben Merkmalskombination werden innerhalb von 60 Sekunden verdichtet;
  der Zaehler der unterdrueckten Wiederholungen reist mit dem naechsten Datensatz mit. Damit kann
  eine Schleife `security_events` nicht fluten (Lehre aus Befund F-01).

### Auswertung

```sql
select created_at, endpoint, host(ip_address) as ip, reason, left(user_agent, 80) as ua
from security_events
where event_type = 'honeytoken_touched'
order by created_at desc;
```

**Ein Treffer ist immer ein Vorfall.** Es gibt keinen legitimen Pfad, auf dem dieses Credential
auftaucht. Genau deshalb wird nichts anderes in diesen Ereignistyp geschrieben: Scanner-Pfade,
fehlgeschlagene Logins und CORS-Blocks haben eigene Typen. Wuerde der Kanal mit Rauschen geteilt,
verliere er seine definierende Eigenschaft.

### Rotation

Token im GitGuardian-Dashboard neu erzeugen, die drei Render-Variablen ersetzen, Auslegestelle
aktualisieren. Kein Repository-Deploy noetig — die Werte werden zur Laufzeit gelesen.

## Snyk anbinden

1. Im Snyk-Dashboard GitHub als Source öffnen.
2. `SvenKulessa/Finance` als einziges Ziel importieren.
3. Open-Source-/Dependency-Scanning aktivieren.
4. automatische Fix-PRs, Merge-Automation und Contents-Write deaktiviert lassen.
5. vorhandenen Token nur im Snyk-/GitHub-Secret-Speicher belassen.
6. keine Workflowdatei erzeugen und keinen Tokenwert anzeigen.
7. initialen Scan starten und Projekt/Commit-SHA notieren.

## Verifikation

Für zwei unterschiedliche PR-Heads dokumentieren:

| Feld | GitGuardian | Snyk |
|---|---|---|
| Repository | `SvenKulessa/Finance` | `SvenKulessa/Finance` |
| PR | auszufüllen | auszufüllen |
| Head-SHA | auszufüllen | auszufüllen |
| Checkname | auszufüllen | auszufüllen |
| Ergebnis | auszufüllen | auszufüllen |
| Zeitpunkt UTC | auszufüllen | auszufüllen |
| Anbieter-Link | redigierter Dashboard-/Check-Link | redigierter Dashboard-/Check-Link |

Akzeptanz:

- Check gehört zum exakten PR-Head.
- Kein Secret erscheint in Log, Kommentar oder Evidence.
- Anbieterfehler beeinflusst `capital-ai-ci` in Stufe 1 nicht.
- Zwei aufeinanderfolgende PR-Heads liefern verwertbare Ergebnisse.

## Promotion

Erst nach separater Owner-Freigabe:

1. exakte stabile Checknamen ermitteln;
2. Ruleset-Baseline exportieren;
3. Rollback verifizieren;
4. Checks einzeln im Shadow-Modus beobachten;
5. Required-Check-Mutation separat durchführen und protokollieren.

## Rollback

- Repository im Anbieter deaktivieren.
- GitHub-App-Repositoryzugriff entziehen.
- späteren Required Check zuerst aus Ruleset entfernen.
- Token anbieterseitig widerrufen/rotieren, falls Kompromittierung vermutet wird.
- keine Änderung am kanonischen `capital-ai-ci`-Check.
