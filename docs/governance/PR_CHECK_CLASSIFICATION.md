# Pull Request Check Classification

Status: PROPOSED
Authority: CAPITAL-AI DevelopmentChain

## Zweck

Dieses Dokument legt fest, welche Checks ein Pull Request abhängig vom tatsächlichen Änderungsumfang durchlaufen muss. Ziel ist, unnötige CI-Läufe zu vermeiden, ohne Sicherheits-, Qualitäts- oder Human-/Owner-Gates zu schwächen.

## Begriffe

### Threat Model

Ein Threat Model beschreibt Assets, Trust Boundaries, mögliche Angreifer/Fehlbedienungen, Angriffswege, Auswirkungen und Gegenmaßnahmen. Es ist vor allem erforderlich, wenn ein PR Authentisierung, Autorisierung, Agent-Capabilities, Secrets, externe Schreibzugriffe, neue Trust Boundaries oder Produktionsmutationen einführt.

### Negative Tests

Negative Tests prüfen nicht den gewünschten Happy Path, sondern beweisen, dass verbotene Zustände fail-closed abgelehnt werden. Beispiele: falscher Actor, fehlende Capability, falscher PR-Head-SHA, Replay, abgelaufene Approval-Evidence, falsche WebAuthn Origin/RP-ID, unerlaubter Produktionszugriff oder ungültige Konfiguration.

### Rollback-Runbook

Ein Rollback-Runbook definiert, wie nach einer fehlerhaften Mutation der letzte verifizierte Zustand wiederhergestellt wird. Es enthält Trigger, Verantwortlichkeit, Rücksetzschritte, Daten-/Konfigurationsfolgen und Verifikation. Bei reinem Repository-Code kann `git revert` genügen. Externe Mutationen an Supabase, Stripe, Render, Credentials, Deployments oder Schemas benötigen ein explizites Runbook.

## Checkklassen

### D — Documentation-only

Nur `docs/**`, `.ai/**` oder Markdown.

Pflicht: Owner-Gate, Governance/Security, Docs-Fast-Path, `build-and-test`.

Nicht erforderlich: npm, TypeScript, Unit Tests, Production Build, Docker.

### C — Application / Test / Configuration

Anwendungs-/Servicecode, Tests oder nicht-dokumentarische Konfiguration ohne Runtime-/Deployment-Relevanz.

Pflicht zusätzlich zu Owner/Governance: Git-/Toolchain-Integrität, `npm ci`, Production Dependency Audit, Production Config Invariants, Docker-Hardening-Policy-Check, TypeScript/Lint, Unit Tests, Production Build, CSP-Test, Predeploy-Check, `build-and-test`.

### R — Runtime / Dependency / Docker / Deployment

Dockerfile, Dependency-Manifeste, Server/Runtime, Render-Konfiguration, Runtime-/Docker-Security oder relevante Workflows.

Pflicht: vollständige Klasse C plus Docker Image Build, Image User/CMD/Healthcheck, Workflow Security bei Workflow-Änderungen sowie Deployment-/Rollback-Nachweis wenn Produktionsverhalten betroffen ist.

### M — External Platform Mutation

Geplante Mutation an Supabase, Stripe, Render oder anderer produktionsverbundener Plattform.

Pflicht zusätzlich: autorisierende Roadmap/ADR/ESS, Owner Mutation Approval, Pre-Mutation Baseline/Test, ausführbares Rollback-Runbook, protokollierte Mutation, Post-Mutation Verification und Evidence. Der nächste Roadmap-Schritt bleibt bis `VERIFIED PASS` blockiert.

## Auswahlregel

Die strengste zutreffende Klasse gilt für den gesamten PR. Ein neuer Commit, der den Scope erweitert, kann die Checkklasse erhöhen und invalidiert die vorherige Human-/Owner-Freigabe für den alten Head.

## Merge-Regel

Ein PR ist nur merge-fähig, wenn:

1. Owner-Gate für den aktuellen Head erfüllt ist;
2. alle Checks der gewählten Klasse PASS sind;
3. `build-and-test` PASS ist;
4. Governance PASS ist;
5. keine offenen merge-blockierenden Funde bestehen;
6. eine separate ausdrückliche menschliche Merge-Anweisung vorliegt.
