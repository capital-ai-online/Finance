# CAPITAL-AI-QM Evidence

This directory documents repository-resident QM evidence conventions. Generated CI reports, traces and large runtime artifacts remain in their authoritative stores and are referenced by immutable identifiers/links where possible.

## Rules
- Evidence is append-only.
- Bind repository observations to an exact Git commit.
- Record environment and timestamp.
- Preserve the authoritative source artifact.
- Use only `PASS`, `FAIL`, `NOT_AVAILABLE` for evaluated evidence results.
- Never infer PASS from the existence of a file, workflow or test definition.
- Redact credentials, session tokens and unnecessary personal/sensitive data.
- Link every evidence record to a `QM-*` work item.

Suggested filename for small committed evidence notes: `YYYY-MM-DD_<QM-ID>_<evidence-id>.md`.