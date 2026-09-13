# CAPITAL-AI — Source Chat Closure Evidence: CHAT-006 Plugins & Open-Source Tools

**Source chat:** `CHAT-006 — 2026-09-07 — Plugins und Open Source Tools Trend`  
**Correlation date:** `2026-09-13`  
**Current-main baseline:** `91818c23038e0f4d516b1ce1a26ae0d3962b24c7`  
**Consolidation branch:** `agent/documentary-chat-workpackage-consolidation-20260913`  
**Pull Request:** `#900`  
**Owning preservation surface:** `CAPITAL-AI-DOC / PVC-03`  
**Role:** documentary preservation / source-chat closure evidence; non-authorizing

## 1. Scope and authority boundary

This file preserves the still-material semantic payload from CHAT-006 after correlation against current `main`, `/AGENTS.md`, the canonical Project/PVC mapping, the CAPITAL-AI-DOC project surface and the existing PR #900 consolidation artifact.

It does not authorize installation, connection, enablement, permission changes, architecture replacement, runtime deployment, production mutation or adoption of any named external tool. Tool selection and implementation remain with the canonical Primary Owner and applicable ADR/ESS/CTRL/AUTH contracts. External pricing and trend observations are advisory and time-sensitive.

## 2. Current project resolution

- Current Project for preservation: `CAPITAL-AI-DOC`.
- Current Project Folder: `docs/projects/documentary/`.
- Primary PVC: `PVC-03 — Documentary Engine`.
- Primary Owner: `CAPITAL-AI-DOC`.
- Foreign-owner implementation routes identified by the chat: primarily `CAPITAL-AI-OPS` for runtime/gateway/production capabilities, `CAPITAL-AI-GOV` for policy/governance implications, `CAPITAL-AI-SEC` for security assessment, and `CAPITAL-AI-QM` for CI/evidence implications.
- Applicable reuse boundary: `/AGENTS.md` section 11 requires evaluation in order: repository/native capability → already-connected suitable capability → specialized plugin → maintained/security-reviewed/license-compatible open source → custom implementation only if needed.
- Applicable plugin boundary: `/AGENTS.md` `CTRL-SDLC-PLUGIN-USE-001`; availability does not grant authority and external integration mutations require separate explicit Human/Owner authorization.
- Relevant enterprise contract projection: `ESS-0001-CONTRACTS` Chapter 13 defines Enterprise Plugin & Extension contracts; Documentary Roadmap `WP-DOC-16` explicitly requires reuse/security/ownership correlation and forbids creating a parallel plugin framework.

## 3. Material chat content preserved

### 3.1 Selection criteria

The chat established a reusable evaluation frame for external tools/plugins:

1. distinguish true open source / self-hostable software from Open Core, source-available and SaaS/Freemium offerings;
2. distinguish a free ChatGPT/plugin connector from the pricing of the external service behind it;
3. evaluate not only license price but operational cost surfaces such as LLM tokens, GPU/CPU compute, database/storage, telemetry ingestion/retention, egress, CI minutes, seats and metered workflow executions;
4. prefer capabilities that strengthen provider neutrality, observability/evidence, least privilege, reproducibility and owner-correct automation instead of introducing parallel authority or duplicate runtime architecture;
5. treat public pricing and trend signals as advisory snapshots requiring re-verification before procurement or architectural adoption.

### 3.2 Open-source / self-hostable candidates identified

The chat identified the following maintained open-source or self-hostable candidates as evaluation targets, not adoption decisions:

- `LiteLLM` — provider-neutral multi-LLM gateway/control-plane candidate; software can be self-hosted, while underlying model/provider usage remains separately chargeable.
- `Langfuse` — LLM/agent tracing, evaluation and observability candidate; self-hosting shifts cost to database/storage/compute instead of eliminating operational cost.
- `OpenTelemetry` — vendor-neutral telemetry collection/instrumentation; backend ingestion, storage and retention remain a material cost surface.
- `OPA` — Policy-as-Code candidate.
- `OpenFGA` — fine-grained/relationship-based authorization candidate.
- `Trivy` — vulnerability/SBOM/secret/IaC scanning candidate.
- `zizmor` — GitHub Actions security analysis candidate.
- `Argo CD` — GitOps candidate.
- `Argo Rollouts` — progressive delivery/rollback candidate.
- `KEDA` — event-driven autoscaling candidate.
- `Crossplane` — declarative infrastructure/control-plane candidate; provisioned cloud infrastructure remains chargeable.
- `Temporal` self-hosted — durable workflow execution candidate; managed Temporal Cloud is a separate paid service.
- `Ollama`, `llama.cpp`, `vLLM` — local/private inference candidates; software licensing does not remove hardware/GPU/electricity/model-license costs.
- `Dify` and `Open WebUI` — self-hostable AI/agent/UI candidates requiring license/branding/commercial-use review before productive use.

The chat's architecture-oriented shortlist ranked the combination `LiteLLM + OpenTelemetry/Langfuse + OPA/OpenFGA + Trivy/zizmor + Argo/KEDA + MCP-compatible tool boundaries` as particularly relevant for future owner-specific evaluation. This is advisory only and does not supersede existing CAPITAL-AI runtime or governance architecture.

### 3.3 Plugin/SaaS candidates and cost-risk classification

The chat identified these ChatGPT/plugin or SaaS candidates for cost-aware evaluation:

- `aictrl.dev` — governed engineering workflows, evidence and approval gates; technically close to CAPITAL-AI's branch/validation/approval workflow but not a replacement for repository authority. At the time of the chat, the connected account exposed no published workflows. Public pricing observed in the chat was trial/seat/execution based; therefore classify as a metered-cost candidate requiring budget and lock-in review before deeper use.
- `Tavily AI` — web/research/RAG infrastructure; Freemium usage can become metered with automated search/crawl volume.
- `AgentMail` — agent inbox/email infrastructure; Freemium limits exist and higher usage/storage/inbox counts can become paid.
- `Brainbase MCP` — managed agent/MCP orchestration; connector/code availability does not imply free hosted executions, evaluations or schedules.
- `GitHub` — free/paid boundaries depend on plan, private Actions minutes, runners, artifacts, storage and Enterprise features.
- `Supabase` — Free tier useful for low-volume development; production cost can scale with DB, storage, MAU, egress and add-ons.
- `Render` — free resources are development/preview oriented and materially constrained for persistent production workloads.
- `Notion` — free base product differs from AI/agent functionality and its credit/plan model.
- `Stripe` — standard integration has transaction-based and product-specific usage charges rather than being cost-free.
- `Aiera`, `Datarails`, `InfiniteWatch` — treated as commercial/enterprise candidates where a durable broad free tier was not established in the chat; procurement must re-check current official terms.

### 3.4 Cost-control conclusion

The durable conclusion from the chat is not a fixed price table. The owner-relevant rule is:

> `free software != free production operation` and `free connector != free external service`.

For future evaluation, total cost must include at least software/license, seats, metered executions, model/API tokens, compute/GPU, DB/storage, telemetry retention, CI minutes, network egress, backup/HA and operational maintenance.

Where equivalent capability can be obtained through existing CAPITAL-AI/native functionality or maintained self-hosted open source without increasing security/operations risk, that option should be assessed before paid SaaS or custom implementation, consistent with the current Trust Root reuse order.

## 4. Human/Owner decisions and mutations from the source chat

- No Human/Owner decision in CHAT-006 authorized repository adoption or implementation of any listed tool.
- During the chat, `aictrl.dev` became connected in the ChatGPT execution environment. This is an external execution-host state, not repository authority and not an authorization to add it to CAPITAL-AI runtime architecture.
- Read-only inspection found one accessible personal aictrl.dev organization and **zero published workflows** at that time. No workflow was started, approved, cancelled or mutated.
- No repository runtime, production, IAM, billing, security-control or data mutation was authorized or performed by the source-chat research itself.

## 5. Classification against current repository state

| Material content | Classification | Reason |
|---|---|---|
| Reuse-order / least-privileged plugin evaluation | `DONE_MAIN` | Current `/AGENTS.md` sections 6 and 11 already contain the governing reuse/plugin boundary. |
| Documentary plugin-extension boundary | `DONE_MAIN` | `docs/projects/documentary/ROADMAP.md` WP-DOC-16 already requires reuse/security/ownership correlation and ESS-0001 consumption. |
| Generic CHAT-006 topic and cost/license objective | `PARTIALLY_CONTAINED` before this file | PR #900 consolidation already listed CHAT-006, but retained only the abstract cost/license-classification goal. |
| Concrete OSS/self-hostable candidate set and cost-surface model | `NOT_CONTAINED` before this file → `FULLY_CONTAINED` here | No current-main or PR #900 evidence found containing the concrete candidate matrix and operational-cost distinction. |
| aictrl.dev connected-state observation and zero published workflows | `NOT_CONTAINED` before this file → `FULLY_CONTAINED` here | Execution-host observation was unique to the source chat; preserved as non-authorizing evidence. |
| Exact public prices/free-tier numbers quoted in the chat | `EXTERNAL_ONLY` / time-sensitive | Prices are advisory snapshots and must be re-verified from official sources before future decisions; they are intentionally not promoted to repository requirements. |
| Recommendation to adopt/implement any named tool | `REQUIRES_CORRELATION` | No adoption authority exists in this chat; any implementation belongs to the applicable owner Roadmap/ADR/ESS process. |

## 6. Dependencies and owner handoffs

- `CAPITAL-AI-OPS`: evaluate runtime/gateway/observability/deployment candidates only when an OPS Roadmap item requires the capability.
- `CAPITAL-AI-GOV`: assess policy/authorization tooling only if a material governance architecture decision is proposed; external tools do not become authority.
- `CAPITAL-AI-SEC`: license/security/supply-chain assessment for any candidate entering productive scope.
- `CAPITAL-AI-QM`: CI/security scanners and evidence tooling only through current PR-class/check contracts.
- `CAPITAL-AI-DOC`: preservation only; no foreign-owner implementation under PR #900.

## 7. Tests, checks and evidence

Performed for this closure pass:

- current `main` SHA resolved: `91818c23038e0f4d516b1ce1a26ae0d3962b24c7`;
- `/AGENTS.md@current-main` fully read;
- `docs/projects/README.md` and `docs/projects/PROJECT_VALUE_CHAIN.md` read;
- `CAPITAL-AI-DOC` README and Roadmap read;
- relevant `ESS-0001-CONTRACTS` plugin/extension projection resolved;
- open PRs checked: PR #900 was the only open PR at correlation time;
- existing PR #900 branch and consolidation document read;
- repository search found no current-main occurrence of the concrete candidate set (`LiteLLM`, `Langfuse`, `OPA`, `OpenFGA`, `Trivy`, `zizmor`, `aictrl.dev`) sufficient to preserve this source-chat payload.

Not run / not claimed:

- no application build, TypeScript, unit/integration, security scanner or production check was run for this documentation-only preservation pass;
- no such check is reported as PASS.

## 8. Source-chat closure decision

After creation and verification of this evidence on the existing PR #900 branch, the source chat is eligible for `SAFE_TO_DELETE` only if the file remains present on the branch and no write-verification failure occurs.

Closure invariants:

- unique material content not yet preserved: `NONE`;
- Human/Owner decision remaining only in chat: `NONE`;
- relevant dependency remaining only in chat: `NONE`;
- foreign-owner implementation copied into PR #900: `NONE`;
- production/runtime mutation: `NONE`.

This closure decision permits the Human to delete the source chat; it does not delete the chat automatically and does not authorize merge of PR #900.
