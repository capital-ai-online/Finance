export const ORCHESTRATOR_TELEMETRY_CONTRACT = {
  scope: {
    badge: 'Instrumentierte Request-Routen',
    description:
      'Zeigt ausschließlich Requests, die explizit durch den Request-Orchestrator laufen. Keine globale API-, WAF- oder DDoS-Abdeckung.',
    freshness: 'Polling-basierte Admin-Telemetrie; kein globaler Echtzeit-Durchsatzmesser.',
  },
  metrics: {
    activeRequests: {
      label: 'Aktive Requests',
      note: 'Aktuell belegte Orchestrator-Slots.',
    },
    queueSize: {
      label: 'Warteschlange',
      note: 'Aktuell wartende instrumentierte Requests.',
    },
    recentEvents: {
      label: 'Recent Events ≤ 60s',
      note: 'Aus dem auf 50 Einträge begrenzten Recent-Log; kein globaler Requests-pro-Minute-Zähler.',
    },
    totalProcessed: {
      label: 'Abgewickelt',
      note: 'Vom Orchestrator per Response oder Connection-Close abgeschlossen; keine fachliche Erfolgsquote.',
    },
    totalRejected: {
      label: 'Abgelehnt / Timeout',
      note: 'Orchestrator-seitige Rate-Limit-, Queue-Full- oder Queue-Timeout-Ereignisse.',
    },
    rateLimitsHit: {
      label: 'Rate-Limit-Ablehnungen',
      note: '429 durch das Client-Limit; keine Bot-, Spam- oder Angriffsklassifikation.',
    },
  },
  events: {
    title: 'Recent Request Events',
    empty: 'Noch keine instrumentierten Request-Ereignisse erfasst.',
    limitation: 'Nur Routen mit expliziter Request-Orchestrator-Instrumentierung erscheinen hier.',
  },
  models: {
    title: 'Modell-Integrationsstatus',
    description:
      'Zeigt den serverseitig bekannten Konfigurations-/Integrationsstatus. Es werden keine aktiven Health- oder Latenzprüfungen durchgeführt.',
    refreshLabel: 'Status aktualisieren',
    loadingLabel: 'Integrationsstatus wird geladen...',
    noMeasurement: 'Keine aktive Health-/Latenzmessung',
  },
  safeguards: {
    title: 'Scope der Schutzfunktion',
    description:
      'Concurrency-Limit, Warteschlange und Client-Rate-Limit begrenzen ausschließlich instrumentierte Requests. Sie ersetzen keinen WAF/CDN-DDoS-Schutz und garantieren weder Angriffserkennung noch die Vermeidung von Prozessabstürzen.',
  },
} as const;

export const ORCHESTRATOR_PROHIBITED_TELEMETRY_CLAIMS = [
  'DDoS unterbunden',
  'AIF-Shield Aktiv',
  'Spam-Blocks',
  'Echtzeit Durchsatz',
  'Server geschützt',
  'Latenz-Ping ausführen',
  'Auto-Routing & Latency Monitor',
] as const;
