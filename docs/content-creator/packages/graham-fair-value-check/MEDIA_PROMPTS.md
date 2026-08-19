# Media-Prompts & Produktionsanweisungen

## 1. Kanonischer deterministischer Renderer

Für brandkritische CAPITAL-AI Medien ist der primäre Pfad jetzt der repository-interne Open-Source-Renderer aus ADR-0094:

```bash
python3 -m pip install -r scripts/media/requirements-content-media.txt
python3 scripts/media/render_content_assets.py \
  --manifest docs/content-creator/packages/graham-fair-value-check/MEDIA_RENDER_MANIFEST.json \
  --out-dir /tmp/capital-ai-graham-media
```

Er erzeugt reproduzierbar:

- 1280x720 Thumbnail,
- 1080x1080 Social Card,
- 1080x1920 Vertical Cover,
- 1080x1920 Szenenframes,
- Asset-Manifest mit SHA-256 und `publishReady=false`.

Brandfarben und Texte werden deterministisch aus CAPITAL-AI Design-Tokens/Manifest gerendert. Ein generatives Bildmodell darf brandkritische Texte, Formeln, Scores oder Disclaimer nicht ersetzen.

---

## 2. Optionaler generativer Hintergrund-Prompt

Ein FLUX-kompatibles oder vergleichbares Open-Source-Bildmodell kann später **nur als optionaler Hintergrund-/Illustrationsprovider** hinter der Media-Provider-Boundary genutzt werden. Text-/Zahlen-Overlay bleibt deterministisch.

**Prompt:**

```text
Clean professional financial abstract background, CAPITAL-AI dark charcoal canvas, subtle cyan, purple and soft gold network accents, minimal mathematical geometry, no words, no letters, no numbers, no people, no stock photos, no fake charts, precise institutional fintech aesthetic, high contrast, 16:9
```

Kein generativer Output darf als Finanzdaten-Evidence behandelt werden.

---

## 3. Short-Video (45-60 s) - TikTok / Reels / YouTube Shorts

Das ausführbare Storyboard liegt in `MEDIA_RENDER_MANIFEST.json` und bleibt innerhalb von 60 Sekunden.

| Zeit | Bild / Aktion | Text-Overlay | Voiceover (optional) |
|------|---------------|--------------|----------------------|
| 0-4 s | CAPITAL-AI Brand Frame | Graham Fair Value Check | „Wie CAPITAL-AI den Graham Fair Value berechnet - ohne Hype.“ |
| 4-12 s | Drei Bausteine | Earnings Power / Buchwert / Sicherheitsmarge | „Drei Kernbausteine: Earnings Power, Buchwert und Sicherheitsmarge.“ |
| 12-21 s | Methodik | Multiplikatoren + Risikoadjustierung | „Kombiniert mit historischen und sektoralen Multiplikatoren sowie einer Risikoadjustierung.“ |
| 21-30 s | Ergebnis lesen | Fair-Value-Bereich + Confidence | „Ergebnis: Fair-Value-Bereich und Confidence-Metrik.“ |
| 30-39 s | Sicherheitsmarge | mathematische Relation, kein Signal | „So wird das Ergebnis gelesen - rein mathematisch.“ |
| 39-46 s | End Card | Keine Prognose. Keine Anlageberatung. | „Keine Prognose. Keine Anlageberatung.“ |

**Format:** 1080x1920 (9:16)  
**Dateiname:** `graham-fair-value-check-short-1080x1920.mp4`

Video-Rendering:

```bash
python3 scripts/media/render_content_assets.py \
  --manifest docs/content-creator/packages/graham-fair-value-check/MEDIA_RENDER_MANIFEST.json \
  --out-dir /tmp/capital-ai-graham-media \
  --video
```

Der FFmpeg-Build wird vor Ausführung auf GPL/nonfree-Compile-Flags geprüft. Details: `docs/runbooks/OPEN_SOURCE_MEDIA_RENDERING.md`.

**Voiceover Short (optional / noch kein TTS-Provider in diesem Slice):**  
„Wie CAPITAL-AI den Graham Fair Value berechnet - ohne Hype. Drei Kernbausteine: Earnings Power, Buchwert und Sicherheitsmarge. Diese werden mit historischen und sektoralen Multiplikatoren sowie einer Risikoadjustierung kombiniert. Das Ergebnis ist ein numerischer Fair-Value-Bereich und eine Confidence-Metrik. So wird das Ergebnis gelesen - rein mathematisch. Keine Prognose. Keine Anlageberatung. Nur Mathematik und belegbare Daten.“

---

## 3a. Premium Brand Film - Graham + Buffett Value Intelligence (45 s / 16:9)

Der Premium-Film ist ein **deterministischer Silent-Master** für Website, Präsentation und kontrollierte Brand-Ausspielung. Er verwendet keine generativen Finanzdaten, keine Remote-Medien und keinen TTS-Provider.

Kanonisches Manifest:

`PREMIUM_BRAND_FILM_MANIFEST.json`

Headline-Sequenz:

`DATA -> EVIDENCE -> MODELS -> RISK -> INTELLIGENCE`

Der `MODELS`-Abschnitt visualisiert neun unabhängig geprüfte Graham-/Buffett-orientierte Value-Dimensionen:

- Intrinsic Value
- Margin of Safety
- Earnings Quality
- Balance-Sheet Strength
- Free Cash Flow
- Capital Efficiency
- Debt Resilience
- Economic Moat
- Valuation Discipline

Traceability wird als `SOURCE -> METRIC -> CHECK -> MODEL -> SCORE` visualisiert. Die finale Aussage ist fest auf:

`CAPITAL-AI`  
`QUANTITATIVE INTELLIGENCE FOR COMPLEX MARKETS`

Rendering:

```bash
python3 scripts/media/render_cinematic_brand_film.py \
  --manifest docs/content-creator/packages/graham-fair-value-check/PREMIUM_BRAND_FILM_MANIFEST.json \
  --output /tmp/CAPITAL-AI_Graham_Buffett_Premium_Brand_Film_45s.mp4
```

Output-Contract:

- 1920x1080 (16:9)
- 24 fps
- exakt 45 Sekunden
- keine Audio-/TTS-Spur
- SHA-256-Asset-Manifest
- `publishReady=false`
- vorhandenes FFmpeg-Lizenzprofil aus ADR-0094 bleibt fail-closed

Wenn der lokale Developer-FFmpeg-Build `--enable-gpl` enthält, darf `--allow-gpl-ffmpeg` ausschließlich für einen visuellen lokalen Smoke verwendet werden. Vor externer Veröffentlichung ist ein erneuter Render mit geprüftem LGPL-kompatiblem Build erforderlich.

---

## 4. Produktions-Checkliste

- [ ] Keine echten Kursdaten oder Ticker ohne freigegebene Evidence
- [ ] Keine Gewinnversprechen oder Zukunftsaussagen
- [ ] Disclaimer mindestens am Anfang + Ende sichtbar
- [ ] Schriftgröße mobil lesbar
- [ ] Renderer-Manifest vorhanden
- [ ] alle finalen Assets SHA-256-gehasht
- [ ] `publishReady=false` bleibt bis SocialMediaEngine Validation + Human Approval
- [ ] kein `--enable-nonfree` FFmpeg-Build
- [ ] produktiver FFmpeg-Build separat lizenz-/security-geprüft
