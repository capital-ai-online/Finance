/**
 * Authentication & authorization middleware.
 *
 * Fixes two previously open gaps:
 *  1. Stripe billing endpoints accepted a client-supplied email with no
 *     server-side verification — requireAuth() verifies the Supabase JWT
 *     and derives the email from the verified token, never from the body.
 *  2. /api/orchestrator/* (internal request logs incl. IPs, live rate-limit
 *     config) had NO authentication at all and was reachable by anyone.
 *     requireAdmin() locks these down to the hardcoded Enterprise owner
 *     account and any user whose verified subscriptionTier is 'Enterprise'.
 */

import type { Request, Response, NextFunction } from 'express';

const OWNER_EMAIL = 'sven.kulessa@gmail.com';

export interface AuthedRequest extends Request {
  authUser?: { id: string; email: string };
}

/**
 * Verifies the Supabase JWT sent via `Authorization: Bearer <token>` and
 * attaches the verified user to req.authUser. Use this instead of trusting
 * any client-supplied email/userId field.
 */
export function requireAuth(getServerSupabase: () => any) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization || '';
      const token = header.startsWith('Bearer ') ? header.slice(7) : null;

      if (!token) {
        return res.status(401).json({ error: 'Nicht authentifiziert. Bearer-Token fehlt.' });
      }

      const supabase = getServerSupabase();
      const { data, error } = await supabase.auth.getUser(token);

      if (error || !data?.user?.email) {
        return res.status(401).json({ error: 'Ungültiges oder abgelaufenes Token.' });
      }

      req.authUser = { id: data.user.id, email: data.user.email.toLowerCase().trim() };
      next();
    } catch (err: any) {
      res.status(401).json({ error: 'Authentifizierung fehlgeschlagen.', detail: err.message });
    }
  };
}

/**
 * Restricts a route to the platform owner / Enterprise-tier accounts.
 * Must run AFTER requireAuth() so req.authUser is populated.
 */
export function requireAdmin(getSubscription: (email: string) => Promise<string>) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const email = req.authUser?.email;
    if (!email) {
      return res.status(401).json({ error: 'Nicht authentifiziert.' });
    }
    if (email === OWNER_EMAIL) {
      return next();
    }
    try {
      const tier = await getSubscription(email);
      if (tier === 'Enterprise') {
        return next();
      }
    } catch {
      // fall through to deny
    }
    return res.status(403).json({
      error: 'Zugriff verweigert.',
      message: 'Dieser Endpunkt ist auf Enterprise-Konten und den Plattform-Owner beschränkt.',
    });
  };
}
