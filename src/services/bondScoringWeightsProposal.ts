/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ADR-0022 verlangt explizit: "Gewichte duerfen erst mit einem separaten versionierten
// Scoring Contract festgelegt werden." Dieser Datei liefert genau diesen separaten Contract -
// als PROPOSAL, das ein:e menschliche:r Reviewer:in pruefen und formal freigeben muss, bevor
// irgendein Code ihn fuer echtes Bond-Scoring verwendet.
//
// Wichtige Abgrenzung zu src/services/bondFeatureContract.ts und src/types/bondScoringContract.ts:
// Diese beiden Dateien bleiben unveraendert die alleinige, gesperrte Instanz fuer
// Evidence-Vollstaendigkeit (`evaluateBondEvidenceGate()` liefert weiterhin ausschliesslich
// `score: null`). Diese Datei hier ist bewusst NICHT von einer Route importiert und veraendert
// diese Sperre an keiner Stelle - sie ist ein eigenstaendiges Bewertungs-/Review-Artefakt fuer
// die in ADR-0022 vorgeschlagenen Scoring-Dimensionen, kein produktiver Scoring-Pfad.
// `previewHypotheticalBondScore()` existiert ausschliesslich fuer die in ADR-0022 geforderte
// Golden-Dataset-/Backtesting-Validierung durch Reviewer:innen ausserhalb der Produktionspfade.

export const BOND_SCORING_WEIGHTS_PROPOSAL_VERSION = 'bond-scoring-weights-proposal/0.1.0-draft' as const;

export type WeightReviewStatus = 'proposed' | 'approved' | 'rejected';

export interface BondScoringDimensionWeight {
  /** Menschlich lesbarer Name, identisch zur Tabelle "Proposed scoring dimensions" in ADR-0022. */
  dimension: string;
  /** Feld-Schluessel, unter dem der normierte (0-1) Faktorwert in previewHypotheticalBondScore erwartet wird. */
  featureKey: string;
  /** Gewicht 0-1; alle Gewichte muessen in Summe 1.0 ergeben (siehe validateBondScoringWeightsProposal). */
  weight: number;
  /** Woraus der Faktor gemaess ADR-0022 stammen muss (nur reale, belegte Evidence, keine Schaetzung). */
  evidenceBasis: string;
  rationale: string;
}

export interface BondScoringWeightsProposal {
  contractVersion: typeof BOND_SCORING_WEIGHTS_PROPOSAL_VERSION;
  adr: 'ADR-0022';
  status: WeightReviewStatus;
  proposedBy: string;
  proposedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  dimensions: BondScoringDimensionWeight[];
  /** Literal false: dieses Proposal darf, solange status !== 'approved' und keine Route es referenziert, niemals einen produktiven Score erzeugen. */
  scoringEnabled: false;
  note: string;
}

/**
 * Entwurf gemaess ADR-0022 "Proposed scoring dimensions"-Tabelle. status:'proposed' bis eine
 * reviewende Person (siehe docs/adr/ADR-0028-bond-scoring-weights-proposal.md) reviewedBy/
 * reviewedAt setzt und den Status manuell auf 'approved' aendert - das geschieht bewusst nicht
 * automatisiert.
 */
export const DRAFT_BOND_SCORING_WEIGHTS: BondScoringWeightsProposal = {
  contractVersion: BOND_SCORING_WEIGHTS_PROPOSAL_VERSION,
  adr: 'ADR-0022',
  status: 'proposed',
  proposedBy: 'Claude Code (Engineering-Entwurf, keine fachliche Freigabe)',
  proposedAt: new Date('2026-08-02T00:00:00.000Z').toISOString(),
  reviewedBy: null,
  reviewedAt: null,
  scoringEnabled: false,
  dimensions: [
    {
      dimension: 'Interest-rate sensitivity',
      featureKey: 'interestRateSensitivity',
      weight: 0.22,
      evidenceBasis: 'modifiedDuration (BondFeatureCandidate), keine geschaetzte Duration',
      rationale: 'Zinssensitivitaet ist der dominante Preistreiber bei Anleihen; hoechstes Einzelgewicht, konsistent mit Standard-Fixed-Income-Risikomodellen (z.B. Duration-basiertes VaR).',
    },
    {
      dimension: 'Yield attractiveness',
      featureKey: 'yieldAttractiveness',
      weight: 0.18,
      evidenceBasis: 'yieldToMaturityPct relativ zu treasury2yPct/treasury10yPct (BondFeatureCandidate)',
      rationale: 'Attraktivitaet nur relativ zur Referenzkurve, nie als absoluter Zielwert, um Renditejagd ohne Risikoausgleich zu vermeiden.',
    },
    {
      dimension: 'Credit quality',
      featureKey: 'creditQuality',
      weight: 0.20,
      evidenceBasis: 'Rating-Evidence einer anerkannten Ratingagentur (noch nicht als Provider integriert - siehe missingFields in ADR-0028)',
      rationale: 'Kreditrisiko ist bei Nicht-Staatsanleihen (z.B. AAA-CORP) ein Hauptfaktor; hohes Gewicht trotz aktuell fehlender Ratingquelle, um dessen Bedeutung nicht durch ein niedriges Gewicht zu verschleiern.',
    },
    {
      dimension: 'Liquidity',
      featureKey: 'liquidity',
      weight: 0.12,
      evidenceBasis: 'reales Handelsvolumen/Spread (noch keine Provider-Anbindung fuer Bond-Spreads vorhanden)',
      rationale: 'Niedrigeres Gewicht als bei Krypto/Aktien, da Liquiditaet bei Staatsanleihen typischerweise strukturell hoch und weniger differenzierend ist.',
    },
    {
      dimension: 'Price momentum',
      featureKey: 'priceMomentum',
      weight: 0.12,
      evidenceBasis: 'reale Kurshistorie (EODHD *.GBOND, siehe eodhdBondEvidence.ts) via realMarketSignals.scoreMomentum()',
      rationale: 'Wiederverwendung derselben, bereits getesteten Momentum-Formel wie bei Krypto/Aktien/Forex statt einer neuen, unvalidierten Berechnung.',
    },
    {
      dimension: 'Curve / regime context',
      featureKey: 'curveRegimeContext',
      weight: 0.10,
      evidenceBasis: 'FRED/ECB Referenzkurve (macroRateEvidence.ts, bereits real angebunden)',
      rationale: 'Reine Kontext-/Regime-Information, kein Execution-Preis (siehe ADR-0022); daher bewusst niedriger gewichtet als direkte Instrument-Faktoren.',
    },
    {
      dimension: 'Currency risk',
      featureKey: 'currencyRisk',
      weight: 0.06,
      evidenceBasis: 'Bond-Waehrung + ECB-Referenzkurs (keine Verwendung als Execution-Preis)',
      rationale: 'Nur fuer Fremdwaehrungsanleihen relevant; niedrigstes Gewicht, da die meisten aktuell verfuegbaren Instrumente auf die Nutzerwaehrung lauten.',
    },
  ],
  note: 'ENTWURF - keine fachliche/regulatorische Freigabe. Gewichte sind ein Ausgangsvorschlag fuer die in ADR-0022 geforderte Golden-Dataset-Validierung, nicht das Ergebnis einer solchen Validierung. Vor jeder produktiven Nutzung: (1) fachliche Pruefung der Gewichte und Dimensionen, (2) Backtesting gegen ein Golden Dataset gemaess ADR-0022, (3) manuelles Setzen von status="approved" inkl. reviewedBy/reviewedAt, (4) erst danach darf eine Route dieses Proposal referenzieren.',
};

export interface WeightsProposalValidation {
  valid: boolean;
  errors: string[];
  weightSum: number;
}

/** Rein strukturelle Validierung (Summe=1, Bereich, Pflichtfelder) - ersetzt keine fachliche Review. */
export function validateBondScoringWeightsProposal(proposal: BondScoringWeightsProposal): WeightsProposalValidation {
  const errors: string[] = [];
  if (proposal.scoringEnabled !== false) errors.push('scoringEnabled muss literal false sein.');
  if (proposal.dimensions.length === 0) errors.push('Mindestens eine Scoring-Dimension erforderlich.');

  for (const dim of proposal.dimensions) {
    if (!Number.isFinite(dim.weight) || dim.weight < 0 || dim.weight > 1) {
      errors.push(`Dimension "${dim.dimension}": Gewicht muss zwischen 0 und 1 liegen.`);
    }
    if (!dim.evidenceBasis?.trim()) errors.push(`Dimension "${dim.dimension}": evidenceBasis fehlt.`);
    if (!dim.rationale?.trim()) errors.push(`Dimension "${dim.dimension}": rationale fehlt.`);
  }

  const weightSum = Number(proposal.dimensions.reduce((sum, dim) => sum + dim.weight, 0).toFixed(6));
  if (Math.abs(weightSum - 1) > 1e-6) {
    errors.push(`Gewichtssumme muss 1.0 ergeben, ist aber ${weightSum}.`);
  }

  if (proposal.status === 'approved' && (!proposal.reviewedBy || !proposal.reviewedAt)) {
    errors.push('status="approved" erfordert gesetzte reviewedBy/reviewedAt-Felder.');
  }

  return { valid: errors.length === 0, errors, weightSum };
}

export interface HypotheticalBondScorePreview {
  contractVersion: typeof BOND_SCORING_WEIGHTS_PROPOSAL_VERSION;
  hypotheticalScore: number | null;
  usedDimensions: string[];
  missingDimensions: string[];
  disclaimer: string;
}

/**
 * Nur fuer die manuelle Golden-Dataset-/Backtesting-Pruefung durch Reviewer:innen (ADR-0022).
 * Erzeugt AUSDRUECKLICH KEINEN produktiven Score: wird von keiner Route aufgerufen und ist nicht
 * mit `evaluateBondEvidenceGate()`/`BondEvidenceGateResult.score` (bleibt `null`) verbunden.
 * Wirft, solange proposal.status nicht "approved" ist, um eine versehentliche produktive
 * Verwendung schon im Code auszuschliessen.
 */
export function previewHypotheticalBondScore(
  proposal: BondScoringWeightsProposal,
  features: Partial<Record<string, number>>,
): HypotheticalBondScorePreview {
  if (proposal.status !== 'approved') {
    throw new Error(
      `Bond-Scoring-Gewichte sind status="${proposal.status}", nicht "approved". previewHypotheticalBondScore() ist ausschliesslich fuer die Review-/Backtesting-Phase nach formaler Freigabe bestimmt, siehe docs/adr/ADR-0028-bond-scoring-weights-proposal.md.`,
    );
  }

  const usedDimensions: string[] = [];
  const missingDimensions: string[] = [];
  let weightedSum = 0;
  let usedWeight = 0;

  for (const dim of proposal.dimensions) {
    const value = features[dim.featureKey];
    if (typeof value === 'number' && Number.isFinite(value)) {
      weightedSum += value * dim.weight;
      usedWeight += dim.weight;
      usedDimensions.push(dim.dimension);
    } else {
      missingDimensions.push(dim.dimension);
    }
  }

  const hypotheticalScore = usedWeight > 0 ? Number(((weightedSum / usedWeight) * 100).toFixed(2)) : null;

  return {
    contractVersion: BOND_SCORING_WEIGHTS_PROPOSAL_VERSION,
    hypotheticalScore,
    usedDimensions,
    missingDimensions,
    disclaimer: 'Hypothetische Backtesting-Ausgabe fuer die Golden-Dataset-Validierung gemaess ADR-0022 - keine produktive Kennzahl, keine Anlageberatung, nicht mit dem verifizierten Bond-Evidence-Gate verbunden.',
  };
}
