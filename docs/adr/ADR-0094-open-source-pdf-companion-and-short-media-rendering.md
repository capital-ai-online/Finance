# ADR-0094: Open-Source PDF Companion and Short-Media Rendering

- **Authority ID:** `AUTH-ADR-OPEN-SOURCE-MEDIA-RENDERING-2026-08-19`
- **Version:** `1.1.0`
- **Status:** ACCEPTED
- **Implementation-Status:** 🟡 IN PROGRESS
- **Datum:** 2026-08-19
- **Owner:** CAPITAL-AI Owner
- **Scope:** PDF companion exports, deterministic image rendering, short-video rendering, deterministic 16:9 cinematic brand-film rendering, WP-N3 renderer selection
- **Parents:** ADR-0091, ADR-0093, SEO-GM-ROADMAP-0002 / WP-N3
- **Authorization:** Owner-/Chat-Priorität 2026-08-19: PDF-Exports weiterentwickeln und Bilder/Short-Videos mit Open-Source-Lösungen integrieren; ergänzende Owner-/Chat-Priorität 2026-08-19: 45-s CAPITAL-AI Graham/Buffett Premium Brand Film aus dem Finance-Repository erzeugen.

## Namespace-Koordination

`ADR-0094` ist für diesen PR die kanonische Display-ID. Die parallele Governance-Control-Plane-Bereinigung reserviert diese Nummer ausdrücklich für PR #446 und verwendet für ihre eigenen migrierten Entscheidungen `ADR-0095` (Privacy Governance) und `ADR-0096` (Governance Control Plane).

Die unveränderliche Identität dieser Entscheidung ist `AUTH-ADR-OPEN-SOURCE-MEDIA-RENDERING-2026-08-19`; eine spätere Pfad- oder Display-ID-Migration darf diese Authority-ID nicht ändern. Vor Merge bleibt der normale Current-`main`-/Open-PR-Korrelationscheck erforderlich.

## Kontext

CAPITAL-AI besitzt nach ADR-0091/0093 einen zentralen PDF-Brand-Contract und zwei klar getrennte PDF-Rendererpfade. Parallel existiert in der kanonischen SEO-/Marketing-Roadmap `WP-N3`: Media-Asset-Validierung und hash-gebundene Human-Freigabe sind vorhanden, die eigentliche Renderer-Auswahl für Bilder und Short-Videos war jedoch noch offen.

Die bestehende SocialMediaEngine bleibt Autorität für OAuth, Freigabe und Publishing. Ein Media-Renderer darf diese Boundary nicht duplizieren oder umgehen. Ebenso sollen Finanzzahlen, Brand-Text und Disclaimer nicht durch generative Bildmodelle gerendert werden, weil exakte Schreibweise, Provenance und reproduzierbare Ausgabe wichtiger sind als offene Kreativvariation.

Mit der Version 1.1 wird derselbe deterministische Rendering-Slice um einen kontrollierten 16:9-Cinematic-Pfad für einen 45-sekündigen Graham/Buffett Premium Brand Film erweitert. Ziel ist ausdrücklich keine neue Video-Plattform oder generative Video-Engine, sondern eine wiederholbare Motion-Graphics-Komposition innerhalb derselben Security-, Lizenz- und Publishing-Grenzen.

## Entscheidung

### 1. Dünner Adapter statt eigener Rendering-Engine

CAPITAL-AI implementiert einen kleinen Orchestrator um etablierte Open-Source-Werkzeuge:

- **Pillow 12.3.0** für deterministische PNG-Frames und Social Cards;
- **Poppler / `pdfinfo` + `pdftoppm`** für lokale PDF-Seitenrasterung;
- **FFmpeg** für das Zusammenfügen validierter 1080x1920-Frames zu kurzen MP4-Videos und für die Interpolation/Skalierung deterministischer 16:9 Motion-Graphics-Keyframes.

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

### 3a. Deterministisches 16:9 Cinematic Brand-Film-Profil

`scripts/media/render_cinematic_brand_film.py` ergänzt den bestehenden Renderer additiv um einen eng begrenzten 16:9-Profilpfad. Maßgeblich bleiben dieselben Brand-, FFmpeg- und Publishing-Contracts.

Für den kanonischen Graham/Buffett Premium Brand Film gilt:

- lokales Manifest `docs/content-creator/packages/graham-fair-value-check/PREMIUM_BRAND_FILM_MANIFEST.json`;
- 1920x1080 (16:9), 24 fps, exakt 45 Sekunden;
- deterministische Pillow-Keyframes mit langsamer Motion-Graphics-Komposition;
- FFmpeg-Frame-Interpolation und Lanczos-Scaling statt zusätzlicher Video-Framework-Dependency;
- Brand-Gold/Cyan/Purple weiterhin über `load_brand_palette()` aus den kanonischen Design-Tokens;
- keine Remote-Media-URLs, keine Ticker/Kursdaten, keine generativen Finanzdaten;
- kein Audio-/TTS-Track im Renderer;
- bounded acht Szenen und exakt definierte Headline-Sequenz `DATA`, `EVIDENCE`, `MODELS`, `RISK`, `INTELLIGENCE`;
- neun explizite Graham-/Buffett-orientierte Value-Checks im Models-Abschnitt;
- Traceability `SOURCE -> METRIC -> CHECK -> MODEL -> SCORE`;
- finales Brand-Statement `QUANTITATIVE INTELLIGENCE FOR COMPLEX MARKETS`;
- SHA-256-Asset-Manifest und `publishReady=false`.

Der Cinematic-Pfad ist kein generischer Video-Editor und übernimmt keine Publishing-, Storage-, OAuth- oder Asset-Approval-Funktion.

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

- maximal 8 Szenen im generischen Short-Renderer;
- maximal 60 Sekunden Gesamtdauer im generischen Short-Renderer;
- einzelne Short-Szene 1-20 Sekunden;
- begrenzte Textlängen;
- maximal 5 PDF-Seiten pro Companion-Render-Aufruf;
- Cinematic Graham/Buffett Profile: exakt 8 Szenen, kontinuierliche Timeline 0-45 Sekunden, exakt neun Value-Check-Labels und festes Brand-Statement.

Ungültige oder übergroße Eingaben werden vor Decoder-/Renderer-Aufruf abgelehnt.

## Konsequenzen

### Positiv

- reproduzierbare, brandkonforme Bild-, Short- und 16:9-Cinematic-Assets;
- etablierte Open-Source-Decoder/Renderer statt eigener Codec-/Pixelimplementierung;
- Premium-Motion-Graphics ohne zusätzliche Remotion-/Blender-/MoviePy-Runtime;
- PDF-Renderer bleibt unverändert und getrennt;
- kein Publishing-/Credential-Scope im Renderer;
- SHA-gebundene Provenance und Human-Freigabe bleiben erhalten.

### Trade-offs / Restrisiken

- Poppler/FFmpeg bleiben native Toolchain-Abhängigkeiten der lokalen Content-Pipeline;
- ein produktiver/distributabler FFmpeg-Build muss separat auf das erlaubte Lizenzprofil geprüft werden;
- der Cinematic-Pfad ist bewusst deterministische 2D/2.5D-Motion-Graphics und kein photorealistischer 3D-Renderer;
- generative Hintergründe, TTS und automatische Veröffentlichung bleiben bewusst außerhalb dieses Work Packages.

## Validierung

Vor Merge-Readiness sind mindestens erforderlich:

1. deterministische Image-Smokes;
2. PDF-Companion-Smoke auf lokalem PDF;
3. FFmpeg-buildconf Negativtest;
4. bounded-input/remote-URL Negativtests;
5. Cinematic-Python-Compile, Manifest-/Timeline-Validation, 1920x1080/24-fps/45-s-ffprobe-Validation und Visual-QA;
6. TypeScript/Unit/Production-Build gemäß Repository-Classifier;
7. finaler Current-`main`-/Open-PR-Korrelationscheck;
8. Human/CODEOWNER Review und separate Merge-Entscheidung.

## Rollback

Repository-only: Human-gated Revert dieses PRs. Erzeugte lokale Assets können verworfen werden. Keine externe Plattform- oder Produktionsmutation ist zurückzurollen.
