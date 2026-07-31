// ESS-0013-CONTRACTS Abschnitt 3, Registry Contract.

export type EventRegistrationStatus = 'proposed' | 'registered' | 'deprecated';

export interface EventCatalogEntry {
  name: string;
  category: string;
  version: string;
  producers: string[];
  consumers: string[];
  essReferences: string[];
  adrReferences: string[];
  status: EventRegistrationStatus;
}

export interface IEventRegistry {
  registerEvent(entry: Omit<EventCatalogEntry, 'status'>): EventCatalogEntry;
  registerProducer(eventName: string, component: string): void;
  registerConsumer(eventName: string, component: string): void;
  getCatalogEntry(eventName: string): EventCatalogEntry | undefined;
  getFullCatalog(): EventCatalogEntry[];
}
