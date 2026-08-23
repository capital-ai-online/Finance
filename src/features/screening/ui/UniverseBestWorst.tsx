// Compatibility alias during Strangler migration (BB-4 screening slice).
// Productive ranking surface is RankingBoard — Top/Worst 3, Sentiment, Momentum, leading Pattern.
// No parallel architecture: same feature slice, same verified scoring consumers, same 24-candidate SLA.
export { RankingBoard as UniverseBestWorst } from './RankingBoard';
