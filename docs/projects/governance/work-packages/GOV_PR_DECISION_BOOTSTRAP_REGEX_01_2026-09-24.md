# GOV-PR-DECISION-BOOTSTRAP-REGEX-01

**Project:** CAPITAL-AI-GOV  
**Owner/PVC:** CAPITAL-AI-GOV / PVC-05  
**Source Issue:** #1366  
**Baseline:** main@cb0012e7f38452eb638ed2e3affe5e74f0b44ed6  
**State:** IMPLEMENTED_ON_BRANCH / HUMAN_MERGE_REQUIRED

## Finding

The existing `.github/workflows/pr-decision-reconciler.yml` bootstrap gate used
an over-escaped regex literal. In JavaScript regex syntax the two backslashes
before `s` and `.` make the workflow search for literal backslashes rather
than whitespace and version separators.

## Scope

- repair only the existing Decision Evidence Reconciler bootstrap regex;
- add regression coverage against the exact workflow source;
- explicitly reject the previously over-escaped source form;
- preserve trusted-CURRENT_MAIN rendering, one PR-body writer lease, branch-sync
  delegation and Human/CODEOWNER merge authority.

## Exit evidence

1. workflow source contains
   `/CAPITAL_AI_PR_TEMPLATE_VERSION:\s*1\.8\.0/`;
2. workflow source does not contain the double-escaped form;
3. existing bootstrap/idempotency tests remain green;
4. Governance/CI/workflow-security pass on the exact PR head;
5. no second writer or template authority exists.
