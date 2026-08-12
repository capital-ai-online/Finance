# Pull Request Check Classification

Status: REQUIRED
Authority: CAPITAL-AI DevelopmentChain
Companion authority: `docs/governance/PR_EXECUTION_RIGHTS_CLASSIFICATION.md`

## Zweck

Dieses Dokument legt fest, welche Checks ein Pull Request abhängig vom tatsächlichen Änderungsumfang durchlaufen muss. Ziel ist, unnötige CI-Läufe zu vermeiden, ohne Sicherheits-, Qualitäts- oder Human-/Owner-Gates zu schwächen.

Die technische Checkklasse bestimmt **keine Ausführungsrechte**. Jeder PR muss zusätzlich ein zulässiges Execution Profile nach `PR_EXECUTION_RIGHTS_CLASSIFICATION.md` ausweisen.

## Begriffe

### Threat Model

Ein Threat Model beschreibt Assets, Trust Boundaries, mögliche Angreifer/Fehlbedienungen, Angriffswege, Auswirkungen und Gegenmaßnahmen. Es ist vor allem erforderlich, wenn ein PR Authentisierung, Autorisierung, Agent-Capabilities, Secrets, externe Schreibzugriffe, neue Trust Boundaries oder Produktionsmutationen einführt.

### Negative Tests

Negative Tests prüfen nicht den gewünschten Happy Path, sondern beweisen, dass verbotene Zustände fail-closed abgelehnt werden. Beispiele: falscher Actor, fehlende Capability, falscher PR-Head-SHA, Replay, abgelaufene Approval-Evidence, falsche WebAuthn Origin/RP-ID, unerlaubter Produktionszugriff oder ungültige Konfiguration.

### Rollback-Runbook

Ein Rollback-Runbook definiert, wie nach einer fehlerhaften Mutation der letzte verifizierte Zustand wiederhergestellt wird. Es enthält Trigger, Verantwortlichkeit, Rücksetzschritte, Daten-/Konfigurationsfolgen und Verifikation. Bei reinem Repository-Code kann `git revert` genügen. Externe Mutationen an Supabase, Stripe, Render, Credentials, Deployments oder Schemas benötigen ein explizites Runbook.

## Checkklassen

### D — Documentation-only

Nur `docs/**`, `.ai/**` oder Markdown; keine Runtime-, Workflow-, Dependency- oder Deployment-Datei.

Pflicht: Owner-Gate, Governance/Security, Docs-Fast-Path, `build-and-test`.

Nicht erforderlich: npm, TypeScript, Unit Tests, Production Build, Docker.

Typisches Execution Profile: P1. D erteilt keine externe Mutationsberechtigung.

### C — Application / Test / Configuration

Anwendungs-/Servicecode, Tests oder nicht-dokumentarische Konfiguration ohne Runtime-/Deployment-Relevanz.

Pflicht zusätzlich zu Owner/Governance: Git-/Toolchain-Integrität, `npm ci`, Production Dependency Audit, Production Config Invariants, Docker-Hardening-Policy-Check, TypeScript/Lint, Unit Tests, Production Build, CSP-Test, Predeploy-Check, `build-and-test`.

Typisches Execution Profile: P2 oder REM-bounded P4. C erteilt keine externe Plattformmutation.

### R — Runtime / Dependency / Docker / Deployment

Dockerfile, Dependency-Manifeste, Server/Runtime, Render-Konfiguration, Runtime-/Docker-Security oder relevante Workflows.

Pflicht: vollständige Klasse C plus Docker Image Build, Image User/CMD/Healthcheck, Workflow Security bei Workflow-Änderungen sowie Deployment-/Rollback-Nachweis wenn Produktionsverhalten betroffen ist.

Typisches Execution Profile: P2 für Repository-Runtime; P3/P4 nur für separat autorisierte Integrations-/Mutationstätigkeit. Ein R-PR deployt nicht automatisch produktiv.

### M — External Platform Mutation

Geplante Mutation an Supabase, Stripe, Render oder anderer produktionsverbundener Plattform.

Pflicht zusätzlich: autorisierende Roadmap/ADR/ESS, Owner Mutation Approval, Pre-Mutation Baseline/Test, ausführbares Rollback-Runbook, protokollierte Mutation, Post-Mutation Verification und Evidence. Der nächste Roadmap-Schritt bleibt bis `VERIFIED PASS` blockiert.

Execution Profile: P3 oder P4 mit separater scope-bound Mutation Approval. Human-reservierte P0-Aktionen bleiben auch in M nicht delegierbar.

## Automatische Auswahlregel

Vor PR-Erstellung wird anhand der Changed Files und des geplanten Side Effects klassifiziert:

1. ausschließlich `docs/**`, `.ai/**` oder Markdown ohne Runtime-/Workflow-Bezug → D;
2. Application/Test/Config ohne Runtime-/Deployment-Relevanz → C;
3. `Dockerfile`, `package*.json`, `server.ts`, `server/**`, `render.yaml`, Runtime-/Docker-Security oder relevante Workflows → R;
4. geplanter externer produktionsverbundener Side Effect → M;
5. mehrere Treffer → strengste Klasse;
6. unklarer Scope → höhere technische Klasse bis Human Review die Einstufung reduziert.

Die Klasse muss im PR-Template begründet und mit dem Execution Profile gekoppelt werden.

## Rechte-Kopplung

Zusätzlich zur Checkklasse sind verpflichtend anzugeben:

- Execution Profile P1/P2/P3/P4 oder `P0 HUMAN REQUIRED`;
- ausführender Principal/Agent;
- erlaubte Capabilities;
- verbotene/reservierte Capabilities;
- External Mutation State;
- Authority-Referenzen.

Bei Konflikt gilt fail-closed: **höhere Checkklasse, geringere Ausführungsautorität, Human Review**.

## Auswahlregel für neuen Scope

Ein neuer Commit, der den Scope erweitert,

- kann die Checkklasse erhöhen;
- kann ein anderes Execution Profile erforderlich machen;
- invalidiert die vorherige Human-/Owner-Freigabe für den alten Head;
- darf niemals stillschweigend zusätzliche Agentenrechte erzeugen.

## Merge-Regel

Ein PR ist nur merge-fähig, wenn:

1. Owner-Gate für den aktuellen Head erfüllt ist;
2. alle Checks der gewählten Klasse PASS sind;
3. Execution Profile und tatsächlicher Scope übereinstimmen;
4. keine reservierte P0-Aktion an einen Agenten delegiert wurde;
5. `build-and-test` PASS ist;
6. Governance PASS ist;
7. keine offenen merge-blockierenden Funde bestehen;
8. eine separate ausdrückliche menschliche Merge-Anweisung vorliegt.
