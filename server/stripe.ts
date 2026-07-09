import express from 'express';
import Stripe from 'stripe';
import { getCleanEnv } from './env';
import {
  saveSubscription,
  getSubscription,
  getLocalPdfCredits,
  saveLocalPdfCredits
} from './db';

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
    const { planId, email, userId, billingPeriod, successUrl, cancelUrl, couponId } = req.body;
    
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

// 2. Stripe Configuration Status Info Endpoint
stripeRouter.get('/config-status', (req, res) => {
  const sk = getCleanEnv('STRIPE_SECRET_KEY');
  const pk = getCleanEnv('STRIPE_PUBLISHABLE_KEY') || getCleanEnv('VITE_STRIPE_PUBLISHABLE_KEY');
  const wh = getCleanEnv('STRIPE_WEBHOOK_SECRET');
  
  res.json({
    secretKeyConfigured: !!sk && !sk.startsWith('sk_test_...'),
    publishableKeyConfigured: !!pk && !pk.startsWith('pk_test_...'),
    webhookSecretConfigured: !!wh && !wh.startsWith('whsec_...'),
  });
});

// 3. Retrieve stripe public key
stripeRouter.get('/config', (req, res) => {
  const pk = getCleanEnv('STRIPE_PUBLISHABLE_KEY') || getCleanEnv('VITE_STRIPE_PUBLISHABLE_KEY') || 'pk_test_placeholder';
  res.json({ publishableKey: pk });
});

// 4. Create Stripe Customer Billing Portal session
stripeRouter.post('/create-portal-session', async (req, res) => {
  try {
    const { email, userId, returnUrl } = req.body;
    const stripe = getStripeInstance();
    const origin = req.headers.origin || `http://localhost:3000`;

    // Try finding customer via email as backup, but prioritize userId-based workflows
    const lookupKey = email || '';
    const customers = await stripe.customers.list({
      email: lookupKey,
      limit: 1,
    });

    let customerId = '';
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create fresh customer if none exists
      const customer = await stripe.customers.create({
        email: lookupKey,
        metadata: {
          user_id: userId || '',
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

// 5. Query user subscription tier (strictly supports user_id query)
stripeRouter.get('/user-subscription', async (req, res) => {
  const { userId, email } = req.query;
  if (!userId && !email) {
    return res.status(400).json({ error: 'userId or email parameter is required.' });
  }
  
  let tier = 'Free';
  if (userId) {
    tier = await getSubscription(String(userId));
  } else if (email) {
    tier = await getSubscription(String(email));
  }
  
  res.json({ userId, email, subscriptionTier: tier });
});

// 6. PDF Credits management
stripeRouter.get('/pdf-credits', async (req, res) => {
  const { email, userId } = req.query;
  const identifier = String(userId || email || '').toLowerCase().trim();
  if (!identifier) {
    return res.status(400).json({ error: 'userId or email is required.' });
  }
  
  // Enterprise tier gets unlimited credits, Starter / Pro / Free get finite credits
  let isUnlimited = false;
  if (userId) {
    const tier = await getSubscription(String(userId));
    isUnlimited = (tier === 'Enterprise');
  } else if (email) {
    const tier = await getSubscription(String(email));
    isUnlimited = (tier === 'Enterprise');
  }
  
  const credits = getLocalPdfCredits(identifier);
  res.json({ credits, unlimited: isUnlimited });
});

stripeRouter.post('/consume-pdf-credit', async (req, res) => {
  const { email, userId } = req.body;
  const identifier = String(userId || email || '').toLowerCase().trim();
  if (!identifier) {
    return res.status(400).json({ error: 'userId or email is required.' });
  }
  
  let isUnlimited = false;
  if (userId) {
    const tier = await getSubscription(String(userId));
    isUnlimited = (tier === 'Enterprise');
  } else if (email) {
    const tier = await getSubscription(String(email));
    isUnlimited = (tier === 'Enterprise');
  }
  
  if (isUnlimited) {
    return res.json({ success: true, credits: 9999, unlimited: true });
  }
  
  const current = getLocalPdfCredits(identifier);
  if (current <= 0) {
    return res.status(402).json({ error: 'Sie haben keine PDF-Export-Credits mehr übrig. Bitte erwerben Sie neue Credits oder wechseln Sie zum Pro/Enterprise-Plan.' });
  }
  
  const newCredits = current - 1;
  saveLocalPdfCredits(identifier, newCredits);
  res.json({ success: true, credits: newCredits, unlimited: false });
});



// 7. Core Webhook handling logic
export const handleWebhookEvent = async (event: Stripe.Event) => {
  console.log(`ℹ️ [Webhook Router] Received Stripe event: ${event.type}`);
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const planId = session.metadata?.plan_id || session.metadata?.planId || 'Free';
    const userId = session.metadata?.user_id || session.metadata?.userId || '';
    const email = session.metadata?.email || session.customer_details?.email || '';
    
    if (userId && planId) {
      const planUpper = String(planId).toUpperCase();
      if (planUpper === 'PDF' || planUpper === 'PDF_EXPORT' || planUpper === 'EXPORT_PDF') {
        const identifier = userId || email;
        const currentCredits = getLocalPdfCredits(identifier);
        const newCredits = currentCredits + 3;
        saveLocalPdfCredits(identifier, newCredits);
        console.log(`✅ [Webhook Router] PDF Export Purchase complete for ${identifier}. Added 3 credits (total: ${newCredits}).`);
      } else {
        const stripeSubscriptionId = typeof session.subscription === 'string'
          ? session.subscription
          : session.subscription?.id || null;
        await saveSubscription(userId, planId, email, {
          stripeSubscriptionId,
          status: 'active',
        });
        console.log(`✅ [Webhook Router] User ID ${userId} (${email}) successfully upgraded to ${planId}`);
      }
    } else {
      console.warn('⚠️ [Webhook Router] checkout.session.completed received but missing user_id or plan_id in metadata:', session.metadata);
    }
  } else if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.user_id || subscription.metadata?.userId;
    const email = subscription.metadata?.email || '';
    const planId = subscription.metadata?.plan_id || subscription.metadata?.planId;
    if (userId && planId) {
      const currentPeriodEnd = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null;
      await saveSubscription(userId, planId, email, {
        stripeSubscriptionId: subscription.id,
        status: subscription.status === 'active' || subscription.status === 'trialing' ? 'active' : subscription.status,
        currentPeriodEnd,
      });
    }
  } else if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata?.user_id || subscription.metadata?.userId;
    const email = subscription.metadata?.email || '';
    if (userId) {
      await saveSubscription(userId, 'Free', email, {
        stripeSubscriptionId: null,
        status: 'canceled',
        currentPeriodEnd: null,
      });
    }
  }
};
