# AIF-CORE Platform Backlog

This backlog tracks upcoming features, structural enhancements, and compliance audits for future versions of the platform.

---

## 📋 Open Items & Upcoming Tasks

### 🔒 Module 1 Refinement & Security (Target v0.5.1)
- [x] **Admin Authentication for Orchestrator Controls**: Introduce a secure passcode or token-based header requirement for `/api/orchestrator/config` and `/api/orchestrator/reset`.
- [x] **Data Pipeline Encryption**: Ensure local storage and session parameters are sealed using AES-GCM when persistent database connections are offline.
- [x] **Exclusive Owner Admin Page (Sven Kulessa)**: Created a highly polished, interactive Admin Dashboard with Recharts telemetry, user privileges overriding, auto-router parameters tuning, and a planner for the future Investor/Employee subscription tier.

### 📈 Module 2 - Advanced Integration (Target v0.6.0)
- [ ] **Interact Workspace Habilitation**: Expand the playground and scenario matrix to support real-time cooperative trade simulations. (Status: Temporär deaktiviert nach Benutzeranweisung, Code und Layout sind archiviert im `InteractModule.tsx`)
- [x] **Model Auto-Routing Latency Checks**: Implement active ping counters to ensure the model router selects the fastest endpoint under 200ms.

### 🛡️ Deaktivierte & Archivierte Module (Spätere Reaktivierung)
- [ ] **Risiko-Assessment (VaR)**: Reaktivierung und Überarbeitung der Value-at-Risk Risiko-Zentrale (Variance-Covariance, Historisches Bootstrapping & Monte-Carlo Simulationen). Derzeit vollständig deaktiviert nach Benutzeranweisung (archiviert in `RealTimeRiskAssessment.tsx`).
- [ ] **Interact (Modul 2)**: Reaktivierung des interaktiven Quantum-Workspace-Playgrounds für kooperative Multi-Modell-Simulationen. Derzeit vollständig deaktiviert nach Benutzeranweisung (archiviert in `InteractModule.tsx`).

### 🇪🇺 Compliance & Accessibility (Ongoing)
- [x] **Section 508 & BFSG Accessibility Verification**: Complete full screen-reader and keyboard-navigation compatibility audits.
- [x] **GDPR / DSGVO Portability Export**: Allow registered users to download a structured JSON archive of their complete profile activity and backtest history.
