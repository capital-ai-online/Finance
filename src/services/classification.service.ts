import { CryptoClassification, CryptoCategory, CryptoSubCategory, CryptoTier } from "../types/crypto.types";

/**
 * SC-1 deterministic classification table (SC-MD-SPT-0001).
 * Table-driven for maintainability. Unlisted symbols → Unknown / tier 3 (fail-closed).
 * Does not invent scores or ranking eligibility — classification only.
 */
type TableEntry = {
  category_main: CryptoCategory;
  category_sub: CryptoSubCategory;
  asset_type: CryptoClassification['asset_type'];
  tier: CryptoTier;
  reasoning: string[];
};

const TABLE: Record<string, TableEntry> = {
  // --- Layer 1 / Smart Contract Platforms ---
  BTC: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 1,
    reasoning: ['Bitcoin ist die primäre dezentrale Leitwährung', 'Hohe Marktkapitalisierung und globale Liquidität'],
  },
  ETH: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 1,
    reasoning: ['Ethereum ist die führende Smart Contract Plattform', 'Hohe dApp-Aktivität und Staking-Sicherheit'],
  },
  SOL: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 1,
    reasoning: ['Solana ist ein High-Throughput Layer-1 Netzwerk', 'Starke DeFi-Adoption und hohe Transaktionsdichte'],
  },
  ADA: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Cardano Layer-1 Smart-Contract-Plattform', 'Research-getriebene Architektur'],
  },
  AVAX: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Avalanche Multi-Chain Layer-1', 'Subnet-Architektur'],
  },
  DOT: {
    category_main: 'Interoperability',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Polkadot Relay-Chain / Parachain-Modell', 'Cross-Chain-Interoperabilität'],
  },
  ATOM: {
    category_main: 'Interoperability',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Cosmos Hub / IBC-Interoperabilität', 'App-Chain-Ökosystem'],
  },
  NEAR: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['NEAR Protocol Layer-1', 'Sharding und Developer-Fokus'],
  },
  APT: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Aptos Move-basierte Layer-1', 'Hoher Durchsatz'],
  },
  SUI: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Sui Move-basierte Layer-1', 'Objektzentriertes Modell'],
  },
  SEI: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Sei Chain trading-optimierte Layer-1'],
  },
  TIA: {
    category_main: 'Infrastructure',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Celestia Modular Data-Availability Layer'],
  },
  INJ: {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Injective DeFi-/Derivatives-Layer'],
  },
  ICP: {
    category_main: 'Smart Contract Platform',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Internet Computer Web3-Compute-Plattform'],
  },
  ALGO: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Algorand Pure-PoS Layer-1'],
  },
  HBAR: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Hedera Hashgraph Enterprise Layer'],
  },
  BNB: {
    category_main: 'Exchange Token',
    category_sub: 'Exchange-Backed Asset',
    asset_type: 'token',
    tier: 1,
    reasoning: ['Binance Exchange Token und BNB Chain Utility'],
  },
  TRX: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['TRON Layer-1 / hohe Stablecoin-Aktivität'],
  },
  XLM: {
    category_main: 'Payments',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Stellar Zahlungs- und Remittance-Netzwerk'],
  },
  XRP: {
    category_main: 'Payments',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['XRP Ledger institutionelle Zahlungsinfrastruktur'],
  },
  LTC: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Litecoin Payment Layer-1'],
  },
  BCH: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Bitcoin Cash Payment Fork'],
  },
  ETC: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Ethereum Classic Layer-1'],
  },
  KAS: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Kaspa high-throughput PoW Layer-1'],
  },
  TON: {
    category_main: 'Layer 1',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['The Open Network Layer-1'],
  },

  // --- Layer 2 / Scaling ---
  MATIC: {
    category_main: 'Layer 2',
    category_sub: 'Ecosystem Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Polygon Ethereum-Skalierung (Legacy-Ticker MATIC)'],
  },
  POL: {
    category_main: 'Layer 2',
    category_sub: 'Ecosystem Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Polygon native Token (POL)'],
  },
  ARB: {
    category_main: 'Layer 2',
    category_sub: 'Ecosystem Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Arbitrum Optimistic Rollup'],
  },
  OP: {
    category_main: 'Layer 2',
    category_sub: 'Ecosystem Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Optimism Optimistic Rollup'],
  },
  STRK: {
    category_main: 'Layer 2',
    category_sub: 'Ecosystem Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Starknet ZK-Rollup'],
  },
  IMX: {
    category_main: 'Layer 2',
    category_sub: 'Ecosystem Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Immutable X / ZK-Gaming Layer'],
  },
  MNT: {
    category_main: 'Layer 2',
    category_sub: 'Ecosystem Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Mantle Modular Layer-2'],
  },
  BASE: {
    category_main: 'Layer 2',
    category_sub: 'Ecosystem Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Base (Coinbase) Optimistic Rollup Ecosystem'],
  },

  // --- DeFi ---
  AAVE: {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'governance',
    tier: 1,
    reasoning: ['Führendes Lending-Protokoll', 'Cashflow durch Gebühren und starker TVL'],
  },
  UNI: {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'governance',
    tier: 1,
    reasoning: ['Uniswap DEX Governance', 'Marktführender AMM'],
  },
  COMP: {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'governance',
    tier: 1,
    reasoning: ['Compound Lending Governance'],
  },
  MKR: {
    category_main: 'DeFi',
    category_sub: 'Governance Asset',
    asset_type: 'governance',
    tier: 1,
    reasoning: ['MakerDAO / Sky Governance'],
  },
  CRV: {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'governance',
    tier: 1,
    reasoning: ['Curve Stable-Swap AMM'],
  },
  SUSHI: {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'governance',
    tier: 2,
    reasoning: ['SushiSwap DEX / Multi-Chain AMM'],
  },
  YFI: {
    category_main: 'DeFi',
    category_sub: 'Yield Asset',
    asset_type: 'yield',
    tier: 2,
    reasoning: ['Yearn Finance Yield Aggregator'],
  },
  GMX: {
    category_main: 'Derivatives',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['GMX Perpetual DEX'],
  },
  DYDX: {
    category_main: 'Derivatives',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['dYdX Derivatives Exchange'],
  },
  PENDLE: {
    category_main: 'DeFi',
    category_sub: 'Yield Asset',
    asset_type: 'yield',
    tier: 2,
    reasoning: ['Pendle Yield-Trading Protocol'],
  },
  JUP: {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Jupiter Solana Aggregator'],
  },
  RAY: {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Raydium Solana AMM'],
  },
  CAKE: {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['PancakeSwap BNB-Chain DEX'],
  },
  '1INCH': {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['1inch DEX Aggregator'],
  },
  SNX: {
    category_main: 'DeFi',
    category_sub: 'Synthetic Asset',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Synthetix Synthetic Asset Protocol'],
  },
  BAL: {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'governance',
    tier: 2,
    reasoning: ['Balancer Weighted AMM'],
  },
  RUNE: {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['THORChain Cross-Chain Liquidity'],
  },

  // --- Liquid Staking / Restaking ---
  LDO: {
    category_main: 'Liquid Staking',
    category_sub: 'Yield Asset',
    asset_type: 'yield',
    tier: 1,
    reasoning: ['Lido Liquid Staking Governance'],
  },
  JTO: {
    category_main: 'Liquid Staking',
    category_sub: 'Yield Asset',
    asset_type: 'yield',
    tier: 2,
    reasoning: ['Jito Solana MEV / Liquid Staking'],
  },
  EIGEN: {
    category_main: 'Restaking',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['EigenLayer Restaking'],
  },

  // --- Oracle ---
  LINK: {
    category_main: 'Oracle',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 1,
    reasoning: ['Führendes dezentrales Oracle-Netzwerk', 'Essenzielle Infrastruktur für Multi-Chain dApps'],
  },
  PYTH: {
    category_main: 'Oracle',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Pyth Network High-Frequency Oracle'],
  },
  BAND: {
    category_main: 'Oracle',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Band Protocol Cross-Chain Oracle'],
  },
  API3: {
    category_main: 'Oracle',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['API3 First-Party Oracle'],
  },

  // --- Stablecoins ---
  USDT: {
    category_main: 'Stablecoin',
    category_sub: 'Exchange-Backed Asset',
    asset_type: 'stablecoin',
    tier: 1,
    reasoning: ['Tether USD — größte Stablecoin nach Marktkapitalisierung'],
  },
  USDC: {
    category_main: 'Stablecoin',
    category_sub: 'Exchange-Backed Asset',
    asset_type: 'stablecoin',
    tier: 1,
    reasoning: ['USD Coin — regulierte Fiat-backed Stablecoin'],
  },
  DAI: {
    category_main: 'Stablecoin',
    category_sub: 'Synthetic Asset',
    asset_type: 'stablecoin',
    tier: 1,
    reasoning: ['DAI dezentral überbesicherte Stablecoin'],
  },
  FRAX: {
    category_main: 'Stablecoin',
    category_sub: 'Synthetic Asset',
    asset_type: 'stablecoin',
    tier: 2,
    reasoning: ['Frax Algorithmic / Hybrid Stablecoin'],
  },
  TUSD: {
    category_main: 'Stablecoin',
    category_sub: 'Exchange-Backed Asset',
    asset_type: 'stablecoin',
    tier: 2,
    reasoning: ['TrueUSD Fiat-backed Stablecoin'],
  },
  FDUSD: {
    category_main: 'Stablecoin',
    category_sub: 'Exchange-Backed Asset',
    asset_type: 'stablecoin',
    tier: 2,
    reasoning: ['First Digital USD'],
  },
  USDE: {
    category_main: 'Stablecoin',
    category_sub: 'Synthetic Asset',
    asset_type: 'stablecoin',
    tier: 2,
    reasoning: ['Ethena USDe Synthetic Dollar'],
  },
  ENA: {
    category_main: 'DeFi',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Ethena Protocol Governance'],
  },

  // --- Exchange tokens ---
  CRO: {
    category_main: 'Exchange Token',
    category_sub: 'Exchange-Backed Asset',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Cronos / Crypto.com Exchange Token'],
  },
  BGB: {
    category_main: 'Exchange Token',
    category_sub: 'Exchange-Backed Asset',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Bitget Exchange Token'],
  },
  OKB: {
    category_main: 'Exchange Token',
    category_sub: 'Exchange-Backed Asset',
    asset_type: 'token',
    tier: 2,
    reasoning: ['OKX Exchange Token'],
  },
  GT: {
    category_main: 'Exchange Token',
    category_sub: 'Exchange-Backed Asset',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Gate Token'],
  },

  // --- AI / Data ---
  FET: {
    category_main: 'AI / Data',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Artificial Superintelligence Alliance / Fetch.ai'],
  },
  RNDR: {
    category_main: 'AI / Data',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Render Network GPU Rendering'],
  },
  RENDER: {
    category_main: 'AI / Data',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Render Network (RENDER Ticker)'],
  },
  GRT: {
    category_main: 'AI / Data',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['The Graph Indexing Protocol'],
  },
  TAO: {
    category_main: 'AI / Data',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Bittensor Decentralized ML Network'],
  },
  WLD: {
    category_main: 'AI / Data',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Worldcoin Identity / AI Network'],
  },
  OCEAN: {
    category_main: 'AI / Data',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Ocean Protocol Data Marketplace'],
  },

  // --- Storage / Compute ---
  FIL: {
    category_main: 'Storage / Compute',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Filecoin Decentralized Storage'],
  },
  AR: {
    category_main: 'Storage / Compute',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Arweave Permanent Storage'],
  },
  AKT: {
    category_main: 'Storage / Compute',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Akash Decentralized Cloud Compute'],
  },

  // --- Gaming / NFT ---
  AXS: {
    category_main: 'Gaming',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Axie Infinity GameFi'],
  },
  SAND: {
    category_main: 'Gaming',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['The Sandbox Metaverse'],
  },
  MANA: {
    category_main: 'Gaming',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Decentraland Metaverse'],
  },
  GALA: {
    category_main: 'Gaming',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Gala Games'],
  },
  ILV: {
    category_main: 'Gaming',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Illuvium AAA GameFi'],
  },
  IMX_GAME: {
    category_main: 'Gaming',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Immutable Gaming Ecosystem Alias'],
  },

  // --- RWA ---
  ONDO: {
    category_main: 'Real World Assets',
    category_sub: 'Yield Asset',
    asset_type: 'yield',
    tier: 2,
    reasoning: ['Ondo Finance Tokenized Treasuries / RWA'],
  },
  OM: {
    category_main: 'Real World Assets',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['MANTRA RWA Chain'],
  },

  // --- Privacy ---
  XMR: {
    category_main: 'Privacy',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Monero Privacy Layer-1'],
  },
  ZEC: {
    category_main: 'Privacy',
    category_sub: 'Chain-native Asset',
    asset_type: 'coin',
    tier: 2,
    reasoning: ['Zcash Optional Privacy'],
  },

  // --- Bridging / Interop extras ---
  W: {
    category_main: 'Bridging',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Wormhole Cross-Chain Messaging'],
  },
  AXL: {
    category_main: 'Interoperability',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Axelar Cross-Chain Network'],
  },

  // --- Meme (existing set retained + common) ---
  DOGE: {
    category_main: 'Meme',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Gemeinschaftsgetriebener Token ohne direkte Cashflow-Struktur', 'Starke Social-Media-Präsenz und hohe Volatilität'],
  },
  SHIB: {
    category_main: 'Meme',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Gemeinschaftsgetriebener Token ohne direkte Cashflow-Struktur', 'Starke Social-Media-Präsenz und hohe Volatilität'],
  },
  PEPE: {
    category_main: 'Meme',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Gemeinschaftsgetriebener Token ohne direkte Cashflow-Struktur', 'Starke Social-Media-Präsenz und hohe Volatilität'],
  },
  WIF: {
    category_main: 'Meme',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Gemeinschaftsgetriebener Token ohne direkte Cashflow-Struktur', 'Starke Social-Media-Präsenz und hohe Volatilität'],
  },
  BONK: {
    category_main: 'Meme',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Gemeinschaftsgetriebener Token ohne direkte Cashflow-Struktur', 'Starke Social-Media-Präsenz und hohe Volatilität'],
  },
  FLOKI: {
    category_main: 'Meme',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Gemeinschaftsgetriebener Token ohne direkte Cashflow-Struktur', 'Starke Social-Media-Präsenz und hohe Volatilität'],
  },
  POPCAT: {
    category_main: 'Meme',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Gemeinschaftsgetriebener Token ohne direkte Cashflow-Struktur', 'Starke Social-Media-Präsenz und hohe Volatilität'],
  },
  BRETT: {
    category_main: 'Meme',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Gemeinschaftsgetriebener Token ohne direkte Cashflow-Struktur', 'Starke Social-Media-Präsenz und hohe Volatilität'],
  },
  MOG: {
    category_main: 'Meme',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Gemeinschaftsgetriebener Token ohne direkte Cashflow-Struktur', 'Starke Social-Media-Präsenz und hohe Volatilität'],
  },
  BOME: {
    category_main: 'Meme',
    category_sub: 'Protocol Token',
    asset_type: 'token',
    tier: 2,
    reasoning: ['Gemeinschaftsgetriebener Token ohne direkte Cashflow-Struktur', 'Starke Social-Media-Präsenz und hohe Volatilität'],
  },
};

export class ClassificationService {
  public static classifyAsset(symbol: string): CryptoClassification {
    const s = symbol.toUpperCase().trim();
    const entry = TABLE[s];

    if (!entry) {
      return {
        category_main: 'Unknown',
        category_sub: 'Unknown',
        asset_type: 'unknown',
        tier: 3,
        confidence: 0.6,
        reasoning: ['Standardklassifikation für unkategorisierte Assets'],
      };
    }

    return {
      category_main: entry.category_main,
      category_sub: entry.category_sub,
      asset_type: entry.asset_type,
      tier: entry.tier,
      confidence: entry.tier === 1 ? 0.95 : entry.tier === 2 ? 0.82 : 0.6,
      reasoning: entry.reasoning,
    };
  }

  /** Number of symbols with deterministic coverage (for evidence / tests). */
  public static tableSize(): number {
    return Object.keys(TABLE).length;
  }
}
