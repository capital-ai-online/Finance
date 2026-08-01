/**
 * CAPITAL-AI Social Media & Podcast Engine
 * Decoupled Module Barrel File
 *
 * ADR-0020: exportiert nur den Account-/OAuth-/Publishing-Teil, siehe
 * SocialMediaGeneratorService.ts fuer die Scope-Begruendung.
 */

export * from './types';
export * from './SocialMediaGeneratorService';
