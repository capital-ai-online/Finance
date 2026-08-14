# M6 — Supply Chain Provenance: Repository Implementation Evidence

Status: CODE COMPLETE / CI ATTESTATION PENDING FIRST MAIN PUSH
Datum: 2026-08-14
Roadmap phase: M6
Authority: ADR-0060, `docs/runbooks/M6_SUPPLY_CHAIN_PROVENANCE.md`, `AI_AGENT_SUPPLY_CHAIN_MODEL.md`
Executor: direkte Owner-instruierte Claude-Code-Sitzung (kein SA4/neuer autonomer Host — siehe
Owner-Entscheidung zu M5A, dieselbe Vorgehensweise für M6 bestätigt)
Standards-Baseline: SLSA v1.2 (Provenance-Prädikat), NIST SSDF SP 800-218 v1.1 als stabile
Referenz — kein Draft-Requirement als final dargestellt.

## 1. Warum dieses Dokument (noch) nicht „VERIFIED PASS" meldet

Der M6-Runbook-Exit-Gate verlangt explizit: „exact source → lockfile → SBOM → artifact →
provenance/attestation chain verifies" — die **Attestation** selbst kann per Definition nur von
einem echten, gehosteten CI-Lauf auf `main` erzeugt werden (nicht lokal, nicht von einem Agenten).
Der neue Workflow-Job `supply-chain-attestation` in `ci.yml` läuft ausschließlich auf
`push`+`main` (`if: github.event_name == 'push' && github.ref == 'refs/heads/main'`) — er hat also
zum Zeitpunkt dieses PRs noch nie ausgeführt. Dieses Dokument beschreibt daher den vollständigen,
lokal Ende-zu-Ende verifizierten Code- und Kettenaufbau; die tatsächliche signierte Attestation
folgt als Nachtrag, sobald dieser PR gemergt ist und der erste reale `push`-Lauf abgeschlossen ist.

## 2. Umgesetzte Kette

```text
source SHA (git HEAD / GITHUB_SHA)
→ package-lock.json (SHA-256 gebunden)
→ CycloneDX-SBOM (dist/security/sbom.cdx.json, an source+lock gebunden)
→ Release-Manifest (dist/control-plane/release-manifest.json, bereits vorhanden aus M5A/früherer Arbeit)
→ in-toto/SLSA-v1-Provenance-Statement (dist/security/provenance.json)
→ actions/attest-build-provenance (Sigstore-Signatur, GitHub-Transparency-Log)
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
| `.github/workflows/ci.yml` | neuer Job `supply-chain-attestation` (nur `push`+`main`, eigene minimale Berechtigungen `contents: read`, `id-token: write`, `attestations: write` — NICHT workflow-weit, damit PR-Läufe diese Rechte nie erhalten). |

## 3. Provenance-Format

In-toto Statement v1 (`https://in-toto.io/Statement/v1`) mit SLSA-Provenance-v1-Prädikat
(`https://slsa.dev/provenance/v1`). `subject` bindet `release-manifest.json` und `sbom.cdx.json`
per SHA-256. `predicate.buildDefinition.resolvedDependencies` bindet den exakten Git-Commit und
den Lockfile-Digest. `predicate.runDetails.builder.id` ist die GitHub-Actions-Workflow-URL (nicht
irgendeine Agenten-/Modell-/Provider-Identität) — außerhalb von GitHub Actions wird explizit
`local-developer-build` gesetzt, was `--require-ci` gezielt ablehnt.

Bewusst **kein** selbstgebautes „Signieren": die Vertrauensbasis ist ausschließlich
`actions/attest-build-provenance@4d101475d8b20a2381f78447822ac1eab6504dd8` (Tag `v4.2.2`, Commit-
SHA verifiziert per `git clone --branch v4.2.2` direkt gegen `github.com/actions/attest-build-provenance`,
nicht nur aus einer gescrapten Seite übernommen) — Sigstore-basiert, GitHub-gehostet, unabhängig
nachprüfbar über GitHubs Transparency-Log. Ein lokal erzeugtes „Signat" wäre wertlos, da kein
vertrauenswürdiges Schlüsselmaterial in diesem Repository oder auf einem Entwickler-Laptop liegt.

## 4. Required Positive Tests (Runbook) — Nachweis

| Test | Nachweis |
|---|---|
| SBOM für exakten Quell-/Lock-Zustand erzeugt | `tests/unit/dependencySecurity.test.ts` (2 neue Tests) + lokaler Ende-zu-Ende-Lauf (Abschnitt 5) |
| SBOM enthält erwartete Top-Level-Identität + Dependency-Inventar | bestehender Test, unverändert grün |
| Provenance-Subject-Digest == gebautes Artefakt | `tests/unit/verifySupplyChainProvenance.test.ts` „PASS: consistent chain" + lokaler Lauf |
| Quellreferenz == exakter Commit-SHA | dito |
| Attestation verifiziert mit erwarteter Builder-Identität | **noch offen** — erst nach erstem echten `push`-Lauf möglich, siehe Abschnitt 1 |
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

Nach Merge: erster `push`-Lauf auf `main` löst `supply-chain-attestation` real aus. Danach:
Attestation-URL/-ID, Builder-Workflow-Ref und `--require-ci`-PASS-Nachweis als Nachtrag in diesem
Dokument ergänzen, Roadmap auf M6 `VERIFIED PASS` heben. Bis dahin bleibt der Status
`CODE COMPLETE / CI ATTESTATION PENDING FIRST MAIN PUSH`.
