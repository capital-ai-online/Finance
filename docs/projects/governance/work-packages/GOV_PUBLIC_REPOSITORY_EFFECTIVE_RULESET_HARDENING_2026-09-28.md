# GOV Public Repository Effective Ruleset Hardening — 2026-09-28

**Project:** `CAPITAL-AI-GOV`  
**Owner/PVC:** `CAPITAL-AI-GOV / PVC-05`  
**Trust root:** `/AGENTS.md@CURRENT_MAIN`  
**Fresh owner direction:** 2026-09-28 — after `capital-ai-online/Finance` became public, harden the effective repository and Enterprise ruleset surfaces without changing visibility or license  
**Baseline:** `main@dcef421fe6e350a3a2ade61d0299aad9ecca213c`  
**Branch:** `agent/governance-public-repo-effective-ruleset-hardening-20260928`  
**Priority:** `P0`  
**State:** `IMPLEMENTATION_ON_BRANCH / PUBLIC_REPOSITORY_SECURITY_CONVERGENCE`  
**Merge authority:** `HUMAN_MERGE_REQUIRED`

## Observed provider state

The repository is public. The effective repository-owned `main-production-protection` ruleset is active, has no bypass actor, preserves strict required checks and non-fast-forward protection, but currently reports zero required approvals, Code Owner review off and conversation resolution off.

The canonical App-authored PR path is already proven by PR #1518, so the sole Human Owner can be the required reviewer without self-approval conflict.

The earlier Enterprise writer used an App-first path with a Classic `admin:enterprise` PAT fallback. Post-merge evidence showed the App GET returning 403 and the PAT PUT returning 422. GitHub's current Enterprise ruleset update contract requires a GitHub App user or installation token with `Enterprise administration: write`; the Classic-PAT write fallback is therefore removed.

## Bounded implementation

The repository writer targets only `capital-ai-online/Finance` and `main-production-protection`. It preserves the existing four strict required checks, code-quality warning rule and license-compliance rule, adds deletion protection to the no-bypass ruleset, and converges review semantics to one approval + Code Owner + stale dismissal + resolved review threads. Last-push approval remains off for the single-Human-Owner model.

The Enterprise writer becomes App-only. Missing App permissions, unknown provider rule types, bypass actors, changed required-check sets or provider validation errors fail closed.

## Non-goals

No visibility change, license change, merge/approval automation, second PR writer, branch-protection fallback plane or weakening of Security/QM/Compliance gates.

## Exit evidence

1. fresh CURRENT_MAIN ancestry and no writer overlap;
2. focused tests and workflow-security PASS;
3. exact-head required checks PASS;
4. Human/CODEOWNER merge;
5. post-merge repository ruleset readback proves one approval, Code Owner review, stale dismissal, resolved conversations, strict four-check set and no bypass;
6. Enterprise readback either proves App-backed convergence or remains an explicit provider-IAM blocker.
