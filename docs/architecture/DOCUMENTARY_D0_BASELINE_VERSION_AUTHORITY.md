# CAPITAL-AI Documentary D0 — Baseline, Manifest & Version Authority

Status: IMPLEMENTED IN DRAFT  
Date: 2026-08-10  
Roadmap: `DOCUMENTARY_EVENT_VALUE_CHAIN_ROADMAP.md`  
Primary Authority: ESS-0010 Documentary Engine  
Related: ESS-0004 Version Manager, ESS-0011 Traceability, ESS-0012 Documentation Governance

## Ziel

D0 schafft eine belastbare Ausgangsbasis für die weitere Documentary-Engine-Implementierung. Der Schritt implementiert noch keine Core Engine und keine neuen Events. Er beseitigt Versionsdrift, macht den realen Implementierungsgrad maschinenlesbar und trennt Component-, Document-Schema- und Platform-Version voneinander.

## Verifizierter Ausgangsstand

D0 basiert auf dem nach Roadmap-PR #160 verifizierten `main`-Commit `0657e6a224dc8a70ab73500297cd000c6cd064ac`. Main-CI #675 war einschließlich TypeScript, Unit-Tests, Production Build, CSP, Deployment Readiness, Docker Build, Runtime-Metadaten und Render-Production-Gate erfolgreich.

## Version Authorities

### Documentary Component Version

Authority: `src/platform/Documentary/manifest.json#version`

Aktueller Wert: `1.1.0`.

Die README darf die Version anzeigen, ist aber keine zweite Authority. Ein Regressionstest erzwingt die Übereinstimmung.

### Documentary Document Schema Version

Authority: `src/platform/Documentary/Versioning/DocumentaryVersion.ts#DOCUMENTARY_DOCUMENT_SCHEMA_VERSION`

Initialer Wert: `1.0.0`.

Diese Version beschreibt ausschließlich das Schema zukünftiger Documentary Document Models. Sie darf unabhängig von Component- und Platform-Version evolvieren.

### CAPITAL-AI Platform Version

Authority Chain: `src/platform/VersionManager/platformVersionAuthority.ts#getPlatformVersion` → `package.json#version`.

Documentary erzeugt keine eigene Plattformversion. Der neue side-effect-freie Version-Manager-Adapter liest ausschließlich die bereits durch GOV-VER-001/GOV-VER-002 geschützte Repository-Version.

## Implementierungsbaseline

`src/platform/Documentary/Architecture/documentary-baseline.json` trennt real implementierte von lediglich vorbereiteten Bereichen.

Implementiert:
- Contracts;
- Documentation;
- Versioning.

Noch nicht als Documentary Runtime implementiert:
- Discovery;
- Engine;
- Events;
- Generators;
- Governance;
- Interfaces;
- Knowledge;
- Mermaid;
- Migration;
- Models;
- Plugins.

`Architecture` enthält derzeit Baseline-/Architekturmetadaten und ist selbst kein Beleg für eine laufende Engine.

## Manifest Integrity

Das Documentary-Manifest wird in D0 auf Component-Version `1.1.0`, Partial-Implementation-Metadaten, explizite Version Authorities, reale Contracts/Tests/Dokumentation sowie die semantische Version-Manager-Abhängigkeit synchronisiert.

Das Vorhandensein eines Placeholder-Verzeichnisses darf nicht mehr als Implementierungsbeleg interpretiert werden. Der D0-Test verlangt für jedes als `implementedArea` deklarierte Gebiet mindestens eine reale TypeScript-Runtime-Datei.

## Schutzgrenzen

- keine Documentary Core Engine in D0;
- keine neuen Events;
- kein zweiter Version Manager;
- keine zweite Platform-Version-Authority;
- keine automatische Dokumentmutation;
- keine Änderung an Stripe, Supabase, Render, APIs, DB-Schemas oder ENV Keys;
- kein zusätzlicher GitHub-Actions-Workflow;
- bestehende CI-Kostenrichtlinie bleibt bindend.

## Exit-Kriterien

- [x] README-/Manifest-Versionsdrift beseitigt;
- [x] Component-/Schema-/Platform-Version semantisch getrennt;
- [x] Platform-Version über Version Manager Authority angebunden;
- [x] realer Documentary-Implementierungsgrad maschinenlesbar;
- [x] D0-Regressionstests implementiert;
- [ ] Draft-PR-CI und Governance erfolgreich;
- [ ] Merge und main-CI-/Docker-/Render-Gate erfolgreich.

## Nächster Schritt

Nach produktiv verifiziertem D0 folgt D1 — Code Integration & Discovery. D1 muss read-only Code Evidence mit Commit-SHA, Pfad, Symbol, Component-ID sowie Import-/Export-/Contract-/Route-/Event-Beziehungen erzeugen.
