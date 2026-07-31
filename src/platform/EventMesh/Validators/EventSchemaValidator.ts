// ESS-0013, Validators "EventSchemaValidator" — prueft Payload gegen EventSchema.

import { validatePayloadAgainstSchema, type EventSchema } from '../Contracts/EventSchema';
import type { EventPayload } from '../Contracts/EventPayload';
import type { ValidationResult } from './EventContractValidator';

export class EventSchemaValidator {
  validate(payload: EventPayload, schema: EventSchema): ValidationResult {
    const errors = validatePayloadAgainstSchema(payload, schema);
    return { valid: errors.length === 0, errors };
  }
}
