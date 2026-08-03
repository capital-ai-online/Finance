<!-- CAPITAL_AI_PR_TEMPLATE_VERSION: 1.0.0 -->
# CAPITAL-AI Pull Request

> This template is mandatory. Machine-managed baseline fields MUST NOT be deleted. Keep the PR as **Draft** until every required gate is green.

## 1. Work Item

- **Purpose:** {{WORK_ITEM}}
- **Claim ID:** `{{CLAIM_ID}}`
- **Claim file:** `{{CLAIM_FILE}}`
- **Branch:** `{{HEAD_BRANCH}}`
- **Base:** `main`

## 2. Agent / Principal Identity

- **Provider:** {{AGENT_PROVIDER}}
- **Model:** {{AGENT_MODEL}}
- **Execution surface / MCP host:** {{AGENT_SURFACE}}
- **Human/code-owner approval required:** Yes

## 3. Production Baseline — machine managed

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

## 4. Claimed Scope / Multi-Agent Isolation

The machine-readable source of truth is the work-claim file above.

- [ ] Every changed file is covered by the claim.
- [ ] No open PR changes the same file.
- [ ] No open PR owns an overlapping claimed path/prefix.
- [ ] No file was taken over by modifying/deleting another agent's claim.
- [ ] PR was opened no later than 15 minutes after the work claim started.

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

## 8. Validation Evidence

- [ ] Production baseline check
- [ ] Work-claim / overlap check
- [ ] PR template validation
- [ ] Workflow security validation
- [ ] Type check / lint
- [ ] Tests
- [ ] Production build
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

- [ ] Branch contains the current `main`.
- [ ] Production drift is understood and represented above.
- [ ] All conversations/findings that block merge are resolved.
- [ ] CODEOWNER review obtained where applicable.
- [ ] PR remains Draft until required checks are green.
- [ ] No agent/model self-approval is being treated as human approval.
