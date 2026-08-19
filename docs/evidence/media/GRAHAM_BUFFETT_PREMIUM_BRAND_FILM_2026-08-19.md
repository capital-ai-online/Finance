# Evidence - Graham + Buffett Premium Brand Film

- **Datum:** 2026-08-19
- **Branch:** `agent/graham-buffett-premium-brand-film`
- **Authority:** Owner-/Chat-Priorität 2026-08-19 + ADR-0094 v1.1 Amendment
- **Scope:** deterministischer 45-s-Brandfilm, 16:9, Graham/Buffett Value Checks, Risk, Multi-Asset Intelligence, Traceability

## Ziel

Aus dem bestehenden CAPITAL-AI Open-Source-Media-Renderer einen additiven 16:9-Cinematic-Pfad ableiten, ohne neue Publishing-, Netzwerk-, Daten- oder Credential-Authority einzuführen.

## Reuse / Architektur

- Brand-Gold, Cyan und Purple werden weiterhin über `load_brand_palette()` aus `docs/frontend/design-tokens.json` bezogen.
- FFmpeg-Lizenzprüfung wird über die vorhandenen ADR-0094-Helfer `inspect_ffmpeg()` und `enforce_ffmpeg_license_profile()` wiederverwendet.
- Pillow erzeugt deterministische Motion-Graphics-Keyframes; FFmpeg übernimmt Interpolation, Scaling und MP4-Encoding.
- Keine Remote-Media-URLs, keine Ticker/Kurswerte, kein TTS, kein generativer Finanzdaten-Content.
- Output bleibt `publishReady=false` und benötigt die bestehende SocialMediaEngine Asset-Validation + hash-gebundene Human-Freigabe.

## Inhaltlicher Contract

Headline-Sequenz:

1. `DATA`
2. `EVIDENCE`
3. `MODELS`
4. `RISK`
5. `INTELLIGENCE`

Value-Checks im `MODELS`-Abschnitt:

- Intrinsic Value
- Margin of Safety
- Earnings Quality
- Balance-Sheet Strength
- Free Cash Flow
- Capital Efficiency
- Debt Resilience
- Economic Moat
- Valuation Discipline

Traceability wird deterministisch als `SOURCE -> METRIC -> CHECK -> MODEL -> SCORE` visualisiert.

Finale Aussage:

`CAPITAL-AI`  
`QUANTITATIVE INTELLIGENCE FOR COMPLEX MARKETS`

## Lokale Validierung

- Python Compile-Smoke: **PASS**
- Manifest-Schema / 45-s-Timeline / 8 Szenen: **PASS**
- Headline-Sequenz / 9 Value-Checks / finales Brand-Statement: **PASS**
- Output-Dimension: **1920x1080**
- Output-Framerate: **24 fps**
- Output-Dauer: **45.000 s**
- Audio: **keiner** (bewusster Silent-Master; TTS bleibt außerhalb des Scopes)
- SHA-256 des lokalen Dev-Smoke-Masters: `0640d485ac7639fd0b3773b07ee6cdbf3ab425cc6b1ded53901395b6d47c3b13`
- Visual QA: radialer Value-Check-Frame nach erstem Review korrigiert; keine Textkollisionen im finalen Preview-Frame.

## FFmpeg License Gate

Die lokale Ausführungsumgebung meldet `--enable-gpl`. Der normale Produktionspfad verweigert diesen Build entsprechend ADR-0094. Für den lokalen visuellen Smoke wurde ausschließlich der explizite Developer-Override genutzt.

Daher gilt für den hier dokumentierten Master:

- `developerSmokeOnly=true`
- `publishReady=false`
- **vor externer Veröffentlichung/Distribution erneut mit geprüftem LGPL-kompatiblem FFmpeg-Build rendern**.

Ein `--enable-nonfree`-Build bleibt immer DENY.
