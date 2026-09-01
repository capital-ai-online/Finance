# CAPITAL-AI-SEC — Adversarial Assessment Skill Supply-Chain Review

**Date:** 2026-09-02  
**Project:** `CAPITAL-AI-SEC`  
**Scope:** External-skill/content pre-adoption review for `CAPITAL-AI-SECURITY-ASSESSMENT`  
**Decision:** METHOD-LEVEL REUSE ONLY — NO EXTERNAL SKILL INSTALLED OR EXECUTED

## 1. Review rule

External repositories and skill content are treated as untrusted inputs. This review does not import their authority, prompts, tool permissions, executable code, dependencies or runtime configuration into CAPITAL-AI.

Reuse order follows the current repository trust root: repository-native capability → connected platform/plugin capability → specialized plugin → security-reviewed/license-compatible OSS → custom implementation.

The resulting CAPITAL-AI skill therefore reuses `ESS-0006` and repository-native project/traceability contracts, then adopts only selected methodological concepts from reviewed external material.

## 2. Sources reviewed

### 2.1 OWASP Secure Agent Playbook / `security-guidance`

- **Maintainer / provenance:** OWASP project repository (`OWASP/secure-agent-playbook`).
- **License:** CC-BY-4.0 at repository level; third-party notices identify upstream OWASP standards with their own licenses.
- **Maintenance signal:** active 2026 repository with current issues/PR activity observed during review.
- **Dependencies / executable surface:** the specific `security-guidance` skill is principally procedural/reference content; the broader repository includes plugin packaging and reference datasets.
- **Network / secret access:** the reviewed guidance does not require credential access to apply ASVS guidance; broader plugin behavior remains outside this adoption.
- **Prompt-injection surface:** normal risk from any externally authored instruction corpus; content is not granted authority and is not copied wholesale.
- **Tool permissions / destructive capability:** no external tool permission is adopted.
- **Scope / authorization enforcement:** strong security-first guidance, but CAPITAL-AI's own target-authorization and repository-governance gates remain controlling.
- **Evidence quality / reproducibility:** strong structured requirement mapping and finding discipline.
- **Adoption decision:** **ACCEPT method concepts** for standards mapping, explicit evidence, confidence and reproducibility. **DO NOT install/copy wholesale.**

### 2.2 Hermes Agent — `web-pentest`

- **Maintainer / provenance:** Nous Research (`NousResearch/hermes-agent`).
- **License:** MIT.
- **Maintenance signal:** actively maintained 2026 project and documentation.
- **Dependencies / executable surface:** large agent runtime with Python/CLI tooling and optional skill installation; substantially broader than the required CAPITAL-AI assessment contract.
- **Network / secret access:** an installed agent/pentest runtime can make network requests and may operate with credentials supplied by its environment.
- **Prompt-injection surface:** external skill instructions plus live web content can influence an agent unless isolated by host controls.
- **Tool permissions / destructive capability:** pentest tooling is capable of active network interaction and proof-based exploitation.
- **Scope / authorization enforcement:** documentation frames the skill as authorized pentesting, but repository-local CAPITAL-AI authorization gates are stricter and remain mandatory.
- **Evidence quality / reproducibility:** useful proof-based workflow and reporting concepts.
- **Adoption decision:** **REFERENCE ONLY** for structured web black-box workflow. **No runtime/plugin install and no inherited tool permissions.**

### 2.3 `securityfortech/hacking-skills`

- **Maintainer / provenance:** `securityfortech` GitHub repository; small public project observed during review.
- **License:** repository license could not be established with sufficient confidence from the reviewed public surfaces; therefore license status is treated as **UNRESOLVED for code/content reuse**.
- **Maintenance signal:** current 2026 public repository surface, but limited adoption/community signal compared with OWASP/Hermes.
- **Dependencies / executable surface:** collection contains offensive web, mobile, CI/CD and meta skills, including agents and skill-generation/self-improvement patterns.
- **Network / secret access:** techniques can drive active network and security testing; exact permissions depend on the execution host.
- **Prompt-injection surface:** high relative surface because skill content is explicitly intended to orchestrate offensive actions and includes meta skill generation/observation behavior.
- **Tool permissions / destructive capability:** potentially high depending on host tools; capability classes include recon, injection, authz and CI/CD attack techniques.
- **Scope / authorization enforcement:** not sufficient to replace CAPITAL-AI target authorization, foreign-system prohibition or protected mutation controls.
- **Evidence quality / reproducibility:** useful taxonomy and separation of web/mobile/authz/injection/logic domains.
- **Adoption decision:** **TAXONOMY REFERENCE ONLY.** No copied content or executable integration while license and deeper dependency/permission review remain unresolved.

### 2.4 Mobix — mobile pentest skill

- **Maintainer / provenance:** `blackfoxxx/Mobix`.
- **License:** MIT.
- **Maintenance signal:** active/recent 2026 public project surface observed during review, but very small public adoption signal.
- **Dependencies / executable surface:** substantial. Repository documents bootstrap installation plus Android pentest runtime using Frida, mitmproxy/Burp-compatible interception, scripts, dashboard and MCP control plane.
- **Network / secret access:** captures application/device traffic; broad capture can include non-target traffic if not tightly scoped.
- **Prompt-injection surface:** live application/network content and MCP-driven tooling create a significant untrusted-input surface.
- **Tool permissions / destructive capability:** interactive mode can perform active mobile instrumentation and traffic manipulation; unattended mode is documented as read-only constrained but still requires host trust.
- **Scope / authorization enforcement:** documentation explicitly requires signed authorization/rules of engagement and warns that traffic capture can be broader than the selected target.
- **Evidence quality / reproducibility:** useful candidate-vs-confirmed distinction, traffic evidence, IDOR/session/business-logic workflow and mobile attack-surface structure.
- **Adoption decision:** **REFERENCE ONLY** for mobile test taxonomy and candidate/confirmed evidence discipline. Do not run bootstrap/install, Frida, interception or MCP runtime as part of this work item.

## 3. Comparative risk decision

| Source | Provenance | License confidence | Executable/tool risk | Method value | Decision |
|---|---|---:|---:|---:|---|
| OWASP Secure Agent Playbook | High | High | Low-to-medium for reviewed guidance | High | Method concepts accepted |
| Hermes `web-pentest` | High | High | High if installed | High | Reference only |
| `securityfortech/hacking-skills` | Medium/low | Unresolved | High depending on host | Medium/high taxonomy value | Taxonomy only; no reuse of code/content |
| Mobix | Medium | High | Very high for installed runtime | High for Android methodology | Reference only |

## 4. Controls imposed on CAPITAL-AI skill

The CAPITAL-AI implementation deliberately does **not** inherit external executable behavior. It adds the following repository-native controls:

1. explicit authorization record before any active test;
2. assessment-only default;
3. explicit prohibited destructive/persistence/credential/DoS/secret-exfiltration behaviors;
4. exact target/snapshot evidence binding;
5. `CANDIDATE_FINDING` versus `CONFIRMED_FINDING` distinction;
6. `NOT_TESTED != PASS` and missing-evidence fail-closed semantics;
7. complete `PVC-01..PVC-18` scoring surface;
8. Primary Owner routing and `REFERRED_NOT_EXECUTED` for foreign productive remediation;
9. Human/Owner-only accepted-risk authorization;
10. independent Security verification before `VERIFIED`.

## 5. Final adoption decision

No external skill, plugin, bootstrap script, Python/JS component, MCP server or pentest runtime is installed, sourced or executed by this work item.

The new `CAPITAL-AI-SECURITY-ASSESSMENT` skill is a repository-native, non-authorizing methodology and evidence contract that references OWASP WSTG, MASVS, MASTG, ASVS and NIST SP 800-115 and uses external repositories only as reviewed methodological input.

Any later proposal to execute or vendor an external pentest runtime requires a separate dependency/security review, explicit target authorization, tool-permission analysis and the then-current repository gates.
