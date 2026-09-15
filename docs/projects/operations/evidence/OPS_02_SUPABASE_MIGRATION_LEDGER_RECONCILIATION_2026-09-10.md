# OPS-02 — Supabase Migration Ledger Reconciliation

**Project:** `CAPITAL-AI-OPS`  
**Project folder:** `docs/projects/operations/`  
**Primary PVC:** `PVC-02 — Controlled Implementation`  
**Primary Owner:** `CAPITAL-AI-OPS`  
**Repository baseline:** `main@256f02ce2972d8432ad02e8fd8bceba907475efb`  
**Supabase project:** `ryzywoktpmyhwzxmstyu`  
**Mode:** repository-only reconciliation; provider read-only  
**Date:** `2026-09-10`  
**Status:** `EVIDENCE_READY / PROVIDER_REPAIR_NOT_AUTHORIZED`

## 1. Purpose

This bounded slice reconciles the production Supabase migration-history inventory against the migration files present in the exact current-main repository baseline. It does not execute DDL, apply a migration, edit `supabase_migrations.schema_migrations`, run `migration repair`, change provider configuration, or mutate Production.

The machine-readable source of truth for this reconciliation is:

`docs/projects/operations/controlled-implementation/OPS_02_SUPABASE_MIGRATION_LEDGER_RECONCILIATION.json`

The repository guard is:

`scripts/governance/verifySupabaseMigrationLedgerReconciliation.mjs`

and is covered by:

`scripts/pr/supabaseMigrationLedgerReconciliation.test.mjs`.

## 2. Correlation

- `/AGENTS.md` was resolved from exact `main@256f02ce2972d8432ad02e8fd8bceba907475efb` before this work item.
- Current project/PVC mapping resolves this slice to `CAPITAL-AI-OPS / PVC-02`.
- At the initial work-item correlation no open PR existed. During the session PR #879 opened under `CAPITAL-AI-SEC`; its Security-roadmap scope is file- and semantically disjoint from this OPS/Supabase ledger slice.
- The OPS branch is fresh from exact current main: `agent/operations-supabase-migration-ledger-reconciliation-20260910`.
- Existing FinTechCore migration-ledger recovery and `verifyFintechCoreMigrationLedger.mjs` are reused as narrower historical precedent; this slice does not replace their SQL-blob guard.

## 3. Current Supabase behavior used for classification

Current Supabase CLI documentation states that local migrations are represented by files under `supabase/migrations`, remote history is tracked in `supabase_migrations.schema_migrations`, and `migration list` compares migration timestamps to identify differences. `migration repair` changes the remote migration-history table by marking versions applied or reverted; it is therefore a provider mutation and is explicitly outside this branch.

No September-2026 Supabase breaking change was found that alters this migration-history/timestamp model. Current breaking changes in the reviewed changelog concern other surfaces such as Management API logs and extension-version pinning.

## 4. Classification policy

The reconciliation intentionally avoids semantic guesswork:

- `EXACT_MATCH`: remote version equals a current local migration timestamp; the normalized migration name also matches.
- `TIMESTAMP_ALIAS`: there is no exact timestamp match, but the remote migration name exactly equals the normalized current local migration filename; only the timestamp differs.
- `REMOTE_ONLY_HISTORY`: no current local migration has either the same timestamp or the same normalized migration name. A later catch-up/consolidated schema file may exist, but it is not promoted to an alias without exact migration-name identity.

This is deliberately conservative. It prevents a similarly themed migration from being falsely declared equivalent without content-level evidence.

## 5. Reconciliation result

| Metric | Result |
|---|---:|
| Remote migration versions | **70** |
| Current local SQL migrations | **53** |
| `EXACT_MATCH` | **15** |
| `TIMESTAMP_ALIAS` | **29** |
| `REMOTE_ONLY_HISTORY` | **26** |
| Unknown / unclassified remote versions | **0** |
| Current local migrations mapped by exact/alias identity | **44** |
| Current local-only migrations | **9** |

**Exit result:** every one of the 70 remote versions is assigned exactly one classification; unknown ledger gaps = `0`.

## 6. Complete remote mapping

| Remote version | Remote name | Classification | Current local |
|---|---|---|---|
| `20260709160230` | `subscriptions_allow_null_stripe_id` | `REMOTE_ONLY_HISTORY` | — |
| `20260709160236` | `fix_handle_new_user_trigger` | `REMOTE_ONLY_HISTORY` | — |
| `20260709160242` | `backfill_missing_profiles_and_subscriptions` | `REMOTE_ONLY_HISTORY` | — |
| `20260709160708` | `add_address_fields_to_profiles` | `REMOTE_ONLY_HISTORY` | — |
| `20260709205910` | `cleanup_users_and_set_enterprise` | `REMOTE_ONLY_HISTORY` | — |
| `20260709210142` | `add_email_column_to_subscriptions` | `REMOTE_ONLY_HISTORY` | — |
| `20260711031050` | `iam_foundation_v2_separate_column` | `REMOTE_ONLY_HISTORY` | — |
| `20260711031101` | `assign_owner_iam_role` | `REMOTE_ONLY_HISTORY` | — |
| `20260711103935` | `add_phone_identifier_for_break_glass` | `REMOTE_ONLY_HISTORY` | — |
| `20260711110308` | `phone_stepup_infrastructure` | `REMOTE_ONLY_HISTORY` | — |
| `20260712055148` | `create_security_events_log` | `REMOTE_ONLY_HISTORY` | — |
| `20260712055159` | `harden_security_events_grants` | `REMOTE_ONLY_HISTORY` | — |
| `20260714190146` | `add_totp_stepup_breakglass` | `REMOTE_ONLY_HISTORY` | — |
| `20260715014840` | `iam_access_log_add_context` | `REMOTE_ONLY_HISTORY` | — |
| `20260715055908` | `create_internal_user_lookup_view` | `REMOTE_ONLY_HISTORY` | — |
| `20260730173550` | `fix_sven_capitalai_subscription_tier` | `REMOTE_ONLY_HISTORY` | — |
| `20260730174158` | `fix_stripe_subscription_sync_trigger` | `REMOTE_ONLY_HISTORY` | — |
| `20260731091117` | `user_quota` | `TIMESTAMP_ALIAS` | `20260730000000_user_quota.sql` |
| `20260731091129` | `add_missing_service_role_rls_policies` | `TIMESTAMP_ALIAS` | `20260731000000_add_missing_service_role_rls_policies.sql` |
| `20260731091140` | `harden_handle_new_user_search_path` | `TIMESTAMP_ALIAS` | `20260731000100_harden_handle_new_user_search_path.sql` |
| `20260731091646` | `compliance_runs` | `TIMESTAMP_ALIAS` | `20260731000200_compliance_runs.sql` |
| `20260801122306` | `iam_access_log_context_repo_catchup` | `REMOTE_ONLY_HISTORY` | — |
| `20260801122318` | `security_events_stepup_totp_repo_catchup` | `REMOTE_ONLY_HISTORY` | — |
| `20260801143612` | `score_snapshots` | `TIMESTAMP_ALIAS` | `20260801143614_score_snapshots.sql` |
| `20260801171055` | `alert_subscriptions` | `TIMESTAMP_ALIAS` | `20260801171030_alert_subscriptions.sql` |
| `20260801174512` | `subscription_confirmations_sent` | `TIMESTAMP_ALIAS` | `20260801174455_subscription_confirmations_sent.sql` |
| `20260801220541` | `agent_evaluation_runs` | `TIMESTAMP_ALIAS` | `20260801220519_agent_evaluation_runs.sql` |
| `20260802164705` | `screening_slo_evidence` | `TIMESTAMP_ALIAS` | `20260802160000_screening_slo_evidence.sql` |
| `20260802172425` | `harden_stripe_function_search_paths` | `REMOTE_ONLY_HISTORY` | — |
| `20260804195902` | `issue_92_security_hardening` | `TIMESTAMP_ALIAS` | `20260804211000_issue_92_security_hardening.sql` |
| `20260804200909` | `issue_92_service_role_dml_grants` | `EXACT_MATCH` | `20260804200909_issue_92_service_role_dml_grants.sql` |
| `20260808090343` | `stripe_event_inbox` | `TIMESTAMP_ALIAS` | `20260808013000_stripe_event_inbox.sql` |
| `20260810003921` | `capability_grants` | `TIMESTAMP_ALIAS` | `20260810002100_capability_grants.sql` |
| `20260810003927` | `agent_action_approvals` | `TIMESTAMP_ALIAS` | `20260810002200_agent_action_approvals.sql` |
| `20260810172028` | `extend_iam_roles_for_ai_admin_control_plane` | `REMOTE_ONLY_HISTORY` | — |
| `20260811230540` | `m5_agent_audit_events` | `EXACT_MATCH` | `20260811230540_m5_agent_audit_events.sql` |
| `20260811230743` | `m5_agent_audit_events_least_privilege` | `EXACT_MATCH` | `20260811230743_m5_agent_audit_events_least_privilege.sql` |
| `20260814151417` | `purge_unused_break_glass_codes` | `TIMESTAMP_ALIAS` | `20260814151200_purge_unused_break_glass_codes.sql` |
| `20260814152303` | `registration_consent_log_and_mfa_enrollment` | `TIMESTAMP_ALIAS` | `20260814153000_registration_consent_log_and_mfa_enrollment.sql` |
| `20260814152341` | `user_consents_grants` | `TIMESTAMP_ALIAS` | `20260814153500_user_consents_grants.sql` |
| `20260814152556` | `rename_mfa_enrollment_required_to_onboarding` | `TIMESTAMP_ALIAS` | `20260814154500_rename_mfa_enrollment_required_to_onboarding.sql` |
| `20260814153521` | `mfa_required_account_last_factor_guard` | `TIMESTAMP_ALIAS` | `20260814160000_mfa_required_account_last_factor_guard.sql` |
| `20260814221830` | `outbox_jobs` | `TIMESTAMP_ALIAS` | `20260810160000_outbox_jobs.sql` |
| `20260815010000` | `seo_engine` | `EXACT_MATCH` | `20260815010000_seo_engine.sql` |
| `20260815200000` | `seo_engine_source_align_rls` | `EXACT_MATCH` | `20260815200000_seo_engine_source_align_rls.sql` |
| `20260815210000` | `seo_engine_service_role_grants` | `EXACT_MATCH` | `20260815210000_seo_engine_service_role_grants.sql` |
| `20260815220000` | `seo_rank_snapshots_fk_restrict` | `EXACT_MATCH` | `20260815220000_seo_rank_snapshots_fk_restrict.sql` |
| `20260817024129` | `m10_passkey_owner_enrollment` | `TIMESTAMP_ALIAS` | `20260817020000_m10_passkey_owner_enrollment.sql` |
| `20260817030342` | `m10_passkey_service_role_grants` | `TIMESTAMP_ALIAS` | `20260817030000_m10_passkey_service_role_grants.sql` |
| `20260818232108` | `privacy_governance_and_requests` | `TIMESTAMP_ALIAS` | `20260819010000_privacy_governance_and_requests.sql` |
| `20260819001943` | `ai_governance_evaluations` | `TIMESTAMP_ALIAS` | `20260819010800_ai_governance_evaluations.sql` |
| `20260819021420` | `m10_pr_ci_authorization` | `TIMESTAMP_ALIAS` | `20260819040000_m10_pr_ci_authorization.sql` |
| `20260819030221` | `m10_phase6_shadow_evidence` | `TIMESTAMP_ALIAS` | `20260819050000_m10_phase6_shadow_evidence.sql` |
| `20260819035020` | `supabase_advisor_policy_hardening` | `TIMESTAMP_ALIAS` | `20260819020000_supabase_advisor_policy_hardening.sql` |
| `20260819084254` | `privacy_retention_lifecycle_hardening` | `TIMESTAMP_ALIAS` | `20260819103000_privacy_retention_lifecycle_hardening.sql` |
| `20260819084451` | `privacy_retention_advisor_indexes` | `TIMESTAMP_ALIAS` | `20260819104500_privacy_retention_advisor_indexes.sql` |
| `20260821000550` | `fintech_core_durable_traceability` | `EXACT_MATCH` | `20260821000550_fintech_core_durable_traceability.sql` |
| `20260821000558` | `fintech_core_durable_traceability_least_privilege` | `EXACT_MATCH` | `20260821000558_fintech_core_durable_traceability_least_privilege.sql` |
| `20260821000716` | `fintech_core_fk_indexes` | `EXACT_MATCH` | `20260821000716_fintech_core_fk_indexes.sql` |
| `20260821003628` | `fintech_core_rpc_persistence_boundary` | `EXACT_MATCH` | `20260821003628_fintech_core_rpc_persistence_boundary.sql` |
| `20260821071823` | `fintech_core_paper_replay_reader` | `EXACT_MATCH` | `20260821071823_fintech_core_paper_replay_reader.sql` |
| `20260822012200` | `fintech_core_ft6b_fixed_point_reconciliation` | `EXACT_MATCH` | `20260822012200_fintech_core_ft6b_fixed_point_reconciliation.sql` |
| `20260826183019` | `f05_explicit_deny_policies_for_service_role_only_tables` | `REMOTE_ONLY_HISTORY` | — |
| `20260826213740` | `security_events_allow_honeytoken_touched` | `REMOTE_ONLY_HISTORY` | — |
| `20260827135000` | `fintech_core_ft6a_order_intent_reconciliation_ledger_recovery` | `EXACT_MATCH` | `20260827135000_fintech_core_ft6a_order_intent_reconciliation_ledger_recovery.sql` |
| `20260827201209` | `commodity_shadow_evidence` | `REMOTE_ONLY_HISTORY` | — |
| `20260827201328` | `commodity_shadow_evidence_explicit_deny_policy` | `REMOTE_ONLY_HISTORY` | — |
| `20260828143506` | `tighten_user_consents_policy_role` | `REMOTE_ONLY_HISTORY` | — |
| `20260901144312` | `retire_m10_passkey_authorization` | `EXACT_MATCH` | `20260901144312_retire_m10_passkey_authorization.sql` |
| `20260905103413` | `user_lifecycle_subscription_identity_authority` | `TIMESTAMP_ALIAS` | `20260901162000_user_lifecycle_subscription_identity_authority.sql` |

## 7. Current local-only migration inventory

These nine current repository migrations are not the target of any exact/alias remote row under the conservative identity policy. They are recorded so the set difference is explicit rather than silently ignored:

- `20260711000000_iam.sql`
- `20260731000300_iam_access_log_context.sql`
- `20260731000400_security_events_stepup_totp.sql`
- `20260801150000_social_media_publishing.sql`
- `20260802203000_extend_user_quota_entitlement_kinds.sql`
- `20260810110642_pdf_credit_ledger.sql`
- `20260815140000_social_media_content_approvals.sql`
- `20260901220000_owner_device_authorization.sql`
- `20260902000000_owner_device_authorization_atomic_activation.sql`

Their presence does not authorize pushing them. Pending/applied/schema equivalence is a separate deployment/provider gate.

## 8. Provider-repair boundary

No provider repair is justified or executed merely because timestamps diverge. Before any future `migration repair` or equivalent provider mutation, a separate bounded package must establish which history row is actually incorrect rather than merely different from the repository filename.

Any such package must be:

1. based on then-current main plus a fresh read-only remote ledger;
2. content/schema-aware, not timestamp-only;
3. minimal to the proven incorrect history rows;
4. separately and explicitly authorized as a provider/Production mutation;
5. followed by remote ledger readback and repository/remote re-verification.

The current classification therefore supports a repair decision without implicitly authorizing one.

## 9. Exit gate

- 70 remote versions inventoried: **PASS**.
- Every remote version classified exactly once: **PASS**.
- Exact matches: **15**.
- Timestamp aliases: **29**.
- True current-repository remote-only history rows: **26**.
- Unknown/unassigned ledger gaps: **0 / PASS**.
- Current local-only set explicitly recorded: **9 / PASS**.
- Provider mutation performed: **NO**.
- `migration repair` performed: **NO**.
- `apply_migration` / DDL performed: **NO**.
- Production schema changed: **NO**.

**Disposition:** repository-only reconciliation exit gate is met at the recorded baseline; any provider repair remains a separate explicit authorization gate.
