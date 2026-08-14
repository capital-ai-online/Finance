/**
 * Local document-hygiene artifacts are development tooling. The production image is immutable
 * and must never create or modify repository/upload files at runtime.
 */
export function isDocumentHygieneRuntimeWritable(
  environment: string | undefined = process.env.NODE_ENV,
): boolean {
  return environment !== 'production';
}
