# Runbook — CAPITAL-AI Media Studio MVP

## Zweck

Das Media Studio ist der browserseitige Draft-Editor für `MediaProjectV2`. Es dient zur visuellen Vorbereitung und Validierung von Media-Projekten. Es rendert kein finales Video, lädt keine externen Assets und veröffentlicht nichts.

## Zugriff

Route:

`/media-studio`

Voraussetzungen:

1. aktive authentifizierte CAPITAL-AI Session;
2. bestehender Social-Media-Access-Gate (`Owner` oder `Founder` gemäß bestehender Authority);
3. erfolgreicher `SocialMediaGeneratorService.checkAccess()`.

Bei nicht verifizierbarem Zugriff bleibt die UI fail-closed.

## Bedienung

### Preview

Die Preview zeigt die am aktuellen Playhead aktiven Scene-, Text- und Caption-Layer. Sie ist eine deterministic DOM/CSS-Vorschau und nicht identisch mit einem späteren finalen Renderer.

### Timeline

- Playhead über Range-Control bewegen;
- Layer per Button auswählen;
- Timeline-Zoom über `-` / `+` Buttons;
- Layerposition/-dauer im Inspector ändern.

### Inspector

Für den ausgewählten Layer:

- Start Frame;
- Duration Frames;
- Enable/Disable;
- Move `±1 Frame` / `±1 Sekunde`;
- Resize `±1 Sekunde`;
- bei Scene/Text/Caption: deterministische Textfelder.

Ungültige Änderungen werden nicht übernommen. Das Validation Panel zeigt den DENY-Grund.

### History

- Undo: `Ctrl/Cmd + Z`;
- Redo: `Ctrl/Cmd + Y` oder `Ctrl/Cmd + Shift + Z`;
- Preview Play/Pause: `Space`, sofern kein Textfeld fokussiert ist;
- History ist auf 50 Projektstände begrenzt.

### Canvas

Unterstützte Presets:

- `16:9` → 1920×1080;
- `1:1` → 1080×1080;
- `9:16` → 1080×1920.

Die Umschaltung verändert nur den Canvas-Contract; sie erzeugt keine finalen Render-Assets.

## JSON Import

1. `Import JSON` wählen;
2. lokale `.json`-Datei auswählen;
3. Dateigröße muss <= 1.000.000 Bytes sein;
4. JSON muss `MediaProjectV2` semantisch bestehen.

Der Import wird unter anderem abgelehnt bei:

- falscher Schema-Version;
- `publishReady=true`;
- URI-/Remote-Referenzen;
- absoluten oder Traversal-Pfaden;
- invaliden IDs/Referenzen;
- Track-/Layer-Mismatch;
- Timeline Overlap;
- Layern außerhalb der Projektdauer;
- invaliden Transition-Graphen;
- nichtdeterministischen Brand-/Chart-Regeln.

## JSON Export

`Export JSON` exportiert nur ein aktuell gültiges Projekt. Vor dem Download wird `validateMediaProjectV2()` erneut ausgeführt.

Der Export ist **kein Approval und kein Publish-Artefakt**. `renderRecipe.publishReady` bleibt `false`.

## Security / Trust Boundary

MC-2 führt keine neue Network-/Storage-/Provider-Trust-Boundary ein:

- kein `fetch()` für Medien;
- kein Upload;
- keine beliebige Remote-URL;
- kein OAuth-/Token-Zugriff zusätzlich zum bestehenden Access-Gate;
- keine Supabase-/Storage-Mutation;
- kein Render-Worker;
- kein Social Publish.

Die bestehende SocialMediaEngine bleibt alleinige Authority für OAuth und Publishing.

## Accessibility

Die Timeline benötigt keine Drag-Geste. Alle zeitlichen Mutationen sind mit Eingabefeldern und Buttons erreichbar. Der Playhead verwendet ein natives Range-Control. Fokuszustände stammen aus den Shared-Primitives / globalen Frontend-Regeln.

## Troubleshooting

### `ACCESS DENIED`

Bestehenden Social-Media-Access-/Owner-/Founder-Status prüfen. MC-2 darf den Server-DENY nicht lokal überschreiben.

### `DRAFT INVALID`

Validation Panel lesen. Der Editor übernimmt invalidierende Edits nicht; bei importierten Dateien werden Fehler vor Projektübernahme angezeigt.

### Import rejected: invalid JSON

Datei außerhalb des Studios prüfen; nur valides JSON ohne Kommentare wird akzeptiert.

### Import rejected by MediaProject v2 validation

Die Datei gegen `src/platform/SocialMediaEngine/Contracts/media-project-v2.schema.json` und `validateMediaProjectV2()` prüfen.

## Rollback

Repository-only: Human-gated Revert des MC-2-PR. Keine Datenbank-, Storage-, Provider-, OAuth-, Deployment- oder Publishing-Rücksetzung erforderlich.
