# CAPITAL-AI — Source-Chat Consolidation & Closure Protocol Evidence

**Source task:** `CAPITAL-AI-SOURCE-CHAT-CONSOLIDATE-AND-CLOSE`  
**Date:** 2026-09-13  
**Repository:** `capital-ai-online/Finance`  
**Owning project:** `CAPITAL-AI-DOC`  
**Primary PVC:** `PVC-03 — Documentary Engine`  
**Project folder:** `docs/projects/documentary/`  
**Role:** documentary preservation evidence only; non-authorizing  
**Current-main baseline:** `91818c23038e0f4d516b1ce1a26ae0d3962b24c7`  
**Consolidation branch:** `agent/documentary-chat-workpackage-consolidation-20260913`  
**Existing PR:** `#900`  
**Primary consolidation document:** `docs/projects/documentary/evidence/CAPITAL_AI_CHAT_WORKPACKAGE_CONSOLIDATION_2026-09-13.md`

## 1. Purpose

Preserve the stricter source-chat closure execution contract supplied by the Human Owner where it was only partially represented in the existing consolidation artifact. This evidence does not create repository authority, does not alter foreign-owner Roadmaps, and does not authorize runtime, application, production, provider, credential, IAM, billing, deployment, PR-merge, or other protected mutations.

## 2. Mandatory start and correlation contract

Every execution of this source-chat consolidation/closure task must, before treating historical chat state as current truth:

1. resolve the current `main` SHA;
2. read `/AGENTS.md@current-main` completely;
3. read `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md`;
4. resolve `Current Project`, `Current Project Folder`, `Primary PVC`, `Primary Owner`, and project scope;
5. read the current project README and ROADMAP;
6. resolve relevant accepted ADRs and active ESS;
7. inspect open Pull Requests, relevant parallel writers/branches, changed-file overlap, semantic overlap, and authority/namespace conflicts;
8. read the existing consolidation branch and consolidation evidence before writing;
9. use historical SHAs, branches, PRs, reports, or chat claims only as search hints until re-correlated against current repository state.

## 3. Material-content extraction contract

The source chat is evaluated for all materially relevant content, including:

- Human/Owner decisions;
- vision and mission;
- tasks and work packages;
- priorities;
- architecture decisions;
- security, data-integrity, and mutation boundaries;
- dependencies and owner handoffs;
- tests, checks, and evidence;
- blockers;
- exit gates;
- next steps;
- relevant automations and watches.

Each material item is classified as exactly one of:

- `FULLY_CONTAINED`;
- `PARTIALLY_CONTAINED`;
- `NOT_CONTAINED`;
- `DONE_MAIN`;
- `SUPERSEDED`;
- `OBSOLETE`;
- `EXTERNAL_ONLY`;
- `REQUIRES_CORRELATION`.

## 4. Write boundary

Only `PARTIALLY_CONTAINED` or `NOT_CONTAINED` material may be added, and only when it belongs to the same Documentary consolidation scope. After every write, the written branch content must be read again and verified.

Independent implementation, a new Governance scope, or work owned by another Primary Owner must not be implemented in PR #900. Such content may only be preserved as an owner-correct Work Package, dependency, blocker, or handoff.

The following execution constraints are explicit:

- do not create a new branch;
- do not create a new Pull Request;
- continue using PR #900 and `agent/documentary-chat-workpackage-consolidation-20260913`;
- do not merge PR #900;
- do not perform runtime, application, or production mutations;
- do not create semantic duplicates;
- do not treat `NOT_RUN` as `PASS`;
- do not delete the chat from the agent side.

## 5. Deterministic closure gate

`SAFE_TO_DELETE` is allowed only if all of the following are true:

- `unique_content_not_yet_preserved == NONE`;
- every still-valid material item is preserved either in current `main` or on the PR #900 branch;
- every write performed during the closure run has been re-read and verified;
- no Human/Owner decision remains only in the chat;
- no materially relevant dependency or owner handoff remains only in the chat.

Otherwise the result is `NOT_SAFE_TO_DELETE`.

Required Human-facing terminal wording for a successful closure:

> `SAFE_TO_DELETE — Der materiell relevante Inhalt dieses Chats ist vollständig repository-seitig erhalten. Der Chat kann durch den Human gelöscht werden.`

Required Human-facing terminal wording for an unsuccessful closure:

> `NOT_SAFE_TO_DELETE — Dieser Chat enthält noch nicht vollständig erhaltenen materiellen Inhalt. Fehlende Inhalte beziehungsweise Owner-Handoffs müssen zuerst gesichert werden.`

## 6. Required closure report fields

Every completed run reports:

- `source_chat`;
- `current_main_sha`;
- `Current_Project`;
- `Current_Project_Folder`;
- `Primary_PVC`;
- `Primary_Owner`;
- `neu_übernommene_Inhalte`;
- `bereits_erhaltene_Inhalte`;
- `offene_Inhalte`;
- `branch_head_nach_update`;
- `PR_900_Impact`;
- `unique_content_not_yet_preserved`;
- `closure_decision`.

## 7. Correlation result for this preservation pass

At the start of this pass:

- current `main` was `91818c23038e0f4d516b1ce1a26ae0d3962b24c7`;
- PR #900 was open, not merged, and targeted `main` from `agent/documentary-chat-workpackage-consolidation-20260913`;
- the pre-write PR head was `1347f82816fd082b42814bfdcd042472c7737cf1`;
- PR #900 was the only open Pull Request returned by the current repository PR correlation;
- the Documentary mapping resolved to `CAPITAL-AI-DOC / docs/projects/documentary/ / PVC-03 / CAPITAL-AI-DOC`;
- the existing master consolidation already preserved the broad source-chat closure flow, but the stricter `SAFE_TO_DELETE` gate, explicit PR-900 reuse rule, write-classification boundary, and required output-field contract were only partially represented.

This file preserves that missing semantic delta without changing foreign-owner implementation or authority.