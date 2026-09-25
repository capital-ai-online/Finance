import { describe, expect, it } from 'vitest';
import {
  EDGE_TRUST_HEADER,
  resolveCloudflareRenderEdgeTrust,
} from '../../src/platform/Security/edgeTrust';
import { getClientIp } from '../../src/platform/Security/rateLimiter';
import {
  createProductIntelligenceEvent,
  parseTraceParent,
  PRODUCT_INTELLIGENCE_SCHEMA_VERSION,
} from '../../src/platform/Telemetry';

const EDGE_SECRET = '0123456789abcdef0123456789abcdef';

function renderRequest(overrides: Record<string, unknown> = {}) {
  return {
    headers: {
      host: 'capital-ai.online',
      'x-forwarded-proto': 'https',
      [EDGE_TRUST_HEADER]: EDGE_SECRET,
      'cf-connecting-ip': '203.0.113.7',
      'cf-ray': '230b030023ae2822-FRA',
      ...overrides,
    },
    ip: '10.0.0.7',
    socket: { remoteAddress: '10.0.0.8' },
  };
}

describe('Cloudflare -> Render edge trust', () => {
  it('accepts visitor identity only with canonical host, HTTPS, valid Ray ID and shared proof', () => {
    const edge = resolveCloudflareRenderEdgeTrust(renderRequest(), {
      isRender: true,
      sharedSecret: EDGE_SECRET,
    });

    expect(edge).toEqual({
      state: 'trusted-cloudflare-render',
      reason: 'trusted',
      clientIp: '203.0.113.7',
      edgeRayId: '230b030023ae2822-FRA',
      evidence: {
        renderRuntime: true,
        proofConfigured: true,
        canonicalHost: true,
        forwardedProtoHttps: true,
        proofPresented: true,
        proofMatched: true,
        clientIpPresent: true,
        clientIpValid: true,
        rayIdPresent: true,
        rayIdValid: true,
      },
    });
    expect(getClientIp(renderRequest(), { isRender: true, sharedSecret: EDGE_SECRET }))
      .toBe('203.0.113.7');
  });

  it('denies direct onrender-origin spoofing even when Cloudflare-looking headers are supplied', () => {
    const request = renderRequest({ host: 'finance-7clq.onrender.com' });
    const edge = resolveCloudflareRenderEdgeTrust(request, {
      isRender: true,
      sharedSecret: EDGE_SECRET,
    });

    expect(edge.state).toBe('untrusted');
    expect(edge.reason).toBe('invalid-host');
    expect(edge.evidence).toMatchObject({ canonicalHost: false, proofMatched: true });
    expect(getClientIp(request, { isRender: true, sharedSecret: EDGE_SECRET }))
      .toBe('10.0.0.7');
  });

  it('fails closed when the edge secret is missing or mismatched', () => {
    const missingSecret = resolveCloudflareRenderEdgeTrust(renderRequest(), {
      isRender: true,
      sharedSecret: undefined,
    });
    expect(missingSecret.reason).toBe('missing-shared-secret');
    expect(missingSecret.evidence).toMatchObject({
      proofConfigured: false,
      canonicalHost: true,
      forwardedProtoHttps: true,
      proofPresented: true,
      proofMatched: null,
      clientIpValid: true,
      rayIdValid: true,
    });

    const request = renderRequest({ [EDGE_TRUST_HEADER]: 'attacker-controlled-token-value!!' });
    const mismatched = resolveCloudflareRenderEdgeTrust(request, {
      isRender: true,
      sharedSecret: EDGE_SECRET,
    });
    expect(mismatched.reason).toBe('edge-token-mismatch');
    expect(mismatched.evidence.proofMatched).toBe(false);
    expect(getClientIp(request, { isRender: true, sharedSecret: EDGE_SECRET }))
      .toBe('10.0.0.7');
  });

  it('keeps fail-closed evidence useful when the edge token is absent', () => {
    const edge = resolveCloudflareRenderEdgeTrust(renderRequest({
      [EDGE_TRUST_HEADER]: undefined,
    }), { isRender: true, sharedSecret: EDGE_SECRET });

    expect(edge.reason).toBe('missing-edge-token');
    expect(edge.evidence).toMatchObject({
      renderRuntime: true,
      proofConfigured: true,
      canonicalHost: true,
      forwardedProtoHttps: true,
      proofPresented: false,
      proofMatched: null,
      clientIpPresent: true,
      clientIpValid: true,
      rayIdPresent: true,
      rayIdValid: true,
    });
  });

  it('rejects malformed Cloudflare identity metadata', () => {
    expect(resolveCloudflareRenderEdgeTrust(renderRequest({
      'cf-connecting-ip': 'not-an-ip',
    }), { isRender: true, sharedSecret: EDGE_SECRET }).reason).toBe('invalid-client-ip');

    expect(resolveCloudflareRenderEdgeTrust(renderRequest({
      'cf-ray': 'attacker-ray',
    }), { isRender: true, sharedSecret: EDGE_SECRET }).reason).toBe('invalid-ray-id');

    expect(resolveCloudflareRenderEdgeTrust(renderRequest({
      'x-forwarded-proto': 'http',
    }), { isRender: true, sharedSecret: EDGE_SECRET }).reason).toBe('invalid-forwarded-proto');
  });
});

describe('W3C trace context boundary', () => {
  it('accepts a valid v00 traceparent as correlation metadata', () => {
    expect(parseTraceParent(
      '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    )).toEqual({
      version: '00',
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      parentSpanId: '00f067aa0ba902b7',
      traceFlags: '01',
    });
  });

  it('rejects malformed, all-zero and unsupported-version traceparent input', () => {
    expect(parseTraceParent('attacker-controlled')).toBeNull();
    expect(parseTraceParent(
      '00-00000000000000000000000000000000-00f067aa0ba902b7-01',
    )).toBeNull();
    expect(parseTraceParent(
      '00-4bf92f3577b34da6a3ce929d0e0e4736-0000000000000000-01',
    )).toBeNull();
    expect(parseTraceParent(
      '01-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01',
    )).toBeNull();
  });
});

describe('vendor-neutral Product Intelligence contract', () => {
  it('creates an immutable aggregate-safe event without choosing an analytics vendor', () => {
    const event = createProductIntelligenceEvent({
      eventName: 'product.screening.completed',
      purpose: 'feature-adoption',
      outcome: 'success',
      context: {
        service: 'capital-ai',
        environment: 'test',
        productArea: 'screening',
        feature: 'verified-screening',
        surface: 'dashboard',
        version: '0.6.0',
        commitSha: '0123456789abcdef0123456789abcdef01234567',
        traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      },
      properties: {
        result_count: 12,
        cache_hit: true,
      },
    });

    expect(event.schemaVersion).toBe(PRODUCT_INTELLIGENCE_SCHEMA_VERSION);
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.context)).toBe(true);
    expect(Object.isFrozen(event.properties)).toBe(true);
  });

  it('rejects identity, credential and request-content property keys', () => {
    for (const key of ['email', 'user_id', 'session-id', 'authorization', 'api_token', 'request_body', 'query']) {
      expect(() => createProductIntelligenceEvent({
        eventName: 'product.screening.completed',
        purpose: 'feature-adoption',
        context: {
          service: 'capital-ai',
          environment: 'test',
          productArea: 'screening',
        },
        properties: { [key]: 'prohibited' },
      })).toThrow(/Sensitive Product Intelligence property/);
    }
  });

  it('rejects nested arbitrary payloads at runtime even if a caller bypasses TypeScript', () => {
    expect(() => createProductIntelligenceEvent({
      eventName: 'product.screening.completed',
      purpose: 'feature-adoption',
      context: {
        service: 'capital-ai',
        environment: 'test',
        productArea: 'screening',
      },
      properties: {
        metadata: { email: 'person@example.com' } as unknown as string,
      },
    })).toThrow(/Invalid Product Intelligence property value/);
  });

  it('rejects non-product event namespaces', () => {
    expect(() => createProductIntelligenceEvent({
      eventName: 'billing.completed',
      purpose: 'funnel',
      context: {
        service: 'capital-ai',
        environment: 'test',
        productArea: 'billing',
      },
    })).toThrow(/Invalid Product Intelligence event name/);
  });
});
