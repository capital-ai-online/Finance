// ESS-0011. ARCH-AUDIT-0002 (N4-Folge, Kapitel 14.4, Traceability Stufe 4): erste konkrete
// Validator-Implementierung auf Basis von Validator<TTarget, TFinding>. Wrappt OrphanDetector
// statt seine Logik zu duplizieren - IOrphanDetector bleibt die Schnittstelle, die
// Core/orphanDetector.ts erfuellt (ESS-0011-CONTRACTS); dieser Validator ordnet ihr Ergebnis
// nur in die generische Validator-Form ein.

import { OrphanDetector } from '../Core/orphanDetector';
import type { IOrphanDetector } from '../Interfaces';
import type { OrphanFinding, TraceabilityMatrix } from '../Models/traceabilityModels';
import { Validator, type ValidationResult } from './baseValidator';

export class TraceabilityMatrixValidator extends Validator<TraceabilityMatrix, OrphanFinding> {
  constructor(private readonly detector: IOrphanDetector = new OrphanDetector()) {
    super();
  }

  validate(matrix: TraceabilityMatrix): ValidationResult<OrphanFinding> {
    const findings = this.detector.detect(matrix);
    return { valid: findings.length === 0, findings };
  }
}
