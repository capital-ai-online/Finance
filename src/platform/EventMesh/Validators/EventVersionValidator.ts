// ESS-0013, Validators "EventVersionValidator" — Versionsformat und
// Versionssprung-Regeln (ESS-0001-CONTRACTS Chapter 8, Event Versioning).

import type { EventVersion } from '../Contracts/EventVersion';
import type { ValidationResult } from './EventContractValidator';

export class EventVersionValidator {
  validate(version: EventVersion): ValidationResult {
    const errors: string[] = [];
    for (const [key, value] of Object.entries(version)) {
      if (!Number.isInteger(value) || value < 0) {
        errors.push(`EventVersion.${key} muss eine nicht-negative Ganzzahl sein, war "${value}".`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  isValidBump(previous: EventVersion, next: EventVersion): boolean {
    if (next.major > previous.major) return next.minor === 0 && next.patch === 0;
    if (next.major === previous.major && next.minor > previous.minor) return next.patch === 0;
    if (next.major === previous.major && next.minor === previous.minor) return next.patch > previous.patch;
    return false;
  }
}
