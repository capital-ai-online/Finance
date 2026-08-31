# Runbook — QM Finding Referral and Roadmap Sync

## Purpose
Route a confirmed Quality finding to the correct Primary Owner without transferring domain implementation authority into QM.

## Procedure

1. Determine current `main` and bind the observation to its exact SHA/runtime identity.
2. Correlate open PRs, work claims and current authoritative roadmaps.
3. Reproduce/measure the suspected problem using existing validators, tests or evidence adapters.
4. Create/triage a finding under `QM-04` with all required fields.
5. Assign the exact `affected_vc_stage` (`VC-01..VC-18`).
6. Resolve `target_project` from `PROJECT_CONTRACT_V2.md` Primary Owner routing.
7. Confirm evidence; transition `TRIAGED -> CONFIRMED` only when reproducible.
8. Define a bounded `required_remediation` and exact `verification_gate`.
9. Add the handoff marker:

```text
[QUALITY_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]
```

10. Add canonical source/target roadmap references and evidence references.
11. Emit the required chat notice describing finding, VC stage, target project, remediation and verification gate.
12. Transition the QM finding to `REFERRED`.
13. The target project performs technical remediation in its own project-scoped branch/PR.
14. QM observes `REMEDIATING`; it does not take over implementation status/authority.
15. When target evidence is ready, transition to `EVIDENCE_READY` and execute the declared verification gate.
16. Only successful verification permits `VERIFIED -> CLOSED`.

## Primary Owner routing

- VC-01 -> `CAPITAL-AI-CLIENT`
- VC-02 -> `CAPITAL-AI-OPS`
- VC-03 -> `CAPITAL-AI-DOC`
- VC-04 -> `CAPITAL-AI-OPS`
- VC-05 -> `CAPITAL-AI-GOV`
- VC-06 -> `CAPITAL-AI-OPS`
- VC-07 -> `CAPITAL-AI-OPS`
- VC-08 -> `CAPITAL-AI-OPS`
- VC-09 -> `CAPITAL-AI-DATA`
- VC-10 -> `CAPITAL-AI-DATA`
- VC-11 -> `CAPITAL-AI-DATA`
- VC-12..VC-17 -> `CAPITAL-AI-FINTECH`
- VC-18 -> `CAPITAL-AI-OPS`

## Stop conditions

Stop fail-closed if:

- the VC stage cannot be determined;
- no target project is assigned;
- evidence is insufficient (`NOT_AVAILABLE`);
- referral would transfer Market Data, UAI, Data Quality runtime, Scoring, Ranking, provider routing, Release or Production authority into QM;
- a direct productive hot-path dependency on Quality would be introduced.

## Legacy rule

The pre-V2 `HANDED_OFF_TO_QM` execution-takeover marker is not used for foreign remediation. V2 uses referral/handoff while remediation ownership remains with the target project.