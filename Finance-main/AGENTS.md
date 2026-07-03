# AIF-CORE Developer and AI Agent Directives

This document contains persistent rules, architectural standards, and data integrity mandates that apply to all current and future modules, components, and backend logics of the AIF-CORE platform.

---

## 🛡️ Critical Directive: Zero-Breach Data Integrity & Access Habilitation

All modules, components, and backend systems MUST enforce the following core directives:

1. **Strict Data Integrity (Datenintegrität)**:
   - **No Fake or Mock Data**: Under no circumstances should fake, placeholder, or simulated data be served to users when real-time or persistent data is expected. All financial, scoring, and market insights must derive from active APIs or authenticated databases.
   - **Defensive API Contracts**: All API responses must be validated upon receipt. Do not assume any response is an array or object of correct shape without checking `Array.isArray()` or proper structural type guards. Handle exceptions gracefully without crashing components.
   - **Type-Safe Pipelines**: Always use strict TypeScript typings (`src/types.ts`) to validate data models before executing business or quantitative logic.

2. **Harded Data Access Control & Privacy**:
   - **Anonymization & Masking**: Personally Identifiable Information (PII) including client IP addresses, emails, and transaction IDs MUST be masked, obfuscated, or anonymized in all public, semi-public, or diagnostic logs.
   - **Secure Control Loops**: Admin-level endpoints, telemetry statistics, or system configuration parameters (such as Request Orchestrator configuration endpoints) must be secured and not accessible to unauthorized users.
   - **Strict Scope Separation**: Different user types (Guests vs. Registered/Subscribed) must be routed dynamically without leak of enterprise premium data.

3. **No Legacy Versioning (Anti-Legacy Noise)**:
   - All references to legacy development versions (such as v7.5, v1.0.0, etc.) are deprecated.
   - The platform version is strictly pinned to **Version 0.5.0** (Beta-Phase) to represent the current unified release. No other versions should be displayed in user-facing components unless officially logged in the backlog.

---

## 🧩 Architectural Guidelines

- **Mobile First with Desktop Precision**: Maintain visual excellence with dark glassmorphism, precise grids, and immediate visual responses on any viewport size.
- **Model-Independent Auto-Router**: Keep backend calls generic. The platform can route requests across different LLMs dynamically based on task and DSGVO/compliance rules.
