#!/bin/bash
# CAPITAL-AI — GA4 MCP Credential Materialisierung (SessionStart)
#
# Der offizielle Google-Analytics-MCP (`analytics-mcp`, siehe .mcp.json) authentifiziert sich
# ueber Application Default Credentials und erwartet in GOOGLE_APPLICATION_CREDENTIALS einen
# PFAD zu einer JSON-Datei. Ein Secret kommt in der Claude-Code-Umgebung aber als String-
# Umgebungsvariable an, nicht als Datei. Dieser Hook schliesst genau diese Luecke: er schreibt
# den Inhalt von GA4_MCP_SERVICE_ACCOUNT_KEY_JSON einmal pro Session an einen festen Pfad.
#
# Der Pfad ist bewusst fest verdrahtet (identisch in .mcp.json) statt ueber eine Variable
# gefuehrt: MCP-Server werden unabhaengig vom Hook gestartet, eine per Hook exportierte
# Variable koennte zu spaet kommen. Eine Datei an einem bekannten Ort hat dieses Timing-Problem
# nicht.
#
# Fail-closed: fehlt das Secret, passiert nichts. Der MCP-Server startet dann zwar, kann sich
# aber nicht authentifizieren und liefert einen Auth-Fehler statt stillschweigend falscher Daten.
#
# Setup-Anleitung: docs/runbooks/GA4_MCP_SERVER_SETUP.md
set -euo pipefail

CRED_DIR="${HOME}/.capital-ai"
CRED_FILE="${CRED_DIR}/ga4-mcp-credentials.json"

if [ -z "${GA4_MCP_SERVICE_ACCOUNT_KEY_JSON:-}" ]; then
  echo "[ga4-mcp] GA4_MCP_SERVICE_ACCOUNT_KEY_JSON nicht gesetzt - GA4-MCP bleibt unauthentifiziert (siehe docs/runbooks/GA4_MCP_SERVER_SETUP.md)."
  exit 0
fi

# Vor dem Schreiben validieren. Ein kaputtes Secret soll hier auffallen und nicht erst als
# unverstaendlicher Fehler im MCP-Server. Die Ausgabe enthaelt bewusst nur Metadaten, nie Inhalt.
if ! printf '%s' "${GA4_MCP_SERVICE_ACCOUNT_KEY_JSON}" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception as exc:
    print(f"[ga4-mcp] Secret ist kein gueltiges JSON: {type(exc).__name__}", file=sys.stderr)
    sys.exit(1)
if not isinstance(data, dict) or "type" not in data:
    print("[ga4-mcp] Secret ist gueltiges JSON, aber keine Google-Credentials-Struktur (Feld \"type\" fehlt).", file=sys.stderr)
    sys.exit(1)
'; then
  echo "[ga4-mcp] Anmeldedaten wurden NICHT geschrieben." >&2
  exit 1
fi

mkdir -p "${CRED_DIR}"
chmod 700 "${CRED_DIR}"

# Erst mit restriktiven Rechten anlegen, dann befuellen - sonst existiert die Datei kurzzeitig
# mit den Standardrechten der umask, waehrend bereits Inhalt darin steht.
umask 077
: > "${CRED_FILE}"
chmod 600 "${CRED_FILE}"
printf '%s' "${GA4_MCP_SERVICE_ACCOUNT_KEY_JSON}" > "${CRED_FILE}"

echo "[ga4-mcp] Anmeldedaten bereitgestellt unter ${CRED_FILE} (0600)."

# Zusaetzlich fuer die Session exportieren. Redundant zum festen Pfad in .mcp.json, hilft aber
# Werkzeugen wie gcloud oder eigenen Skripten, die dieselben Credentials nutzen wollen.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  echo "export GOOGLE_APPLICATION_CREDENTIALS=\"${CRED_FILE}\"" >> "${CLAUDE_ENV_FILE}"
fi
