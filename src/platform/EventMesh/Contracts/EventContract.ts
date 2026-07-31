// ESS-0013, Core "EventContract" — fasst EventMetadata, EventPayload, EventVersion
// und EventSchema zu einem einzelnen, veroeffentlichbaren Event zusammen.

import type { EventMetadata } from './EventMetadata';
import type { EventPayload } from './EventPayload';
import type { EventVersion } from './EventVersion';

export interface EventContract<TPayload extends EventPayload = EventPayload> {
  metadata: EventMetadata;
  version: EventVersion;
  payload: TPayload;
}

export function createEventContract<TPayload extends EventPayload>(
  metadata: EventMetadata,
  version: EventVersion,
  payload: TPayload
): EventContract<TPayload> {
  return { metadata, version, payload };
}
