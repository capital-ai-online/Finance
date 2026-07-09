import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { getCleanEnv } from './env';

// Lazy-loaded Server-side Supabase Client instance
let serverSupabaseClient: any = null;

export function isSupabaseConfigured(): boolean {
  const url = getCleanEnv('SUPABASE_URL') || getCleanEnv('VITE_SUPABASE_URL');
  const key = getCleanEnv('SUPABASE_SECRET_KEY') || getCleanEnv('SUPABASE_SERVICE_ROLE_KEY') || getCleanEnv('VITE_SUPABASE_PUBLISHABLE_KEY') || getCleanEnv('SUPABASE_PUBLISHABLE_KEY') || getCleanEnv('VITE_SUPABASE_ANON_KEY') || getCleanEnv('SUPABASE_ANON_KEY');
  return !!(url && key);
}

export function getServerSupabase() {
  if (!serverSupabaseClient) {
    const url = getCleanEnv('SUPABASE_URL') || getCleanEnv('VITE_SUPABASE_URL');
    const key = getCleanEnv('SUPABASE_SECRET_KEY') || getCleanEnv('SUPABASE_SERVICE_ROLE_KEY') || getCleanEnv('VITE_SUPABASE_PUBLISHABLE_KEY') || getCleanEnv('SUPABASE_PUBLISHABLE_KEY') || getCleanEnv('VITE_SUPABASE_ANON_KEY') || getCleanEnv('SUPABASE_ANON_KEY');
    if (!url || !key) {
      throw new Error('Supabase integration variables are missing.');
    }
    serverSupabaseClient = createClient(url, key);
  }
  return serverSupabaseClient;
}

const LOCAL_SUBS_FILE = path.join(process.cwd(), 'uploads', 'subscriptions.json');

export function getLocalSubscriptions(): Record<string, string> {
  try {
    if (fs.existsSync(LOCAL_SUBS_FILE)) {
      const data = fs.readFileSync(LOCAL_SUBS_FILE, 'utf8');
      return JSON.parse(data) || {};
    }
  } catch (e) {
    console.warn("[Local Database Fallback] Error reading local subscriptions file:", e);
  }
  return {};
}

export function saveLocalSubscription(userIdentifier: string, tier: string) {
  try {
    const subs = getLocalSubscriptions();
    subs[userIdentifier.toLowerCase().trim()] = tier;
    const dir = path.dirname(LOCAL_SUBS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_SUBS_FILE, JSON.stringify(subs, null, 2), 'utf8');
    console.log(`[Local Database Fallback] Persisted ${userIdentifier} -> ${tier} locally.`);
  } catch (e) {
    console.error("[Local Database Fallback] Error writing local subscriptions file:", e);
  }
}

/**
 * Persists the subscription tier linked exclusively with the user's UUID (user_id).
 * The email is stored for secondary reference, but never used as the key.
 */
export async function saveSubscription(userId: string, tier: string, email: string) {
  const cleanUserId = userId.trim();
  const cleanEmail = email.toLowerCase().trim();
  
  // Save locally first using userId as the primary key
  saveLocalSubscription(cleanUserId, tier);
  if (cleanEmail) {
    saveLocalSubscription(cleanEmail, tier); // backwards compatibility cache
  }

  if (!isSupabaseConfigured()) {
    console.log(`[Supabase Backend] Supabase not configured. Saved subscription locally for userId: ${cleanUserId} -> ${tier}`);
    return;
  }

  try {
    const supabaseClientInstance = getServerSupabase();
    // Primary: Upsert based on the strict unique identifier 'user_id'
    const { error } = await supabaseClientInstance
      .from('subscriptions')
      .upsert({ 
        user_id: cleanUserId, 
        email: cleanEmail, 
        tier, 
        updated_at: new Date().toISOString() 
      }, { onConflict: 'user_id' });
      
    if (error) {
      console.warn(`[Supabase Backend] Note: Remote DB upsert by user_id failed (${error.message || JSON.stringify(error)}). Trying email-based fallback for old tables...`);
      // Fallback: Support old schema versions until migration updates
      const { error: fallbackError } = await supabaseClientInstance
        .from('subscriptions')
        .upsert({ 
          email: cleanEmail, 
          tier, 
          user_id: cleanUserId,
          updated_at: new Date().toISOString() 
        }, { onConflict: 'email' });
        
      if (fallbackError) {
        console.warn(`[Supabase Backend] Both upsert strategies failed. Fallback to local storage: ${fallbackError.message}`);
      } else {
        console.log(`[Supabase Backend] Successfully persisted subscription with email fallback conflict key: ${cleanEmail} -> ${tier}`);
      }
    } else {
      console.log(`[Supabase Backend] Successfully persisted subscription to remote DB: userId ${cleanUserId} -> ${tier}`);
    }
  } catch (e: any) {
    console.warn("[Supabase Backend] Error in saveSubscription remote upsert, using local:", e.message || e);
  }
}

/**
 * Retrieves the active subscription tier strictly by user_id (UUID).
 */
export async function getSubscription(userIdOrEmail: string): Promise<string> {
  const cleanKey = userIdOrEmail.trim();

  // Handle owner emails bypass for direct enterprise privileges
  const cleanLower = cleanKey.toLowerCase();
  if (cleanLower === 'sven.kulessa@gmail.com' || cleanLower === 'sven.kulessa@gmx.net') {
    return 'Enterprise';
  }

  // Check local fallback first
  const localSubs = getLocalSubscriptions();
  const localTier = localSubs[cleanLower] || localSubs[cleanKey];

  if (!isSupabaseConfigured()) {
    return localTier || 'Free';
  }

  try {
    const supabaseClientInstance = getServerSupabase();
    
    // Is it a UUID? If it's not an email, it's a UUID. Let's query by user_id first.
    const isEmail = cleanKey.includes('@');
    
    if (!isEmail) {
      const { data, error } = await supabaseClientInstance
        .from('subscriptions')
        .select('tier')
        .eq('user_id', cleanKey)
        .maybeSingle();
        
      if (!error && data && data.tier) {
        if (localTier !== data.tier) {
          saveLocalSubscription(cleanKey, data.tier);
        }
        return data.tier;
      }
    } else {
      // Legacy email-based query fallback
      const { data, error } = await supabaseClientInstance
        .from('subscriptions')
        .select('tier')
        .eq('email', cleanLower)
        .maybeSingle();
        
      if (!error && data && data.tier) {
        if (localTier !== data.tier) {
          saveLocalSubscription(cleanLower, data.tier);
        }
        return data.tier;
      }
    }
  } catch (e: any) {
    console.log("[Supabase Backend] Connection error in getSubscription, using local file fallback:", e.message || e);
  }
  
  return localTier || 'Free';
}

// PDF Export Credits Tracking & Management APIs
const LOCAL_PDF_CREDITS_FILE = path.join(process.cwd(), 'uploads', 'pdf_credits.json');

export function getLocalPdfCredits(userIdentifier: string): number {
  try {
    const cleanId = userIdentifier.toLowerCase().trim();
    if (cleanId === 'sven.kulessa@gmail.com' || cleanId === 'sven.kulessa@gmx.net') {
      return 999999; // Admin/Owner unlimited credits bypass
    }
    if (fs.existsSync(LOCAL_PDF_CREDITS_FILE)) {
      const data = fs.readFileSync(LOCAL_PDF_CREDITS_FILE, 'utf8');
      const creditsObj = JSON.parse(data) || {};
      if (creditsObj[cleanId] !== undefined) {
        return Number(creditsObj[cleanId]);
      }
    }
  } catch (e) {
    console.warn("[Local PDF Credits] Error reading PDF credits:", e);
  }
  return 3; // Default initial credits is 3
}

export function saveLocalPdfCredits(userIdentifier: string, credits: number) {
  try {
    const cleanId = userIdentifier.toLowerCase().trim();
    const dir = path.dirname(LOCAL_PDF_CREDITS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    let creditsObj: Record<string, number> = {};
    if (fs.existsSync(LOCAL_PDF_CREDITS_FILE)) {
      const data = fs.readFileSync(LOCAL_PDF_CREDITS_FILE, 'utf8');
      creditsObj = JSON.parse(data) || {};
    }
    creditsObj[cleanId] = credits;
    fs.writeFileSync(LOCAL_PDF_CREDITS_FILE, JSON.stringify(creditsObj, null, 2), 'utf8');
  } catch (e) {
    console.error("[Local PDF Credits] Error saving PDF credits:", e);
  }
}
