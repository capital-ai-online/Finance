# Changelog - AIF-CORE

All notable changes to the AIF-CORE platform are documented in this file.

---

## [0.5.1] - 2026-06-30

### Added
- **Model Auto-Routing Latency Monitor**: Added an interactive, real-time telemetry card within the `OrchestratorPanel` frontend and backend (`/api/orchestrator/ping-models`) to check model response latencies, model costs, and dynamically display the optimal model routing selection under 200ms.
- **Data Pipeline Encryption**: Implemented a secure cryptographic utility (`src/lib/cryptoHelper.ts`) utilizing the Web Crypto API to perform robust PBKDF2/AES-GCM encryption and decryption. Sealed the persistent user profile data stored in `localStorage` securely.

### Security & Hardening
- **Admin Authentication for Orchestrator Controls**: Secured `/api/orchestrator/config` and `/api/orchestrator/reset` routes on the Node.js Express server with a header-based `X-Orchestrator-Admin-Token` check. Integrated an elegant admin passcode input within the tuner panel.

## [0.5.0] - 2026-06-30

### Added
- **Developer Directives (`AGENTS.md`)**: Set up a global agent and developer rule file at the repository root to enforce strict data integrity, zero-breach access controls, PII masking, and unified version standards across all present and future modules.
- **Repository Backlog (`/backlog`)**: Created a dedicated backlog folder to organize and track outstanding features, refinements, and module expansions.

### Fixed
- **Custom Market Screener Crash**: Resolved a critical layout/display rendering issue in the `MarketScreener` component by adding defense checks for non-array responses from the `/api/market-data` endpoint.
- **Missing State Dependency**: Fixed a bug where selecting a specific tech category (Anwendungsbereich) did not trigger re-filtering of assets in the Market Screener by adding `areaFilter` to the `useMemo` dependency array.

### Removed / Deactivated
- **Interact-Workspace Menu Item**: Fully removed the temporarily deactivated "Interact (Modul 2)" tab from the main and smartphone sidebars as per user instructions. Added deactivation disclaimers in `InteractModule.tsx` code comments and registered restoration tasks in `/backlog/backlog.md`.
- **Risikoassessment Module & Menu Item**: Fully deactivated the "Risiko-Assessment (VaR)" tab and removed it from the menu systems. Replaced active view instantiation in `Dashboard.tsx` with a secure, informative deactivation notice card. Added clear deactivation remarks in `RealTimeRiskAssessment.tsx` code comments and preserved details in the `/backlog/backlog.md`.
- **Smartphone-Optimized Sidebar Scroll**: Made the slideout drawer menu smartphone-friendly by wrapping the entire upper navigation layout inside a flex-scrollable container (`flex-1 overflow-y-auto`) with custom sleek scrollbar metrics, allowing seamless scrolling on small smartphone viewports while the action footer remains anchored at the bottom.Bitte wieder integrieren . nötig fallss die sidebar zu viele Reiter hat . auf dem Smartphone kommt sonst kein Logout Button mehr und man kommt nicht mehr zurück auf die letzte Seite.

### Security & Hardening
- **IP Address Privacy Masking**: Hardened client privacy on the Requests Orchestrator endpoints by introducing automatic IPv4 and IPv6 masking. Direct IP addresses are now anonymized (e.g., `192.168.1.***` and `2001:db8::***`) before exposure in the telemetry stats API.
- **Legacy Version Cleanup**: Removed old, inconsistent development versioning indicators (e.g., Version 1.0.0, Version 7.5) across all files, establishing a clean platform baseline at **Version 0.5.0**.
- **Metadata Standardization**: Pinned version to `0.5.0` inside the platform `metadata.json` and footer security badge.
