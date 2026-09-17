# CAPITAL-AI Runbook: GA4 Analytics MCP Server

## Document ID

RUNBOOK-0004

## Bezug

- `.mcp.json` (Server-Definition), `.claude/hooks/ga4-mcp-credentials.sh`, `.claude/settings.json`
- `.ai/skills/ESS-0014-Google-Marketing-MCP-Governance.md` (normativ)
- `docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_TOPOLOGY.md` (Ebene ④ der Topologie)
- `docs/runbooks/GOOGLE_ANALYTICS_SETUP.md` (Tag-/Consent-Seite, davon unabhängig)

## Status

Aktiv. Der Server ist im Repository konfiguriert; die Inbetriebnahme erfordert einmalige,
manuelle Schritte in der Google Cloud Console und in Google Analytics, die nur der
Repository-Owner ausführen kann (Abschnitt 2).

## Zweck

Lesender Zugriff auf echte GA4-Berichtsdaten (Besucherzahlen, Ereignisse, Realtime) direkt aus
Claude-Code-Sitzungen — statt manueller Ablesung im GA4-Dashboard.

**Abgrenzung.** Ausschließlich lesend. ESS-0014 behandelt den offiziellen Google-Analytics-MCP als
Read-/Evidence-Plane; Schreibzugriffe dürfen niemals am MCP hängen, sondern nur über die
vollständige Gate-Kette des Write-Gateways erfolgen (heute nicht implementiert).

---

## 1. Gewählte Implementierung

| | |
|---|---|
| Paket | `analytics-mcp` (PyPI), Version 0.7.0 zum Prüfstichtag |
| Herkunft | **offiziell**, GitHub-Organisation `googleanalytics` — https://github.com/googleanalytics/google-analytics-mcp |
| Laufzeit | Python ≥ 3.10, gestartet über `uvx` |
| Authentifizierung | Application Default Credentials über `GOOGLE_APPLICATION_CREDENTIALS` |
| Property-Auswahl | **pro Werkzeugaufruf**, nicht über eine Umgebungsvariable |

**Warum der offizielle Server.** ESS-0014 benennt ausdrücklich den „Official Google Analytics MCP"
als Read-Plane. Zuvor war hier ein npm-Paket `google-analytics-mcp` konfiguriert, das auf der
npm-Registry **nicht existiert** — der Server hätte nie starten können. Geprüfte Alternativen:
`ruchernchong/mcp-server-google-analytics` (npm, seit Oktober 2025 archiviert/unmaintained) und
`surendranb/google-analytics-mcp` (Python, Community). Beide sind gegenüber dem offiziellen Paket
nachrangig.

**Warum `uvx` statt `pipx`.** Die Projekt-Dokumentation von Google zeigt `pipx run analytics-mcp`.
In der hier verwendeten Claude-Code-Umgebung ist `pipx` nicht installiert, `uv`/`uvx` dagegen schon.
`uvx analytics-mcp` ist das direkte Äquivalent und wurde in dieser Umgebung erfolgreich gestartet.
Wer lokal mit `pipx` arbeitet, kann in `.mcp.json` auf `"command": "pipx", "args": ["run",
"analytics-mcp"]` wechseln — funktional identisch.

---

## 2. Einmalige Einrichtung durch den Repository-Owner

Diese Schritte erfordern Zugriff auf das Google-Cloud- und das Google-Analytics-Konto und können
nicht automatisiert werden.

### 2.1 Google Cloud

1. [console.cloud.google.com](https://console.cloud.google.com) → Projekt wählen oder anlegen.
   Die **Projekt-ID** notieren (nicht den Anzeigenamen).
2. **APIs & Services → Library** → beide APIs aktivieren:
   - **Google Analytics Data API**
   - **Google Analytics Admin API**
3. **IAM & Admin → Service Accounts → Create Service Account**, z. B. `ga4-mcp-reader`.
   **Keine** Projekt-IAM-Rolle vergeben — der Zugriff wird in Schritt 2.2 direkt auf der
   GA4-Property erteilt (Least Privilege).
4. Auf dem Service Account → **Keys → Add Key → Create new key → JSON** → Datei herunterladen.
   Diese Datei ist ein Geheimnis: **niemals committen, niemals in einen Chat einfügen.**

### 2.2 Google Analytics

5. GA4 → **Verwaltung → Property → Property-Zugriffsverwaltung** → **Nutzer hinzufügen**:
   - E-Mail: die `client_email` aus der JSON-Datei (endet auf `.iam.gserviceaccount.com`)
   - Rolle: **Betrachter / Viewer** — mehr wird nicht benötigt

### 2.3 Claude-Code-Umgebung

6. In den Umgebungs-/Secret-Einstellungen der Claude-Code-Umgebung setzen (**nicht** in `.env`,
   **nicht** in Render — das hier ist Agenten-Tooling, nicht die deployte Anwendung):

   | Variable | Wert |
   |---|---|
   | `GA4_MCP_SERVICE_ACCOUNT_KEY_JSON` | vollständiger Inhalt der JSON-Schlüsseldatei |
   | `GA4_MCP_PROJECT_ID` | Google-Cloud-Projekt-ID aus Schritt 1 |

7. **Neue** Claude-Code-Sitzung starten. Bestehende Sitzungen lesen weder `.mcp.json`-Änderungen
   noch neue Umgebungsvariablen nach.

---

## 3. Funktionsweise

```text
GA4_MCP_SERVICE_ACCOUNT_KEY_JSON  (Secret der Umgebung, String)
        │
        ▼  SessionStart-Hook (.claude/hooks/ga4-mcp-credentials.sh)
~/.capital-ai/ga4-mcp-credentials.json   (0600, Verzeichnis 0700, außerhalb des Repos)
        │
        ▼  GOOGLE_APPLICATION_CREDENTIALS (fester Pfad in .mcp.json)
uvx analytics-mcp  ──►  Google Analytics Data/Admin API  (nur lesend)
```

Der Hook existiert, weil der MCP-Server einen **Dateipfad** erwartet, das Secret aber als
**String** in der Umgebung ankommt.

Der Pfad ist in Hook und `.mcp.json` fest verdrahtet statt über eine Variable geführt: MCP-Server
werden unabhängig vom Hook gestartet, eine per Hook exportierte Variable könnte zu spät kommen.
Eine Datei an einem bekannten Ort hat dieses Timing-Problem nicht.

**Fail-closed.** Fehlt das Secret, schreibt der Hook nichts und beendet sich mit Code 0; der
MCP-Server startet, kann sich aber nicht authentifizieren und meldet einen Auth-Fehler — statt
stillschweigend leere oder falsche Zahlen zu liefern. Ist das Secret gesetzt, aber kein gültiges
JSON oder keine Google-Credentials-Struktur, bricht der Hook mit Code 1 ab und schreibt **keine**
Datei.

---

## 4. Verifikation

Nach dem Start einer neuen Sitzung:

1. **Hook gelaufen?** Erwartete Ausgabe:
   `[ga4-mcp] Anmeldedaten bereitgestellt unter …/ga4-mcp-credentials.json (0600).`
2. **Rechte korrekt?**
   ```bash
   ls -ld ~/.capital-ai && ls -l ~/.capital-ai/ga4-mcp-credentials.json
   # erwartet: drwx------ und -rw-------
   ```
3. **Server erreichbar?** Die Werkzeuge des Servers `ga4-analytics` müssen in der Sitzung
   verfügbar sein. Ein Aufruf, der die Kontenübersicht liest, muss die erwartete GA4-Property
   zurückgeben.
4. **Least Privilege belegt?** Ein Schreibversuch muss fehlschlagen — der Server bietet keine
   Schreibwerkzeuge, und die Rolle ist Viewer.

**Manueller Servertest ohne Anmeldedaten** (prüft nur, dass Paket und Laufzeit auflösbar sind):
```bash
uvx analytics-mcp --help
# erwartet u. a.: "Starting MCP Stdio Server: Google Analytics MCP Server"
```

---

## 5. Sicherheitshinweise

- Die Schlüsseldatei liegt unter `~/.capital-ai/` — **außerhalb** des Arbeitsbaums. Sie kann daher
  nicht versehentlich committed werden und taucht in `git status` nicht auf.
- Der Hook gibt zu keinem Zeitpunkt Schlüsselinhalte aus; Fehlermeldungen enthalten ausschließlich
  Metadaten (Fehlertyp, fehlendes Feld).
- Der Service Account erhält **keine** Projekt-IAM-Rolle, sondern ausschließlich Viewer-Rechte auf
  der einzelnen GA4-Property.
- Schlüsselrotation: neuen Key erzeugen, `GA4_MCP_SERVICE_ACCOUNT_KEY_JSON` ersetzen, alten Key in
  der Cloud Console löschen, neue Sitzung starten. Die alte Datei wird beim nächsten Hook-Lauf
  überschrieben.

---

## 6. Fehlerdiagnose

| Symptom | Ursache | Abhilfe |
|---|---|---|
| Hook meldet „nicht gesetzt" | `GA4_MCP_SERVICE_ACCOUNT_KEY_JSON` fehlt in der Umgebung | Schritt 2.3, danach **neue** Sitzung |
| Hook bricht mit „kein gueltiges JSON" ab | Secret abgeschnitten oder mit Zeilenumbrüchen zerstört | Dateiinhalt vollständig und unverändert einfügen |
| Server startet, jede Abfrage liefert 403 | Service Account nicht auf der Property berechtigt | Schritt 2.2 |
| Server startet, Abfragen melden fehlende API | Data- oder Admin-API nicht aktiviert | Schritt 2.1 |
| `uvx: command not found` | `uv` fehlt in der Umgebung | `uv` installieren oder in `.mcp.json` auf `pipx run` wechseln |
| Werkzeuge fehlen trotz korrektem Setup | Sitzung liest `.mcp.json` nicht nach | neue Sitzung starten |
