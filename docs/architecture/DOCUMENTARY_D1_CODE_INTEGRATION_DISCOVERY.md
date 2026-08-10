# Documentary D1 — Code Integration & Discovery

Status: IMPLEMENTED IN DRAFT  
Date: 2026-08-10  
Authority: ESS-0010, ESS-0011, ESS-0012  
Foundation: D0 / PR #161 / main `0d3ed9c5fde536435c1a21d6f4e0ca4c92385b7b`

## Deutsch

D1 führt eine read-only Code-Evidence-Schicht für Documentary ein. Ziel ist nicht, Source Code zu verändern, sondern den aktuellen Repository-Zustand reproduzierbar an einen Git-Commit zu binden.

### Evidence-Modell
Jedes Evidence-Element enthält:
- `evidenceId` als stabilen Hash aus Kind, Commit, Pfad und Symbol;
- `kind`: module, export, contract, route, event, manifest oder dependency;
- `componentId`;
- `sourceCommit`;
- Repository-Pfad;
- optional Symbol und Detail.

### Discovery Scope
Der Scanner erfasst:
1. Source-Module unter den unterstützten JS/TS-Erweiterungen;
2. exportierte Klassen, Funktionen, Konstanten, Interfaces, Types und Enums;
3. Type-/Interface-Contracts;
4. Express-/Router-Routen mit statischem Pfad;
5. Event-Symbole nach dem kanonischen `*Event`-Muster;
6. Platform-`manifest.json`-Dateien;
7. deklarierte Manifest-Abhängigkeiten.

### Determinismus und Provenance
Ein gültiger Git-Commit-SHA ist verpflichtend. Ohne Commit schlägt die Discovery fail-closed fehl. Der Output enthält keinen Laufzeit-Timestamp und wird stabil sortiert; derselbe Repository-Zustand und derselbe Commit erzeugen damit dieselbe Evidence Map.

### Grenzen
- keine AST-basierte Mutation;
- keine Dateiänderung durch Discovery;
- keine autonome Dokumentgenerierung;
- keine Event-Publikation;
- keine Änderung von APIs, DB-Schemas, ENV Keys, Stripe, Supabase oder Render;
- keine zweite Traceability- oder Event-Authority.

Regex Discovery ist bewusst die erste Evidence-Schicht. Eine spätere TypeScript-Compiler-/AST-Analyse darf die Präzision erhöhen, muss jedoch denselben read-only Evidence Contract bedienen.

### Exit-Kriterien
- [x] Code-Evidence-Contract implementiert;
- [x] Module/Exports/Contracts/Routes/Events/Manifeste/Dependencies erkennbar;
- [x] Commit-Provenance verpflichtend;
- [x] deterministische Evidence IDs und Sortierung;
- [x] Regressionstests implementiert;
- [ ] Draft-CI und Governance grün;
- [ ] Merge und main-CI-/Docker-/Render-Gate grün.

## English
D1 introduces a read-only repository code-evidence layer for Documentary. Evidence is bound to a required source commit and covers modules, exports, contracts, static routes, event symbols, platform manifests and declared dependencies. The scanner is deterministic for the same repository state and commit, performs no code mutation, and creates no new event or traceability authority.
