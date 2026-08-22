import { VocabularyRegistry } from '../Registry/VocabularyRegistry';
import { seedConcepts } from '../Registry/seedConcepts';
import { UiMessageCatalog } from '../Messages/UiMessageCatalog';
import { seedMessages } from '../Messages/seedMessages';
import { migrationMessages } from '../Messages/migrationMessages';
import { MessageDeliveryAdapter, type MessageValues } from './MessageDeliveryAdapter';
import type { UiMessageLocale } from '../Messages/UiMessage';

const registry = new VocabularyRegistry();
registry.registerAll(seedConcepts);

const catalog = new UiMessageCatalog(registry);
catalog.registerAll([...seedMessages, ...migrationMessages]);

const reactAdapter = new MessageDeliveryAdapter(catalog, 'react');
const accessibilityAdapter = new MessageDeliveryAdapter(catalog, 'accessibility');

export function getReactMessage(key: string, locale: UiMessageLocale = 'de', values: MessageValues = {}): string {
  return reactAdapter.format(key, locale, values);
}

export function getAccessibilityMessage(key: string, locale: UiMessageLocale = 'de', values: MessageValues = {}): string {
  return accessibilityAdapter.format(key, locale, values);
}
