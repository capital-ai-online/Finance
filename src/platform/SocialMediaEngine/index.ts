/**
 * CAPITAL-AI Social Media & Podcast Engine
 * Decoupled Module Barrel File
 *
 * ADR-0020 keeps the account/OAuth/publishing authority in the existing service.
 * ADR-0098 adds provider-neutral MediaProject contracts without granting publish authority.
 */

export * from './types';
export * from './SocialMediaGeneratorService';
export * from './Contracts/MediaProject';
export * from './Contracts/MediaProjectValidation';
export * from './Editing/MediaProjectEditing';
export * from './Editing/MediaStudioTemplates';
export * from './Rendering/LegacyMediaRenderManifestAdapter';
