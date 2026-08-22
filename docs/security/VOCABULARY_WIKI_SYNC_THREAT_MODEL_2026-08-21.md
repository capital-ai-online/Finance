# CAPITAL-AI Vocabulary Wiki Sync Threat Model

**Status:** Reviewed implementation evidence / effective with Human Merge  
**Date:** 2026-08-21  
**Scope:** VW-6 controlled GitHub Wiki sync  
**Authorities:** `ESS-0017`, `ESS-0017-CONTRACTS`, `ADR-0078`

## Assets to protect

- canonical Finance repository Vocabulary/Message/ESS/ADR authorities;
- integrity of generated Wiki pages;
- Git credentials available to a human-operated local Wiki checkout;
- source-commit provenance and projection checksums;
- separation between documentation projection and Financial Runtime/production authority.

## Trust boundaries

The only new optional external-write boundary is the future operator-invoked Git push from a local `Finance.wiki.git` checkout to the canonical GitHub Wiki repository. The branch itself performs no external Wiki mutation.

The renderer is repository-local and read-only. The sync script receives an existing checkout path and never creates credentials, selects an account, clones a repository or changes Git remotes.

## Threats and controls

| Threat | Control |
|---|---|
| Malicious lookalike remote | Exact allowlist for `https://github.com/SvenKulessa/Finance.wiki.git`, `git@github.com:SvenKulessa/Finance.wiki.git`, and `ssh://git@github.com/SvenKulessa/Finance.wiki.git` only |
| Credential-bearing URL leaks through logging | Credential-bearing HTTPS origins are rejected; logs expose only an allowlisted-origin label, never the raw remote |
| Unintended external write during validation | Dry-Run is default; local mutation requires explicit `--apply`; network publication separately requires `--push` |
| Dirty checkout overwrites human work | Sync fails closed when the Wiki checkout is not clean |
| Unexpected files staged/published | Only generated managed pages plus the projection manifest are added; any additional staged path fails closed |
| Stale or symbolic provenance | Projection requires an exact 40-character source commit SHA and embeds it into every generated page |
| Non-deterministic/generated prose drift | Wiki renderer uses only deterministic canonical repository records and SHA-256 checksums; no model-generated free text or generated timestamp enters the page projection |
| Wiki becomes a second authority | Every page and manifest declare non-authority; architecture is one-way Repository → Wiki; no Wiki readback/back-propagation path exists |
| Financial/security state upgraded by presentation | Vocabulary/Wiki contracts remain `financialDecisionAuthority=false` and `mutationAuthority=false`; fail-closed runtime states cannot be altered by wording |
| Replay of a previously generated projection | Exact source commit and manifest checksum make the projection identity auditable; operator must intentionally invoke apply/push |

## Negative cases covered in source tests

- alternate host ending in `Finance.wiki.git` → DENY;
- different GitHub owner → DENY;
- credential-bearing GitHub HTTPS remote → DENY;
- repository-name suffix attack → DENY;
- symbolic source ref such as `main` → DENY;
- `--push` without `--apply` → DENY by sync contract;
- dirty checkout → DENY by sync contract;
- unexpected staged file → DENY by sync contract.

## Residual risk

A human operator with valid GitHub credentials can still intentionally publish an incorrect branch/commit if they bypass this script and use Git directly. This is outside Vocabulary runtime authority and remains governed by GitHub account/repository permissions and Human Review. VW-6 does not attempt to replace GitHub authorization.

## Rollback

No Wiki mutation is performed by this branch or PR preparation. For a future authorized Wiki push, rollback is a Git revert in `Finance.wiki.git` of the generated sync commit followed by a normal human-authorized push. Repository authorities remain unchanged because the Wiki is non-authoritative and one-way.
