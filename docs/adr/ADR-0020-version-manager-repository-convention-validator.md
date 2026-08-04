# ADR-0020: Naming & Repository Convention Validator als Capability des Enterprise Version Managers

## Status

Angenommen — 2026-08-03

## Kontext

CAPITAL-AI besitzt mit ESS-0004 bereits einen Enterprise Version Manager als verantwortliche Plattformkomponente fuer Versionskonsistenz, Release-Vorbereitung und Rollback-Planung. Gleichzeitig existieren verbindliche Naming-, Repository- und Exception-Regeln in ESS-0001-CONTRACTS sowie die Enterprise Exception Registry aus ADR-0011.

Ein vorangegangener Produktions-Build machte sichtbar, dass Legacy-Projektidentitaeten wie `react-example@0.0.0` bis in Build-Metadaten gelangen koennen, wenn Projektname und Version nicht systematisch gegen Lockfile und Governance-Artefakte validiert werden. Zudem dokumentiert ADR-0019 Risiken durch case-sensitive/case-insensitive Pfadabweichungen.

Die technische Deployment-Pipeline verfolgt jedoch einen anderen Zweck: Sie soll feststellen, ob ein konkreter Build technisch und sicher in der Live-Umgebung betrieben werden kann. Allgemeine Governance-, Naming-, ADR-/ESS- oder Repository-Policy-Regeln sind deshalb dort nicht als hartes Deployment-Gate zu adressieren.

## Entscheidung

Der Enterprise Version Manager wird um eine **Naming & Repository Convention Validator**-Capability erweitert. Es wird kein separater Agent eingefuehrt.

Die Implementierung liegt unter:

```text
src/platform/VersionManager/repositoryConventionValidator.ts
```

und ist ueber folgenden Lifecycle-Entry-Point aufrufbar:

```text
scripts/automation/validateRepositoryConventions.ts
```

Die Capability ist **read-only**. Sie darf Quellcode, Dokumentation, Registry-Eintraege, Versionsstaende oder Ausnahmegenehmigungen nicht selbsttaetig veraendern.

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

Alle Findings werden ausgegeben. Fehler blockieren den Prozess nicht. Dieser Modus dient Bestandsanalyse, Migration und Review.

### Strict

```bash
npm run repository:validate
```

Findings der Severity `error` beenden diesen gezielt gestarteten Governance-/Quality-Check mit Exit Code 1. Dieser Strict Mode ist **kein Bestandteil des technischen Deployment-Gates**.

## Trennung von Governance und Deployment-Readiness

Die Wertschöpfungskette wird in zwei getrennte Kontrollachsen aufgeteilt:

```text
Code / Architektur / Dokumentation
        |
        +-------------------------------+
        |                               |
        v                               v
Governance & Quality                Deployment Readiness
        |                               |
        +--> Naming Validator           +--> Build / Compile
        +--> ADR / ESS Compliance       +--> produktionsrelevante Tests
        +--> Repository Governance      +--> Security Invariants
        +--> Traceability               +--> Env / Container Readiness
        +--> Candidate Review           +--> Runtime / Health Readiness
        |                               |
        v                               v
Findings / Review                  Deployable / Not Deployable
        |                               |
        +---------------+---------------+
                        |
                        v
                 Release / Handoff
```

`predeploy:check` darf den Repository Convention Validator deshalb nicht aufrufen. Die Deployment-Pipeline beantwortet ausschliesslich die Frage, ob der konkrete Build technisch und sicher in der Live-Umgebung betrieben werden kann.

Governance- und Repository-Policy-Findings bleiben wirksam und nachvollziehbar, werden aber in der Governance-/Quality-Schicht behandelt und nicht als technische Deployability-Fehler fehladressiert.

## Governance-Grenzen

Der Validator:

- genehmigt keine Enterprise Exceptions;
- korrigiert keine Dateien automatisch;
- vergibt keine ADR- oder ESS-Nummern;
- fuehrt keine Versions-Bumps aus;
- ersetzt weder Supervisor noch Platform Director;
- trifft keine Release-Freigabeentscheidung;
- entscheidet nicht ueber technische Live-Deployability.

## Fehlerklassifikation

`error` bezeichnet innerhalb eines gezielt gestarteten Governance-Checks objektive Regelverletzungen, beispielsweise falsche Projektidentitaet, ungueltige Semantic Version, package/package-lock Drift, case-insensitive Pfadkollisionen oder abgelaufene Enterprise Exceptions.

Diese Klassifikation ist nicht gleichbedeutend mit einem Deployment-Fehler. Ein Governance-Error darf nur dann einen technischen Deploy verhindern, wenn dieselbe Abweichung zugleich eine nachweisbare technische oder sicherheitsrelevante Deployment-Voraussetzung verletzt.

`warning` kennzeichnet Naming- oder Governance-Abweichungen, die sichtbar gemacht werden muessen, aber keinen technischen Release-Abbruch erzeugen.

## Konsequenzen

### Positiv

- einheitliche Verantwortung innerhalb ESS-0004 statt parallelem Naming-Agenten;
- fruehe Erkennung von package-/lockfile-Drift;
- Schutz vor Rueckkehr der Legacy-Identitaet `react-example`;
- plattformuebergreifende Erkennung von Case-Kollisionen;
- maschinenlesbare Findings fuer Supervisor, Quality Center und Release Review;
- klare Trennung zwischen Governance-Konformitaet und technischer Deployability;
- keine neue Runtime-Abhaengigkeit.

### Negativ

- Governance-Findings muessen ausserhalb der Deployment-Pipeline ausgewertet werden;
- bestehende Naming-Abweichungen koennen weiterhin Review-Aufwand erzeugen;
- eine technische Pipeline allein kann keine vollstaendige Architekturkonformitaet garantieren.

## Rollback

Die Erweiterung ist ohne Datenmigration und ohne externen Infrastrukturzustand implementiert. Rollback erfolgt durch Ruecknahme von:

```text
src/platform/VersionManager/repositoryConventionValidator.ts
scripts/automation/validateRepositoryConventions.ts
src/platform/VersionManager/repositoryConventionValidator.test.ts
```

sowie durch Entfernung der `repository:validate*`-Scripts. `predeploy:check` bleibt von dieser Capability unabhaengig.

Keine Supabase-, Stripe-, Render- oder sonstige Backend-Konfiguration ist fuer den Rollback anzupassen.

## Verifikation

Die Capability muss folgende Nachweise erbringen:

- Unit Test: konformes Repository wird im Strict Mode nicht blockiert.
- Unit Test: falsche Projektidentitaet wird erkannt.
- Unit Test: package-lock Versionsdrift wird erkannt.
- Unit Test: dieselben Fehler bleiben im Advisory Mode nicht-blockierend.
- `npm run repository:validate` als separater Governance-/Quality-Check.
- `npm run predeploy:check` ohne Repository-Governance-Gate.
- `npm run lint`.
- `npm test`.
- `npm run build` bzw. bestehende CI-Pipeline.

## Referenzen

- ESS-0001-CONTRACTS — Naming, Repository Governance, Exception Contract
- ESS-0004 — Enterprise Version Manager
- ADR-0011 — Bestandsschutz und Enterprise Exception Registry
- ADR-0019 — Fork-Divergenz und Nummernraumkonsolidierung
