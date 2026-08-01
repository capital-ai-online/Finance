// Audit ARCH-AUDIT-0002 (H6): Testabdeckung fuer den hand-gerollten Prometheus-Metrics-
// Endpunkt. metricsMiddleware wird mit minimalen Express-kompatiblen Mock-Objekten
// (EventEmitter fuer res.on('finish', ...)) statt eines echten HTTP-Requests geprueft.

import { describe, it, expect } from 'vitest';
import { EventEmitter } from 'events';
import { metricsMiddleware, renderMetrics } from '../../server/metrics';

function fakeRequestResponse(method: string, routePath: string | undefined, statusCode: number) {
  const req: any = { method, path: '/fallback-path', route: routePath ? { path: routePath } : undefined, baseUrl: '' };
  const res: any = new EventEmitter();
  res.statusCode = statusCode;
  return { req, res };
}

async function simulateRequest(method: string, routePath: string | undefined, statusCode: number) {
  const { req, res } = fakeRequestResponse(method, routePath, statusCode);
  let nextCalled = false;
  metricsMiddleware(req, res, () => { nextCalled = true; });
  expect(nextCalled).toBe(true);
  res.emit('finish');
}

describe('metrics', () => {
  it('renderMetrics() liefert gueltiges Prometheus-Exposition-Format mit HELP/TYPE-Zeilen', async () => {
    await simulateRequest('GET', '/api/test-route-a', 200);
    const output = renderMetrics();
    expect(output).toContain('# HELP http_requests_total');
    expect(output).toContain('# TYPE http_requests_total counter');
    expect(output).toContain('# HELP http_request_duration_seconds');
    expect(output).toContain('# TYPE http_request_duration_seconds histogram');
    expect(output).toMatch(/http_requests_total\{method="GET",route="\/api\/test-route-a",status="2xx"\} \d+/);
  });

  it('zaehlt Requests je Methode/Route/Status-Bucket korrekt hoch', async () => {
    await simulateRequest('GET', '/api/test-route-b', 200);
    await simulateRequest('GET', '/api/test-route-b', 200);
    const output = renderMetrics();
    const match = output.match(/http_requests_total\{method="GET",route="\/api\/test-route-b",status="2xx"\} (\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBeGreaterThanOrEqual(2);
  });

  it('zaehlt 5xx-Antworten zusaetzlich in http_request_errors_total', async () => {
    await simulateRequest('POST', '/api/test-route-c', 500);
    const output = renderMetrics();
    expect(output).toMatch(/http_request_errors_total\{method="POST",route="\/api\/test-route-c",status="5xx"\} \d+/);
  });

  it('nicht auf eine Route gemappte Requests fallen auf das Label "unmatched"', async () => {
    await simulateRequest('GET', undefined, 404);
    const output = renderMetrics();
    expect(output).toMatch(/http_requests_total\{method="GET",route="unmatched",status="4xx"\} \d+/);
  });

  it('Histogramm-Buckets sind kumulativ und enthalten einen +Inf-Bucket gleich dem Gesamtcount', async () => {
    await simulateRequest('GET', '/api/test-route-d', 200);
    const output = renderMetrics();
    const infMatch = output.match(/http_request_duration_seconds_bucket\{method="GET",route="\/api\/test-route-d",le="\+Inf"\} (\d+)/);
    const countMatch = output.match(/http_request_duration_seconds_count\{method="GET",route="\/api\/test-route-d"\} (\d+)/);
    expect(infMatch).not.toBeNull();
    expect(countMatch).not.toBeNull();
    expect(infMatch![1]).toBe(countMatch![1]);
  });

  it('enthaelt Prozess-Gauges (uptime, Speicher)', () => {
    const output = renderMetrics();
    expect(output).toContain('process_uptime_seconds');
    expect(output).toContain('process_resident_memory_bytes');
    expect(output).toContain('nodejs_heap_used_bytes');
  });
});
