# OPS → DOC Handover — Archive cleanup and weekly compression

**Correlation ID:** `OPS-TO-DOC-ARCHIVE-COMPACTION-20260924`  
**Source Project:** `CAPITAL-AI-OPS`  
**Target Project:** `CAPITAL-AI-DOC`  
**Source finding:** repository/CI cleanup requested together with archival and a weekly compression pattern  
**State:** `OWNER_CORRECT_HANDOVER / IMPLEMENTATION_NOT_STARTED`

## Completed source analysis

OPS identified a recurring cleanup need: files that are no longer part of a
current runtime/workflow/test surface should not remain indefinitely in active
paths merely for historical provenance.

The repository already owns Documentary archive semantics through ADR-0097,
the Documentary Maintenance Control Loop, Archive Integrity and
`ArchiveRetentionAgent`. That agent is intentionally a deterministic
retention/deletion planner and not a physical deletion authority.

Therefore OPS does **not** create a second archive scheduler, retention policy,
delete controller or compression authority.

## Requested DOC outcome

Derive one bounded Documentary work package that:

1. inventories retired/superseded/generated candidates from current main;
2. classifies each candidate as:
   - delete because Git history is sufficient and no continuing evidence
     obligation exists;
   - archive because current repository provenance must remain directly
     available;
   - retain because it is registered, referenced, authority/evidence,
     Security/Compliance relevant or otherwise protected;
3. physically moves only owner-correct eligible material to existing
   `docs/archive/**` classes and updates the canonical archive index/integrity
   manifest;
4. defines one **weekly deterministic compression pattern** for eligible archive
   payloads without putting recurring binary churn into normal Git history;
5. preserves reproducible provenance and SHA-256 integrity for every compressed
   artifact;
6. never includes credentials, secrets, current runtime files or active
   authority surfaces.

## Proposed compression pattern for DOC review

A deterministic naming shape may be evaluated:

`capital-ai-archive-YYYY-Www.tar.zst`

or, when zstd is not available in the already approved execution environment:

`capital-ai-archive-YYYY-Www.tar.gz`.

The bundle should be generated from a sorted manifest with normalized metadata
so the same source generation is reproducible. The manifest should bind at
least:

- exact source `CURRENT_MAIN`;
- archive generation/week;
- ordered source paths;
- per-file SHA-256;
- bundle SHA-256;
- retention class;
- provenance/evidence references.

The compressed payload should preferably be a bounded CI/retention artifact,
not a newly committed binary every week. Repository Markdown/JSON should retain
only the small integrity/index projection needed by the existing Documentary
authority.

## Scheduling boundary

Reuse an existing Documentary maintenance execution surface where possible.
Do not introduce a repository-wide second scheduler/controller merely for
compression.

A weekly schedule must remain:

- Documentary-owned;
- read/prepare by default;
- branch-only for repository index changes;
- Human/CODEOWNER merge gated;
- compatible with Archive Integrity;
- protected by the existing retention/deletion owner gate and kill switch.

## Exact continuation condition

CAPITAL-AI-DOC must freshly resolve its project/PVC, active writers, accepted
Documentary/Archive constraints and Security/Compliance retention boundaries
from CURRENT_MAIN. After that correlation it may create the canonical DOC work
package and implement the weekly compression pattern.

This handover conveys requested scope and evidence only; it transfers no
authority and performs no archive/deletion mutation itself.
