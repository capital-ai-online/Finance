# CAPITAL-AI Frontend Architecture & Interface Guidelines

**Status:** Canonical Frontend Architecture  
**Stand:** 23. August 2026  
**Framework:** React 19 / Vite 6 / Tailwind CSS 4 / Motion

## 1. Architekturposition und Dokumentrolle

Das Frontend ist die **Presentation- und Interaction-Schicht** der bestehenden CAPITAL-AI Architektur. Es wird ausdrücklich **kein** zusätzliches `src/platform/Frontend` und kein paralleler Root wie `src/frontend/` eingeführt.

Die bestehenden Enterprise-Module unter `src/platform/` bleiben fachliche und Governance-Authorities. Das Frontend projiziert deren Zustände und fachliche Feature-Ergebnisse in Benutzeroberflächen.

```text
main.tsx
   ↓
src/App.tsx                  Compatibility-Fassade während Migration
   ↓
src/app                      Application Composition
   ↓
src/features/<domain>/ui     fachliche Vertical Slices
   ↓
src/shared                   fachneutrale UI / Branding / Visuals
   ↓
Services / Platform / API    bestehende Fach- und Laufzeitarchitektur
```

### 1.1 Normative Grenze dieses Dokuments

`FRONTEND_ARCH.md` ist die **normative Source-Tree-, Dependency- und Presentation-Architecture-Authority** für den React-Client. Es besitzt ausdrücklich **keine** eigene Market-Data-, Scoring-, Entitlement-, IAM-, Compliance- oder Governance-Authority.

Die Dokumentrollen sind verbindlich getrennt:

| Dokument | Rolle | Darf normative Architekturregeln definieren? |
|---|---|---|
| `docs/frontend/FRONTEND_ARCH.md` | Frontend-Struktur, Dependency-Richtung, Presentation-/Interaction-Grenzen | **Ja, ausschließlich für Frontend-/Presentation-Struktur** |
| `docs/frontend/design-tokens.json` + `PHASE0_DESIGN_TOKENS.md` | kanonische maschinenlesbare Branding-/Design-Token-Authority und ihre Renderer-Projektion | **Ja, ausschließlich für Branding-/Design-Tokens** |
| `docs/frontend/COMPONENT_INVENTORY.md` | Ist-Bestand und Migrationsstatus von UI-Komponenten | **Nein** |
| `docs/frontend/FRONTEND_ROADMAP.md` | Reihenfolge und Status der Frontend-Migration | **Nein; verweist auf diese Architektur** |
| `docs/roadmaps/SCREENING_SCORING_MARKET_DATA_SPT_ROADMAP.md` | kanonische Screening-/Scoring-/Market-Data-Wertschöpfungskette | **Ja, für diesen fachlichen Runtime-Scope** |
| ADR-/ESS-Dokumente | jeweilige fachliche Architektur-/Governance-Entscheidung | **Ja, im jeweiligen Scope** |

Damit gilt das Prinzip **Projection, not Redefinition**: Das Frontend konsumiert fachliche Contracts und projiziert sie, kopiert deren normative Ablaufdefinitionen aber nicht in dieses Dokument.

Für die AI-Entwicklungswertschöpfungskette bleibt die bestehende Reihenfolge Development/Implementation → Documentary → Supervisor → Platform Director → Release → Production unverändert. Die Frontend-Konsolidierung verändert keine Authority dieser Kette; sie ordnet ausschließlich die Presentation-Schicht.

`ADR-0005` bleibt die historische Frontend-Modul-Integrationsentscheidung. Diese Source-Tree-Konsolidierung aktiviert ausdrücklich **keine** historischen Federation-, iframe- oder URL-Token-Propagation-Mechanismen; aktuelle IAM-, CSP-, CORS- und Security-Contracts haben Vorrang.

## 2. Kanonische Ordnerstruktur

```text
src/
├── main.tsx
├── App.tsx                         # dünne Compatibility-Fassade auf src/app/App.tsx
├── app/
│   ├── App.tsx                     # kanonischer Application Composition Root
│   ├── AppShell.tsx                # fachneutraler Shell-Baustein
│   ├── auth/
│   │   └── SessionComposition.tsx  # bestehender Session/Auth-/Security-Gate-Lifecycle
│   ├── routing/
│   │   └── AppRoutes.tsx           # öffentliche Pfade + Landing/Dashboard Composition
│   ├── types/
│   │   └── UserSession.ts          # Presentation-Session-Vertrag
│   ├── index.ts
│   └── README.md
├── features/
│   ├── README.md
│   ├── index.ts                    # UI-Namespace-Fassaden
│   ├── public/ui/
│   ├── users/ui/
│   ├── settings/ui/
│   ├── screening/ui/
│   ├── crypto/ui/
│   ├── commodities/ui/
│   ├── stocks/ui/
│   ├── analytics/ui/
│   ├── news/
│   │   ├── newsRoutes.ts
│   │   └── ui/
│   ├── portfolio/ui/
│   ├── billing/ui/
│   ├── reporting/ui/
│   ├── social/ui/
│   ├── governance/ui/
│   └── registry/
├── shared/
│   ├── ui/
│   ├── branding/
│   └── visuals/
├── components/                     # Legacy-/Compatibility-Zone während Strangler-Migration
└── platform/                       # unveränderte Enterprise-Plattformmodule
```

`src/app/providers/` ist ein zulässiger Zielpfad für künftig tatsächlich extrahierte globale Provider. Ein leerer Ordner wird nicht als Architektur-Placeholder verlangt; die kanonische Struktur dokumentiert nur real vorhandene Composition-Verantwortung.

### 2.1 BB-1 Application-Composition-Grenzen

- `src/app/App.tsx` komponiert ausschließlich die App-Schichten und enthält keine fachliche Feature-/Runtime-Authority.
- `src/app/auth/SessionComposition.tsx` kapselt den bestehenden Supabase-Session-Lifecycle sowie Onboarding-, Login-Step-Up-, Password-Recovery- und Unauthorized-Gates. Die Datei **konsumiert** bestehende IAM-/Security-Regeln und darf diese nicht abschwächen oder neu autorisieren.
- `src/app/routing/AppRoutes.tsx` hält die bestehende leichte Pfadkomposition für öffentliche Legal-Seiten sowie Landing-/Dashboard-Auswahl. Die Einführung eines neuen Routing-Frameworks ist keine implizite Folge dieser Architektur.
- `src/app/types/UserSession.ts` ist der kanonische Presentation-Typvertrag für die Session. Er ersetzt keine Backend-/IAM-Identity-Authority.
- `src/App.tsx` darf während der Migration nur Compatibility-Exports enthalten und keine neue Composition-, Auth-, Routing- oder Feature-Logik aufnehmen.

## 3. Dependency Rules

1. `app` darf `features` und `shared` konsumieren.
2. `features` dürfen `shared` sowie bestehende Services/Platform/API-Verträge konsumieren.
3. `shared` darf **nicht** von `features`, `app` oder fachlichen Legacy-Komponenten abhängen.
4. `platform` darf nicht von React-UI oder Feature-UI abhängen.
5. Neue fachliche React-Komponenten werden nicht mehr direkt unter `src/components/` angelegt.
6. Während der Migration dürfen Feature-`ui/index.ts` bestehende Legacy-Komponenten re-exportieren. Diese Fassaden sind Übergangspunkte, keine zweite Implementierung.
7. `src/components/` ist ausschließlich Legacy-/Compatibility-Zone; dort entsteht keine neue fachliche oder gemeinsame Basisimplementierung.
8. `src/App.tsx` ist eine temporäre Compatibility-Fassade und darf nicht wieder zum Implementierungsort für Application Composition werden.
9. Feature-Code darf nicht von `src/app` abhängen. Gemeinsame Presentation-Typen, die fachlich von Features benötigt werden, müssen langfristig an die engste nicht-zirkuläre Contract-Grenze migriert werden; BB-1 erhält bestehende Legacy-Type-Compatibility bis zur jeweiligen Feature-Welle.

## 4. Wertschöpfungsbezogene UI-Verantwortung

Die Feature-Slices spiegeln vorhandene Produktfähigkeiten, ohne eine neue fachliche Authority zu erzeugen:

```text
Public / Access
      ↓
Screening & Asset Discovery
      ↓
Analysis / Scoring / Intelligence
      ↓
Portfolio & Decision Support
      ↓
Reporting / Social Distribution
      ↓
Governance / Audit / Administration
```

Diese Darstellung beschreibt **UI-Verantwortungsbereiche**, nicht die kanonische Financial-Runtime-Sequenz. Daten-, Scoring-, Compliance- und Governance-Entscheidungen verbleiben in den bestehenden Backend-/Platform-Authorities. Die UI stellt deren Ergebnisse dar und löst ausschließlich erlaubte Benutzeraktionen aus.

## 5. Fachliche Contract Boundaries — Projection, not Redefinition

Dieses Dokument definiert bewusst **keine eigene Financial-Data-Request-Sequenz**. Die jeweils aktuelle fachliche Reihenfolge und die dazugehörigen Runtime-/Evidence-Grenzen werden ausschließlich von den bestehenden Authorities definiert.

| Concern | Kanonische Authority | Rolle des Frontends |
|---|---|---|
| Asset Catalog ↔ Market Evidence | `ADR-0032` | read-only Consumer / Darstellung von Discovery- und Evidence-Zuständen |
| Buffett Access / Quota | `ADR-0034` | Consumer der serverseitigen Autorisierungsentscheidung |
| Provider Data Plane / Provenance / Freshness | `ADR-0041` + `ESS-0016` | Darstellung bereits autorisierter und validierter Evidence |
| Screening-/Scoring-/Market-Data-Wertschöpfungskette | `SC-MD-SPT-0001` | Presentation Projection; keine zweite Ablaufdefinition |
| Canonical Scoring | `ADR-0087` | Darstellung autoritativ erzeugter Scoring-Ergebnisse |
| Verified Asset Display | `verified-asset-display/1.0.0` + ADR-0032-Revalidation | read-only Research-/Presentation-Consumer; keine neue Authority |
| IAM / Security / Compliance | jeweils aktuelle Security-/IAM-/Compliance-Authorities | Clientseitige Darstellung und erlaubte Interaktion; keine Abschwächung serverseitiger Gates |

### 5.1 Verbindliche Frontend-Invarianten

Frontend-Code darf fachliche Zustände nicht hochstufen, synthetisch vervollständigen oder durch lokale UI-Regeln neu autorisieren.

Insbesondere gilt:

- Catalog Metadata wird nicht zu Market Evidence.
- `unavailable`, `partial`, `DATA_UNAVAILABLE` oder vergleichbare Fail-Closed-Zustände bleiben sichtbar und werden nicht durch synthetische Finanzwerte ersetzt.
- Ein serverseitiges Entitlement-/IAM-DENY wird clientseitig nicht umgangen oder in ALLOW umgedeutet.
- Display-/Research-Ergebnisse werden nicht als `CanonicalScoreResult` oder Execution-Price-Evidence ausgegeben, sofern der zuständige autoritative Contract dies nicht erlaubt.
- Domänenspezifische UI darf einen globalen Katalog auf die zulässige Domäne einschränken, ohne daraus eine neue Registry-/Eligibility-Authority abzuleiten.
- Bei physischen Pfadverschiebungen müssen die konsumierten fachlichen Contracts semantisch unverändert bleiben.
- Änderungen an der Financial-Runtime-Sequenz werden **nicht** in `FRONTEND_ARCH.md` normiert, sondern in der zuständigen Parent-Authority (`SC-MD-SPT-0001` bzw. ADR/ESS) vorgenommen und hier ausschließlich referenziert.

Dadurch kann sich die fachliche Wertschöpfungskette weiterentwickeln, ohne dass `FRONTEND_ARCH.md` eine konkurrierende oder veraltete Kopie konserviert.

### 5.2 CV-0 Presentation-Authority-Projektion

Für Financial-/Crypto-Visualisierungen darf das Frontend die **Herkunftsrolle** eines bereits gelieferten Werts als Presentation-Metadatum kennzeichnen. Die aktuell verwendeten Rollen sind:

```text
CANONICAL_SCORE  → autoritativ erzeugtes Scoring-Ergebnis
RESEARCH         → Research-/Analysekontext, nicht kanonisch
EVIDENCE_ONLY    → Evidence-Projektion ohne Score-Authority
MARKET_DATA      → Markt-/History-Daten, getrennt vom Scoring
```

Diese Rollen sind **keine zweite Registry**. Sie dürfen weder Modellwahl noch Score-, Gate-, Freshness- oder Execution-Entscheidungen treffen.

Verbindlich:

- `RESEARCH` und `EVIDENCE_ONLY` dürfen eine vorhandene non-authorizing Backend-Semantik nur als `scoreEligible=false` / `executionEligible=false` projizieren.
- fehlende Werte bleiben fehlend; `null`, `NOT_AVAILABLE`, `STALE`, `PARTIAL`, `INVALID` oder `NOT_COMPUTABLE` werden nicht zu numerischen Defaults oder PASS hochgestuft.
- Freshness wird nicht aus clientseitig erfundenen Altersgrenzen berechnet. Die UI zeigt den gelieferten Status und vorhandene `observedAt`-/`retrievedAt`-Zeitstempel.
- visuelle Authority-/Statuskommunikation verwendet Text/Icon zusätzlich zu Farbe.
- die fachliche Bedeutung der Authority bleibt in ADR-/ESS-/SPT-/Platform-Contracts; die UI projiziert nur deren vorhandene Semantik.

Implementierungsnachweis: `docs/evidence/frontend/CV0_CRYPTO_VISUALIZATION_AUTHORITY_2026-08-23.md`.

## 6. Shared Design System

Kanonische Shared-Primitives:

- `Button`
- `Card`
- `Input`
- `Modal`
- `Tooltip`
- `Skeleton`
- `EmptyState`
- `StatusBadge`
- `AuthorityBadge`
- `FreshnessBadge`
- `EvidenceStateIndicator`
- `ResearchOnlyBanner`
- `CapitalAiLogo`
- `NeuralBackground`

Die bisherigen Pfade unter `src/components/` bleiben bei migrierten Shared-Bausteinen nur als dünne Compatibility-Exports erhalten. Fachliche Komponenten dürfen Shared-Primitives konsumieren, aber keine parallelen Basisimplementierungen etablieren.

Die CV-0-Primitives sind fachneutral: `shared` kennt keine Crypto-Modelle, Provider oder Backend-Endpoints. Domänenspezifische Zuordnung zu konkreten Resultaten erfolgt erst im jeweiligen Feature-Slice.

## 7. Visual Identity

Die Visual Identity wird nicht lokal in Komponenten neu definiert. `docs/frontend/design-tokens.json` ist die maschinenlesbare Branding-Authority; `PHASE0_DESIGN_TOKENS.md` dokumentiert ihre Manifest-v6.1-Projektion in Web, PDF, Social Media und externe Renderer.

- Canvas: `#08080C`; erhöhte Surface: `#121215`; Border: `#252529`.
- CAPITAL-AI Gold `#F9BF21`: Premium-, Primär- und Fokusfarbe.
- Purple `#8D26FF`: AI-/Intelligence-Akzent.
- Cyan `#22D3EE`: Market-Data-, Live-Feed- und technische Visualisierungsfarbe.
- Emerald `#44DE88` und Rose `#F87171`: positive/negative bzw. BUY/SELL-/READY/REJECT-Semantik.
- Assetklassen und fachliche Visualisierungen konsumieren ausschließlich die semantischen `asset-*`, `score-*`, `factor-*` und `status-*` Rollen aus der kanonischen Registry.
- Historische `aif-*`-Namen sind nur Compatibility-Aliase. Neue Komponenten dürfen keine lokalen Branding-Hexwerte oder neue `aif-*`-Verwendungen einführen.
- Headings verwenden **Inter**, Body **Poppins**, technische Daten/Scores **JetBrains Mono**.
- Glassmorphism bleibt ein unterstützendes Surface-Pattern, kein Selbstzweck.
- Dekorative Neural-Geometrie wird zentral über `shared/visuals` konsolidiert.
- Motion muss `prefers-reduced-motion` respektieren.

## 8. Accessibility

- Interaktive Ziele mindestens 44×44 px, soweit durch Komponententyp sinnvoll.
- Fokuszustände bleiben sichtbar und farbunabhängig verständlich.
- Statuskommunikation nutzt Text/Icon zusätzlich zu Farbe.
- Assetklassenfarbe wird zusätzlich durch Klassenlabel/Icon kommuniziert.
- Authority-Kommunikation nutzt ein explizites Textlabel und eine zugängliche Beschreibung zusätzlich zur semantischen Farbe.
- `scoreEligible=false` / `executionEligible=false` müssen bei Research-only-Flächen wahrnehmbar und screenreader-lesbar bleiben, sofern diese Eligibility-Semantik Teil des gelieferten Contracts ist.
- Dialoge besitzen semantische Dialogrollen und Escape-/Close-Verhalten.
- Loading- und Empty-States werden über gemeinsame Primitives dargestellt.
- Charts und komplexe Visualisierungen erhalten textuelle Beschreibungen bzw. zugängliche Alternativen.

## 9. Migrationsstrategie

Die Konsolidierung ist **strangler-basiert**, nicht Big Bang als einzelner Massen-PR:

1. `app/features/shared` und Dependency Rules etablieren. — abgeschlossen mit PR #459.
2. Application Composition aus dem historischen Root `src/App.tsx` nach `src/app` extrahieren. — BB-1.
3. Dashboard-Composition als eigene Welle zerlegen. — BB-2.
4. Bestehende Fachkomponenten anschließend in einzeln mergebaren Feature-Wellen physisch verschieben.
5. Vor jeder Welle `main` synchronisieren und offene PRs auf Pfadkorrelationen prüfen.
6. Für jede Welle die betroffene Parent-Authority ermitteln; fachliche Contracts werden referenziert, nicht in Frontend-Dokumenten dupliziert.
7. Nach Migration aller Consumer die jeweiligen Legacy-Exports aus `src/components/` entfernen.
8. `src/components/` wird am Ende gelöscht, sobald keine produktive Implementierung mehr darin verbleibt.
9. Branding-Legacy bedeutet lokale Alt-Gold-/Cyan-/Blue-/Purple-Hexwerte, Montserrat und historische Aliasnamen; die kanonische Cyan-Rolle selbst ist **kein** Legacy-Wert.
10. `UniverseBestWorst`, `CryptoScoringEnterprise` und `EnterpriseBinanceQuickAnalysis` werden innerhalb ihrer vorgesehenen BB-4-/BB-6-Wellen auf semantische Token und Feature-Slices migriert; alte Pfade bleiben nur so lange Compatibility-Exports, wie produktive Inbound-Imports existieren.

## 10. Architektur-Gate und Dokumentationskonsistenz

`npm run frontend:architecture:check` prüft aktuell:

- Vorhandensein der kanonischen Schichten und Feature-UI-Einstiege,
- Vorhandensein der BB-1-Application-Composition-Pfade,
- `src/App.tsx` als dünne Compatibility-Fassade,
- `src/app/App.tsx` als Composition von `SessionComposition` und `AppRoutes`,
- Vorhandensein der zentralen Shared-Primitives,
- Erhalt der bestehenden Registry-Fachlogik innerhalb `src/features/registry`,
- Abwesenheit paralleler Frontend-Roots (`src/frontend`, `src/ui`),
- Dependency-Richtung der Shared-Schicht,
- korrekte Compatibility-Exports der bereits migrierten Shared-Primitives,
- Einbindung des Architektur-Gates in den bestehenden Quality-Center-Testpfad.

Der Check läuft innerhalb von `test:raw` und damit unter der aktuellen Quality-Center-Orchestrierung.

Zusätzlich gilt als Governance-Regel für Frontend-Dokumente:

1. `FRONTEND_ARCH.md` ist die einzige normative Frontend-Source-Tree-/Dependency-Authority.
2. `docs/frontend/design-tokens.json` ist die einzige maschinenlesbare Branding-/Design-Token-Authority; Renderer projizieren daraus und definieren keine zweite Palette.
3. `COMPONENT_INVENTORY.md` beschreibt ausschließlich Ist-Bestand und Migrationsstatus.
4. `FRONTEND_ROADMAP.md` beschreibt ausschließlich Reihenfolge, Status und geplante Arbeit.
5. Fachliche Runtime-/Data-/Scoring-Regeln müssen auf ihre Parent-Authority verweisen statt sie erneut vollständig zu definieren.
6. Wird eine Parent-Authority geändert, müssen abhängige Frontend-Dokumente auf veraltete Projektionen geprüft werden; eine duplizierte Ablaufdefinition ist als Dokumentationsdrift zu behandeln.
