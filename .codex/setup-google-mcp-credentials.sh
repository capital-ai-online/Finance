#!/usr/bin/env bash
# CAPITAL-AI — OpenAI Codex Cloud setup-only Google MCP credential materialization.
#
# Expected Codex Cloud Secrets:
#   GSC_MCP_SERVICE_ACCOUNT_KEY_JSON
#   GA4_MCP_SERVICE_ACCOUNT_KEY_JSON   (optional unless GA4 read is required)
#
# Codex Cloud exposes Secrets only during the setup phase. This script validates each
# configured service-account JSON and writes it outside the repository with restrictive
# permissions. The MCP processes later receive only the resulting file path.
set -euo pipefail

CRED_DIR="${HOME}/.capital-ai"
mkdir -p "${CRED_DIR}"
chmod 700 "${CRED_DIR}"

validate_service_account_json() {
  python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
except Exception as exc:
    print(f"invalid JSON: {type(exc).__name__}", file=sys.stderr)
    sys.exit(1)
required = ("type", "project_id", "client_email", "private_key")
if not isinstance(data, dict) or data.get("type") != "service_account" or any(not data.get(k) for k in required):
    print("not a complete Google service-account JSON", file=sys.stderr)
    sys.exit(1)
'
}

materialize_secret() {
  local label="$1"
  local secret_name="$2"
  local target="$3"
  local secret_value="${!secret_name:-}"

  if [ -z "${secret_value}" ]; then
    rm -f "${target}"
    echo "[codex-google-mcp] ${label}: ${secret_name} not configured; stale credential removed."
    return 0
  fi

  if ! printf '%s' "${secret_value}" | validate_service_account_json; then
    rm -f "${target}"
    echo "[codex-google-mcp] ${label}: credential rejected; target removed." >&2
    return 1
  fi

  umask 077
  local tmp
  tmp="$(mktemp "${CRED_DIR}/.${label}.XXXXXX")"
  chmod 600 "${tmp}"
  printf '%s' "${secret_value}" > "${tmp}"
  mv -f "${tmp}" "${target}"
  chmod 600 "${target}"
  echo "[codex-google-mcp] ${label}: credential materialized with mode 0600."
}

materialize_secret \
  "gsc" \
  "GSC_MCP_SERVICE_ACCOUNT_KEY_JSON" \
  "${CRED_DIR}/gsc-mcp-credentials.json"

materialize_secret \
  "ga4" \
  "GA4_MCP_SERVICE_ACCOUNT_KEY_JSON" \
  "${CRED_DIR}/ga4-mcp-credentials.json"

# Do not print, persist, or export the raw secret values. Codex removes setup-only Secrets
# before the agent phase; the credential files above are the only intended handoff.
unset GSC_MCP_SERVICE_ACCOUNT_KEY_JSON || true
unset GA4_MCP_SERVICE_ACCOUNT_KEY_JSON || true
