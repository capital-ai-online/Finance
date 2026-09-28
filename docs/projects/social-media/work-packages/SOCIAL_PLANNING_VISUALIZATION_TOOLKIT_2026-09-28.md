# SOCIAL-P4 — Planning Visualization Toolkit

**Status:** IMPLEMENTIERT AUF BRANCH / HUMAN-MERGE ERFORDERLICH  
**Datum:** 2026-09-28  
**Project:** CAPITAL-AI-SOCIAL  
**Issue:** #1475  
**Authority:** Fresh Human/Owner direction + `/AGENTS.md@CURRENT_MAIN`  
**Baseline:** `main@14677ea3acc5316e025d784c7dc35d3a6b2dfe1a`

## Ziel

Die bestehende SocialMediaEngine erhält einen untergeordneten, deterministischen Eingabevertrag für grafische Planungen, Roadmaps, Dependency-Maps und Prozesskarten. Der Slice erzeugt keine zweite Publishing-, Brand-, Roadmap- oder Task-State-Authority.

`PlanningVisualSpec → D3PlanningVisualAdapter → MediaProjectV2`

Damit kann dieselbe semantische Planung später in Social-Formate wie 1:1, 4:5 und 16:9 projiziert werden, ohne produktive Roadmap-Zustände oder Kalenderdaten zu erfinden.

## OSS-Abgleich

| Tool | Lizenz | Repo-Zustand | Geeignet für | Entscheidung dieses Slices |
|---|---|---|---|---|
| D3 | ISC | bereits direkte Dependency `d3 ^7.9.0` | deterministische Geometrie, Dependency-/Prozess-Maps, eigener SVG-/Media-Renderer | **aktiv konsumiert** |
| Mermaid | MIT | nicht installiert | Diagramme-as-Code, Flowchart, Gantt, Git Graph, Mindmap, Timeline, Sankey | Kandidat; Dependency-/Lockfile-Gate erforderlich |
| React Flow / @xyflow/react | MIT | nicht installiert | interaktive Node-/Edge-Maps, Pan/Zoom/Drag | Kandidat für interaktive Web-Projektion; Dependency-Gate erforderlich |
| Frappe Gantt | MIT | nicht installiert | klassische Gantt-Pläne mit echten Start-/Enddaten | nicht für date-less Work-State verwenden |
| vis-timeline | MIT / Apache-2.0 | nicht installiert | interaktive Zeitachsen mit echten Zeitdaten | nur bei evidence-backed Zeitbereichen |

Upstream-Identitäten sind zusätzlich maschinenlesbar in `PlanningVisualToolCatalog.ts` festgehalten.

## Sicherheits- und Authority-Entscheidung

- keine CDN-/Remote-Scripts;
- kein Runtime-Netzwerkzugriff: `networkPolicy=offline`;
- `publishReady=false` bleibt unveränderliche Draft-Grenze;
- Evidence-Quellen müssen opaque oder repository-relativ sein; URL-Schemata, absolute Pfade und Traversal werden abgelehnt;
- Mermaid/React Flow/Frappe/vis werden nicht still als neue npm-Abhängigkeiten eingeführt;
- D3 wird wiederverwendet, weil es bereits im kanonischen `package.json`/Lockfile-Pfad liegt;
- MediaProjectV2 bleibt der kanonische Social-Render-/Editing-Vertrag.

## Umgesetzter Vertrag

### PlanningVisualSpec

Enthält:

- Visual-Art: Roadmap / Dependency Map / Process Map;
- Lanes;
- Nodes;
- Edges;
- optionale Statuswerte `active | live | pending | held | done`;
- Evidence-Quelle und optionale CURRENT_MAIN-SHA;
- Render-Profil;
- Aspect Ratio `16:9 | 4:5 | 1:1`;
- kanonische Brand-Token-Referenz;
- Offline-/No-Publish-Grenze.

### D3-Adapter

- verwendet ausschließlich `scalePoint` aus der bestehenden D3-Dependency;
- sortiert Lanes und Knoten deterministisch;
- benötigt keine Kalenderdaten;
- erzeugt Canvas-Geometrie für 1920×1080, 1080×1350 und 1080×1080;
- erzeugt deterministische Edge-Koordinaten aus der Node-Geometrie.

### MediaProjectV2-Adapter

- bindet Spec und Geometrie als maschinenlesbare Metadata an eine gültige `MediaProjectV2`-Draft-Szene;
- Renderer-Profil: `planning-visual-d3-v1`;
- Brand-Quelle: `docs/frontend/design-tokens.json`;
- kein Asset-/Storage-/Provider-Zugriff;
- keine Publish-Authority.

## Nicht im Scope

- produktive Roadmap-Task-State-Authority;
- GitHub Branch-Readback;
- Public/Frontend Renderer;
- automatische Veröffentlichung;
- Provider-OAuth;
- neue npm/native Dependencies;
- Gantt-Termine ohne echte Start-/End-Evidence;
- Render-/Deploy-Mutation.

## Exit Evidence

- [x] bounded `PlanningVisualSpec`;
- [x] fail-closed Input Validation;
- [x] deterministisches D3-Layout;
- [x] MediaProjectV2-Adapter;
- [x] OSS-Tool-Catalog;
- [x] fokussierter Test im Branch ergänzt;
- [ ] Exact-Head CI / Governance / Security durch Repository-Checks;
- [ ] Human/CODEOWNER Merge;
- [ ] Post-Merge Claim freigeben und Roadmap auf DONE_MAIN korrelieren.

## Nachfolgende optionale Slices

1. Mermaid nur nach separater Supply-Chain-/Lockfile-Validierung als serverseitiger SVG-Diagrammrenderer aktivieren.
2. React Flow nur für eine owner-korrekte interaktive FE-Projektion nutzen; Social bleibt Contract-/Render-Owner.
3. Ein SVG-/PNG-Export-Worker darf erst nach Renderer-/Asset-Authority-Korrelation aktiviert werden.
