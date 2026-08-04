import express from 'express';
import Stripe from 'stripe';
import { getCleanEnv } from '../../../../server/env';
import { getStripeInstance, handleWebhookEvent } from '../../../../server/stripe';

export function registerStripeWebhookRoutes(app: express.Express): void {
  const webhookHandler = async (req: express.Request, res: express.Response) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = getCleanEnv('STRIPE_WEBHOOK_SECRET');

    if (!sig || !webhookSecret) {
      return res.status(400).send('Webhook Error: Missing signature or webhook secret.');
    }

    let event: Stripe.Event;
    try {
      event = getStripeInstance().webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      await handleWebhookEvent(event);
      return res.json({ received: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  };

  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), webhookHandler);
  app.post('/billing/webhook', express.raw({ type: 'application/json' }), webhookHandler);
}
