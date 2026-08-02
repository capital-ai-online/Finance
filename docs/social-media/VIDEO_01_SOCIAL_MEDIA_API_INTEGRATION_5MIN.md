# CAPITAL-AI — Video 01: SocialMedia API Schnittstellen in 5 Minuten anbinden

**Dokumenttyp:** Video-Produktionsvorlage / Tutorial-Skript  
**Zielmedium:** YouTube / TikTok / LinkedIn / X / interne Produktdokumentation  
**Ziellänge:** ca. 5:00 Minuten  
**Zielgruppe:** Entwickler, Technical Founder, DevOps/Platform Engineers, FinTech-Produktverantwortliche  
**Status:** Vorlage für die erste Aufnahme  
**Produkt:** CAPITAL-AI  
**Scope:** OAuth- und Direct-Publishing-Architektur für YouTube, TikTok, Instagram, Facebook und X

---

## 1. Ziel des Videos

Das erste Video soll nicht jede Plattformkonfiguration vollständig erklären. Ziel ist, in fünf Minuten die Architektur und den praktischen Integrationsablauf verständlich zu zeigen:

1. Welche SocialMedia-Plattformen CAPITAL-AI unterstützt.
2. Warum keine SocialMedia-API direkt aus dem Browser aufgerufen wird.
3. Wie ein Plattformkonto über den serverseitigen OAuth-Flow verbunden wird.
4. Wie Tokens sicher gespeichert und Konten dem verifizierten Benutzer zugeordnet werden.
5. Wie ein Publish-Request von CAPITAL-AI an die jeweilige Plattform weitergereicht wird.
6. Welche Konfiguration weiterhin in den externen Developer-Portalen und in Render erforderlich ist.
7. Welche Sicherheits- und Governance-Grenzen für eine FinTech-Plattform gelten.

Das Video soll insbesondere zeigen, dass CAPITAL-AI **keine Fake-Verbindungen und keine simulierten Publish-Erfolge** verwendet. Ein Konto gilt erst als verbunden, wenn der echte OAuth-Callback abgeschlossen und das Token serverseitig gespeichert wurde.

---

## 2. Technischer Ist-Stand, auf dem das Video basiert

Die bestehende CAPITAL-AI-Implementierung unterstützt folgende Plattformen:

- YouTube
- TikTok
- Instagram
- Facebook
- X

Der produktive Backend-Pfad liegt unter:

```text
/api/social-media
```

Wichtige Endpunkte:

```text
GET  /api/social-media/access
GET  /api/social-media/accounts
GET  /api/social-media/auth/url?platform=<platform>
GET  /api/social-media/auth/callback
POST /api/social-media/accounts/toggle
POST /api/social-media/publish
GET  /api/social-media/history
```

Die Verbindung eines Kontos erfolgt ausschließlich über den OAuth-Flow:

```text
CAPITAL-AI
   │
   │ GET /api/social-media/auth/url?platform=tiktok
   ▼
CAPITAL-AI Backend
   │
   │ erzeugt OAuth state + Authorization URL
   ▼
TikTok / YouTube / Meta / X
   │
   │ Benutzer meldet sich an und bestätigt Scopes
   ▼
/api/social-media/auth/callback
   │
   │ code + state werden serverseitig validiert
   ▼
Token Exchange
   │
   ▼
verschlüsselte Token-Persistenz
   │
   ▼
Account = CONNECTED
```

Ein Client darf ein Konto **nicht** über einen einfachen Request als verbunden markieren.

---

## 3. Kernbotschaft des Videos

> „CAPITAL-AI behandelt SocialMedia-Anbindungen wie eine echte Enterprise-Integration: OAuth und Tokens bleiben serverseitig, jede Verbindung gehört zu einer verifizierten Benutzeridentität und ein Publish-Status wird nur dann ausgegeben, wenn die jeweilige Plattform-API tatsächlich verarbeitet wurde.“

Diese Aussage kann als Hauptthese zu Beginn und als Zusammenfassung am Ende verwendet werden.

---

# 4. Zeitplan für das 5-Minuten-Video

| Zeit | Abschnitt | Ziel |
|---|---|---|
| 00:00–00:20 | Hook | Problem und Nutzen in einem Satz |
| 00:20–00:55 | Architekturüberblick | Plattformen + Backend-Grenze |
| 00:55–01:40 | OAuth-Flow | Konto verbinden |
| 01:40–02:25 | Render / Secrets | Environment-Variablen erklären |
| 02:25–03:20 | Publish-Flow | Wie Posting technisch abläuft |
| 03:20–04:05 | Security / FinTech Governance | Warum diese Architektur nötig ist |
| 04:05–04:40 | Plattformbesonderheiten | TikTok, Meta, YouTube, X |
| 04:40–05:00 | Zusammenfassung / nächstes Video | Abschluss + Ausblick |

---

# 5. Vollständiges Sprecher-Skript

## 00:00–00:20 — Hook

### Bildschirm

- CAPITAL-AI Dashboard öffnen.
- Bereich „Social Media Accounts“ oder entsprechende Integration zeigen.
- Kurz die Plattform-Icons einblenden.

### Sprechertext

> „In diesem Video zeige ich in fünf Minuten, wie CAPITAL-AI externe SocialMedia-APIs sicher anbindet. Unterstützt werden YouTube, TikTok, Instagram, Facebook und X. Wichtig dabei: Wir speichern keine API-Secrets im Frontend und simulieren auch keine verbundenen Konten. Jede Verbindung läuft über einen echten serverseitigen OAuth-Prozess.“

### Texteinblendung

```text
OAuth 2.0
Server-side Tokens
No Fake Connections
Direct Publishing
```

---

## 00:20–00:55 — Architekturüberblick

### Bildschirm

Ein einfaches Diagramm einblenden:

```text
Frontend
   │
   ▼
CAPITAL-AI API
   │
   ├── OAuth Engine
   ├── Token Store
   ├── Access Control
   ├── Publish Engine
   └── Publish Log
          │
          ▼
YouTube / TikTok / Meta / X
```

### Sprechertext

> „Das Frontend spricht niemals direkt mit den SocialMedia-Providern. Alle externen Zugriffe laufen über das CAPITAL-AI-Backend. Dort befinden sich Access Control, OAuth-State-Management, Token-Persistenz, die Publisher und das Publish-Logging. Das verhindert, dass Client-Secrets oder Access-Tokens im Browser landen.“

> „Die API ist unter `/api/social-media` eingebunden. Jeder funktionale Endpunkt verlangt eine verifizierte Nutzeridentität. Zusätzlich ist die SocialMedia-Funktion derzeit auf Owner- beziehungsweise Founder-Zugriffe begrenzt.“

---

## 00:55–01:40 — Konto über OAuth verbinden

### Bildschirm

1. SocialMedia-Account-Seite öffnen.
2. TikTok als Demo wählen.
3. Netzwerk- oder API-Ablauf optional rechts daneben zeigen.

### Sprechertext

> „Nehmen wir TikTok als Beispiel. Wenn ein Nutzer auf ‚TikTok verbinden‘ klickt, ruft CAPITAL-AI zunächst `/api/social-media/auth/url?platform=tiktok` auf.“

> „Das Backend prüft zuerst Authentifizierung und Berechtigung. Danach wird ein OAuth-State erzeugt und serverseitig gespeichert. Erst dann erhält der Browser die echte Authorization-URL von TikTok.“

> „Nach Login und Consent leitet TikTok zurück auf `/api/social-media/auth/callback`. Der Callback akzeptiert die Benutzeridentität nicht aus einem Query-Parameter. Sie wird aus dem vorher persistierten OAuth-State rekonstruiert. Danach tauscht der Server den Authorization Code gegen ein echtes Access-Token aus.“

### Einblendung

```text
state ≠ optional
state = Bindeglied zwischen Benutzer und OAuth Callback
```

---

## 01:40–02:25 — Environment Variablen in Render

### Bildschirm

Render Dashboard → Environment öffnen.

**Wichtig:** Werte der Secrets im Video vollständig ausblenden.

### Sprechertext

> „Damit dieser Flow funktioniert, benötigt jede Plattform ihre Client-ID und ihr Client-Secret. Diese Werte liegen ausschließlich als Environment-Variablen in Render.“

### Einblendung

```text
YOUTUBE_CLIENT_ID
YOUTUBE_CLIENT_SECRET

TIKTOK_CLIENT_ID
TIKTOK_CLIENT_SECRET

INSTAGRAM_CLIENT_ID
INSTAGRAM_CLIENT_SECRET

FACEBOOK_CLIENT_ID
FACEBOOK_CLIENT_SECRET

X_CLIENT_ID
X_CLIENT_SECRET
```

### Sprechertext

> „Die Redirect-URI ist für alle Plattformen einheitlich aufgebaut und zeigt auf `/api/social-media/auth/callback`. Sie muss exakt genauso im jeweiligen Developer-Portal hinterlegt werden.“

### Einblendung

```text
https://capital-ai.online/api/social-media/auth/callback
```

> „Fehlt ein Credential-Paar, bleibt die Plattform fail-closed. Der Server liefert dann keinen Fake-Erfolg, sondern meldet, dass der Provider nicht konfiguriert ist.“

---

## 02:25–03:20 — Publishing

### Bildschirm

- Ein vorhandenes Video / Asset auswählen.
- Zielplattform wählen.
- Caption zeigen.
- Button „Sofort veröffentlichen“ zeigen.

### Sprechertext

> „Nach erfolgreicher Verbindung kann ein Publish-Request an `/api/social-media/publish` gesendet werden. CAPITAL-AI lädt zuerst das verschlüsselt gespeicherte Konto des eingeloggten Nutzers.“

> „Für jede ausgewählte Plattform wird der passende Publisher verwendet. Caption, Hashtags, Titel und Media-URL werden serverseitig in das jeweilige Providerformat übersetzt.“

### Diagramm

```text
POST /publish
   │
   ├── TikTok Publisher
   ├── YouTube Publisher
   ├── Instagram Publisher
   ├── Facebook Publisher
   └── X Publisher
          │
          ▼
Provider API
          │
          ▼
Publish Log
```

### Sprechertext

> „Das Ergebnis wird anschließend im Publish-Log gespeichert. Ein Status wie ‚published‘, ‚scheduled‘, ‚draft‘ oder ‚failed‘ stammt damit aus einem realen Backend-Prozess und nicht aus einer UI-Simulation.“

> „Entwürfe und geplante Veröffentlichungen werden bereits persistent protokolliert. Ein vollständiger Queue- beziehungsweise Scheduler-Prozess für zukünftige Veröffentlichungszeitpunkte ist ein separater Ausbaupunkt.“

---

## 03:20–04:05 — Security und FinTech Governance

### Bildschirm

Security-Layer als Grafik:

```text
Bearer Session
      ↓
Verified Identity
      ↓
Owner / Founder Authorization
      ↓
Rate Limit
      ↓
OAuth State Validation
      ↓
Encrypted Token Store
      ↓
Provider API
      ↓
Persistent Publish Log
```

### Sprechertext

> „Warum ist diese Architektur für eine FinTech-Plattform wichtig? Weil SocialMedia-Automation nicht außerhalb der bestehenden Identity-, Governance- und Audit-Schichten betrieben werden darf.“

> „CAPITAL-AI prüft deshalb Authentifizierung und Autorisierung vor dem OAuth- und Publish-Prozess. OAuth-State schützt den Callback vor Manipulation. Token werden serverseitig gespeichert. Publish-Aufrufe werden rate-limited und jeder reale Vorgang wird protokolliert.“

> „Der SocialMedia-Layer darf außerdem niemals Finanzscores oder Screening-Ergebnisse verändern. Er konsumiert Inhalte beziehungsweise Analysen, bleibt aber von der kanonischen Scoring-Engine getrennt.“

### Einblendung

```text
Social Media = Distribution Layer
Scoring Engine = Source of Truth
```

---

## 04:05–04:40 — Plattformbesonderheiten

### Bildschirm

5 Plattformkarten nebeneinander.

### Sprechertext

> „Die Provider unterscheiden sich vor allem bei Berechtigungen und App-Reviews.“

> „Bei TikTok werden Login Kit und Content Posting API verwendet. Der Scope für öffentliches Direct Posting kann einen App-Review erfordern.“

> „Bei YouTube wird die YouTube Data API verwendet; Upload-Berechtigungen können ebenfalls eine Google-Verifizierung erfordern.“

> „Instagram und Facebook laufen über die Meta-Plattform. Für Instagram Direct Publishing benötigt man typischerweise ein Business- oder Creator-Konto, das mit einer Facebook-Seite verbunden ist.“

> „X verwendet OAuth 2.0 und PKCE. Der PKCE-Flow ist bereits serverseitig berücksichtigt.“

---

## 04:40–05:00 — Abschluss

### Sprechertext

> „Damit steht die Grundarchitektur: echte OAuth-Verbindungen, serverseitige Tokens, ein zentraler Publish-Layer und persistentes Logging für fünf Plattformen.“

> „Im nächsten Video gehen wir eine Plattform vollständig durch – vom Developer-Portal über die Render-Variablen bis zum ersten echten Publish-Request.“

### Abschlussbild

```text
CAPITAL-AI
Enterprise FinTech + AI Orchestration

Next:
TikTok Developer Setup → OAuth → Content Posting API
```

---

# 6. Empfohlene Demo-Reihenfolge

Für das erste echte Plattform-Tutorial nach diesem Übersichtsvideo bietet sich TikTok an:

1. TikTok for Developers öffnen.
2. CAPITAL-AI App auswählen.
3. Login Kit zeigen.
4. Content Posting API zeigen.
5. Redirect URI prüfen.
6. Scopes erklären.
7. `TIKTOK_CLIENT_ID` und `TIKTOK_CLIENT_SECRET` in Render zeigen — Werte verdeckt.
8. Render Deploy abwarten.
9. CAPITAL-AI öffnen.
10. TikTok verbinden.
11. OAuth Consent zeigen.
12. Account-Verbindung überprüfen.
13. Testvideo auswählen.
14. Publish starten.
15. Publish-History prüfen.

---

# 7. Aufnahme-Checkliste

Vor Beginn der Aufnahme prüfen:

- [ ] Produktionsdomain ist erreichbar.
- [ ] `/healthz` liefert erfolgreich.
- [ ] Testkonto ist angemeldet.
- [ ] SocialMedia-Zugriff ist für das verwendete Konto freigeschaltet.
- [ ] Mindestens ein Provider ist vollständig konfiguriert.
- [ ] Redirect URI stimmt im Providerportal exakt überein.
- [ ] Browser enthält keine sichtbaren Passwörter oder Tokens.
- [ ] Render-Werte werden während der Aufnahme ausgeblendet.
- [ ] Developer-Portal zeigt keine Client-Secrets.
- [ ] Demo-Medien enthalten keine vertraulichen Finanzdaten.
- [ ] Datenschutz-/AGB-Seiten sind öffentlich erreichbar, falls der Provider sie im Review prüft.

---

# 8. Was im Video niemals gezeigt werden darf

Folgende Inhalte müssen geschwärzt oder vollständig außerhalb der Aufnahme bleiben:

```text
*_CLIENT_SECRET
SUPABASE_SECRET_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
OAuth Access Tokens
OAuth Refresh Tokens
Authorization Header
Bearer Tokens
Session Tokens
API Keys
Encryption Keys
```

Auch kurz sichtbare Secrets gelten als kompromittiert und müssten anschließend rotiert werden.

---

# 9. Technische API-Demo mit Browser DevTools

Optional kann während des Videos im Network-Tab gezeigt werden:

```http
GET /api/social-media/access
```

Erwartete semantische Antwort:

```json
{
  "success": true,
  "allowed": true,
  "reason": "..."
}
```

Danach:

```http
GET /api/social-media/auth/url?platform=tiktok
Authorization: Bearer <REDACTED>
```

Im Video darf nur die Struktur, niemals der echte Bearer-Token gezeigt werden.

Nach erfolgreichem OAuth:

```http
GET /api/social-media/accounts
```

Damit kann gezeigt werden, dass das Konto erst nach dem echten Callback in der Account-Liste auftaucht.

---

# 10. Publish-Request als erklärende Darstellung

Für das Video kann folgender vereinfachter Payload gezeigt werden:

```json
{
  "episodeId": "episode-001",
  "episodeTitle": "CAPITAL-AI Market Update",
  "targetPlatforms": ["tiktok", "youtube"],
  "publishType": "immediate",
  "mediaUrl": "https://example.invalid/video.mp4",
  "hashtags": ["FinTech", "AI", "Markets"]
}
```

**Hinweis für die Aufnahme:** Keine nicht existierende Media-URL als echten erfolgreichen Publish darstellen. Der Payload dient nur der Architektur-Erklärung. Für die reale Demo muss eine vom jeweiligen Provider erreichbare und zulässige Medienquelle verwendet werden.

---

# 11. Fehlerfälle, die im Video kurz erwähnt werden sollten

## Provider nicht konfiguriert

```text
HTTP 503
Provider credentials missing
```

Bedeutung: Client-ID oder Secret fehlen serverseitig.

## OAuth state ungültig

```text
Callback rejected
```

Bedeutung: Der Callback kann keinem gültigen, vorher gestarteten OAuth-Vorgang zugeordnet werden.

## Keine Berechtigung

```text
HTTP 401 / 403
```

Bedeutung: Session ungültig oder SocialMedia-Funktion nicht für den Nutzer freigegeben.

## Konto nicht verbunden

```text
Publish failed: no connected account
```

Bedeutung: Es existiert kein gültiger persistierter Plattformaccount für den Nutzer.

## Provider Review nicht abgeschlossen

Die API kann technisch funktionieren, aber der Provider kann Veröffentlichung, Sichtbarkeit oder Scopes einschränken.

---

# 12. B-Roll / Grafiken

Empfohlene zusätzliche Bilder für Schnitt und Übergänge:

1. CAPITAL-AI Dashboard.
2. Social Media Accounts Screen.
3. OAuth-Popup.
4. Render Environment-Seite mit geschwärzten Werten.
5. TikTok Developer Dashboard.
6. Google Cloud API Console.
7. Meta Developer Dashboard.
8. X Developer Portal.
9. vereinfachtes OAuth-Sequenzdiagramm.
10. Publish-Pipeline.
11. Security-Layer.
12. Publish-History.

---

# 13. Thumbnail-Ideen

Variante A:

```text
5 Social APIs
1 FinTech Backend
```

Variante B:

```text
TikTok + YouTube + Meta + X
mit EINER API-Schicht
```

Variante C:

```text
OAuth richtig bauen
für Enterprise Apps
```

Keine API-Keys, Tokens oder Developer-Portal-Secrets im Thumbnail zeigen.

---

# 14. Titelvorschläge

1. **5 SocialMedia APIs in eine Enterprise-App integrieren | CAPITAL-AI Architektur**
2. **TikTok, YouTube, Instagram, Facebook & X per OAuth anbinden — in 5 Minuten erklärt**
3. **SocialMedia API Architektur für FinTech SaaS | OAuth, Token Store & Direct Publishing**
4. **So verbindet CAPITAL-AI TikTok, YouTube, Meta und X sicher mit dem Backend**

---

# 15. Videobeschreibung — Vorlage

```text
In diesem Video zeige ich die SocialMedia-API-Architektur von CAPITAL-AI.

Unterstützte Plattformen:
• YouTube
• TikTok
• Instagram
• Facebook
• X

Themen:
• OAuth 2.0
• serverseitige Token-Verwaltung
• sichere Redirect-Callbacks
• Direct Publishing
• Publish Logging
• Render Environment Variables
• FinTech Security & Governance

Wichtig: Im Video werden keine echten Secrets oder Access-Tokens veröffentlicht.

Dieses Video dient der technischen Dokumentation der CAPITAL-AI-Plattform und stellt keine Finanzberatung dar.
```

---

# 16. Kapitelmarken

```text
00:00 SocialMedia APIs in CAPITAL-AI
00:20 Enterprise Architektur
00:55 OAuth Account Connection
01:40 Render Environment Variables
02:25 Direct Publishing
03:20 Security & Governance
04:05 Unterschiede der Provider
04:40 Zusammenfassung
```

---

# 17. Folgevideo-Serie

Empfohlene Reihenfolge:

### Video 02 — TikTok

```text
TikTok Developer App
→ Login Kit
→ Content Posting API
→ Site Verification
→ Redirect URI
→ Scopes
→ Render Secrets
→ OAuth Test
→ erster Publish
```

### Video 03 — YouTube

```text
Google Cloud Project
→ YouTube Data API v3
→ OAuth Consent Screen
→ youtube.upload
→ Render
→ Publish
```

### Video 04 — Instagram / Facebook

```text
Meta Developer App
→ Facebook Login
→ Instagram Graph API
→ Page + Business Account
→ Permissions
→ OAuth
→ Publishing
```

### Video 05 — X

```text
X Developer App
→ OAuth 2.0
→ PKCE
→ Read/Write Permissions
→ Render
→ Publish
```

### Video 06 — CAPITAL-AI SocialMedia Governance

```text
IAM
→ Rate Limits
→ Encrypted Tokens
→ Audit Log
→ Retry Strategy
→ Provider Failures
→ Scheduler
```

---

# 18. Definition of Done für Video 01

Das Video gilt als fertig, wenn nach fünf Minuten ein technisch versierter Zuschauer folgende Fragen beantworten kann:

- Welche Plattformen sind angebunden?
- Wo läuft OAuth ab?
- Wo liegen die Secrets?
- Warum darf der Browser die Provider nicht direkt aufrufen?
- Wie wird der OAuth-Callback einem Benutzer zugeordnet?
- Wie entsteht ein echter Publish-Status?
- Welche Funktion haben Render Environment Variables?
- Warum ist der SocialMedia-Layer vom Financial Scoring getrennt?
- Welche Schritte sind für eine konkrete Plattform im nächsten Video erforderlich?

Wenn diese Punkte verständlich vermittelt werden, erfüllt Video 01 seinen Zweck als Einstieg in die SocialMedia-API-Serie.
