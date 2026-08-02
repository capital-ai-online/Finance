# 📋 CAPITAL-AI Modular Backlog Architecture

Welcome to the new modular backlog architecture for the CAPITAL-AI platform. By splitting the backlog into domain-specific registries, we prevent metadata noise and align future developmental sprints with high compliance, modular engineering, and production standards.

## 🗺️ Backlog Directory Structure

The backlog is organized into the following specialized registers:

1. **`01-core-system.md`**: Core system upgrades, model auto-router optimization, and telemetry logging improvements.
2. **`02-billing-stripe.md`**: Transition to Stripe Customer-ID & Supabase Auth UUID-based enterprise billing layer (removing Email-based identification completely).
3. **`03-compliance-security.md`**: DSGVO/GDPR export pipelines, PII masking, and multi-agent regulatory compliance tracking.
4. **`04-deactivated-modules.md`**: Specs and restoration guidelines for deactivated modules (e.g., VaR Risiko-Assessment, Quantum Interact Workspace).

---

## ⚡ Active Milestone: Version 0.6.5 (Production & Enterprise Hardening)
- All development tracks adhere strictly to the **Version 0.5.5 / 0.6.0** milestones.
- Strictly enforcing single-point security loops and isolated server modules.

### 🔎 Referenced Audit: ARCH-AUDIT-0005
See `docs/architecture/ENTERPRISE_FINTECH_SCREENING_GOVERNANCE_AUDIT.md` for the current
full status report and prioritized roadmap. One P0 remains open across two audit cycles
(AUD5-F-001, `src/components/AuditLogs.tsx:215-216`) — see `03-compliance-security.md`.
