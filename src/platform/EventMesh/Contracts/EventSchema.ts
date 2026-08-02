// ESS-0013, Core "EventSchema" — strukturelle Definition des Payloads zur
// Validierung durch EventSchemaValidator. Bewusst minimal (kein externes
// JSON-Schema-Paket), konsistent mit dem uebrigen Repository (src/platform/Security/rateLimiter.ts
// etc. verzichten ebenfalls bewusst auf zusaetzliche Abhaengigkeiten).

export type EventFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface EventFieldSchema {
  type: EventFieldType;
  required: boolean;
}

export interface EventSchema {
  /** Feldname -> Feldschema. Zusaetzliche, nicht gelistete Felder sind zulaessig. */
  fields: Record<string, EventFieldSchema>;
}

export function validatePayloadAgainstSchema(
  payload: Record<string, unknown>,
  schema: EventSchema
): string[] {
  const errors: string[] = [];
  for (const [field, fieldSchema] of Object.entries(schema.fields)) {
    const value = payload[field];
    if (value === undefined || value === null) {
      if (fieldSchema.required) {
        errors.push(`Pflichtfeld "${field}" fehlt im Payload.`);
      }
      continue;
    }
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    if (actualType !== fieldSchema.type) {
      errors.push(`Feld "${field}" hat Typ "${actualType}", erwartet "${fieldSchema.type}".`);
    }
  }
  return errors;
}
