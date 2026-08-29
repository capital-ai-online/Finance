// ARCH-AUDIT-0002 (H6, Kapitel 14.5): "Metrics und Tracing (OpenTelemetry)". Umgesetzt als
// hand-gerolltes, abhaengigkeitsfreies /metrics im Prometheus-Exposition-Format statt des
// OpenTelemetry-SDKs - analog zur bereits getroffenen Entscheidung bei S4 (Logging, kein
// pino/winston) und N7 (Security-Header, kein helmet-Paket): das Projekt vermeidet bewusst
// zusaetzliche Abhaengigkeiten fuer klein und gut spezifizierte Probleme. Ein Prometheus-
// Textformat-Endpunkt ist genau das - und bleibt kompatibel mit einer spaeteren OTel-
// Collector-Anbindung (die meisten Collector-Setups scrapen ohnehin Prometheus-Format oder
// exportieren dorthin), ist also kein Sackgassen-Format.
//
// Bewusst NICHT umgesetzt: verteiltes Tracing (Spans ueber Prozess-/Service-Grenzen). Diese
// Anwendung ist ein einzelner Node-Prozess ohne Microservices, zwischen denen Anfragen
// weitergereicht werden - der eigentliche Bedarf ("wie lange dauert welche Route, wo haeufen
// sich Fehler") wird durch die Latenz-Histogramme und Fehlerzaehler unten bereits abgedeckt.
// Echtes Tracing waere ein separater, eigens zu begruendender Abhaengigkeits-Entscheid
// (OpenTelemetry SDK + Exporter), keine Erweiterung dieses Moduls.

import type { Request, Response, NextFunction } from 'express';

interface Counter {
  help: string;
  values: Map<string, number>;
}

interface Histogram {
  help: string;
  buckets: number[];
  // Je Label-Kombination: kumulative Bucket-Zaehler (gleiche Laenge wie buckets) + Summe + Count.
  values: Map<string, { bucketCounts: number[]; sum: number; count: number }>;
}

const HTTP_REQUESTS_TOTAL: Counter = { help: 'Gesamtzahl abgeschlossener HTTP-Requests.', values: new Map() };
const HTTP_ERRORS_TOTAL: Counter = { help: 'Gesamtzahl HTTP-Requests mit Statuscode >= 500.', values: new Map() };
// Sekunden-Buckets, angelehnt an uebliche Prometheus-Defaults fuer Web-Latenzen.
const DURATION_BUCKETS = [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10];
const HTTP_REQUEST_DURATION_SECONDS: Histogram = {
  help: 'Verteilung der HTTP-Antwortzeiten in Sekunden.',
  buckets: DURATION_BUCKETS,
  values: new Map(),
};

function labelKey(method: string, route: string, statusBucket: string): string {
  return `method="${method}",route="${route}",status="${statusBucket}"`;
}

function bumpCounter(counter: Counter, key: string, by = 1): void {
  counter.values.set(key, (counter.values.get(key) || 0) + by);
}

function observeHistogram(hist: Histogram, key: string, valueSeconds: number): void {
  let entry = hist.values.get(key);
  if (!entry) {
    entry = { bucketCounts: new Array(hist.buckets.length).fill(0), sum: 0, count: 0 };
    hist.values.set(key, entry);
  }
  for (let i = 0; i < hist.buckets.length; i++) {
    if (valueSeconds <= hist.buckets[i]) entry.bucketCounts[i] += 1;
  }
  entry.sum += valueSeconds;
  entry.count += 1;
}

/**
 * Reduziert dynamische Pfadsegmente (IDs, Symbole) auf das Express-Routenmuster
 * (req.route.path), um unbegrenzte Label-Kardinalitaet zu vermeiden (z.B.
 * /api/registry/assets/BTC, /api/registry/assets/ETH, ... wuerden sonst je einen eigenen
 * Zeitreihen-Satz erzeugen). Nicht auf eine registrierte Route gemappte Requests (404,
 * abgelehnte CORS-Preflights) fallen auf 'unmatched'.
 */
function resolveRouteLabel(req: Request): string {
  const routePath = (req as any).route?.path;
  if (typeof routePath === 'string') {
    const mountPath = (req as any).baseUrl || '';
    return `${mountPath}${routePath}` || req.path;
  }
  return 'unmatched';
}

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startHrTime = process.hrtime.bigint();
  res.on('finish', () => {
    const durationSeconds = Number(process.hrtime.bigint() - startHrTime) / 1e9;
    const route = resolveRouteLabel(req);
    const statusBucket = `${Math.floor(res.statusCode / 100)}xx`;
    const key = labelKey(req.method, route, statusBucket);

    bumpCounter(HTTP_REQUESTS_TOTAL, key);
    if (res.statusCode >= 500) bumpCounter(HTTP_ERRORS_TOTAL, key);
    observeHistogram(HTTP_REQUEST_DURATION_SECONDS, `method="${req.method}",route="${route}"`, durationSeconds);
  });
  next();
}

function formatCounter(name: string, counter: Counter): string {
  const lines = [`# HELP ${name} ${counter.help}`, `# TYPE ${name} counter`];
  for (const [key, value] of counter.values) {
    lines.push(`${name}{${key}} ${value}`);
  }
  return lines.join('\n');
}

function formatHistogram(name: string, hist: Histogram): string {
  const lines = [`# HELP ${name} ${hist.help}`, `# TYPE ${name} histogram`];
  for (const [key, entry] of hist.values) {
    for (let i = 0; i < hist.buckets.length; i++) {
      lines.push(`${name}_bucket{${key},le="${hist.buckets[i]}"} ${entry.bucketCounts[i]}`);
    }
    lines.push(`${name}_bucket{${key},le="+Inf"} ${entry.count}`);
    lines.push(`${name}_sum{${key}} ${entry.sum.toFixed(6)}`);
    lines.push(`${name}_count{${key}} ${entry.count}`);
  }
  return lines.join('\n');
}

function formatProcessGauges(): string {
  const mem = process.memoryUsage();
  const lines = [
    '# HELP process_uptime_seconds Laufzeit des Prozesses in Sekunden.',
    '# TYPE process_uptime_seconds gauge',
    `process_uptime_seconds ${process.uptime().toFixed(3)}`,
    '# HELP process_resident_memory_bytes Resident Set Size des Prozesses in Bytes.',
    '# TYPE process_resident_memory_bytes gauge',
    `process_resident_memory_bytes ${mem.rss}`,
    '# HELP nodejs_heap_used_bytes Genutzter V8-Heap in Bytes.',
    '# TYPE nodejs_heap_used_bytes gauge',
    `nodejs_heap_used_bytes ${mem.heapUsed}`,
  ];
  return lines.join('\n');
}

export function renderMetrics(): string {
  return [
    formatProcessGauges(),
    formatCounter('http_requests_total', HTTP_REQUESTS_TOTAL),
    formatCounter('http_request_errors_total', HTTP_ERRORS_TOTAL),
    formatHistogram('http_request_duration_seconds', HTTP_REQUEST_DURATION_SECONDS),
  ].join('\n') + '\n';
}
