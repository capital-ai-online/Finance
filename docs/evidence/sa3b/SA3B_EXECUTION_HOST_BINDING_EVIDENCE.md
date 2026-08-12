# SA3B Execution Host Binding Evidence

Status: **TECHNICAL VERIFIED PASS / LIFECYCLE CLEANUP PENDING**
Date: 2026-08-12
Current verified production baseline: `main@91963f59b74c8c3c3c0b33c6a23237a01ac0128e`
Authority: ADR-0059, ADR-0065, ADR-0067, ESS-0021

## Merged implementation

### SA3A

PR #218:

- final head `4178f76c1c33b50b957cd073d83ed9eeb0493642`;
- merge `8de5a538ae9d2f0afc7b2e505ddda427ceb77780`;
- CI #926 PASS;
- Governance #647 PASS;
- branch deleted.

### SA3B host

PR #220:

- final head `c4c7d00b33e521dfd12b14ddfdc097288a80f385`;
- merge `156142102e7d2a97ad466aee0340f758fa4365e5`;
- CI #936 PASS;
- Governance #653 PASS;
- branch deleted.

### M5 writer/schema corrective

PR #222:

- final head `1bb6fa3a3bb30d1671d14ba012462070ccd7293d`;
- merge `91963f59b74c8c3c3c0b33c6a23237a01ac0128e`;
- final CI #951 PASS;
- Governance #656 PASS;
- corrective branch deleted.

Render deploy `dep-d9u1v5942hec739bsc6g` reached `live` on the same #222 merge SHA.

## Secret-file runtime verification

The server contract loads `/etc/secrets/finance-secrets.env` before privileged database construction. The file contract includes both:

- `SUPABASE_SECRET_KEY`;
- `SUPABASE_SERVICE_ROLE_KEY`.

`server/db.ts` resolves privileged Supabase credentials in this order:

`SUPABASE_SECRET_KEY → SUPABASE_SERVICE_ROLE_KEY`

No credential value is stored in this evidence.

The functionality of the Owner-managed Render secret file was verified through the real SA3B execution path, not by reading or displaying the secret value.

## Earlier fail-closed probe

Issue #221 / workflow run `31570833507` proved:

`DURABLE AUDIT FAILURE → NO PERMIT → NO BRANCH`

The broker returned 503 when Supabase rejected the prior privileged credential. The requested branch `agent/sa3b-host-probe-20260812a` was never created.

This remains valid negative evidence.

## Positive live probe after PR #222 + secret repair

Owner Issue #223 triggered the trusted SA3B host on exact:

`main@91963f59b74c8c3c3c0b33c6a23237a01ac0128e`

Request:

- mode `BRANCH_PROBE`;
- mandate `REM-SA3B-PROBE-001`;
- roadmap item `SA3B-HOST-PROBE`;
- branch `agent/sa3b-host-probe-20260812b`.

Workflow run `31574111075`:

| Step | Result |
|---|---|
| Owner/title ingress | PASS |
| strict Issue JSON validation | PASS |
| exact current-main + REM binding | PASS |
| GitHub Actions OIDC | PASS |
| broker authorization | PASS |
| durable M5 authorization insert | PASS |
| audit-bound BRANCH permit | PASS |
| branch creation | PASS |
| durable M5 terminal outcome | PASS |
| Issue evidence correlation | PASS |

Authorization reference:

`supabase:agent_audit_events:194f1198-492c-4d4f-b1e4-0c13a5d99d20`

Outcome reference:

`supabase:agent_audit_events:5ab9eefe-f472-4396-a7e7-2a3ceb029e34`

The created branch was independently verified to point exactly to:

`91963f59b74c8c3c3c0b33c6a23237a01ac0128e`

## Direct Supabase correlation

Read-only verification of `public.agent_audit_events` confirmed both referenced rows.

Shared correlation:

- request ID `issue-223-run-31574111075`;
- trace ID `github-actions:31574111075`;
- agent `capital-ai-systemadmin-roadmap-executor`;
- app `chatgpt-github-connector`;
- capability `BRANCH`;
- risk `MEDIUM`;
- exact Finance repository and probe branch;
- workflow run `31574111075`.

Authorization row:

- decision `ALLOW`;
- result `PENDING`;
- exact current-main SHA;
- workload identity / workflow metadata retained in sanitized attributes.

Outcome row:

- decision `ALLOW`;
- result `SUCCESS`;
- `authorizationAuditReference` points to the authorization row;
- `requiresHumanMerge=true` remains preserved.

This is the positive proof that the Render secret-file credential, corrected M5 writer and append-only audit path function together in production.

## Separate stale-base negative probe

Owner Issue #224 requested stale base:

`156142102e7d2a97ad466aee0340f758fa4365e5`

Requested branch:

`agent/sa3b-host-probe-negative-20260812c`

Workflow run `31574221718`:

- strict request validation: PASS;
- current-main/REM binding: **DENY as expected**;
- OIDC: SKIPPED;
- broker authorization: SKIPPED;
- audit side effect: SKIPPED;
- branch creation: SKIPPED;
- outcome: SKIPPED.

Independent branch lookup returned 404 for the requested negative branch.

Therefore:

`STALE BASE → ZERO OIDC/BROKER/REPOSITORY SIDE EFFECT`

## Proven SA3B security invariants

1. repository side effect occurs only after durable authorization evidence;
2. invalid/stale base fails before side effect;
3. audit persistence outage fails closed;
4. OIDC identity is bound to Owner, repository, main and exact workflow;
5. outcome is bound to the same issue/run/request and prior authorization;
6. no direct ChatGPT→GitHub connector mutation counts as autonomous Systemadmin execution;
7. `MERGE`, deployment and production mutation are not part of SA3B authority.

## Remaining lifecycle cleanup

The successful positive probe branch:

`agent/sa3b-host-probe-20260812b`

still exists after evidence capture and must be deleted before SA3B may be recorded as full lifecycle `COMPLETE / VERIFIED PASS` and before the SA4 pilot is allowed to execute.

The connected GitHub tool surface used during this session exposes branch creation/update but no reference-delete mutation, so this cleanup cannot be truthfully recorded as completed by the agent.

SA4 therefore includes an independent activation check that refuses execution while this exact branch exists.

## Conclusion

**SA3B technical enforcement is VERIFIED PASS.** The Render Supabase privileged secret path is functional, positive Authorization → Branch → Outcome correlation is proven in the production audit store, and independent fail-closed behavior is proven.

**Lifecycle completion remains pending only on deletion of `agent/sa3b-host-probe-20260812b`.**