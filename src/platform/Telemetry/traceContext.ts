export interface ParsedTraceParent {
  version: '00';
  traceId: string;
  parentSpanId: string;
  traceFlags: string;
}

const TRACE_PARENT_V00_PATTERN = /^00-([0-9a-f]{32})-([0-9a-f]{16})-([0-9a-f]{2})$/i;
const ALL_ZERO_TRACE_ID = /^0{32}$/;
const ALL_ZERO_SPAN_ID = /^0{16}$/;

/**
 * Parses only the currently supported W3C traceparent v00 shape.
 *
 * Inbound trace context is untrusted correlation metadata. Invalid or future-version input is
 * ignored rather than promoted into local telemetry or authorization state.
 */
export function parseTraceParent(value: unknown): ParsedTraceParent | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  const match = TRACE_PARENT_V00_PATTERN.exec(normalized);
  if (!match) return null;

  const traceId = match[1].toLowerCase();
  const parentSpanId = match[2].toLowerCase();
  const traceFlags = match[3].toLowerCase();
  if (ALL_ZERO_TRACE_ID.test(traceId) || ALL_ZERO_SPAN_ID.test(parentSpanId)) return null;

  return Object.freeze({
    version: '00' as const,
    traceId,
    parentSpanId,
    traceFlags,
  });
}
