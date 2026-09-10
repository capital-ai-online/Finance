export const PRODUCT_INTELLIGENCE_SCHEMA_VERSION = '1.0.0' as const;

export type ProductIntelligencePurpose =
  | 'feature-adoption'
  | 'funnel'
  | 'experiment'
  | 'feedback'
  | 'reliability';

export type ProductIntelligenceOutcome =
  | 'success'
  | 'failure'
  | 'degraded'
  | 'denied'
  | 'unknown';

export type ProductIntelligencePropertyValue = string | number | boolean | null;

export interface ProductIntelligenceContext {
  service: string;
  environment: string;
  productArea: string;
  feature?: string;
  surface?: string;
  version?: string;
  commitSha?: string;
  traceId?: string;
}

export interface ProductIntelligenceEvent {
  schemaVersion: typeof PRODUCT_INTELLIGENCE_SCHEMA_VERSION;
  timestamp: string;
  eventName: string;
  purpose: ProductIntelligencePurpose;
  outcome?: ProductIntelligenceOutcome;
  context: ProductIntelligenceContext;
  properties?: Readonly<Record<string, ProductIntelligencePropertyValue>>;
}

export interface CreateProductIntelligenceEventInput
  extends Omit<ProductIntelligenceEvent, 'schemaVersion' | 'timestamp'> {
  timestamp?: string;
}

const EVENT_NAME_PATTERN = /^product\.[a-z0-9]+(?:\.[a-z0-9]+)+$/;
const IDENTIFIER_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const PROPERTY_KEY_PATTERN = /^[a-z][a-z0-9_.-]{0,63}$/;
const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/i;
const COMMIT_SHA_PATTERN = /^[0-9a-f]{40}$/i;
const SENSITIVE_PROPERTY_KEY =
  /(?:^|[._-])(authorization|cookie|email|phone|ip|ipaddress|user|userid|session|sessionid|token|secret|password|prompt|request|requestbody|query)(?:$|[._-])/i;

const MAX_PROPERTIES = 32;
const MAX_STRING_VALUE_LENGTH = 256;

function requiredText(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`Product Intelligence ${label} is required`);
  return normalized;
}

function canonicalIdentifier(value: string, label: string): string {
  const normalized = requiredText(value, label);
  if (!IDENTIFIER_PATTERN.test(normalized)) {
    throw new Error(`Invalid Product Intelligence ${label}: ${value}`);
  }
  return normalized;
}

function validateProperties(
  properties: Record<string, ProductIntelligencePropertyValue> | undefined,
): Readonly<Record<string, ProductIntelligencePropertyValue>> | undefined {
  if (!properties) return undefined;

  const entries = Object.entries(properties);
  if (entries.length > MAX_PROPERTIES) {
    throw new Error(`Product Intelligence properties exceed ${MAX_PROPERTIES}`);
  }

  const validated: Record<string, ProductIntelligencePropertyValue> = {};
  for (const [key, value] of entries) {
    if (!PROPERTY_KEY_PATTERN.test(key)) {
      throw new Error(`Invalid Product Intelligence property key: ${key}`);
    }
    if (SENSITIVE_PROPERTY_KEY.test(key)) {
      throw new Error(`Sensitive Product Intelligence property is prohibited: ${key}`);
    }

    const valueType = typeof value;
    if (value !== null && valueType !== 'string' && valueType !== 'number' && valueType !== 'boolean') {
      throw new Error(`Invalid Product Intelligence property value: ${key}`);
    }
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error(`Invalid Product Intelligence numeric property: ${key}`);
    }
    if (typeof value === 'string' && value.length > MAX_STRING_VALUE_LENGTH) {
      throw new Error(`Product Intelligence property value too long: ${key}`);
    }
    validated[key] = value;
  }

  return Object.freeze(validated);
}

/**
 * Creates a vendor-neutral, aggregate-safe Product Intelligence event.
 *
 * No user/session/IP identity, request body, query text, prompts, credentials or nested arbitrary
 * payloads are part of this contract. Vendor export and consent policy remain separate adapters
 * owned by their applicable project/authority.
 */
export function createProductIntelligenceEvent(
  input: CreateProductIntelligenceEventInput,
): ProductIntelligenceEvent {
  if (!EVENT_NAME_PATTERN.test(input.eventName)) {
    throw new Error(`Invalid Product Intelligence event name: ${input.eventName}`);
  }

  const context: ProductIntelligenceContext = {
    service: requiredText(input.context.service, 'service'),
    environment: requiredText(input.context.environment, 'environment'),
    productArea: canonicalIdentifier(input.context.productArea, 'productArea'),
    feature: input.context.feature
      ? canonicalIdentifier(input.context.feature, 'feature')
      : undefined,
    surface: input.context.surface
      ? canonicalIdentifier(input.context.surface, 'surface')
      : undefined,
    version: input.context.version?.trim() || undefined,
    commitSha: input.context.commitSha?.toLowerCase(),
    traceId: input.context.traceId?.toLowerCase(),
  };

  if (context.commitSha && !COMMIT_SHA_PATTERN.test(context.commitSha)) {
    throw new Error('Invalid Product Intelligence commitSha');
  }
  if (context.traceId && !TRACE_ID_PATTERN.test(context.traceId)) {
    throw new Error('Invalid Product Intelligence traceId');
  }

  const properties = validateProperties(input.properties);

  return Object.freeze({
    schemaVersion: PRODUCT_INTELLIGENCE_SCHEMA_VERSION,
    timestamp: input.timestamp ?? new Date().toISOString(),
    eventName: input.eventName,
    purpose: input.purpose,
    outcome: input.outcome,
    context: Object.freeze(context),
    properties,
  });
}
