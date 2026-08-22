import {
  CRYPTO_CATEGORY_ANALYSIS_PROFILES,
  type CryptoAnalysisProfileId,
} from '../../CryptoModuleContracts';

export const CRYPTO_CATEGORY_FEATURE_CONTRACT_VERSION =
  'fintech-core.crypto/category-features/0.2.0' as const;

export type CryptoFeatureRequirement = 'REQUIRED' | 'OPTIONAL' | 'HARD_GATE';
export type CryptoFeatureValueType = 'NUMBER' | 'BOOLEAN' | 'TEXT';
export type CryptoFeatureDomain =
  | 'MARKET'
  | 'NETWORK'
  | 'TOKENOMICS'
  | 'PROTOCOL'
  | 'LEGAL'
  | 'CUSTODY'
  | 'LIQUIDITY'
  | 'PRODUCT'
  | 'COMMUNITY'
  | 'RESERVES'
  | 'VENUE'
  | 'TECHNICAL'
  | 'RISK';

export type CryptoFeatureEvidenceStatus =
  | 'VERIFIED'
  | 'STALE'
  | 'NOT_AVAILABLE'
  | 'INVALID'
  | 'NOT_APPLICABLE';

export type CryptoCategoryFeatureContractStatus =
  | 'READY'
  | 'PARTIAL'
  | 'NOT_COMPUTABLE'
  | 'BLOCKED';

export type CryptoFeaturePrimitive = number | boolean | string;

export interface CryptoFeatureDefinition {
  readonly key: string;
  readonly domain: CryptoFeatureDomain;
  readonly requirement: CryptoFeatureRequirement;
  readonly valueType: CryptoFeatureValueType;
  readonly unit?: string;
  readonly description: string;
}

export interface CryptoFeatureEvidence {
  readonly key: string;
  readonly status: CryptoFeatureEvidenceStatus;
  readonly value: CryptoFeaturePrimitive | null;
  readonly provider: string | null;
  readonly evidenceRefs: readonly string[];
  readonly observedAt: string | null;
  readonly retrievedAt: string | null;
  readonly degraded?: boolean;
  readonly reason?: string;
}

export interface CryptoCategoryFeatureContract {
  readonly contractVersion: typeof CRYPTO_CATEGORY_FEATURE_CONTRACT_VERSION;
  readonly assetId: string;
  readonly profileId: CryptoAnalysisProfileId;
  readonly profileSourceStatus: 'SOURCE_DEFINED' | 'PENDING_EVIDENCE';
  readonly status: CryptoCategoryFeatureContractStatus;
  /** Coverage of REQUIRED + HARD_GATE definitions only. This is evidence coverage, not a score. */
  readonly evidenceCoverage: number;
  readonly observations: readonly CryptoFeatureEvidence[];
  readonly universalMarketEvidence: readonly CryptoFeatureEvidence[];
  readonly missingRequiredFeatures: readonly string[];
  readonly missingHardGates: readonly string[];
  readonly failedHardGates: readonly string[];
  readonly rejectedEvidenceKeys: readonly string[];
  readonly scoreAuthority: 'SCORING_DISPATCHER_ONLY';
}

const definition = (
  key: string,
  domain: CryptoFeatureDomain,
  requirement: CryptoFeatureRequirement,
  valueType: CryptoFeatureValueType,
  description: string,
  unit?: string,
): CryptoFeatureDefinition => Object.freeze({ key, domain, requirement, valueType, description, unit });

/**
 * Universal verified market/supply observations that may accompany every profile. They do not
 * satisfy category-specific requirements unless a future, separately reviewed feature-promotion
 * adapter explicitly maps them. In particular volume != liquidity and market cap != network use.
 */
export const CRYPTO_UNIVERSAL_MARKET_FEATURES = Object.freeze([
  definition('market.priceUsd', 'MARKET', 'OPTIONAL', 'NUMBER', 'Verified spot/display market price.', 'USD'),
  definition('market.change24hPct', 'MARKET', 'OPTIONAL', 'NUMBER', 'Verified 24 hour price change.', 'percent'),
  definition('market.marketCapUsd', 'MARKET', 'OPTIONAL', 'NUMBER', 'Verified market capitalization.', 'USD'),
  definition('market.volume24hUsd', 'MARKET', 'OPTIONAL', 'NUMBER', 'Verified 24 hour trading volume.', 'USD'),
  definition('tokenomics.circulatingSupply', 'TOKENOMICS', 'OPTIONAL', 'NUMBER', 'Verified circulating token supply.', 'token'),
  definition('tokenomics.maxSupply', 'TOKENOMICS', 'OPTIONAL', 'NUMBER', 'Verified maximum token supply when defined.', 'token'),
  definition('tokenomics.totalSupply', 'TOKENOMICS', 'OPTIONAL', 'NUMBER', 'Verified total token supply.', 'token'),
] as const);

/**
 * SC-4 extended provider facts. They are OPTIONAL raw evidence only and do not by themselves
 * establish a normalized category score, hard-gate PASS, manipulation clearance or trade approval.
 * The same fact catalog is admitted for Meme and DeFi research so the evidence service can remain
 * profile-neutral while downstream, versioned feature transforms choose what is semantically usable.
 */
const EXTENDED_CRYPTO_PROVIDER_RAW_FEATURES = Object.freeze([
  definition('security.contractOpenSource', 'RISK', 'OPTIONAL', 'BOOLEAN', 'Provider fact: contract source is published/open source.'),
  definition('security.contractIsProxy', 'RISK', 'OPTIONAL', 'BOOLEAN', 'Provider fact: contract is a proxy/upgradeable deployment.'),
  definition('security.mintable', 'RISK', 'OPTIONAL', 'BOOLEAN', 'Provider fact: token supply can be minted.'),
  definition('security.blacklistFunction', 'RISK', 'OPTIONAL', 'BOOLEAN', 'Provider fact: blacklist capability exists.'),
  definition('security.transferPausable', 'RISK', 'OPTIONAL', 'BOOLEAN', 'Provider fact: transfers can be paused.'),
  definition('security.ownerCanChangeBalance', 'RISK', 'OPTIONAL', 'BOOLEAN', 'Provider fact: privileged balance modification capability exists.'),
  definition('risk.honeypotDetected', 'RISK', 'OPTIONAL', 'BOOLEAN', 'Provider fact: honeypot behavior was detected.'),
  definition('risk.cannotBuy', 'RISK', 'OPTIONAL', 'BOOLEAN', 'Provider fact: buy simulation/behavior indicates buying is blocked.'),
  definition('risk.cannotSellAll', 'RISK', 'OPTIONAL', 'BOOLEAN', 'Provider fact: selling the full balance is restricted.'),
  definition('risk.taxModifiable', 'RISK', 'OPTIONAL', 'BOOLEAN', 'Provider fact: tax/slippage parameters can be modified.'),
  definition('risk.buyTax', 'RISK', 'OPTIONAL', 'NUMBER', 'Observed/configured buy tax fraction.', 'ratio'),
  definition('risk.sellTax', 'RISK', 'OPTIONAL', 'NUMBER', 'Observed/configured sell tax fraction.', 'ratio'),
  definition('risk.transferTax', 'RISK', 'OPTIONAL', 'NUMBER', 'Observed/configured transfer tax fraction.', 'ratio'),
  definition('distribution.ownerShare', 'COMMUNITY', 'OPTIONAL', 'NUMBER', 'Owner wallet share of token supply.', 'ratio'),
  definition('distribution.creatorShare', 'COMMUNITY', 'OPTIONAL', 'NUMBER', 'Creator/deployer share of token supply.', 'ratio'),
  definition('distribution.holderCount', 'COMMUNITY', 'OPTIONAL', 'NUMBER', 'Provider-reported token holder count.', 'wallets'),
  definition('distribution.topHolderShare', 'COMMUNITY', 'OPTIONAL', 'NUMBER', 'Sum of provider-reported top-holder shares.', 'ratio'),
  definition('liquidity.lockedLpShare', 'LIQUIDITY', 'OPTIONAL', 'NUMBER', 'Share of provider-reported LP holdings marked locked.', 'ratio'),
  definition('liquidity.dexLiquidityUsd', 'LIQUIDITY', 'OPTIONAL', 'NUMBER', 'Provider-reported aggregate DEX liquidity.', 'USD'),
  definition('derivatives.openInterestUsd', 'MARKET', 'OPTIONAL', 'NUMBER', 'Aggregated derivatives open interest.', 'USD'),
  definition('derivatives.openInterestChange5mPct', 'MARKET', 'OPTIONAL', 'NUMBER', 'Open-interest change over 5 minutes.', 'percent'),
  definition('derivatives.openInterestChange1hPct', 'MARKET', 'OPTIONAL', 'NUMBER', 'Open-interest change over 1 hour.', 'percent'),
  definition('derivatives.openInterestChange4hPct', 'MARKET', 'OPTIONAL', 'NUMBER', 'Open-interest change over 4 hours.', 'percent'),
  definition('derivatives.openInterestChange24hPct', 'MARKET', 'OPTIONAL', 'NUMBER', 'Open-interest change over 24 hours.', 'percent'),
  definition('derivatives.meanFundingRate', 'MARKET', 'OPTIONAL', 'NUMBER', 'Mean observed funding rate across reported venues.', 'ratio'),
  definition('risk.liquidationUsd24h', 'RISK', 'OPTIONAL', 'NUMBER', 'Total derivatives liquidations over 24 hours.', 'USD'),
  definition('risk.longLiquidationUsd24h', 'RISK', 'OPTIONAL', 'NUMBER', 'Long liquidations over 24 hours.', 'USD'),
  definition('risk.shortLiquidationUsd24h', 'RISK', 'OPTIONAL', 'NUMBER', 'Short liquidations over 24 hours.', 'USD'),
  definition('liquidity.orderbookBidsUsd1Pct', 'LIQUIDITY', 'OPTIONAL', 'NUMBER', 'Aggregated bid depth within the governed 1 percent range.', 'USD'),
  definition('liquidity.orderbookAsksUsd1Pct', 'LIQUIDITY', 'OPTIONAL', 'NUMBER', 'Aggregated ask depth within the governed 1 percent range.', 'USD'),
  definition('tokenomics.nextUnlockAt', 'TOKENOMICS', 'OPTIONAL', 'TEXT', 'ISO timestamp of the next reported token unlock.'),
  definition('tokenomics.nextUnlockTokens', 'TOKENOMICS', 'OPTIONAL', 'NUMBER', 'Token amount in the next reported unlock.', 'token'),
  definition('tokenomics.nextUnlockOfCirculatingPct', 'TOKENOMICS', 'OPTIONAL', 'NUMBER', 'Next unlock relative to circulating supply.', 'percent'),
  definition('tokenomics.nextUnlockOfSupplyPct', 'TOKENOMICS', 'OPTIONAL', 'NUMBER', 'Next unlock relative to total supply.', 'percent'),
  definition('tokenomics.totalLockedTokens', 'TOKENOMICS', 'OPTIONAL', 'NUMBER', 'Provider-reported currently locked token amount.', 'token'),
  definition('community.interactions24h', 'COMMUNITY', 'OPTIONAL', 'NUMBER', 'Social interactions over the governed 24 hour window.', 'interactions'),
  definition('community.mentions24h', 'COMMUNITY', 'OPTIONAL', 'NUMBER', 'Social mentions/posts active over the governed 24 hour window.', 'mentions'),
  definition('community.activeCreators24h', 'COMMUNITY', 'OPTIONAL', 'NUMBER', 'Active social content creators over the governed 24 hour window.', 'creators'),
  definition('community.createdPosts24h', 'COMMUNITY', 'OPTIONAL', 'NUMBER', 'Created social posts over the governed 24 hour window.', 'posts'),
  definition('community.sentimentPct', 'COMMUNITY', 'OPTIONAL', 'NUMBER', 'Provider-reported social sentiment percentage.', 'percent'),
  definition('community.spamPosts', 'COMMUNITY', 'OPTIONAL', 'NUMBER', 'Provider-reported spam posts over the governed window.', 'posts'),
  definition('community.socialDominancePct', 'COMMUNITY', 'OPTIONAL', 'NUMBER', 'Provider-reported social dominance.', 'percent'),
  definition('community.spamRatio', 'COMMUNITY', 'OPTIONAL', 'NUMBER', 'Derived spam posts divided by created posts.', 'ratio'),
  definition('protocol.activeAddresses24h', 'PROTOCOL', 'OPTIONAL', 'NUMBER', 'Standardized active-address usage over 24 hours.', 'addresses'),
] as const);

const LAYER1_FEATURES = Object.freeze([
  definition('network.activeAddresses', 'NETWORK', 'REQUIRED', 'NUMBER', 'Active address count for the governed observation window.', 'addresses'),
  definition('network.transactionGrowth', 'NETWORK', 'REQUIRED', 'NUMBER', 'Transaction activity growth over the governed comparison window.', 'percent'),
  definition('network.feesRevenue', 'NETWORK', 'REQUIRED', 'NUMBER', 'Network fees/revenue evidence.', 'USD'),
  definition('network.developerActivity', 'NETWORK', 'REQUIRED', 'NUMBER', 'Versioned developer-activity metric.', 'index'),
  definition('protocol.tvlUsd', 'PROTOCOL', 'OPTIONAL', 'NUMBER', 'TVL where meaningful for the network.', 'USD'),
  definition('network.stablecoinSupplyUsd', 'NETWORK', 'OPTIONAL', 'NUMBER', 'Stablecoin supply settled on the network.', 'USD'),
  definition('network.stakingSecurity', 'NETWORK', 'REQUIRED', 'NUMBER', 'Evidence-backed staking/consensus security metric.', 'index'),
  definition('network.decentralization', 'NETWORK', 'REQUIRED', 'NUMBER', 'Evidence-backed decentralization metric.', 'index'),
  definition('tokenomics.quality', 'TOKENOMICS', 'REQUIRED', 'NUMBER', 'Versioned tokenomics quality feature.', 'index'),
  definition('liquidity.quality', 'LIQUIDITY', 'REQUIRED', 'NUMBER', 'Evidence-backed market liquidity quality.', 'index'),
  definition('network.nvt', 'NETWORK', 'OPTIONAL', 'NUMBER', 'Network Value to Transactions evidence; never interpreted in isolation.', 'ratio'),
]);

const LAYER2_FEATURES = Object.freeze([
  definition('network.dailyActiveAddresses', 'NETWORK', 'REQUIRED', 'NUMBER', 'Daily active addresses.', 'addresses'),
  definition('network.throughputTps', 'NETWORK', 'REQUIRED', 'NUMBER', 'Observed transaction throughput.', 'tx/s'),
  definition('network.transactionCost', 'NETWORK', 'REQUIRED', 'NUMBER', 'Representative transaction cost.', 'USD'),
  definition('protocol.sequencerRevenue', 'PROTOCOL', 'REQUIRED', 'NUMBER', 'Sequencer revenue evidence.', 'USD'),
  definition('protocol.dataAvailabilityCost', 'PROTOCOL', 'REQUIRED', 'NUMBER', 'Data availability cost evidence.', 'USD'),
  definition('protocol.tvlUsd', 'PROTOCOL', 'REQUIRED', 'NUMBER', 'Protocol/rollup TVL.', 'USD'),
  definition('protocol.bridgedTvlUsd', 'PROTOCOL', 'OPTIONAL', 'NUMBER', 'Bridged TVL.', 'USD'),
  definition('network.l1L2NetflowUsd', 'NETWORK', 'OPTIONAL', 'NUMBER', 'Net value flow between L1 and L2.', 'USD'),
  definition('product.activeApplications', 'PRODUCT', 'REQUIRED', 'NUMBER', 'Active application count.', 'applications'),
  definition('product.userRetention', 'PRODUCT', 'REQUIRED', 'NUMBER', 'User retention for the governed cohort/window.', 'percent'),
  definition('tokenomics.unlockRisk', 'TOKENOMICS', 'REQUIRED', 'NUMBER', 'Unlock schedule risk.', 'index'),
  definition('network.rollupLivenessVerified', 'NETWORK', 'HARD_GATE', 'BOOLEAN', 'Deterministic rollup-liveness gate evidence.'),
  definition('network.bridgeSecurityWithinPolicy', 'NETWORK', 'HARD_GATE', 'BOOLEAN', 'Deterministic bridge-security gate evidence.'),
]);

const DEFI_FEATURES = Object.freeze([
  definition('protocol.tvlUsd', 'PROTOCOL', 'REQUIRED', 'NUMBER', 'Protocol TVL.', 'USD'),
  definition('protocol.feesUsd', 'PROTOCOL', 'REQUIRED', 'NUMBER', 'Fees paid by protocol users.', 'USD'),
  definition('protocol.revenueUsd', 'PROTOCOL', 'REQUIRED', 'NUMBER', 'Fees retained by protocol/treasury/token holders according to provider definition.', 'USD'),
  definition('protocol.tokenholderRevenueUsd', 'PROTOCOL', 'OPTIONAL', 'NUMBER', 'Revenue distributed to token holders.', 'USD'),
  definition('protocol.volumeToTvl', 'PROTOCOL', 'OPTIONAL', 'NUMBER', 'Trading/usage volume to TVL ratio.', 'ratio'),
  definition('protocol.borrowUtilization', 'PROTOCOL', 'OPTIONAL', 'NUMBER', 'Borrow market utilization.', 'percent'),
  definition('risk.badDebtUsd', 'RISK', 'REQUIRED', 'NUMBER', 'Outstanding or realized bad debt.', 'USD'),
  definition('risk.liquidationLossesUsd', 'RISK', 'OPTIONAL', 'NUMBER', 'Losses attributable to liquidations.', 'USD'),
  definition('tokenomics.emissions', 'TOKENOMICS', 'REQUIRED', 'NUMBER', 'Token emissions for the governed period.', 'token'),
  definition('protocol.treasuryToMarketCap', 'PROTOCOL', 'OPTIONAL', 'NUMBER', 'Treasury value relative to market capitalization.', 'ratio'),
  definition('liquidity.lpConcentration', 'LIQUIDITY', 'REQUIRED', 'NUMBER', 'Liquidity-provider concentration.', 'percent'),
  ...EXTENDED_CRYPTO_PROVIDER_RAW_FEATURES,
  definition('protocol.smartContractEvidenceVerified', 'PROTOCOL', 'HARD_GATE', 'BOOLEAN', 'Smart-contract deployment/security evidence is present and governed.'),
  definition('risk.oracleRiskWithinPolicy', 'RISK', 'HARD_GATE', 'BOOLEAN', 'Deterministic oracle-risk policy gate evidence.'),
]);

const RWA_FEATURES = Object.freeze([
  definition('reserves.assetBackingRatio', 'RESERVES', 'REQUIRED', 'NUMBER', 'Tokenized claim asset-backing ratio.', 'ratio'),
  definition('reserves.attestationQuality', 'RESERVES', 'REQUIRED', 'NUMBER', 'Reserve/attestation quality metric.', 'index'),
  definition('legal.maturityProfile', 'LEGAL', 'REQUIRED', 'NUMBER', 'Maturity/duration profile represented as governed numeric feature.', 'index'),
  definition('product.yieldPct', 'PRODUCT', 'REQUIRED', 'NUMBER', 'Documented asset/cash-flow yield.', 'percent'),
  definition('risk.defaultRisk', 'RISK', 'REQUIRED', 'NUMBER', 'Issuer/asset default risk.', 'index'),
  definition('risk.counterpartyRisk', 'RISK', 'REQUIRED', 'NUMBER', 'Counterparty risk.', 'index'),
  definition('liquidity.redemptionLiquidity', 'LIQUIDITY', 'REQUIRED', 'NUMBER', 'Evidence-backed redemption liquidity.', 'index'),
  definition('legal.jurisdictionRisk', 'LEGAL', 'REQUIRED', 'NUMBER', 'Jurisdiction/regulatory risk.', 'index'),
  definition('custody.quality', 'CUSTODY', 'REQUIRED', 'NUMBER', 'Custodian quality/control evidence.', 'index'),
  definition('reserves.navLatency', 'RESERVES', 'OPTIONAL', 'NUMBER', 'NAV/oracle publication latency.', 'seconds'),
  definition('legal.tokenholderRightsQuality', 'LEGAL', 'REQUIRED', 'NUMBER', 'Clarity/enforceability of token-holder rights.', 'index'),
  definition('liquidity.secondaryMarketQuality', 'LIQUIDITY', 'REQUIRED', 'NUMBER', 'Secondary-market liquidity quality.', 'index'),
  definition('legal.ownershipVerified', 'LEGAL', 'HARD_GATE', 'BOOLEAN', 'Legal ownership/claim has been verified.'),
  definition('custody.arrangementVerified', 'CUSTODY', 'HARD_GATE', 'BOOLEAN', 'Custody arrangement has been verified.'),
  definition('legal.redemptionRightsVerified', 'LEGAL', 'HARD_GATE', 'BOOLEAN', 'Redemption rights have been verified.'),
]);

const NFT_FEATURES = Object.freeze([
  definition('market.floorPriceUsd', 'MARKET', 'REQUIRED', 'NUMBER', 'Collection floor price.', 'USD'),
  definition('market.salesVolumeUsd', 'MARKET', 'REQUIRED', 'NUMBER', 'Collection sales volume.', 'USD'),
  definition('community.uniqueBuyers', 'COMMUNITY', 'REQUIRED', 'NUMBER', 'Unique buyers for the governed window.', 'wallets'),
  definition('community.uniqueSellers', 'COMMUNITY', 'REQUIRED', 'NUMBER', 'Unique sellers for the governed window.', 'wallets'),
  definition('community.holderCount', 'COMMUNITY', 'REQUIRED', 'NUMBER', 'Distinct holder count.', 'wallets'),
  definition('community.holderConcentration', 'COMMUNITY', 'REQUIRED', 'NUMBER', 'Holder concentration.', 'percent'),
  definition('liquidity.listingRatio', 'LIQUIDITY', 'REQUIRED', 'NUMBER', 'Listed supply relative to collection supply.', 'percent'),
  definition('liquidity.bidAskSpread', 'LIQUIDITY', 'OPTIONAL', 'NUMBER', 'Representative bid/ask spread where available.', 'percent'),
  definition('risk.floorVolatility', 'RISK', 'REQUIRED', 'NUMBER', 'Floor-price volatility.', 'percent'),
  definition('product.royaltyRevenueUsd', 'PRODUCT', 'OPTIONAL', 'NUMBER', 'Royalty revenue.', 'USD'),
  definition('product.rarityQuality', 'PRODUCT', 'REQUIRED', 'NUMBER', 'Versioned rarity/collection-quality feature.', 'index'),
  definition('risk.washTradeProbability', 'RISK', 'REQUIRED', 'NUMBER', 'Wash-trading probability/penalty evidence.', 'probability'),
  definition('community.quality', 'COMMUNITY', 'REQUIRED', 'NUMBER', 'Evidence-backed community quality.', 'index'),
]);

const STABLECOIN_FEATURES = Object.freeze([
  definition('market.pegDeviationPct', 'MARKET', 'REQUIRED', 'NUMBER', 'Absolute deviation from target peg.', 'percent'),
  definition('reserves.coverageRatio', 'RESERVES', 'REQUIRED', 'NUMBER', 'Reserve coverage ratio.', 'ratio'),
  definition('reserves.attestationQuality', 'RESERVES', 'REQUIRED', 'NUMBER', 'Reserve attestation quality.', 'index'),
  definition('liquidity.redemptionLiquidity', 'LIQUIDITY', 'REQUIRED', 'NUMBER', 'Redemption liquidity quality.', 'index'),
  definition('liquidity.marketQuality', 'LIQUIDITY', 'REQUIRED', 'NUMBER', 'Secondary-market liquidity quality.', 'index'),
  definition('reserves.redemptionOperational', 'RESERVES', 'HARD_GATE', 'BOOLEAN', 'Redemption mechanism is operational.'),
  definition('reserves.attestationVerified', 'RESERVES', 'HARD_GATE', 'BOOLEAN', 'Required reserve attestation evidence is verified.'),
  definition('risk.abnormalOutflowAbsent', 'RISK', 'HARD_GATE', 'BOOLEAN', 'No unresolved abnormal outflow condition exists.'),
]);

const EXCHANGE_TOKEN_FEATURES = Object.freeze([
  definition('venue.exchangeVolumeUsd', 'VENUE', 'REQUIRED', 'NUMBER', 'Underlying exchange trading volume.', 'USD'),
  definition('venue.feeRevenueUsd', 'VENUE', 'REQUIRED', 'NUMBER', 'Underlying exchange fee revenue.', 'USD'),
  definition('tokenomics.burnRate', 'TOKENOMICS', 'REQUIRED', 'NUMBER', 'Token burn rate.', 'percent'),
  definition('tokenomics.stakingDemand', 'TOKENOMICS', 'OPTIONAL', 'NUMBER', 'Token staking demand.', 'index'),
  definition('tokenomics.feeUtility', 'TOKENOMICS', 'REQUIRED', 'NUMBER', 'Fee/utility demand backed by product rules.', 'index'),
  definition('reserves.exchangeReservesUsd', 'RESERVES', 'REQUIRED', 'NUMBER', 'Exchange reserve evidence.', 'USD'),
  definition('reserves.proofOfReservesQuality', 'RESERVES', 'REQUIRED', 'NUMBER', 'Proof-of-reserves quality.', 'index'),
  definition('risk.counterpartyRisk', 'RISK', 'REQUIRED', 'NUMBER', 'Exchange counterparty risk.', 'index'),
  definition('risk.regulatoryRisk', 'RISK', 'REQUIRED', 'NUMBER', 'Exchange regulatory risk.', 'index'),
  definition('tokenomics.holderConcentration', 'TOKENOMICS', 'REQUIRED', 'NUMBER', 'Token-holder concentration.', 'percent'),
  definition('liquidity.quality', 'LIQUIDITY', 'REQUIRED', 'NUMBER', 'Token liquidity quality.', 'index'),
  definition('venue.operationalHealthVerified', 'VENUE', 'HARD_GATE', 'BOOLEAN', 'Underlying venue operational-health gate evidence.'),
]);

const GAMEFI_FEATURES = Object.freeze([
  definition('product.dailyActiveUsers', 'PRODUCT', 'REQUIRED', 'NUMBER', 'Daily active users.', 'users'),
  definition('product.dauMauRatio', 'PRODUCT', 'REQUIRED', 'NUMBER', 'DAU/MAU engagement ratio.', 'ratio'),
  definition('product.inGameRevenueUsd', 'PRODUCT', 'REQUIRED', 'NUMBER', 'In-game revenue.', 'USD'),
  definition('product.userRetention', 'PRODUCT', 'REQUIRED', 'NUMBER', 'User retention.', 'percent'),
  definition('product.nftActivity', 'PRODUCT', 'REQUIRED', 'NUMBER', 'NFT activity metric where applicable.', 'index'),
  definition('tokenomics.utility', 'TOKENOMICS', 'REQUIRED', 'NUMBER', 'Token utility backed by product behavior.', 'index'),
]);

const AI_DEPIN_FEATURES = Object.freeze([
  definition('network.activeNodes', 'NETWORK', 'REQUIRED', 'NUMBER', 'Active network node count.', 'nodes'),
  definition('network.usefulWork', 'NETWORK', 'REQUIRED', 'NUMBER', 'Verified useful-work/output metric.', 'index'),
  definition('network.revenueUsd', 'NETWORK', 'REQUIRED', 'NUMBER', 'Network/customer revenue.', 'USD'),
  definition('product.customerGrowth', 'PRODUCT', 'REQUIRED', 'NUMBER', 'Customer/user growth.', 'percent'),
  definition('network.nodeUtilization', 'NETWORK', 'REQUIRED', 'NUMBER', 'Node/resource utilization.', 'percent'),
  definition('tokenomics.utility', 'TOKENOMICS', 'REQUIRED', 'NUMBER', 'Token utility tied to network consumption.', 'index'),
]);

const MEME_FEATURES = Object.freeze([
  ...EXTENDED_CRYPTO_PROVIDER_RAW_FEATURES,
]);

export const CRYPTO_CATEGORY_FEATURE_DEFINITIONS: Readonly<
  Record<CryptoAnalysisProfileId, readonly CryptoFeatureDefinition[]>
> = Object.freeze({
  layer1: LAYER1_FEATURES,
  layer2: LAYER2_FEATURES,
  defi: DEFI_FEATURES,
  rwa: RWA_FEATURES,
  nft: NFT_FEATURES,
  stablecoin: STABLECOIN_FEATURES,
  'exchange-token': EXCHANGE_TOKEN_FEATURES,
  gamefi: GAMEFI_FEATURES,
  'ai-depin': AI_DEPIN_FEATURES,
  meme: MEME_FEATURES,
  generic: Object.freeze([]),
});

function valueMatchesType(value: CryptoFeaturePrimitive | null, valueType: CryptoFeatureValueType): boolean {
  if (value === null) return false;
  if (valueType === 'NUMBER') return typeof value === 'number' && Number.isFinite(value);
  if (valueType === 'BOOLEAN') return typeof value === 'boolean';
  return typeof value === 'string' && value.length > 0;
}

function usableEvidence(observation: CryptoFeatureEvidence | undefined, definition: CryptoFeatureDefinition): boolean {
  return Boolean(
    observation
    && observation.status === 'VERIFIED'
    && valueMatchesType(observation.value, definition.valueType)
    && observation.evidenceRefs.length > 0
    && observation.provider,
  );
}

function uniqueEvidenceByKey(evidence: readonly CryptoFeatureEvidence[]): ReadonlyMap<string, CryptoFeatureEvidence> {
  const map = new Map<string, CryptoFeatureEvidence>();
  for (const item of evidence) {
    if (map.has(item.key)) {
      throw new Error(`[CryptoCategoryFeatureContract] duplicate evidence key: ${item.key}`);
    }
    map.set(item.key, item);
  }
  return map;
}

export function getCryptoCategoryFeatureDefinitions(
  profileId: CryptoAnalysisProfileId,
): readonly CryptoFeatureDefinition[] {
  return CRYPTO_CATEGORY_FEATURE_DEFINITIONS[profileId];
}

/**
 * Builds a non-scoring feature/evidence contract for one resolved crypto analysis profile.
 *
 * Hard rules:
 * - source profiles without an approved formula/schema remain NOT_COMPUTABLE;
 * - missing/stale/invalid required evidence is never coerced to zero;
 * - boolean HARD_GATE=false blocks the profile contract;
 * - unknown evidence is retained only as rejected metadata, never promoted implicitly;
 * - universal market/supply evidence is carried separately and does not satisfy category-specific
 *   requirements without a separately reviewed promotion adapter.
 */
export function buildCryptoCategoryFeatureContract(input: Readonly<{
  assetId: string;
  profileId: CryptoAnalysisProfileId;
  evidence?: readonly CryptoFeatureEvidence[];
  universalMarketEvidence?: readonly CryptoFeatureEvidence[];
}>): CryptoCategoryFeatureContract {
  const definitions = CRYPTO_CATEGORY_FEATURE_DEFINITIONS[input.profileId];
  const profile = CRYPTO_CATEGORY_ANALYSIS_PROFILES[input.profileId];
  const observations = Object.freeze([...(input.evidence ?? [])]);
  const universalMarketEvidence = Object.freeze([...(input.universalMarketEvidence ?? [])]);
  const byKey = uniqueEvidenceByKey(observations);
  const definitionKeys = new Set(definitions.map(item => item.key));
  const rejectedEvidenceKeys = Object.freeze(observations
    .map(item => item.key)
    .filter(key => !definitionKeys.has(key)));

  if (profile.sourceStatus === 'PENDING_EVIDENCE' || definitions.length === 0) {
    return Object.freeze({
      contractVersion: CRYPTO_CATEGORY_FEATURE_CONTRACT_VERSION,
      assetId: input.assetId,
      profileId: input.profileId,
      profileSourceStatus: profile.sourceStatus,
      status: 'NOT_COMPUTABLE',
      evidenceCoverage: 0,
      observations,
      universalMarketEvidence,
      missingRequiredFeatures: Object.freeze([]),
      missingHardGates: Object.freeze([]),
      failedHardGates: Object.freeze([]),
      rejectedEvidenceKeys,
      scoreAuthority: 'SCORING_DISPATCHER_ONLY',
    });
  }

  const requiredDefinitions = definitions.filter(item => item.requirement === 'REQUIRED');
  const hardGateDefinitions = definitions.filter(item => item.requirement === 'HARD_GATE');
  const requiredAndGates = [...requiredDefinitions, ...hardGateDefinitions];

  const missingRequiredFeatures = Object.freeze(requiredDefinitions
    .filter(item => !usableEvidence(byKey.get(item.key), item))
    .map(item => item.key));

  const missingHardGates = Object.freeze(hardGateDefinitions
    .filter(item => !usableEvidence(byKey.get(item.key), item))
    .map(item => item.key));

  const failedHardGates = Object.freeze(hardGateDefinitions
    .filter(item => {
      const observation = byKey.get(item.key);
      return usableEvidence(observation, item)
        && item.valueType === 'BOOLEAN'
        && observation?.value === false;
    })
    .map(item => item.key));

  const usableCount = requiredAndGates.filter(item => usableEvidence(byKey.get(item.key), item)).length;
  const evidenceCoverage = requiredAndGates.length === 0
    ? 0
    : Number((usableCount / requiredAndGates.length).toFixed(6));

  const status: CryptoCategoryFeatureContractStatus = failedHardGates.length > 0
    ? 'BLOCKED'
    : missingHardGates.length > 0
      ? 'NOT_COMPUTABLE'
      : missingRequiredFeatures.length > 0
        ? 'PARTIAL'
        : 'READY';

  return Object.freeze({
    contractVersion: CRYPTO_CATEGORY_FEATURE_CONTRACT_VERSION,
    assetId: input.assetId,
    profileId: input.profileId,
    profileSourceStatus: profile.sourceStatus,
    status,
    evidenceCoverage,
    observations,
    universalMarketEvidence,
    missingRequiredFeatures,
    missingHardGates,
    failedHardGates,
    rejectedEvidenceKeys,
    scoreAuthority: 'SCORING_DISPATCHER_ONLY',
  });
}
