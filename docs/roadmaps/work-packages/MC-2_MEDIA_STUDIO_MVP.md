# MC-2 — Media Studio MVP

- **Status:** IMPLEMENTATION COMPLETE / PRE-PR VALIDATION
- **Date:** 2026-08-20
- **Owner:** CAPITAL-AI Owner
- **Authority:** Owner-/Chat-Priorität 2026-08-20 + ADR-0098 + `docs/frontend/FRONTEND_ARCH.md` + MC-1
- **Scope:** browser-based draft editing of `MediaProjectV2`; no renderer/publisher/storage/provider mutation

## Ziel

MC-2 setzt auf dem mit PR #461 gemergten `MediaProjectV2` auf und liefert ein erstes visuelles Media Creation Studio für CAPITAL-AI. Das Studio ist eine Presentation-/Interaction-Projektion des bestehenden Platform-Contracts und besitzt keine eigene Publishing-, OAuth-, Asset-Trust- oder Financial-Authority.

## Umgesetzter Scope

### P0 — Validierter Editing-Core

- reine, non-destructive MediaProject-Editing-Funktionen unter `src/platform/SocialMediaEngine/Editing/`;
- Canvas-Presets `16:9`, `1:1`, `9:16`;
- framegenaues Move/Resize;
- Layer Enable/Disable;
- deterministisches Text Editing für Scene/Text/Caption;
- jede Mutation läuft durch `validateMediaProjectV2()`;
- ungültige Änderungen werden als strukturierte Validation Errors zurückgegeben;
- keine direkte Mutation des Eingabeprojekts.

### P0 — Deterministisches CAPITAL-AI Draft Template

- 30 fps, 30 Sekunden Default-Dauer;
- CAPITAL-AI-Kicker und institutionelle Dark/Gold/Cyan/Purple Preview;
- `networkPolicy: offline`;
- `brandTextMode: deterministic`;
- `publishReady: false`;
- Human-Approval-Disclaimer im Default-Projekt.

### P0 — Media Studio UI

Kanonischer Pfad:

`src/features/social/ui/MediaStudio/`

Bestandteile:

- Preview;
- Timeline mit Tracks/Layers;
- Playhead;
- Zoom;
- Inspector;
- Start-/Duration-Editing;
- Frame-/Sekunden-Nudge;
- Layer Resize;
- Text-/Disclaimer-Editing;
- Undo/Redo mit bounded History;
- 16:9 / 1:1 / 9:16 Canvas-Wechsel;
- clientseitiger JSON Import/Export;
- semantisches Validation Panel.

### P0 — Route / Access Boundary

- authentifizierte Route `/media-studio` über die bestehende BB-1 `AppRoutes`-Composition;
- keine neue Routing-Library;
- kein Eingriff in den Legacy-`Dashboard.tsx`-Monolithen vor BB-2;
- zusätzlicher fail-closed `SocialMediaGeneratorService.checkAccess()`-Gate;
- bestehende Owner-/Founder-Entitlement-Authority wird konsumiert, nicht neu definiert.

### P0 — Accessibility

- Timeline-Layer sind fokussierbare Buttons;
- Playhead ist ein nativer Range-Control;
- jede zeitliche Änderung besitzt Input-/Button-Alternativen;
- Move/Resize ist nicht auf Dragging angewiesen;
- vorhandene Shared Focus-/Touch-Target-Primitives werden wiederverwendet;
- Space steuert Preview Play/Pause; Ctrl/Cmd+Z und Ctrl/Cmd+Y bedienen History außerhalb von Textfeldern.

### P0 — Import-Security

- Import ausschließlich lokale JSON-Dateien;
- maximale Importgröße: 1.000.000 Bytes;
- JSON wird vor Übernahme vollständig durch `validateMediaProjectV2()` geprüft;
- bestehende ADR-0098-Regeln blockieren URI-Schemata, absolute Pfade, Traversal, invaliden Graphen und `publishReady=true`;
- keine Remote-URL wird durch MC-2 geladen oder als vertrauenswürdig hochgestuft.

## Architekturentscheidung

Keine neue ADR wird für MC-2 angelegt. MC-2 führt bereits bestehende Authorities aus:

1. **ADR-0098** definiert `MediaProjectV2`, Timeline-/Track-/Layer-Invarianten, Validation und fehlende Publish-Authority.
2. **FRONTEND_ARCH** verlangt neue fachliche UI unter `src/features/<domain>/ui` und `Projection, not Redefinition`.
3. **ADR-0020/0021** bleiben Authority für Social OAuth/Publishing/Access.

Eine neue ADR wäre in diesem Slice eine konkurrierende bzw. redundante Authority. Ein neues ADR wird erst erforderlich, wenn MC-3/folgende Slices neue Rendering-, Provider-, Worker-, Asset-Registry- oder andere technische Trust-Boundaries einführen.

## Open-Source-/Make-or-Buy-Abgleich

Geprüft wurden Timeline-/Video-Editor-Ansätze und die bereits in MC-1 bewerteten Editorial-Modelle.

- **OpenTimelineIO:** weiterhin sinnvoll als Interchange-/Referenzmodell, aber kein React-Editor und keine notwendige Runtime-Dependency.
- **React Timeline Editor Libraries:** funktional möglich, würden jedoch ein zweites Zeit-/Action-Domainmodell neben `MediaProjectV2` einführen und zusätzliche Adapter-/A11y-/React-19-Abhängigkeiten erzeugen.
- **Remotion-/DesignCombo-basierte Stacks:** für MC-2 nicht gewählt; zusätzliche Lizenz-/Runtime-/Lock-in-Entscheidung ohne Nutzen für den rein browserseitigen Draft-Editor.

Daher wird in MC-2 ein dünner eigener UI-Layer auf dem **bereits eigenen** Domain-Contract umgesetzt; Rendering-/Codec-Eigenentwicklung findet nicht statt.

## Nicht im Scope

- finaler Video-Render aus MediaProject v2;
- FFmpeg-Worker-Orchestrierung;
- Asset Registry;
- Supabase-/Storage-Persistenz;
- TTS/SSML/Audio-Provider;
- generative Bild-/Video-Provider;
- C2PA;
- automatisches Publishing;
- neue OAuth-Scopes;
- neue npm/native Dependencies;
- BB-2 Dashboard-Zerlegung.

## Parallel-PR-Korrelation

Zum Implementierungsstart ist PR #463 offen und verändert Frontend-Governance sowie ADR-/Authority-/Document-Registries. MC-2 verändert bewusst **keine Registry-Datei und keine Frontend-Authority**. Vor PR-Erstellung wird #463 erneut geprüft. Falls #463 vorher merged, wird MC-2 mit dessen `main`-Stand synchronisiert und semantisch revalidiert.

## Definition of Done

- [x] Branch vom nach PR #461 aktuellen `main` erstellt.
- [x] `MediaProjectV2`-Editing-Core implementiert.
- [x] Default CAPITAL-AI Draft Template validiert.
- [x] Preview, Timeline, Inspector, Validation und History implementiert.
- [x] Multi-Aspect Preview 16:9 / 1:1 / 9:16 implementiert.
- [x] JSON Import/Export implementiert.
- [x] Import fail-closed und größenbegrenzt.
- [x] Route `/media-studio` innerhalb BB-1 Composition integriert.
- [x] Owner-/Founder-Access-Gate wiederverwendet.
- [x] keine neue Runtime-/Dependency-/Workflow-/Provider-/Storage-/Publishing-Mutation.
- [x] Unit Tests für Factory, Canvas, Text, Bounds und negative Edits ergänzt.
- [x] gezielter TypeScript-Precheck durchgeführt.
- [ ] finalen Main-/Parallel-PR-Sync unmittelbar vor PR durchführen.
- [ ] Hosted Governance/CI nach PR ausführen.
- [ ] Human-/Owner-Merge.

## Nächster Roadmap-Schritt nach Human Merge

**MC-3 Motion Engine 2.0**: keyframes/easing/transitions, wiederverwendbare CAPITAL-AI-Motion-Primitives, Network/Intelligence-Paths, Data/Chart Motion und deterministische Render-Bridge. MC-3 erhält einen separaten Branch und einen erneuten Make-or-Buy-/Lizenz-/Renderer-Abgleich.
