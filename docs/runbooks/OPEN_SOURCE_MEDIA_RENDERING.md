# Runbook - Open-Source Media Rendering

Authority: ADR-0094 / SEO-GM-ROADMAP-0002 WP-N3

## Zweck

Lokale, deterministische CAPITAL-AI Bilder, Short-Frames und PDF Companion Assets erzeugen. Kein Publish, kein OAuth, keine externen Media-URLs.

## Voraussetzungen

- Python 3.10+
- `Pillow==12.3.0`
- für PDF Companion: `pdfinfo` + `pdftoppm` (Poppler)
- für Video: `ffmpeg` + `ffprobe`

Installation der Python-Abhängigkeit:

```bash
python3 -m pip install -r scripts/media/requirements-content-media.txt
```

## 1. Content Images erzeugen

```bash
python3 scripts/media/render_content_assets.py \
  --manifest docs/content-creator/packages/graham-fair-value-check/MEDIA_RENDER_MANIFEST.json \
  --out-dir /tmp/capital-ai-graham-media
```

Erwartet werden Thumbnail, Square, Vertical Cover, Szenenframes und ein Asset-Manifest.

## 2. Short-Video erzeugen

Vor dem Render prüft der Code `ffmpeg -buildconf`.

Ein LGPL-kompatibler Build ohne `--enable-gpl`/`--enable-nonfree` kann regulär verwendet werden:

```bash
python3 scripts/media/render_content_assets.py \
  --manifest docs/content-creator/packages/graham-fair-value-check/MEDIA_RENDER_MANIFEST.json \
  --out-dir /tmp/capital-ai-graham-media \
  --video
```

Wenn der **lokale Developer-Build** mit `--enable-gpl` kompiliert wurde, stoppt der Renderer standardmäßig. Nur für einen lokalen Smoke darf explizit überschrieben werden:

```bash
python3 scripts/media/render_content_assets.py \
  --manifest scripts/media/examples/capital_ai_media_manifest.json \
  --out-dir /tmp/capital-ai-media-smoke \
  --video \
  --allow-gpl-ffmpeg
```

Dieser Override ist **keine Produktions-/Distributionsfreigabe**. Ein `--enable-nonfree` Build wird immer abgelehnt.

## 3. PDF Companion Bundle

```bash
python3 scripts/docs/export_pdf_media_bundle.py report.pdf \
  --out-dir /tmp/capital-ai-pdf-media \
  --title "CAPITAL-AI Analysebericht" \
  --subtitle "Quantitative Analyse - kompakt aufbereitet" \
  --pages 3
```

Optional mit Short-Teaser:

```bash
python3 scripts/docs/export_pdf_media_bundle.py report.pdf \
  --out-dir /tmp/capital-ai-pdf-media \
  --title "CAPITAL-AI Analysebericht" \
  --pages 3 \
  --video
```

## Output Contract

Das JSON-Manifest enthält mindestens:

- `publishReady: false`;
- Asset-Dateiname;
- MIME-Type;
- SHA-256;
- Dimensionen;
- bei Video Dauer;
- Renderer-/FFmpeg-Profil;
- beim PDF Companion Quell-PDF-SHA und Seitenzahl.

## Publishing Handoff

Dieser Renderer veröffentlicht nichts. Vor einer Veröffentlichung bleiben maßgeblich:

1. bestehende `server/socialMedia/mediaAssetValidation.ts` / validierter erreichbarer Asset-Pfad;
2. bestehende hash-gebundene Content-/Asset-/Plattform-Freigabe;
3. bestehende SocialMediaEngine Publisher.

`publishReady=false` darf nicht durch bloßes Umbenennen oder UI-Statusänderung als Approval interpretiert werden.

## Security / Operations

- keine Remote-URLs als Renderer-Eingabe;
- keine Secrets im Manifest;
- keine unbounded Szenen/Dauern;
- Outputs in einen separaten Arbeits-/Asset-Pfad schreiben;
- generierte Manifeste mit dem zugehörigen Content Package/Evidence aufbewahren;
- bei Pillow-/FFmpeg-Security-Updates Versionen erneut prüfen;
- produktiven FFmpeg-Build vor Rollout auf Lizenzprofil und Build-Konfiguration verifizieren.
