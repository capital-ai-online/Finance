export type UiMessageLocale = 'de' | 'en';

export type UiMessageSurface =
  | 'react'
  | 'pdf'
  | 'email'
  | 'seo'
  | 'accessibility'
  | 'shared';

export type UiMessageStatus = 'draft' | 'approved' | 'deprecated' | 'retired';

export interface UiMessageText {
  de: string;
  en: string;
}

export interface UiMessageDefinition {
  key: string;
  text: UiMessageText;
  conceptIds: string[];
  context: UiMessageSurface;
  status: UiMessageStatus;
  version: string;
  placeholders?: string[];
  authorityReferences?: string[];
  description?: string;
}

export interface UiMessageFinding {
  code:
    | 'INVALID_KEY'
    | 'INVALID_VERSION'
    | 'MISSING_TEXT'
    | 'MISSING_CONCEPT'
    | 'DUPLICATE_PLACEHOLDER'
    | 'INVALID_PLACEHOLDER'
    | 'PLACEHOLDER_MISMATCH'
    | 'UNDECLARED_PLACEHOLDER'
    | 'UNKNOWN_CONCEPT'
    | 'KEY_COLLISION';
  messageKey: string;
  message: string;
}
