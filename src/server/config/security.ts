import express from 'express';
import { getCleanEnv } from '../../../server/env';
import { isSupabaseConfigured, getServerSupabase } from '../../../server/db';
import { createLogger } from '../../../server/logger';

const securityLogger = createLogger('security');

const PRODUCTION_ORIGINS = [
  'https://capital-ai.online',
  'https://www.capital-ai.online',
];

const PROBE_PATH_PATTERNS = [
  /\.php$/i,
  /^\/wp-(admin|login|content|includes|json)(\/|$)/i,
  /^\/(config|wp-config)\.(php|json|ya?ml|ini)$/i,
  /^\/\.env(\.|$)/i,
  /^\/\.git(\/|$)/i,
  /^\/(phpinfo|info|test)\.php$/i,
];

function isLocalDevOrigin(origin: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

function isOriginAllowed(origin: string, isProduction: boolean): boolean {
  if (PRODUCTION_ORIGINS.includes(origin)) return true;
  if (!isProduction) {
    if (isLocalDevOrigin(origin)) return true;
    const aiStudioOrigin = getCleanEnv('AI_STUDIO_ORIGIN');
    if (aiStudioOrigin && origin === aiStudioOrigin) return true;
  }
  return false;
}

async function logBlockedOrigin(origin: string, req: express.Request): Promise<void> {
  securityLogger.warn('Blocked CORS Origin', {
    requestId: req.requestId,
    origin,
    path: req.originalUrl,
  });
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = getServerSupabase();
    const xff = req.headers['x-forwarded-for'];
    const ip = typeof xff === 'string'
      ? xff.split(',')[0].trim()
      : (req.socket?.remoteAddress || 'unknown');

    await supabase.from('security_events').insert({
      event_type: 'suspicious_request',
      ip_address: ip,
      user_agent: req.headers['user-agent'] || null,
      endpoint: req.originalUrl,
      outcome: 'blocked',
      reason: `Blocked CORS Origin: ${origin}`,
    });
  } catch (err: any) {
    securityLogger.error('security_events-Insert fehlgeschlagen', {
      requestId: req.requestId,
      error: err?.message || String(err),
    });
  }
}

export function installSecurityMiddleware(app: express.Express): void {
  const isProduction = getCleanEnv('NODE_ENV') === 'production';

  app.disable('x-powered-by');

  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin) {
      if (isOriginAllowed(origin, isProduction)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        void logBlockedOrigin(origin, req);
        if (req.method === 'OPTIONS') {
          return res.status(403).json({ error: 'Origin nicht erlaubt.' });
        }
      }
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, stripe-signature');

    if (req.method === 'OPTIONS') return res.sendStatus(200);

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');

    const frameAncestors = [
      "'self'",
      ...(!isProduction ? ['https://ai.studio', 'http://localhost:*'] : []),
    ].join(' ');

    const scriptSrc = isProduction
      ? "'self' https://*.stripe.com https://cdn.cookiehub.eu https://www.googletagmanager.com"
      : "'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com https://cdn.cookiehub.eu https://www.googletagmanager.com";

    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' https:; " +
      `script-src ${scriptSrc}; ` +
      "style-src 'self' https://fonts.googleapis.com https://cdn.cookiehub.eu; " +
      "img-src 'self' data: https: referrer; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "frame-src 'self' https://*.stripe.com; " +
      `frame-ancestors ${frameAncestors};`
    );

    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }

    next();
  });

  app.use((req, res, next) => {
    if (PROBE_PATH_PATTERNS.some((pattern) => pattern.test(req.path))) {
      return res.status(404).end();
    }
    next();
  });
}
