# CAPITAL-AI App Composition Layer

`src/app/` ist die Composition-Schicht des React-Clients.

## Verantwortung

- Application Shell, Navigation, Routing und globale Provider komponieren.
- Feature-Slices aus `src/features/*/ui` zusammenführen.
- Fachneutrale UI-Bausteine ausschließlich aus `src/shared/*` beziehen.
- Keine Scoring-, Markt-, Billing-, Compliance- oder Persistenzlogik implementieren.

## Dependency Rule

```text
main.tsx -> app -> features -> shared
                     |
                     +-> bestehende Services / Platform / API
```

`shared` darf niemals von `features` oder `app` abhängen. `features` dürfen nicht von `app` abhängen.

`src/App.tsx` bleibt während der schrittweisen Migration der bestehende Composition Root. Neue Composition-Helfer werden unter `src/app/` angelegt und anschließend kontrolliert aus `App.tsx` bzw. `main.tsx` konsumiert.
