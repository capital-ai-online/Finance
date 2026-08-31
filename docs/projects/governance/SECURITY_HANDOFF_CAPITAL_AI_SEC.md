# CAPITAL-AI-GOV — Inbound Security Handoff

**Source project:** `CAPITAL-AI-SEC`  
**Source PR:** `#631`  
**Merged main:** `b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6`  
**Target project:** `CAPITAL-AI-GOV`  
**Project stage:** `PVC-05 — Platform Director`  
**Target roadmap:** `docs/projects/governance/ROADMAP.md`  
**Role:** inbound execution projection — non-authorizing

This document carries the Security handoff into the CAPITAL-AI-GOV owner scope. It does not create a second Security, Governance, IAM, Secrets, Data, Scoring, EventMesh, Release or Production architecture. `/AGENTS.md`, the active Governance Control Catalog, accepted ADR/ESS authority, `PROJECT_VALUE_CHAIN.md` and `CROSS_PROJECT_HANDOFF_CONTRACT.md` remain controlling.

```yaml
prompt:
  id: "CAPITAL-AI-SEC-CROSS-PROJECT-HANDOFF"
  version: "1.0"
  repository: "SvenKulessa/Finance"

  source:
    project: "CAPITAL-AI-SEC"
    source_pr: 631
    merged_main: "b96cf9e32daf53037bf0e28bddfb3ef5dac7cac6"
    security_roadmap: "docs/roadmaps/CAPITAL_AI_SECURITY_ROADMAP.md"
    security_work_packages: "docs/roadmaps/work-packages/CAPITAL_AI_SECURITY_WORK_PACKAGES_2026-08-31.md"
    security_traceability: "docs/traceability/CAPITAL_AI_SECURITY_TRACEABILITY_MATRIX_2026-08-31.md"

  target_context:
    target_project: "CAPITAL-AI-GOV"
    target_project_folder: "governance"
    affected_pvc:
      - "PVC-05"
    security_findings:
      - "MFA/AAL lifecycle drift"
    target_roadmap: "docs/projects/governance/ROADMAP.md"

  purpose: >
    CAPITAL-AI-SEC informiert CAPITAL-AI-GOV über Security-Anforderungen,
    Findings und Verification-Gates, deren produktive Umsetzung oder
    fachliche Evidence in den Zuständigkeitsbereich dieses Primary Owners fällt.

  mandatory_precheck:
    - "aktuelle /AGENTS.md von main lesen"
    - "aktuellen main SHA bestimmen"
    - "offene Pull Requests prüfen"
    - "aktive Work Claims / Writer prüfen"
    - "Changed-File- und Semantic-Overlap prüfen"
    - "docs/projects/PROJECT_VALUE_CHAIN.md lesen"
    - "docs/projects/CROSS_PROJECT_HANDOFF_CONTRACT.md lesen"
    - "CAPITAL-AI-SEC Security Traceability gegen aktuellen main prüfen"
    - "betroffene PVC-Stufe und Primary Owner bestätigen"
    - "Authority-/ADR-/ESS-/Control-Konflikte prüfen"
    - "Reuse vor Neubau prüfen"

  security_boundary:
    security_owns:
      - "Security Requirement"
      - "Threat / Control Definition"
      - "Security Finding"
      - "Negative-Test-Erwartung"
      - "Security Verification"

    target_project_owns:
      - "produktive Implementierung im eigenen PVC-Scope"
      - "projektlokale technische Änderungen"
      - "Runtime-/Provider-Evidence, soweit der Target Owner dafür zuständig ist"
      - "eigene Roadmap- und Work-Package-Integration"

    security_does_not_own:
      - "produktive Target-Project-Implementierung"
      - "Target-Project Roadmap Authority"
      - "Production Deployment Authority"
      - "Accepted Risk Authority"
      - "fremde PVC-Stufen"

  execution_rules:
    - >
      Security-Anforderung nicht als implizite Übertragung von
      Domain- oder PVC-Ownership interpretieren.
    - >
      Keine zweite Security-, Governance-, IAM-, Secrets-, Data-,
      Scoring-, EventMesh-, Release- oder Production-Architektur erzeugen.
    - >
      Bestehende Security Controls, Middleware, Authorities, ADRs,
      ESS und Tests wiederverwenden.
    - >
      Fehlende oder widersprüchliche Authority, Identity oder Evidence
      bleibt fail-closed.
    - >
      HIGH/CRITICAL geschützte Änderungen behalten alle bestehenden
      Human/Owner-Gates.
    - >
      Kein Agent darf Accepted Risk selbst genehmigen oder eine eigene
      Implementierung selbst auf Security VERIFIED/CLOSED setzen.
    - >
      Produktive Mutationen erfolgen ausschließlich über die bestehende
      Target-Project-/Operations-/Owner-Authority.

  required_handoff_record:
    compatibility_marker: "[SECURITY_HANDOFF -> CAPITAL-AI-GOV | VC-05]"
    repository_marker: "[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]"
    required_fields:
      project_namespace: "PVC"
      project_stage: "PVC-05"
      target_project: "CAPITAL-AI-GOV"
      task: "Governance-seitigen MFA/AAL-Lifecycle-Drift gegen bestehende Identity-/Owner-Gates korrelieren und erforderliche PVC-05-Remediation bzw. Evidence liefern."
      reason: "Identity-Assurance-Lifecycle-Drift kann Governance-Gates und Security-Verifikation semantisch auseinanderlaufen lassen."
      dependency: "CAPITAL-AI-SEC Traceability sowie bestehende Governance Authority-, ADR-, ESS-, Control- und Identity-Lifecycle-Verträge."
      required_evidence: "Exact-Candidate Governance-Diff, Authority/ADR/ESS/Control-Korrelation, positive und negative Lifecycle-/Gate-Nachweise und dokumentierte Restabhängigkeiten."
      verification_gate: "CAPITAL-AI-SEC independent verification"
      status: "REFERRED_NOT_EXECUTED"

  implementation_flow:
    - >
      Security Finding gegen aktuellen main und Target Scope verifizieren.
    - >
      Security-Abhängigkeit in der kanonischen Target-Roadmap bzw.
      im zuständigen Work Package referenzieren.
    - >
      Falls technische Remediation erforderlich ist, einen Target-Project-
      eigenen Work Claim und einen regelkonformen Target-Project-Branch verwenden.
    - >
      Nur Dateien ändern, die tatsächlich zum Primary-Owner-Scope gehören.
    - >
      Zielgerichtete positive und negative Security-Tests ausführen.
    - >
      Exact-Candidate- bzw. Runtime-Evidence erfassen.
    - >
      Evidence an CAPITAL-AI-SEC zurückgeben.
    - >
      CAPITAL-AI-SEC entscheidet anschließend unabhängig über
      Security VERIFIED/CLOSED.

  cross_domain_rule: >
    Wird während der Umsetzung festgestellt, dass ein Teil der Remediation
    einem anderen Primary Owner gehört, diese Arbeit nicht lokal übernehmen.
    Stattdessen einen separaten Cross-Project-Handoff erstellen und die
    fremde Implementierung dort als REFERRED_NOT_EXECUTED belassen.

  required_return:
    marker: "[SECURITY_HANDOFF_RETURN -> CAPITAL-AI-SEC]"
    fields:
      - "source_security_finding"
      - "target_project"
      - "project_stage"
      - "implementation_status"
      - "changed_files"
      - "candidate_sha"
      - "runtime_sha_if_applicable"
      - "security_tests"
      - "negative_tests"
      - "evidence_paths"
      - "known_residual_risk"
      - "unresolved_dependencies"
      - "verification_requested"

  completion_rule: >
    CAPITAL-AI-GOV darf IMPLEMENTED bzw. EVIDENCE_READY melden.
    Security VERIFIED oder CLOSED wird erst durch CAPITAL-AI-SEC nach
    unabhängiger Prüfung der zurückgelieferten Evidence gesetzt.

  merge_boundary:
    direct_main_edit: false
    human_codeowner_merge_only: true
    autonomous_production_mutation: false
```

## Current handoff record

- **security_marker:** `[SECURITY_HANDOFF -> CAPITAL-AI-GOV | VC-05]`
- **repository_marker:** `[CROSS_PROJECT_HANDOFF -> CAPITAL-AI-GOV | VC-05]`
- **project_namespace:** `PVC`
- **project_stage:** `PVC-05`
- **target_project:** `CAPITAL-AI-GOV`
- **task:** correlate the MFA/AAL lifecycle mismatch against current Governance identity/Owner gates and produce target-owned remediation/evidence only where PVC-05 authority applies.
- **reason:** inconsistent MFA/AAL lifecycle semantics can create ambiguity between Governance approval state and Security assurance expectations.
- **dependency:** Security traceability from PR #631 plus current Governance Authority/ADR/ESS/Control contracts.
- **required_evidence:** exact-candidate changed-file set, authority correlation, targeted positive and negative lifecycle/gate evidence, residual risk and unresolved dependency record.
- **verification_gate:** `CAPITAL-AI-SEC independent verification`.
- **target_roadmap_reference:** `docs/projects/governance/ROADMAP.md`.
- **status:** `REFERRED_NOT_EXECUTED`.

## Boundary

CAPITAL-AI-GOV may later report `IMPLEMENTED` or `EVIDENCE_READY` for its own PVC-05 work. Only CAPITAL-AI-SEC may set the Security finding to `VERIFIED` or `CLOSED` after independent evidence review. Accepted Risk remains Human/Owner authority and is never agent self-approved.
