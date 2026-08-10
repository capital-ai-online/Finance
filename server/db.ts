import { createClient } from '@supabase/supabase-js';
import path from 'path';
import fs from 'fs';
import { getCleanEnv } from './env';

// Issue #92 / ADR-0043: privileged server access and RLS-bound access are separate contracts.
// A privileged client may ONLY use a Supabase secret/service-role credential. It must never
// silently downgrade to a publishable/anon key because that makes authorization semantics
// environment-dependent and can turn privileged writes into partial/fallback behavior.
let privilegedSupabaseClient: any = null;
let rlsSupabaseClient: any = null;

function getSupabaseUrl(): string {
  return getCleanEnv('SUPABASE_URL') || getCleanEnv('VITE_SUPABASE_URL');
}

function getPrivilegedSupabaseKey(): string {
  return getCleanEnv('SUPABASE_SECRET_KEY') || getCleanEnv('SUPABASE_SERVICE_ROLE_KEY');
}

function getPublishableSupabaseKey(): string {
  return getCleanEnv('SUPABASE_PUBLISHABLE_KEY')
    || getCleanEnv('VITE_SUPABASE_PUBLISHABLE_KEY')
    || getCleanEnv('SUPABASE_ANON_KEY')
    || getCleanEnv('VITE_SUPABASE_ANON_KEY');
}

function isProduction(): boolean {
  return getCleanEnv('NODE_ENV') === 'production';
}

export function isPrivilegedSupabaseConfigured(): boolean {
  return !!(getSupabaseUrl() && getPrivilegedSupabaseKey());
}

export function isRlsSupabaseConfigured(): boolean {
  return !!(getSupabaseUrl() && getPublishableSupabaseKey());
}

/**
 * Backwards-compatible server contract. Existing server call sites are privileged operations,
 * so "configured" now means that elevated server credentials are actually available.
 */
export function isSupabaseConfigured(): boolean {
  return isPrivilegedSupabaseConfigured();
}

export function assertPrivilegedSupabaseConfigured(context = 'privileged Supabase operation'): void {
  if (!getSupabaseUrl()) {
    throw new Error(`[Supabase][SECURITY] ${context} blocked: SUPABASE_URL is missing.`);
  }
  if (!getPrivilegedSupabaseKey()) {
    throw new Error(
      `[Supabase][SECURITY] ${context} blocked: SUPABASE_SECRET_KEY/SUPABASE_SERVICE_ROLE_KEY is missing; `
      + 'publishable/anon fallback is forbidden for privileged operations.'
    );
  }
}

/**
 * Elevated backend-only client. Secret/service-role credentials bypass RLS and therefore this
 * client must only be used after application-level authorization where user input can reach it.
 */
export function getPrivilegedServerSupabase() {
  if (!privilegedSupabaseClient) {
    assertPrivilegedSupabaseConfigured();
    privilegedSupabaseClient = createClient(getSupabaseUrl(), getPrivilegedSupabaseKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        // Login-Step-Up (ADR-0003.5-Erweiterung): server/stepUp.ts braucht auth.admin.passkey.*
        // fuer die Break-Glass-Passkey-Bereinigung. Rein additiv, aendert kein bestehendes
        // Verhalten (schaltet nur zusaetzliche Methoden frei, siehe src/supabaseClient.ts).
        experimental: { passkey: true },
      },
    });
  }
  return privilegedSupabaseClient;
}

/**
 * Low-privilege/RLS-bound client for server code that deliberately wants anon/authenticated RLS
 * semantics. No service-role/secret fallback is allowed in this direction either.
 */
export function getRlsServerSupabase() {
  if (!rlsSupabaseClient) {
    const url = getSupabaseUrl();
    const key = getPublishableSupabaseKey();
    if (!url || !key) {
      throw new Error('[Supabase][SECURITY] RLS-bound client unavailable: publishable/anon credentials are missing.');
    }
    rlsSupabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }
  return rlsSupabaseClient;
}

/**
 * @deprecated Prefer getPrivilegedServerSupabase() so elevated access is explicit at call sites.
 * This alias remains temporarily to avoid a high-risk all-at-once migration of IAM/billing code.
 */
export function getServerSupabase() {
  return getPrivilegedServerSupabase();
}

// ADR-0003.5/0008: Owner-Bypass war zuvor ein hartcodierter E-Mail-Vergleich, der
// UNBEDINGT auslöste: profiles hat keine email-Spalte (die liegt in auth.users), daher
// warf die E-Mail-Query hier IMMER einen Fehler und fiel dadurch unabhängig vom
// Migrationsstatus auf LEGACY_OWNER_EMAILS zurück. Fallback vollständig entfernt.
// Owner-Prüfung läuft jetzt ausschließlich über profiles.id (verifizierte User-ID aus
// einer echten Supabase-Session), nie mehr über einen client-gelieferten E-Mail-String.

export async function isOwnerIdentifier(rawIdentifier: string, lowerIdentifier: string): Promise<boolean> {
  const isEmail = rawIdentifier.includes('@');
  if (isEmail) {
    // profiles hat keine email-Spalte - Owner-Prüfung per E-Mail wird nicht unterstützt.
    // Fail-closed statt (fehlerhaft) auf eine hartcodierte Liste auszuweichen. Aufrufer
    // sollten die verifizierte User-ID aus der Session verwenden, nicht die E-Mail.
    return false;
  }
  if (!isPrivilegedSupabaseConfigured()) return false;
  try {
    const supabase = getPrivilegedServerSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .select('iam_role')
      .eq('id', rawIdentifier)
      .maybeSingle();
    if (!error && data) {
      return data.iam_role === 'owner';
    }
  } catch (err: any) {
    // Fail-closed bei Verbindungs-/Schemafehlern (Audit ARCH-AUDIT-0002, AUD2-F-020: jetzt
    // sichtbar geloggt statt still verschluckt).
    console.error(`[DB][ERROR] isOwnerIdentifier fehlgeschlagen: ${err?.message || err}`);
  }
  return false;
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

  // Local subscription persistence is development-only. Production billing state must never
  // silently fall back to a mutable container file when the authoritative database is absent.
  if (!isProduction()) {
    saveLocalSubscription(cleanUserId, tier);
    if (cleanEmail) {
      saveLocalSubscription(cleanEmail, tier); // backwards compatibility cache for local dev only
    }
  }

  if (!isPrivilegedSupabaseConfigured()) {
    if (isProduction()) {
      assertPrivilegedSupabaseConfigured('subscription persistence');
    }
    console.log(`[Supabase Backend] Privileged Supabase not configured. Saved development subscription locally for userId: ${cleanUserId} -> ${tier}`);
    return;
  }

  try {
    const supabaseClientInstance = getPrivilegedServerSupabase();
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
        if (isProduction()) {
          throw new Error(`Subscription persistence failed: ${fallbackError.message}`);
        }
        console.warn(`[Supabase Backend] Both upsert strategies failed. Development fallback remains local: ${fallbackError.message}`);
      } else {
        console.log(`[Supabase Backend] Successfully persisted subscription with email fallback conflict key: ${cleanEmail} -> ${tier}`);
      }
    } else {
      console.log(`[Supabase Backend] Successfully persisted subscription to remote DB: userId ${cleanUserId} -> ${tier}`);
    }
  } catch (e: any) {
    if (isProduction()) {
      console.error('[Supabase Backend][SECURITY] Production subscription persistence failed closed:', e.message || e);
      throw e;
    }
    console.warn("[Supabase Backend] Error in saveSubscription remote upsert, using development-local state:", e.message || e);
  }
}

/**
 * Retrieves the active subscription tier strictly by user_id (UUID).
 */
export async function getSubscription(userIdOrEmail: string): Promise<string> {
  const cleanKey = userIdOrEmail.trim();
  const cleanLower = cleanKey.toLowerCase();

  if (await isOwnerIdentifier(cleanKey, cleanLower)) {
    return 'Enterprise';
  }

  // Local subscription cache is never authoritative in production.
  const localSubs = isProduction() ? {} : getLocalSubscriptions();
  const localTier = localSubs[cleanLower] || localSubs[cleanKey];

  if (!isPrivilegedSupabaseConfigured()) {
    return isProduction() ? 'Free' : (localTier || 'Free');
  }

  try {
    const supabaseClientInstance = getPrivilegedServerSupabase();

    // Is it a UUID? If it's not an email, it's a UUID. Let's query by user_id first.
    const isEmail = cleanKey.includes('@');

    if (!isEmail) {
      const { data, error } = await supabaseClientInstance
        .from('subscriptions')
        .select('tier')
        .eq('user_id', cleanKey)
        .maybeSingle();

      if (!error && data && data.tier) {
        if (!isProduction() && localTier !== data.tier) {
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
        if (!isProduction() && localTier !== data.tier) {
          saveLocalSubscription(cleanLower, data.tier);
        }
        return data.tier;
      }
    }
  } catch (e: any) {
    console.error("[Supabase Backend] Connection error in getSubscription; production fails closed to Free:", e.message || e);
  }

  return isProduction() ? 'Free' : (localTier || 'Free');
}

// PDF export credits: relocated to server/pdfCreditLedger.ts (ADR-0052 / R-004) — the
// Supabase-backed durable ledger replacing this file's former ephemeral JSON storage.
