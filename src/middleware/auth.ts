import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

// Extend Express Request interface to include our custom user properties
export interface AuthenticatedRequest extends Request {
  user?: any;
  userEmail?: string;
}

// Lazy-initialized Supabase Client for token verification
let supabaseClient: any = null;

function getCleanValue(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^['"]|['"]$/g, '');
}

function getSupabase() {
  if (!supabaseClient) {
    const url = getCleanValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
    const key = getCleanValue(
      process.env.SUPABASE_SECRET_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.VITE_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY
    );
    if (url && key) {
      supabaseClient = createClient(url, key);
    }
  }
  return supabaseClient;
}

function isSupabaseConfigured(): boolean {
  const url = getCleanValue(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
  const key = getCleanValue(
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY
  );
  return !!(url && key);
}

/**
 * JWT Verification Middleware
 * Validates the Bearer token in the Authorization header against Supabase,
 * extracts the user's email, and populates req.user & req.userEmail.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader('Content-Type', 'application/json');

  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Nicht autorisiert. Kein Token bereitgestellt.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Nicht autorisiert. Ungültiges Token-Format.' });
  }

  // Official JWT verification via Supabase GoTrue
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase ist im Backend nicht konfiguriert.' });
    }
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
