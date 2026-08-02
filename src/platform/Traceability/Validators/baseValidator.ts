// ESS-0011. Erste generische Validator-Basisklasse im gesamten Repository.
// ARCH-AUDIT-0002 (N4-Folge, Kapitel 14.4, Traceability Stufe 4).
//
// src/platform/EventMesh/Validators/EventContractValidator.ts ist die bislang einzige
// Validator-Implementierung im Repository - eine konkrete Klasse ohne gemeinsame Basis, mit
// einem eigenen, nur fuer Event Contracts passenden ValidationResult (`{ valid, errors: string[] }`).
// Diese Datei fuehrt stattdessen eine generische Basis ein, die auf Befund-Objekte statt auf
// Fehlertexte abzielt - passend fuer die Traceability Matrix, deren Befunde (OrphanFinding)
// bereits strukturierte Objekte sind (type/id/detail), keine Strings. EventContractValidator
// wird bewusst NICHT rueckwirkend auf diese Basis umgestellt - das waere eine Aenderung an
// einer fremden Komponente (EventMesh) ausserhalb des Umfangs dieser Massnahme.

export interface ValidationResult<TFinding> {
  valid: boolean;
  findings: TFinding[];
}

export abstract class Validator<TTarget, TFinding> {
  abstract validate(target: TTarget): ValidationResult<TFinding>;
}
