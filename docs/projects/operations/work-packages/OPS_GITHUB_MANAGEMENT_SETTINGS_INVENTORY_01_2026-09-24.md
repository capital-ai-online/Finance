# OPS-GITHUB-MANAGEMENT-SETTINGS-INVENTORY-01

**Project:** CAPITAL-AI-OPS  
**Owner/PVC:** CAPITAL-AI-OPS / PVC-02; supporting PVC-08/PVC-18  
**Baseline:** `main@58ac24731bf597e9356788d0293d6c733337b364`  
**Branch:** `operations/github-management-settings-inventory-20260924`  
**State:** IMPLEMENTATION_ON_BRANCH / READ_ONLY  
**Merge:** HUMAN_MERGE_REQUIRED

## Goal

Create one canonical read-only GitHub settings adapter that correlates four management scopes:

1. Enterprise
2. Organization
3. Repository
4. authenticated User

The adapter extends the existing GitHub settings inventory. It MUST NOT replace the current Enterprise reader, Organization/Repository installation reader, billing reader, Work-Management gateway or provider mutation writers.

## Coverage semantics

"All settings" means **all settings registered in the documented API-observable management matrix**. GitHub does not expose every UI preference through one API and does not allow one token type to read every scope.

Therefore each capability is one of:

- `PASS` — value was read through the bounded authorized transport;
- `NOT_OBSERVABLE` — GitHub returned 403/404 or the required auth is unavailable;
- no implicit default and no inferred value.

The inventory must report every registered gap so missing access can be reviewed intentionally.

## Auth routing

- Enterprise Actions/settings: existing classic PAT boundary.
- Enterprise settings unsupported by `admin:enterprise` alone (for example runner administration) remain `NOT_OBSERVABLE` unless the token also has the documented scope.
- Organization/Repository: existing Management GitHub App installation token.
- User: dedicated read token when configured; otherwise the Enterprise classic PAT is reused only for authenticated-user GETs its scopes actually permit.

A later GitHub App user-authorization flow can replace the User PAT fallback, but this package does not create OAuth callback/runtime infrastructure.

## Initial API settings families

Enterprise:
- Actions policy;
- selected Actions;
- default workflow token/PR approval;
- selected organizations;
- code-security configuration catalog;
- self-hosted runner inventory and runner groups when authorized.

Organization:
- organization settings projection;
- Actions policy / selected Actions / selected repositories;
- workflow token defaults;
- artifact/log retention;
- fork PR workflow policy;
- self-hosted runner policy, runner inventory and runner groups;
- Actions cache settings;
- code-security configuration catalog;
- custom-property schema.

Repository:
- repository settings and merge policy;
- Actions policy / selected Actions / workflow token defaults;
- retention / fork workflow policy / cache;
- artifact inventory;
- environments;
- rulesets;
- code-security configuration;
- custom-property values;
- self-hosted runner inventory.

User:
- authenticated profile and 2FA observability;
- email inventory with addresses redacted;
- Git SSH-key inventory with key material redacted;
- GPG-key inventory with key material redacted;
- SSH signing-key inventory with key material redacted.

## Output contract

Schema `CAPITAL_AI_GITHUB_SETTINGS_INVENTORY/3.0.0` keeps the current flat `entries` field for compatibility and adds:

- `scopes.enterprise`;
- `scopes.organization`;
- `scopes.repository`;
- `scopes.user`;
- per-scope capability count / PASS count / NOT_OBSERVABLE count / status;
- explicit auth-boundary description;
- explicit API-observable-only coverage note.

## Privacy

Never export:

- PAT/token/private-key values;
- OAuth authorization URLs;
- raw email addresses;
- SSH/GPG/signing-key material;
- environment reviewer identity;
- secrets or secret values.

## Exit

A successful workflow run after merge yields a four-scope inventory. The chat then walks each PASS setting and each NOT_OBSERVABLE gap individually with evidence-backed recommendations. Provider changes remain separate protected mutations.
