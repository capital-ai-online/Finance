// Co-located with the existing news feature backend surface.
export { Newsticker } from './Newsticker';
export type { NewstickerProps } from './Newsticker';

// Remaining legacy news consumers stay behind explicit compatibility exports until
// their own bounded strangler slices move the implementation into this feature.
export { RealtimeAiNewsfeed } from '../../../components/RealtimeAiNewsfeed';
export { MarketSentiment } from '../../../components/MarketSentiment';
export { SentimentDashboard } from '../../../components/SentimentDashboard';
