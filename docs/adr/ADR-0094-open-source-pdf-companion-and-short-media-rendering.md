# ADR-0094: Open-Source PDF Companion and Short-Media Rendering

- **Status:** ACCEPTED
- **Implementation-Status:** 🟡 IN PROGRESS
- **Datum:** 2026-08-19
- **Owner:** CAPITAL-AI Owner
- **Scope:** PDF companion exports, deterministic image rendering, short-video rendering, WP-N3 renderer selection
- **Parents:** ADR-0091, ADR-0093, SEO-GM-ROADMAP-0002 / WP-N3
- **Authorization:** Owner-/Chat-Priorität 2026-08-19: PDF-Exports weiterentwickeln und Bilder/Short-Videos mit Open-Source-Lösungen integrieren.

## Kontext

CAPITAL-AI besitzt nach ADR-0091/0093 einen zentralen PDF-Brand-Contract und zwei klar getrennte PDF-Rendererpfade. Parallel existiert in der kanonischen SEO-/Marketing-Roadmap `WP-N3`: Media-Asset-Validierung und hash-gebundene Human-Freigabe sind vorhanden, die eigentliche Renderer-Auswahl für Bilder und Short-Videos war jedoch noch offen.

Die bestehende SocialMediaEngine bleibt Autorität für OAuth, Freigabe und Publishing. Ein Media-Renderer darf diese Boundary nicht duplizieren oder umgehen. Ebenso sollen Finanzzahlen, Brand-Text und Disclaimer nicht durch generative Bildmodelle gerendert werden, weil exakte Schreibweise, Provenance und reproduzierbare Ausgabe wichtiger sind als offene Kreativvariation.

## Entscheidung

### 1. Dünner Adapter statt eigener Rendering-Engine

CAPITAL-AI implementiert einen kleinen Orchestrator um etablierte Open-Source-Werkzeuge:

- **Pillow 12.3.0** für deterministische PNG-Frames und Social Cards;
- **Poppler / `pdfinfo` + `pdftoppm`** für lokale PDF-Seitenrasterung;
- **FFmpeg** für das Zusammenfügen validierter 1080x1920-Frames zu kurzen MP4-Videos.

Business-/Brandlogik bleibt im Repository; Pixel-/Codec-Verarbeitung wird nicht selbst implementiert.

### 2. PDF Companion Export

Der bestehende PDF-Renderer wird nicht ersetzt. `scripts/docs/export_pdf_media_bundle.py` erzeugt aus einem **lokalen, unveränderten PDF**:

- 1280x720 Preview,
- 1080x1080 Social Card,
- 1080x1920 Vertical Cover,
- gebrandete 9:16-Seitenframes,
- optional einen maximal 60 Sekunden langen Short-Teaser,
- ein Manifest mit PDF-SHA-256, verwendeten Seiten und Asset-SHA-256.

Der Companion-Export ändert weder PDF-Struktur noch PDF/UA-Status. Er ist kein Accessibility-Validator.

### 3. Deterministische Bilder

`scripts/media/render_content_assets.py` rendert aus einem begrenzten lokalen JSON-Manifest:

- Thumbnail 1280x720,
- Square 1080x1080,
- Vertical 1080x1920,
- 9:16 Szenenframes,
- optional MP4 Short-Video.

Brandfarben werden direkt aus `docs/frontend/design-tokens.json` gelesen. Finanzwerte, Titel, Disclaimer und sonstige brandkritische Texte werden ausschließlich deterministisch gerendert.

### 4. Kein Netzwerk und keine Publish-Authority

Der Renderer akzeptiert keine `mediaUrl`, `imageUrl` oder `sourceUrl` als Eingabe und führt keine Netzwerkabfragen aus. Er besitzt keine OAuth-, Supabase-, Stripe-, Render-, GitHub- oder Publishing-Credentials.

Erzeugte Manifeste setzen immer:

`publishReady: false`

Publishing darf weiterhin erst nach bestehender Media-Asset-Validierung und hash-gebundener Human-Freigabe erfolgen.

### 5. FFmpeg Lizenzprofil fail-closed

FFmpeg ist upstream grundsätzlich LGPLv2.1+, kann aber durch Compile-Optionen in einen GPL- oder nonfree-Build wechseln. Daher wird `ffmpeg -buildconf` vor Video-Rendering geprüft:

- `--enable-nonfree` -> **immer DENY**;
- `--enable-gpl` -> standardmäßig **DENY**;
- GPL-Build darf nur über einen expliziten Developer-Smoke-Override lokal genutzt werden;
- Produktions-/Distributionsprofil soll einen separat überprüften LGPL-kompatiblen FFmpeg-Build verwenden.

Der Renderer verwendet im Baseline-Profil den eingebauten `mpeg4` Video-Encoder und fügt keine neue npm/native Runtime-Dependency zur Web-App hinzu.

### 6. Begrenzte Eingaben

- maximal 8 Szenen,
- maximal 60 Sekunden Gesamtdauer,
- einzelne Szene 1-20 Sekunden,
- begrenzte Textlängen,
- lokale PDFs: maximal 5 Seiten pro Companion-Export,
- Subprozesse nur mit Argumentlisten, `shell=False` und Timeout.

### 7. Nicht ausgewählte Alternativen

#### MoneyPrinterTurbo

Technisch geeignet und MIT-lizenziert, aber für diesen Scope nicht eingebettet. Es bringt eine wesentlich größere LLM-/TTS-/Provider-/Download-/Video-Oberfläche mit und würde bestehende CAPITAL-AI Content-/Publishing-Grenzen teilweise duplizieren. Es bleibt ein möglicher **isolierter Adapter** für spätere, explizit genehmigte generative Szenenproduktion.

#### Remotion

Technisch sehr geeignet für React-basierte Video-Templates, wird jedoch nicht als Baseline gewählt. Die aktuelle Remotion-Lizenz ist nicht für alle kommerziellen Organisations-/Automationsszenarien kostenlos und erzeugt damit zusätzlichen Lizenz-/Lock-in-Review.

#### Sharp

Sharp ist performant und Apache-2.0-lizenziert. Für diesen Scope würde es jedoch eine zusätzliche native Node/libvips-Abhängigkeit in der Web-Toolchain erzeugen. Der PDF-/Documentation-nahe Python-Sidecar mit Pillow ist kleiner und vermeidet Konflikte mit der bestehenden Node-Runtime.

## Security und Compliance

- keine Remote-Medien im Renderer;
- keine generativen Finanzzahlen oder unkontrollierten Text-Overlays;
- SHA-256 für alle finalen Assets;
- Quell-PDF-SHA im Companion-Manifest;
- bestehende SSRF-Validierung in `server/socialMedia/mediaAssetValidation.ts` bleibt vor Publishing maßgeblich;
- bestehende hash-gebundene Owner-Freigabe bleibt maßgeblich;
- kein Auto-Publish;
- keine Aussage, dass Media-Rendering PDF/UA, BFSG, WCAG oder regulatorische Konformität herstellt.

## Primärquellen / Projektquellen

- FFmpeg Legal: https://ffmpeg.org/legal.html
- FFmpeg Download/Releases: https://ffmpeg.org/download.html
- Pillow Security Policy: https://github.com/python-pillow/Pillow/security/policy
- Pillow 12.3.0: https://pillow.readthedocs.io/en/stable/releasenotes/12.3.0.html
- Sharp: https://sharp.pixelplumbing.com/
- MoneyPrinterTurbo: https://github.com/harry0703/MoneyPrinterTurbo
- Remotion License: https://www.remotion.dev/license
- CAPITAL-AI canonical roadmap: `docs/roadmaps/SEO_GOOGLE_MARKETING_CONSOLIDATED_ROADMAP.md`
- CAPITAL-AI media validation: `server/socialMedia/mediaAssetValidation.ts`

## Konsequenzen

### Positiv

- PDF-Ausgaben werden ohne Änderung des Quell-PDFs direkt für Social-/Preview-Nutzung wiederverwendbar;
- Images und Shorts sind reproduzierbar und brand-token-basiert;
- keine zweite Social-Publishing-Plattform;
- niedriger Vendor-Lock-in;
- Renderer kann offline/lokal betrieben werden;
- Lizenzprofil und Asset-Provenance sind maschinenlesbar.

### Trade-offs

- initiale Shorts sind bewusst text-/frame-basiert und ohne TTS;
- die Web-App erhält in diesem Scope noch keinen synchronen Video-Rendering-Endpunkt;
- ein produktiver FFmpeg-Build muss separat als LGPL-kompatibles Betriebsartefakt geprüft werden;
- generative Hintergründe/FLUX bleiben optional und außerhalb des brandkritischen Textpfads.

## Nicht-Ziele

- kein Auto-Publish;
- kein neuer Social-OAuth-Stack;
- keine externe Media-URL-Ingestion;
- kein TTS-Provider in diesem ersten WP-N3-Slice;
- keine Änderung von Score-/Market-Data-Logik;
- keine Supabase-/Render-/Stripe-Produktionsmutation;
- keine formale PDF/UA-Zertifizierung.

## Verifikation / Abschluss

ADR-0094 kann auf `✅ COMPLETE` gesetzt werden, wenn:

1. generischer Image-/Short-Renderer vorhanden ist;
2. PDF Companion Export vorhanden ist;
3. Graham-Fair-Value-Paket ein ausführbares Render-Manifest besitzt;
4. Pillow/FFmpeg/Poppler-Sicherheits- und Lizenzgates im Code/Tests verankert sind;
5. lokaler Image-Smoke sowie PDF-Companion-Smoke erfolgreich sind;
6. ein lokaler GPL-FFmpeg-Build standardmäßig korrekt verweigert wird;
7. optionaler Developer-Video-Smoke separat als nicht-produktionsfreigegeben dokumentiert ist;
8. Branch vor PR gegen aktuellen `main` und Parallel-PRs korreliert ist;
9. nach PR-Erstellung erforderliche Repository-Checks dokumentiert sind.
