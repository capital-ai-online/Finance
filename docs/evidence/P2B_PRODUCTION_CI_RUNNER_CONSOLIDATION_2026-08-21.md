# P2B Production-CI Runner Consolidation — Evidence 2026-08-21

## Status

IMPLEMENTED ON BRANCH — HOSTED MAIN-PUSH VERIFICATION PENDING

Branch: `agent/ci-cost-control-p0-2026-08-21`  
Baseline: `main@5595ec0abe1f1b6755620f3435badbf874d54aba`

## Ziel

Die Production-Kette in `.github/workflows/ci.yml` soll GitHub-hosted Linux-Minuten reduzieren,
ohne eine Sicherheits- oder Autoritätsgrenze zu entfernen.

Geschützt bleiben insbesondere:

- `build-and-test` als einziger repository-hosted technischer Required Check,
- M10 Passkey operational `OFF`,
- vollständiger Build/Test/Predeploy/Docker-Pfad für `push` auf `main`,
- source-/lockfile-/SBOM-/Provenance-Konsistenz,
- Sigstore/Fulcio/Rekor keyless Signatur und Identitätsprüfung,
- `production` Environment als Deployment-Grenze,
- Render Deploy Hook an exakt `github.sha`,
- post-deploy Health-/Commit-Identitätsprüfung gegen exakt denselben SHA,
- 90-Tage-Evidence für Supply Chain und Deployment Identity.

## Ausgangszustand

Ein erfolgreicher `main`-Push nutzte vier `ubuntu-latest`-Jobs:

1. `build-and-test`
2. `supply-chain-attestation`
3. `deploy-production`
4. `verify-deployment-identity`

Dabei wurden nach dem bereits vollständigen `build-and-test` erneut ausgeführt:

- Checkout des gleichen Main-SHA,
- Node-Setup,
- `npm ci`,
- `npm run build`,
- `npm run predeploy:check`,
- später nochmals Checkout + Node + `npm ci` nur für die Deployment-Identity-Prüfung.

Diese Wiederholungen erzeugten keine zusätzliche fachliche Build-Evidence; sie bereiteten dieselbe
Source-Identität lediglich in separaten Runnern erneut vor.

## P2B Entscheidung

Die Production-Kette wird auf zwei Hosted Runner konsolidiert.

### Runner 1 — `build-and-test`

Der bestehende Main-Build bleibt vollständig. Nach Build, Predeploy und Docker-Prüfung werden nur
für `push` auf `refs/heads/main` zusätzlich ausgeführt:

1. `verifySupplyChainProvenance.ts --require-ci`,
2. Installation des immutable gepinnten Cosign-Installers,
3. `cosign sign-blob` der bereits erzeugten `dist/security/provenance.json`,
4. `cosign verify-blob` gegen
   `https://github.com/${{ github.repository }}/.github/workflows/ci.yml@refs/heads/main`
   und `https://token.actions.githubusercontent.com`,
5. Bundling des bestehenden `scripts/deployment/verifyDeploymentIdentity.ts` als standalone ESM
   für Node 24,
6. Upload von Supply-Chain-Evidence und standalone Deployment-Verifier in ein SHA-benanntes
   Workflow-Artefakt.

Es findet kein zweites `npm ci`, kein zweiter Build und kein zweites `predeploy:check` für die
Attestation statt.

### Runner 2 — `deploy-production`

Der einzige zweite Runner bleibt an `environment: production` gebunden. Vor jeder
Production-Mutation:

1. lädt er ausschließlich das SHA-benannte Build-Artefakt aus demselben Workflow-Lauf,
2. richtet Node 24 ein,
3. prüft `release-manifest.json.sourceCommit === github.sha`,
4. prüft die Existenz des aus demselben Build gebündelten Deployment-Verifiers.

Erst danach wird der Render Deploy Hook mit `ref=${github.sha}` ausgelöst. Anschließend pollt der
standalone Verifier `/healthz` und verlangt weiterhin den exakt erwarteten Main-SHA. Die Evidence
wird wieder unter `deployment-identity-evidence-${github.sha}` für 90 Tage gespeichert.

Der Production-Runner führt bewusst **kein Repository-Checkout, kein `npm ci` und keinen Build**
aus. Dadurch bleibt die privilegierte Deployment-Oberfläche kleiner als in einer naiven
Single-Job-Konsolidierung.

## Sicherheitsbegründung

### OIDC / Sigstore

`build-and-test` besaß bereits `id-token: write`. Diese GitHub-Berechtigung erlaubt das Anfordern
eines OIDC-Tokens, ohne Contents- oder andere Ressourcen-Schreibrechte einzuführen. Die
Zertifikatsidentität bleibt derselbe Workflow `ci.yml@refs/heads/main`; ein Jobwechsel verändert
diese Workflow-Identität nicht.

### Artifact Handoff

GitHub Actions Workflow-Artefakte sind der vorgesehene Mechanismus, um Build-Ergebnisse zwischen
abhängigen Jobs desselben Workflow-Laufs weiterzugeben. `deploy-production` hängt über
`needs: [build-and-test]` vom vollständig erfolgreichen Build einschließlich Signatur und Upload ab.

### Production Environment

`environment: production` verbleibt ausschließlich auf `deploy-production`. Der Build-/Test-Job
bekommt dadurch keine Production-Environment-Authority. Umgekehrt führt der Production-Job keine
PR-/Repository-Abhängigkeiten aus, sondern konsumiert nur den zuvor erzeugten Main-Build-Handoff.

### Exact-SHA

Die Source-Identität wird mehrfach fail-closed gebunden:

- `RELEASE_SOURCE_COMMIT == git HEAD` im Main-Build,
- Release-Manifest/SBOM/Provenance gegen denselben Source-Commit,
- Sigstore-Signatur gegen die erwartete Workflow-Identität,
- Release-Manifest im Deployment-Job gegen `github.sha`,
- Render Hook mit `ref=${github.sha}`,
- post-deploy Health/Deployment Identity gegen denselben SHA.

## Kostenwirkung

Production-CI pro erfolgreichem Main-Push:

- Hosted Runner: **4 → 2**
- `npm ci`: **3 → 1**
- `npm run build`: **2 → 1**
- `npm run predeploy:check`: **2 → 1**
- Repository-Checkouts: **3 → 1**

Die verbleibenden zwei Runner entsprechen zwei unterschiedlichen Trust-/Execution-Grenzen:
verified build/signing und production-environment-bound deploy/verification.

## Regressionstest

`tests/unit/productionCiRunnerConsolidation.test.ts` fixiert mindestens:

- M10 bleibt `false`,
- exakt zwei `ubuntu-latest`-Runner in `ci.yml`,
- keine Jobs `supply-chain-attestation` oder `verify-deployment-identity`,
- genau ein `npm run build` und ein `npm ci`,
- Sigstore-Provenance bleibt im Main-Build,
- standalone Verifier wird aus dem existierenden TS-Source gebündelt,
- Production-Job enthält weder Checkout noch npm/build,
- Artifact-Source-Commit wird vor Render geprüft,
- Render- und Health-Verifikation bleiben SHA-gebunden,
- Supply-Chain- und Deployment-Evidence bleiben erhalten.

## Noch ausstehende reale Evidence

Vor Merge ist der Branch weiterhin gegen aktuellen `main` und offene PRs zu korrelieren. Nach PR-
Erstellung muss die normale Hosted-CI den neuen Workflow-Head mindestens einmal vollständig
prüfen. Nach einem späteren Merge ist ein realer `main`-Push erforderlich, um die zweistufige
Production-Kette einschließlich Sigstore, Artifact-Handoff, Render und post-deploy Identity real zu
bestätigen.
