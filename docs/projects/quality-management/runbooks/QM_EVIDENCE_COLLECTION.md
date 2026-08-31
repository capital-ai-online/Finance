# Runbook — QM Evidence Collection

## Minimum record
- Evidence ID
- Observed commit
- Observed environment
- Timestamp
- Executor
- Contract / Validator
- Result
- Source artifact
- Status
- Known limitations
- Related QM work item

## Rules
1. No evidence without a traceable source.
2. Bind execution evidence to the exact commit whenever repository state is relevant.
3. Use `NOT_AVAILABLE` for missing or non-reproducible artifacts.
4. Never synthesize `PASS` from source-file existence.
5. Reference authoritative CI/artifact storage instead of copying large generated data into Git.
6. Do not include secrets, credentials, private tokens or unnecessary personal data.
7. Evidence history is append-only; corrections add a superseding observation rather than silently rewriting history.