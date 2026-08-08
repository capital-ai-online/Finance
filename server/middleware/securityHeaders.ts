import type { RequestHandler } from 'express';

/**
 * ADR-0009 security-header policy extracted from server.ts.
 *
 * This module is deliberately side-effect free. The active server entry point is
 * not switched in this phase so the extraction can be reviewed independently
 * from the ordering-sensitive middleware cutover.
 */
export interface SecurityHeaderPolicyOptions {
  isProduction: boolean;
}

export function buildFrameAncestors(isProduction: boolean): string {
  return [
    "'self'",
    ...(!isProduction ? ['https://ai.studio', 'http://localhost:*'] : []),
  ].join(' ');
}

export function buildScriptSrc(isProduction: boolean): string {
  return isProduction
    ? "'self' https://*.stripe.com https://cdn.cookiehub.eu https://www.googletagmanager.com"
    : "'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://cdn.cookiehub.eu https://www.googletagmanager.com";
}

export function buildContentSecurityPolicy(isProduction: boolean): string {
  const frameAncestors = buildFrameAncestors(isProduction);
  const scriptSrc = buildScriptSrc(isProduction);

  return (
    "default-src 'self' https:; " +
    `script-src ${scriptSrc}; ` +
    "style-src 'self' https://fonts.googleapis.com https://cdn.cookiehub.eu; " +
    "img-src 'self' data: https: referrer; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "frame-src 'self' https://*.stripe.com; " +
    `frame-ancestors ${frameAncestors};`
  );
}

export function createSecurityHeadersMiddleware(
  options: SecurityHeaderPolicyOptions,
): RequestHandler {
  const contentSecurityPolicy = buildContentSecurityPolicy(options.isProduction);

  return (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Content-Security-Policy', contentSecurityPolicy);

    if (options.isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    next();
  };
}
