# Workflow- und Action-Inventar — M0 Evidence

Stand: 2026-08-10
Repository: `SvenKulessa/Finance`

## Vollständige Workflow-Liste auf `main`

1. `.github/workflows/ci.yml`
2. `.github/workflows/document-hygiene-evidence-migration.yml`
3. `.github/workflows/document-hygiene-evidence-once.yml`
4. `.github/workflows/google-marketing-protected-change.yml`
5. `.github/workflows/lockfile-remediation.yml`
6. `.github/workflows/open-agent-draft-pr.yml`
7. `.github/workflows/pr-governance.yml`

## Klassifikation

### `ci.yml`

Trigger: `push` auf `main`, `pull_request`.

Permissions: `contents: read`.

Externe Actions:

- `actions/checkout` auf vollständige Commit-SHA gepinnt.
- `actions/setup-node` auf vollständige Commit-SHA gepinnt.

Weitere Supply-Chain Inputs:

- Git 2.55.0 wird von kernel.org geladen und lokal gebaut.
- `npm ci` installiert den Lockfile-Stand.
- `npm audit --omit=dev --audit-level=high` ist aktiv.
- Docker-Image wird für Runtime-/Dependency-/Deployment-relevante Änderungen gebaut.

M0/M3-Gap: Der Git-Source-Download prüft zwar `xz --test`, aber keinen separat verankerten kryptographischen Upstream-Hash bzw. Signaturbeweis. Dieses Thema ist M3/M6 zu behandeln.

### `pr-governance.yml`

Trigger: `pull_request` gegen `main`, `merge_group`.

Permissions: `contents: read`.

Controls:

- Policy-Checkout aus vertrauenswürdigem `main`.
- Kandidat wird separat ausgecheckt.
- geänderte Workflows werden mit `verifyChangedWorkflowSecurity.mjs` geprüft.
- GitHub-Token wird bei Repository-Konventionsprüfungen explizit geleert.

Actions sind auf vollständige Commit-SHAs gepinnt.

### `open-agent-draft-pr.yml`

Trigger: ausschließlich `workflow_dispatch`.

Permissions:

- `contents: read`
- `pull-requests: write`

Controls:

- erlaubte Agenten-Branch-Präfixe: `agent/`, `claude/`, `gemini/`, `copilot/`, `ai/`.
- Policy wird aus `main` geladen.
- Kandidatenbranch separat.
- Production Preflight.
- Work-Claim-Validierung.
- kanonische PR-Body-Erzeugung.
- Duplikatprüfung.

Actions sind auf vollständige Commit-SHAs gepinnt.

### `google-marketing-protected-change.yml`

Trigger: path-scoped PR/Push auf `main`, zusätzlich `workflow_dispatch`.

Permissions: `contents: read`.

Control: statische Prüfung des Marketing-/Consent-Schutzvertrags; keine zweite vollständige Testpipeline.

`actions/checkout` ist SHA-gepinnt.

### `document-hygiene-evidence-migration.yml`

Nur `workflow_dispatch`, `contents: read`. Der Workflow führt keine Migration mehr aus, sondern ist als deaktivierter Audit Record erhalten.

### `document-hygiene-evidence-once.yml`

Nur `workflow_dispatch`, `contents: read`. Führt keine Repository-Mutation aus.

### `lockfile-remediation.yml`

Nur `workflow_dispatch`, `contents: read`, Job zusätzlich `if: false`. Historischer Audit Record ohne aktive Mutation.

## M0 Entscheidung

Die vollständige Menge der sieben Workflows wurde erfasst und nach Trigger, Permission, externer Action-Nutzung und Privileg klassifiziert.

`M0-B02 vollständige Workflow-/Action-Inventur`: PASS mit zwei Folgethemen für M3/M6:

1. Toolchain-Download-Authentizität für Git Source Build härten.
2. Action-Pinning und Workflow-Permissions weiterhin policy-as-code erzwingen, nicht nur dokumentieren.
