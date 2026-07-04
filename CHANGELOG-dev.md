# Changelog-dev: CAPITAL-AI Developer Logs

All updates, workarounds, and environmental parameters for local and Cloud Run container execution are logged here.

---

## [0.6.0-dev] - 2026-07-04

### Added
- **Kraken Pro Referral Card**: Added custom visual cards displaying the partner referral text and outbound action buttons inside `Dashboard.tsx` and `ImpressumAgb.tsx`.
- **Real-Time Push-Up Notifications**: Added `Watchlist.tsx` for real-time asset monitoring, connected it to the `RealtimeAiNewsfeed` update loop, and implemented low-latency synthesizer alerts via the standard browser `AudioContext` interface.

### Changed
- **Modul 1 Designation Removal**: Completely removed all visible, literal, and comment mentions of "Modul 1" or "Module 1" across the application files (`Dashboard.tsx`, `CapitalAiLogo.tsx`, `LandingPage.tsx`, `GuestCliffhangerModal.tsx`, `RawMaterialsDashboard.tsx`, `RealTimeRiskAssessment.tsx`). Rebranded modules/titles to either "CORE" or specific technical labels (e.g. "Rohstoff-Analyse").
- **Global Support E-Mail Integration**: Swapped support address to `support@capital-ai.online`. Added global header anchor in `Dashboard.tsx`, registered custom tooltip items in retractable drawer navigation, and appended styling blocks in footer.
- **Impressum Direct Contact update**: Adjusted contact state values inside `ImpressumAgb.tsx` to route business communications to `sven.kulessa@capital-ai.online`.

## [0.5.4-dev] - 2026-07-02

### Changed
- **Platform Version**: Updated version identifier across all user-facing pages, system documents, and export templates to **Version 0.5.4**.
- **Audit-Trail Box Removal**: Removed the "Audit-Trail & Begründung" info box from the Crypto Scoring Enterprise overview per client request.

### Fixed / Ignored
- **Stripe & Supabase Environmental Variables**: Unset environment variables for Stripe and Supabase are gracefully ignored/bypassed in this development and preview sandbox. Mock state fallbacks and local context handling are leveraged for uninterrupted execution.
