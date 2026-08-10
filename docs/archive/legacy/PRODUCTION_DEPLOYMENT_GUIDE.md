# CAPITAL-AI - Leitfaden zur Produktiv-Umgebung & Synchronisation (Supabase & Stripe)

Dieses Dokument beschreibt die exakten Schritte, um CAPITAL-AI (AIFinancial) aus der lokalen Sandbox-Umgebung (Dev-Station) sicher in den **Produktivbetrieb** zu überführen und mit der Live-Datenbank (Supabase) sowie dem Stripe-Zahlungsgateway zu synchronisieren.

---

## 🛡️ 1. Sicherheit & Datenintegrität

In Übereinstimmung mit unseren Entwicklungsrichtlinien gilt:
- **Keine Mock-Daten im Live-Betrieb**: Sobald die entsprechenden Umgebungsvariablen geladen sind, schaltet CAPITAL-AI automatisch vom lokalen JSON-Dateisystem auf die sichere, verschlüsselte Echtzeit-Datenbank von Supabase um.
- **Backend-Secret Isolation**: Alle API-Keys (Stripe Secret Key, Webhook Secret, Supabase Secret) verbleiben ausschließlich im geschützten Backend-Speicher.
- **Sichere Webhooks**: Der Webhook-Endpunkt verifiziert jede eingehende Stripe-Zahlung kryptografisch per Signatur-Prüfung.

---

## 🗄️ 2. Supabase Produktiv-Datenbank einrichten

Die Anwendung benötigt eine Tabelle namens `subscriptions` zur Echtzeit-Synchronisierung der Benutzerpläne.

### Schritt 2.1: Tabelle in Supabase erstellen
Öffnen Sie Ihr **Supabase Dashboard**, navigieren Sie zum **SQL Editor** und führen Sie folgendes SQL-Skript aus:

```sql
-- Tabelle für Benutzer-Abonnements erstellen
CREATE TABLE IF NOT EXISTS public.subscriptions (
    user_id TEXT PRIMARY KEY, -- Primärschlüssel (UUID oder Auth-User ID)
    email TEXT NOT NULL,       -- Email-Adresse des Benutzers für Fallback-Abfragen
    tier TEXT NOT NULL,        -- Aktive Tarifstufe: 'Starter', 'Pro', 'Enterprise'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index für ultraschnelle Suchen nach Email-Adresse erstellen
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON public.subscriptions(email);

-- Row Level Security (RLS) aktivieren (Optional, aber empfohlen)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Richtlinien (Policies) für Lese- und Schreibzugriff konfigurieren
-- Hinweis: Der Server nutzt den Service Role Key (Admin) zur sicheren Pflege, 
-- weshalb RLS-Einschränkungen für Endnutzer-Writes standardmäßig greifen.
CREATE POLICY "Eigene Abonnements anzeigen" ON public.subscriptions
    FOR SELECT USING (auth.uid()::text = user_id);
```

---

## 💳 3. Stripe Live-Integration & Webhook-Konfiguration

Zur Zahlungsabwicklung müssen Ihre Stripe-Produkte und der automatische Webhook mit der App gekoppelt werden.

### Schritt 3.1: Produkte und Tarife in Stripe anlegen
Erstellen Sie in Ihrem **Stripe Dashboard** (im Live- oder Testmodus) die folgenden Produkte und kopieren Sie deren **Preis-IDs** (z. B. `price_1Pabc...`):

1. **Starter Plan**
   - Intervall: Monatlich (z.B. 7 €) oder Jährlich
   - Kopieren Sie die ID für: `STRIPE_PRICE_ID_STARTER` (bzw. `STRIPE_PRICE_ID_STARTER_MONTHLY` / `STRIPE_PRICE_ID_STARTER_YEARLY`)
2. **Pro Edition**
   - Intervall: Monatlich (z.B. 29 €) oder Jährlich
   - Kopieren Sie die ID für: `STRIPE_PRICE_ID_PRO` (bzw. `STRIPE_PRICE_ID_PRO_MONTHLY` / `STRIPE_PRICE_ID_PRO_YEARLY`)
3. **Enterprise OS**
   - Intervall: Jährlich oder Individuell (z.B. 109 €)
   - Kopieren Sie die ID für: `STRIPE_PRICE_ID_ENTERPRISE`
4. **PDF-Export-Credits** (Einmalzahlung)
   - Kopieren Sie die ID für: `STRIPE_PRICE_ID_EXPORT_PDF`

### Schritt 3.2: Live Webhook einrichten
1. Gehen Sie im Stripe Dashboard auf **Entwickler > Webhooks**.
2. Klicken Sie auf **Endpunkt hinzufügen**.
3. Tragen Sie Ihre produktive App-URL mit folgendem Pfad ein:
   ```
   https://ihre-domain.com/api/stripe/webhook
   ```
4. Wählen Sie exakt die folgenden Events zur Übertragung aus:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Speichern Sie den Endpunkt und kopieren Sie das **Signatur-Geheimnis des Webhooks** (beginnt mit `whsec_...`).

---

## ⚙️ 4. Umgebungsvariablen (.env) konfigurieren

Um die Synchronisation zu aktivieren, tragen Sie diese Variablen in die Produktions-Umgebung (oder Ihre `.env` Datei im Root-Verzeichnis) ein.

> ⚠️ **HINWEIS:** VITE_-Variablen werden beim Build-Prozess statisch eingebunden. Stellen Sie sicher, dass diese bei Docker- oder Cloud Run Build-Prozeduren gesetzt sind.

```env
# ===================================================================
# 1. SUPABASE LIVE DATENBANK
# ===================================================================
# Client- & Serverzugriff (Dient zur Authentifizierung und Abfrage)
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-or-public-key"

# Server-Side-Sicherheit (Ermöglicht dem Server sicheres Schreiben)
SUPABASE_SECRET_KEY="your-supabase-service-role-key"

# ===================================================================
# 2. STRIPE INTEGRATION (PRODUKTIV / LIVE)
# ===================================================================
# Public Key für Checkout-Formulare im Client
VITE_STRIPE_PUBLISHABLE_KEY="pk_live_..."

# Secret Key für Backend API Calls
STRIPE_SECRET_KEY="sk_live_..."

# Webhook Secret zur kryptografischen Verifizierung der Pay-Events
STRIPE_WEBHOOK_SECRET="whsec_..."

# ===================================================================
# 3. STRIPE PRICE IDENTIFIERS
# ===================================================================
STRIPE_PRICE_ID_STARTER="price_..."
STRIPE_PRICE_ID_STARTER_MONTHLY="price_..."
STRIPE_PRICE_ID_STARTER_YEARLY="price_..."

STRIPE_PRICE_ID_PRO="price_..."
STRIPE_PRICE_ID_PRO_MONTHLY="price_..."
STRIPE_PRICE_ID_PRO_YEARLY="price_..."

STRIPE_PRICE_ID_ENTERPRISE="price_..."
STRIPE_PRICE_ID_EXPORT_PDF="price_..."
```

---

## 🚀 5. Starten und Go-Live testen

Sobald die Variablen eingepflegt sind, lädt die Applikation automatisch das Live-Abrechnungssystem:
1. Im **Abonnement-Tab** sehen Sie nun, dass alle Credentials als **"Aktiviert (Live)"** und der Verbindungsstatus als **"PROD BEREIT"** markiert sind.
2. Wenn ein Benutzer jetzt auf "Jetzt mit Stripe abonnieren" klickt, wird er direkt zu dem **echten, end-to-end SSL-verschlüsselten Stripe-Zahlungsfenster** weitergeleitet.
3. Nach erfolgreichem Checkout empfängt der Server das Webhook-Signal und aktualisiert den Benutzer-Status in Ihrer Supabase-Datenbank in Millisekunden auf die gewählte Stufe.
4. Der Benutzer wird automatisch freigeschaltet.

Für Rückfragen und Support zur Bereitstellung steht die Administrations-Konsole zur Verfügung.
