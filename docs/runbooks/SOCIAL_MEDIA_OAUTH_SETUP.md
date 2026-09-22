# CAPITAL-AI Runbook: Social Media OAuth-2.0-Setup (YouTube, TikTok, Instagram, Facebook, X)

## Document ID

RUNBOOK-0002

## Bezug

ADR-0026 (Social Media Direct Publishing — Reale OAuth-2.0- und Plattform-API-Integration) und ADR-0027 (Social Media Access Restriction — Owner/Founder).

## Status

Aktiv — gegen Governance-/Deployment-Stand vom 2026-08-25 synchronisiert.

## Geltungsbereich

Dieses Runbook beschreibt die Schritte, die **nur der Repository-Owner selbst** (oder jemand mit
Vollmacht für die CAPITAL-AI-Organisation) durchführen kann: Registrierung von OAuth-Apps in
externen Developer-Consolen und das kontrollierte Hinterlegen der resultierenden Konfiguration
und Secrets in der autorisierten Produktionsumgebung. Diese Schritte sind geschützte externe
Mutationen und werden durch einen Repository-Merge **nicht** automatisch autorisiert.

Die zugehörige Backend-Implementierung (Authorization Code, State-Verifikation, Token-Exchange,
verschlüsselte Speicherung und echte Publish-Calls) ist in ADR-0026 umgesetzt. Das aktuelle
Security-Modell ist in
`docs/security/SOCIAL_MEDIA_OAUTH_AUTHORIZATION_CODE_THREAT_MODEL_2026-08-25.md` dokumentiert.

---

## 0. Vorab: kanonische Redirect-URI und Credential-Referenz

Für **alle Produktions-Provider** ist die kanonische Redirect-URI:

```text
https://capital-ai.online/api/social-media/auth/callback
```

`https://www.capital-ai.online/api/social-media/auth/callback` ist serverseitig ebenfalls als
CAPITAL-AI-Produktionsorigin zugelassen, soll aber nur verwendet werden, wenn dieselbe Origin im
jeweiligen Provider-Portal ausdrücklich registriert wurde. Provider-Konfiguration und tatsächlich
gesendete `redirect_uri` müssen bytegenau zusammenpassen.

Für lokale Entwicklung/Tests ist ausschließlich Loopback vorgesehen, z. B.:

```text
http://localhost:3000/api/social-media/auth/callback
```

Beliebige `*.onrender.com`-Hosts, fremde Hosts, HTTP-Produktions-Origins, abweichende Callback-
Pfade sowie Redirect-URIs mit Query, Fragment oder Userinfo werden von
`server/socialMedia/oauthSecurity.ts` fail-closed abgelehnt. Dadurch kann ein untrusted `Host`-
oder Forwarded-Header keine OAuth-Redirect-Authority erzeugen.

| Plattform | Client-ID / Konfiguration | Client-Secret |
|---|---|---|
| YouTube | `YOUTUBE_CLIENT_ID` | `YOUTUBE_CLIENT_SECRET` |
| TikTok | `TIKTOK_CLIENT_ID` | `TIKTOK_CLIENT_SECRET` |
| Instagram | `INSTAGRAM_CLIENT_ID` | `INSTAGRAM_CLIENT_SECRET` |
| Facebook | `FACEBOOK_CLIENT_ID` | `FACEBOOK_CLIENT_SECRET` |
| X (Twitter) | `X_CLIENT_ID` | `X_CLIENT_SECRET` |

Die fünf Client-IDs sind nicht-geheime Render-Konfigurationswerte und werden in `render.yaml` als
`sync: false` geführt. Die fünf Client-Secrets sind dagegen Teil der kanonischen Secret-File-
Inventarisierung in `scripts/security/secretFileManifest.ts` und gehören in
Render Environment Variables; sie werden **nicht** als normale `render.yaml`-Env-Var gepflegt.

Ohne gesetztes Client-ID/Secret-Paar bleibt die jeweilige Plattform serverseitig gesperrt (`GET
/api/social-media/auth/url` liefert HTTP 503) — es gibt keinen Fallback ohne echte Credentials
(`server/socialMedia/oauthExchange.ts` `isProviderConfigured()`).

---

## 1. YouTube (Google Cloud Console)

1. Google Cloud Console öffnen → neues Projekt anlegen oder bestehendes Produktionsprojekt wählen.
2. **APIs & Services → Library** → „YouTube Data API v3" → **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User Type: `External` (sofern kein passender Workspace-interner Flow verwendet wird).
   - App-Name, Support-E-Mail, Developer-Kontakt-E-Mail ausfüllen.
   - Scopes hinzufügen: `.../auth/youtube.upload`, `.../auth/youtube.readonly`.
   - Während des Testing-Status nur die notwendigen Test-Nutzer freigeben.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: `Web application`.
   - Authorized redirect URI exakt auf die kanonische Produktions-Callback-URI setzen.
   - Client-ID und Client-Secret sicher übernehmen.
5. Produktionskonfiguration gemäß Abschnitt 6 hinterlegen.

Für den Übergang von „Testing" zu „In Production" kann Google für die verwendeten Scopes eine
separate Verifizierung verlangen. Das Provider-Review ist eine externe Betriebsfreigabe und kein
Repository-Gate.

---

## 2. TikTok (TikTok for Developers)

1. TikTok for Developers → **Manage apps → Create an app**.
2. App-Name, Kategorie und Beschreibung ausfüllen.
3. **Login Kit** und **Content Posting API** hinzufügen.
4. Unter Login Kit die kanonische Redirect-URI eintragen.
5. Scopes aktivieren: `user.info.basic`, `video.upload`, `video.publish`.
6. **Client Key** und **Client Secret** sicher übernehmen.
7. Produktionskonfiguration gemäß Abschnitt 6 hinterlegen.

`video.publish` ist review-pflichtig. Bis zur jeweiligen Provider-Freigabe können Funktionen
beschränkt sein; der Provider-Review-Status darf im Produkt nicht als CAPITAL-AI-Security- oder
Governance-Freigabe interpretiert werden.

### 2.1 App-Review — Texte für das Einreichungsformular

Die folgenden Texte beschreiben den vorhandenen Use Case; sie ersetzen keine Prüfung der dann
aktuellen TikTok-Vorgaben.

**App-Beschreibung**

> DE: „CAPITAL-AI ist eine Enterprise-FinTech-Plattform für KI-gestützte Finanzanalysen und
> automatisierte Marktberichte. Über die TikTok-Anbindung können Nutzer Kurzvideos, die aus
> ihren Analysen entstanden sind, direkt aus ihrem CAPITAL-AI-Konto auf ihrem eigenen
> TikTok-Profil veröffentlichen."
>
> EN: „CAPITAL-AI is an enterprise fintech platform for AI-assisted financial analysis and
> automated market reporting. Through the TikTok integration, users can publish short-form
> videos created from their analyses directly to their own TikTok profile from within their
> CAPITAL-AI account."

**Detaillierte Produkt-/Scope-Erklärung**

> „CAPITAL-AI integrates TikTok Login Kit and the Content Posting API to let users publish
> short-form videos generated within CAPITAL-AI directly to their own TikTok account, from the
> 'Social Media Accounts' section of the CAPITAL-AI dashboard.
>
> - **Login Kit** (scope `user.info.basic`): users connect their TikTok account via OAuth 2.0.
>   We use `user.info.basic` solely to display the connected account's display name, avatar and
>   follower count in the CAPITAL-AI dashboard, so the user can confirm which account is linked
>   before publishing anything.
> - **Content Posting API** (scopes `video.upload`, `video.publish`): once connected, the user
>   can trigger publishing of a video from within CAPITAL-AI. Every publish action is an
>   explicit, individual user action — no content is posted merely because an OAuth account is
>   connected."

**Vorschlag für den Ablauf des Demo-Videos**

1. CAPITAL-AI-Dashboard öffnen und „Social Media Accounts" aufrufen.
2. „Mit TikTok Verbinden" → echte TikTok-OAuth-Seite → Login/Consent → verbundenes Konto anzeigen.
3. Ein Video auswählen, TikTok als Zielplattform wählen und Caption prüfen.
4. „Sofort Veröffentlichen" auslösen und den realen Provider-Status zeigen.
5. Optional die Konto-Trennung zeigen.

Vor einem App-Review müssen Website-URL, Datenschutzerklärung und Nutzungsbedingungen auf der
Produktions-Domain tatsächlich erreichbar und inhaltlich aktuell sein.

---

## 3. Meta — Instagram & Facebook

Instagram und Facebook nutzen dieselbe Meta-App und denselben OAuth-Dialog, im Repository aber
getrennte Client-ID-/Secret-Schlüssel.

1. Meta for Developers → **My Apps → Create App** → geeigneten Business-App-Typ wählen.
2. **Facebook Login** und **Instagram Graph API** hinzufügen.
3. **Facebook Login → Settings**: Valid OAuth Redirect URI exakt auf die kanonische Callback-URI setzen.
4. Benötigte Permissions/Features beantragen:
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`,
   `instagram_content_publish`.
5. Instagram Publishing setzt ein kompatibles Business-/Creator-Konto und eine verknüpfte
   Facebook-Page voraus.
6. App-ID und App-Secret sicher übernehmen.
7. Produktionskonfiguration gemäß Abschnitt 6 hinterlegen.

**Page-Auswahl:** `oauthExchange.ts` verbindet aktuell die erste über `/me/accounts` gelistete
Page. Eine explizite Mehrfach-Page-Auswahl bleibt als ADR-0026-Folgearbeit bestehen. Sie ist kein
Grund, AuthN/AuthZ oder State-Bindung abzuschwächen.

Meta-Resource-API-Zugriffe senden Bearer-Tokens im `Authorization`-Header; Access-Tokens dürfen
nicht in Resource-URL-Query-Strings zurückgeführt werden.

---

## 4. X / Twitter (X Developer Portal)

1. X Developer Portal → Projekt/App anlegen.
2. **User authentication settings** konfigurieren:
   - App permissions: `Read and write`;
   - App-Typ gemäß serverseitigem Confidential-Client-Flow;
   - Callback URI exakt auf die kanonische Produktions-Callback-URI;
   - Website URL auf die Produktions-Domain.
3. Scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`.
4. OAuth-2.0 Client ID und Client Secret sicher übernehmen.
5. Produktionskonfiguration gemäß Abschnitt 6 hinterlegen.

**PKCE:** Der aktuelle X-Flow verwendet RFC-7636-PKCE mit `S256`. Der `code_verifier` wird
serverseitig erzeugt, im OAuth-State gespeichert und beim Token-Exchange gebunden. Diese
Sicherheitsanforderung darf nicht durch einen Provider-Portal-Workaround entfernt werden.

---

## 5. Redirect-URI-Eintrag pro Plattform

| Plattform | Ort des Redirect-URI-Eintrags |
|---|---|
| YouTube | Google Cloud Console → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs |
| TikTok | TikTok for Developers → App → Login Kit → Redirect URI |
| Instagram/Facebook | Meta for Developers → App → Facebook Login → Settings → Valid OAuth Redirect URIs |
| X | X Developer Portal → App → User authentication settings → Callback URI |

Produktiv ist standardmäßig exakt
`https://capital-ai.online/api/social-media/auth/callback` zu registrieren. Eine abweichende URI
muss sowohl providerseitig als auch durch eine explizite Repository-Security-Entscheidung
zugelassen sein; ein beliebiger Runtime-Host ist keine gültige Authority.

---

## 6. Render-Konfiguration und Secrets

**Dieser Abschnitt beschreibt die Konfiguration, autorisiert sie aber nicht.** Änderungen an
Render-Secrets/Environment sind geschützte externe Mutationen und benötigen die hierfür geltende
Human/Owner-Freigabe.

1. Render-Service gemäß `render.yaml` (`Finance`) öffnen.
2. Die fünf Client-IDs aus Abschnitt 0 als die bereits vorgesehenen `sync: false`-
   Konfigurationswerte pflegen.
3. Die fünf Client-Secrets ausschließlich über die kanonische server-only Render environment variables
   Render Environment Variables pflegen; `scripts/security/secretFileManifest.ts` ist die
   Repository-Quelle der Secret-Key-Inventarisierung.
4. Keine echten Werte in Git, `.env.example`, PR-Beschreibungen, CI-Logs oder Evidence kopieren.
5. Eine Konfigurationsänderung ist **keine Deployment-Autorisierung**. `render.yaml` hält
   `autoDeployTrigger: off`; die aktuelle Produktions-Promotion erfolgt über verifiziertes
   `main`-CI, Supply-Chain-Attestation, exact-SHA Render Deploy Hook und Post-Deploy-
   Identitätsprüfung unter `/AGENTS.md@CURRENT_MAIN`; anwendbare Release-/Deployment- und Security-Verträge bleiben fachliche Constraints und erzeugen keine eigene Ausführungs-Authority.

Damit ist die frühere Annahme „10 normale `sync: false`-Variablen + automatischer Render-Redeploy"
aufgehoben: Client-Secrets und Deployment-Authority folgen inzwischen getrennten kanonischen
Governance-Pfaden.

---

## 7. Validierung nach einer separat autorisierten Produktionsmutation

1. `GET https://capital-ai.online/healthz` → `200 OK`.
2. Angemeldet in CAPITAL-AI: **Dashboard → Social Media Accounts**.
3. Für jede konfigurierte Plattform „Verbinden" starten; die Provider-OAuth-Seite muss die
   registrierte CAPITAL-AI-Callback-URI verwenden.
4. Eine Plattform ohne vollständiges Client-ID/Secret-Paar muss mit HTTP 503 fail-closed bleiben.
5. `GET /api/social-media/accounts` ohne Authorization-Header muss `401` liefern (ADR-0026/0027).
6. Ein Request mit fremdem Host bzw. nicht freigegebener Redirect-Origin muss bereits beim
   Erzeugen der OAuth-Autorisierungs-URL abgelehnt werden.
7. Wiederverwendung eines bereits konsumierten oder abgelaufenen `state` muss abgelehnt werden.
8. Meta-Resource-Aufrufe dürfen Access-Tokens nicht als `access_token` in der Resource-URL tragen.

Repository-seitig werden diese Invarianten zusätzlich durch
`tests/unit/socialMediaOauthSecurity.test.ts` geprüft. Testevidence ist nicht autorisierend.

---

## 8. Rollback

- **Provider deaktivieren:** fehlende/entfernte vollständige Credential-Konfiguration hält den
  jeweiligen Provider fail-closed; jede echte Render-/Secret-Änderung benötigt erneut die
  einschlägige Mutationsfreigabe.
- **Code-Rollback:** frischer Branch vom dann aktuellen `main`, Human-reviewed Revert-PR und die
  normale Deployment-Authority verwenden; keinen historischen Branch wiederverwenden.
- **Datenbank:** bestehende Social-Media-Tabellen sind nicht Teil dieses Security-Hardening-
  Arbeitspakets und werden durch dessen Repository-Rollback nicht automatisch gelöscht.

Siehe zusätzlich `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`.
