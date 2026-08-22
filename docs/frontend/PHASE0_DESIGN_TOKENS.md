# CAPITAL-AI — Design Tokens & Branding Manifest v6.0

**Status:** ACTIVE / CANONICAL  
**Stand:** 22. August 2026  
**Runtime-Authority:** `docs/frontend/design-tokens.json`  
**Web-Projektion:** `src/index.css` (`@theme`)  
**Frontend-Architektur:** `docs/frontend/FRONTEND_ARCH.md`

---

## 1. Zweck und Authority

Die Design-Token-Registry ist der **Single Point of Trust für maschinenlesbare CAPITAL-AI Branding-Werte**. Webanwendung, PDF-Renderer, Social Media Engine und weitere Renderer konsumieren oder projizieren diese Registry. Renderer dürfen keine konkurrierende Markenpalette als eigene Authority etablieren.

Das vom Owner bereitgestellte externe Artefakt **„capital-ai.online — Design & Brand Architecture / Branding Manifest v6.0“** wurde am 22. August 2026 als Designvorgabe korreliert. Es bleibt ein Provenance-/Owner-Input; zur Laufzeit besteht **keine Google-Drive-Abhängigkeit**. Die übernommenen Werte und der SHA-256-Fingerprint der Quelle sind im `provenance`-Block von `design-tokens.json` gebunden.

```text
Owner / Branding Manifest v6.0
            ↓ ingest + provenance
Canonical Design Token Registry
            ↓
      ┌─────┼─────────┬───────────┬──────────┐
      ↓     ↓         ↓           ↓          ↓
     Web   PDF   Social Media   E-Mail      SEO
```

Für die React-Struktur bleibt `FRONTEND_ARCH.md` die normative Presentation-/Dependency-Authority. Dieses Dokument definiert ausschließlich Branding-/Token-Projektion und erzeugt keine zweite Frontend-Architektur.

---

## 2. Branding Manifest v6.0 — aktive Palette

| Tokenrolle | Wert | Verwendung |
|---|---:|---|
| Background Primary | `#08080C` | Haupt-Canvas |
| Background Secondary | `#121215` | Cards / erhöhte Flächen |
| Border | `#252529` | Standard-Divider / Borders |
| Text Primary | `#FFFFFF` | Primärtext |
| Text Secondary | `#A1A1AA` | Sekundär-/Metatext |
| Brand Primary / Gold | `#F9BF21` | Brand, CTA, Premium, Fokus |
| Brand Accent / Purple | `#8D26FF` | AI-/Tech-Akzent |
| Success / Emerald | `#44DE88` | READY / BUY / positive Semantik |
| Danger / Rose | `#F87171` | REJECT / SELL / Fehlersemantik |

### Verbotene aktive UI-Branding-Werte

- Cyan/Blau als Brandingfarbe, insbesondere historische Cyan-/Blue-Akzente.
- Historisches Gold `#F5C453` bzw. andere Alt-Gold-Varianten als neue lokale Branding-Authority.
- Montserrat als Heading-Authority.
- lokale Renderer-Paletten, die von der Token-Registry abweichen.

Domänenspezifische Asset-/Unterklassenfarben dürfen in der **Content Layer** verwendet werden, wenn sie Daten visualisieren. Sie dürfen nicht die UI-Branding-Authority ersetzen.

---

## 3. Typografie

| Rolle | Kanonisch |
|---|---|
| Headings / Display | **Inter** |
| Body | **Poppins** |
| Tech / Scores / Data | **JetBrains Mono** |

`src/index.css` setzt `--font-display` auf Inter und bindet `h1`–`h6` an diese Rolle. Renderer mit technischen Font-Limitierungen dürfen dokumentierte Renderer-Fallbacks verwenden, dürfen daraus aber keine neue Produktfont-Authority ableiten.

---

## 4. Kompatibilitäts-Aliase

Historische CSS-/Token-Bezeichner wie `aif-gold-*`, `aif-neon-purple` und `aif-neon-cyan` existieren während der strangler-basierten UI-Migration nur als **nicht-authoritative Compatibility Surface**.

- `aif-gold-*` projiziert auf Manifest-v6-Gold `#F9BF21`.
- `aif-neon-purple` projiziert auf Purple `#8D26FF`.
- `aif-neon-cyan` projiziert ebenfalls auf Purple `#8D26FF`; dadurch kann Legacy-Code keinen Cyan-Brandingwert mehr rendern.
- Neue Komponenten verwenden ausschließlich semantische `brand-*`-Tokens.
- Nach Migration aller Consumer werden die historischen Aliasnamen entfernt.

Damit wird die sichtbare Palette sofort konsolidiert, ohne eine zweite Theme-Schicht oder einen Big-Bang-Pfadbruch zu erzeugen.

---

## 5. Pattern Badge Contract

Pattern-Ergebnisse der kanonischen Scoring-/Orchestrator-Schichten werden nur als **Presentation Projection** dargestellt.

| Richtung | Semantik | Farbe |
|---|---|---:|
| BUY | strong / medium / weak | Emerald `#44DE88` |
| SELL | strong / medium / weak | Rose `#F87171` |
| kein verifiziertes Pattern | `NO PATTERN` | neutral |

Es werden keine Pattern-Platzhalter oder erfundenen Signale erzeugt. Die UI liest verifizierte Ergebnisse und schreibt weder in den kanonischen Score noch in Ranking-/Execution-Contracts.

---

## 6. Renderer-Verträge

### Web / React

- Runtime-Projektion über `src/index.css` / Tailwind CSS 4 `@theme`.
- Shared-Primitives und Branding-Komponenten unter `src/shared`.
- Inter / Poppins / JetBrains Mono gemäß Rollenvertrag.

### Client-PDF / jsPDF

- `src/platform/PdfReporting/pdfBrand.ts`.
- Build-time Tokens aus `docs/frontend/design-tokens.json` über `vite.config.ts`.
- PDF-safe Renderer-Fallbacks sind technische Adapter, keine alternative Brand-Authority.

### Documentation-PDF / WeasyPrint

- `scripts/docs/export_notebooklm_pdfs.py`.
- Direkte Token-Lektüre aus derselben Registry.
- Separate Accessibility-/PDF-UA-Verifikation bleibt erforderlich.

### Social Media Engine

- `src/platform/SocialMediaEngine/Contracts/MediaProject.ts` bindet `brandTokenSource` an `docs/frontend/design-tokens.json`.
- `MediaStudioTemplates.ts` erzeugt Projekte über diesen bestehenden Contract.
- `scripts/media/capital_ai_media.py` liest dieselbe Registry für deterministische Media-Renderings.
- Generative Entwürfe ohne diesen Contract sind **Mockups/Concept Art**, keine produktiven Templates.

### E-Mail / SEO / externe Anbieter

Externe Provider erhalten Werte aus einem versionierten Export/Contract der Registry. Die Drive-Grafik oder individuelle Provider-Templates werden nicht zur Laufzeit-Authority. Abweichende lokale Farben/Fonts sind nicht zulässig.

---

## 7. Accessibility und Interaktion

- Fokus: Gold `#F9BF21`, 2 px, Offset 4 px.
- Interaktive Ziele: mindestens 44 × 44 px, sofern durch Komponententyp sinnvoll.
- Statusinformation wird zusätzlich zu Farbe durch Text/Icon transportiert.
- `prefers-reduced-motion` bleibt verbindlich.

---

## 8. Migration / Suspendierung des Altsystems

Das historische Cyan-/Alt-Gold-/Montserrat-System ist **SUSPENDED**. Neue Implementierung darf es nicht als Authority verwenden.

Die physische Bereinigung erfolgt strangler-basiert:

1. Kanonische Tokenwerte auf Manifest v6.0 projizieren. — **umgesetzt**
2. Web-Theme / Inter-Headings umstellen. — **umgesetzt**
3. zentrale Branding-Primitives auf `brand-*` migrieren. — **umgesetzt / laufend**
4. fachliche Legacy-Komponenten mit lokalen Farbliteralen schrittweise bereinigen.
5. Brand-Contract-Gate verschärfen, sobald die bekannte Legacy-Allowlist auf null reduziert ist.
6. historische Aliasnamen entfernen und Alt-Dokumentation unter `docs/archive/` read-only halten.

Kein Archivdokument und keine externe Grafik darf nach der Migration als produktiver Token-Input importiert werden.

---

## 9. Abnahmekriterien

- [x] Manifest-v6-Provenance in `design-tokens.json` gebunden.
- [x] Gold, Purple, Emerald, Rose sowie Surface-/Textwerte zentral konsolidiert.
- [x] Cyan-Kompatibilitätsalias rendert Purple statt Cyan.
- [x] Inter als Heading-Rolle in der Webprojektion aktiviert.
- [x] Social-Media-Contract verweist bereits auf dieselbe Token-Registry.
- [x] PDF- und Media-Renderer konsumieren dieselbe Registry.
- [ ] verbleibende lokale Alt-Farbliterale in Legacy-Fachkomponenten vollständig migriert.
- [ ] Compatibility-Aliase nach Consumer-Migration physisch entfernt.
