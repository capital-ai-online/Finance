// ESS-0013-CONTRACTS Abschnitt 3 + 9 — Vollstaendigkeit der Pflichtfelder aus
// Chapter 8 plus ETM-Referenz. Ein unvollstaendiger Contract wird zurueckgewiesen,
// niemals mit Luecken registriert.

import { isEventMetadataComplete } from '../Contracts/EventMetadata';
import type { EventContract } from '../Contracts/EventContract';
import type { EventPayload } from '../Contracts/EventPayload';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class EventContractValidator {
  validate<TPayload extends EventPayload>(event: EventContract<TPayload>): ValidationResult {
    const errors: string[] = [];

    if (!isEventMetadataComplete(event.metadata)) {
      errors.push('EventMetadata ist unvollstaendig (Chapter 8, Event Contract Pflichtfelder).');
    }
    if (!event.metadata.etmReferences || event.metadata.etmReferences.components.length === 0) {
      errors.push('ETM-Referenz fehlt (ESS-0013-CONTRACTS Abschnitt 9) - Event bleibt im Status "proposed".');
    }
    if (!event.version) {
      errors.push('EventVersion fehlt.');
    }
    if (event.payload === undefined || event.payload === null) {
      errors.push('EventPayload fehlt.');
    }

    return { valid: errors.length === 0, errors };
  }
}
