# Systemadmin Execution Host Runbook — SA3B

Status: IMPLEMENTED / PR+CI+POST-MERGE PROBE PENDING
Date: 2026-08-12
Authority: ESS-0021, ADR-0065, ADR-0059, ADR-0067

## Purpose

This runbook governs the first technically enforceable execution host for the CAPITAL-AI Systemadmin Roadmap Executor.

The host is **not** a general-purpose GitHub automation endpoint. Before SA4 it is limited to one security verification operation: creation of an empty probe branch after durable authorization evidence.

## Trusted path

`Owner execution issue → trusted main workflow → strict request parser → GitHub Actions OIDC → CAPITAL-AI broker → SA1/SA2/SA3A → M5 authorization evidence → BRANCH side effect → M5 outcome evidence`

A direct ChatGPT GitHub connector write is not part of this autonomous path and must not be counted as SA3B evidence.

## Execution request format

Issue title must start with:

`[SA3B-PROBE]`

Issue author must be exactly:

`SvenKulessa`

Issue body must be JSON only:

```json
{
  "version": "1.0",
  "mode": "BRANCH_PROBE",
  "mandateId": "REM-SA3B-PROBE-001",
  "roadmapItem": "SA3B-HOST-PROBE",
  "baseSha": "<exact current main 40-char lowercase SHA>",
  "branchName": "agent/sa3b-host-probe-<unique-suffix>"
}
```

No additional fields are accepted.

## Trust sources

The workflow checks out `main` with `persist-credentials: false` and loads:

- `scripts/systemadmin/validateExecutionIssue.mjs`;
- `.ai/mandates/REM-SA3B-PROBE-001.json`;
- trusted host workflow code.

The Issue never supplies an executable REM, shell command, file content, workflow definition or credential.

## GitHub Actions permissions

Initial probe workflow permissions:

- `contents: write` — required only to create/delete the probe branch;
- `issues: write` — required only to post evidence reference;
- `id-token: write` — required only to mint GitHub OIDC workload identity.

Not granted:

- `pull-requests: write`;
- deployment write authority;
- workflow write authority;
- package write authority.

## OIDC broker authentication

The workflow requests a token for audience:

`capital-ai-systemadmin-execution`

The broker verifies JWT signature with GitHub OIDC JWKS and requires the exact claims from ADR-0067, including Finance repository/IDs, Owner actor, `issues` event, `refs/heads/main` and the exact SA3B workflow reference.

Invalid, expired, incorrectly signed or incorrectly scoped tokens receive no authorization permit.

## Broker endpoints

### Authorization

`POST /api/internal/systemadmin-execution/authorize`

Required before every host side effect.

The broker binds:

- Issue number;
- workflow run ID;
- Owner/agent/client request identity;
- exact REM;
- roadmap item;
- capability `BRANCH`;
- target Finance;
- exact base/head SHA;
- branch name;
- GitHub OIDC host identity.

The workflow must require:

- policy verdict `ALLOW`;
- syntactically valid `supabase:agent_audit_events:<id>` authorization reference;
- `auditBoundExecutionPermitted=true`;
- capability `BRANCH`;
- branch/base SHA equal to the request.

Only after these checks may `gh api .../git/refs` run.

### Outcome

`POST /api/internal/systemadmin-execution/outcome`

The same exact OIDC workflow/run binding is required. `SUCCESS` or `ERROR` becomes a second append-only M5 event.

If branch creation succeeds but terminal outcome persistence fails, the workflow immediately deletes the probe branch and fails.

## Probe sequence after SA3B PR merge

1. Verify final SA3B PR CI/workflow-security PASS.
2. Human merge.
3. Delete the SA3B implementation branch.
4. Verify `main` has deployed and broker endpoint exists.
5. Resolve exact current `main` SHA.
6. Create one Owner issue using the exact JSON contract.
7. Observe host workflow.
8. Verify authorization audit reference was produced before branch creation.
9. Verify probe branch points exactly to the requested current `main` SHA.
10. Verify terminal SUCCESS outcome reference.
11. Run a negative probe with an invalid/stale permit/request and prove no branch appears.
12. Delete the successful probe branch after evidence capture.
13. Close/archive probe issues and synchronize evidence/Roadmap.

## Stop conditions

Immediate DENY/STOP when:

- issue author/title/body contract is wrong;
- base SHA is stale;
- probe REM is absent/revoked/expired;
- OIDC validation fails;
- actor/request/workflow/run binding mismatches;
- SA1/SA2/SA3 policy denies;
- durable audit persistence fails;
- returned permit/audit reference is invalid;
- branch/head binding mismatches;
- any non-BRANCH capability is requested;
- outcome evidence cannot be persisted.

## Security boundary

Before SA4 the host cannot create commits, open PRs, request CI, deploy or merge. It cannot accept arbitrary shell commands or file payloads.

The one-time branch probe is a security-control acceptance test, not a product mutation and not the SA4 autonomous roadmap pilot.

## SA4 handoff

Only after SA3B `VERIFIED PASS` may a later PR extend the host to a bounded Owner-approved SA4 REM with repository `COMMIT`/`PR` actions.

Before that extension, SA3B trust-root paths must also be incorporated into the broader SA1 self-authority list, not only the SA3 audit-layer protection.
