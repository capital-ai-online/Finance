# ADR-0019: Fork-Divergenz zwischen Entwicklungs- und Produktivstand, Konsolidierung des ADR- und ESS-Nummernraums

## Status

Angenommen — 2026-07-31

## Kontext

Im Rahmen des Enterprise-FinTech-Architektur-Audits (`docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md`,
Document ID `ARCH-AUDIT-0002`) wurde der Entwicklungsstand `CAPITAL-AI-Dev-main` mit dem
Produktivstand dieses Repositorys (Commit `3cb1771`) vollständig datei- und dokumentenbasiert
verglichen.

Der Vergleich hat ergeben, dass es sich **nicht um zwei Stände derselben Codebasis handelt,
sondern um zwei divergierte Forks**:

| Kennzahl | Wert |
|---|---|
| Dateien nur im Entwicklungsstand | 130 |
| Dateien nur im Produktivstand | 155 |
| Gemeinsame Dateien, inhaltlich verschieden | 55 |
| Gemeinsame Dateien, identisch | 119 |

Die Divergenz ist nicht auf Anwendungscode beschränkt, sondern betrifft den
Governance-Nummernraum selbst. Beide Stände haben unabhängig voneinander ADR- und
ESS-Nummern vergeben und belegen dieselben Nummern mit **unterschiedlichen Entscheidungen**.

### Kollisionen im ADR-Nummernraum

| ADR | Produktivstand (verbindlich) | Entwicklungsstand (abweichend) |
|---|---|---|
| ADR-0010 | Erweiterung des Enterprise Standards um ESS-0001-CONTRACTS | Enterprise Traceability Matrix |
| ADR-0011 | Bestandsschutz und Zielstruktur für Root-Abweichungen | Documentation Governance Validator |
| ADR-0012 | SecurityComplianceAuditor Integration | Enterprise Architecture Compliance Engine |
| ADR-0013 | Konsolidierung der ESS-Dokumentationsverantwortung | Enterprise Event Mesh |

Zusätzlich tragen drei sachlich identische Entscheidungen in beiden Ständen verschiedene
Nummern: Enterprise Event Mesh (Produktiv ADR-0018 / Entwicklung ADR-0013), Documentation
Governance Validator (ADR-0014 / ADR-0011), Enterprise Traceability (ADR-0015 / ADR-0010).

### Kollisionen im ESS-Nummernraum

Zehn ESS-Nummern bezeichnen in beiden Ständen unterschiedliche Komponenten:

| ESS | Produktivstand (verbindlich) | Entwicklungsstand (abweichend) |
|---|---|---|
| ESS-0002 | Supervisor Architect | Platform Governance Standard |
| ESS-0003 | Platform Director | AI Collaboration & Agent Value Chain |
| ESS-0004 | Enterprise Version Manager | Documentary Engine & Digital Twin |
| ESS-0005 | Quality Center | Knowledge Graph Architecture |
| ESS-0006 | Security & Compliance | Version Manager & Lifecycle |
| ESS-0007 | Enterprise Release Center | Master Supervisor |
| ESS-0008 | AI Agent Framework | Platform Director Architecture |
| ESS-0009 | Enterprise Knowledge Platform | Security & IAM Architecture |
| ESS-0010 | Documentary Engine | Repository Topology & Maintenance |
| ESS-0013 | Enterprise Event Mesh | Enterprise Architecture Compliance Engine |

`ESS-0014` ist im Produktivstand über `.ai/registry/ess-registry.json`
(`freeNumberSpaceStartsAt: "ESS-0014"`) ausdrücklich als **frei** deklariert, im
Entwicklungsstand jedoch mit „Enterprise Event Mesh Specification" belegt.

Die ESS-Registry des Produktivstands enthält die Regel, dass reservierte Nummern „niemals
abweichend belegt werden" dürfen und „kein KI-System ESS-Nummern eigenständig vergibt". Der
Entwicklungsstand besitzt keine Registry (`.ai/registry/` existiert dort nicht) und kennt das
Registry-Verfahren dokumentarisch nicht.

### Technisches Merge-Hindernis

Beide Stände enthalten eine vollständige, aber unvereinbare Implementierung der Enterprise
Event Mesh unter demselben Verzeichnispfad `src/platform/EventMesh/`. Der Produktivstand
verwendet PascalCase-Dateinamen (36 Dateien, ein Typ je Datei), der Entwicklungsstand
camelCase (19 Dateien, ein Konzern je Datei). Daraus ergeben sich **neun Kollisionen, die sich
ausschließlich in der Groß-/Kleinschreibung unterscheiden**:

```
Core/EventBus.ts            ↔ Core/eventBus.ts
Core/EventDispatcher.ts     ↔ Core/eventDispatcher.ts
Core/EventPublisher.ts      ↔ Core/eventPublisher.ts
Core/EventRouter.ts         ↔ Core/eventRouter.ts
Core/EventSubscriber.ts     ↔ Core/eventSubscriber.ts
Registry/ConsumerRegistry.ts ↔ Registry/consumerRegistry.ts
Registry/EventCatalog.ts    ↔ Registry/eventCatalog.ts
Registry/EventRegistry.ts   ↔ Registry/eventRegistry.ts
Registry/ProducerRegistry.ts ↔ Registry/producerRegistry.ts
```

Auf case-insensitiven Dateisystemen (macOS-Standard, Windows) sind das jeweils **derselbe
Pfad**. Ein unvorbereiteter Merge überschreibt dort Dateien ohne Konflikt und ohne Warnung.

## Entscheidung

1. **Der Produktivstand dieses Repositorys ist die führende Umgebung.** Bei jedem Widerspruch
   zwischen den beiden Ständen — Code, Dokumentation, Nummernvergabe, Namenskonvention — gilt
   der Produktivstand.

2. **Die ADR- und ESS-Belegung des Produktivstands ist verbindlich.** Die abweichende Belegung
   des Entwicklungsstands für ADR-0010 bis ADR-0013 sowie ESS-0002 bis ESS-0010, ESS-0013 und
   ESS-0014 wird als ungültig erklärt. `ESS-0014` bleibt frei; die nächste Vergabe erfolgt
   ausschließlich über `.ai/registry/ess-registry.json`.

3. **Übernahme von Code aus dem Entwicklungsstand erfolgt nur unter Neuvergabe.** Der
   Entwicklungsstand enthält Implementierungen, die im Produktivstand fehlen — insbesondere
   `server/compliance/` (Orchestrator, Engines, Evidence Collector, Remediation Planner),
   `server/documentary/documentaryEngine.ts`, sowie `src/platform/{Compliance,Documentary,Traceability}/`
   mit zusammen 51 TypeScript-Dateien. Eine Übernahme ist zulässig, jedoch nur, wenn
   (a) eine neue ESS-/ADR-Nummer über die Registry vergeben wird, (b) die Namenskonvention des
   Produktivstands (PascalCase je Typ) angewandt wird und (c) die im Audit dokumentierten
   Sicherheitsmängel des Entwicklungsstands vorher beseitigt sind.

4. **Kein direkter Merge des Verzeichnisses `src/platform/EventMesh/`.** Die neun
   Case-Kollisionen sind vor jeder Zusammenführung aufzulösen. Die Implementierung des
   Produktivstands bleibt maßgeblich; die Fassung des Entwicklungsstands wird nicht übernommen.

5. **Sicherheitsmerkmale werden nicht rückportiert.** Der Entwicklungsstand enthält
   Mechanismen, die im Produktivstand bewusst beseitigt wurden — insbesondere den
   hartkodierten Administrationstoken in `server/orchestrator.ts` und die Autorisierung über
   den vom Client gelieferten E-Mail-Parameter. Diese dürfen unter keinen Umständen in den
   Produktivstand gelangen. Die entsprechende Umgebungsvariable `ORCHESTRATOR_ADMIN_TOKEN`
   bleibt in `.env.example` des Produktivstands entfernt (ADR-0003.5).

## Begründung

Zwei parallel gepflegte Nummernräume machen jede Querverweisung mehrdeutig: Die Angabe
„siehe ESS-0004" löst je nach gelesenem Stand auf den Version Manager oder auf die Documentary
Engine auf. Damit ist die Traceability-Kette `ESS → ADR → Code` nicht mehr eindeutig
auflösbar, und die Dokumentation verliert ihre Revisionssicherheit — sie ist die Eigenschaft,
die das Governance-Gerüst überhaupt begründet.

Der Produktivstand wurde als führend gewählt, weil er die Governance-Infrastruktur trägt
(zwei Registries, 25 Komponenten-Manifeste, dokumentiertes Ausnahmeverfahren,
Verantwortungsmatrix) und weil sein Sicherheitsniveau deutlich höher liegt: JWT-basierte,
fail-closed ausgelegte Autorisierung mit Rollenmodell, Step-Up-Authentifizierung,
serverseitige Quota-Durchsetzung und fünf Datenbank-Migrationen mit Row-Level-Security. Der
Entwicklungsstand besitzt zwar mehr Anwendungscode, autorisiert Administrationszugriffe
jedoch ohne jedes Credential und ist in dieser Form nicht produktionsfähig.

Die Alternative — beide Stände als gleichrangig zu behandeln und modulweise zusammenzuführen —
wurde verworfen: Sie hätte für jede der zehn ESS- und vier ADR-Kollisionen eine
Einzelentscheidung erfordert, ohne dass eine der beiden Belegungen einen Vorrang begründen
könnte, und hätte die Mehrdeutigkeit für die Dauer der Zusammenführung fortgeschrieben.

## Konsequenzen

**Positiv**

- Der ADR- und ESS-Nummernraum ist wieder eindeutig; Querverweise sind auflösbar.
- Die ESS-Registry bleibt die alleinige Vergabestelle, ihre Regel wird durch diese Entscheidung
  bestätigt statt umgangen.
- Der Sicherheitsstand des Produktivsystems ist gegen Rückschritte durch Rückportierung
  geschützt.

**Negativ**

- Die im Entwicklungsstand vorhandenen Implementierungen (Compliance-Engines, Documentary
  Engine, Traceability, Meme-Coin-Agenten) stehen dem Produktivstand zunächst nicht zur
  Verfügung. Ihre Übernahme wird zu eigenständigen Vorhaben mit eigener Nummernvergabe.
- Dokumente des Entwicklungsstands, die auf die dortige Nummernbelegung verweisen, sind nach
  einer Übernahme jeweils anzupassen.

**Offen**

- Die im Audit festgestellten Reifegrad-Widersprüche (Entwicklungsstand meldet 76/100 und
  dreimal 100/100, Produktivstand misst 46/100, Governance 0/100) bleiben bestehen, bis die
  Kennzahlen des Entwicklungsstands zurückgezogen oder neu berechnet werden. Handgesetzte
  Reifegrade widersprechen ESS-0001-CONTRACTS Chapter 12, wonach Kennzahlen ausschließlich
  berechnet und niemals manuell gesetzt werden.

## Verweise

- `docs/architecture/ENTERPRISE_FINTECH_ARCHITECTURE_AUDIT.md` (ARCH-AUDIT-0002) — vollständige Befundlage
- `.ai/registry/ess-registry.json` — verbindliche ESS-Nummernvergabe
- `.ai/registry/exception-registry.json` — Ausnahmeverfahren
- `docs/adr/ADR-0003_5-identity-access-management.md` (resolved) — Ablösung des Administrationstokens
- `docs/adr/ADR-0018-enterprise-event-mesh.md` — verbindliche Event-Mesh-Entscheidung
