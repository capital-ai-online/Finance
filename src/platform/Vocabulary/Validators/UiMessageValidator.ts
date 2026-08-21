import type { UiMessageDefinition, UiMessageFinding } from '../Messages/UiMessage';

const MESSAGE_KEY_PATTERN = /^[a-z][A-Za-z0-9]*(?:\.[a-z][A-Za-z0-9]*)+$/;
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
const PLACEHOLDER_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;
const PLACEHOLDER_TOKEN_PATTERN = /\{([A-Za-z][A-Za-z0-9_]*)\}/g;

function placeholderToken(name: string): string {
  return `{${name}}`;
}

function extractPlaceholders(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER_TOKEN_PATTERN)].map((match) => match[1]);
}

export class UiMessageValidator {
  validate(message: UiMessageDefinition): UiMessageFinding[] {
    const findings: UiMessageFinding[] = [];

    if (!MESSAGE_KEY_PATTERN.test(message.key)) {
      findings.push({
        code: 'INVALID_KEY',
        messageKey: message.key,
        message: `Message key must match ${MESSAGE_KEY_PATTERN.source}.`,
      });
    }

    if (!SEMVER_PATTERN.test(message.version)) {
      findings.push({
        code: 'INVALID_VERSION',
        messageKey: message.key,
        message: 'Message version must use MAJOR.MINOR.PATCH.',
      });
    }

    if (!message.text.de.trim() || !message.text.en.trim()) {
      findings.push({
        code: 'MISSING_TEXT',
        messageKey: message.key,
        message: 'German and English message text are required.',
      });
    }

    if (message.conceptIds.length === 0) {
      findings.push({
        code: 'MISSING_CONCEPT',
        messageKey: message.key,
        message: 'Every governed message must reference at least one Concept ID.',
      });
    }

    const placeholders = message.placeholders ?? [];
    const declared = new Set(placeholders);
    const normalized = new Set<string>();
    for (const placeholder of placeholders) {
      if (!PLACEHOLDER_PATTERN.test(placeholder)) {
        findings.push({
          code: 'INVALID_PLACEHOLDER',
          messageKey: message.key,
          message: `Invalid placeholder name: ${placeholder}.`,
        });
      }
      const key = placeholder.toLocaleLowerCase('en-US');
      if (normalized.has(key)) {
        findings.push({
          code: 'DUPLICATE_PLACEHOLDER',
          messageKey: message.key,
          message: `Duplicate placeholder: ${placeholder}.`,
        });
      }
      normalized.add(key);

      for (const locale of ['de', 'en'] as const) {
        if (!message.text[locale].includes(placeholderToken(placeholder))) {
          findings.push({
            code: 'PLACEHOLDER_MISMATCH',
            messageKey: message.key,
            message: `Declared placeholder ${placeholder} is missing from ${locale.toUpperCase()} text.`,
          });
        }
      }
    }

    for (const locale of ['de', 'en'] as const) {
      for (const placeholder of new Set(extractPlaceholders(message.text[locale]))) {
        if (!declared.has(placeholder)) {
          findings.push({
            code: 'UNDECLARED_PLACEHOLDER',
            messageKey: message.key,
            message: `Placeholder ${placeholder} occurs in ${locale.toUpperCase()} text but is not declared.`,
          });
        }
      }
    }

    return findings;
  }
}
