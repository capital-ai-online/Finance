# AI Agent Redaction Policy

Actions: ALLOW, HASH, MASK, DROP, SECURE-EVIDENCE-ONLY.

DROP by default: API keys, passwords, OAuth/OIDC tokens, Supabase secret/service keys, Stripe secrets, Render deploy hook URLs, SMTP credentials.
MASK/HASH: user identifiers, emails and correlation-sensitive values when full value is unnecessary.
SECURE-EVIDENCE-ONLY: approved forensic payloads under restricted retention/access.
Prompts, tool inputs/outputs and Git diffs are not logged in full by default.

Redaction happens before telemetry export and before model-visible diagnostic summaries.