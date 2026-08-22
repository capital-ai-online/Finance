import type { IVocabularyRegistry } from '../Interfaces/IVocabularyRegistry';
import type { UiMessageDefinition, UiMessageFinding, UiMessageSurface } from './UiMessage';
import { UiMessageValidator } from '../Validators/UiMessageValidator';

export class UiMessageCatalog {
  private readonly messages = new Map<string, UiMessageDefinition>();

  constructor(
    private readonly vocabulary: IVocabularyRegistry,
    private readonly validator = new UiMessageValidator(),
  ) {}

  register(message: UiMessageDefinition): void {
    const findings = this.validateForRegistration(message);
    if (findings.length > 0) {
      const details = findings.map((finding) => `${finding.code}: ${finding.message}`).join('; ');
      throw new Error(`UI message ${message.key} is invalid: ${details}`);
    }

    if (this.messages.has(message.key)) {
      throw new Error(`UI message key already registered: ${message.key}`);
    }

    this.messages.set(message.key, this.freezeMessage(message));
  }

  registerAll(messages: UiMessageDefinition[]): void {
    for (const message of messages) this.register(message);
  }

  get(key: string): UiMessageDefinition | undefined {
    return this.messages.get(key);
  }

  list(): UiMessageDefinition[] {
    return [...this.messages.values()].sort((a, b) => a.key.localeCompare(b.key));
  }

  listByContext(context: UiMessageSurface): UiMessageDefinition[] {
    return this.list().filter((message) => message.context === context || message.context === 'shared');
  }

  private validateForRegistration(message: UiMessageDefinition): UiMessageFinding[] {
    const findings = this.validator.validate(message);
    for (const conceptId of message.conceptIds) {
      if (!this.vocabulary.getById(conceptId)) {
        findings.push({
          code: 'UNKNOWN_CONCEPT',
          messageKey: message.key,
          message: `Referenced Concept ID is not registered: ${conceptId}.`,
        });
      }
    }
    return findings;
  }

  private freezeMessage(message: UiMessageDefinition): UiMessageDefinition {
    return Object.freeze({
      ...message,
      text: Object.freeze({ ...message.text }),
      conceptIds: Object.freeze([...message.conceptIds]) as unknown as string[],
      placeholders: Object.freeze([...(message.placeholders ?? [])]) as unknown as string[],
      authorityReferences: Object.freeze([...(message.authorityReferences ?? [])]) as unknown as string[],
    });
  }
}
