# SEO N4 — Content-Freigabe vor Publish

**Status:** implementiert (API + In-Memory)  
**Roadmap:** SEO-ROADMAP-0001 / N4

## Gate

| `publishType` | Gate |
|---------------|------|
| `draft` | nein |
| `scheduled` | nein (Eintrag nur Log) |
| `instant` (oder fehlend) | **ja**, wenn `isApprovalGateEnabled()` |

Aktivierung:
- Production: **an** (Default)
- `SOCIAL_MEDIA_REQUIRE_APPROVAL=false` → aus
- `SOCIAL_MEDIA_REQUIRE_APPROVAL=true` → an (auch Dev)

## API

| Method | Path | Zweck |
|--------|------|--------|
| POST | `/api/social-media/approvals` | Freigabeantrag anlegen (`pending`) |
| GET | `/api/social-media/approvals` | Liste (optional `?status=`) |
| POST | `/api/social-media/approvals/:id/approve` | freigeben |
| POST | `/api/social-media/approvals/:id/reject` | ablehnen |
| POST | `/api/social-media/publish` | Instant braucht `approvalId` (approved → consumed) |

## Ablauf

1. `POST /generate` → Textpaket
2. `POST /approvals` mit Titel + Kurzsummary
3. Owner `approve`
4. `POST /publish` mit `approvalId` + `publishType: instant`

Kein Auto-Publish. Kein Reuse derselben Approval-ID.

## Persistenz

Migration-Draft: `supabase/migrations/20260815140000_social_media_content_approvals.sql`  
Laufzeit: In-Memory bis Apply + Store-Kopplung.
