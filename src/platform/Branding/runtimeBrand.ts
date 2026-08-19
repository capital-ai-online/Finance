declare const __CAPITAL_AI_VERSION__: string;

/**
 * Canonical client-visible release version injected by Vite from package.json.
 *
 * Keep release identity outside individual UI/report components so the product
 * wordmark and generated artifacts cannot drift to independent hard-coded
 * versions.
 */
export const CAPITAL_AI_VERSION = __CAPITAL_AI_VERSION__;
