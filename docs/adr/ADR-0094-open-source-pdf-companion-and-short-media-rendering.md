# ADR-0094: Open-Source PDF Companion and Short-Media Rendering

- **Authority ID:** `AUTH-ADR-OPEN-SOURCE-MEDIA-RENDERING-2026-08-19`
- **Version:** `1.0.0`
- **Status:** ACCEPTED
- **Implementation-Status:** ✅ IMPLEMENTED / VERIFIED
- **Datum:** 2026-08-19
- **Implementation verified:** 2026-08-19 via PR #446
- **Governance-Sync:** 2026-08-20
- **Owner:** CAPITAL-AI Owner
- **Scope:** PDF companion exports, deterministic image rendering, short-video rendering, WP-N3 renderer selection
- **Parents:** ADR-0091, ADR-0093, SEO-GM-ROADMAP-0002 / WP-N3
- **Authorization:** Owner-/Chat-Priorität 2026-08-19: PDF-Exports weiterentwickeln und Bilder/Short-Videos mit Open-Source-Lösungen integrieren.

## Namespace-Koordination

`ADR-0094` ist die kanonische Display-ID. Die parallele Governance-Control-Plane-Bereinigung reservierte diese Nummer für PR #446 und verwendet für ihre eigenen migrierten Entscheidungen `ADR-0095` (Privacy Governance) und `ADR-0096` (Governance Control Plane).

Die unveränderliche Identität dieser Entscheidung ist `AUTH-ADR-OPEN-SOURCE-MEDIA-RENDERING-2026-08-19`; eine spätere Pfad- oder Display-ID-Migration darf diese Authority-ID nicht ändern.

## Kontext

CAPITAL-AI besitzt nach ADR-0091/0093 einen zentralen PDF-Brand-Contract und zwei klar getrennte PDF-Rendererpfade. Parallel existiert in der kanonischen SEO-/Marketing-Roadmap `WP-N3`: Media-Asset-Validierung und hash-gebundene Human-Freigabe waren bereits vorhanden, die eigentliche Renderer-Auswahl für Bilder und Short-Videos war vor dieser Entscheidung noch offen.

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
- maximal 5 PDF-Seiten pro Companion-Render-Aufruf.

Ungültige oder übergroße Eingaben werden vor Decoder-/Renderer-Aufruf abgelehnt.

## Konsequenzen

### Positiv

- reproduzierbare, brandkonforme Bild- und Short-Assets;
- etablierte Open-Source-Decoder/Renderer statt eigener Codec-/Pixelimplementierung;
- PDF-Renderer bleibt unverändert und getrennt;
- kein Publishing-/Credential-Scope im Renderer;
- SHA-gebundene Provenance und Human-Freigabe bleiben erhalten.

### Trade-offs / Restrisiken

- Poppler/FFmpeg bleiben native Toolchain-Abhängigkeiten der lokalen Content-Pipeline;
- ein produktiver/distributabler FFmpeg-Build muss separat auf das erlaubte Lizenzprofil geprüft werden;
- generative Hintergründe, TTS und automatische Veröffentlichung bleiben bewusst außerhalb dieser Entscheidung.

## Implementierungs- und Validierungsnachweis

Die Entscheidung wurde durch PR #446 (`[Finance] feat(media): add open-source PDF companion and short renderer`) umgesetzt und am 2026-08-19 durch den Repository Owner gemergt.

Verifizierter Abschluss:

1. deterministische Image-Smokes: **PASS**;
2. PDF-Companion-Smoke auf lokalem PDF: **PASS**;
3. FFmpeg-buildconf Negativtest: **PASS**;
4. bounded-input/remote-URL Negativtests: **PASS**;
5. finaler PR-Head `c972ac8051c98f1b0c4ee25eb1d029bf15ead927`: CI #1971 **PASS**;
6. Governance #1304 und #1306: **PASS**;
7. TypeScript/Lint, Unit Tests, Production Build, CSP, Production Config/Deployment Readiness/Predeploy: **PASS**;
8. finaler Pre-Merge-main `0b904c10e46723cb80a7ba12781c3847005c4715`, Branch `behind=0`;
9. Human-/Owner-Merge: **erfüllt**; Merge-Commit `71bce3d07133e2a7d408af179c2325e6d5114d5a`.

Die Governance-Synchronisierung vom 2026-08-20 ändert **keine** Architekturentscheidung und keine Trust Boundary; sie korrigiert ausschließlich den nach Merge verbliebenen Implementation-Status-Drift.

## Supersession / Folgearbeiten

Die vor ADR-0094 dokumentierte Aussage „Renderer-Auswahl weiterhin offen“ ist für **deterministische PDF-, Bild- und Short-Video-Ausgabe** durch diese akzeptierte und implementierte Entscheidung überholt. Sie darf nicht erneut als offene Make-or-Buy-Entscheidung interpretiert werden.

Nicht entschieden und weiterhin separat zu behandeln sind insbesondere:

- TTS/Voiceover;
- generative Background-/B-Roll-Provider;
- Media-Studio-/Timeline-UI;
- Asset Registry und Storage-/Delivery-Pipeline;
- skalierbare Render-Worker;
- automatische Veröffentlichung.

Diese Folgefähigkeiten müssen die bestehende Provider-/Publishing-Boundary respektieren und dürfen ADR-0094 nicht stillschweigend ersetzen.

## Rollback

Repository-only: Human-gated Revert von PR #446 bzw. des Merge-Commits `71bce3d07133e2a7d408af179c2325e6d5114d5a`. Erzeugte lokale Assets können verworfen werden. Keine externe Plattform- oder Produktionsmutation ist zurückzurollen.
