# CAPITAL-AI Runbook: GA4 Analytics MCP Server

## Document ID

RUNBOOK-0004

## Bezug

- `.codex/config.toml` — aktiver OpenAI-Codex-MCP-Hostadapter
- `.codex/setup-google-mcp-credentials.sh` — Codex-Cloud-Setup-only Credential-Materialisierung
- `.mcp.json` — bestehende Security-validierte Executable-Identity-Manifestoberfläche; nicht der aktive Codex-Hostadapter
- `.ai/skills/ESS-0014-Google-Marketing-MCP-Governance.md` — normative hostneutrale Architektur
- `docs/architecture/CAPITAL_AI_GOOGLE_MARKETING_MCP_TOPOLOGY.md` — Ebene ④ der Topologie
- `docs/runbooks/GOOGLE_ANALYTICS_SETUP.md` — Tag-/Consent-Seite, davon unabhängig

## Status

Aktiv als OpenAI-Codex-Cloud-Read-Pfad. Die frühere Claude-Code-SessionStart-Integration ist nicht mehr die aktive Execution-Host-Mechanik. Provider-/Credential-/Property-Zugriff bleibt bis zu einem echten Google-Read evidence-basiert offen.

## Zweck

Lesender Zugriff auf echte GA4-Berichtsdaten über den offiziellen `analytics-mcp`, ohne Google-Credentials im Repository oder in der Agentenphase als Secret-Environment-Variable vorzuhalten.

**Abgrenzung:** Ausschließlich lesend. ESS-0014 behandelt den Google-Analytics-MCP als Read-/Evidence-Plane; Schreibzugriffe bleiben außerhalb dieses MCP-Pfads.

---

## 1. Gewählte Implementierung

| | |
|---|---|
| Execution Host | OpenAI Codex Cloud |
| Project-Konfiguration | `.codex/config.toml` |
| Paket | `analytics-mcp==0.7.0` |
| Laufzeit | `uvx` |
| Authentifizierung | Application Default Credentials über eine materialisierte JSON-Datei |
| Credential-Datei | `~/.capital-ai/ga4-mcp-credentials.json` (`0600`) |
| Secret | `GA4_MCP_SERVICE_ACCOUNT_KEY_JSON`, nur während Codex-Cloud-Setup |

Codex Cloud stellt Secrets nur während des Setup-Skripts bereit und entfernt sie vor der Agentenphase. Das Repository-Setupskript nutzt genau dieses Sicherheitsmodell: Secret validieren, außerhalb des Arbeitsbaums mit restriktiven Rechten materialisieren, Roh-Secret nicht ausgeben oder weiterexportieren.

---

## 2. Einmalige Einrichtung durch den Repository-Owner

### 2.1 Google Cloud

1. Google-Cloud-Projekt wählen oder anlegen und Projekt-ID notieren.
2. **Google Analytics Data API** und **Google Analytics Admin API** aktivieren.
3. Dedizierten Service Account anlegen, z. B. `ga4-mcp-reader`.
4. Keine unnötige Projekt-IAM-Rolle vergeben.
5. JSON-Key nur für diesen Machine Principal erzeugen und sicher speichern; niemals committen oder in Chats einfügen.

### 2.2 Google Analytics

6. GA4 → **Verwaltung → Property → Property-Zugriffsverwaltung → Nutzer hinzufügen**.
7. `client_email` des Service Accounts mit Rolle **Betrachter / Viewer** hinzufügen.

### 2.3 OpenAI Codex Cloud

8. ChatGPT/Codex → **Codex-Einstellungen → Umgebungen** → die Umgebung für `capital-ai-online/Finance` öffnen oder anlegen.
9. Unter **Secrets** setzen:

   | Secret | Wert |
   |---|---|
   | `GA4_MCP_SERVICE_ACCOUNT_KEY_JSON` | vollständiger unveränderter Inhalt der Google-Service-Account-JSON-Datei |

10. Unter **Umgebungsvariablen** setzen, sofern vom GA4-MCP benötigt:

   | Variable | Wert |
   |---|---|
   | `GA4_MCP_PROJECT_ID` | Google-Cloud-Projekt-ID |

11. Als **Setup-Skript** konfigurieren:

```bash
bash .codex/setup-google-mcp-credentials.sh
```

12. Agenten-Internetzugang auf die für den Read-Pfad erforderlichen Google-Endpunkte begrenzen. Keine pauschale Netzwerkfreigabe nur für diesen MCP-Pfad erteilen.
13. Neue Codex-Cloud-Session für das Repository starten. Änderungen an Secrets oder Setup-Skript invalidieren den Environment-Cache gemäß Codex-Cloud-Verhalten.

---

## 3. Funktionsweise

```text
Codex Cloud Secret (nur Setup-Phase)
GA4_MCP_SERVICE_ACCOUNT_KEY_JSON
        │
        ▼
.codex/setup-google-mcp-credentials.sh
        │  validiert Service-Account-JSON
        ▼
~/.capital-ai/ga4-mcp-credentials.json
        │  mode 0600; außerhalb Repository
        ▼
.codex/config.toml
        │  setzt GOOGLE_APPLICATION_CREDENTIALS nur für ga4-analytics
        ▼
uvx --from analytics-mcp==0.7.0 analytics-mcp
        │
        ▼
Google Analytics Read APIs
```

Das GSC-Credential nutzt einen separaten Pfad. GA4 und Search Console erben nicht stillschweigend denselben Principal.

**Fail-closed:** Fehlt oder scheitert die Validierung eines konfigurierten Secrets, wird kein gültiger Credential-Handoff behauptet. Ein echter Google-Read ist die Provider-Evidence; Konfiguration oder MCP-Liveness allein sind kein Provider-PASS.

---

## 4. Verifikation

Nach dem Start einer neuen Codex-Cloud-Session:

1. Setup-Ausgabe enthält nur den Materialisierungsstatus, niemals Schlüsselinhalte.
2. Credential-Datei besitzt `0600`, Verzeichnis `~/.capital-ai` `0700`.
3. `ga4-analytics` ist als MCP-Server in Codex verfügbar.
4. Ein echter Read liefert die erwartete Property oder einen expliziten Google-Auth-/Providerfehler.
5. `NOT RUN` oder MCP-Liveness wird nicht als erfolgreicher Google-Read klassifiziert.

---

## 5. Sicherheit / Rotation

- JSON niemals in Repository, Issue, PR, Log oder Chat einfügen.
- Das JSON gehört in **Codex-Einstellungen → Umgebung → Secrets**, nicht in GitHub Secrets für diesen Cloud-Hostpfad.
- Bei Rotation neuen Google-Key erstellen, Codex-Secret ersetzen und alten Key bei Google widerrufen/löschen.
- Danach neue Codex-Cloud-Session starten bzw. Environment-Cache invalidieren lassen.
- Machine Identity und Human-Owner-Rechte bleiben getrennt; keine Owner-/Editor-Eskalation für den Service Account.
