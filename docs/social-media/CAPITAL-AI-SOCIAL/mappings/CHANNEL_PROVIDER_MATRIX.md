# CAPITAL-AI-SOCIAL Channel & Provider Matrix

**Synchronized baseline:** `main@1f01120164ba4a3c194a4e0a79292a262a372588`  
**Evidence rule:** only repository-verified capabilities are marked supported. Credential presence is never inferred.

## Channel capability matrix

| Channel | Provider | Content types evidenced | Text limit | Media support | Link support | Scheduling | Publishing | Analytics | Approval | Status |
|---|---|---|---:|---|---|---|---|---|---|---|
| X | `x` | text post; thread payload type exists | 280 standard | text primary; media capability not claimed here | text URLs | preparation/log only | real text publish adapter | not verified | external approval required when current gate is enabled; unconditional enforcement not claimed | SUPPORTED |
| Facebook | `facebook` | Page text post; video when media URL supplied | 63,206 operational registry max | text + video | text URLs | preparation/log only | real Page publish adapter | not verified | same current approval-gate boundary | SUPPORTED |
| Instagram | `instagram` | media/Reels-style publish | 2,200 caption | media required by current adapter | caption links not promoted as provider capability | preparation/log only | real media adapter; media required | not verified | same current approval-gate boundary | SUPPORTED / MEDIA REQUIRED |
| TikTok | `tiktok` | Direct Post video | 2,200 video caption | media required | no extra link capability claimed | preparation/log only | real Direct Post adapter; media required | not verified | same current approval-gate boundary | SUPPORTED / MEDIA REQUIRED |
| YouTube | `youtube` | video upload/description | 5,000 description | media required | description URLs | preparation/log only | real upload adapter; media required | not verified | same current approval-gate boundary | SUPPORTED / MEDIA REQUIRED |
| LinkedIn | none | legacy `linkedinPost` / `linkedin_video_pack` shape only | 3,000 feed post registry | no provider adapter evidenced | no provider capability evidenced | UNSUPPORTED | UNSUPPORTED | UNSUPPORTED | N/A until adapter exists | PARTIAL |
| Mastodon | none | none found | UNKNOWN | UNKNOWN | UNKNOWN | UNSUPPORTED | UNSUPPORTED | UNSUPPORTED | N/A | UNSUPPORTED |

Evaluated candidates: **7**. Provider-backed supported channels: **5**. Partial: **1**. Unsupported: **1**.

LinkedIn is not counted as a provider because it is absent from the canonical supported-account/provider stack.

## Provider inventory

| provider_id | platform | adapter path | supported operations | authentication | credential boundary | rate limits | media | scheduling | publish | analytics | status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `x` | X | canonical `server/socialMedia` publisher stack | create text post | OAuth/PKCE repository flow | CAPITAL-AI-SEC / approved secret boundary; values not documented | not canonically evidenced | no media claim in this baseline | preparation/log only | yes | no Social analytics adapter verified | ACTIVE capability |
| `facebook` | Facebook | same canonical stack | Page text post; video | Meta OAuth flow | CAPITAL-AI-SEC / approved secret boundary | not canonically evidenced | optional media | preparation/log only | yes | no Social analytics adapter verified | ACTIVE capability |
| `instagram` | Instagram | same canonical stack | media container + publish | Meta OAuth flow | CAPITAL-AI-SEC / approved secret boundary | not canonically evidenced | required | preparation/log only | yes with valid media | no Social analytics adapter verified | MEDIA REQUIRED |
| `tiktok` | TikTok | same canonical stack | Direct Post init | OAuth flow | CAPITAL-AI-SEC / approved secret boundary | not canonically evidenced | required | preparation/log only | yes with valid media | no Social analytics adapter verified | MEDIA REQUIRED |
| `youtube` | YouTube | same canonical stack | video upload | OAuth flow | CAPITAL-AI-SEC / approved secret boundary | not canonically evidenced | required | preparation/log only | yes with valid media | readonly scopes do not establish Social analytics consumption | MEDIA REQUIRED |

## Current publishing-control readback

Current main still implements `isApprovalGateEnabled()` with an environment opt-out: `SOCIAL_MEDIA_REQUIRE_APPROVAL=false` disables the instant-publish approval gate. The publish route consumes a hash-bound approval only when that gate is enabled. This matrix therefore does not claim unconditional fail-closed publication approval.

Media URL validation remains present before publication. `draft` and `scheduled` paths record preparation/log state rather than invoking the provider in the inspected route.

## Security/provider boundary

1. Adapter presence is not proof that production credentials are configured.
2. Secret values are never copied into Social roadmaps/evidence.
3. Security requirements/findings/negative-test expectations and independent verification remain CAPITAL-AI-SEC-owned.
4. Provider-specific rate-limit handling is not claimed without evidence.
5. `scheduled` currently means preparation/logging unless a separately evidenced scheduler/provider execution exists.
6. Provider success is not inferred where the provider returns pending/asynchronous state.
7. No Social analytics metric is claimed until a canonical evidence source/adapter exists.
8. A future Security finding affecting provider code must arrive through a valid cross-project handoff; generic Security coverage alone does not transfer PVC/domain ownership to Social.