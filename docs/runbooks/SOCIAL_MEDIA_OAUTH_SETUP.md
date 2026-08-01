# CAPITAL-AI Runbook: Social Media OAuth-2.0-Setup (YouTube, TikTok, Instagram, Facebook, X)

## Document ID

RUNBOOK-0002

## Bezug

ADR-0020 (Social Media Direct Publishing — Reale OAuth-2.0- und Plattform-API-Integration).

## Status

Aktiv

## Geltungsbereich

Dieses Runbook beschreibt die Schritte, die **nur der Repository-Owner selbst** (oder jemand mit
Vollmacht für die CAPITAL-AI-Organisation) durchführen kann: Registrierung von OAuth-Apps in vier
externen Developer-Consolen und Eintragen der resultierenden Secrets in Render. Diese Schritte
sind bewusst außerhalb dessen, was ein KI-Agent automatisieren kann — sie erfordern Login mit
einem echten Geschäftskonto, Annahme externer Nutzungsbedingungen als Rechtsperson und teils
Business-Verifizierung/App-Review durch die jeweilige Plattform.

Die zugehörige Backend-Implementierung (Token-Exchange, verschlüsselte Speicherung, echte
Publish-Calls) ist bereits vollständig umgesetzt (siehe ADR-0020) — nach Abschluss dieses
Runbooks funktioniert die Verbindung ohne weitere Code-Änderungen.

---

## 0. Vorab: Redirect-URI und Env-Var-Referenz

Für **alle** Plattformen wird exakt dieselbe Redirect-URI verwendet:

```
https://<DEINE-PRODUKTIONS-DOMAIN>/api/social-media/auth/callback
```

Ersetze `<DEINE-PRODUKTIONS-DOMAIN>` durch die tatsächliche Render-Domain (z. B.
`capital-ai.onrender.com` oder eine eigene Domain, falls konfiguriert). Für lokale
Entwicklung/Tests: `http://localhost:3000/api/social-media/auth/callback`.

| Plattform | Env-Var (Client-ID) | Env-Var (Client-Secret) |
|---|---|---|
| YouTube | `YOUTUBE_CLIENT_ID` | `YOUTUBE_CLIENT_SECRET` |
| TikTok | `TIKTOK_CLIENT_ID` | `TIKTOK_CLIENT_SECRET` |
| Instagram | `INSTAGRAM_CLIENT_ID` | `INSTAGRAM_CLIENT_SECRET` |
| Facebook | `FACEBOOK_CLIENT_ID` | `FACEBOOK_CLIENT_SECRET` |
| X (Twitter) | `X_CLIENT_ID` | `X_CLIENT_SECRET` |

Ohne gesetztes Paar bleibt die jeweilige Plattform serverseitig gesperrt (`GET
/api/social-media/auth/url` liefert HTTP 503) — es gibt keinen Fallback, der ohne echte
Credentials funktioniert (fail-closed, siehe `server/socialMedia/oauthExchange.ts`
`isProviderConfigured()`).

---

## 1. YouTube (Google Cloud Console)

1. [console.cloud.google.com](https://console.cloud.google.com) → neues Projekt anlegen oder
   bestehendes wählen (z. B. „CAPITAL-AI Production").
2. **APIs & Services → Library** → „YouTube Data API v3" suchen → **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User Type: `External` (sofern kein Google Workspace vorhanden).
   - App-Name, Support-E-Mail, Developer-Kontakt-E-Mail ausfüllen.
   - Scopes hinzufügen: `.../auth/youtube.upload`, `.../auth/youtube.readonly`.
   - **Test-Nutzer** hinzufügen (die eigene YouTube-Kontoemail), solange die App im
     „Testing"-Status ist — nur diese Konten können sich verbinden, bis ein Verification-Review
     durchlaufen wurde.
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: `Web application`.
   - Authorized redirect URIs: `https://<DOMAIN>/api/social-media/auth/callback` eintragen.
   - Speichern → Client-ID und Client-Secret werden angezeigt.
5. Render: `YOUTUBE_CLIENT_ID` und `YOUTUBE_CLIENT_SECRET` setzen (siehe Abschnitt 6).

**Wichtig:** Für den Übergang von „Testing" zu „In Production" (damit sich beliebige YouTube-Konten
verbinden können, nicht nur explizit gelistete Test-Nutzer) verlangt Google einen
Verifizierungsprozess inkl. Prüfung der `youtube.upload`-Scope-Nutzung — dieser kann mehrere Tage
dauern. Bis dahin funktioniert die Verbindung nur für als Test-Nutzer eingetragene Konten.

---

## 2. TikTok (TikTok for Developers)

1. [developers.tiktok.com](https://developers.tiktok.com) → mit Business-Konto anmelden → **Manage
   apps → Create an app**.
2. App-Name, Kategorie, Beschreibung ausfüllen.
3. **Add products**: „Login Kit" und „Content Posting API" hinzufügen.
4. Unter Login Kit: Redirect-URI `https://<DOMAIN>/api/social-media/auth/callback` eintragen.
5. Scopes aktivieren: `user.info.basic`, `video.upload`, `video.publish`.
6. **Client Key** und **Client Secret** aus dem App-Dashboard kopieren.
7. Render: `TIKTOK_CLIENT_ID` = Client Key, `TIKTOK_CLIENT_SECRET` = Client Secret.

**Wichtig — App-Review-Status:** `video.publish` ist ein review-pflichtiger Scope. Vor
Freigabe durch TikTok landen veröffentlichte Videos zunächst als **privater Entwurf im
Postfach** des verbindenden Nutzers, nicht öffentlich sichtbar (`platformPublishers.ts`
kennzeichnet das Ergebnis entsprechend als `pending`, nicht als fertig veröffentlicht). Für
öffentliches Direct-Posting muss der App-Review-Antrag bei TikTok gestellt und genehmigt werden
(Beschreibung des Use-Case, Demo-Video des Flows).

---

## 3. Meta — Instagram & Facebook (ein gemeinsamer Meta-App-Eintrag)

Instagram und Facebook nutzen **dieselbe Meta-App** und denselben OAuth-Dialog, aber getrennte
Client-ID/Secret-Env-Var-Paare (identische Werte, zweimal eingetragen — historisch bedingt durch
das ADR-0010-Schema, funktional beliebig).

1. [developers.facebook.com](https://developers.facebook.com) → **My Apps → Create App** → Typ
   „Business" wählen.
2. Produkte hinzufügen: **Facebook Login** und **Instagram Graph API**.
3. **Facebook Login → Settings**: Valid OAuth Redirect URIs =
   `https://<DOMAIN>/api/social-media/auth/callback`.
4. **App Review → Permissions and Features**: folgende Berechtigungen beantragen (für den
   eigenen Account/Test-Nutzer sofort nutzbar, für fremde Konten erst nach Review):
   `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, `instagram_basic`,
   `instagram_content_publish`.
5. **Voraussetzung serverseitig:** Das zu verbindende Instagram-Konto muss ein
   **Instagram-Business- oder Creator-Konto** sein, das mit einer Facebook-Page verknüpft ist —
   private Instagram-Konten können über die Graph API grundsätzlich nicht per API posten. Die
   Verknüpfung erfolgt in der Instagram-App unter Einstellungen → Konto → „Mit Facebook-Seite
   verknüpfen", bevor der OAuth-Flow in CAPITAL-AI gestartet wird.
6. App-ID und App-Secret aus **Settings → Basic** kopieren.
7. Render: `INSTAGRAM_CLIENT_ID`/`FACEBOOK_CLIENT_ID` = App-ID, `INSTAGRAM_CLIENT_SECRET`/
   `FACEBOOK_CLIENT_SECRET` = App-Secret (jeweils derselbe Wert).

**Wichtig — Page-Auswahl:** Der Backend-Code (`oauthExchange.ts` `fetchProviderProfile()`)
verbindet automatisch die **erste** über `/me/accounts` gelistete Page des Nutzers. Verwaltet der
Account mehrere Pages, muss vor dem Verbinden in Meta Business Suite sichergestellt werden, dass
die gewünschte Page an erster Stelle steht, oder das zu verbindende Konto darf nur eine Page
verwalten. Eine Auswahl-UI ist als Folgearbeit vorgemerkt (ADR-0020, Abschnitt 5).

---

## 4. X / Twitter (X Developer Portal)

1. [developer.x.com](https://developer.x.com) → Developer-Account beantragen (falls noch nicht
   vorhanden — kann eine manuelle Prüfung durch X durchlaufen).
2. **Projects & Apps → Create App** (innerhalb eines Projekts).
3. **User authentication settings → Set up**:
   - App permissions: `Read and write`.
   - Type of App: `Web App, Automated App or Bot`.
   - Callback URI: `https://<DOMAIN>/api/social-media/auth/callback`.
   - Website URL: Produktions-Domain.
4. Scopes: `tweet.read`, `tweet.write`, `users.read`, `offline.access`.
5. **Keys and tokens → OAuth 2.0 Client ID and Client Secret** kopieren.
6. Render: `X_CLIENT_ID`, `X_CLIENT_SECRET`.

**Wichtig — PKCE:** X verlangt für jeden OAuth-2.0-Client zwingend PKCE
(`code_challenge`/`code_verifier`), unabhängig davon, ob ein Client-Secret vorhanden ist. Das ist
bereits serverseitig implementiert (`server/socialMedia/pkce.ts`) — hier ist keine zusätzliche
Konfiguration nötig, außer sicherzustellen, dass „Confidential Client" (nicht „Public Client") im
X-Portal ausgewählt ist, da der Server das Client-Secret per Basic-Auth mitsendet.

---

## 5. Zusammenfassung: Redirect-URI-Eintrag pro Plattform

| Plattform | Ort des Redirect-URI-Eintrags |
|---|---|
| YouTube | Google Cloud Console → Credentials → OAuth 2.0 Client ID → Authorized redirect URIs |
| TikTok | TikTok for Developers → App → Login Kit → Redirect URI |
| Instagram/Facebook | Meta for Developers → App → Facebook Login → Settings → Valid OAuth Redirect URIs |
| X | X Developer Portal → App → User authentication settings → Callback URI |

Alle vier müssen **exakt** `https://<DOMAIN>/api/social-media/auth/callback` sein (inkl. `https://`,
ohne trailing slash) — eine abweichende URI führt beim jeweiligen Provider zu einem
`redirect_uri_mismatch`-Fehler direkt im OAuth-Popup, bevor der Request CAPITAL-AI überhaupt
erreicht.

---

## 6. Render Environment Variables eintragen

1. [dashboard.render.com](https://dashboard.render.com) → Service `capital-ai` → **Environment**.
2. Für jede der 10 Variablen aus Abschnitt 0 (bereits als `sync: false`-Platzhalter in
   `render.yaml` vorbereitet) den tatsächlichen Wert eintragen: **Add Environment Variable** →
   Key + Value → **Save Changes**.
3. Render löst nach dem Speichern automatisch einen Redeploy aus. Kein manueller Trigger nötig.
4. **Nie** diese Werte in `.env`-Dateien committen — `.env.example` enthält nur die Variablennamen
   als Platzhalter, so wie es bereits für alle anderen Secrets in diesem Projekt gehandhabt wird.

---

## 7. Validierung nach dem Deploy

1. `GET https://<DOMAIN>/healthz` → sollte `200 OK` liefern (bestätigt, dass der Server überhaupt
   startet — schlägt eine der neuen Dateien beim Import fehl, würde der Server gar nicht hochfahren).
2. Angemeldet in der CAPITAL-AI-App: **Dashboard → Social Media Accounts** öffnen.
3. Für jede konfigurierte Plattform „Mit … Verbinden" klicken → Popup öffnet sich mit der
   echten Provider-Login-Seite (nicht mehr mit einer Fake-Erfolgsseite) → nach Login/Consent
   schließt sich das Popup automatisch und das Konto erscheint mit echtem Handle/Follower-Count.
4. Für eine Plattform ohne gesetzte Env-Vars: „Verbinden" sollte eine Fehlermeldung „ist
   serverseitig nicht konfiguriert" zeigen (HTTP 503) statt eines stillen Fehlschlags.
5. `GET /api/social-media/accounts` **ohne** Authorization-Header sollte `401` liefern (Beleg,
   dass die Auth-Pflicht aus ADR-0020 aktiv ist — die im ursprünglichen Auftrag genannte
   „Validierung der Erreichbarkeit von GET /api/social-media/accounts" ist absichtlich kein
   anonymer 200er mehr).

---

## 8. Rollback

Alle Änderungen sind additiv (neue Tabellen, neuer Router, neue Env-Vars) — kein bestehender Pfad
wird durch dieses Feature verändert. Rollback-Optionen:

- **Feature deaktivieren, ohne zu deployen:** Render-Env-Vars leer lassen/entfernen → alle fünf
  Plattformen bleiben mit HTTP 503 gesperrt, der Rest der Anwendung ist unberührt.
- **Vollständiger Code-Rollback:** siehe `docs/runbooks/DEPLOYMENT_ROLLBACK_UND_BACKUP.md`
  (RUNBOOK-0001), Abschnitt „Anwendungsebene". Die drei neuen Supabase-Tabellen können bei einem
  DB-Rollback stehen bleiben (sie werden von keinem anderen Code-Pfad gelesen) oder bei Bedarf
  manuell per `drop table` entfernt werden.
