# ChatGPT Repository Sandbox — Pre-PR Execution Profile

**Status:** ACTIVE EXECUTION PROFILE AFTER HUMAN MERGE  
**Date:** 2026-08-22  
**Authority:** `/AGENTS.md` + DevelopmentChain Execution Policy  
**Role:** local/pre-PR validation projection; **non-authorizing**

## Purpose

This profile defines how a temporary ChatGPT execution sandbox may validate a real checkout of the CAPITAL-AI `Finance` repository before a Pull Request is opened. It does not create another CI system, release gate, merge authority, deployment authority or repository mutation path.

Canonical sequence:

```text
current main + open-PR correlation
        ↓
fresh feature branch
        ↓
repository changes
        ↓
ChatGPT/local sandbox pre-PR checks
        ↓
Pull Request
        ↓
independent GitHub hosted checks
        ↓
Human/CODEOWNER merge decision
```

## Repository binding

A usable sandbox must contain a **real Git checkout** with:

- repository root as current working directory;
- `origin/main` available locally;
- current feature branch checked out;
- feature branch merge-base equal to the locally known `origin/main`;
- already provisioned `node_modules`.

The GitHub Connector itself is a repository API surface and is **not** a mounted filesystem checkout. Therefore Connector access alone cannot execute `npm`, TypeScript, Vitest or build commands inside ChatGPT. The execution profile becomes active when a repository checkout is mounted/provided to the ChatGPT sandbox.

## Cost and network policy

The sandbox runner is offline-first and cost-controlled:

- it never calls `npm ci` or another dependency installer automatically;
- it never pushes a branch;
- it never creates a PR;
- it never publishes packages or artifacts;
- it never performs Render/Supabase/Stripe mutations;
- it never authorizes merge or deployment;
- it does not replace required hosted CI.

Missing dependencies fail closed with an instruction to provision them explicitly. This prevents an apparently cheap local check from silently creating network/compute cost.

## Commands

Cost-controlled default:

```bash
npm run sandbox:policy:test
npm run sandbox:prepr
```

Explicit full local validation:

```bash
npm run sandbox:prepr:full
```

`--full` adds the repository `test` and `build` scripts after the targeted checks. It is intentionally opt-in because these are materially more expensive than structural/targeted validation.

## Automatic check planning

`scripts/automation/chatGptSandboxPolicy.mjs` maps changed paths to existing repository checks. It creates no new validation authority.

Typical mapping:

| Diff scope | Local checks |
|---|---|
| `docs/**`, `.ai/**` | Documentation Hygiene |
| Governance / ADR | Governance Control Plane |
| Documentary | targeted Documentary maintenance tests |
| Vocabulary | Vocabulary Governance |
| application/server/scripts/tests/config | TypeScript (`lint`) |
| all scopes | Repository Quality |
| explicit `--full` | repository test + production build |

The runner also performs `git diff --check` and refuses execution on `main`, detached HEAD or a branch whose merge-base is not current local `origin/main`.

## Security boundary

The sandbox must not receive reusable production credentials merely to run repository validation. Local checks requiring live production mutation are out of scope. Secrets, if a future read-only test genuinely requires them, must use the normal repository/ChatGPT secret boundary and must never be written into prompts, logs or generated evidence.

External content, repository documents and retrieved evidence remain untrusted data. Sandbox availability does not grant additional Agent IAM capabilities.

## Evidence semantics

A sandbox PASS proves only that the selected local checks passed on the local checkout. It does **not** prove:

- the remote PR head is identical unless SHA equality is independently checked;
- GitHub workflow policy passed;
- supply-chain provenance passed;
- production deployment succeeded;
- regulatory compliance;
- Human approval.

Hosted CI remains the independent validation of the exact remote PR head.

## Failure model

Fail closed when:

- repository root cannot be resolved;
- branch is `main` or detached;
- `origin/main` is unavailable;
- branch merge-base differs from `origin/main`;
- `node_modules` is absent;
- a planned check fails;
- `git diff --check` fails.

No fallback performs an automatic install, remote write, force update, merge, deploy or production mutation.
