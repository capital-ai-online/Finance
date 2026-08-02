# Architectural Decision Record (ADR-0026)
## Social Media Direct Publishing — Reale OAuth-2.0- und Plattform-API-Integration

**Status:** ACCEPTED  
**Implementation-Status:** COMPLETE (Account-/OAuth-/Publish-Backend) · IN PROGRESS (Content-Generation-Anbindung)  
**Date:** 2026-08-01  
**Version:** 0.6.0

> Governance note: This ADR was formerly numbered ADR-0020. It was renumbered to ADR-0026 under AUD4-F-004 because ADR-0020 is canonically reserved for Multi-Provider Market Data Routing.

## Kontext

Der ursprünglich übergebene Social-Media-Publishing-Prototyp enthielt Mock-Erfolgs-URLs, keinen echten OAuth-Code-Token-Exchange, keine State-Verifikation und globalen In-Memory-Zustand. Das widersprach der Zero-Breach-/No-Fake-Data-Policy.

## Entscheidung

1. Persistenz über `social_media_accounts`, `social_media_oauth_states` und `social_media_publish_log` mit user-scoped Zugriff.
2. Echter OAuth-2.0-Handshake mit State-TTL/Einmalverwendung und plattformspezifischen Anforderungen.
3. Verschlüsselte Token-Ablage über die bestehende AES-256-GCM-Infrastruktur.
4. Reale Plattform-Publish-Calls für YouTube, TikTok, Instagram/Facebook und X.
5. Kein manuelles Fake-Connect; Verbinden ausschließlich über OAuth.
6. Authentifizierung über verifizierte Identität auf allen funktionalen Endpunkten.

## Scope-Grenze

Video-/Audio-Publishing benötigt eine reale Rendering-/Hosting-Pipeline und eine erreichbare `mediaUrl`. Fehlt diese, muss der Publish-Pfad explizit fehlschlagen statt eine Erfolgs-URL zu erfinden. Text-Publishing auf X/Facebook kann unabhängig davon funktionieren.

## Betroffene Bereiche

- `server/socialMedia/*`
- `src/routes/socialMediaRoutes.ts`
- `src/platform/SocialMediaEngine/*`
- `src/components/SocialAccountManager.tsx`
- `src/components/SocialDirectPublisherModal.tsx`
- `supabase/migrations/20260801150000_social_media_publishing.sql`
- `docs/runbooks/SOCIAL_MEDIA_OAUTH_SETUP.md`

## Konsequenzen

- Keine synthetischen Publish-Erfolge.
- OAuth-/Token-Zustand ist persistent und user-scoped.
- Tokens verlassen den Server nicht.
- Externe Developer-Console-/Secret-Konfiguration bleibt Production-Handoff und wird nicht im Repository gespeichert.
