import {
  isAltcoinPatternResearchViewEnvelope,
  type AltcoinPatternResearchViewEnvelope,
} from '../../../platform/FinTechCore/Modules/Crypto/Pattern/AltcoinPatternResearchViewContract';

export async function fetchAltcoinPatternResearchView(
  symbol: string,
  fetchImpl: typeof fetch = fetch,
): Promise<AltcoinPatternResearchViewEnvelope | null> {
  const normalized = symbol.toUpperCase().trim();
  if (!/^[A-Z0-9.=-]{1,20}$/.test(normalized)) return null;

  const response = await fetchImpl(
    '/api/crypto/evidence/pattern-research/' + encodeURIComponent(normalized),
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    },
  );

  if (!response.ok) return null;
  const payload: unknown = await response.json().catch(() => null);
  return isAltcoinPatternResearchViewEnvelope(payload) ? payload : null;
}
