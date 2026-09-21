# Mirrored FRONTEND presentation architecture

Pinned presentation source: `SvenKulessa/FRONTEND@f2a101330d74420c373f0ec56fa58caac53d741d`.

This snapshot contains the current allowlisted graphical architecture, including the dedicated login design, legal/FAQ presentation surface, robust public-route normalization, hierarchical asset-class/subclass navigation components, and the existing visual assets.

## Integration boundary

- `/login`: the upstream `LoginPage.tsx` is a graphical/routing source only. Productive authentication/session handling remains Finance-owned.
- `/impressum`, `/datenschutz`, `/agb`, `/faq`: `LegalAndFaqPages.tsx` is a design and navigation source only. All productive legal/FAQ wording, assertions, versions and review remain owned by `CAPITAL-AI-COMP`.
- The upstream legal component contains sample/template legal copy. That copy is inert evidence and MUST NOT be promoted into productive Finance routes.
- Asset classes and subclasses: the Sideboard/navigation presentation is mirrored, while canonical asset taxonomy and scoring semantics remain owned by `CAPITAL-AI-FINTECH`.
- Every market asset already visible on the active landing has a symbol/ticker in the presentation model; the Finance regression contract verifies complete symbol coverage.
- `src/data/mockData.ts` remains `VISUAL_FIXTURE_ONLY`.
- Upstream Analytics/SEO runtime code is not promoted by this presentation sync. Finance keeps its existing consent, analytics, SEO, auth, security and compliance controls.

Automatic runtime promotion remains disabled. Productive binding is performed only through bounded Finance adapters with exact-head validation and owner-correct handovers.
