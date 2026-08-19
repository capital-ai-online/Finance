# WP-N3 Open-Source Media Rendering

- **Status:** IN IMPLEMENTATION
- **Datum:** 2026-08-19
- **Owner:** CAPITAL-AI Owner
- **Authority:** SEO-GM-ROADMAP-0002 / WP-N3 + ADR-0094 + Owner-Priorität 2026-08-19
- **Branch:** `agent/pdf-media-open-source-rendering`

## Ziel

Die bereits vorhandene SocialMediaEngine um einen kleinen, ersetzbaren und offline-fähigen Rendering-Slice ergänzen, ohne Publishing-/OAuth-/Approval-Authority zu duplizieren. Gleichzeitig werden bestehende PDF-Ausgaben als hochwertige Social-/Preview-Assets wiederverwendbar.

## P1 - PDF Companion Export

- [x] lokale PDF-Seiten über Poppler rasterisieren;
- [x] Quell-PDF nicht verändern;
- [x] 1280x720 PDF Preview erzeugen;
- [x] 1080x1080 PDF Social Card erzeugen;
- [x] 1080x1920 PDF Vertical Cover erzeugen;
- [x] bis zu fünf PDF-Seiten als gebrandete Short-Frames nutzen;
- [x] optional Short-Teaser über FFmpeg erzeugen;
- [x] PDF-SHA, Seitenzahl, verwendete Seiten und Asset-SHAs manifestieren;
- [x] keine PDF/UA-/Accessibility-Konformität aus Companion-Rendering ableiten.

## P2 - Deterministic Image / Short Renderer

- [x] Bildrenderer auf Pillow 12.3.0 pinnen;
- [x] Brandfarben aus `docs/frontend/design-tokens.json` lesen;
- [x] Thumbnail, Square, Vertical Cover rendern;
- [x] 1080x1920 Szenenframes rendern;
- [x] Szenen-/Text-/Dauergrenzen fail-closed validieren;
- [x] keine Remote-Media-URLs zulassen;
- [x] optional MP4 Short mit FFmpeg erzeugen;
- [x] Output-Metadaten + SHA-256 manifestieren;
- [x] `publishReady=false` erzwingen.

## P3 - OSS / Security / License Gate

- [x] FFmpeg Build-Konfiguration vor Render prüfen;
- [x] `--enable-nonfree` immer verweigern;
- [x] `--enable-gpl` standardmäßig verweigern;
- [x] expliziter GPL-Override nur für Developer-Smoke;
- [x] Produktionsprofil als LGPL-kompatiblen FFmpeg-Build definieren;
- [x] Subprocess-Aufrufe ohne Shell und mit Timeout;
- [x] Pillow-Decoding auf Renderer-eigene/Poppler-generierte lokale Bilder begrenzen;
- [x] bestehende SSRF-/Approval-/Publishing-Grenzen unverändert lassen.

## P4 - Erstes Content Package

- [x] `graham-fair-value-check` erhält deterministisches Render-Manifest;
- [x] Disclaimer am Anfang und Ende;
- [x] keine echten Ticker/Kursdaten erfinden;
- [x] keine Buy-/Sell-Signale;
- [x] bestehende Storyboard-Intentions in Render-Szenen überführen.

## P5 - Validation / Governance

- [x] Python Compile-Smoke dokumentieren;
- [x] Image-Smoke dokumentieren;
- [x] GPL-DENY-Smoke dokumentieren;
- [x] Developer-Video-Smoke dokumentieren;
- [x] PDF Companion Smoke dokumentieren;
- [x] Source-/Governance-Tests ergänzen;
- [ ] finaler Main-/Parallel-PR-Abgleich;
- [ ] PR erst danach erstellen;
- [ ] Post-PR Repository-Checks ausführen und Evidence ergänzen.

## Definition of Done

WP-N3 Slice ist fachlich abgeschlossen, wenn alle P1-P4-Punkte und die Pre-PR-P5-Punkte abgeschlossen sind, keine bestehende Social-/PDF-Authority umgangen wird und der finale Branch-Diff gegen aktuellen `main` korreliert ist.

Nicht Teil dieses Work Packages: Auto-Publish, TTS, generative Background Provider, Datenbank-/Storage-Mutation oder ein eigener Video-Codec.
