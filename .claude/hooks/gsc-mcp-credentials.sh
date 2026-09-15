#!/bin/bash
# CAPITAL-AI — Search Console MCP Credential Materialisierung (SessionStart)
#
# Der GSC-MCP nutzt Google Application Default Credentials. Fuer die repositoryseitige
# Claude-Code-Hostintegration wird ein eigener, von GA4 getrennter Service-Account-Pfad
# verwendet, damit Search Console nicht stillschweigend den GA4-Principal erbt.
#
# Das Secret wird ausschliesslich aus GSC_MCP_SERVICE_ACCOUNT_KEY_JSON gelesen und in eine
# lokale Datei ausserhalb des Repositories geschrieben. Die .mcp.json bindet nur diesen Pfad
# an den search-console MCP-Prozess. Es erfolgt bewusst kein globaler Session-Environment-Export.
#
# Fail-closed: fehlt oder ist das Secret ungueltig, wird eine eventuell vorhandene lokale
# GSC-Credential-Datei entfernt, damit keine veralteten Credentials weiterverwendet werden.
set -euo pipefail

CRED_DIR="${HOME}/.capital-ai"
CRED_FILE="${CRED_DIR}/gsc-mcp-credentials.json"

if [ -z "${GSC_MCP_SERVICE_ACCOUNT_KEY_JSON:-}" ]; then
  rm -f "${CRED_FILE}"
  echo "[gsc-mcp] GSC_MCP_SERVICE_ACCOUNT_KEY_JSON nicht gesetzt - Search-Console-MCP bleibt unauthentifiziert."
  exit 0
fi

if ! printf '%s' "${GSC_MCP_SERVICE_ACCOUNT_KEY_JSON}" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception as exc:
    print(f"[gsc-mcp] Secret ist kein gueltiges JSON: {type(exc).__name__}", file=sys.stderr)
    sys.exit(1)
required = ("type", "project_id", "client_email", "private_key")
if not isinstance(data, dict) or data.get("type") != "service_account" or any(not data.get(k) for k in required):
    print("[gsc-mcp] Secret ist keine vollstaendige Google-Service-Account-Struktur.", file=sys.stderr)
    sys.exit(1)
'; then
  rm -f "${CRED_FILE}"
  echo "[gsc-mcp] Anmeldedaten wurden NICHT geschrieben." >&2
  exit 1
fi

mkdir -p "${CRED_DIR}"
chmod 700 "${CRED_DIR}"
umask 077
: > "${CRED_FILE}"
chmod 600 "${CRED_FILE}"
printf '%s' "${GSC_MCP_SERVICE_ACCOUNT_KEY_JSON}" > "${CRED_FILE}"

echo "[gsc-mcp] Anmeldedaten fuer den isolierten Search-Console-MCP-Pfad bereitgestellt (0600)."
