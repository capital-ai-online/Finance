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

## 2. Kanonische Ordnerstruktur

```text
src/
├── main.tsx
├── App.tsx                         # bestehender Composition Root während Migration
├── app/
│   └── README.md                   # Shell/Navigation/Provider-Regeln
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
├── components/                     # Legacy-/Compatibility-Zone
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

## 5. Shared Design System

Kanonische Shared-Flächen:

- `src/shared/ui/StatusBadge.tsx` — Status-/Datenverfügbarkeits-Primitive.
- `src/shared/branding/CapitalAiLogo.tsx` — Marken-/Versionsprojektion.
- `src/shared/visuals/NeuralBackground.tsx` — wiederverwendbarer dekorativer Neural-Layer.

Die bisherigen Pfade unter `src/components/` bleiben bei migrierten Shared-Bausteinen nur als dünne Compatibility-Exports erhalten.

Weitere Primitives wie `Button`, `Card`, `Modal`, `Input`, `Tooltip`, `Skeleton` und `EmptyState` werden bei der nächsten Extraktion nach `src/shared/ui` verschoben und nicht parallel neu implementiert.

## 6. Visual Identity

- Canvas: dunkle neutrale Oberfläche; semantische Surface-Tokens sind gegenüber lokalen Hex-Werten zu bevorzugen.
- CAPITAL-AI Gold: Premium-/Primärfokus.
- Cyan/Purple: sekundäre AI-/Live-Akzente; nicht als gleichrangige Primärsignale verwenden.
- Glassmorphism bleibt ein unterstützendes Surface-Pattern, kein Selbstzweck.
- Dekorative Neural-Geometrie wird zentral über `shared/visuals` konsolidiert.
- Motion muss `prefers-reduced-motion` respektieren.

## 7. Accessibility

- Interaktive Ziele mindestens 44×44 px, soweit durch Komponententyp sinnvoll.
- Fokuszustände bleiben sichtbar und farbunabhängig verständlich.
- Statuskommunikation nutzt Text/Icon zusätzlich zu Farbe.
- Charts und komplexe Visualisierungen erhalten textuelle Beschreibungen bzw. zugängliche Alternativen.

## 8. Migrationsstrategie

Die Konsolidierung ist **strangler-basiert**, nicht Big Bang:

1. Neue Architekturpfade und Dependency Rules etablieren.
2. Shared-Primitives physisch verschieben; alte Pfade werden Compatibility-Exports.
3. Bestehende Komponenten über Feature-UI-Fassaden einordnen.
4. Große Komponenten (`Dashboard.tsx`, `LandingPage.tsx`, Admin-Flächen) anschließend sliceweise zerlegen.
5. Nach Migration aller Consumer die jeweiligen Legacy-Exports aus `src/components/` entfernen.
6. `src/components/` wird am Ende gelöscht, sobald keine produktive Implementierung mehr darin verbleibt.

## 9. Architektur-Gate

`npm run frontend:architecture:check` prüft:

- Vorhandensein der kanonischen Schichten und Feature-UI-Einstiege,
- Abwesenheit paralleler Frontend-Roots (`src/frontend`, `src/ui`),
- Dependency-Richtung der Shared-Schicht,
- korrekte Compatibility-Exports der bereits migrierten Shared-Primitives.

Der Check ist Bestandteil von `npm test`.
