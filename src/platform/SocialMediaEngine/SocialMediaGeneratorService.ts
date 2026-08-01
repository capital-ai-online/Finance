/**
 * CAPITAL-AI Social Media & Podcast Engine - Client Service
 *
 * ADR-0020: Deckt ausschliesslich den Account-/OAuth-/Publishing-Teil ab
 * (fetchConnectedAccounts, getAuthUrl, toggleAccountConnection, publishContent, fetchHistory).
 * Die im Handover referenzierten Content-Generation-Methoden (generateSeries,
 * generateFallbackPackage, playAudioPreview/stopAudioPreview, downloadJson/-Markdown/
 * -StandaloneJsModule) sind bewusst NICHT enthalten - der zugehoerige Server-Endpunkt
 * (POST /api/social-media/generate, Gemini-Promptorchestrierung) war nie Teil des Handovers
 * und wurde daher nicht implementiert. SocialMediaGenerator.tsx (die Studio-Haupt-UI, die diese
 * Methoden braucht) ist entsprechend nicht Teil dieser Integration. Siehe ADR-0020 Abschnitt 3.
 *
 * Alle Requests laufen ueber authFetch() (Bearer-Token aus der Supabase-Session) - der Server
 * verlangt seit ADR-0020 fuer JEDEN /api/social-media/*-Endpunkt eine verifizierte Identitaet.
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

export const SocialMediaGeneratorService = {
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
      throw err; // Aufrufer (SocialAccountManager) zeigt die konkrete Fehlermeldung an (z.B. "Plattform nicht konfiguriert").
    }
  },

  /** Verbinden funktioniert ausschliesslich ueber den echten OAuth-Flow (getAuthUrl). Dieser
   *  Aufruf dient nur noch dem Trennen bestehender Verbindungen (connect wird serverseitig
   *  abgelehnt, siehe socialMediaRoutes.ts). */
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
