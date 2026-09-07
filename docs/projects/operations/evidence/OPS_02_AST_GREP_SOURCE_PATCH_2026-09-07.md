# OPS-02 — Guarded ast-grep Source Patch Evidence — 2026-09-07

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Execution authority:** `/AGENTS.md`; bounded implementation under current OPS project scope  
**ADR-0104 session:** `ADR-0104-S3`, PT8H, exact-chat activation; Human/CODEOWNER merge remains excluded  
**Baseline:** `main@96119f958cacbf35614747380a066b87fdb1ee40`

## Goal

Provide a syntax-aware, fail-closed source-patch primitive for bounded Strangler migrations where replacing a very large source file through a full-content API would create unnecessary regression risk.

This work does not create a new Frontend architecture or authorize cross-project acceptance. The later BB-2E Dashboard Drawer cutover remains `CAPITAL-AI-FE`-owned. OPS provides Controlled-Implementation tooling only.

## Reuse / state-of-the-art precheck

The repository already provides TypeScript and `tsx`, so post-rewrite TS/TSX parsing can reuse repository-native tooling. The connected execution surfaces available in the chat did not expose a suitable existing patch workflow for this repository.

For structural search/rewrite, `ast-grep` was selected over a custom text replacement engine. Reviewed upstream state on 2026-09-07:

- `@ast-grep/cli` current version: `0.45.3`;
- license: MIT;
- explicit TypeScript and TSX parsing support;
- structured JSON match output includes source ranges and replacements;
- `scan --rule ... --json=compact` supports machine-readable dry-run discovery;
- `scan --rule ... --update-all` applies rule fixes non-interactively;
- project showed active upstream maintenance in September 2026.

The runner pins `0.45.3`. It prefers an already-installed local binary. A network bootstrap through `npm exec --package=@ast-grep/cli@0.45.3` is disabled unless the caller supplies `--allow-download` explicitly.

## Brick / source-patch contract

Each migration patch is one small auditable unit:

```text
single target file
→ approved rule root
→ exact pre-match cardinality
→ ast-grep structural rewrite
→ exact post-match cardinality
→ required/forbidden textual postconditions
→ TypeScript/TSX syntax parse
```

Implemented guardrails:

1. one repository-relative target file per plan;
2. target path restricted to `src/`, `tests/` or `scripts/`;
3. rule path restricted to controlled OPS or Frontend codemod roots;
4. path traversal and absolute paths denied;
5. precondition match count must equal the declared cardinality;
6. apply mode is separate from dry-run mode;
7. post-rewrite rule match count is verified;
8. required markers must exist and forbidden legacy markers must be absent;
9. TS/TSX targets are parsed by the repository TypeScript compiler API after mutation;
10. ast-grep version mismatch fails closed.

## Files

- `scripts/operations/sourcePatch/astGrepSourcePatch.ts`
- `tests/unit/astGrepSourcePatch.test.ts`

## Security impact

The patch primitive narrows rather than broadens mutation scope. It does not bypass branch, PR, Human merge, Security verification, target-project ownership, provider authentication or protected external-mutation controls.

The optional `--allow-download` path is explicit because executing a freshly downloaded package is a larger supply-chain surface than using an already installed local binary. Production/runtime code does not import ast-grep.

## Validation truth

Repository-level source inspection and branch/open-PR correlation were performed in the connected GitHub surface.

The following commands could not be executed in the current chat execution host because no repository checkout/Node toolchain is mounted there:

- `npx vitest run tests/unit/astGrepSourcePatch.test.ts` — **NOT RUN**
- `npm run lint` — **NOT RUN**
- production build/predeploy checks — **NOT RUN**
- an actual ast-grep rewrite — **NOT RUN**

`NOT RUN` is not reported as PASS. Hosted checks after PR creation remain separate evidence.

## Exit gate

OPS tooling is ready for a target-owned codemod only when the exact branch is synchronized to current `main`, no overlapping writer exists, the target project supplies its own rule/plan and acceptance markers, and the smallest applicable technical checks pass on the exact source-patch branch/PR head.
