# CAPITAL-AI Frontend Architecture & Interface Guidelines

**Status:** Canonical Frontend Architecture  
**Stand:** 20. August 2026  
**Framework:** React 19 / Vite 6 / Tailwind CSS 4 / Motion

## 1. Architekturposition

Das Frontend ist die **Presentation- und Interaction-Schicht** der bestehenden CAPITAL-AI Architektur. Es wird ausdrücklich **kein** zusätzliches `src/platform/Frontend` und kein paralleler Root wie `src/frontend/` eingeführt.

Die bestehenden Enterprise-Module unter `src/platform/` bleiben fachliche und Governance-Authorities. Das Frontend projiziert deren Zustände und die fachlichen Feature-Ergebnisse in Benutzeroberflächen.

```text
main.tsx
   ↓
src/app                      Application Composition
   ↓
src/features/<domain>/ui     fachliche Vertical Slices
   ↓
src/shared                   fachneutrale UI / Branding / Visuals
   ↓
Services / Platform / API    bestehende Fach- und Laufzeitarchitektur
```

Für die AI-Entwicklungswertschöpfungskette bleibt die bestehende Reihenfolge Development/Implementation → Documentary → Supervisor → Platform Director → Release → Production unverändert. Die Frontend-Konsolidierung verändert keine Authority dieser Kette; sie ordnet ausschließlich die Presentation-Schicht.

`ADR-0005` bleibt die historische Frontend-Modul-Integrationsentscheidung. Diese Source-Tree-Konsolidierung aktiviert ausdrücklich **keine** historischen Federation-, iframe- oder URL-Token-Propagation-Mechanismen; aktuelle IAM-, CSP-, CORS- und Security-Contracts haben Vorrang.

## 2. Kanonische Ordnerstruktur

```text
src/
├── main.tsx
├── App.tsx                         # bestehender Composition Root während Migration
├── app/
│   ├── AppShell.tsx                # fachneutraler Shell-Baustein
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
│   ├── stocks/ui/
│   ├── analytics/ui/
│   ├── news/                       # bestehende Feature-Logik bleibt erhalten
│   │   ├── newsRoutes.ts
│   │   └── ui/
│   ├── portfolio/ui/
│   ├── billing/ui/
│   ├── reporting/ui/
│   ├── social/ui/
│   ├── governance/ui/
│   └── registry/                   # bestehende Registry-Fachlogik
├── shared/
│   ├── ui/
│   ├── branding/
│   └── visuals/
├── components/                     # Legacy-/Compatibility-Zone während Strangler-Migration
└── platform/                       # unveränderte Enterprise-Plattformmodule
```

## 3. Dependency Rules

1. `app` darf `features` und `shared` konsumieren.
2. `features` dürfen `shared` sowie bestehende Services/Platform/API-Verträge konsumieren.
3. `shared` darf **nicht** von `features`, `app` oder fachlichen Legacy-Komponenten abhängen.
4. `platform` darf nicht von React-UI oder Feature-UI abhängen.
5. Neue fachliche React-Komponenten werden nicht mehr direkt unter `src/components/` angelegt.
6. Während der Migration dürfen Feature-`ui/index.ts` bestehende Legacy-Komponenten re-exportieren. Diese Fassaden sind Übergangspunkte, keine zweite Implementierung.

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

Daten-, Scoring-, Compliance- und Governance-Entscheidungen verbleiben in den bestehenden Backend-/Platform-Authorities. Die UI stellt sie dar und löst ausschließlich erlaubte Benutzeraktionen aus.

## 5. Financial-data Consumer Boundary — ADR-0032 / SC-MD-SPT-0001

Finanzielle UI-Module müssen Katalogmetadaten von verifizierten Beobachtungen trennen und folgende Request-Reihenfolge erhalten:

```text
request / user interaction
  → identity / access
  → entitlement / usage gate, sofern erforderlich
  → /api/registry/assets metadata
  → Auswahl eines gültigen Domain-Assets
  → anwendbarer verified quote/context/display endpoint
  → value + status + provenance + freshness
  → deterministische Domain-Analyse / Darstellung
```

- `/api/registry/assets` ist **keine** verifizierte Preis-/Fundamentalsquelle; ADR-0032 bleibt für diese Invariante autoritativ.
- Fehlende Evidence bleibt `unavailable`/`partial`; UI-Code erzeugt keine Finanz-Defaults.
- Domänenspezifische Komponenten dürfen den globalen Asset-Katalog auf ihre gültige Domäne einschränken.
- `BuffetValueCheck.tsx` bleibt **stock-only** und konsumiert pro ausgewählter Aktie `verified-asset-display/1.0.0`.
- Vor der Buffett-Provider-Hydration muss der serverseitige ADR-0034 Entitlement-/Quota-Contract die ausgewählte Aktie autorisieren.
- Verified Display ist Research-/Presentation-Evidence und **kein** Execution-Price-Contract.
- Ein Display- oder deterministisches Domain-Analyse-Ergebnis darf nicht als ADR-0087 `CanonicalScoreResult` dargestellt werden, sofern es nicht die kanonische Scoring-Dispatcher-Kette durchlaufen hat.
- Die mit PR #458 gemergte Verified-Asset-Display-/Buffett-Hydration ist Teil der aktuellen Main-Baseline und wird durch die Ordnerkonsolidierung nicht überschrieben. Eine spätere physische Verschiebung des Buffett-UI-Pfads muss diese Contracts unverändert erhalten.

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
- `CapitalAiLogo`
- `NeuralBackground`

Die bisherigen Pfade unter `src/components/` bleiben bei migrierten Shared-Bausteinen nur als dünne Compatibility-Exports erhalten. Fachliche Komponenten dürfen Shared-Primitives konsumieren, aber keine parallelen Basisimplementierungen etablieren.

## 7. Visual Identity

- Canvas: dunkle neutrale Oberfläche; semantische Surface-Tokens sind gegenüber lokalen Hex-Werten zu bevorzugen.
- CAPITAL-AI Gold: Premium-/Primärfokus.
- Cyan/Purple: sekundäre AI-/Live-Akzente; nicht als gleichrangige Primärsignale verwenden.
- Glassmorphism bleibt ein unterstützendes Surface-Pattern, kein Selbstzweck.
- Dekorative Neural-Geometrie wird zentral über `shared/visuals` konsolidiert.
- Motion muss `prefers-reduced-motion` respektieren.

## 8. Accessibility

- Interaktive Ziele mindestens 44×44 px, soweit durch Komponententyp sinnvoll.
- Fokuszustände bleiben sichtbar und farbunabhängig verständlich.
- Statuskommunikation nutzt Text/Icon zusätzlich zu Farbe.
- Dialoge besitzen semantische Dialogrollen und Escape-/Close-Verhalten.
- Loading- und Empty-States werden über gemeinsame Primitives dargestellt.
- Charts und komplexe Visualisierungen erhalten textuelle Beschreibungen bzw. zugängliche Alternativen.

## 9. Migrationsstrategie

Die Konsolidierung ist **strangler-basiert**, nicht Big Bang:

1. `app/features/shared` und Dependency Rules etablieren.
2. Shared-Primitives physisch verschieben; alte Pfade werden Compatibility-Exports.
3. Bestehende Fachkomponenten über Feature-UI-Fassaden in die Wertschöpfung einordnen.
4. Große Komponenten (`App.tsx`, `Dashboard.tsx`, `LandingPage.tsx`, Admin-/Analyseflächen) anschließend in einzeln mergebaren Wellen zerlegen und verschieben.
5. Vor jeder Welle `main` synchronisieren und offene PRs auf Pfadkorrelationen prüfen.
6. Nach Migration aller Consumer die jeweiligen Legacy-Exports aus `src/components/` entfernen.
7. `src/components/` wird am Ende gelöscht, sobald keine produktive Implementierung mehr darin verbleibt.

## 10. Architektur-Gate

`npm run frontend:architecture:check` prüft:

- Vorhandensein der kanonischen Schichten und Feature-UI-Einstiege,
- Vorhandensein der zentralen Shared-Primitives,
- Erhalt der bestehenden Registry-Fachlogik innerhalb `src/features/registry`,
- Abwesenheit paralleler Frontend-Roots (`src/frontend`, `src/ui`),
- Dependency-Richtung der Shared-Schicht,
- korrekte Compatibility-Exports der bereits migrierten Shared-Primitives,
- Einbindung des Architektur-Gates in den bestehenden Quality-Center-Testpfad.

Der Check läuft innerhalb von `test:raw` und damit unter der aktuellen Quality-Center-Orchestrierung.
