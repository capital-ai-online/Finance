# Consent migration ledger reconciliation
Date: 2026-09-16
Owner: CAPITAL-AI-OPS / PVC-02; explicit Owner continuation of FE-CONSENT-V3 post-deployment work.
Main baseline: 7ff5a519e43c551e4bb07800c763f05e2bcbd45a

The Owner explicitly approved the production notice-version migration in the chat. Supabase apply_migration succeeded and registered privacy_notice_version_guard as 20260915235453. The repository migration is supabase/migrations/20260915172400_privacy_notice_version_guard.sql.
Readback of schema_migrations.statements matches the approved SQL; the active function uses 2026-09-15, retains OID 20778, invoker execution, search_path=public, pg_temp and one enabled trigger. No historical user evidence was updated.

The existing classification policy permits TIMESTAMP_ALIAS. This change records that mapping, refreshes the existing snapshot from 70 to 71 provider-read rows, removes this migration from local-only, and adjusts the snapshot-specific validator and test count. All previous 70 version/name pairs were unchanged. No production ledger row is renamed, deleted or reapplied.

Result: remote_total=71, exact_match=15, timestamp_alias=30, remote_only_history=26, unknown=0, local_total=54, mapped_current_local=45, local_only=9. This does not assert literal timestamp equality or classify unrelated local-only migrations as deployed.

Validation: node --test scripts/pr/supabaseMigrationLedgerReconciliation.test.mjs and the corresponding validator run in an isolated fixture containing current-main migration filenames. The validator only uses filenames, not SQL contents. No full application build or production mutation in this follow-up.
Coordination: current open PRs #952/#953 concern governance approval/freshness. Existing frontend-consent-main-projection changes only FE ROADMAP; this patch does not touch it. No second task registry or roadmap authority.

Browser follow-up: separate gpt-6-astra agent attempted documented browser recovery; a fresh tab was created, but navigation/DOM read failed with CDP refresh tabs timeout after 20000 ms. Save/reopen/reload/revoke remain BLOCKED, no consent actions performed. No background automation was created: available task API cannot enforce active Work usage plus Astra selection.
