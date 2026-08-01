# Architectural Decision Record (ADR-0020)
## Social Media Direct Publishing — Reale OAuth-2.0- und Plattform-API-Integration

**Status:** ACCEPTED
**Implementation-Status:** ✅ COMPLETE (Account-/OAuth-/Publish-Backend) · 🟡 IN PROGRESS (Content-Generation-Anbindung, siehe Abschnitt 3)
**Date:** 2026-08-01
**Version:** 0.6.0
**Authors:** CAPITAL-AI Enterprise Solution Architecture Team (Claude, im Auftrag von Sven Kulessa)
**Basis:** Handover-Prototyp aus Google AI Studio (siehe Abschnitt 1), ADR-0014 (Decoupled Social Media & Podcast Creator Engine)

---

## 1. Kontext & Ausgangslage

Ein aus Google AI Studio übergebener Prototyp (`socialMediaRoutes.ts`, `types.ts`, `SocialAccountManager.tsx`, `SocialDirectPublisherModal.tsx`, `SocialMediaGenerator.tsx`, `ESS_MEDIA_PLATFORM_STUDIO.md`, `ADR_0010_SOCIAL_MEDIA_DIRECT_PUBLISHING.md`) wurde als „vollständig produktionsreif" mit der Bitte übergeben, OAuth-Developer-Consolen einzurichten, Render-Secrets zu hinterlegen und das Modul live zu schalten.

**Audit-Befund vor Übernahme dieser Aufgabe:** Der übergebene Code war auf dem Publishing-Pfad eine reine Mock-Implementierung:

- `POST /publish` konstruierte für jede Plattform eine Erfolgs-URL ausschließlich aus `Date.now().toString(36)` — es existierte **kein einziger HTTP-Request** an eine YouTube-, TikTok-, Instagram-, X- oder Facebook-API.
- `GET /auth/callback` tauschte den OAuth-`code`-Parameter **nie** gegen ein Access-Token; er setzte lediglich `status = 'connected'` in einem In-Memory-Array.
- Der `state`-Parameter (`${platform}_${Date.now()}`) wurde beim Callback **nie verifiziert** — ein klassischer CSRF-Fehler, der es jedem mit Kenntnis der Callback-URL erlaubt hätte, ein beliebiges Konto als „verbunden" zu markieren.
- `POST /accounts/toggle` erlaubte es jedem Client, ein Konto per `connect: true` ohne jeden OAuth-Nachweis als verbunden zu markieren, inklusive eines frei erfundenen `accessTokenMasked`-Werts.
- Sämtlicher Zustand lag in globalen, prozessweiten In-Memory-Arrays **ohne jedes User-Scoping** — in einer Mehrbenutzer-Produktivumgebung hätten alle Nutzer dieselben „verbundenen" Konten und dasselbe Publish-Log gesehen bzw. beeinflussen können.

Dies verstößt unmittelbar gegen die in `AGENTS.md` festgeschriebene „Zero-Breach Data Integrity"-Direktive („No Fake or Mock Data: Under no circumstances should fake, placeholder, or simulated data be served to users when real-time or persistent data is expected"). Eine Live-Schaltung wie ursprünglich angefragt (nur OAuth-Consolen einrichten + Render-Secrets setzen) hätte diesen fundamentalen Mangel unverändert in Produktion gebracht: Nutzer hätten auf „Sofort Veröffentlichen" geklickt und einen „Erfolgreich veröffentlicht"-Link mit funktionierendem UI-Feedback gesehen, der ins Leere zeigt.

## 2. Entscheidung

Statt die Produktionskonfiguration des Mock-Codes durchzuführen, wird der Publishing-Pfad **vollständig neu mit echter Funktionalität** implementiert:

1. **Persistenz statt In-Memory** (Migration `20260801150000_social_media_publishing.sql`): drei neue Tabellen `social_media_accounts`, `social_media_oauth_states`, `social_media_publish_log`, RLS `service_role`-only (gleiches Muster wie `security_events`/`step_up_tokens`), user-scoped über `user_id`.
2. **Echter OAuth-2.0-Handshake** (`server/socialMedia/oauthExchange.ts`, `oauthProviders.ts`, `pkce.ts`): serverseitig erzeugter, an `user_id`+`platform` gebundener State-Token mit 10-Minuten-TTL und Einmalverwendung (behebt die CSRF-Lücke); echter Code-Token-Exchange pro Plattform inkl. plattformspezifischer Eigenheiten (TikTok `client_key` statt `client_id`, X PKCE-Pflicht, Meta Short-Lived→Long-Lived-Token-Exchange plus Page-Access-Token-Ermittlung über `/me/accounts`).
3. **Verschlüsselte Token-Ablage** (`server/socialMedia/tokenStore.ts`): Wiederverwendung von `server/iam/secretCrypto.ts` (AES-256-GCM, bereits für TOTP-Secrets etabliert) statt eines neuen Krypto-Mechanismus. Tokens verlassen den Server nie — `toPublicAccount()` liefert ausschließlich eine nicht-reversible Anzeige-Referenz.
4. **Echte Plattform-Publish-Calls** (`server/socialMedia/platformPublishers.ts`): reale API-Aufrufe an YouTube Data API v3 (Direct-Upload), TikTok Content Posting API v2 (`PULL_FROM_URL`), Instagram/Facebook Graph API v19 (Media-Container + Publish bzw. Page-Feed/-Video-Post), X API v2 (`POST /2/tweets`).
5. **Manuelles „Verbinden" entfernt**: `POST /accounts/toggle` kann ein Konto nur noch trennen; Verbinden läuft ausschließlich über den echten OAuth-Flow.
6. **Auth-Pflicht auf allen Endpunkten**: `resolveVerifiedIdentity()` (bereits etabliertes Muster aus `server/ai.ts`) statt keiner Authentifizierung.

## 3. Bewusste Scope-Grenze: Content-Generation nicht enthalten

Der Handover umfasste **nicht** `SocialMediaGeneratorService.ts` in der Variante, die Podcast-/Video-Content tatsächlich generiert (`generateSeries`, `generateFallbackPackage`, Web-Speech-Audio-Preview, JSON/Markdown/Standalone-JS-Exporte) — nur `types.ts`, der Router und zwei UI-Komponenten wurden übergeben, `SocialMediaGenerator.tsx` (die Studio-Haupt-UI) referenziert diese fehlenden Methoden.

**Wichtigere strukturelle Lücke:** Das System erzeugt laut ADR-0014 ausschließlich **Text-Skripte, Storyboards und eine clientseitige Web-Speech-API-Vorschau** — kein gerendertes, herunterladbares Video-/Audio-File. YouTube, TikTok und Instagram Reels verlangen aber zwingend eine öffentlich erreichbare Medien-URL für die Veröffentlichung. Ohne eine Rendering-/Hosting-Pipeline (nicht Teil dieses Handovers) **kann** echtes Video-Publishing auf diesen drei Plattformen nicht funktionieren — unabhängig davon, wie korrekt die OAuth-/API-Integration implementiert ist.

Diese ADR-Umsetzung reagiert darauf **ehrlich statt beschönigend**:

- `PublishRequestPayload`/`GeneratedMediaItem` erhalten ein neues optionales Feld `mediaUrl`.
- Ist `mediaUrl` für YouTube/TikTok/Instagram nicht gesetzt, liefert `platformPublishers.ts` einen expliziten `errorMessage` (`mediaRequiredError()`) statt einer erfundenen Erfolgs-URL.
- **X (reiner Text-Tweet) und Facebook (Text-Post auf einer Page) funktionieren bereits jetzt vollständig end-to-end**, weil sie keine Medien-Pflicht haben.
- `SocialMediaGenerator.tsx` (Content-Generation-Haupt-UI) wurde **nicht** integriert, um nicht durch eine unvollständige/fabrizierte Gemini-Anbindung denselben Fehler zu wiederholen, der bei diesem Audit beim Publishing-Pfad gefunden wurde. `SocialAccountManager.tsx` und `SocialDirectPublisherModal.tsx` wurden integriert, da sie unabhängig von der Content-Generation funktionieren (Konto-Verwaltung; Publish-Modal nimmt ein beliebiges `GeneratedMediaItem` entgegen, unabhängig davon, wie es erzeugt wurde).

## 4. Betroffene Komponenten & Dateien

- `supabase/migrations/20260801150000_social_media_publishing.sql` (neu)
- `server/socialMedia/oauthProviders.ts`, `pkce.ts`, `tokenStore.ts`, `oauthExchange.ts`, `platformPublishers.ts`, `publishLog.ts` (neu)
- `src/routes/socialMediaRoutes.ts` (ersetzt den Handover-Prototyp vollständig)
- `src/platform/SocialMediaEngine/types.ts` (übernommen, `mediaUrl`-Feld ergänzt)
- `src/platform/SocialMediaEngine/SocialMediaGeneratorService.ts`, `index.ts` (neu, auf Account-/Publish-Scope begrenzt — siehe Abschnitt 3)
- `src/components/SocialAccountManager.tsx`, `SocialDirectPublisherModal.tsx` (überarbeitet: kein Fake-Connect-Fallback mehr, `mediaUrl`-Durchreichung, Origin-Prüfung auf `postMessage`)
- `src/components/Dashboard.tsx` (neuer Navigationseintrag „Social Media Accounts")
- `server.ts` (Mounting `app.use('/api/social-media', socialMediaRouter)`)
- `render.yaml`, `.env.example`, `scripts/automation/verifyDeploymentReadiness.ts` (neue Env-Vars + Scanner-Erweiterung für dynamische `getCleanEnv()`-Aufrufe)
- `docs/runbooks/SOCIAL_MEDIA_OAUTH_SETUP.md` (neu, RUNBOOK-0002)

## 5. Bekannte Einschränkungen (Backlog)

| # | Einschränkung | Auswirkung | Nächster Schritt |
|---|---|---|---|
| 1 | Kein Content-Rendering (siehe Abschnitt 3) | YouTube/TikTok/Instagram-Publish schlägt ohne extern beschaffte `mediaUrl` fehl | Rendering-/Hosting-Pipeline als eigenes ADR |
| 2 | YouTube-Upload nutzt Direct-Upload (`uploadType=multipart`), kein chunked Resumable-Protokoll | Für sehr große Longform-Videos ungeeignet; für Short-Form (Zielformat dieses Produkts) ausreichend | Resumable-Upload bei Bedarf nachrüsten |
| 3 | TikTok-Veröffentlichung landet vor App-Review im privaten Postfach des Nutzers, nicht öffentlich | Erwartetes Verhalten der TikTok Content Posting API für unauditierte Apps | Im Runbook dokumentiert; App-Review beantragen |
| 4 | Terminierte Posts (`publishType: 'scheduled'`) werden geloggt, aber nicht automatisch zum Zielzeitpunkt ausgelöst | Kein Cron/Queue-Scheduler vorhanden | Als eigenes Backlog-Item (Scheduler-Job) |
| 5 | Meta-Integration verbindet automatisch die erste verwaltete Page (`/me/accounts[0]`) | Nutzer mit mehreren Pages können nicht wählen | Page-Auswahl-UI als Folgearbeit |
| 6 | X-Publishing unterstützt nur Text-Tweets, kein Medien-Anhang | Video-Tweets nicht möglich | INIT/APPEND/FINALIZE Media-Upload (v1.1) nachrüsten |
| 7 | `SocialMediaGenerator.tsx` (Content-Generation-UI) nicht integriert | Konten-Verwaltung ist erreichbar (Dashboard → „Social Media Accounts"), das volle Studio nicht | Erfordert echten `/api/social-media/generate`-Endpunkt als separate Aufgabe |

## 6. Konsequenzen

- Kein Breaking Change an bestehenden Scoring-/Datenbankschemata.
- Neue RLS-Policies folgen bestehendem Muster (`service_role_full_access`) — kein neues Autorisierungskonzept.
- Token-Verschlüsselung nutzt existierende Infrastruktur (`TOTP_ENCRYPTION_KEY`/`secretCrypto.ts`) statt eines neuen Secrets.
- Die Produktionsschritte, die nur der Repository-Owner selbst ausführen kann (OAuth-App-Registrierung in vier externen Developer-Consolen, Eintragen der Secrets in Render), sind in `docs/runbooks/SOCIAL_MEDIA_OAUTH_SETUP.md` dokumentiert.
