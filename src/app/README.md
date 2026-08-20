# CAPITAL-AI App Composition Layer

`src/app/` ist die kanonische Composition-Schicht des React-Clients.

## Verantwortung

- Application Composition, Routing und globale Session-/Provider-Komposition zusammenführen.
- Feature-Slices aus `src/features/*/ui` konsumieren.
- Fachneutrale UI-Bausteine ausschließlich aus `src/shared/*` beziehen.
- Keine Scoring-, Markt-, Billing-, Compliance- oder Persistenz-Authority implementieren.
- Bestehende IAM-/AuthN-/AuthZ-/MFA-/Onboarding-Regeln nur komponieren; ihre fachliche Semantik wird nicht in `src/app` neu definiert.

## BB-1 Struktur

```text
src/app/
├── App.tsx                         # kanonischer Application Composition Root
├── AppShell.tsx                    # fachneutraler Shell-Baustein
├── auth/
│   └── SessionComposition.tsx      # Session/Auth-Lifecycle + bestehende Security Gates
├── routing/
│   └── AppRoutes.tsx               # öffentliche Pfade + Dashboard/Landing Composition
├── types/
│   └── UserSession.ts              # gemeinsamer Session-Vertrag der Presentation-Schicht
├── index.ts
└── README.md
```

`providers/` wird erst angelegt, wenn ein konkreter globaler Provider aus dem bestehenden Composition Root extrahiert wird. Leere Architekturordner werden nicht als Scheinimplementierung erzeugt.

## Dependency Rule

```text
main.tsx -> src/App.tsx compatibility facade -> app -> features -> shared
                                                    |
                                                    +-> bestehende Services / Platform / API
```

`shared` darf niemals von `features` oder `app` abhängen. `features` dürfen nicht von `app` abhängen.

## Compatibility Boundary

`src/App.tsx` ist seit BB-1 **nicht mehr der produktive Composition-Implementierungsort**. Die Datei bleibt während der Strangler-Migration nur als dünne Compatibility-Fassade bestehen:

```ts
export { default } from './app/App';
export type { SubscriptionTier, UserSession } from './app/types/UserSession';
```

Dadurch bleibt `src/main.tsx` sowie bestehender Legacy-Type-Importcode kompatibel, während neue Composition-Logik ausschließlich unter `src/app/` entsteht.

## BB-1 Verantwortungsgrenzen

- `App.tsx`: komponiert Session und Routing, enthält keine Feature- oder Auth-Implementierung.
- `auth/SessionComposition.tsx`: bewahrt bestehende Supabase-Session-, Onboarding-, Login-Step-Up-, Password-Recovery- und Unauthorized-Gates.
- `routing/AppRoutes.tsx`: bewahrt die bestehenden öffentlichen Pfade und die Landing-/Dashboard-Auswahl. Ein neues Routing-Framework ist nicht Teil von BB-1.
- `types/UserSession.ts`: entkoppelt den Session-Typ vom historischen Root-`App.tsx`.
- `AppShell.tsx`: bleibt fachneutraler Shell-Baustein; Dashboard-Zerlegung erfolgt erst in BB-2.

BB-1 verschiebt keine fachliche Feature-Implementierung und verändert keine IAM-, Market-Data-, Scoring-, Billing- oder Governance-Authority.
