# WP-N3 Open-Source Media Rendering

- **Status:** VERIFIED / MERGED
- **Datum:** 2026-08-19
- **Governance-Sync:** 2026-08-20
- **Owner:** CAPITAL-AI Owner
- **Authority:** SEO-GM-ROADMAP-0002 / WP-N3 + ADR-0094 + Owner-Priorität 2026-08-19
- **Implementation-Branch:** `agent/pdf-media-open-source-rendering`
- **Merge-PR:** #446
- **Merge-Commit:** `71bce3d07133e2a7d408af179c2325e6d5114d5a`

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
- [x] finaler Main-/Parallel-PR-Abgleich vor PR-Erstellung durchgeführt;
- [x] PR erst nach dem finalen Pre-PR-Abgleich erstellt;
- [x] Post-PR Repository-Checks auf Exact Head `c972ac8051c98f1b0c4ee25eb1d029bf15ead927` ausgeführt: CI #1971 PASS, Governance #1304/#1306 PASS, TypeScript/Lint PASS, Unit Tests PASS, Production Build PASS, CSP PASS, Production Config/Deployment Readiness/Predeploy PASS;
- [x] Human-/Owner-Merge am 2026-08-19 abgeschlossen; Merge-Commit `71bce3d07133e2a7d408af179c2325e6d5114d5a`.

## Parallel-PR-Korrelation

Historische Pre-Merge-Korrelation aus PR #446:

- **PR #439:** README, `package.json` und Version-/Documentation-Hygiene-Automation; 0 direkter Dateioverlap.
- **PR #442:** SC-7 Ranking + `docs/governance/document-registry.json`; 0 direkter Dateioverlap.
- Vor Merge wurde der Branch zusätzlich mit `main@0b904c10e46723cb80a7ba12781c3847005c4715` synchronisiert; der effektive Media-Diff blieb auf 12 Scope-Dateien begrenzt.

## Definition of Done

P1-P5 sind erfüllt. Der WP-N3-Renderer-Slice ist durch PR #446 gemergt und über Exact-Head-CI/Governance sowie den finalen Main-Abgleich verifiziert.

Die Bezeichnung `WP-N3` in der älteren Fassung von `SEO-GM-ROADMAP-0002` enthielt zusätzlich TTS als künftige Media-Fähigkeit. ADR-0094 und dieses Work Package entscheiden und verifizieren den **deterministischen Bild-/PDF-/Short-Renderer**. TTS, generative Background Provider, Asset Registry/Storage, Media-Studio-UI und Auto-Publish bleiben eigenständige Folgeschritte und dürfen nicht als Begründung verwendet werden, die bereits getroffene Renderer-Auswahl wieder als „offen“ zu behandeln.

Nicht Teil dieses Work Packages: Auto-Publish, TTS, generative Background Provider, Datenbank-/Storage-Mutation oder ein eigener Video-Codec.
