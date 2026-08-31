# CAPITAL-AI Cross-Project Handoff Contract

**Role:** project-routing contract — non-authorizing

Repository compatibility marker remains:

`[CROSS_PROJECT_HANDOFF -> <TARGET_PROJECT> | VC-<NN>]`

To remove namespace ambiguity, every new project-routing handoff MUST additionally carry:

- `project_namespace: PVC`
- `project_stage: PVC-<NN>`
- `target_project`
- `task`
- `reason`
- `dependency`
- `required_evidence`
- `verification_gate`
- `status`

The legacy `VC-<NN>` marker is retained for compatibility with the repository coordination contract; `project_stage` is the explicit project namespace identity. The marker MUST NOT be interpreted as a technical `SC-MD-SPT-0001` stage.

Allowed external status: `REFERRED`, `REFERRED_NOT_EXECUTED`, `DEPENDENCY`, `BLOCKED_BY`, `WAITING_FOR_EVIDENCE`.

Foreign work may not be marked `DONE`, `VERIFIED` or `CLOSED` by the referring project.

Where a technical financial stage is also relevant, add `technical_namespace` and `technical_stage` separately; never overload `PVC-*` with technical runtime semantics.
