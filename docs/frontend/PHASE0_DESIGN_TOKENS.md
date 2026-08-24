# CAPITAL-AI — Design Tokens & Branding Manifest v6.1

**Status:** ACTIVE / CANONICAL  
**Stand:** 25. August 2026  
**Runtime-Authority:** `docs/frontend/design-tokens.json`  
**Web-Projektion:** `src/index.css` (`@theme`)  
**Frontend-Architektur:** `docs/frontend/FRONTEND_ARCH.md`

## 1. Authority und Provenance

`docs/frontend/design-tokens.json` ist der **Single Point of Trust** für maschinenlesbare CAPITAL-AI Designwerte. Web, PDF, Social Media und externe Renderer projizieren diese Registry und dürfen keine eigene Palette als zweite Authority führen.

Das Owner-Artefakt **„capital-ai.online — Design & Brand Architecture / Branding Manifest v6.0“** bleibt provenance-gebundener Input ohne Runtime-Abhängigkeit zu Google Drive. Die Owner-Ergänzung vom **22. August 2026** stellt Cyan als kanonische Market-/Data-Visualization-Farbe wieder her. Diese konsolidierte Projektion wird als **Manifest v6.1** geführt.

```text
Owner Manifest v6.0 + Owner Amendment v6.1
                    ↓
        Canonical Design Token Registry
                    ↓
      Web / PDF / Social / External Renderers
```

Für Source-Tree-, Dependency- und Presentation-Regeln bleibt `FRONTEND_ARCH.md` zuständig. Dieses Dokument erzeugt keine zweite Frontend- oder Financial-Runtime-Architektur.

## 2. Aktive Palette

| Rolle | Wert | Semantik |
|---|---:|---|
| Canvas | `#08080C` | Haupt-Canvas |
| Surface | `#121215` | erhöhte Flächen |
| Border | `#252529` | Divider / Borders |
| Text Primary | `#FFFFFF` | Primärtext |
| Text Secondary | `#A1A1AA` | Metatext |
| Gold | `#F9BF21` | Primary / Premium / Fokus |
| Purple | `#8D26FF` | AI / Intelligence |
| Cyan | `#22D3EE` | Market Data / Live / Technical Visualization |
| Emerald | `#44DE88` | READY / BUY / positiv |
| Rose | `#F87171` | REJECT / SELL / negativ |

### Assetklassen

| Assetklasse | Semantischer Token | Wert |
|---|---|---:|
| Crypto | `asset-crypto` | `#22D3EE` |
| Aktien | `asset-stock` | `#44DE88` |
| Indizes | `asset-index` | `#60A5FA` |
| Forex | `asset-forex` | `#8D26FF` |
| Rohstoffe | `asset-commodity` | `#F9BF21` |
| Anleihen | `asset-bond` | `#E879F9` |

Assetklassenfarbe und Ergebnissemantik sind getrennt. **Best/Worst** bleibt `score-best`/`score-worst`; eine Klassenfarbe darf keine positive oder negative Bewertung implizieren.

## 3. Semantische Token-Regel

Neue oder migrierte Komponenten verwenden ausschließlich Rollen aus der Registry:

- `brand-*` für Markenrollen,
- `asset-*` für Assetklassen,
- `score-*` für Scoring-/Ranking-Zustände,
- `factor-*` für Faktorkategorien,
- `status-*` für Laufzeit-/Qualitätszustände.

Lokale Branding-Hexwerte sind nicht zulässig. Cyan selbst ist **nicht Legacy**; Legacy sind direkte lokale Cyan-/Blue-Literale und historische Aliasnamen.

Die historischen Namen `aif-gold-*`, `aif-neon-purple` und `aif-neon-cyan` bleiben während der Strangler-Migration nur als Compatibility Surface. `aif-neon-cyan` projiziert auf das kanonische Cyan `#22D3EE`. Neue Komponenten dürfen diese Aliasnamen nicht mehr einführen. PDF- und Media-Renderer dürfen die Alias-Namespace nicht konsumieren; sie lesen die kanonischen `brand`-/`semantic`-Rollen direkt.

## 4. Typografie

| Rolle | Kanonisch |
|---|---|
| Headings | **Inter** |
| Body | **Poppins** |
| Technical / Scores / Data | **JetBrains Mono** |

Renderer-spezifische Fallbacks sind technische Adapter und keine alternative Produktfont-Authority.

## 5. Renderer-Vertrag

### Web

`src/index.css` ist die Tailwind-CSS-4-Projektion der Registry. Fachkomponenten konsumieren semantische Rollen statt Hexwerte.

### PDF

`src/platform/PdfReporting/pdfBrand.ts` erhält Build-time Werte aus derselben Registry. Die Projektion in `vite.config.ts` verwendet ausschließlich kanonische `brand`-/`semantic`-/`print`-Pfade. Documentation-as-Code liest die Registry ebenfalls direkt. Renderer-Fallbacks dürfen keine zweite Palette etablieren.

### Social Media

`MediaProjectV2` bindet `brandTokenSource` an `docs/frontend/design-tokens.json`. Der deterministische Python-Renderer liest ebenfalls direkt aus `color.brand` und `color.print`; `color.aif` ist keine Renderer-Abhängigkeit. Generative Grafiken ohne diesen Contract bleiben Concept Art und keine Template-Authority.

Text-Templates müssen vor Rückgabe gegen `server/socialMedia/platformCharacterLimits.ts` validiert werden. Pflichttexte wie Disclaimer oder Supportinformationen werden nicht still gekürzt; eine Überschreitung schlägt fail-closed fehl.

### Externe Anbieter

Externe Provider erhalten versionierte Exporte/Contracts aus der Registry. Das Drive-Artefakt oder individuelle Provider-Templates werden nie Runtime-Authority.

## 6. Pattern und Accessibility

BUY = Emerald, SELL = Rose. Ein Pattern-Badge wird nur bei vorhandener Pattern-Evidence gerendert. Fehlt ein verifiziertes Pattern, bleibt der Fachwert visuell absent; die UI erzeugt weder einen Platzhalter noch ein abgeleitetes BUY-/SELL-Signal. Dieser Missing-State ist in `patterns.patternBadge` mit `renderWhenMissing: false` und `missingState: "omit"` kanonisch festgelegt.

Fokus bleibt Gold mit sichtbarem 2-px-Ring. Status und Assetklasse werden zusätzlich durch Text/Icon kommuniziert. Interaktive Ziele bleiben, soweit sinnvoll, mindestens 44×44 px. `prefers-reduced-motion` ist verbindlich.

## 7. Strangler-Migration

Die bestehende Frontend-Roadmap ist führend. Es wird keine zweite Migrationspipeline eingeführt.

1. Token-Registry und Web-Projektion auf v6.1 konsolidieren. — **umgesetzt**
2. `UniverseBestWorst` nach `src/features/screening/ui` migrieren. — **umgesetzt**
3. `CryptoScoringEnterprise` und `EnterpriseBinanceQuickAnalysis` nach `src/features/crypto/ui` migrieren. — **umgesetzt**
4. Alte Implementierungen unter `src/components` durch dünne Compatibility-Exports ersetzen. — **umgesetzt für diese drei Komponenten**
5. Weitere Fachkomponenten komponentenweise auf semantische Tokens migrieren.
6. Compatibility-Dateien erst bei **0 produktiven Inbound-Imports** physisch löschen.
7. Historische Aliasnamen erst entfernen, wenn keine Consumer mehr existieren.

Damit werden Legacy-Anbindungen strangler-basiert abgelöst, ohne Parallelarchitektur oder Big-Bang-Risiko.

## 8. Abnahmekriterien

- [x] v6.0-Provenance und v6.1-Owner-Amendment in der Registry gebunden.
- [x] Gold, Purple, Cyan, Emerald und Rose zentral definiert.
- [x] sechs Assetklassen besitzen separate semantische Rollen.
- [x] Best/Worst bleibt von Assetklassenfarben getrennt.
- [x] Inter / Poppins / JetBrains Mono sind rollenbasiert projiziert.
- [x] Web-, PDF- und Social-Media-Pfade teilen dieselbe Authority.
- [x] PDF- und Media-Renderer konsumieren keine deprecated `color.aif`-Runtimepfade.
- [x] Pattern-Missing-State rendert keinen Platzhalter und erfindet kein Signal.
- [x] Social-Templates erzwingen die kanonischen Plattformlimits fail-closed.
- [x] berührte Fachkomponenten wurden in die vorgesehenen Feature-Slices migriert bzw. semantisch konsolidiert.
- [ ] verbleibende nicht migrierte Fachkomponenten vollständig von lokalen Farbwerten befreien.
- [ ] Compatibility-Aliase und Legacy-Pfade nach Inbound-Import-Zahl 0 löschen.
