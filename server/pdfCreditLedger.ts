// ADR-0052 / R-004 — Transactional, idempotent PDF-credit ledger.
//
// Replaces the ephemeral uploads/pdf_credits.json file (formerly server/db.ts) with the
// Supabase-backed public.pdf_credits / public.pdf_credit_grants tables and their SECURITY
// DEFINER functions (supabase/migrations/20260810110642_pdf_credit_ledger.sql). Mirrors the
// production-guard / dev-fallback shape already established by server/stripeEventInbox.ts.

import fs from 'fs';
import path from 'path';
import {
  assertPrivilegedSupabaseConfigured,
  getPrivilegedServerSupabase,
  isOwnerIdentifier,
  isSupabaseConfigured,
} from './db';
import { getCleanEnv } from './env';

export interface PdfCreditGrantInput {
  grantKey: string;
  userIdentifier: string;
  credits: number;
  source: string;
  reference?: string | null;
}

export interface PdfCreditConsumeResult {
  success: boolean;
  credits: number;
}

export interface PdfCreditGrantResult {
  granted: boolean;
  credits: number;
}

const DEFAULT_CREDITS = 3;
const OWNER_UNLIMITED_CREDITS = 999999;

function isProduction(): boolean {
  return getCleanEnv('NODE_ENV') === 'production';
}

function normalizeIdentifier(userIdentifier: string): string {
  return userIdentifier.toLowerCase().trim();
}

// --- Dev-only local-file fallback -------------------------------------------------------
// Not durable, not atomic, not idempotent. Acceptable only when Supabase is not configured
// and NODE_ENV !== 'production' — the same trade-off server/stripeEventInbox.ts already
// accepts for its localDevelopmentClaims fallback.

const LOCAL_PDF_CREDITS_FILE = path.join(process.cwd(), 'uploads', 'pdf_credits.json');

function readLocalPdfCredits(cleanId: string): number {
  try {
    if (fs.existsSync(LOCAL_PDF_CREDITS_FILE)) {
      const data = fs.readFileSync(LOCAL_PDF_CREDITS_FILE, 'utf8');
      const creditsObj = JSON.parse(data) || {};
      if (creditsObj[cleanId] !== undefined) {
        return Number(creditsObj[cleanId]);
      }
    }
  } catch (e) {
    console.warn('[Local PDF Credits] Error reading PDF credits:', e);
  }
  return DEFAULT_CREDITS;
}

function writeLocalPdfCredits(cleanId: string, credits: number): void {
  try {
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
    console.error('[Local PDF Credits] Error saving PDF credits:', e);
  }
}

// --- Public API ----------------------------------------------------------------------------

export async function getPdfCredits(userIdentifier: string): Promise<number> {
  const cleanId = normalizeIdentifier(userIdentifier);
  if (await isOwnerIdentifier(userIdentifier.trim(), cleanId)) {
    return OWNER_UNLIMITED_CREDITS;
  }

  if (!isSupabaseConfigured()) {
    if (isProduction()) {
      assertPrivilegedSupabaseConfigured('PDF credit ledger read');
    }
    return readLocalPdfCredits(cleanId);
  }

  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase
    .from('pdf_credits')
    .select('credits')
    .eq('user_identifier', cleanId)
    .maybeSingle();

  if (error) {
    throw new Error(`[PDF Credit Ledger] failed to read balance for ${cleanId}: ${error.message || JSON.stringify(error)}`);
  }

  return data ? Number(data.credits) : DEFAULT_CREDITS;
}

export async function consumePdfCredit(userIdentifier: string): Promise<PdfCreditConsumeResult> {
  const cleanId = normalizeIdentifier(userIdentifier);
  if (await isOwnerIdentifier(userIdentifier.trim(), cleanId)) {
    return { success: true, credits: OWNER_UNLIMITED_CREDITS };
  }

  if (!isSupabaseConfigured()) {
    if (isProduction()) {
      assertPrivilegedSupabaseConfigured('PDF credit ledger consume');
    }
    const current = readLocalPdfCredits(cleanId);
    if (current <= 0) {
      return { success: false, credits: current };
    }
    const next = current - 1;
    writeLocalPdfCredits(cleanId, next);
    return { success: true, credits: next };
  }

  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase.rpc('consume_pdf_credit', { p_user_identifier: cleanId });

  if (error) {
    throw new Error(`[PDF Credit Ledger] consume_pdf_credit failed for ${cleanId}: ${error.message || JSON.stringify(error)}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error(`[PDF Credit Ledger] consume_pdf_credit returned no row for ${cleanId}.`);
  }

  return { success: Boolean(row.success), credits: Number(row.credits) };
}

export async function grantPdfCredits(input: PdfCreditGrantInput): Promise<PdfCreditGrantResult> {
  const cleanId = normalizeIdentifier(input.userIdentifier);

  if (!isSupabaseConfigured()) {
    if (isProduction()) {
      assertPrivilegedSupabaseConfigured('PDF credit ledger grant');
    }
    // Dev-only: no independent idempotency guard, matching the local-file fallback's existing
    // weaker guarantees elsewhere in this module.
    const current = readLocalPdfCredits(cleanId);
    const next = current + input.credits;
    writeLocalPdfCredits(cleanId, next);
    return { granted: true, credits: next };
  }

  const supabase = getPrivilegedServerSupabase();
  const { data, error } = await supabase.rpc('grant_pdf_credits', {
    p_grant_key: input.grantKey,
    p_user_identifier: cleanId,
    p_credits: input.credits,
    p_source: input.source,
    p_reference: input.reference ?? null,
  });

  if (error) {
    throw new Error(`[PDF Credit Ledger] grant_pdf_credits failed for ${cleanId} (grantKey=${input.grantKey}): ${error.message || JSON.stringify(error)}`);
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error(`[PDF Credit Ledger] grant_pdf_credits returned no row for ${cleanId} (grantKey=${input.grantKey}).`);
  }

  return { granted: Boolean(row.granted), credits: Number(row.credits) };
}
