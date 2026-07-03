# Changelog-dev: AIF-CORE Developer Logs

All updates, workarounds, and environmental parameters for local and Cloud Run container execution are logged here.

---

## [0.5.4-dev] - 2026-07-02

### Changed
- **Platform Version**: Updated version identifier across all user-facing pages, system documents, and export templates to **Version 0.5.4**.
- **Audit-Trail Box Removal**: Removed the "Audit-Trail & Begründung" info box from the Crypto Scoring Enterprise overview per client request.

### Fixed / Ignored
- **Stripe & Supabase Environmental Variables**: Unset environment variables for Stripe and Supabase are gracefully ignored/bypassed in this development and preview sandbox. Mock state fallbacks and local context handling are leveraged for uninterrupted execution.
