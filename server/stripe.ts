import express from 'express';
import Stripe from 'stripe';
import { getCleanEnv } from './env';
import {
  getSubscription,
  getLocalPdfCredits,
  saveLocalPdfCredits,
  isSupabaseConfigured
} from './db';
import { resolveVerifiedIdentity } from './iam/authMiddleware';
import { sendMail, buildSubscriptionActivatedEmail } from './mailer';

export const stripeRouter = express.Router();

let stripeClient: Stripe | null = null;

export function getStripeInstance() {
  if (!stripeClient) {
    const key = getCleanEnv('STRIPE_SECRET_KEY');
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is missing.');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

// 1. Stripe Checkout Session Creation
stripeRouter.post('/create-checkout-session', async (req, res) => {
  try {
    const { planId, billingPeriod, successUrl, cancelUrl, couponId } = req.body;
    let { email } = req.body;

    // Compliance-Review Punkt 4: Ein client-geliefertes userId wird NIE mehr
    // akzeptiert - auch nicht für Gast-Checkouts. Bei bestehender Session hat die
    // verifizierte Identität Vorrang; ohne Session bleibt userId in den Metadaten
    // leer, und der Webhook-Handler löst die tatsächliche User-ID beim
    // Checkout-Abschluss anhand der E-Mail auf (siehe handleWebhookEvent).
    // Das schließt auch das Restrisiko, dass jemand eine fremde user_id in die
    // Metadaten schreibt, vollständig statt nur teilweise.
    const identity = await resolveVerifiedIdentity(req);
    let userId = '';
    if (identity) {
      userId = identity.userId;
      email = identity.email || email;
    }
    
    // Select price ID based on selected plan and billing period
    const planUpper = String(planId).toUpperCase();
    let priceId = '';
    let mode: 'subscription' | 'payment' = 'subscription';

    const getStripeVar = (key: string): string => {
      const und = getCleanEnv(key);
      if (und) return und;
      const hyp = getCleanEnv(key.replace(/_/g, '-'));
      if (hyp) return hyp;
      return '';
    };
    
    if (planUpper === 'STARTER') {
      if (billingPeriod === 'yearly') {
        priceId = getStripeVar('STRIPE_PRICE_ID_STARTER_YEARLY');
      } else {
        priceId = getStripeVar('STRIPE_PRICE_ID_STARTER_MONTHLY') || getStripeVar('STRIPE_PRICE_ID_STARTER');
      }
    } else if (planUpper === 'PRO') {
      if (billingPeriod === 'yearly') {
        priceId = getStripeVar('STRIPE_PRICE_ID_PRO_YEARLY');
      } else {
        priceId = getStripeVar('STRIPE_PRICE_ID_PRO_MONTHLY') || getStripeVar('STRIPE_PRICE_ID_PRO');
      }
    } else if (planUpper === 'ENTERPRISE') {
      priceId = getStripeVar('STRIPE_PRICE_ID_ENTERPRISE');
    } else if (planUpper === 'FOUNDER') {
      priceId = getStripeVar('STRIPE_ID_FOUNDER') || getStripeVar('STRIPE_PRICE_ID_FOUNDER');
      mode = 'payment'; // One-time payment for lifetime!
    } else if (planUpper === 'PDF' || planUpper === 'PDF_EXPORT' || planUpper === 'EXPORT_PDF') {
      priceId = getStripeVar('STRIPE_PRICE_ID_EXPORT_PDF');
      mode = 'payment'; // One-time payment for 3 PDF exports!
    }

    if (!priceId || priceId.startsWith('price_...') || priceId.startsWith('prod_...')) {
      const envKeySuggested = planUpper === 'STARTER' 
        ? (billingPeriod === 'yearly' ? 'STRIPE_PRICE_ID_STARTER_YEARLY' : 'STRIPE_PRICE_ID_STARTER_MONTHLY')
        : planUpper === 'PRO'
        ? (billingPeriod === 'yearly' ? 'STRIPE_PRICE_ID_PRO_YEARLY' : 'STRIPE_PRICE_ID_PRO_MONTHLY')
        : planUpper === 'FOUNDER'
        ? 'STRIPE_ID_FOUNDER'
        : planUpper === 'PDF_EXPORT' || planUpper === 'EXPORT_PDF'
        ? 'STRIPE_PRICE_ID_EXPORT_PDF'
        : `STRIPE_PRICE_ID_${planUpper}`;

      return res.status(400).json({ 
        error: `Der Stripe Price ID für '${planId}' (${billingPeriod || 'einmalig'}) ist auf dem Server noch nicht konfiguriert. Bitte setzen Sie '${envKeySuggested}' in Ihrer .env Datei.` 
      });
    }

    const stripe = getStripeInstance();
    
    // Auto-append plan information to success URL for client fallback tracking
    const finalSuccessUrl = successUrl.includes('?') 
      ? `${successUrl}&plan=${planId}` 
      : `${successUrl}?plan=${planId}`;

    const sessionData: any = {
      mode: mode,
      customer_email: email,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: finalSuccessUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId || '',
        email: email || '',
        plan: planId,
        plan_id: planId,
        coupon_id: couponId || null
      }
    };

    if (couponId) {
      sessionData.discounts = [{ coupon: couponId }];
    } else {
      sessionData.allow_promotion_codes = true;
    }

    if (mode === 'subscription') {
      sessionData.subscription_data = {
        metadata: {
          user_id: userId || '',
          email: email || '',
          plan: planId,
          plan_id: planId,
          coupon_id: couponId || null
        }
      };
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    res.json({ sessionId: session.id, checkoutUrl: session.url });
  } catch (error: any) {
    console.error('Error creating Stripe checkout session:', error);
    res.status(500).json({ error: error.message || 'Serverfehler bei der Erstellung der Stripe Checkout Session.' });
  }
});

// Coupon Validation Endpoint for Coupon application feature
stripeRouter.post('/validate-coupon', async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Bitte geben Sie einen Gutscheincode ein.' });
  }

  const cleanCode = String(code).toUpperCase().trim();

  // 1. Check for standard sandbox / demo coupons first
  const demoCoupons: Record<string, { code: string, percent_off: number, description: string }> = {
    'WELCOME10': { code: 'WELCOME10', percent_off: 10, description: '10% Willkommensrabatt' },
    'SAVE10': { code: 'SAVE10', percent_off: 10, description: '10% Rabatt' },
    'PRODUKTIV20': { code: 'PRODUKTIV20', percent_off: 20, description: '20% Produktiv-Rabatt' },
    'SAVE20': { code: 'SAVE20', percent_off: 20, description: '20% Rabatt' },
    'SVENSPECIAL50': { code: 'SVENSPECIAL50', percent_off: 50, description: '50% Sven Sonder-Rabatt' },
    'SAVE50': { code: 'SAVE50', percent_off: 50, description: '50% Rabatt' },
    'FREE100': { code: 'FREE100', percent_off: 100, description: '100% Voll-Gratis Freischaltung' }
  };

  if (demoCoupons[cleanCode]) {
    return res.json({
      success: true,
      couponId: demoCoupons[cleanCode].code,
      code: demoCoupons[cleanCode].code,
      percent_off: demoCoupons[cleanCode].percent_off,
      description: demoCoupons[cleanCode].description,
      isDemo: true
    });
  }

  // 2. If Stripe is configured, check Stripe coupons or promo codes
  const hasStripe = !!getCleanEnv('STRIPE_SECRET_KEY');
  if (hasStripe) {
    try {
      const stripe = getStripeInstance();
      // Try listing promotion codes
      const promoCodes = await stripe.promotionCodes.list({
        code: cleanCode,
        active: true,
        limit: 1
      });

      if (promoCodes.data.length > 0) {
        const promo = promoCodes.data[0] as any;
        const coupon = promo.coupon;
        return res.json({
          success: true,
          couponId: coupon.id,
          code: promo.code,
          percent_off: coupon.percent_off || null,
          amount_off: coupon.amount_off || null,
          currency: coupon.currency || null,
          description: coupon.percent_off 
            ? `${coupon.percent_off}% Rabatt (Stripe)` 
            : coupon.amount_off 
            ? `${(coupon.amount_off / 100).toFixed(2)} ${String(coupon.currency).toUpperCase()} Rabatt (Stripe)`
            : 'Rabattcoupon angewendet',
          isDemo: false
        });
      }

      // Fallback: retrieve directly as a coupon ID
      try {
        const coupon = await stripe.coupons.retrieve(code.trim());
        if (coupon && coupon.valid) {
          return res.json({
            success: true,
            couponId: coupon.id,
            code: coupon.id,
            percent_off: coupon.percent_off || null,
            amount_off: coupon.amount_off || null,
            currency: coupon.currency || null,
            description: coupon.percent_off 
              ? `${coupon.percent_off}% Rabatt (Stripe)` 
              : coupon.amount_off 
              ? `${(coupon.amount_off / 100).toFixed(2)} ${String(coupon.currency).toUpperCase()} Rabatt (Stripe)`
              : 'Rabattcoupon angewendet',
            isDemo: false
          });
        }
      } catch (err) {}

    } catch (error: any) {
      console.warn('Stripe coupon retrieval failed, but checking for local support:', error.message || error);
    }
  }

  return res.status(404).json({ error: 'Gutscheincode ist ungültig, abgelaufen oder nicht konfiguriert.' });
});

// 2. Stripe & DB Configuration Status Info Endpoint
stripeRouter.get('/config-status', (req, res) => {
  const sk = getCleanEnv('STRIPE_SECRET_KEY');
  const pk = getCleanEnv('STRIPE_PUBLISHABLE_KEY') || getCleanEnv('VITE_STRIPE_PUBLISHABLE_KEY');
  const wh = getCleanEnv('STRIPE_WEBHOOK_SECRET');
  
  res.json({
    secretKeyConfigured: !!sk && !sk.startsWith('sk_test_...'),
    publishableKeyConfigured: !!pk && !pk.startsWith('pk_test_...'),
    webhookSecretConfigured: !!wh && !wh.startsWith('whsec_...'),
    dbConfigured: isSupabaseConfigured()
  });
});

// 3. Retrieve stripe public key
stripeRouter.get('/config', (req, res) => {
  const pk = getCleanEnv('STRIPE_PUBLISHABLE_KEY') || getCleanEnv('VITE_STRIPE_PUBLISHABLE_KEY') || 'pk_test_placeholder';
  res.json({ publishableKey: pk });
});

// 4. Create Stripe Customer Billing Portal session
// ADR-0003.5: Vormals wurde die zu suchende/erstellende Stripe-Customer-E-Mail direkt
// aus dem Request-Body übernommen - jeder konnte damit eine echte Billing-Portal-Session
// (Zahlungsmethoden, Rechnungen, Abo-Verwaltung) für eine BELIEBIGE E-Mail-Adresse anfordern.
// Identität kommt jetzt ausschließlich aus dem verifizierten Bearer-Token.
stripeRouter.post('/create-portal-session', async (req, res) => {
  try {
    const identity = await resolveVerifiedIdentity(req);
    if (!identity || !identity.email) {
      return res.status(401).json({ error: 'Authentifizierung erforderlich.' });
    }
    const { returnUrl } = req.body;
    const stripe = getStripeInstance();
    const origin = req.headers.origin || `http://localhost:3000`;

    const customers = await stripe.customers.list({
      email: identity.email,
      limit: 1,
    });

    let customerId = '';
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create fresh customer if none exists
      const customer = await stripe.customers.create({
        email: identity.email,
        metadata: {
          user_id: identity.userId,
        }
      });
      customerId = customer.id;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || origin,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating billing portal session:', error);
    res.status(500).json({ error: error.message || 'Serverfehler beim Erstellen der Portal-Sitzung.' });
  }
});

// 5. Query user subscription tier
//
// ADR-0003.5: Vormals nahm dieser Endpunkt userId/email direkt aus der Query entgegen -
// ohne jede Prüfung, ob der Aufrufer tatsächlich dieser User ist (IDOR: jeder konnte den
// Abo-Status JEDES beliebigen Kontos abfragen, inkl. des durch den kaputten
// isOwnerIdentifier()-Fallback fälschlich als 'Enterprise' auflösenden Owner-Accounts).
// Identität kommt jetzt ausschließlich aus dem verifizierten Bearer-Token.
stripeRouter.get('/user-subscription', async (req, res) => {
  const identity = await resolveVerifiedIdentity(req);
  if (!identity) {
    return res.status(401).json({ error: 'Authentifizierung erforderlich.' });
  }

  const tier = await getSubscription(identity.userId);
  res.json({ userId: identity.userId, email: identity.email, subscriptionTier: tier });
});

// 6. PDF Credits management
// ADR-0003.5: gleiche IDOR-Klasse wie oben - identifier kam vorher ungeprüft vom Client
// und erlaubte, die PDF-Credits JEDES Kontos abzufragen bzw. zu verbrauchen.
stripeRouter.get('/pdf-credits', async (req, res) => {
  const identity = await resolveVerifiedIdentity(req);
  if (!identity) {
    return res.status(401).json({ error: 'Authentifizierung erforderlich.' });
  }

  const tier = await getSubscription(identity.userId);
  const isUnlimited = tier === 'Enterprise';
  const credits = await getLocalPdfCredits(identity.userId);
  res.json({ credits, unlimited: isUnlimited });
});

stripeRouter.post('/consume-pdf-credit', async (req, res) => {
  const identity = await resolveVerifiedIdentity(req);
  if (!identity) {
    return res.status(401).json({ error: 'Authentifizierung erforderlich.' });
  }
  const identifier = identity.userId;

  const tier = await getSubscription(identifier);
  const isUnlimited = tier === 'Enterprise';

  if (isUnlimited) {
    return res.json({ success: true, credits: 9999, unlimited: true });
  }
  
  const current = await getLocalPdfCredits(identifier);
  if (current <= 0) {
    return res.status(402).json({ error: 'Sie haben keine PDF-Export-Credits mehr übrig. Bitte erwerben Sie neue Credits oder wechseln Sie zum Pro/Enterprise-Plan.' });
  }
  
  const newCredits = current - 1;
  saveLocalPdfCredits(identifier, newCredits);
  res.json({ success: true, credits: newCredits, unlimited: false });
});



// Compliance-Review Punkt 4: löst eine E-Mail-Adresse zur echten Supabase-User-ID auf,
// über die service_role-only View internal_user_lookup (siehe Migration
// create_internal_user_lookup_view). Nötig, weil supabase-js kein zuverlässiges
// getUserByEmail() bietet (listUsers() paginiert nur, kein Email-Filter).
async function resolveUserIdByEmail(email: string): Promise<string | null> {
  if (!isSupabaseConfigured() || !email) return null;
  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from('internal_user_lookup')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();
    if (error || !data) return null;
    return data.id;
  } catch {
    return null;
  }
}

// 7. Core Webhook handling logic
export const handleWebhookEvent = async (event: Stripe.Event) => {
  console.log(`ℹ️ [Webhook Router] Received Stripe event: ${event.type}`);
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const planId = session.metadata?.plan_id || session.metadata?.planId || 'Free';
    const email = session.metadata?.email || session.customer_details?.email || '';
    let userId = session.metadata?.user_id || session.metadata?.userId || '';

    // Gast-Checkout (keine Session bei Kaufstart): userId war zum Schutz vor
    // Metadaten-Manipulation absichtlich leer (siehe create-checkout-session).
    // Jetzt, nach erfolgreicher Zahlung, per E-Mail auflösen.
    if (!userId && email) {
      const resolved = await resolveUserIdByEmail(email);
      if (resolved) {
        userId = resolved;
        console.log(`ℹ️ [Webhook Router] Gast-Checkout: user_id für ${email} nachträglich aufgelöst.`);
      } else {
        console.warn(`⚠️ [Webhook Router] Gast-Checkout: keine passende User-ID für ${email} gefunden (Konto evtl. noch nicht registriert).`);
      }
    }
    
    if (userId && planId) {
      const planUpper = String(planId).toUpperCase();
      if (planUpper === 'PDF' || planUpper === 'PDF_EXPORT' || planUpper === 'EXPORT_PDF') {
        const identifier = userId || email;
        const currentCredits = await getLocalPdfCredits(identifier);
        const newCredits = currentCredits + 3;
        saveLocalPdfCredits(identifier, newCredits);
        console.log(`✅ [Webhook Router] PDF Export Purchase complete for ${identifier}. Added 3 credits (total: ${newCredits}).`);
      } else {
        // Der eigentliche Abo-Tarif wird NICHT mehr hier gesetzt - das übernimmt
        // seit der Supabase-Stripe-Synchronisation der DB-Trigger
        // sync_stripe_subscription_to_public() auf stripe.subscriptions (Single
        // Source of Truth, siehe COMPLIANCE_REVIEW.md). Dieser Zweig löst nur noch
        // die Aktivierungs-E-Mail aus - fire-and-forget, blockiert die
        // Webhook-Antwort nicht und lässt sie bei Fehlschlag nicht scheitern.
        console.log(`✅ [Webhook Router] Checkout abgeschlossen für ${userId} (${email}), Plan ${planId}. Tarif-Synchronisation läuft über stripe.subscriptions-Trigger.`);
        if (email) {
          const { subject, html } = buildSubscriptionActivatedEmail(planId, email);
          sendMail({ to: email, subject, html }).catch((err) => {
            console.error('[Webhook Router] Aktivierungs-E-Mail fehlgeschlagen:', err);
          });
        }
        // Interne Benachrichtigung an den Owner bei jedem abgeschlossenen Abo,
        // unabhängig davon ob die Kunden-Mail oben erfolgreich war oder nicht.
        sendMail({
          to: 'sven.kulessa@gmail.com',
          subject: `Neues Abo aktiviert: ${planId} (${email || userId})`,
          html: `
            <div style="font-family: sans-serif;">
              <h3>Neue Abo-Aktivierung</h3>
              <ul>
                <li><strong>Plan:</strong> ${planId}</li>
                <li><strong>E-Mail:</strong> ${email || '(unbekannt)'}</li>
                <li><strong>User-ID:</strong> ${userId}</li>
                <li><strong>Stripe Checkout Session:</strong> ${session.id}</li>
              </ul>
            </div>
          `,
        }).catch((err) => {
          console.error('[Webhook Router] Interne Owner-Benachrichtigung fehlgeschlagen:', err);
        });
      }
    } else {
      console.warn('⚠️ [Webhook Router] checkout.session.completed received but missing user_id or plan_id in metadata:', session.metadata);
    }
  }
  // customer.subscription.updated / customer.subscription.deleted werden nicht mehr
  // hier verarbeitet. Diese Zweige riefen zuvor saveSubscription() mit
  // subscription.metadata.user_id auf - das erforderte, dass Stripe-Metadata
  // zuverlässig auf das Subscription-Objekt propagiert wird, was insbesondere bei
  // manuell im Dashboard geänderten Abos (z.B. Coupon nachträglich angewendet)
  // nicht garantiert war und zu der stillen "public.subscriptions bleibt auf Free"-
  // Diskrepanz führte (siehe Compliance-Review). Die Supabase-Stripe-Synchronisation
  // (Edge Function -> stripe.subscriptions -> Trigger sync_stripe_subscription_to_public())
  // ist jetzt die alleinige, zuverlässigere Quelle für Tarif-Änderungen und
  // Kündigungen. Dieser Express-Webhook bleibt nur noch für Checkout-Abschluss
  // (PDF-Credits, Aktivierungs-E-Mail) zuständig.
};
