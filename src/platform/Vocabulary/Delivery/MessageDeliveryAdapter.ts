import type { UiMessageCatalog } from '../Messages/UiMessageCatalog';
import type { UiMessageLocale, UiMessageSurface } from '../Messages/UiMessage';

export type MessageValues = Record<string, string | number>;

export class MessageDeliveryAdapter {
  constructor(
    private readonly messages: UiMessageCatalog,
    readonly surface: Exclude<UiMessageSurface, 'shared'>,
  ) {}

  format(key: string, locale: UiMessageLocale, values: MessageValues = {}): string {
    const message = this.messages.get(key);
    if (!message) throw new Error(`Unknown UI message key: ${key}`);
    if (message.status === 'retired') throw new Error(`Retired UI message cannot be delivered: ${key}`);
    if (message.context !== 'shared' && message.context !== this.surface) {
      throw new Error(`UI message ${key} is scoped to ${message.context}, not ${this.surface}.`);
    }

    let output = message.text[locale];
    for (const placeholder of message.placeholders ?? []) {
      if (!(placeholder in values)) {
        throw new Error(`Missing value for UI message placeholder ${placeholder} in ${key}.`);
      }
      output = output.split(`{${placeholder}}`).join(String(values[placeholder]));
    }

    return output;
  }
}
