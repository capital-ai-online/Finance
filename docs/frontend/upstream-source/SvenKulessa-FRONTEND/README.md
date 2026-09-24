# Mirrored FRONTEND presentation architecture

Pinned presentation source: `SvenKulessa/FRONTEND@4590c184aa4646e2708076cda05ead2820436a2a`.

This snapshot contains the current allowlisted graphical architecture, including the dedicated login design, legal/FAQ presentation surface, robust public-route normalization, hierarchical asset-class/subclass navigation components, and the existing visual assets.

## Integration boundary

- `/login`: the upstream `LoginPage.tsx` is a graphical/routing source only. Productive authentication/session handling remains Finance-owned.
- `/impressum`, `/datenschutz`, `/agb`, `/faq`: `LegalAndFaqPages.tsx` is a design and navigation source only. All productive legal/FAQ wording, assertions, versions and review remain owned by `CAPITAL-AI-COMP`.
- The upstream legal component contains sample/template legal copy. That copy is inert evidence and MUST NOT be promoted into productive Finance routes.
- Asset classes and subclasses: the Sideboard/navigation presentation is mirrored, while canonical asset taxonomy and scoring semantics remain owned by `CAPITAL-AI-FINTECH`.
- Every market asset already visible on the active landing has a symbol/ticker in the presentation model; the Finance regression contract verifies complete symbol coverage.
- `src/data/mockData.ts` and the allowlisted `src/data/assets/*.ts` files remain `VISUAL_FIXTURE_ONLY`.
- `src/context/PriceAlertsContext.tsx` and `src/utils/priceAlerts.ts` are inert `PRESENTATION_INTERACTION_FIXTURE` evidence only.
- Upstream Analytics/SEO runtime code and canonical Vocabulary data are intentionally not mirrored or promoted. Finance keeps its existing consent, analytics, learning, SEO, auth, security and compliance controls.

Automatic runtime promotion remains disabled. Productive binding is performed only through bounded Finance adapters with exact-head validation and owner-correct handovers.
