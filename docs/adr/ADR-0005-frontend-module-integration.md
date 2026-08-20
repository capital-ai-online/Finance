# ADR-0005: Einbindung eines Capital-AI Front-End Moduls im Capital-AI FinTech Ökosystem

- **Authority ID:** `AUTH-ADR-FRONTEND-MODULE-INTEGRATION-0005`
- **Lifecycle:** `HISTORICAL — NON-AUTHORIZING`
- **Version:** `1.1.0`
- **Ursprüngliche Entscheidung:** 2026-07-10
- **Code-Revalidation:** 2026-08-20
- **Autor:** Sven Kulessa

## Aktuelle Disposition

ADR-0005 wird als **historisches, nicht autorisierendes Architekturartefakt** weitergeführt.

Die ursprüngliche Entscheidung beschrieb eine mögliche verteilte Frontend-Modul-Integration mit Module Federation, iframe/PostMessage, Token-Propagation und CSS-Namespace. Die Code- und Authority-Revalidation vom 20.08.2026 zeigt jedoch, dass diese Mechanismen **nicht die aktuelle CAPITAL-AI Frontend-Integrationsarchitektur bilden**.

Dieses Dokument darf daher keine heutigen IAM-, CSP-, CORS-, AuthN/AuthZ-, Token-Handling-, Source-Tree- oder Frontend-Dependency-Regeln überstimmen.

Aktuelle Authorities sind insbesondere:

- `AUTH-FRONTEND-PRESENTATION-ARCHITECTURE` / `docs/frontend/FRONTEND_ARCH.md` für Frontend Source Tree, Dependency Direction und Presentation Architecture;
- die jeweils aktuellen IAM-/Security-Authorities für AuthN/AuthZ und Token Handling;
- `ADR-0009` für die aktuelle CORS-Hardening-Grenze;
- fachliche ADR-/ESS-/SPT-Authorities für Financial Runtime, Market Data, Scoring und Entitlements.

## Code-Revalidation 2026-08-20

### 1. Module Federation / Remote Modules

Repository-Suchen nach Module-Federation-/Remote-/Expose-Konfigurationen liefern außerhalb dieses historischen ADR keine aktive Implementierungsevidence. Die aktuelle Frontend-Struktur basiert auf React/Vite sowie `src/app`, `src/features` und `src/shared`; es existiert keine durch ADR-0005 autorisierte Remote-Module-Runtime.

**Befund:** nicht implementiert / nicht aktuelle Authority.

### 2. iframe / PostMessage

Repository-Suchen nach der in ADR-0005 beschriebenen iframe-/PostMessage-Integrationsschicht liefern keine aktive Implementierungsevidence außerhalb des ADR-Textes.

**Befund:** nicht implementiert / nicht aktuelle Authority.

### 3. URL-Token-Propagation und Shared-LocalStorage-SSO

Die ursprünglich beschriebene Übergabe von JWTs über URL-Parameter bzw. gemeinsam genutzte LocalStorage-Bereiche ist kein aktueller CAPITAL-AI AuthN/AuthZ-Contract. Die aktuelle Security-Baseline nutzt serverseitig validierte JWT-/IAM-Grenzen; ADR-0009 dokumentiert außerdem, dass ein Legacy-Admin-Token-Mechanismus zugunsten JWT-basierter Autorisierung entfernt wurde.

Allgemeine `localStorage`-Nutzung für nicht autorisierende Client-Persistenz ist davon nicht betroffen. Sie begründet **keine** Shared-LocalStorage-SSO- oder Token-Authority.

**Befund:** historische Semantik ist non-authorizing und darf nicht aus dem alten `ACCEPTED`-Label reaktiviert werden.

### 4. Tailwind `aif-` Namespace

Die Revalidation findet keine aktuelle `aif-`-Prefix-Konfiguration als technische Integrationsgrenze. Das heutige Design-System wird durch die bestehende Frontend-/CSS-Struktur verwaltet.

**Befund:** nicht implementierte historische Option.

## Historischer Entscheidungsinhalt

ADR-0005 hatte ursprünglich folgende Integrationsoptionen als Standards beschrieben:

1. Micro-Frontend-Föderation über Webpack/Vite Module Federation und Remote Modules;
2. isolierte iframe-Integration mit bidirektionalem `postMessage`-Event-Bus;
3. SSO-/Token-Propagation über URL-Parameter, HTTP-Header oder gemeinsam genutzte LocalStorage-Bereiche;
4. optionalen Tailwind-CSS-Namespace wie `aif-` zur Style-Kapselung.

Diese Punkte bleiben ausschließlich als **historische Designabsicht** dokumentiert. Sie sind keine aktuelle Implementierungsanweisung und keine Freigabe für die Einführung der beschriebenen Mechanismen.

## Sicherheits- und Reaktivierungsregel

Insbesondere URL-Token-, iframe-, Cross-Origin-Messaging- und Shared-Auth-Storage-Semantik darf nicht aufgrund dieses historischen Dokuments implementiert oder reaktiviert werden.

Eine zukünftige verteilte Frontend-Integration muss gegen den dann aktuellen Stand von mindestens IAM, CSP, CORS, AuthN/AuthZ, Session-/Token-Handling und Frontend Architecture neu bewertet werden. Entsteht dabei eine tatsächlich neue Architekturentscheidung, ist diese über den aktuellen ADR-/Governance-Lifecycle mit reservierter ADR Display-ID zu behandeln.

## Ergebnis

**Disposition D: historical / non-authorizing.**

ADR-0005 bleibt für Traceability erhalten, besitzt aber keinen aktuellen normativen Scope. `FRONTEND_ARCH.md` und die jeweils zuständigen Security-/Domain-Authorities bestimmen den heutigen Zustand.
