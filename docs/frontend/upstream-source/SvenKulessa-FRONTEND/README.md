# Mirrored FRONTEND presentation architecture

Pinned presentation source: `SvenKulessa/FRONTEND@64a0c24bd60501611aef10d36c61f71eba81f752`.

This snapshot contains the current allowlisted graphical architecture, including the dedicated login design, legal/FAQ presentation surface, hierarchical asset-class/subclass navigation components, and the existing visual assets.

## Integration boundary

- `/login`: the upstream `LoginPage.tsx` is a graphical source only. Productive authentication/session handling remains Finance-owned.
- `/impressum`, `/datenschutz`, `/agb`, `/faq`: `LegalAndFaqPages.tsx` is a presentation source. Compliance content and assertions remain owned by `CAPITAL-AI-COMP`.
- Asset classes and subclasses: the Sideboard/navigation presentation is mirrored, while canonical asset taxonomy and scoring semantics remain owned by `CAPITAL-AI-FINTECH`.
- `src/data/mockData.ts` remains `VISUAL_FIXTURE_ONLY`.
- Upstream Analytics/SEO runtime code is not promoted by this presentation sync. Finance keeps its existing consent, analytics, SEO, auth, security and compliance controls.

Automatic runtime promotion remains disabled. Productive binding requires separate owner-correct adapter work and exact-head validation.
