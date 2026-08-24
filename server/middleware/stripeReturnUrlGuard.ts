import type { NextFunction, Request, Response } from 'express';
import { isOriginAllowed } from './cors';

const STRIPE_RETURN_URL_ERROR = 'Ungültige Stripe-Rücksprung-URL.';

/**
 * Bind Stripe-controlled browser returns to the existing ADR-0009/CORS origin
 * authority instead of accepting an arbitrary client-supplied redirect target.
 *
 * This is deliberately a projection of the existing origin policy, not a second
 * allowlist. Production remains HTTPS-only. Non-production additionally follows
 * the localhost/127.0.0.1 allowance already defined by isOriginAllowed().
 */
export function normalizeStripeReturnUrl(value: unknown, isProduction: boolean): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(STRIPE_RETURN_URL_ERROR);
  }

  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new Error(STRIPE_RETURN_URL_ERROR);
  }

  if (parsed.username || parsed.password) {
    throw new Error(STRIPE_RETURN_URL_ERROR);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(STRIPE_RETURN_URL_ERROR);
  }

  if (isProduction && parsed.protocol !== 'https:') {
    throw new Error(STRIPE_RETURN_URL_ERROR);
  }

  if (!isOriginAllowed(parsed.origin, isProduction)) {
    throw new Error(STRIPE_RETURN_URL_ERROR);
  }

  return parsed.toString();
}

/**
 * Protect the two Stripe endpoints that hand a browser-return URL to Stripe.
 * The downstream stripeRouter keeps ownership of billing/payment semantics; this
 * middleware owns only validation and normalization of untrusted redirect input.
 */
export function stripeReturnUrlGuard(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'POST') return next();

  const isProduction = process.env.NODE_ENV === 'production';
  const body = req.body && typeof req.body === 'object' ? req.body : {};

  try {
    if (req.path === '/create-checkout-session') {
      req.body = {
        ...body,
        successUrl: normalizeStripeReturnUrl(body.successUrl, isProduction),
        cancelUrl: normalizeStripeReturnUrl(body.cancelUrl, isProduction),
      };
    } else if (req.path === '/create-portal-session') {
      req.body = {
        ...body,
        returnUrl: normalizeStripeReturnUrl(body.returnUrl, isProduction),
      };
    }
  } catch {
    return res.status(400).json({ error: STRIPE_RETURN_URL_ERROR });
  }

  return next();
}
