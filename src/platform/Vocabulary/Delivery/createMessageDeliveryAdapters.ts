import type { UiMessageCatalog } from '../Messages/UiMessageCatalog';
import { MessageDeliveryAdapter } from './MessageDeliveryAdapter';

export interface MessageDeliveryAdapters {
  react: MessageDeliveryAdapter;
  pdf: MessageDeliveryAdapter;
  email: MessageDeliveryAdapter;
  seo: MessageDeliveryAdapter;
  accessibility: MessageDeliveryAdapter;
}

export function createMessageDeliveryAdapters(messages: UiMessageCatalog): MessageDeliveryAdapters {
  return Object.freeze({
    react: new MessageDeliveryAdapter(messages, 'react'),
    pdf: new MessageDeliveryAdapter(messages, 'pdf'),
    email: new MessageDeliveryAdapter(messages, 'email'),
    seo: new MessageDeliveryAdapter(messages, 'seo'),
    accessibility: new MessageDeliveryAdapter(messages, 'accessibility'),
  });
}
