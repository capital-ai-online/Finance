// Audit ARCH-AUDIT-0002 (N4-Folge, Kapitel 14.4, Traceability Stufe 4): Testabdeckung fuer die
// erste generische Validator-Basisklasse im Repository und ihre erste konkrete Implementierung.

import { describe, it, expect } from 'vitest';
import { Validator, type ValidationResult } from '../../src/platform/Traceability/Validators/baseValidator';
import { TraceabilityMatrixValidator } from '../../src/platform/Traceability/Validators/traceabilityMatrixValidator';
import type { OrphanFinding, TraceabilityMatrix } from '../../src/platform/Traceability/Models/traceabilityModels';
import type { IOrphanDetector } from '../../src/platform/Traceability/Interfaces';

const EMPTY_MATRIX: TraceabilityMatrix = {
  generatedAt: new Date().toISOString(),
  ess: [],
  adr: [],
  components: [],
  tests: [],
  links: [],
};

describe('Traceability/Validators/baseValidator', () => {
  it('erzwingt eine konkrete validate()-Implementierung ueber eine konkrete Unterklasse', () => {
    class AlwaysValid extends Validator<string, never> {
      validate(_target: string): ValidationResult<never> {
        return { valid: true, findings: [] };
      }
    }
    const result = new AlwaysValid().validate('irrelevant');
    expect(result.valid).toBe(true);
    expect(result.findings).toEqual([]);
  });
});

describe('Traceability/Validators/traceabilityMatrixValidator', () => {
  function mockDetector(findings: OrphanFinding[]): IOrphanDetector {
    return { detect: () => findings };
  }

  it('valid=true und findings=[], wenn der injizierte OrphanDetector nichts findet', () => {
    const validator = new TraceabilityMatrixValidator(mockDetector([]));
    const result = validator.validate(EMPTY_MATRIX);
    expect(result.valid).toBe(true);
    expect(result.findings).toEqual([]);
  });

  it('valid=false und reicht die Befunde des OrphanDetectors unveraendert durch', () => {
    const findings: OrphanFinding[] = [
      { type: 'ess-without-component', id: 'ESS-0099', detail: 'Testbefund' },
    ];
    const validator = new TraceabilityMatrixValidator(mockDetector(findings));
    const result = validator.validate(EMPTY_MATRIX);
    expect(result.valid).toBe(false);
    expect(result.findings).toEqual(findings);
  });

  it('nutzt ohne injizierten Detector den echten OrphanDetector gegen eine reale Matrix', () => {
    const validator = new TraceabilityMatrixValidator();
    const result = validator.validate(EMPTY_MATRIX);
    // Eine leere Matrix hat keine ESS-Eintraege und keine Komponenten - der echte OrphanDetector
    // meldet dafuer keine Befunde (er iteriert ueber vorhandene ESS/Komponenten-Eintraege).
    expect(result.valid).toBe(true);
    expect(result.findings).toEqual([]);
  });
});
