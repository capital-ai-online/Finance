/**
 * CAPITAL-AI Social Media & Podcast Engine - Client Service
 *
 * ADR-0020: Account-/OAuth-/Publishing-Teil
 * (fetchConnectedAccounts, getAuthUrl, toggleAccountConnection, publishContent, fetchHistory).
 *
 * SEO-ROADMAP-0001 / N1: generateSeries() calls POST /api/social-media/generate for
 * text platforms (X, Facebook, community). Media formats remain out of scope until N3.
 *
 * Alle Requests laufen ueber authFetch() (Bearer-Token aus der Supabase-Session).
 */

import { authFetch } from '../../lib/authFetch';
import type { SocialAccount, SupportedAccountPlatform, PublishRequestPayload, PublishLogEntry } from './types';

interface ApiResponse<T> {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

async function parseOrThrow<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) {
    throw new Error(json.error || `Anfrage fehlgeschlagen (HTTP ${res.status}).`);
  }
  return json as T;
}

export interface SocialMediaAccessStatus {
  allowed: boolean;
  reason: 'owner' | 'founder-tier' | 'unauthenticated' | 'insufficient-tier' | 'supabase-not-configured' | 'internal-error';
}

export interface GenerateSeriesRequest {
  topic: string;
  platforms?: Array<'x' | 'facebook' | 'community'>;
  locale?: 'de' | 'en';
  contextNote?: string;
}

export interface GeneratedTextVariant {
  platform: 'x' | 'facebook' | 'community';
  format: string;
  text: string;
  charCount: number;
  disclaimer: string;
}

export interface GenerateSeriesPackage {
  topic: string;
  locale: 'de' | 'en';
  variants: GeneratedTextVariant[];
  authorship: 'ai_assisted';
  generatedAt: string;
  humanReviewed: boolean;
}

export const SocialMediaGeneratorService = {
  /** ADR-0021: Zugriff ist auf Owner-IAM-Rolle oder 'Founder'-Abonnenten beschraenkt. Immer
   *  200 mit {allowed, reason} statt 401/403, damit das Frontend eine passende Meldung
   *  rendern kann statt eines rohen Fehlers. */
  async checkAccess(): Promise<SocialMediaAccessStatus> {
    try {
      const res = await authFetch('/api/social-media/access');
      const json = await parseOrThrow<ApiResponse<never> & { allowed: boolean; reason: SocialMediaAccessStatus['reason'] }>(res);
      return { allowed: !!json.allowed, reason: json.reason };
    } catch (err) {
      console.error('[SocialMediaGeneratorService] checkAccess fehlgeschlagen:', err);
      return { allowed: false, reason: 'internal-error' };
    }
  },

  async fetchConnectedAccounts(): Promise<SocialAccount[]> {
    try {
      const res = await authFetch('/api/social-media/accounts');
      const json = await parseOrThrow<ApiResponse<never> & { accounts: SocialAccount[] }>(res);
      return json.accounts || [];
    } catch (err) {
      console.error('[SocialMediaGeneratorService] fetchConnectedAccounts fehlgeschlagen:', err);
      return [];
    }
  },

  async getAuthUrl(platform: SupportedAccountPlatform): Promise<string | null> {
    try {
      const res = await authFetch(`/api/social-media/auth/url?platform=${encodeURIComponent(platform)}`);
      const json = await parseOrThrow<ApiResponse<never> & { url: string }>(res);
      return json.url || null;
    } catch (err) {
      console.error('[SocialMediaGeneratorService] getAuthUrl fehlgeschlagen:', err);
      throw err;
    }
  },

  async disconnectAccount(platform: SupportedAccountPlatform): Promise<SocialAccount[] | null> {
    try {
      const res = await authFetch('/api/social-media/accounts/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, connect: false }),
      });
      const json = await parseOrThrow<ApiResponse<never> & { accounts: SocialAccount[] }>(res);
      return json.accounts || null;
    } catch (err) {
      console.error('[SocialMediaGeneratorService] disconnectAccount fehlgeschlagen:', err);
      return null;
    }
  },

  /**
   * N1: Text content generation for X / Facebook / community.
   * Does not publish. Does not render media.
   */
  async generateSeries(request: GenerateSeriesRequest): Promise<GenerateSeriesPackage | null> {
    try {
      const res = await authFetch('/api/social-media/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const json = await parseOrThrow<ApiResponse<never> & { package: GenerateSeriesPackage }>(res);
      return json.package || null;
    } catch (err) {
      console.error('[SocialMediaGeneratorService] generateSeries fehlgeschlagen:', err);
      throw err;
    }
  },

  async publishContent(payload: PublishRequestPayload): Promise<{ success: boolean; message?: string; results: PublishLogEntry[] } | null> {
    try {
      const res = await authFetch('/api/social-media/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await parseOrThrow<ApiResponse<never> & { message: string; results: PublishLogEntry[] }>(res);
      return { success: json.success, message: json.message, results: json.results || [] };
    } catch (err) {
      console.error('[SocialMediaGeneratorService] publishContent fehlgeschlagen:', err);
      return null;
    }
  },

  async fetchHistory(): Promise<PublishLogEntry[]> {
    try {
      const res = await authFetch('/api/social-media/history');
      const json = await parseOrThrow<ApiResponse<never> & { history: PublishLogEntry[] }>(res);
      return json.history || [];
    } catch (err) {
      console.error('[SocialMediaGeneratorService] fetchHistory fehlgeschlagen:', err);
      return [];
    }
  },
};
