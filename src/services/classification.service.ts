import { CryptoClassification, CryptoCategory, CryptoSubCategory, CryptoTier } from "../types/crypto.types";

export class ClassificationService {
  public static classifyAsset(symbol: string): CryptoClassification {
    const s = symbol.toUpperCase().trim();
    let category_main: CryptoCategory = "Unknown";
    let category_sub: CryptoSubCategory = "Unknown";
    let asset_type: CryptoClassification['asset_type'] = "unknown";
    let tier: CryptoTier = 3;
    let reasoning: string[] = [];

    if (s === "BTC") {
      category_main = "Layer 1";
      category_sub = "Chain-native Asset";
      asset_type = "coin";
      tier = 1;
      reasoning = ["Bitcoin ist die primäre dezentrale Leitwährung", "Hohe Marktkapitalisierung und globale Liquidität"];
    } else if (s === "ETH") {
      category_main = "Layer 1";
      category_sub = "Chain-native Asset";
      asset_type = "coin";
      tier = 1;
      reasoning = ["Ethereum ist die führende Smart Contract Plattform", "Hohe dApp-Aktivität und Staking-Sicherheit"];
    } else if (s === "SOL") {
      category_main = "Layer 1";
      category_sub = "Chain-native Asset";
      asset_type = "coin";
      tier = 1;
      reasoning = ["Solana ist ein High-Throughput Layer-1 Netzwerk", "Starke DeFi-Adoption und hohe Transaktionsdichte"];
    } else if (s === "AAVE" || s === "UNI" || s === "COMP" || s === "MKR" || s === "LDO" || s === "CRV") {
      category_main = "DeFi";
      category_sub = "Protocol Token";
      asset_type = "governance";
      tier = 1;
      reasoning = ["Etabliertes dezentrales Finanzprotokoll", "Cashflow durch Gebühren und starker TVL"];
    } else if (s === "LINK") {
      category_main = "Oracle";
      category_sub = "Protocol Token";
      asset_type = "token";
      tier = 1;
      reasoning = ["Führendes dezentrales Oracle-Netzwerk", "Essenzielle Infrastruktur für Multi-Chain dApps"];
    } else if (s === "MATIC" || s === "ARB" || s === "OP") {
      category_main = "Layer 2";
      category_sub = "Ecosystem Token";
      asset_type = "token";
      tier = 2;
      reasoning = ["Ethereum-Skalierungslösung", "Erhöhte Transaktionskapazität und reduzierte Gebühren"];
    } else if (["DOGE", "SHIB", "PEPE", "WIF", "BONK", "FLOKI", "POPCAT", "BRETT", "MOG", "BOME"].includes(s)) {
      category_main = "Meme";
      category_sub = "Protocol Token";
      asset_type = "token";
      tier = 2;
      reasoning = ["Gemeinschaftsgetriebener Token ohne direkte Cashflow-Struktur", "Starke Social-Media-Präsenz und hohe Volatilität"];
    } else {
      category_main = "Unknown";
      category_sub = "Unknown";
      asset_type = "unknown";
      tier = 3;
      reasoning = ["Standardklassifikation für unkategorisierte Assets"];
    }

    return {
      category_main,
      category_sub,
      asset_type,
      tier,
      confidence: tier === 1 ? 0.95 : tier === 2 ? 0.82 : 0.60,
      reasoning
    };
  }
}
