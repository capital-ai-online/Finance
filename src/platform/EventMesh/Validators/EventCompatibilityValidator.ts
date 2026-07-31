// ESS-0013-CONTRACTS Abschnitt 4, Compatibility Contract — Breaking-Change-Erkennung
// zwischen zwei Payload-Schemas. Ein neues Pflichtfeld ist ein Breaking Change
// (Major), ein neues optionales Feld ist Minor, alles andere Patch.

import type { EventSchema } from '../Contracts/EventSchema';
import type { VersionBump } from '../Contracts/EventVersion';

export interface CompatibilityResult {
  bump: VersionBump;
  breakingChanges: string[];
  requiresAdr: boolean;
}

export class EventCompatibilityValidator {
  compare(previous: EventSchema, next: EventSchema): CompatibilityResult {
    const breakingChanges: string[] = [];
    let hasNewOptionalField = false;

    for (const [field, nextField] of Object.entries(next.fields)) {
      const prevField = previous.fields[field];
      if (!prevField) {
        if (nextField.required) {
          breakingChanges.push(`Neues Pflichtfeld "${field}" ohne Vorgaenger.`);
        } else {
          hasNewOptionalField = true;
        }
        continue;
      }
      if (!prevField.required && nextField.required) {
        breakingChanges.push(`Feld "${field}" wurde von optional auf pflicht geaendert.`);
      }
      if (prevField.type !== nextField.type) {
        breakingChanges.push(`Feld "${field}" hat den Typ von "${prevField.type}" auf "${nextField.type}" geaendert.`);
      }
    }

    for (const field of Object.keys(previous.fields)) {
      if (!(field in next.fields) && previous.fields[field].required) {
        breakingChanges.push(`Pflichtfeld "${field}" wurde entfernt.`);
      }
    }

    const bump: VersionBump = breakingChanges.length > 0 ? 'major' : hasNewOptionalField ? 'minor' : 'patch';
    return { bump, breakingChanges, requiresAdr: breakingChanges.length > 0 };
  }
}
