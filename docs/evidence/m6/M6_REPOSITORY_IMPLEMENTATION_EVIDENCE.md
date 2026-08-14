# M6 — Supply Chain Provenance: Repository Implementation Evidence

Status: **VERIFIED PASS** (siehe Nachtrag Abschnitt 0.1)
Datum: 2026-08-14 (Nachträge: 2026-08-14, selber Tag)
Roadmap phase: M6
Authority: ADR-0060, `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md`, `AI_AGENT_SUPPLY_CHAIN_MODEL.md`
Executor: direkte Owner-instruierte Claude-Code-Sitzung (kein SA4/neuer autonomer Host — siehe
Owner-Entscheidung zu M5A, dieselbe Vorgehensweise für M6 bestätigt)
Standards-Baseline: SLSA v1.2 (Provenance-Prädikat), NIST SSDF SP 800-218 v1.1 als stabile
Referenz — kein Draft-Requirement als final dargestellt.

## 0. Nachtrag — erster echter `push`-Lauf, realer Blocker, Fix

Nach Merge dieses PRs löste der erste `push`-Lauf auf `main` (Merge-Commit `7c73d552b9d2994d8df9c64f554fb07a87f5330c`, Run
[`31832197746`](https://github.com/SvenKulessa/Finance/actions/runs/31832197746)) den Job `supply-chain-attestation`
real aus. `build-and-test` und der Render-Deploy liefen PASS; der Attestation-Schritt selbst schlug fehl:

```text
##[error]Error: Failed to persist attestation: Feature not available for user-owned private repositories.
To enable this feature, please make this repository public.
```

**Root Cause** (verifiziert per `git clone` gegen `actions/attest-build-provenance@v4.2.2` und
`actions/attest@508db95d...` — den vom Composite-Wrapper intern verwendeten Node-Action —, inkl. Lesen von
`dist/index.js`): `actions/attest` ruft GitHubs Attestations-API (`writeAttestation`) **unbedingt** auf, sobald die
Sigstore-Signatur erzeugt wurde; die zugrunde liegende `@actions/attest`-Bibliothek kennt zwar ein `skipWrite`-Flag,
aber die Action exponiert es nicht als Input — es gibt also keinen Weg, mit diesem Werkzeug die Persistierung zu
umgehen. GitHubs Attestations-API ist laut GitHub-Dokumentation nur für öffentliche Repositories oder für
private/interne Repositories **unter einer Organisation** (GitHub Team/Enterprise Cloud) verfügbar — nicht für private
Repositories unter einem persönlichen Account. `SvenKulessa/Finance` ist genau das: ein privates Repository unter
einem persönlichen Account. Dies ist ein struktureller Plattform-Blocker, kein Fehler in diesem Repository-Code —
genau der Fall, den Abschnitt 1 dieses Dokuments ursprünglich offen gelassen hatte, statt vorzeitig „VERIFIED PASS" zu
behaupten.

**Owner-Entscheidung** (AskUserQuestion, 2026-08-14): von drei vorgelegten Optionen — (a) unabhängige
Sigstore-Signatur ohne GitHub-Attestations-API, (b) Repo-Sichtbarkeit/-Ownership ändern (öffentlich machen oder in
eine Organisation übertragen — bewusst nicht eigenständig vorgenommen, da Business-/Sicherheitsentscheidung), (c)
Signing vorerst zurückstellen — wurde **(a) gewählt**.

**Fix**: `supply-chain-attestation` signiert `dist/security/provenance.json` jetzt per `cosign sign-blob --yes
--bundle ...` keyless gegen die öffentliche Sigstore-Infrastruktur (Fulcio-Kurzzeit-Zertifikat gebunden an die
GitHub-Actions-OIDC-Identität des Workflows, Eintrag im öffentlichen Rekor-Transparency-Log) — vollständig unabhängig
von GitHub-Repo-Sichtbarkeit/-Ownership. Ein unmittelbarer `cosign verify-blob`-Schritt im selben Job verifiziert die
Signatur gegen die erwartete Zertifikats-Identität (`https://github.com/<repo>/.github/workflows/ci.yml@refs/heads/main`)
und den erwarteten OIDC-Issuer (`https://token.actions.githubusercontent.com`) — das im Runbook geforderte „Attestation
verifiziert mit erwarteter Builder-Identität" wird also real im selben Lauf geprüft, nicht nur behauptet. Das
signierte Bundle plus SBOM/Provenance/Release-Manifest werden als Workflow-Artefakt (`actions/upload-artifact`,
90 Tage Aufbewahrung) abgelegt statt im GitHub-Attestations-Tab.

`sigstore/cosign-installer@6f9f17788090df1f26f669e9d70d6ae9567deba6` (Tag `v4.1.2`) und
`actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` (Tag `v7.0.1`) wurden beide per `git clone
--branch <tag>` direkt gegen ihre Ursprungs-Repositories verifiziert, nicht nur aus einer gescrapten Seite
übernommen — derselbe Verifikationsstandard wie bei `actions/attest-build-provenance` zuvor. Die
`attestations: write`-Berechtigung wurde entfernt (nicht mehr benötigt); `id-token: write` bleibt für die
OIDC-Anfrage an Fulcio erforderlich.

Der Fix wurde zum Zeitpunkt dieses ersten Nachtrags lokal vollständig implementiert und verifiziert (Abschnitt 6),
aber noch nicht gemergt — Status blieb bewusst unterhalb `VERIFIED PASS`. Siehe Abschnitt 0.1 für den realen
Nachweis nach Merge.

## 0.1 Nachtrag — realer `push`-Lauf nach dem cosign-Fix: erfolgreich signiert und verifiziert

PR #262 (der cosign-Fix aus Abschnitt 0) wurde vom Owner per Review (`💪`) freigegeben und gemerged
(Merge-Commit `c10a232a72a1c9fc73f3aaa4821649aff08e3389`). Der dadurch ausgelöste reale `push`-Lauf auf `main`,
Run [`31834114193`](https://github.com/SvenKulessa/Finance/actions/runs/31834114193), lief vollständig **PASS** —
alle vier Jobs (`Human-/Owner-Vorprüfung`, `build-and-test`, `Deployment verifiziert / Render-Produktion`,
`Supply-Chain-Provenance / Attestation`) mit `conclusion: success`.

Job-Log des Attestation-Schritts (Job-ID `94877020826`, wörtlich):

```text
$ cosign sign-blob --yes --bundle dist/security/provenance.json.sigstore.json dist/security/provenance.json
Generating ephemeral keys...
Using payload from: dist/security/provenance.json
Signing artifact...
Wrote bundle to file dist/security/provenance.json.sigstore.json

$ cosign verify-blob --bundle dist/security/provenance.json.sigstore.json \
    --certificate-identity "https://github.com/SvenKulessa/Finance/.github/workflows/ci.yml@refs/heads/main" \
    --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
    dist/security/provenance.json
Verified OK
```

Die Signatur wurde also nicht nur erzeugt, sondern **im selben Lauf real gegen die exakt erwartete
Zertifikats-Identität und den erwarteten OIDC-Issuer verifiziert** — genau das im Runbook geforderte
„Attestation verifiziert mit erwarteter Builder-Identität". `actions/upload-artifact` legte das signierte Bundle
plus SBOM/Provenance/Release-Manifest ab: Artefakt `supply-chain-provenance-c10a232a72a1c9fc73f3aaa4821649aff08e3389`,
Artifact-ID `9231890684`, SHA-256 des hochgeladenen Zip-Archivs `2522c28f52e378079bc80a45af8b3eec2449fccbee2c85ef104dbb3dd054ec5f`,
abrufbar unter <https://github.com/SvenKulessa/Finance/actions/runs/31834114193/artifacts/9231890684> (90 Tage
Aufbewahrung ab `2026-08-14`).

**Grenzen dieses Nachweises, offen benannt:** Der eingebettete Rekor-Transparency-Log-Index/-URI innerhalb der
`.sigstore.json`-Bundle-Datei selbst wurde nicht zusätzlich aus der Rohdatei extrahiert — der Download-Link des
Artefakts zeigt auf Azure Blob Storage, das der Egress-Proxy dieser Sandbox-Sitzung blockiert (`CONNECT tunnel
failed, response 403`), dieselbe bereits mehrfach in dieser Sitzung dokumentierte Netzwerkbeschränkung. Die
Evidence stützt sich stattdessen auf die GitHub-Actions-Job-Logs selbst als authoritative, von GitHub erzeugte
Aufzeichnung (`cosign verify-blob` meldet nur bei tatsächlich gültiger, gegen Fulcio/Rekor geprüfter Signatur
`Verified OK` — ein Fake-Erfolg ohne echte Signatur ist damit ausgeschlossen). Das signierte Bundle selbst bleibt
für die Aufbewahrungsdauer über den obigen Artifact-Link unabhängig nachprüfbar (`cosign verify-blob --bundle ...`
durch jeden Dritten mit Repo-Zugriff).

Damit sind alle im Runbook geforderten Kettenglieder — source → lockfile → SBOM → artifact →
provenance/attestation — nicht nur lokal, sondern auf dem tatsächlichen, gehosteten `main`-Build-Pfad real
erzeugt und verifiziert. M6 wird auf **VERIFIED PASS** gehoben.

## 1. Ursprüngliche Begründung (historisch) für den Zwischenstatus „nicht VERIFIED PASS"

Der M6-Runbook-Exit-Gate verlangt explizit: „exact source → lockfile → SBOM → artifact →
provenance/attestation chain verifies" — die **Attestation** selbst kann per Definition nur von
einem echten, gehosteten CI-Lauf auf `main` erzeugt werden (nicht lokal, nicht von einem Agenten).
Der Workflow-Job `supply-chain-attestation` in `ci.yml` läuft ausschließlich auf
`push`+`main` (`if: github.event_name == 'push' && github.ref == 'refs/heads/main'`). Der erste
reale Lauf (Nachtrag Abschnitt 0) deckte einen strukturellen Plattform-Blocker in der ursprünglich
gewählten Mechanik auf; der zweite reale Lauf nach dem cosign-Fix (Nachtrag Abschnitt 0.1) lief
vollständig PASS inkl. realer Signaturverifikation — der oben beschriebene Zwischenstatus ist damit
aufgelöst.

## 2. Umgesetzte Kette

```text
source SHA (git HEAD / GITHUB_SHA)
→ package-lock.json (SHA-256 gebunden)
→ CycloneDX-SBOM (dist/security/sbom.cdx.json, an source+lock gebunden)
→ Release-Manifest (dist/control-plane/release-manifest.json, bereits vorhanden aus M5A/früherer Arbeit)
→ in-toto/SLSA-v1-Provenance-Statement (dist/security/provenance.json)
→ cosign keyless signing (Sigstore Fulcio/Rekor, GitHub-OIDC-Identität) — siehe Nachtrag Abschnitt 0
```

### Neue Dateien

| Datei | Zweck |
|---|---|
| `scripts/automation/sourceIdentity.ts` | gemeinsame `resolveSourceCommit()` — verhindert, dass Release-Manifest, SBOM und Provenance unabhängig voneinander (und potenziell inkonsistent) den Quell-Commit ableiten. |
| `scripts/automation/buildSupplyChainProvenance.ts` | erzeugt `dist/security/provenance.json` aus bereits vorhandenem Release-Manifest + SBOM; bricht fail-closed ab, wenn deren Quell-Commits nicht exakt übereinstimmen. |
| `scripts/security/verifySupplyChainProvenance.ts` | Gate-Skript: prüft Konsistenz der gesamten Kette (Quell-Commit, Lockfile-Digest, Artefakt-Digests, `--require-ci`-Modus für Builder-Identität). Exportiert die reine Prüf-Funktion `verifySupplyChainConsistency()` für Tests. |

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `scripts/automation/dependencySecurity.ts` | `buildCycloneDxSbom`/`writeCycloneDxSbom` binden jetzt optional Quell-Commit + Lockfile-Digest in `metadata.properties` der SBOM ein. |
| `scripts/automation/buildRuntimeReleaseManifest.ts` | nutzt jetzt die gemeinsame `resolveSourceCommit()` statt einer eigenen Kopie. |
| `package.json` | neue Skripte `supplychain:provenance`, `supplychain:verify`; beide in `predeploy:check` verkettet. |
| `.github/workflows/ci.yml` | neuer Job `supply-chain-attestation` (nur `push`+`main`, eigene minimale Berechtigungen `contents: read`, `id-token: write` — NICHT workflow-weit, damit PR-Läufe diese Rechte nie erhalten); signiert per `sigstore/cosign-installer` + `cosign sign-blob`/`cosign verify-blob`, legt Bundle+Artefakte per `actions/upload-artifact` ab (siehe Nachtrag Abschnitt 0). |

## 3. Provenance-Format

In-toto Statement v1 (`https://in-toto.io/Statement/v1`) mit SLSA-Provenance-v1-Prädikat
(`https://slsa.dev/provenance/v1`). `subject` bindet `release-manifest.json` und `sbom.cdx.json`
per SHA-256. `predicate.buildDefinition.resolvedDependencies` bindet den exakten Git-Commit und
den Lockfile-Digest. `predicate.runDetails.builder.id` ist die GitHub-Actions-Workflow-URL (nicht
irgendeine Agenten-/Modell-/Provider-Identität) — außerhalb von GitHub Actions wird explizit
`local-developer-build` gesetzt, was `--require-ci` gezielt ablehnt.

Bewusst **kein** selbstgebautes „Signieren": die Vertrauensbasis ist ausschließlich die öffentliche
Sigstore-Infrastruktur (Fulcio/Rekor) über `sigstore/cosign-installer@6f9f17788090df1f26f669e9d70d6ae9567deba6`
(Tag `v4.1.2`) und `cosign sign-blob --yes --bundle ...` keyless signing, gebunden an die
GitHub-Actions-OIDC-Identität des Workflows — beide Action-SHAs verifiziert per `git clone --branch <tag>` direkt
gegen ihre Ursprungs-Repositories, nicht nur aus einer gescrapten Seite übernommen. Ursprünglich war
`actions/attest-build-provenance` vorgesehen; der erste reale `push`-Lauf deckte auf, dass dessen GitHub-Attestations-
API für private, unter einem persönlichen Account gehaltene Repositories nicht verfügbar ist (siehe Nachtrag
Abschnitt 0) — cosign ist davon unabhängig, da es ausschließlich gegen die öffentliche Sigstore-Infrastruktur
signiert, nicht gegen ein GitHub-internes, plan-/ownership-gegatetes Feature. Ein lokal erzeugtes „Signat" wäre
weiterhin wertlos, da kein vertrauenswürdiges Schlüsselmaterial in diesem Repository oder auf einem
Entwickler-Laptop liegt — keyless signing gegen Fulcio erfordert die echte GitHub-Actions-OIDC-Identität und ist
lokal nicht reproduzierbar.

## 4. Required Positive Tests (Runbook) — Nachweis

| Test | Nachweis |
|---|---|
| SBOM für exakten Quell-/Lock-Zustand erzeugt | `tests/unit/dependencySecurity.test.ts` (2 neue Tests) + lokaler Ende-zu-Ende-Lauf (Abschnitt 5) |
| SBOM enthält erwartete Top-Level-Identität + Dependency-Inventar | bestehender Test, unverändert grün |
| Provenance-Subject-Digest == gebautes Artefakt | `tests/unit/verifySupplyChainProvenance.test.ts` „PASS: consistent chain" + lokaler Lauf |
| Quellreferenz == exakter Commit-SHA | dito |
| Attestation verifiziert mit erwarteter Builder-Identität | **Real bestätigt** im `push`-Lauf [`31834114193`](https://github.com/SvenKulessa/Finance/actions/runs/31834114193): `cosign verify-blob` meldet `Verified OK` gegen die exakt erwartete Zertifikats-Identität + OIDC-Issuer — siehe Nachtrag Abschnitt 0.1 |
| Rollback-Artefakt per Digest abrufbar | Release-Manifest (`buildIdentity`) bereits als immutable Referenz etabliert (M5A/vorherige Arbeit); keine neue Mutation hier |
| Workflow-Security-Checks bestehen | `scripts/security/verifyChangedWorkflowSecurity.mjs` — siehe Abschnitt 6 |

## 5. Required Negative Tests (Runbook) — Nachweis

Alle in `tests/unit/verifySupplyChainProvenance.test.ts` (10 Tests) abgedeckt:

- geänderter Quell-Commit bei veralteter Provenance/Manifest → DENY;
- geändertes Lockfile bei veralteter SBOM → DENY;
- Artefakt-Digest-Mismatch (Release-Manifest) → DENY;
- Artefakt-Digest-Mismatch (SBOM) → DENY;
- unauflösbarer aktueller Quell-Commit → DENY;
- nicht vertrauenswürdige/lokale Builder-Identität bei `--require-ci` → DENY;
- fehlende Builder-Identität bei `--require-ci` → DENY;
- frei behauptete Agenten-/Provider-Identität in `runDetails` wird ignoriert (keine Vertrauens-Elevation über ein Freitext-Feld möglich) — nur `builder.id` und Digests zählen.

Zusätzlich lokal Ende-zu-Ende bestätigt: `verifySupplyChainProvenance.ts --require-ci` lehnt einen
lokalen (Nicht-CI-)Lauf korrekt mit `builder.id: local-developer-build` ab (Exit-Code 1).

## 6. Lokaler Ende-zu-Ende-Nachweis dieser Sitzung

Erster Implementierungslauf (vor dem Merge, vor Entdeckung des Attestations-API-Blockers):

```text
npm run build                              -> PASS (Release-Manifest erzeugt)
npm run predeploy:check                    -> PASS (SBOM, Provenance, Verify-Kette gruen, 0 violations)
npx tsx scripts/security/verifySupplyChainProvenance.ts --require-ci
                                            -> FAIL-CLOSED wie erwartet (lokaler Build, keine CI-Identitaet)
npm run lint                                -> PASS (tsc --noEmit)
npx vitest run                              -> 148 Testdateien, 845 Tests PASS (12 neu: 2 SBOM-Bindung,
                                                3 sourceIdentity, 10 verifySupplyChainProvenance minus
                                                bereits vorhandene ueberschneidende Zaehlung, siehe Testlauf)
```

Nachtrag-Lauf (nach dem cosign-Fix, nach Rebase auf `main@7c73d55`):

```text
npm run lint                                -> PASS (tsc --noEmit)
npm run build                               -> PASS (Release-Manifest erzeugt)
npm run predeploy:check                     -> PASS (SBOM, Provenance, Verify-Kette gruen, 0 violations)
npx vitest run                              -> 150 Testdateien, 854 Tests PASS
```

`cosign sign-blob`/`cosign verify-blob` selbst sind lokal **nicht** ausführbar (keyless signing
erfordert die echte GitHub-Actions-OIDC-Identität, die außerhalb eines echten Workflow-Laufs nicht
existiert) — das ist der gesamte Punkt von keyless signing und kein Testlücke. Der reale Nachweis
erfolgte im CI-Job selbst, siehe Nachtrag Abschnitt 0.1: `Signing artifact... Wrote bundle to file
...` gefolgt von `cosign verify-blob ... Verified OK`.

## 7. Nicht Teil dieser Implementierung

- keine Docker-Image-Digest-Bindung an eine Registry (das CI-Docker-Build in `ci.yml` ist ein reiner
  Validierungs-Build, kein Push in eine Registry; das eigentliche Produktions-Artefakt wird von
  Render separat aus demselben Quellstand gebaut — Deployment-Identitäts-Korrelation ist explizit
  M7-Scope laut Runbook, nicht M6);
- keine externe Plattform-Mutation (Render/Stripe/Supabase) — `NOT REQUIRED` laut Runbook, auch
  nicht durchgeführt;
- keine Änderung an bestehenden, bereits gepinnten Actions über die eine neue hinzugefügte Zeile
  hinaus.

## 8. Nächster Schritt

M6 ist mit diesem Dokument **VERIFIED PASS** — der reale `push`-Lauf [`31834114193`](https://github.com/SvenKulessa/Finance/actions/runs/31834114193)
hat die vollständige Kette source → lockfile → SBOM → artifact → provenance/attestation auf dem tatsächlichen,
gehosteten Build-Pfad erzeugt und verifiziert (Nachtrag Abschnitt 0.1). M7 (Deployment Identity) ist damit gemäß
`docs/roadmaps/DEVELOPMENT_CHAIN_ROADMAP.md` das nächste zulässige Gate; M7 erfordert laut eigenem Runbook
explizite Owner-Mutation-Approval für jede externe Plattformänderung und wird nicht ohne separate Anweisung
begonnen. Optional (nicht blockierend): das eingebettete Rekor-Log-Index/-URI aus der `.sigstore.json`-Bundle-Datei
könnte bei künftigem Zugriff auf das Artefakt-Storage (außerhalb der aktuellen Sandbox-Egress-Beschränkung) noch
zusätzlich extrahiert und hier nachgetragen werden — nicht erforderlich für den bereits erbrachten VERIFIED-PASS-Nachweis.
