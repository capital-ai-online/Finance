import { timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

export const CAPITAL_AI_PUBLIC_HOSTS = Object.freeze([
  'capital-ai.online',
  'www.capital-ai.online',
] as const);

export const EDGE_TRUST_HEADER = 'x-capital-ai-edge-token' as const;
export const EDGE_TRUST_SECRET_ENV = 'CAPITAL_AI_EDGE_TRUST_SECRET' as const;

export type EdgeTrustState = 'trusted-cloudflare-render' | 'untrusted' | 'not-render';
export type EdgeTrustReason =
  | 'trusted'
  | 'not-render'
  | 'missing-shared-secret'
  | 'invalid-host'
  | 'invalid-forwarded-proto'
  | 'missing-edge-token'
  | 'edge-token-mismatch'
  | 'invalid-client-ip'
  | 'invalid-ray-id';

export interface EdgeTrustRequest {
  headers: Record<string, unknown>;
}

export interface EdgeTrustOptions {
  isRender?: boolean;
  sharedSecret?: string;
  trustedHosts?: readonly string[];
}

export interface EdgeTrustEvidence {
  renderRuntime: boolean;
  proofConfigured: boolean;
  canonicalHost: boolean;
  forwardedProtoHttps: boolean;
  proofPresented: boolean;
  proofMatched: boolean | null;
  clientIpPresent: boolean;
  clientIpValid: boolean;
  rayIdPresent: boolean;
  rayIdValid: boolean;
}

export interface EdgeTrustContext {
  state: EdgeTrustState;
  reason: EdgeTrustReason;
  clientIp?: string;
  edgeRayId?: string;
  evidence: EdgeTrustEvidence;
}

const CF_RAY_PATTERN = /^[0-9a-f]{16}(?:-[a-z0-9]{3})?$/i;
const MIN_EDGE_SECRET_LENGTH = 32;

function singleHeader(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizedHost(value: unknown): string | null {
  const host = singleHeader(value);
  if (!host || /[\s,/@\\]/.test(host)) return null;

  const lower = host.toLowerCase();
  const colon = lower.lastIndexOf(':');
  if (colon > -1 && lower.indexOf(':') === colon) {
    const port = lower.slice(colon + 1);
    if (/^\d{1,5}$/.test(port)) return lower.slice(0, colon);
  }
  return lower;
}

function validIp(value: unknown): string | null {
  const candidate = singleHeader(value);
  return candidate && isIP(candidate) > 0 ? candidate : null;
}

function validSharedSecret(value: string | undefined): string | null {
  if (!value || value.length < MIN_EDGE_SECRET_LENGTH) return null;
  return value;
}

function safeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const leftBuffer = encoder.encode(left);
  const rightBuffer = encoder.encode(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

/**
 * Verifies the Cloudflare -> Render provenance contract without trusting forwarding headers
 * merely because the process runs on Render.
 *
 * The Render service has a public onrender.com origin, so CF-Connecting-IP/CF-Ray alone can be
 * spoofed by a direct-origin caller. A separately provisioned shared edge secret is therefore
 * required before Cloudflare visitor identity is accepted. Provider provisioning/rotation is
 * intentionally outside this repository-only contract.
 */
export function resolveCloudflareRenderEdgeTrust(
  request: EdgeTrustRequest,
  options: EdgeTrustOptions = {},
): EdgeTrustContext {
  const isRender = options.isRender ?? process.env.RENDER === 'true';
  const sharedSecret = validSharedSecret(options.sharedSecret ?? process.env[EDGE_TRUST_SECRET_ENV]);
  const trustedHosts = options.trustedHosts ?? CAPITAL_AI_PUBLIC_HOSTS;
  // Internal fallbacks/tests can present partial request-like objects. Treat a missing
  // headers bag as untrusted evidence instead of throwing before the fail-closed checks run.
  const headers = request?.headers ?? {};
  const host = normalizedHost(headers.host);
  const forwardedProtoHttps =
    singleHeader(headers['x-forwarded-proto'])?.toLowerCase() === 'https';
  const presentedToken = singleHeader(headers[EDGE_TRUST_HEADER]);
  const clientIpHeader = singleHeader(headers['cf-connecting-ip']);
  const clientIp = validIp(clientIpHeader);
  const edgeRayId = singleHeader(headers['cf-ray']);
  const rayIdValid = Boolean(edgeRayId && CF_RAY_PATTERN.test(edgeRayId));
  const proofMatched =
    sharedSecret && presentedToken ? safeEqual(presentedToken, sharedSecret) : null;

  const evidence: EdgeTrustEvidence = {
    renderRuntime: isRender,
    proofConfigured: Boolean(sharedSecret),
    canonicalHost: Boolean(host && trustedHosts.includes(host)),
    forwardedProtoHttps,
    proofPresented: Boolean(presentedToken),
    proofMatched,
    clientIpPresent: Boolean(clientIpHeader),
    clientIpValid: Boolean(clientIp),
    rayIdPresent: Boolean(edgeRayId),
    rayIdValid,
  };

  if (!isRender) return { state: 'not-render', reason: 'not-render', evidence };
  if (!sharedSecret) return { state: 'untrusted', reason: 'missing-shared-secret', evidence };
  if (!evidence.canonicalHost) {
    return { state: 'untrusted', reason: 'invalid-host', evidence };
  }
  if (!forwardedProtoHttps) {
    return { state: 'untrusted', reason: 'invalid-forwarded-proto', evidence };
  }
  if (!presentedToken) return { state: 'untrusted', reason: 'missing-edge-token', evidence };
  if (!proofMatched) {
    return { state: 'untrusted', reason: 'edge-token-mismatch', evidence };
  }
  if (!clientIp) return { state: 'untrusted', reason: 'invalid-client-ip', evidence };
  if (!rayIdValid) {
    return { state: 'untrusted', reason: 'invalid-ray-id', evidence };
  }

  return {
    state: 'trusted-cloudflare-render',
    reason: 'trusted',
    clientIp,
    edgeRayId: edgeRayId ?? undefined,
    evidence,
  };
}
