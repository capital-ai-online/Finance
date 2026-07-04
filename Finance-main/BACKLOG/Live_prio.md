# Live_prio.md — Priorisierte Aufgabenliste vor/nach Go-Live

Stand: Juli 2026. Diese Liste trennt strikt zwischen:
- 🤖 **Claude kann umsetzen** (Code, keine externen Zugänge nötig)
- 🧑‍💻 **Nur du kannst das** (API-Keys, Dashboard-Konfiguration, Rechtstexte, Geschäftsentscheidungen)

Reihenfolge = Priorität. Kritische Punkte zuerst.

---

## 🔴 KRITISCH — vor Go-Live zwingend

| # | Punkt | Wer | Status |
|---|---|---|---|
| 1 | `getSubscription()` gab bei jedem Fehler/neuem Nutzer `'Enterprise'` statt `'Free'` zurück → **jeder Nutzer bekam kostenlos die teuerste Stufe** | 🤖 | ✅ gefixt |
| 2 | `ORCHESTRATOR_ADMIN_TOKEN` hatte einen im Quellcode sichtbaren Fallback-Wert (`aif-admin-2026`) | 🤖 (Code) / 🧑‍💻 (Wert setzen) | ✅ Code fail-closed gemacht |
| 2a | → **Setze `ORCHESTRATOR_ADMIN_TOKEN` in Render als eigenes, langes Zufalls-Secret.** Ohne diesen Schritt lehnen alle Admin-Endpunkte (Kraken, Backtest-Report, Orchestrator-Reset) jede Anfrage ab. | 🧑‍💻 | ⏳ offen |
| 3 | `/api/stripe/create-portal-session` + `/api/stripe/user-subscription` vertrauten einer vom Client mitgeschickten E-Mail ohne Prüfung → jeder konnte mit einer fremden E-Mail das Stripe-Kundenportal einer anderen Person öffnen | 🤖 | ✅ gefixt (JWT-Pflicht) |
| 4 | `POST /api/docs-file` war ein komplett offener Datei-Schreibzugriff (jeder Internet-Nutzer, kein Login nötig) | 🤖 | ✅ gefixt (Owner-Auth) |
| 5 | `POST /api/registry/assets/:symbol` erlaubte jedem, Live-Kurse/Scores für jedes Asset zu verfälschen | 🤖 | ✅ gefixt (Owner-Auth) |
| 6 | `POST /api/orchestrator/create-simulated-audit` erlaubte jedem, gefälschte "COMPLIANT"-Audit-Einträge einzuschleusen | 🤖 | ✅ gefixt (Owner-Auth) |
| 7 | Gastmodus + E-Mail-basierter Admin-Bypass (`gast@aif-core.de`) | 🤖 | ✅ entfernt |
| 8 | Hardcodiertes `FALLBACK_ASSETS`-Array mit erfundenen Kursen/Scores, als "Verifiziert" markiert | 🤖 | ✅ entfernt |
| 9 | **`CryptoScoringEnterprise.tsx` schreibt bei jeder Report-Generierung fest einprogrammierte Fake-Compliance-Texte** ("Alle 24 Sicherheitsprüfungen erfolgreich", statische Audit-ID, "PII Masking enforced" etc.) als Datei ins `/docs/reports`-Verzeichnis | 🧑‍💻 Entscheidung nötig | ⏳ **Feature aktuell blockiert** (schreibt nicht mehr, da Endpoint jetzt Owner-Auth braucht und Komponente keinen Token mitschickt) — brauche deine Entscheidung: entfernen oder auf echte Daten umbauen? |
| 10 | **`AuditLogs.tsx` / "Audit-Trail"-Feature generiert Scores komplett per `Math.random()`** und präsentiert sie als Compliance-Prüfung | 🧑‍💻 Entscheidung nötig | ⏳ **Feature aktuell blockiert**, gleiche Frage wie oben |
| 11 | Rohstoff-Modul (aus Dev-AICore-OS) schätzt Fundamentaldaten per Gemini-LLM statt echter Quelle | 🧑‍💻 Entscheidung getroffen (echte Quelle: World Bank/USGS/EIA) | ⏳ Umsetzung noch offen |

---

## 🟠 HOCH — zeitnah nach Go-Live

| # | Punkt | Wer | Hinweis |
|---|---|---|---|
| 12 | Passkeys im Supabase-Dashboard aktivieren | 🧑‍💻 | Authentication → Passkeys → Relying Party ID `capital-ai.online`, Origins `https://www.capital-ai.online,https://capital-ai.online` |
| 13 | SMTP-Konfiguration final prüfen (du hast sie laut deiner Nachricht schon umgesetzt) | 🧑‍💻 | Bitte einmal Passwort-Reset-Mail live testen |
| 14 | Supabase Redirect-URLs / Site-URL auf `https://www.capital-ai.online` setzen | 🧑‍💻 | Sonst schlagen OAuth-Callbacks fehl |
| 15 | Stripe Success-/Cancel-/Portal-Return-URLs auf neue Domain | 🧑‍💻 | Stripe Dashboard → Checkout-Einstellungen |
| 16 | DNS: sicherstellen, dass sowohl `capital-ai.online` als auch `www.capital-ai.online` ein gültiges SSL-Zertifikat haben | 🧑‍💻 | Render Custom-Domain-Einstellungen — der 301-Redirect greift erst, wenn beide TLS-terminiert sind |
| 17 | Kraken-API-Key-Rechte im Kraken-Dashboard auf "Query Funds" + "Query Open Orders" reduzieren (Trade-Recht aktuell ungenutzt) | 🧑‍💻 | Reduziert Schaden bei Key-Leak; App nutzt ohnehin keine Order-Endpunkte |
| 18 | Stripe Price-IDs für **Jahresabo** (10 % Rabatt) je Tarif anlegen und in Render als `STRIPE_PRICE_ID_*_YEARLY` hinterlegen | 🧑‍💻 | Ohne diese IDs kann "Jahresabo" im Code nicht sauber verdrahtet werden |
| 19 | Stripe: **3-Tage-Trial für Starter** einrichten (`trial_period_days: 3` am Price oder in der Checkout-Session) | 🤖 (Code, sobald Price-IDs stehen) + 🧑‍💻 (Entscheidung: Kreditkarte bei Trial-Start Pflicht?) | Abhängig von #18 |
| 20 | Website-Besucherzählung — aktuell technisch nicht vorhanden | 🧑‍💻 Entscheidung + 🤖 Umsetzung | Siehe `sql/002_reporting_queries.sql`, Optionen: Plausible/Umami (DSGVO-freundlich) vs. eigene Tabelle |

---

## 🟡 MITTEL — Wachstum & Vertrauen

| # | Punkt | Wer | Hinweis |
|---|---|---|---|
| 21 | **Founder Edition** — Umsetzungsvorschläge | 🧑‍💻 Entscheidung, dann 🤖 | Siehe Abschnitt unten — braucht Preis-/Slot-Entscheidung vor Umsetzung |
| 22 | Beta-Tester-Zugang im Live-Modus | 🧑‍💻 Entscheidung, dann 🤖 | Vorschlag: eigenes `role`-Flag in `subscriptions`-Tabelle (`beta_tester: true`), gibt Pro-Zugriff ohne Zahlung, zeitlich befristet |
| 23 | 5-Sprachen-Auswahl (Toolbar oben rechts) | 🧑‍💻 Texte in 5 Sprachen liefern (oder professionelle Übersetzung beauftragen), dann 🤖 i18n-Umsetzung | Größerer Umbau — react-i18next o.ä., alle UI-Texte müssen extrahiert werden. Bitte sag mir, welche 5 Sprachen. |
| 24 | Support-Chat-Assistent im Impressum/"Universe"-Stil | 🧑‍💻 genauere Beschreibung nötig | "Interact neu planen" ist mir nicht klar — meinst du eine bestehende Komponente? Bitte kurz erläutern, dann baue ich es |
| 25 | Sitweite kleine, weiße Disclaimer-Schrift konsistent anwenden | 🤖 | Rein kosmetisch, mache ich in einem eigenen Durchgang, damit ich es nicht an 40 Stellen einzeln riskant patche |

---

## ⚠️ RECHTLICH PROBLEMATISCH — bitte vor Umsetzung mit mir klären

| # | Punkt | Warum ich zögere |
|---|---|---|
| 26 | **TÜV-artiges Prüfsiegel** | Ein TÜV-Siegel (oder eines, das wie eines aussieht) ohne echte TÜV-Zertifizierung zu zeigen, ist eine **irreführende geschäftliche Handlung nach § 5 UWG** — genau das, was dein eigener Rights-Agent-Prompt als Abmahnrisiko einstuft. Das kann ich nicht bauen, ohne dass du eine echte Zertifizierung hast oder anstrebst. **Alternative:** ein eigenes, unmissverständlich als "Selbstauskunft" gekennzeichnetes Badge ("Strict No-Demo-Data Policy — Eigenerklärung"), das nicht wie ein amtliches Prüfsiegel aussieht. |
| 27 | **EAA-Konformitätssiegel** | Gleiches Problem: das EAA (European Accessibility Act) hat kein offizielles "Siegel" zum Selbst-Anbringen — eine Konformitätserklärung ist etwas anderes als ein Siegel und muss inhaltlich stimmen (echte Barrierefreiheitsprüfung, siehe deine `AIRightsAgent.md`, Punkt 5). Vorschlag: **echte Barrierefreiheitserklärung** verlinken, sobald eine Prüfung stattgefunden hat — kein Siegel vortäuschen. |

Ich baue beides gerne um, sobald du sagst, welchen der beiden Wege (echte Prüfung vs. ehrliches Eigen-Badge) du willst — nur unkommentiert ein Siegel hinklatschen mache ich nicht, das ist zu riskant für dich.

---

## ❓ Klärung nötig — bevor ich weitermache

**"Deaktiviere den Gastmodus und setze ihn über den im Backend liegenden Key schreibgeschützt."**
Der Gastmodus ist bereits vollständig entfernt (siehe #7). Was genau meinst du mit "über den Backend-Key schreibgeschützt setzen" — geht es um etwas anderes als den (bereits entfernten) Gastmodus? Bitte kurz präzisieren, sonst baue ich versehentlich etwas an der falschen Stelle.

---

## 💡 Founder Edition — Umsetzungsvorschläge

Aus deiner `Pricing.md` ist "Founder Edition" bereits als **"Planned"** dokumentiert (Lifetime-Zugang, Founder-Badge, Beta-Zugang). Drei Umsetzungswege, je nach Aufwand:

1. **Einfach:** Stripe One-Time-Payment-Produkt ("Founder — einmalig 499€" o.ä.), setzt `subscriptions.tier = 'Enterprise'` + ein zusätzliches `is_founder: true`-Flag dauerhaft, keine Ablaufzeit. Zeigt ein Founder-Badge im Profil.
2. **Mit Knappheit/Dringlichkeit:** Slot-Zähler ("Noch 23 von 100 Plätzen") in einer eigenen Tabelle, verhindert Checkout sobald voll — braucht eine kleine Zähl-Tabelle + Serverprüfung vor Checkout-Erstellung.
3. **Mit Warteliste:** Erstmal nur E-Mail-Sammlung (kein Payment), du entscheidest später manuell, wer eingeladen wird.

Sag mir Preis + gewünschten Weg (1/2/3), dann baue ich es direkt ein.

---

## ✅ Bereits erledigt in dieser Session

- Gastmodus + Admin-Bypass entfernt
- `FALLBACK_ASSETS` Fake-Daten entfernt
- Domain-Migration (CORS, 301-Redirect, Impressum-E-Mail)
- Passwort-Reset-Flow (Empfangsseite für den Reset-Link)
- 2FA (TOTP) + Passkey-Grundgerüst
- Marketing-Landingpage vor dem Login
- Stripe-Billing-IDOR geschlossen (Portal-Session, Subscription-Lookup)
- Drei offene Schreib-Endpunkte abgesichert (docs-file, registry/assets, simulated-audit)
- Subscription-Default-Bug behoben (Enterprise → Free)
- Reporting-SQL-Queries (`sql/002_reporting_queries.sql`)
- Vollständiger API-Audit (32 Endpunkte, siehe Chat)
- Footer-Support-Mail + Disclaimer-Stil (Dashboard, Marketing-Seite)
- **PIM/interne Zugriffsbeschränkung: nach deiner Vorgabe auf Prio 5 gesetzt — kein weiterer Aufwand hier**
- **Service-Account-Konzept für Markdown-Orchestrator-Agenten umgesetzt:**
  - Interaktive Aktionen aus deinem Browser (MarkdownOrchestrator-UI) laufen über deinen echten Owner-JWT (`requireOwnerAuth`)
  - Automatisierte/getriggerte Workflows (z. B. ein künftiger Render Cron Job) laufen über den bestehenden `ORCHESTRATOR_ADMIN_TOKEN` als echtes Server-zu-Server-Secret — das ist der "Service Account" in diesem Ein-Personen-Setup, ohne unnötige zusätzliche Nutzerverwaltung
  - **Jede Aktion über den Service-Account-Token löst jetzt automatisch eine E-Mail an `service_report@capital-ai.online` aus** (via `nodemailer`, neue Abhängigkeit — einzige, die ich für echten SMTP-Versand brauchte)
  - `GET /api/orchestrator/audit-files` zusätzlich owner-gated (war komplett offen)

### Manuell von dir zu erledigen (neu)
- `npm install` ausführen (neue Abhängigkeit `nodemailer` in `package.json`)
- In Render setzen: `SMTP_HOST` (z. B. `smtp.office365.com`), `SMTP_PORT` (587), `SMTP_USER`, `SMTP_PASS` — **getrennt** von Supabases eigener Auth-SMTP-Konfiguration, da mein Server-Code direkt über nodemailer versendet, nicht über Supabase
- `ORCHESTRATOR_ADMIN_TOKEN` in Render setzen, falls noch nicht geschehen (siehe #2a oben) — ohne dieses Secret kann kein "Service Account"-Workflow laufen
