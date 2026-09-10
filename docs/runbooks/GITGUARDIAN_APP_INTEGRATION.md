# GitGuardian-App-Integration — Owner-Runbook

Status: ACTIVE / OWNER-MANAGED EXTERNAL SERVICE  
Datum: 2026-09-10  
ADR: `ADR-0070`  
Repository: `capital-ai-online/Finance`

## Zielzustand

- GitGuardian überwacht ausschließlich `capital-ai-online/Finance`.
- Die GitGuardian-GitHub-App arbeitet mit minimal erforderlichem read-only Zugriff.
- `GitGuardian Security Checks` bleibt der externe Secret-Scanning-Check; es wird kein zusätzlicher GitGuardian-Scanner-Workflow unter `.github/workflows/**` angelegt.
- Kein GitGuardian-API-Key, Honeytoken-Secret oder anderer Secret-Wert wird in Source, Dokumentation, PR-Body, Logs oder Evidence geschrieben.
- Honeytokens werden außerhalb der Anwendung erzeugt und der Finance-Laufzeit ausschließlich lesend über Render-Environment-Variablen bereitgestellt.

## GitGuardian prüfen

1. GitHub → Settings → Applications → Installed GitHub Apps → GitGuardian.
2. Repository access auf **Only select repositories** begrenzen und ausschließlich `capital-ai-online/Finance` auswählen.
3. Read-only Zugriff beibehalten; keine zusätzliche GitGuardian-Write-App aktivieren.
4. Im GitGuardian-Dashboard Repository Monitoring, Real-time Detection und Automatic Historical Scan aktivieren.
5. GitHub Check Runs aktivieren; Secret-Funde sollen den Check mit `Failed` abschließen.
6. `Skip merge commits in pull request check runs` aktivieren, Bypass-/Skip-Actions deaktivieren und Public Sharing deaktiviert lassen.
7. Keine Finding-Inhalte mit Secret-Material in PR-Kommentare, Logs oder Evidence kopieren.

## API-Zugang

Ein GitGuardian-PAT ist ein externes Management-Credential und gehört nicht in das Finance-Repository. Die produktive Finance-Anwendung benötigt diesen Management-Key nicht. Falls API-/MCP-Automation eingesetzt wird, liegt der Key ausschließlich im Secret Store des ausführenden Management-Hosts und wird mit Least Privilege betrieben.

## Honeytoken betreiben

### Kanonischer Honeytoken

- Typ: **AWS**
- Name: `capital-ai-finance-prod-tripwire-01`
- Zweck: Render-Production-Decoy für Credential-Exposure-/Intrusion-Erkennung; es gibt keine legitime Verwendung.

### Render-Konfiguration

Die drei Werte werden ausschließlich im Render-Service `Finance` hinterlegt:

- `GITGUARDIAN_HONEYTOKEN_ID` — GitGuardian-Honeytoken-ID zur Zuordnung;
- `GITGUARDIAN_HONEYTOKEN_AKID` — Decoy Access Key ID;
- `GITGUARDIAN_HONEYTOKEN_SECRET` — Decoy Secret.

Alle drei Werte müssen gemeinsam gesetzt sein. Unvollständige oder formal ungültige Konfiguration deaktiviert den Tripwire fail-closed und erzeugt eine Warnung. Das Token darf nicht in das Repository committet werden.

### Zwei Erkennungswege

| Weg | Erkennt | Meldet an |
|---|---|---|
| GitGuardian | Verwendung des Decoy-Keys gegen AWS außerhalb unserer Infrastruktur | GitGuardian-Dashboard/-Alert |
| Eigener Tripwire (`server/security/honeytokenTripwire.ts`) | Verwendung gegen die eigene API | `security_events.event_type = 'honeytoken_touched'` + Operational-Log |

Der eigene Tripwire blockiert oder verzögert den Request absichtlich nicht. Protokolliert werden nur Honeytoken-ID, Fundstelle und Treffertyp; Secret-Material wird niemals gespeichert oder ausgegeben.

### Trefferfall

Ein Honeytoken-Treffer ist immer ein Security Incident. Es existiert kein legitimer Anwendungspfad für dieses Credential. Wiederholte Treffer werden durch den bestehenden Tripwire verdichtet, damit der Security-Event-Kanal nicht geflutet wird.

### Rotation

Neuen Honeytoken in GitGuardian erzeugen, die drei Render-Variablen gemeinsam ersetzen und die bewusst gewählte Auslegestelle aktualisieren. Die Anwendung erzeugt, rotiert oder löscht keine Honeytokens.

## Verifikation

Für einen aktuellen PR-Head prüfen:

- Repository = `capital-ai-online/Finance`;
- Checkname = `GitGuardian Security Checks`;
- Check gehört zum exakten PR-Head-SHA;
- Ergebnis = `success`, sofern kein Secret erkannt wurde;
- kein Secret erscheint in Logs, Kommentaren oder Evidence.

Honeytoken-Verifikation erfolgt separat und ohne Ausgabe des Decoy-Secrets im Chat oder Repository.

## Sicherheitsinvarianten

1. Least privilege und Repository-Scoping.
2. Keine Secret-Ausgabe oder Token-Inventarisierung im Repository.
3. Keine automatische Remediation mit Repository-Schreibrechten.
4. Kein zusätzlicher GitGuardian-GitHub-Actions-Workflow, solange die externe GitGuardian-App den kanonischen Check liefert.
5. Merge bleibt Human/CODEOWNER-only.
6. Externe GitGuardian-Konfigurations- oder Berechtigungsänderungen bleiben separate Owner-Mutationen.
