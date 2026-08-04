<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.0.0 -->
# CAPITAL-AI Pull Request

> This template is mandatory. Machine-managed baseline fields MUST NOT be deleted. Keep the PR as **Draft** until every required technical gate is green.

## 1. Work Item

- **Purpose:** {{WORK_ITEM}}
- **Claim ID:** `{{CLAIM_ID}}`
- **Claim file:** `{{CLAIM_FILE}}`
- **Branch:** `{{HEAD_BRANCH}}`
- **Base:** `main`

## 2. Agent / Principal Identity & PR Creation Authorization

- **Provider:** {{AGENT_PROVIDER}}
- **Model:** {{AGENT_MODEL}}
- **Execution surface / MCP host:** {{AGENT_SURFACE}}
- **PR creation explicitly authorized by user:** Yes
- **Authorization scope matches this PR:** Yes
- **Human/code-owner approval required for merge where applicable:** Yes

A green sandbox build, CI run, preflight or test result is technical evidence only and MUST NOT be interpreted as PR-creation or merge authorization.

## 3. Production Baseline — machine managed / advisory evidence

<!-- CAPITAL_AI_PRODUCTION_BASELINE_START -->
- **Production URL:** `https://capital-ai.online/healthz`
- **Production version:** `{{PRODUCTION_VERSION}}`
- **Production commit:** `{{PRODUCTION_SHA}}`
- **Production branch:** `{{PRODUCTION_BRANCH}}`
- **Current main commit:** `{{MAIN_SHA}}`
- **PR head commit:** `{{HEAD_SHA}}`
- **Production → main drift:** `{{PROD_TO_MAIN_COMMITS}}` commit(s)
- **Main → PR head drift:** `{{MAIN_TO_HEAD_COMMITS}}` commit(s)
- **Baseline generated at:** `{{BASELINE_GENERATED_AT}}`
<!-- CAPITAL_AI_PRODUCTION_BASELINE_END -->

Production drift is advisory process evidence. It is not a sandbox/build authorization gate.

## 4. Scope / Multi-Agent Coordination

- [ ] Intended scope is documented.
- [ ] Open PR changed-file overlap was inspected where available.
- [ ] Detected overlap/conflict risk was disclosed to the user before PR creation.
- [ ] Any work-claim metadata is treated as advisory coordination evidence, not as a technical CI prerequisite.
- [ ] No other agent's metadata or work was silently taken over.

There is **no PR creation deadline or 15-minute SLA**.

## 5. Change Summary

Describe exactly what changed and why. Keep unrelated work out of this PR.

## 6. Architecture / Governance Impact

- **ADR required?** Yes / No — reference:
- **ESS/contract impact?** Yes / No — reference:
- **Traceability/documentation updated?** Yes / No / N/A
- **Existing protected invariant affected?** Yes / No — reference:

## 7. Security Review

- [ ] Least privilege preserved.
- [ ] No credentials/secrets/tokens added to source, logs, PR body or model context.
- [ ] Authentication/authorization remains fail-closed where required.
- [ ] External/tool/retrieved content is treated as untrusted input.
- [ ] High-impact/destructive actions retain human approval gates.
- [ ] New/modified workflows use immutable Action SHAs and explicit minimum permissions.

### MCP / LLM Gateway changes

Complete when applicable; otherwise state `N/A`.

- Token audience/resource validation:
- Token passthrough avoided:
- Per-tool/capability authorization:
- Idempotency / replay protection:
- Agent/session/request correlation:
- Human-in-the-loop boundary:

## 8. Technical Validation Evidence

- [ ] Dependency installation / vulnerability check
- [ ] Type check / lint
- [ ] Tests
- [ ] Production build
- [ ] Deployment readiness
- [ ] Workflow security validation
- [ ] Relevant security/compliance checks

Commands / evidence:

```text
<insert concise evidence; do not paste secrets>
```

## 9. Risk & Rollback

- **Blast radius:** Low / Medium / High / Critical
- **User impact:**
- **Data / billing / IAM impact:**
- **Rollback approach:**
- **Rollback requires protected-change approval?** Yes / No — reference:

## 10. Review Readiness

- [ ] PR creation was explicitly authorized by the user before this PR was opened.
- [ ] Technical CI status is understood as validation only.
- [ ] Production drift and concurrent-work warnings have been reviewed as advisory evidence.
- [ ] All merge-blocking conversations/findings are resolved.
- [ ] CODEOWNER/human review obtained where applicable.
- [ ] PR remains Draft until review-ready.
- [ ] No agent/model self-approval is being treated as human approval.
