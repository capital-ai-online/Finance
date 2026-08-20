# CAPITAL-AI Feature Slices

`src/features/` ist die fachliche Vertical-Slice-Schicht der Anwendung. Bereits vorhandene Server-/Domain-Dateien bleiben in ihren Feature-Verzeichnissen; Frontend-Flächen werden innerhalb derselben Domäne unter `ui/` gebündelt.

## UI-Zuordnung entlang der bestehenden Produktnutzung

| Slice | UI-Verantwortung |
|---|---|
| `public` | Landing, Datenschutz, Impressum/AGB |
| `users` | Login-Step-up, Onboarding, Identitätszugang |
| `settings` | Profil, Passkeys, TOTP |
| `screening` | Screener, Universen, Best/Worst, Multi-Asset-Auswahl |
| `crypto` | Crypto-/DeFi-spezifische Analyseoberflächen |
| `stocks` | Equity-/Value-spezifische Analyseoberflächen |
| `analytics` | Charts, Heatmaps, Risiko- und Performance-Visualisierung |
| `news` | Newsfeed und Sentiment |
| `portfolio` | Watchlist, Backtesting, Portfolio-Performance |
| `billing` | Abonnements, Checkout, Subscription-Modals |
| `reporting` | PDF-/Compliance-Export |
| `social` | Social Accounts und Publishing |
| `governance` | Admin, Supervisor, Compliance, Audit, SEO, Documentary-UI |
| `registry` | bestehende Registry-Fachlogik; UI nur bei fachlichem Bedarf |

## Migrationsregel

`src/components/` ist ab dieser Konsolidierung eine **Legacy-/Compatibility-Zone**. Neue fachliche UI wird nicht mehr direkt dort angelegt. Bestehende Komponenten werden risikominimiert sliceweise nach `src/features/<domain>/ui/` verschoben. Solange eine physische Verschiebung bestehende Imports brechen würde, stellt das jeweilige `ui/index.ts` eine kanonische Feature-Fassade bereit.

Neue geteilte Primitives, Branding- und Visual-Komponenten gehören nach `src/shared/`, nicht in ein Feature.
