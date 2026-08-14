/**
 * Provider-neutral schema constants used by structured AI responses.
 * They replace the former Gemini SDK enum without retaining a runtime dependency.
 */
export const Type = {
  OBJECT: 'OBJECT',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  ARRAY: 'ARRAY',
  BOOLEAN: 'BOOLEAN',
  NULL: 'NULL',
} as const;

export type AiGenerationClient = {
  models: {
    generateContent(params: unknown): Promise<any>;
  };
};
