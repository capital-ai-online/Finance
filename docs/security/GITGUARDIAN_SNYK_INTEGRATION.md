# GitGuardian AI Hooks and Snyk Integration

Status: PREPARED — repository-side bootstrap added; Snyk account connection still requires Human/Owner authorization.

Baseline used for this integration: `main@74f4eb98345f994854f56e7296b9491241718b57`

## Purpose

This document defines the CAPITAL-AI integration boundary for:

1. GitGuardian native GitHub secret scanning;
2. GitGuardian `ggshield` AI coding hooks for Claude Code and Codex;
3. Snyk GitHub application-security scanning; and
4. later promotion of both products into DEVELOPMENT Chain policy only after baseline validation and Human/Owner approval.

This change does **not** modify the current merge policy, branch-protection requirements, Render configuration, Supabase, Stripe, production secrets, billing, or production data.

## Current GitGuardian state

The `Finance` repository already uses the native GitGuardian GitHub App. This integration is independent of `.github/workflows/**`; therefore the absence of a GitGuardian workflow YAML is expected.

Observed repository evidence before this integration:

- PR #240: `GitGuardian Security Checks` completed successfully and scanned 44 commits without detecting a secret.
- PR #244: `GitGuardian Security Checks` completed successfully and scanned the rollback commit without detecting a secret.
- The GitGuardian App observed on those checks had repository `contents: read`, while checks / issues / pull-request metadata may be writable according to the installed App permissions.

The native App remains the repository-side secret monitor. This integration does not duplicate it with a GitGuardian GitHub Action.

## Repository-level ggshield configuration

The repository root contains `.gitguardian.yaml`.

The initial configuration is intentionally minimal:

- configuration format `version: 2`;
- `exit_zero: false`, so normal CLI secret scans can fail when incidents are detected;
- no blanket ignore rules;
- no plaintext secrets or API keys;
- GitGuardian SaaS instance remains the default dashboard instance.

False positives must not be added as broad path or detector exclusions without security review. Prefer the narrowest documented ignore mechanism and retain evidence explaining why an ignored value is not a credential.

## AI coding hook architecture

GitGuardian AI hooks execute in the developer/agent working copy, before or around AI interactions. They are separate from the GitHub App.

Intended flow:

```text
Human / Agent
    |
    v
Claude Code or Codex
    |
    +-- prompt submission --> ggshield secret scan ai-hook --> block on secret
    +-- pre-tool use ------> ggshield secret scan ai-hook --> block on secret
    +-- post-tool use -----> ggshield secret scan ai-hook --> alert on secret
    |
    v
scoped Git branch -> Pull Request -> native GitGuardian GitHub check
```

### Prerequisites

- `ggshield >= 1.51.0` for the combined Claude Code + Codex setup;
- a GitGuardian account/workspace;
- local developer authentication with `ggshield auth login`;
- a fresh scoped Finance work branch; never modify `main` directly.

The GitGuardian API key or personal token is local developer authentication material. It must never be committed to `Finance`, inserted into AI prompts, or stored in repository documentation.

### Installation in a Finance working copy

From the repository root:

```bash
bash scripts/security/installGitGuardianAiHooks.sh
```

The script runs the official project-local installers:

```bash
ggshield install -t claude-code -m local
ggshield install -t codex -m local
```

`--force` is intentionally not used because `Finance` already contains Claude hook configuration. The supported GitGuardian installer is responsible for merging its own hook entries with existing supported configuration.

Authenticate separately:

```bash
ggshield auth login
```

For a headless developer host, use the authentication mode documented by GitGuardian for out-of-band login rather than placing a token in the repository.

### Verification

After installation:

```bash
ggshield --version
ggshield api-status
```

Then open a new Claude Code / Codex session in the working copy and verify that the generated project-local hook configuration is present.

Do not validate the hook by committing or transmitting a real credential. Use only GitGuardian's documented safe testing approach or an explicitly non-secret synthetic fixture.

## Snyk integration model

### Selected initial mode: native GitHub integration

The first CAPITAL-AI Snyk integration should use Snyk's native GitHub integration rather than immediately adding another GitHub Actions workflow.

Reasons:

- Snyk can import the GitHub repository and report Pull Request checks directly;
- Snyk Open Source and Snyk Code PR checks can be enabled independently;
- Dockerfile scanning can be enabled from the Snyk GitHub integration;
- no repository `SNYK_TOKEN` is required merely to use the native source-control integration;
- this avoids creating a second CI implementation before severity thresholds, false-positive handling, and policy promotion are agreed.

A Snyk GitHub Action remains an optional later implementation when CAPITAL-AI needs deterministic CLI/SARIF evidence inside its trusted-main executor. If introduced, it must follow the repository's workflow rules: least privilege, full immutable Action commit SHAs, `persist-credentials: false`, and no execution of untrusted PR-controlled code in a privileged context.

### Human/Owner activation steps

The following steps require an authenticated Snyk account and cannot be completed safely by repository code alone:

1. Sign in to Snyk.
2. Connect the GitHub account that owns or can authorize `SvenKulessa/Finance`.
3. Import `SvenKulessa/Finance` as a Snyk project.
4. Enable the relevant PR checks:
   - Open Source security / dependency checks;
   - Snyk Code analysis;
   - Dockerfile scanning when available for the imported project.
5. Start with an observation/baseline phase. Do not make the Snyk check a mandatory merge blocker until existing findings and false positives are triaged.
6. Record the exact Snyk check names observed on a test PR before adding them to repository policy or required-check configuration.

### Recommended initial thresholds

For the baseline phase:

- report all findings;
- treat newly introduced **Critical** and **High** findings as candidate blockers;
- do not silently ignore existing findings;
- distinguish pre-existing debt from newly introduced vulnerabilities;
- require Human/Owner review before accepting any ignore or severity exception.

The exact blocking threshold becomes normative only in a later policy change.

## Separation of responsibilities

| Control | Responsibility |
|---|---|
| GitGuardian GitHub App | Repository / PR secret detection |
| GitGuardian ggshield AI hook | Prevent secrets reaching Claude Code / Codex interactions |
| Existing CAPITAL-AI dependency controls | Lockfile integrity and CycloneDX SBOM generation |
| Snyk Open Source | Dependency vulnerability analysis |
| Snyk Code | First-party source-code security analysis |
| Snyk Dockerfile / container capabilities | Container and base-image security where enabled |
| Human/Owner gate | Authorization, exceptions, merge decision |
| Later DEVELOPMENT Chain policy | Defines when security checks become required fail-closed gates |

Snyk does not replace GitGuardian. GitGuardian does not replace Snyk. AI review does not replace deterministic security scanners.

## Planned policy promotion — not active yet

A later dedicated policy/ADR change may promote these controls after a clean baseline run.

Proposed direction:

```text
candidate branch
  -> GitGuardian secret check
  -> Snyk Open Source / Code checks (scope dependent)
  -> existing CAPITAL-AI technical CI
  -> Human/Owner current-head verification
  -> merge
```

Before promotion, capture:

- exact GitHub check names;
- baseline pass/fail evidence;
- severity threshold;
- timeout / outage behavior;
- false-positive and ignore approval process;
- whether documentation-only PRs require the same Snyk checks;
- CI cost and duplication impact;
- rollback procedure if a third-party service is unavailable.

No third-party scanner may become a silent self-authorizing merge authority. CI success remains technical evidence only.

## Branch lifecycle

This integration follows the existing DEVELOPMENT Chain rule:

```text
current main
-> fresh scoped branch
-> bounded changes
-> Human-authorized PR
-> CI / review
-> Human merge
-> delete remote work branch
```

After a successful merge of this integration, delete `agent/security-gitguardian-snyk-integration`. Do not reuse the merged branch for later Snyk policy work; create a fresh branch from then-current `main`.

## References

Official product documentation used during preparation:

- GitGuardian: Secret scanning for AI coding tools
- GitGuardian: `ggshield install`
- GitGuardian: `ggshield auth login`
- GitGuardian: `.gitguardian.yaml` configuration
- Snyk: GitHub integration
- Snyk: Pull request status checks
- Snyk: GitHub Actions for Snyk (reserved as optional later CI path)
