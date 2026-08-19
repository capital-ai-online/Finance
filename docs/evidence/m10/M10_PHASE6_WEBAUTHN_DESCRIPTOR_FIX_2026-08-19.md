# M10 Phase 6 — WebAuthn Credential Descriptor Production Fix — 2026-08-19

Status: **FIX IMPLEMENTED — PR/CI/PRODUCTION RE-VERIFICATION PENDING**  
Authority: ADR-0066, ESS-0022, `docs/runbooks/M10_PASSKEY_OWNER_PR_AUTHORIZATION.md`  
Baseline: `main@5976e4d2eb1c0d11303322b027b8be42e261583a`

## 1. Production observation

During the first real Owner Phase-6 Shadow attempt against open probe PR #423, the browser rejected the authentication options before presenting the passkey ceremony with:

`CredentialsContainer.get: Missing required 'type' member of PublicKeyCredentialDescriptor.`

The failure occurred after the Shadow `/begin` path had returned browser authentication options. No real Shadow assertion was completed and no `APPROVED_SHADOW` evidence was produced by this failed attempt.

## 2. Root cause

`buildM10ShadowAuthenticationOptions()` manually constructs `PublicKeyCredentialRequestOptionsJSON` so the durable canonical M10 challenge is passed to the browser unchanged. The `allowCredentials` entries contained `id` and `transports` but omitted the WebAuthn credential descriptor field `type`.

The native browser WebAuthn API requires each `PublicKeyCredentialDescriptor` passed to `navigator.credentials.get()` to identify the credential type. The currently defined public-key credential type is `public-key`.

This was not a GitHub-token identity mismatch and not an Owner-account e-mail mismatch. CAPITAL-AI Owner authentication, the active enrolled Owner credential, and GitHub resolver setup are separate trust domains; the observed error was raised by the browser while validating the WebAuthn request options.

## 3. Fix

`server/m10/shadowAuthorizationRouter.ts` now:

- returns `Promise<PublicKeyCredentialRequestOptionsJSON>` explicitly;
- emits `type: 'public-key'` on every `allowCredentials` descriptor;
- keeps the canonical M10 challenge byte-string unchanged;
- keeps RP ID, timeout and required user verification unchanged;
- does not introduce Phase-5 consumption or GitHub Actions dispatch capability.

The explicit return type makes the browser-facing options structure a compile-time contract instead of an inferred object shape.

## 4. Regression coverage

`tests/unit/m10ShadowAuthorization.test.ts` now requires the exact descriptor:

- `id` equals the enrolled credential ID;
- `type` equals `public-key`;
- `transports` are preserved;
- challenge, RP ID, timeout and `userVerification='required'` remain unchanged.

Existing structural tests still prohibit Phase-5 consumption, GitHub Actions dispatch, and server-side authentication-option regeneration in the Shadow router.

## 5. Security / architecture impact

No trust boundary, authorization policy, database schema, credential material, GitHub permission, workflow, or CI-authority behavior changes.

The fix only makes the already-approved Shadow WebAuthn request standards-compliant. Shadow remains non-authoritative and cannot consume an approval or dispatch CI.

## 6. Required post-merge verification

After Human merge and production deployment:

1. keep probe PR #423 open;
2. perform the physical Owner passkey Shadow ceremony against PR #423;
3. verify `APPROVED_SHADOW` is persisted for the exact current PR context;
4. correlate the M5 audit event;
5. prove no authoritative `m10_approval_evidence` was created by Shadow;
6. prove no `m10_ci_consumptions` row and no Shadow-caused GitHub Actions dispatch occurred;
7. only then continue toward Controlled Cutover.

## 7. Rollback

The change is code/test/documentation only. Rollback is a normal git revert of this fix PR. No production database rollback is required.
