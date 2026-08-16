# M8 — Provider-neutral Agent Cutover Runbook

Status: IN PROGRESS — Phase 0 complete; Exit Gate items 1, 3, 4, 5, 6, 7 VERIFIED PASS;
item 2 **PENDING OWNER SCOPE DECISION** (chatgpt-github-connector now READY including
`externalHostConfigurationVerified`; claude-code-cli structurally BLOCKED; google-ai-studio +
notebooklm NOT_APPLICABLE); item 8 IN PROGRESS (this PR); item 9 N/A for M8-scope branches.
Evidence: `docs/evidence/m8/M8_EXTERNAL_HOST_CONFIGURATION_VERIFIED_EVIDENCE.md`,
`docs/evidence/m8/M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md`,
`docs/evidence/m8/M8_I1_CUTOVER_READINESS_MATRIX_AND_EXIT_GATE_SYNC_EVIDENCE.md`.
Date: 2026-08-16 (Nachtrag: external host config evidence + Exit-Gate-2 Scope-Proposal).
Authority: ADR-0062, ESS-0019, `docs/architecture/ai-agent/AI_AGENT_PROVIDER_PROFILE_CONTRACT.md`, DEVELOPMENT Chain Execution Policy, `docs/roadmaps/INTEGRATED_DEVELOPMENT_SYSTEMADMIN_ROADMAP.md` (Phase I1, ROADMAP-INTEGRATED-DC-SA-0001) — dieses Runbook bleibt die spezifischere Authority; die Integrated Roadmap ersetzt es nicht.

## Goal

Move privileged AI execution from provider-specific direct paths to one provider-neutral CAPITAL-AI Control Plane with equivalent authorization semantics, audit, risk handling and rollback across ChatGPT, Claude, Google AI Studio and future execution clients.

Research/read-only profiles remain mutation-denied.

## Target Architecture

```text
AI application / agent
→ provider/transport adapter
→ provider profile
→ CAPITAL-AI Control Plane
→ principal / capability / risk / target policy
→ audit-bound execution decision
→ bounded execution host
→ result / evidence
```

Provider/model/client identity may contribute attribution, but never grants authority by itself.

## Prerequisite Gate

Before M8 implementation:

1. M7 must be `COMPLETE / VERIFIED PASS`;
2. production deployment identity must be verified;
3. M4 IAM and M5 audit controls remain intact;
4. M6 provenance/attestation remains intact;
5. Systemadmin execution-host path used for mutations, if selected, must have its own verified enforcement evidence;
6. Human-only `MERGE` remains enforced.

## Provider Roles

### ChatGPT

May use connectors/tools as transport. Privileged mutation must route through the same Control Plane and execution-host policy as other clients; direct provider-specific admin access is not canonical after cutover.

### Claude

May perform production integration/staging work only through the same semantic capability/risk/target policy. Provider-specific tooling does not create higher authority.

### Google AI Studio

Remains the Development Plane for application code, architecture and frontend. Stripe/Supabase/Render external mutations remain handoff-controlled rather than being executed directly from the Development Plane.

### Read-only Research Plane

Research/briefing/notebook profiles receive `READ`/`ANALYZE` only and fail mutation tests by design.

## Phase 0 — Read-only Inventory

1. resolve current provider integrations and direct admin paths;
2. map each client to actual tools/connectors/credentials;
3. identify capabilities currently possible per client;
4. identify bypass paths that skip IAM/audit/execution-host enforcement;
5. inventory provider profile contracts and configuration;
6. define rollback-to-read-only for every provider;
7. define identical semantic policy test vectors across at least ChatGPT and Claude, plus Google AI Studio where write-capable transport exists;
8. classify any required external configuration mutations through M7 rules.

## Phase 1 — Provider Profile Implementation

For each provider/AI app:

- define stable `appId` / principal attribution;
- map only supported capabilities;
- map risk classes consistently;
- bind target resource semantics consistently;
- reject unknown capability names;
- reject provider-specific privilege inheritance;
- preserve human-reserved action denysets;
- preserve M5 audit correlation fields;
- preserve secret isolation in tool host/gateway;
- preserve idempotency/replay controls for mutation.

## Policy Equivalence Tests

The same semantic request must produce the same authorization outcome regardless of provider where capability/profile inputs are equivalent.

Required examples:

- read-only allowed under read profile;
- repository PR work allowed only under valid scoped mandate/profile;
- `MERGE` denied for every agent/provider;
- production mutation without explicit approved Handoff/permit denied;
- wrong target denied;
- expired mandate/approval denied;
- Self-Authority expansion denied;
- provider name/model claiming admin status ignored;
- Research profile mutation denied;
- audit unavailable on a mutation path → DENY.

## Cutover Sequence

1. implement provider profiles/adapters on a fresh branch;
2. CI + negative policy tests;
3. shadow routing where feasible without changing authoritative execution;
4. compare old/new decisions and audit correlation;
5. resolve false allow/deny paths;
6. explicitly disable/deprecate provider-specific canonical admin routes;
7. enable Control-Plane path per provider in bounded order;
8. verify rollback-to-read-only per provider;
9. collect Evidence;
10. synchronize Roadmap/Traceability.

## External Mutation Gate

Any connector/app configuration or credential change is an external mutation and follows the M7/DevelopmentChain Handoff + explicit Owner Approval process.

No cutover implementation may opportunistically rotate or expand credentials outside its exact work order.

## Negative Tests

- provider/model spoofing → no elevation;
- unknown provider profile → DENY;
- missing principal/app identity on privileged request → DENY;
- profile capability mismatch → DENY;
- direct provider admin bypass → DENY/deactivated;
- research profile calls mutation endpoint → DENY;
- target mismatch → DENY;
- replayed mutation envelope → DENY/DEDUPE;
- audit unavailable → DENY;
- kill switch active → mutation denied, read access retained where policy permits.

## Rollback

For each provider, rollback must be able to:

1. disable the privileged provider profile;
2. revoke/disable the mutation transport or credential path;
3. restore read-only operation;
4. preserve audit/evidence access;
5. avoid changes to Human/Owner merge authority.

Rollback must not re-enable an ungoverned direct provider admin path.

## Evidence

Create `docs/evidence/m8/*` including:

- prerequisite evidence;
- provider inventory;
- profile/capability mappings;
- equivalence test matrix;
- bypass negative tests;
- cutover sequence/results;
- external mutation approval refs if any;
- audit correlation;
- rollback-to-read-only proof;
- final branch/merge/deletion evidence.
- external host configuration verification for the wired mutating provider;
- Exit-Gate item 2 scope decision (Owner).

## Exit Gate

M8 is `COMPLETE / VERIFIED PASS` only when:

1. M7 is verified;
2. privileged supported providers use the provider-neutral Control Plane as the canonical path;
3. policy-equivalence tests pass;
4. direct provider-specific privileged bypasses are denied/deactivated;
5. research profiles fail mutation tests;
6. rollback-to-read-only is proven;
7. audit correlation is complete;
8. Evidence + Roadmap/Traceability are synchronized;
9. work branches are deleted.

**Scope note (2026-08-16):** Point 2 may be closed by explicit Owner acceptance of the supported
privileged provider set defined in `docs/evidence/m8/M8_EXIT_GATE_ITEM2_SCOPE_DECISION.md`
(currently: only `chatgpt-github-connector` is a production mutating host path; non-mutating
profiles remain NOT_APPLICABLE; `claude-code-cli` remains structurally BLOCKED pending a separate
ADR). Without that Owner acceptance, point 2 stays open and M9 remains blocked.

Only then may M9 begin.
