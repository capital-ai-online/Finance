import type { UiMessageSurface } from '../Messages/UiMessage';
import type { FintechValueChainStageId } from '../ValueChain/FintechWordingBinding';

export interface WordingUsageReference {
  messageKey: string;
  conceptIds: string[];
  surface: UiMessageSurface;
  sourcePath: string;
  feature?: string;
  route?: string;
  fintechStageIds?: FintechValueChainStageId[];
}

export interface WordingImpactReport {
  conceptId: string;
  messageKeys: string[];
  sourcePaths: string[];
  features: string[];
  routes: string[];
  surfaces: UiMessageSurface[];
  fintechStageIds: FintechValueChainStageId[];
}
