# ADR-0020: Naming & Repository Convention Validator als Capability des Enterprise Version Managers

## Status

Angenommen — 2026-08-03

## Kontext

CAPITAL-AI besitzt mit ESS-0004 bereits einen Enterprise Version Manager als verantwortliche
Plattformkomponente fuer Versionskonsistenz, Release-Vorbereitung und Rollback-Planung.
Gleichzeitig existieren verbindliche Naming-, Repository- und Exception-Regeln in
ESS-0001-CONTRACTS sowie die Enterprise Exception Registry aus ADR-0011.

Ein vorangegangener Produktions-Build machte sichtbar, dass Legacy-Projektidentitaeten wie
`react-example@0.0.0` bis in Build-Metadaten gelangen koennen, wenn Projektname und Version nicht
systematisch gegen Lockfile und Governance-Artefakte validiert werden. Zudem dokumentiert
ADR-0019 konkrete Risiken durch case-sensitive/case-insensitive Pfadabweichungen zwischen
Entwicklungs- und Produktivstaenden.

Ein separater NameConvention-Agent wuerde die Verantwortung fuer Version-, Naming- und
Repository-Konformitaet auf eine weitere Komponente verteilen und damit die bestehende
ESS-0004-Verantwortung duplizieren.

## Entscheidung

Der Enterprise Version Manager wird um eine **Naming & Repository Convention Validator**-
Capability erweitert. Es wird kein separater Agent eingefuehrt.

Die Implementierung liegt unter:

```text
src/platform/VersionManager/repositoryConventionValidator.ts
```

und ist ueber folgenden Lifecycle-Entry-Point aufrufbar:

```text
scripts/automation/validateRepositoryConventions.ts
```

Die Capability ist **read-only**. Sie darf Quellcode, Dokumentation, Registry-Eintraege,
Versionsstaende oder Ausnahmegenehmigungen nicht selbsttaetig veraendern.

## Validierungsumfang

Der Validator prueft deterministisch:

1. Projektidentitaet `capital-ai` in `package.json`.
2. Semantic-Version-Format.
3. Synchronitaet von Name und Version zwischen `package.json` und `package-lock.json`.
4. ADR-Dateinamenskonvention.
5. ESS-Dateinamenskonvention.
6. PascalCase fuer React-Komponentendateien unter `src/components/`.
7. PascalCase fuer direkte Plattformkomponenten unter `src/platform/`.
8. Case-insensitive Pfadkollisionen im Repository.
9. Legacy-Projektidentitaet `react-example` in verbindlichen Metadatenartefakten.
10. Lesbarkeit der Enterprise Exception Registry und Ablauf zeitlich begrenzter Exceptions.

## Betriebsmodi

### Advisory

```bash
npm run repository:validate:advisory
```

Alle Findings werden ausgegeben. Auch Fehler blockieren den Prozess nicht. Dieser Modus dient
Migration, Bestandsanalyse und schrittweiser Bereinigung.

### Strict

```bash
npm run repository:validate
```

Findings der Severity `error` beenden den Prozess mit Exit Code 1. Warnungen bleiben sichtbar,
blockieren aber nicht.

## Einbindung in die Wertschöpfungskette

Der Strict Validator wird in `predeploy:check` vor der Deployment-Readiness-Pruefung ausgefuehrt:

```text
Code / Dokumentation
        |
        v
Enterprise Version Manager
        |
        +--> Naming & Repository Convention Validator
        |       |
        |       +--> package identity / version sync
        |       +--> naming contracts
        |       +--> case-collision detection
        |       +--> exception expiry
        |
        v
Predeploy Readiness
        |
        v
Release / Production Handoff
```

Damit wird eine blockierende Repository-Inkonsistenz vor der Produktionsuebergabe sichtbar.

## Governance-Grenzen

Der Validator:

- genehmigt keine Enterprise Exceptions;
- korrigiert keine Dateien automatisch;
- vergibt keine ADR- oder ESS-Nummern;
- fuehrt keine Versions-Bumps aus;
- ersetzt weder Supervisor noch Platform Director;
- trifft keine Release-Freigabeentscheidung.

Die Entscheidung ueber Ausnahmen und Release-Freigaben bleibt bei den in ESS-0001-CONTRACTS
festgelegten Governance-Instanzen.

## Fehlerklassifikation

`error` ist fuer objektiv blockierende Inkonsistenzen vorgesehen, beispielsweise:

- falsche Projektidentitaet;
- ungueltige Semantic Version;
- package/package-lock Drift;
- case-insensitive Pfadkollision;
- abgelaufene zeitlich begrenzte Enterprise Exception.

`warning` kennzeichnet Naming- oder Governance-Abweichungen, die sichtbar gemacht werden muessen,
aber fuer eine kontrollierte Bestandstransition nicht automatisch einen Release-Abbruch erzeugen.

## Konsequenzen

### Positiv

- einheitliche Verantwortung innerhalb ESS-0004 statt parallelem Naming-Agenten;
- fruehe Erkennung von package-/lockfile-Drift;
- Schutz vor Rueckkehr der Legacy-Identitaet `react-example`;
- plattformuebergreifende Erkennung von Case-Kollisionen;
- maschinenlesbare Findings fuer spaetere Supervisor-/Release-Center-Integration;
- keine neue Runtime-Abhaengigkeit.

### Negativ

- der initiale Regelumfang ist bewusst konservativ und deckt nicht jede moegliche
  Repository-Konvention ab;
- bestehende Naming-Abweichungen koennen Advisory-Warnungen erzeugen;
- neue blockierende Regeln duerfen nicht ohne Governance-Review hinzugefuegt werden.

## Rollback

Die Erweiterung ist ohne Datenmigration und ohne externen Infrastrukturzustand implementiert.
Rollback erfolgt durch Ruecknahme von:

```text
src/platform/VersionManager/repositoryConventionValidator.ts
scripts/automation/validateRepositoryConventions.ts
src/platform/VersionManager/repositoryConventionValidator.test.ts
```

sowie durch Entfernung der `repository:validate*`-Scripts und des Validator-Aufrufs aus
`predeploy:check`.

Keine Supabase-, Stripe-, Render- oder sonstige Backend-Konfiguration ist fuer den Rollback
anzupassen.

## Verifikation

Die Capability muss folgende Nachweise erbringen:

- Unit Test: konformes Repository wird in Strict Mode nicht blockiert.
- Unit Test: falsche Projektidentitaet wird blockiert.
- Unit Test: package-lock Versionsdrift wird blockiert.
- Unit Test: dieselben Fehler bleiben in Advisory Mode nicht-blockierend.
- `npm run repository:validate` gegen den Repository-Stand.
- `npm run lint`.
- `npm test`.
- `npm run build` bzw. bestehende CI-Pipeline.

## Referenzen

- ESS-0001-CONTRACTS — Naming, Repository Governance, Exception Contract
- ESS-0004 — Enterprise Version Manager
- ADR-0011 — Bestandsschutz und Enterprise Exception Registry
- ADR-0019 — Fork-Divergenz und Nummernraumkonsolidierung
