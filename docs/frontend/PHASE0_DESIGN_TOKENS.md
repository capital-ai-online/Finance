# CAPITAL-AI — Design Tokens & Branding Manifest v6.2

**Status:** ACTIVE / CANONICAL  
**Stand:** 26. August 2026  
**Runtime-Authority:** `docs/frontend/design-tokens.json`  
**Web-Projektion:** `src/index.css` (`@theme`)  
**Frontend-Architektur:** `docs/frontend/FRONTEND_ARCH.md`

## 1. Authority und Provenance

`docs/frontend/design-tokens.json` ist der **Single Point of Trust** für maschinenlesbare CAPITAL-AI Designwerte. Web, PDF, Social Media und externe Renderer projizieren diese Registry und dürfen keine eigene Palette als zweite Authority führen.

Das Owner-Artefakt **„capital-ai.online — Design & Brand Architecture / Branding Manifest v6.0“** bleibt provenance-gebundener Input ohne Runtime-Abhängigkeit zu Google Drive. Die Owner-Ergänzung vom **22. August 2026** hatte Cyan als kanonische Market-/Data-Visualization-Farbe bestätigt. Die Owner-Korrektur vom **26. August 2026** präzisiert die Markenhierarchie verbindlich:

- **Dark Black `#08080C` und AIF Gold `#F9BF21` sind die beiden Hauptfarben der Marke.**
- **Cyan `#22D3EE` ist keine Haupt- oder Brandingfarbe.**
- Cyan darf ausschließlich in semantischen Market-/Data-/Live-/Technical-Visualisierungsrollen weiterverwendet werden.
- Purple `#8D26FF` bleibt ein sekundärer AI-/Intelligence-Akzent und ist ebenfalls keine Hauptfarbe.

Diese konsolidierte Projektion wird als **Manifest v6.2** geführt und supersediert die Markenrollen von v6.1, ohne die fachlichen Data-Visualization-Rollen zu entfernen.

```text
Owner Manifest v6.0 + Owner Amendments v6.1/v6.2
                           ↓
               Canonical Design Token Registry
                           ↓
             Web / PDF / Social / External Renderers
```

Für Source-Tree-, Dependency- und Presentation-Regeln bleibt `FRONTEND_ARCH.md` zuständig. Dieses Dokument erzeugt keine zweite Frontend- oder Financial-Runtime-Architektur.

## 2. Aktive Palette

### Primäre Markenfarben

| Rolle | Wert | Semantik |
|---|---:|---|
| Dark Black Canvas | `#08080C` | primäre Markenfläche / Hintergrund |
| AIF Gold | `#F9BF21` | Primary / Premium / Fokus / Markenanker |

Diese beiden Werte bilden das verbindliche **Primary Brand Pair**.

### Sekundäre und semantische Farben

| Rolle | Wert | Semantik |
|---|---:|---|
| Surface | `#121215` | erhöhte dunkle Flächen |
| Border | `#252529` | Divider / Borders |
| Text Primary | `#FFFFFF` | Primärtext |
| Text Secondary | `#A1A1AA` | Metatext |
| Purple | `#8D26FF` | sekundärer AI-/Intelligence-Akzent |
| Cyan | `#22D3EE` | ausschließlich Market Data / Live / Technical Visualization |
| Emerald | `#44DE88` | READY / BUY / positiv |
| Rose | `#F87171` | REJECT / SELL / negativ |

**Cyan wird nicht für Markenrahmen, Brand-Glow, Logo-Hervorhebungen, Premium-CTA, Fokus oder generische Branding-Flächen verwendet.**

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

- `brand-*` nur für Markenrollen,
- `asset-*` für Assetklassen,
- `score-*` für Scoring-/Ranking-Zustände,
- `factor-*` für Faktorkategorien,
- `status-*` für Laufzeit-/Qualitätszustände.

Lokale Branding-Hexwerte sind nicht zulässig. Cyan ist **nur noch semantische Visualisierungsfarbe** und darf nicht als neuer `brand-*`-Wert eingeführt werden.

Der historische Name `brand-cyan` bleibt während der Strangler-Migration ausschließlich als **deprecated Compatibility Alias** erhalten und projiziert unter Manifest v6.2 auf AIF Gold. Fachliche Cyan-Verwendungen müssen stattdessen einen passenden semantischen Token wie `status-info`, `asset-crypto` oder `factor-technical` verwenden.

Die historischen Namen `aif-gold-*`, `aif-neon-purple` und `aif-neon-cyan` bleiben ebenfalls nur als Compatibility Surface. `aif-neon-cyan` projiziert nicht mehr auf Cyan, sondern auf AIF Gold. Neue Komponenten dürfen diese Aliasnamen nicht mehr einführen. PDF- und Media-Renderer sollen die Alias-Namespace nicht konsumieren; sie lesen die kanonischen `brand`-/`semantic`-Rollen direkt.

## 4. Typografie

| Rolle | Kanonisch |
|---|---|
| Headings | **Inter** |
| Body | **Poppins** |
| Technical / Scores / Data | **JetBrains Mono** |

Renderer-spezifische Fallbacks sind technische Adapter und keine alternative Produktfont-Authority.

## 5. Renderer-Vertrag

### Web

`src/index.css` ist die Tailwind-CSS-4-Projektion der Registry. Fachkomponenten konsumieren semantische Rollen statt Hexwerte. Generische Brand-Glows und Fokuszustände verwenden AIF Gold; Cyan bleibt fachlichen Datenrollen vorbehalten.

### PDF

`src/platform/PdfReporting/pdfBrand.ts` erhält Build-time Werte aus derselben Registry. Die Projektion in `vite.config.ts` verwendet ausschließlich kanonische `brand`-/`semantic`-/`print`-Pfade. Documentation-as-Code liest die Registry ebenfalls direkt. Renderer-Fallbacks dürfen keine zweite Palette etablieren.

Brandkritische PDF-Elemente wie Header, Wordmark, Primärlinien und Markenemblem müssen Dark Black + AIF Gold priorisieren. Cyan darf nur dann erscheinen, wenn ein fachlicher Daten-/Visualisierungswert dies semantisch erfordert.

### Social Media

`MediaProjectV2` bindet `brandTokenSource` an `docs/frontend/design-tokens.json`. Der deterministische Python-Renderer liest ebenfalls direkt aus `color.brand` und `color.print`; `color.aif` ist keine Renderer-Abhängigkeit. Generative Grafiken ohne diesen Contract bleiben Concept Art und keine Template-Authority.

Brandflächen, Rahmen, Headlines und Premium-/CTA-Elemente verwenden Dark Black + AIF Gold als führende Kombination. Cyan ist in Social-Media-Templates nicht als generischer Markenakzent zulässig.

Text-Templates müssen vor Rückgabe gegen `server/socialMedia/platformCharacterLimits.ts` validiert werden. Pflichttexte wie Disclaimer oder Supportinformationen werden nicht still gekürzt; eine Überschreitung schlägt fail-closed fehl.

### Externe Anbieter

Externe Provider erhalten versionierte Exporte/Contracts aus der Registry. Das Drive-Artefakt oder individuelle Provider-Templates werden nie Runtime-Authority.

## 6. Pattern und Accessibility

BUY = Emerald, SELL = Rose. Ein Pattern-Badge wird nur bei vorhandener Pattern-Evidence gerendert. Fehlt ein verifiziertes Pattern, bleibt der Fachwert visuell absent; die UI erzeugt weder einen Platzhalter noch ein abgeleitetes BUY-/SELL-Signal. Dieser Missing-State ist in `patterns.patternBadge` mit `renderWhenMissing: false` und `missingState: "omit"` kanonisch festgelegt.

Fokus bleibt Gold mit sichtbarem 2-px-Ring. Status und Assetklasse werden zusätzlich durch Text/Icon kommuniziert. Interaktive Ziele bleiben, soweit sinnvoll, mindestens 44×44 px. `prefers-reduced-motion` ist verbindlich.

## 7. Strangler-Migration

Die bestehende Frontend-Roadmap ist führend. Es wird keine zweite Migrationspipeline eingeführt.

1. Token-Registry und Web-Projektion auf v6.2 konsolidieren. — **umgesetzt**
2. `UniverseBestWorst` nach `src/features/screening/ui` migrieren. — **umgesetzt**
3. `CryptoScoringEnterprise` und `EnterpriseBinanceQuickAnalysis` nach `src/features/crypto/ui` migrieren. — **umgesetzt**
4. Alte Implementierungen unter `src/components` durch dünne Compatibility-Exports ersetzen. — **umgesetzt für diese drei Komponenten**
5. Verbleibende `brand-cyan`-Consumer fachlich einem semantischen Token zuordnen.
6. Weitere Fachkomponenten komponentenweise auf semantische Tokens migrieren.
7. Compatibility-Dateien erst bei **0 produktiven Inbound-Imports** physisch löschen.
8. Historische Aliasnamen erst entfernen, wenn keine Consumer mehr existieren.

Damit werden Legacy-Anbindungen strangler-basiert abgelöst, ohne Parallelarchitektur oder Big-Bang-Risiko.

## 8. Abnahmekriterien

- [x] Dark Black `#08080C` und AIF Gold `#F9BF21` sind als primäres Brand Pair festgelegt.
- [x] Cyan ist aus der Haupt-/Brandingrolle entfernt.
- [x] Cyan bleibt für fachliche Market-/Data-/Technical-Visualisierung semantisch verfügbar.
- [x] Purple bleibt sekundärer AI-/Intelligence-Akzent.
- [x] sechs Assetklassen besitzen separate semantische Rollen.
- [x] Best/Worst bleibt von Assetklassenfarben getrennt.
- [x] Inter / Poppins / JetBrains Mono sind rollenbasiert projiziert.
- [x] Web-, PDF- und Social-Media-Pfade teilen dieselbe Authority.
- [x] Pattern-Missing-State rendert keinen Platzhalter und erfindet kein Signal.
- [x] Fokus- und generische Brand-Glow-Rollen verwenden AIF Gold.
- [ ] verbleibende `brand-cyan`-Consumer auf fachlich passende semantische Rollen migrieren.
- [ ] Compatibility-Aliase und Legacy-Pfade nach Inbound-Import-Zahl 0 löschen.


## 2026-09-24 — Productive Landingpage profile

Fresh Human/Owner direction promotes the **current productive Landingpage presentation** into the existing Branding Kit as the canonical public-site profile. This remains one design-token authority; no second palette or renderer registry is created.

| Landingpage role | Canonical value |
|---|---|
| Canvas | `#02050E` |
| Elevated/nav surface | `#090D1C` |
| Glass surface | `rgba(6, 12, 29, 0.72)` |
| Primary text | `#F8FAFC` |
| Secondary text | `#94A3B8` |
| Primary/focus Gold | `#F9BF21` |
| Marketing/CTA Magenta | `#FF2E93` |
| AI/intelligence Purple | `#8D26FF` |
| UI/display typography | `Plus Jakarta Sans` |
| Technical/data typography | `JetBrains Mono` |

The machine-readable profile is `design-tokens.json#color.landingPage` + `font.landingPage` + `patterns.landingPage`. Its web projection is `src/index.css` and its reusable public-site composition is `src/features/public/ui/LandingPageTemplate.tsx`.

Existing cross-media core roles used by PDF/Social remain unchanged unless their owner-correct contracts are separately changed. The Roadmap now consumes this Landingpage profile instead of the historical `app-shell-frame` / `ui-panel` dashboard presentation.
