### CAPITAL-AI Enterprise Security Report
**Generated**: 2026-07-06T13:06:35.350Z
**Security Score**: 10/100

#### Key Audited Sections:
* **OWASP Top 10 Constraints**: Compliant. No raw user parameters evaluated unsafely.
* **Secret Leak Scanning**: No hardcoded API keys detected in active workspaces.
* **API Sandbox Isolation**: Handled securely on backend routers.

#### Security Remarks:
* **[Critical]** Potential Hardcoded Key Detected in `src/orchestrator/qualityGovernanceOrchestrator.ts`: File "src/orchestrator/qualityGovernanceOrchestrator.ts" appears to contain a hardcoded string layout representing an active third-party token or AI credential.
* **[Critical]** Potential Hardcoded Key Detected in `src/tests/orchestratorAgentBridge.test.ts`: File "src/tests/orchestratorAgentBridge.test.ts" appears to contain a hardcoded string layout representing an active third-party token or AI credential.
* **[Critical]** Potential Hardcoded Key Detected in `src/tests/qualityGovernanceOrchestrator.test.ts`: File "src/tests/qualityGovernanceOrchestrator.test.ts" appears to contain a hardcoded string layout representing an active third-party token or AI credential.
