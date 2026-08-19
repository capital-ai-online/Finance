# 🔌 Deactivated & Archived Modules Register

Keep track of deactivated/archived features for subsequent reactivation phases.

## 📋 Deactivated Elements

### 1. Value-at-Risk (VaR) Risiko-Assessment
- **Component**: `RealTimeRiskAssessment.tsx`
- **Description**: Historical and Monte-Carlo Value-at-Risk simulation workbench.
- **Status**: Archived and runtime-disabled. The former implementation remains recoverable through Git history; the live component is an API-compatible null stub and exposes no PDF/export side effects.
- **Reactivation gate**: Any future implementation must use `src/platform/PdfReporting/pdfBrand.ts` for PDF brand/metadata and requires a dedicated architecture decision before runtime activation.

### 2. Quantum Interact Workspace (Modul 2)
- **Component**: `InteractModule.tsx`
- **Description**: Real-time collaborative agent-to-agent workspace.
- **Status**: Archived (Deactivated per user instructions, code preserved as inactive asset).
