// ESS-0013-CONTRACTS Abschnitt 7, Policy Contract — Routing-Policy je
// Event-Kategorie. Eine Policy veraendert niemals den Event-Inhalt, ausschliesslich
// das Zustellverhalten.

export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
}

export interface CategoryPolicy {
  category: string;
  retry: RetryPolicy;
}

// Default: keine Wiederholung. Kategorien mit Governance-/Security-Bezug erhalten
// eine Wiederholung, weil ein verlorenes Violation-Event ein Compliance-Risiko waere.
export const DEFAULT_CATEGORY_POLICIES: CategoryPolicy[] = [
  { category: 'Security Events', retry: { maxAttempts: 3, backoffMs: 500 } },
  { category: 'Compliance Events', retry: { maxAttempts: 3, backoffMs: 500 } },
  { category: 'Supervisor Events', retry: { maxAttempts: 2, backoffMs: 250 } },
];

export function resolveRetryPolicy(category: string): RetryPolicy {
  return DEFAULT_CATEGORY_POLICIES.find((p) => p.category === category)?.retry ?? { maxAttempts: 1, backoffMs: 0 };
}
