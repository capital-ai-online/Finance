# CAPITAL-AI Shared Frontend

`src/shared/` enthält ausschließlich fachneutrale, wiederverwendbare Frontend-Bausteine.

```text
shared/
├── ui/        Design-Primitives und Status-/Feedback-Bausteine
├── branding/  kanonische CAPITAL-AI Markenkomponenten
└── visuals/   rein dekorative bzw. wiederverwendbare Visual-Layer
```

## Dependency Rule

`shared` darf auf technische Basisdienste wie Branding-/Version-Projektionen unter `src/platform` zugreifen, aber **nicht** auf `src/features`, `src/app` oder Legacy-Feature-Komponenten unter `src/components`.

Fachliche Cards, Screenings, Scorings oder Admin-Flächen sind keine Shared-Komponenten und verbleiben in ihrem Feature-Slice.
