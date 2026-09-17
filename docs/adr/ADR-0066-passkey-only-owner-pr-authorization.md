# ADR-0066 — Passkey-only Human/Owner PR Authorization

- Status: PROPOSED
- Date: 2026-08-12
- Decision owner: SvenKulessa
- Scope: DevelopmentChain M10 / Pull-Request authorization before expensive CI
- Replaces after VERIFIED PASS: emoji/text current-head approval (`💪` / `okay`) and PR-body Owner-checkbox authorization as security gates
- Preserves: Human file review, `Files changed`/`Viewed` workflow, one CI run per approved head, Human-only merge boundary

## 1. Context

The current DevelopmentChain uses a layered Human/Owner gate before expensive CI:

`FILES CHANGED → VIEWED → CURRENT-HEAD REVIEW (💪/okay) → OWNER CHECKBOXES → build-and-test`

This proves process intent but the final authorization signal is not cryptographically bound to the exact Pull Request state. GitHub can identify the review author and commit id, but the repository workflow cannot prove which physical authenticator or passkey was used for that specific review action.

The target state is a phishing-resistant, cryptographically verifiable Owner authorization bound to the exact Pull Request and current head.

## 2. Decision

After M10 reaches `VERIFIED PASS`, CAPITAL-AI SHALL replace the current emoji/text review and Owner-checkbox authorization with a dedicated WebAuthn/passkey approval ceremony.

The target flow is:

`PR OPEN/UPDATE → OWNER FILE REVIEW → ALL FILES VIEWED → PASSKEY CHALLENGE → VERIFIED OWNER ASSERTION → ONE build-and-test → MERGE ELIGIBLE`

Human merge remains a separate, non-agentic action.

### 2.1 Sole approval factor

For PR authorization after M10 cutover:

- the Human/Owner MUST review all changed files;
- the Human/Owner SHOULD continue to mark every changed file `Viewed` in the GitHub UI;
- the only authorization action accepted by the CI gate SHALL be a verified CAPITAL-AI WebAuthn assertion;
- `💪`, `okay`, GitHub review state, PR-body task-list checkboxes, reactions, comments, labels or device-id claims SHALL NOT independently authorize expensive CI;
- a GitHub account passkey used only for GitHub sign-in SHALL NOT be treated as proof that a specific PR head was approved.

## 3. PR approval transaction binding

The WebAuthn ceremony MUST bind the approval to a server-generated canonical transaction context containing at least:

- Owner actor id: `SvenKulessa`;
- repository: `SvenKulessa/Finance`;
- PR number;
- base branch;
- base SHA;
- exact current head SHA;
- canonical sorted changed-file list hash;
- canonical PR diff/review digest;
- privileged action: `AUTHORIZE_PR_CI`;
- challenge id;
- issued-at time;
- expiry time;
- nonce / replay identifier.

A recommended canonical digest is:

`SHA-256(repo || prNumber || baseSha || headSha || changedFileSetHash || diffDigest || action || challengeId)`

The digest is authorization context, not a replacement for the WebAuthn challenge. The challenge itself MUST be generated with cryptographically secure server-side randomness.

## 4. WebAuthn verification requirements

The approval verifier MUST fail closed unless all required conditions are true:

1. the challenge matches a live server-side challenge record;
2. challenge entropy and generation are server-controlled;
3. challenge is single-use and within its short validity window;
4. expected RP ID matches;
5. expected HTTPS origin matches;
6. credential belongs to the authorized Owner identity;
7. assertion signature verifies against the registered public key;
8. User Presence (`UP`) is present;
9. User Verification (`UV`) is required and present;
10. the transaction binding still matches the current repository/PR/head/diff state;
11. the credential is active and not revoked;
12. replay or previously consumed approval is rejected.

A new commit, force-push, base change or material diff change invalidates all prior approval evidence.

## 5. File-review assurance

GitHub's per-user `Viewed` UI state is retained as a Human review workflow but MUST NOT be falsely represented as independently machine-verifiable if the available GitHub API does not expose reliable per-user Viewed state.

Therefore the passkey approval screen MUST present the exact PR identity and current-head review digest to the Owner and require an explicit confirmation that the displayed file set/diff was reviewed before invoking WebAuthn.

The resulting immutable approval evidence MUST include the changed-file-set hash and diff digest that were displayed for authorization.

## 6. CI trigger architecture

The target CI trigger is approval-record driven, not PR-body-edit driven.

A trusted M10 approval service SHALL:

1. resolve current PR/head/diff state read-only;
2. create the approval transaction and WebAuthn challenge;
3. verify the Owner assertion;
4. atomically persist immutable approval evidence;
5. mark the approval as unused;
6. request exactly one CI validation for the approved head;
7. atomically consume or lock the approval for that CI request.

CI MUST verify that the approval record:

- is for the exact repository/PR/head;
- carries action `AUTHORIZE_PR_CI`;
- is not expired/revoked/consumed for a different run;
- has not been invalidated by a newer commit;
- references the exact review digest.

Duplicate CI requests for the same approval/head MUST be rejected or deduplicated.

## 7. Audit evidence

The M5 append-only audit chain SHOULD record, without private-key or biometric material:

- approval id;
- challenge id or redacted/hash reference;
- Owner actor id;
- WebAuthn credential reference or privacy-preserving credential hash;
- RP ID;
- origin;
- UV/UP verification result;
- repository / PR / base SHA / head SHA;
- changed-file-set hash;
- diff digest;
- action;
- issued / verified / consumed timestamps;
- CI run id;
- final outcome.

Private keys, authenticator secrets, biometric data and reusable credentials MUST NOT be stored.

## 8. Threat model / fail-closed cases

M10 tests MUST cover at minimum:

- wrong Owner credential → DENY;
- credential valid for different RP ID/origin → DENY;
- `UV=false` → DENY;
- missing `UP` → DENY;
- stale/expired challenge → DENY;
- challenge replay → DENY;
- assertion replay → DENY;
- wrong repository → DENY;
- wrong PR → DENY;
- wrong base SHA → DENY;
- wrong/current-head mismatch → DENY;
- changed file-set or diff after challenge issue → DENY;
- forged GitHub comment/review/reaction/checkbox → no authorization;
- GitHub session authenticated by unknown method → no PR authorization;
- duplicate CI request for consumed approval → DENY/DEDUPE;
- verifier/audit persistence unavailable → DENY;
- credential revoked during ceremony → DENY;
- agent attempts to self-approve → DENY.

## 9. Recovery and break-glass

Passkey loss MUST NOT silently downgrade PR authorization to emoji, checkbox, TOTP-only or device-id approval.

Recovery requires a separately documented Owner recovery/break-glass flow with:

- strong identity re-verification;
- explicit scope and expiry;
- audit evidence;
- credential revocation/re-enrollment;
- post-recovery security review.

Any break-glass approval is exceptional evidence and must not become the normal CI path.

## 10. Migration / cutover

M10 SHALL use a staged transition:

### Stage A — design and implementation
Current Human/Owner gate remains authoritative while WebAuthn is implemented and tested.

### Stage B — shadow verification
Passkey assertions are generated and audited, but existing approval still controls CI. Results are compared for false allow/deny behavior.

### Stage C — enforced passkey cutover
Only after all M10 positive/negative/replay/recovery tests are `VERIFIED PASS`:

- remove `💪` / `okay` from CI authorization logic;
- remove PR-body Owner checkboxes from CI authorization logic;
- retain file review / Viewed workflow;
- make a valid, current-head-bound WebAuthn approval the sole Owner authorization before expensive CI.

### Stage D — legacy cleanup
Delete obsolete parser/checkbox authorization code and update templates, runbooks, DevelopmentChain docs and tests.

Rollback from Stage C returns to the last verified gate only through an explicit Human/Owner security rollback decision; it MUST NOT occur automatically on verifier failure.

## 11. Relationship to merge authority

This ADR changes authorization for expensive PR CI and merge eligibility. It does not grant autonomous merge capability.

`MERGE` remains Human/Owner-only and outside autonomous Agent IAM. A green CI run and a valid passkey approval are evidence, not autonomous merge authorization.

## 12. External references

- W3C Web Authentication Level 3: https://www.w3.org/TR/webauthn-3/
- GitHub Docs — About passkeys: https://docs.github.com/en/authentication/authenticating-with-a-passkey/about-passkeys

## 13. Consequences

Positive:

- phishing-resistant Owner authorization;
- cryptographic binding to exact PR/head/diff;
- removal of ambiguous emoji/comment/checkbox authorization;
- improved replay resistance and auditability;
- cleaner single-trigger CI model.

Trade-offs:

- requires a trusted CAPITAL-AI WebAuthn relying-party service;
- requires credential registration/recovery lifecycle;
- introduces an availability dependency for PR authorization;
- requires explicit fail-closed recovery and rollback procedures.

## 14. Exit gate

ADR-0066 is architecture authority only. It does not activate passkey-only PR authorization by itself.

M10 reaches `VERIFIED PASS` only after dedicated ESS/runbook/threat model, implementation, Owner passkey enrollment, positive/negative tests, shadow comparison, audit persistence verification, CI single-trigger proof and controlled cutover are complete.