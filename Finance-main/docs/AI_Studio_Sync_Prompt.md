# Sync-Prompt für Google AI Studio (Dev-Umgebung)

Diesen Text am Anfang einer neuen AI-Studio-Session einfügen, bevor du weitere Änderungen an der Dev-Version vornimmst:

---

Wichtiger Kontext, bevor du Änderungen vorschlägst oder Code schreibst:

Die Produktionsversion (`capital-ai.online`) wurde seit deinem letzten Stand unabhängig von einem separaten Entwicklungsprozess gehärtet. Bitte beachte beim Weiterarbeiten:

1. **Gastmodus ist vollständig entfernt und darf NICHT wieder eingeführt werden** — auch nicht als "schreibgeschützt" oder über einen Secret-Key-Parameter in der URL. Es gibt keine Gast-Sessions, keinen `gast@aif-core.de`-Bypass, keinen `CAPITAL_AI_SECRET_KEY_2026`-artigen Client-Side-Key-Check.

2. **Owner-Zugriff läuft ausschließlich über echte Supabase-JWT-Verifizierung server-seitig** (`requireOwnerAuth`), niemals über einen clientseitigen E-Mail-String-Vergleich oder einen im Bundle sichtbaren Secret-String.

3. **Branding:** Der Produktname ist ausschließlich **CAPITAL-AI** / **Capital AI**. Verwende nirgends mehr "AIF-CORE", "AifCore" oder "Jenova Nexus" — auch nicht in Kommentaren, Variablennamen oder Dokumentation.

4. **No-Demo-Data-Policy ist nicht verhandelbar:** Keine hardcodierten Fake-Preise, -Scores, -News-Schlagzeilen, -Chart-Pattern oder -Audit-Ergebnisse — auch nicht als "Platzhalter" oder "realistische Beispieldaten". Wenn eine echte Datenquelle fehlt, gib das ehrlich als `null`/"nicht verfügbar" zurück statt einen plausibel wirkenden Wert zu erfinden.

5. **Stripe Price-ID-Variablen folgen dem Schema** `STRIPE_PRICE_ID_{TIER}_{MONTHLY|YEARLY}` (z. B. `STRIPE_PRICE_ID_STARTER_MONTHLY`), nicht mehr `STRIPE_PRICE_ID_{TIER}` ohne Zeitraum.

6. Falls du ein Affiliate-/Empfehlungslink-Modul, einen zusätzlichen Admin-Account, oder ein Feature mit Geldbezug (Rabatte, Trials, Preise) einbaust: **kennzeichne es klar im Code-Kommentar und weise in deiner Antwort explizit darauf hin**, statt es unkommentiert einzufügen — diese Dinge werden vor Produktivsetzung manuell geprüft.

7. **Erfinde niemals Regulierungs-/Rechtsangaben** — keine Handelsregisternummer, keine USt-IdNr., keinen Geschäftsführer-Titel, keine Aufsichtsbehörde (z.B. BaFin), es sei denn, Sven hat dir diese exakten, echten Angaben ausdrücklich gegeben. Das Impressum enthielt bereits einmal vier komplett erfundene Angaben dieser Art (inkl. einer falschen BaFin-Aufsichtsbehauptung) — das darf nie wieder passieren.

8. **Keine erfundenen Daten oder Texte ohne nachweisbaren Kontext oder Hintergrund** — das gilt für Finanzdaten, Nachrichten, Compliance-/Audit-Ergebnisse, Testimonials, Nutzerzahlen, Partnerschaften und Zertifizierungen gleichermaßen. Wenn eine Information nicht aus einer echten, nennbaren Quelle stammt, gehört sie nicht in den Code oder die Texte.

---

## Sven's Entscheidungen (bitte respektieren, nicht eigenständig überschreiben)

- **Rohstoffe/Commodities**: Verwende ausschließlich das Perplexity `rawMaterial` Enterprise Scoring Modul für echte Daten. Kein LLM-KI-Scoring (kein Gemini/Claude/GPT zur Schätzung von Fundamentaldaten). Der Rohstoff-Orchestrator darf nicht für andere Asset-Klassen wiederverwendet werden — jede Klasse bekommt einen eigenen Orchestrator mit eigenen Agents.
- **Newsfeed**: Ausschließlich echte Daten, angebunden über Perplexity (nicht NewsAPI.org allein, nicht generierte Inhalte).
- **PIM/interne Zugriffsbeschränkung**: bewusst Priorität 5 (nicht nötig), da Sven allein arbeitet.
- **Zugriffsrechte**: `sven.kulessa@gmail.com` UND `sven.kulessa@gmx.net` haben vollen Owner-/Admin-Zugriff. Alle zahlenden Tarife (Free/Starter/Pro/Enterprise) haben **keinen** Zugriff auf das Admin-Portal oder systembezogene Features — Tarifstufe ist davon komplett unabhängig.
- **Kraken-API**: bleibt vorerst wie es ist (Query- und Trade-Rechte gesetzt, aber keine Order-Endpunkte im Code implementiert — keine automatisierte Handelsausführung).
- **Custom-Domain-Checkout**: bewusst NICHT aktiviert (Kostengrund in der Beta-Phase) — Standard-Stripe-Checkout bleibt.
- **Stripe Price-ID-Variablen**: Schema `STRIPE_PRICE_ID_{TIER}_{MONTHLY|YEARLY}`.
- **Sprachen**: Englisch, Französisch, Italienisch, Portugiesisch, Spanisch (5 Sprachen zusätzlich zu Deutsch).
- **TÜV-/EAA-Siegel**: bewusst NICHT umgesetzt — echte Zertifizierung oder ehrliches Eigen-Badge, niemals ein Siegel, das eine nicht vorhandene amtliche Prüfung suggeriert.

---

## Von Claude in der Produktion bereits behobene Probleme (nicht erneut einführen!)

- Gastmodus + E-Mail-basierter Admin-Bypass wurde **dreimal** in unterschiedlicher Form gefunden und entfernt: `gast@aif-core.de`, `gast@capital-ai.de`, sowie ein URL-Parameter-Bypass `CAPITAL_AI_SECRET_KEY_2026`. Falls die Dev-Umgebung eine dieser Varianten (oder eine neue Variante) wieder einführt, ist das ein Sicherheitsrückschritt.
- `FALLBACK_ASSETS`-Array mit hardcodierten Fake-Kursen/Scores, als "Verifiziert" markiert, entfernt.
- Fabrizierte Chart-Pattern-Erkennung (`getAssetPatternForSymbol` — gab z.B. immer "Bullish Engulfing" für BTC zurück) entfernt.
- Krypto-Scoring-Engine auf echte CoinGecko-Historie umgestellt; nicht angebundene Faktoren (On-Chain, Orderbuch, Social) werden ehrlich als `null` ausgeschlossen statt geschätzt.
- Stripe-Billing-IDOR geschlossen (Portal-Session/Subscription-Lookup verlangten vorher keine echte Authentifizierung).
- Drei offene Schreib-Endpunkte abgesichert (`/api/docs-file`, `/api/registry/assets/:symbol`, `/api/orchestrator/create-simulated-audit`).
- `getSubscription()`-Bug behoben, der bei jedem Fehler/neuen Nutzer 'Enterprise' statt 'Free' zurückgab.
- Vier erfundene Regulierungsangaben im Impressum entfernt (HRB-Nummer, USt-IdNr., Geschäftsführer-Titel, BaFin-Aufsichtsbehauptung).
- `allow_promotion_codes` im Stripe-Checkout ergänzt (Gutscheine waren vorher nicht einlösbar).
- Rebrand AIF-CORE/Jenova Nexus → CAPITAL-AI durchgängig umgesetzt.

Bitte bestätige kurz, dass du diese Punkte berücksichtigst, bevor du mit der eigentlichen Aufgabe beginnst.

---

**Tipp:** Speichere diesen Text z. B. als "Gespeicherte Antwort"/System-Prompt-Baustein in AI Studio, damit du ihn nicht jedes Mal neu einfügen musst.
