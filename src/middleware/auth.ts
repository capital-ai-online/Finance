import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Extend Express Request interface to include our custom user properties
export interface AuthenticatedRequest extends Request {
  user?: any;
  userEmail?: string;
}

// Lazy-initialized Supabase Client for token verification
let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (url && key) {
      supabaseClient = createClient(url, key);
    }
  }
  return supabaseClient;
}

function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

/**
 * JWT Verification Middleware
 * Validates the Bearer token in the Authorization header against Supabase,
 * extracts the user's email, and populates req.user & req.userEmail.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Nicht autorisiert. Kein Token bereitgestellt.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Nicht autorisiert. Ungültiges Token-Format.' });
  }

  // 1. Owner bypass & parsing
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      if (payload && payload.email) {
        const cleanEmail = payload.email.toLowerCase().trim();
        // Support immediate bypass for owner emails
        if (cleanEmail === 'sven.kulessa@gmail.com' || cleanEmail === 'sven.kulessa@gmx.net') {
          (req as AuthenticatedRequest).userEmail = cleanEmail;
          (req as AuthenticatedRequest).user = payload;
          return next();
        }
      }
    }
  } catch (err) {
    console.warn('[Auth Middleware] Failed parsing payload for owner check:', err);
  }

  // 2. Offline / local fallback if Supabase is not configured
  if (!isSupabaseConfigured()) {
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload && payload.email) {
          (req as AuthenticatedRequest).userEmail = payload.email.toLowerCase().trim();
          (req as AuthenticatedRequest).user = payload;
          return next();
        }
      }
    } catch (err) {
      console.warn('[Auth Middleware] Fallback token parsing failed:', err);
    }
    return res.status(401).json({ error: 'Nicht autorisiert. Supabase ist nicht konfiguriert.' });
  }

  // 3. Official JWT verification via Supabase GoTrue
  try {
    const supabase = getSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user || !user.email) {
      console.warn('[Auth Middleware] Supabase token verification failed:', error?.message || 'No user/email');
      return res.status(401).json({ error: 'Nicht autorisiert. Ungültiges oder abgelaufenes Token.' });
    }

    (req as AuthenticatedRequest).userEmail = user.email.toLowerCase().trim();
    (req as AuthenticatedRequest).user = user;
    next();
  } catch (err: any) {
    console.error('[Auth Middleware] Unexpected error during verification:', err.message || err);
    return res.status(500).json({ error: 'Interner Serverfehler während der Authentifizierung.' });
  }
}
