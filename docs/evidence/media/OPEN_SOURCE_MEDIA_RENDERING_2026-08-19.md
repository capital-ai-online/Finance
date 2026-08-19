# Open-Source Media Rendering Evidence - 2026-08-19

- **Status:** IMPLEMENTATION COMPLETE / PR VALIDATION PENDING
- **Owner:** CAPITAL-AI Owner
- **Authority:** ADR-0094, SEO-GM-ROADMAP-0002 / WP-N3
- **Branch:** `agent/pdf-media-open-source-rendering`
- **Initial Main:** `59a2755de53297a934b062b380a313d68cd47492`
- **Final Pre-PR Main:** `59a2755de53297a934b062b380a313d68cd47492`

## Anlass

Owner-Priorität: PDF-Exports weiterentwickeln und zusätzlich Short-Videos sowie Bilder mit Open-Source-Lösungen integrieren.

## Repository-Baseline

Vor Umsetzung waren bereits vorhanden:

- zentraler PDF Brand-/Metadata-Contract;
- jsPDF Client-Reports;
- WeasyPrint/Poppler Documentation-PDF-Tooling;
- SocialMediaEngine Text-/Script-Generierung;
- SSRF-harte `mediaUrl`-Validierung;
- hash-gebundene Human-Freigabe;
- Storyboard/Prompts für das Graham-Fair-Value-Content-Paket.

Nicht vorhanden war der in WP-N3 noch offene Renderer.

## OSS Make-or-Buy Review

| Lösung | Fit | Aktivität / Security | Lizenz | Integrationsaufwand | Lock-in / Enterprise | Entscheidung |
|---|---|---|---|---|---|---|
| Pillow 12.3.0 | sehr hoch für deterministische Frames | aktuelle Security-Fixes; untrusted image parsing als bekannte Angriffsfläche | permissive PIL/MIT-CMU-artig | niedrig, Python Sidecar | niedrig | **verwenden, exakt pinnen** |
| FFmpeg | sehr hoch für Video-Assembly/Probe | sehr aktiv; aktueller 9.x Release-Track | LGPLv2.1+; Build kann GPL/nonfree werden | niedrig als CLI | niedrig, Buildprofil muss kontrolliert werden | **verwenden mit Buildconf-Gate** |
| Poppler CLI | sehr hoch für bestehende PDF-Rasterung | bereits im PDF-Tooling verwendet | system-/distribution-managed | sehr niedrig | niedrig | **wiederverwenden** |
| Sharp | hoch für Node Images | aktiv; libvips Security-Fixes relevant | Apache-2.0 | mittel wegen nativer Node/libvips-Dependency | niedrig-mittel | nicht in diesem Slice |
| MoneyPrinterTurbo | hoch für komplette Short-Video-Automation | aktiv; breite Provider-/LLM-/TTS-Oberfläche | MIT | hoch; dupliziert Content-/Provider-Funktionen | mittel | nur möglicher späterer isolierter Adapter |
| Remotion | hoch für React-Video-Templates | aktiv | spezielle kommerzielle Lizenzbedingungen | mittel-hoch | Lizenz-/Automations-Lock-in | nicht Baseline |
| ImageMagick | hoch allgemein | mächtig, große Decoder-/Policy-Oberfläche | Open Source | mittel; Policy-Hardening nötig | niedrig | Pillow ist engerer Fit |

## Gewähltes Zielbild

`Design Tokens -> Pillow Frames -> SHA/Manifest -> optional FFmpeg Short`

und für PDFs:

`Local PDF -> Poppler page raster -> Pillow companion frames/cards -> SHA/Manifest -> optional FFmpeg Short`

Der Output wird **nicht** automatisch veröffentlicht. Das Manifest hält `publishReady=false`; bestehende Media-URL-Validierung und Human-Approval bleiben vor Publishing maßgeblich.

## Security Controls

- keine HTTP-/HTTPS-Eingabe in Renderer-Manifests;
- maximal 8 Content-Szenen / 60 Sekunden;
- maximal 5 PDF-Seiten im Companion-Bundle;
- Textlängen begrenzt;
- lokale Dateien und Renderer-eigene Frames;
- `shell=False`, argv-basierte subprocess-Aufrufe, Timeouts;
- `--enable-nonfree` FFmpeg: DENY;
- `--enable-gpl` FFmpeg: DENY by default;
- Developer-GPL-Override wird im Manifest sichtbar;
- alle Assets SHA-256;
- Source-PDF SHA-256;
- keine OAuth-/Supabase-/Stripe-/Render-/GitHub-Credentials;
- keine Publishing-Capability.

## Lokale Pre-PR Evidence

Umgebung der lokalen Smoke-Validierung:

- Python 3.13.5;
- Pillow 12.3.0;
- Poppler `pdftoppm` 25.06.0;
- lokales FFmpeg 7.1.5 Debian Build.

Wichtig: Der lokale FFmpeg-Build enthält `--enable-gpl` und ist **kein** akzeptierter Produktions-/Distributionsnachweis. Der neue Guard verweigert ihn ohne expliziten Developer-Override.

### Ergebnisse

- Python `py_compile`: **PASS** für alle drei neuen Python-Module;
- statischer Source-/Manifest-Contract-Smoke: **PASS**;
- generischer Image-Render: **PASS**, 7 Assets inkl. Manifest;
- Graham Image-Render: **PASS**, 9 Assets inkl. Manifest;
- FFmpeg ohne Override: **PASS als negativer Test**, Exit 2 mit `gpl-build-detected`-DENY;
- Developer-Video-Smoke mit explizitem Override: **PASS**, MP4 `1080x1920`, Codec `mpeg4`, 18.0 s;
- PDF Companion Image-Smoke auf lokalem 3-Seiten-PDF: **PASS**, 6 Assets;
- PDF Companion Developer-Video-Smoke: **PASS**, 7 Assets inkl. MP4;
- Manifest enthält Source-PDF SHA, Asset-SHAs, Dimensionen, Dauer, FFmpeg-Profil und `publishReady=false`.

Diese Developer-Smokes ersetzen keine spätere Repository-CI und keine FFmpeg-Lizenzfreigabe des produktiven Betriebsartefakts.

## Finaler Pre-PR Main-/Parallel-PR-Abgleich

- `main`: `59a2755de53297a934b062b380a313d68cd47492`;
- Merge-Base exakt current main; Branch `behind=0`;
- effektiver Scope: 12 Dateien;
- PR #439: 0 direkter Dateioverlap; README/`package.json` werden bewusst nicht geändert;
- PR #442: 0 direkter Dateioverlap; Document Registry wird bewusst nicht geändert;
- keine Supabase-/Stripe-/Render-/Workflow-/Runtime-Produktionsmutation.

## Vorher / Nachher

| Bereich | Vorher | Nach Implementierung |
|---|---|---|
| PDF Social Preview | manueller/kein kanonischer Pfad | deterministischer PDF Companion Export |
| PDF -> Short | kein Pfad | lokale PDF-Seiten -> 9:16 Frames -> optional MP4 |
| Content Thumbnail | Prompt/Handarbeit | deterministische 1280x720 Ausgabe |
| Square/Vertical Image | keine kanonische Ausgabe | 1080x1080 + 1080x1920 |
| Short Video Renderer | WP-N3 offen | Pillow Frames + FFmpeg Adapter |
| Renderer-Netzwerk | nicht definiert | kein Netzwerk erlaubt |
| Asset Provenance | Dateiname/Checkliste | SHA-256 + technische Manifestdaten |
| Publishing State | separates Social Gate | Manifest erzwingt `publishReady=false` |
| FFmpeg Licensing | nicht kontrolliert | Buildconf fail-closed Gate |

## Residual Gaps

- TTS/Voiceover bleibt separater WP-N3-Folgeschritt;
- produktiver FFmpeg-Build muss als LGPL-kompatibles Artefakt festgelegt/verifiziert werden;
- Web-/UI-Wiring für „Render Asset“ ist nicht Teil dieses ersten isolierten Slices;
- generative Hintergrundbilder sind optionaler Provider-Scope und dürfen brandkritischen Text nicht rendern;
- formal verifizierte PDF/UA-Eigenschaften bleiben ausschließlich beim PDF-Renderer-/Validatorpfad;
- Repository-CI/Governance wird erst nach PR-Erstellung ausgeführt und danach hier bzw. im PR dokumentiert.
