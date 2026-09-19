# Pull Request Check Classification

Status: ACTIVE  
Updated: 2026-09-10  
Authority: CAPITAL-AI DevelopmentChain / `CTRL-CI-HOSTED-001`

## Zweck

Dieses Dokument legt fest, welche technischen Validierungen ein Pull Request abhängig vom tatsächlichen Änderungsumfang durchlaufen muss. Ziel ist, unnötige GitHub-Hosted-CI-Kosten zu vermeiden, ohne Sicherheits-, Qualitäts- oder Merge-Gates zu schwächen.

Der Required-Check-Kontext `build-and-test` bleibt als unabhängiger technischer Check für den finalen PR-Head bestehen. **Der Name des Check-Kontexts bedeutet nicht, dass jeder PR einen Production Build oder die vollständige Production-Testkette ausführen muss.** Die teuren Schritte innerhalb des Checks werden scope-basiert klassifiziert.

### Owner-Entscheidung 2026-09-01 — Production-Scope-Regel

Production Build/Test eines Pull Requests wird nur ausgeführt, wenn der geänderte Scope die **Buildfähigkeit, Runtime, Deploymentfähigkeit oder Production-Artefakte** beeinflussen kann. Nicht deploymentrelevante Änderungen erhalten ausschließlich die für ihren Scope erforderlichen Validierungen.

Diese Regel konkretisiert `CTRL-CI-HOSTED-001` und die bestehende ADR-0073-Single-`build-and-test`-Architektur. Sie ändert weder Human/CODEOWNER-Merge-Authority noch die Production-Pipeline auf `main`.

Der Required-Check-Workflow darf nicht über `paths`/`paths-ignore` für nicht produktionsrelevante PRs vollständig unterdrückt werden. Stattdessen bleibt der Check vorhanden und überspringt innerhalb des Jobs die nicht erforderlichen Production-Schritte. Dadurch bleibt der Required-Check-Vertrag deterministisch.

## Begriffe

### Production Impact

Ein Änderungsumfang hat `production_impact=true`, wenn er die gebaute oder ausgelieferte Anwendung, ihre Buildfähigkeit, Runtime, produktive Konfiguration, Abhängigkeiten, Container-/Deployment-Artefakte oder die Production-Deployment-Kette beeinflussen kann.

Typische Beispiele:

- `src/**`, produktive Assets und Anwendungseinstiegspunkte;
- Server-/Runtime-Code;
- Dependency-Manifeste und Lockfiles;
- Build-/Compiler-Konfiguration, sofern sie das Produktionsartefakt beeinflussen kann;
- Docker-/Render-/Deployment-Konfiguration;
- der kanonische Production-CI-/Deploy-Workflow.

Bekannt nicht produktionsrelevante Validierungsflächen, beispielsweise Documentation-only, Test-only, PR-/Governance-Validatoren oder nicht deployende Governance-Workflows, erhalten `production_impact=false`, solange kein produktionsrelevanter Pfad im selben PR enthalten ist.

Unbekannte nicht-dokumentarische Pfade werden fail-closed als potentiell produktionsrelevant behandelt, bis sie ausdrücklich und überprüfbar als reine Validierungs-/Tooling-Fläche klassifiziert sind.

### Threat Model

Ein Threat Model beschreibt Assets, Trust Boundaries, mögliche Angreifer/Fehlbedienungen, Angriffswege, Auswirkungen und Gegenmaßnahmen. Es ist vor allem erforderlich, wenn ein PR Authentisierung, Autorisierung, Agent-Capabilities, Secrets, externe Schreibzugriffe, neue Trust Boundaries oder Produktionsmutationen einführt.

### Negative Tests

Negative Tests prüfen nicht den gewünschten Happy Path, sondern beweisen, dass verbotene Zustände fail-closed abgelehnt werden. Beispiele: falscher Actor, fehlende Capability, falscher PR-Head-SHA, Replay, abgelaufene Approval-Evidence, falsche WebAuthn Origin/RP-ID, unerlaubter Produktionszugriff oder ungültige Konfiguration.

### Rollback-Runbook

Ein Rollback-Runbook definiert, wie nach einer fehlerhaften Mutation der letzte verifizierte Zustand wiederhergestellt wird. Es enthält Trigger, Verantwortlichkeit, Rücksetzschritte, Daten-/Konfigurationsfolgen und Verifikation. Bei reinem Repository-Code kann `git revert` genügen. Externe Mutationen an Supabase, Stripe, Render, Credentials, Deployments oder Schemas benötigen ein explizites Runbook.

## Checkklassen

### D — Documentation-only

Nur `docs/**`, `.ai/**` oder Markdown.

Pflicht: Governance/Security, Docs-Fast-Path und erfolgreicher Required-Check-Kontext `build-and-test`.

Nicht erforderlich: `npm ci`, TypeScript/Lint, Unit Tests, Production Build, Production-CSP-Test, Predeploy oder Docker.

`production_impact=false`.

### C — Application / Test / Configuration

Nicht-dokumentarische Änderungen ohne Runtime-/Dependency-/Docker-/Deployment-Klasse R. Klasse C wird zusätzlich nach Production Impact differenziert.

#### C-P — production-impacting

Beispiele: Anwendungscode oder sonstige Änderungen, die Buildfähigkeit oder das Production-Artefakt beeinflussen können.

Pflicht nach Scope: Repository-/Toolchain-Integrität, Node/npm, TypeScript/Lint, Unit Tests, Production Build, Production-CSP-Test und Predeploy. Nicht benötigte Teilprüfungen dürfen nur dann entfallen, wenn die maschinenlesbare Scope-Klassifikation dies deterministisch begründet.

`production_impact=true`.

#### C-N — non-production validation/tooling

Beispiele: reine Tests, `scripts/pr/**`, `scripts/governance/**`, nicht deployende `.github/**`-Governance-/Policy-Flächen und Kombinationen daraus.

Pflicht: ausschließlich die für den geänderten Scope erforderlichen Validatoren, beispielsweise Node, Lint, Unit-/Validator-Tests oder Workflow-Security.

Nicht erforderlich: Production Build, Production-CSP-Test, Production-Config-/Predeploy-Check oder Docker, solange kein produktionsrelevanter Pfad im PR enthalten ist.

`production_impact=false`.

### R — Runtime / Dependency / Docker / Deployment

Dockerfile, Dependency-Manifeste, Server/Runtime, Render-Konfiguration, Runtime-/Docker-Security, `ci.yml` oder relevante Deploy-Workflows.

Pflicht: vollständige Production-Validierung einschließlich Node/npm, Dependency Audit, TypeScript/Lint, Unit Tests, Production Build, CSP/Predeploy, Docker-Hardening und Docker-Image-Prüfung sowie Workflow Security bei Workflow-Änderungen. Deployment-/Rollback-Nachweis ist zusätzlich erforderlich, wenn Produktionsverhalten betroffen ist.

`production_impact=true`.

### M — External Platform Mutation

Geplante Mutation an Supabase, Stripe, Render oder anderer produktionsverbundener Plattform.

Pflicht zusätzlich: autorisierende Roadmap/ADR/ESS, Owner Mutation Approval, Pre-Mutation Baseline/Test, ausführbares Rollback-Runbook, protokollierte Mutation, Post-Mutation Verification und Evidence. Der nächste Roadmap-Schritt bleibt bis `VERIFIED PASS` blockiert.

## Auswahlregel

Die strengste zutreffende Klasse gilt für den gesamten PR. Ein einzelner produktionsrelevanter Pfad eskaliert einen gemischten PR auf `production_impact=true`; bekannte Non-Production-Pfade dürfen einen produktionsrelevanten Pfad niemals herunterstufen.

Ein neuer Commit, der den Scope erweitert, kann Checkklasse oder Production Impact erhöhen und invalidiert die vorherige Scope-Entscheidung für den neuen Head.

Für `push` auf `main` gilt unabhängig vom ursprünglichen PR-Scope weiterhin **Full Production CI**. Die Production-Promotion-Kette darf nicht aus einem eingeschränkten PR-Check wiederverwendet oder abgekürzt werden.

## Supabase Free-Tier Preflight

Supabase Preview Branching ist im aktuellen Free-Tier-Betrieb kein verlässlicher PR-Gate. Für Supabase-relevante Änderungen wird stattdessen der repository-eigene **Supabase Preflight** verwendet.

Der Preflight wird ausschließlich nach ausdrücklicher Owner-Freigabe über `workflow_dispatch` gestartet. Er erzeugt keinen Preview Branch und führt keine Supabase-Mutation aus. Vor dem Provider-Zugriff muss der PR offen, same-repository, auf `main` basiert, an den freigegebenen Head-SHA gebunden und `behind=0` sein.

Die Provider-Prüfung verwendet die bestehende `SUPABASE_DB_URL` nur in einer serverseitig erzwungenen read-only PostgreSQL-Session. Verglichen werden:

- Erreichbarkeit der freigegebenen Produktionsdatenbank;
- live `supabase_migrations.schema_migrations`;
- der kanonische Migration-Ledger aus CAPITAL-AI-OPS;
- die Migrationen des exakten PR-Kandidaten.

Neue lokale Migrationen dürfen als explizite `local_only_migrations` vorliegen; unbekannte Remote-Migrationen, geänderte Remote-Namen, fehlende Ledger-Klassifikation, falscher Projektbezug oder PR/Main-Drift führen fail-closed zu FAIL.

Der Check ersetzt keinen Security-Gate. GitGuardian, HIGH/CRITICAL-CVE-Gate, Governance und `build-and-test` bleiben unabhängig. Supabase Security-Advisor-Befunde werden weiterhin nach ADR-0031 bewertet; planbedingt nicht verfügbare Features dürfen nicht als PASS dargestellt werden.

## Merge-Regel

Ein PR ist merge-fähig, wenn:

1. alle für seine Klasse und seinen Production-Impact ausgewählten Checks PASS sind;
2. der Required-Check-Kontext `build-and-test` PASS ist;
3. Governance PASS ist;
4. keine offenen merge-blockierenden Funde bestehen;
5. eine separate ausdrückliche menschliche Merge-Anweisung vorliegt (Agenten mergen nicht).

Ein `build-and-test` PASS bei `production_impact=false` bestätigt den erfolgreich scope-reduzierten technischen Check; er behauptet **nicht**, dass ein Production Build ausgeführt wurde.

**Nicht erforderlich:** Owner-Body-Checkboxen, Review-Text `💪`/`okay`, Viewed-Attestation als CI-Gate.

M10 `AUTHORIZE_PR_CI` ist gemäß current `AGENTS.md` **RETIRED / OFF**. Historische Suspendierungs-/Reaktivierungsbedingungen sind nicht mehr current-state-autorisierend; ein zukünftiger PR-CI-/Passkey-Mechanismus erfordert eine neue separat gescopte Human/Owner-Architektur- und Authority-Entscheidung und ist keine M10-Reaktivierung.