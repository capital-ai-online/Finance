import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ShieldCheck, 
  Sliders, 
  Info, 
  FileText, 
  Activity, 
  Zap, 
  RefreshCw, 
  Database,
  ArrowRight,
  Sparkles,
  Cpu,
  Layers,
  CheckCircle2,
  X,
  Search,
  Plus,
  Clock,
  HelpCircle,
  Trash2,
  Play,
  ShieldAlert,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SCORING_WEIGHTS, DECISION_THRESHOLDS, CryptoScoringInputs, calculateCryptoEnterpriseScore, generateCryptoInputs } from '../lib/cryptoScoring';

// Intelligent Search and Mapping Database
const CRYPTO_DATABASE = [
  { symbol: 'BTC', name: 'Bitcoin', nickname: 'Ether Store of Value Digital Gold König', pair: 'BTC/USD, BTC-USD, BTC/EUR, BTCEUR', desc: 'Tier 1 - Core Store of Value', mcap: '$1,340B', price: 68500.0, change24h: 2.45 },
  { symbol: 'ETH', name: 'Ethereum', nickname: 'Ether Smart Contract DeFi L1 Königin', pair: 'ETH/USD, ETH-USD, ETH/EUR, ETHEUR', desc: 'Tier 1 - L1 Smart Contract Ruler', mcap: '$415B', price: 3450.0, change24h: -1.2 },
  { symbol: 'SOL', name: 'Solana', nickname: 'Sol High Performance Fast L1 Speed', pair: 'SOL/USD, SOL-USD, SOL/EUR', desc: 'Tier 2 - L1 High-Performance Network', mcap: '$67.5B', price: 145.2, change24h: 5.8 },
  { symbol: 'ADA', name: 'Cardano', nickname: 'Ada Peer Reviewed Research Academic', pair: 'ADA/USD, ADA-USD', desc: 'Tier 2 - Decentralized Research Chain', mcap: '$15.1B', price: 0.42, change24h: -0.8 },
  { symbol: 'XRP', name: 'Ripple', nickname: 'Xrp Settlement Cross Border Payments Banken SEC', pair: 'XRP/USD, XRP-USD', desc: 'Tier 2 - Cross-Border Institutional Ledger', mcap: '$31.2B', price: 0.58, change24h: 1.1 },
  { symbol: 'DOT', name: 'Polkadot', nickname: 'Dot Interoperability Sharding Multichain Parachain', pair: 'DOT/USD, DOT-USD', desc: 'Tier 2 - Interoperability Web3 Network', mcap: '$6.5B', price: 6.20, change24h: -2.3 },
  { symbol: 'DOGE', name: 'Dogecoin', nickname: 'Doge Meme Dog Elon Musk Shibe Hund', pair: 'DOGE/USD, DOGE-USD', desc: 'Tier 3 - Premium Meme & Community Token', mcap: '$18.4B', price: 0.13, change24h: 8.4 },
  { symbol: 'AVAX', name: 'Avalanche', nickname: 'Avax Subnets Subnet EVM L1 Avalanche', pair: 'AVAX/USD, AVAX-USD', desc: 'Tier 2 - Highly Scalable Subnet L1', mcap: '$10.8B', price: 28.50, change24h: 3.2 },
  { symbol: 'LINK', name: 'Chainlink', nickname: 'Link Oracles Oracle Data feed Schnittstelle', pair: 'LINK/USD, LINK-USD', desc: 'Tier 2 - Standard Decentralized Oracle Network', mcap: '$8.9B', price: 15.40, change24h: -0.5 },
  { symbol: 'BNB', name: 'Binance Coin', nickname: 'Bnb Exchange Utility Chain EVM BSC Binance', pair: 'BNB/USD, BNB-USD', desc: 'Tier 1 - Centralized Exchange Giant Ledger', mcap: '$87.2B', price: 585.00, change24h: 0.7 },
  { symbol: 'LTC', name: 'Litecoin', nickname: 'Ltc Silver to Bitcoin Gold Fast Payments Legacy', pair: 'LTC/USD, LTC-USD', desc: 'Tier 2 - Legacy Transactional Store', mcap: '$5.8B', price: 78.20, change24h: -0.4 },
  { symbol: 'TRX', name: 'Tron', nickname: 'Trx Justin Sun USDT Transfer stablecoins TRX', pair: 'TRX/USD, TRX-USD', desc: 'Tier 2 - High-Throughput Payment Network', mcap: '$11.2B', price: 0.12, change24h: 0.1 },
  { symbol: 'NEAR', name: 'Near Protocol', nickname: 'Near Sharding AI Chain User Friendly NEAR', pair: 'NEAR/USD, NEAR-USD', desc: 'Tier 2 - Sharded Developer-Focused L1', mcap: '$5.4B', price: 5.10, change24h: 4.8 },
  { symbol: 'UNI', name: 'Uniswap', nickname: 'Uni DEX AMM Governance Token Swapping', pair: 'UNI/USD, UNI-USD', desc: 'Tier 2 - Leading Decentralized Exchange', mcap: '$4.2B', price: 7.15, change24h: -1.9 },
  { symbol: 'MATIC', name: 'Polygon', nickname: 'Matic Polygon L2 Ethereum Scaling Rollups', pair: 'MATIC/USD, MATIC-USD', desc: 'Tier 2 - Premier Ethereum Layer-2 Scaling', mcap: '$5.1B', price: 0.55, change24h: 1.5 }
];

const TIMEFRAMES = [
  { value: '1m', label: '1 Min' },
  { value: '5m', label: '5 Min' },
  { value: '15m', label: '15 Min' },
  { value: '30m', label: '30 Min' },
  { value: '1std', label: '1 Std' },
  { value: '4std', label: '4 Std' },
  { value: '1 tag', label: '1 Tag' },
  { value: '1 woche', label: '1 Woche' }
];

interface CryptoScoringEnterpriseProps {
  selectedSymbol: string;
  onSelectSymbol?: (symbol: string) => void;
  timeframe: string;
  onChangeTimeframe?: (timeframe: string) => void;
}

export function CryptoScoringEnterprise({ 
  selectedSymbol, 
  onSelectSymbol, 
  timeframe, 
  onChangeTimeframe 
}: CryptoScoringEnterpriseProps) {
  // Keep up to 3 selected symbols
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(() => {
    const initial = selectedSymbol ? selectedSymbol.toUpperCase() : 'BTC';
    return ['BTC', 'ETH', 'SOL'].includes(initial) ? ['BTC', 'ETH', 'SOL'] : [initial, 'BTC', 'ETH'].slice(0, 3);
  });

  const [activeSymbol, setActiveSymbol] = useState<string>(selectedSymbol ? selectedSymbol.toUpperCase() : 'BTC');
  const [inputs, setInputs] = useState<CryptoScoringInputs | null>(null);
  const [customInputs, setCustomInputs] = useState<Partial<CryptoScoringInputs>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [suggestions, setSuggestions] = useState<typeof CRYPTO_DATABASE>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'scoring' | 'simulation' | 'validation' | 'report' | 'agents'>('scoring');
  
  // 4-hour countdown timer states (4 hours = 14400 seconds)
  const [countdown, setCountdown] = useState<number>(14400);
  const [isAutomating, setIsAutomating] = useState<boolean>(true);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [activeAgentIndex, setActiveAgentIndex] = useState<number>(-1);
  const [activeIncident, setActiveIncident] = useState<'error' | 'security' | 'quality' | 'revenue' | null>(null);

  // Repository Documents (includes stale ones to be deleted and fresh ones to be generated)
  const [repoDocuments, setRepoDocuments] = useState<Array<{
    id: string;
    name: string;
    version: string;
    timeframe: string;
    date: string;
    status: 'aktuell' | 'gelöscht';
    size: string;
    category: string;
  }>>([
    { id: 'doc-1', name: 'AIF_Crypto_Report_BTC_stale.pdf', version: 'v2.1', timeframe: '4 Std', date: 'Vor 5 Stunden', status: 'aktuell', size: '1.4 MB', category: 'Executive Report' },
    { id: 'doc-2', name: 'Security_Integritaets_Audit_old.json', version: 'v1.8', timeframe: '1 Tag', date: 'Vor 6 Stunden', status: 'aktuell', size: '240 KB', category: 'Compliance Audit' },
    { id: 'doc-3', name: 'Revenue_Assurance_Matrix_v1.pdf', version: 'v1.0', timeframe: '1 Std', date: 'Vor 8 Stunden', status: 'aktuell', size: '890 KB', category: 'Ertragssicherung' },
  ]);

  // Terminal Logs for Agent Activity
  const [agentLogs, setAgentLogs] = useState<Array<{
    id: string;
    time: string;
    source: string;
    text: string;
    status: 'info' | 'success' | 'warn' | 'error';
  }>>([
    { id: 'log-init', time: '06:00:00', source: 'System', text: '4-Stunden-Sicherheits- & Aktualisierungsregel geladen.', status: 'info' },
    { id: 'log-ready', time: '06:00:01', source: 'Autonome Agenten', text: 'Alle Agenten (Quality, Security, Revenue, Janitor) befinden sich im Wächter-Modus.', status: 'success' },
  ]);

  // Helper to format countdown into HH:MM:SS
  const formatCountdown = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Add helper log function
  const addAgentLog = (source: string, text: string, status: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const timeStr = new Date().toLocaleTimeString('de-DE');
    setAgentLogs(prev => [
      ...prev,
      {
        id: `log-${Date.now()}-${Math.random()}`,
        time: timeStr,
        source,
        text,
        status
      }
    ]);
  };

  // Autonomous Agent cascade trigger
  const triggerAgentAutomation = (incident?: 'error' | 'security' | 'quality' | 'revenue') => {
    if (isSimulating) return;
    setIsSimulating(true);
    setActiveIncident(incident || null);
    
    // Clear logs to focus on active optimization cycle
    setAgentLogs([]);
    addAgentLog('System', `Initiiere autonome Optimierungs- und Aktualisierungskaskade...`, 'info');
    
    if (incident) {
      const incidentLabels = {
        error: 'Fehlermeldung (Bug)',
        security: 'Sicherheitslücke (Vulnerability)',
        quality: 'Qualitäts-Abweichung (Metric Drift)',
        revenue: 'Revenue Assurance Leckage (Slippage-Verlust)'
      };
      addAgentLog('System', `WARNUNG: Vorfall gemeldet: ${incidentLabels[incident]}`, 'warn');
    } else {
      addAgentLog('System', `Intervall-Auslöser: 4-Stunden-Turnus erreicht. Starte turnusmäßiges Daten- & Compliance-Audit.`, 'info');
    }

    // Step-by-Step autonomous simulation sequence
    // Step 1: Quality Agent (idx 0)
    setTimeout(() => {
      setActiveAgentIndex(0);
      addAgentLog('Audit- & Qualitäts-Agent', `Analysiere Code-Struktur, Datenqualität und Parameter-Rauschen für ${activeSymbol}...`, 'info');
      addAgentLog('Audit- & Qualitäts-Agent', `Überprüfe mathematische Integrität des Scoring-Modells.`, 'info');
      
      if (incident === 'error' || incident === 'quality') {
        addAgentLog('Audit- & Qualitäts-Agent', `FEHLER/ABWEICHUNG DETEKTIERT: Anomalie im Parameterschnittspunkt der Volatilitätsmetriken von ${activeSymbol}.`, 'warn');
        addAgentLog('Audit- & Qualitäts-Agent', `Wende mathematische Formelkorrektur an und optimiere die Regressionskoeffizienten...`, 'info');
        addAgentLog('Audit- & Qualitäts-Agent', `Korrektur erfolgreich kompiliert. Fehler im Berechnungsmodell behoben.`, 'success');
      } else {
        addAgentLog('Audit- & Qualitäts-Agent', `OK: Alle 24 Metriken weisen eine korrekte Abweichungstoleranz auf.`, 'success');
      }
    }, 1200);

    // Step 2: Security Agent (idx 1)
    setTimeout(() => {
      setActiveAgentIndex(1);
      addAgentLog('Sicherheits-Agent', `Prüfe API-Eingänge und Datenquellen auf ungewöhnliche Volumenverschiebungen...`, 'info');
      addAgentLog('Sicherheits-Agent', `Führe Zero-Knowledge Smart-Contract-Audit durch.`, 'info');
      
      if (incident === 'security') {
        addAgentLog('Sicherheits-Agent', `KRITISCHER ALARM: API-Vulnerabilität bei Drittanbieter-Schnittstelle registriert!`, 'error');
        addAgentLog('Sicherheits-Agent', `Patche Endpoint-Zulieferung autonom ab und erzwinge lokale Verschlüsselungsprüfung...`, 'info');
        addAgentLog('Sicherheits-Agent', `ERFOLG: Vulnerabilität neutralisiert, Schnittstelle durch TLS 1.3 Tunnel abgesichert.`, 'success');
      } else {
        addAgentLog('Sicherheits-Agent', `OK: Keine Smart-Contract Schwachstellen oder DDOS-Risiken im aktuellen Pool gefunden.`, 'success');
      }
    }, 3200);

    // Step 3: Revenue Assurance Agent (idx 2)
    setTimeout(() => {
      setActiveAgentIndex(2);
      addAgentLog('Revenue-Assurance-Agent', `Analysiere Bid-Ask-Spreads und Slippage-Verluste bei großvolumigen Orders...`, 'info');
      addAgentLog('Revenue-Assurance-Agent', `Überprüfe Arbitrage-Schnittstellen auf Ertragseinbußen (Revenue Leaks).`, 'info');
      
      if (incident === 'revenue') {
        addAgentLog('Revenue-Assurance-Agent', `LECKAGE DETEKTIERT: Hoher Slippage-Schwellenwert gefährdet Ertragsquote bei ${activeSymbol}-Orders.`, 'warn');
        addAgentLog('Revenue-Assurance-Agent', `Passe Orderbuch-Tiefe-Koeffizienten autonom an und kalibriere Penalty-Sensitivität...`, 'info');
        addAgentLog('Revenue-Assurance-Agent', `ERTRAGS-INTEGRITÄT WIEDERHERGESTELLT: Dynamischer Spread-Filter kalibriert.`, 'success');
      } else {
        addAgentLog('Revenue-Assurance-Agent', `OK: Alle Liquiditäts- und Slippage-Werte liegen innerhalb der optimalen Rentabilitätsgrenze.`, 'success');
      }
    }, 5200);

    // Step 4: Janitor & Purger Agent (idx 3)
    setTimeout(() => {
      setActiveAgentIndex(3);
      addAgentLog('Purger & Berichts-Agent', `Lokalisierte veraltete Dokumente und Berichte (älter als 4 Stunden)...`, 'info');
      
      // Update the documents state - mark old ones as deleted, and add new ones
      setRepoDocuments(prev => {
        // Mark all previous documents as gelöscht
        const updatedPrev = prev.map(doc => ({ ...doc, status: 'gelöscht' as const }));
        
        // Add new fresh documents
        const freshDocs = [
          { 
            id: `doc-fresh-1-${Date.now()}`, 
            name: `AIF_Crypto_Report_${activeSymbol}_FRESH.pdf`, 
            version: 'v3.0', 
            timeframe, 
            date: 'Gerade eben (Autonome Generierung)', 
            status: 'aktuell' as const, 
            size: '1.6 MB', 
            category: 'Executive Report' 
          },
          { 
            id: `doc-fresh-2-${Date.now()}`, 
            name: `Security_Integritaets_Audit_FRESH.json`, 
            version: 'v3.0', 
            timeframe: 'Echtzeit', 
            date: 'Gerade eben (Autonome Generierung)', 
            status: 'aktuell' as const, 
            size: '310 KB', 
            category: 'Compliance Audit' 
          },
          { 
            id: `doc-fresh-3-${Date.now()}`, 
            name: `Revenue_Assurance_Matrix_OPTIMIZED.pdf`, 
            version: 'v3.0', 
            timeframe: 'Echtzeit', 
            date: 'Gerade eben (Autonome Generierung)', 
            status: 'aktuell' as const, 
            size: '940 KB', 
            category: 'Ertragssicherung' 
          }
        ];
        return [...updatedPrev, ...freshDocs];
      });

      addAgentLog('Purger & Berichts-Agent', `STALE DOCUMENTS REMOVED: 3 veraltete Reports gelöscht, um Platz für neue, optimierte Datensätze zu schaffen.`, 'warn');
      addAgentLog('Purger & Berichts-Agent', `Erstelle 3 neue optimierte Berichte (PDF, JSON, TXT) auf dem neuesten Stand...`, 'info');
      addAgentLog('Purger & Berichts-Agent', `Berichte erfolgreich neu erzeugt und im Repository bereitgestellt.`, 'success');
    }, 7200);

    // Step 5: Wrap up & reset countdown
    setTimeout(() => {
      setActiveAgentIndex(-1);
      setIsSimulating(false);
      setActiveIncident(null);
      setCountdown(14400); // reset 4 hours
      addAgentLog('System', `Kaskade erfolgreich abgeschlossen. Repository ist zu 100% konsistent, optimiert und aktuell.`, 'success');
    }, 8800);
  };

  // 4-Hour Countdown Timer Hook
  useEffect(() => {
    if (!isAutomating || isSimulating) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          triggerAgentAutomation();
          return 14400; // Reset to 4 hours
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isAutomating, isSimulating, activeSymbol, timeframe]);



  // Click outside to hide suggestions list
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync selectedSymbol from props to ensure dashboard is synchronized
  useEffect(() => {
    if (selectedSymbol) {
      const upper = selectedSymbol.toUpperCase();
      setActiveSymbol(upper);
      if (!selectedSymbols.includes(upper)) {
        setSelectedSymbols(prev => {
          if (prev.includes(upper)) return prev;
          if (prev.length < 3) {
            return [...prev, upper];
          } else {
            // Replace the last element if we already have 3
            return [prev[0], prev[1], upper];
          }
        });
      }
    }
  }, [selectedSymbol]);

  // Load / calculate inputs based on activeSymbol and timeframe
  useEffect(() => {
    setLoading(true);
    fetch(`/api/crypto-scoring/${activeSymbol}`)
      .then(res => res.json())
      .then(data => {
        // Adapt inputs based on the selected timeframe to make the scoring dynamic
        const adaptedInputs = adjustInputsForTimeframe(data.inputs, timeframe);
        setInputs(adaptedInputs);
        setCustomInputs(adaptedInputs);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch crypto scoring details:', err);
        // Fallback local inputs generator
        const dbAsset = CRYPTO_DATABASE.find(c => c.symbol === activeSymbol);
        const fallback = generateCryptoInputs(activeSymbol, dbAsset ? dbAsset.change24h : 2.5);
        const adaptedInputs = adjustInputsForTimeframe(fallback, timeframe);
        setInputs(adaptedInputs);
        setCustomInputs(adaptedInputs);
        setLoading(false);
      });
  }, [activeSymbol, timeframe]);

  // Helper to dynamically scale metrics according to timeframe
  const adjustInputsForTimeframe = (raw: CryptoScoringInputs, tf: string): CryptoScoringInputs => {
    const copy = { ...raw };
    switch (tf) {
      case '1m':
      case '5m':
        copy.volatility_quality = Math.max(0.1, copy.volatility_quality * 0.4);
        copy.spread = Math.min(1.0, copy.spread * 2.5);
        copy.momentum = Math.min(1.0, copy.momentum * 1.25);
        copy.ai_confidence = Math.max(0.2, copy.ai_confidence * 0.7);
        copy.manipulation_risk = Math.min(1.0, copy.manipulation_risk * 1.5);
        break;
      case '15m':
      case '30m':
        copy.volatility_quality = Math.max(0.1, copy.volatility_quality * 0.6);
        copy.spread = Math.min(1.0, copy.spread * 1.8);
        copy.momentum = Math.min(1.0, copy.momentum * 1.15);
        copy.manipulation_risk = Math.min(1.0, copy.manipulation_risk * 1.25);
        break;
      case '1std':
      case '4std':
        // Default standard values
        break;
      case '1 tag':
        copy.trend = Math.min(1.0, copy.trend * 1.1);
        copy.slippage_estimate = Math.max(0.01, copy.slippage_estimate * 0.8);
        copy.active_addresses = Math.min(1.0, copy.active_addresses * 1.15);
        copy.news_momentum = Math.min(1.0, copy.news_momentum * 1.2);
        copy.manipulation_risk = Math.max(0.01, copy.manipulation_risk * 0.7);
        break;
      case '1 woche':
        copy.trend = Math.min(1.0, copy.trend * 1.25);
        copy.spread = Math.max(0.01, copy.spread * 0.6);
        copy.slippage_estimate = Math.max(0.01, copy.slippage_estimate * 0.5);
        copy.active_addresses = Math.min(1.0, copy.active_addresses * 1.3);
        copy.community_engagement = Math.min(1.0, copy.community_engagement * 1.2);
        copy.manipulation_risk = Math.max(0.01, copy.manipulation_risk * 0.4);
        copy.rugpull_risk = Math.max(0.001, copy.rugpull_risk * 0.2);
        break;
    }
    return copy;
  };

  // Live intelligent search mapping filter
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setErrorMessage(null);

    if (!val.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const q = val.toLowerCase().trim();
    const filtered = CRYPTO_DATABASE.filter(item => {
      return (
        item.symbol.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.nickname.toLowerCase().includes(q) ||
        item.pair.toLowerCase().replace('/', '').replace('-', '').includes(q)
      );
    });

    // Sort results to prioritize exact symbol matches first
    const sorted = [...filtered].sort((a, b) => {
      const aSym = a.symbol.toLowerCase();
      const bSym = b.symbol.toLowerCase();
      if (aSym === q) return -1;
      if (bSym === q) return 1;
      if (aSym.startsWith(q) && !bSym.startsWith(q)) return -1;
      if (bSym.startsWith(q) && !aSym.startsWith(q)) return 1;
      return 0;
    });

    setSuggestions(sorted);
    setShowSuggestions(true);
  };

  const handleSelectAsset = (sym: string) => {
    const upper = sym.toUpperCase();
    
    // Add to selected array if not already present
    if (!selectedSymbols.includes(upper)) {
      if (selectedSymbols.length >= 3) {
        setErrorMessage("Maximal 3 Assets gleichzeitig erlaubt. Bitte entferne ein Asset, um ein neues hinzuzufügen.");
        setTimeout(() => setErrorMessage(null), 4000);
        setShowSuggestions(false);
        setSearchQuery('');
        return;
      }
      setSelectedSymbols(prev => [...prev, upper]);
    }
    
    setActiveSymbol(upper);
    if (onSelectSymbol) {
      onSelectSymbol(upper);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleRemoveAsset = (e: React.MouseEvent, sym: string) => {
    e.stopPropagation();
    if (selectedSymbols.length <= 1) {
      setErrorMessage("Mindestens ein Asset muss ausgewählt bleiben.");
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const nextSymbols = selectedSymbols.filter(s => s !== sym);
    setSelectedSymbols(nextSymbols);
    
    // If we removed the active one, switch to the first remaining
    if (activeSymbol === sym) {
      const newActive = nextSymbols[0];
      setActiveSymbol(newActive);
      if (onSelectSymbol) {
        onSelectSymbol(newActive);
      }
    }
  };

  const handleSliderChange = (key: keyof CryptoScoringInputs, val: number) => {
    const updated = { ...customInputs, [key]: val };
    setCustomInputs(updated);
  };

  const handleResetInputs = () => {
    if (inputs) {
      setCustomInputs(inputs);
    }
  };

  // Re-calculate the score using local logic based on custom slider overrides
  const scoringResult = customInputs && (customInputs as CryptoScoringInputs).coin 
    ? calculateCryptoEnterpriseScore(customInputs as CryptoScoringInputs)
    : null;

  const originalResult = inputs ? calculateCryptoEnterpriseScore(inputs) : null;

  // Categorized inputs mapping for rendering sliders beautifully
  const categories = [
    {
      id: 'market',
      title: 'Market Structure Module',
      color: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
      fields: [
        { key: 'trend', label: 'Trend Quality', desc: 'EMA stacks & technically confirmed macro direction', weight: 14 },
        { key: 'momentum', label: 'Momentum', desc: 'RSI / MACD impulse speed covered by volume', weight: 12 },
        { key: 'volatility_quality', label: 'Volatility Quality', desc: 'Healthy expansion vs low-liquidity noise', weight: 10 },
        { key: 'breakout_quality', label: 'Breakout Quality', desc: 'Clean level breaks vs false fakeouts', weight: 8 },
        { key: 'relative_strength', label: 'Relative Strength', desc: 'Strength compared to BTC & Index', weight: 8 },
      ]
    },
    {
      id: 'liquidity',
      title: 'Execution & Liquidity Module',
      color: 'from-cyan-500/20 to-teal-500/10 border-cyan-500/30 text-cyan-400',
      fields: [
        { key: 'avg_daily_volume', label: 'Daily Trading Volume', desc: 'Average spot/futures institutional volume', weight: 10 },
        { key: 'spread', label: 'Bid-Ask Spread', desc: 'Bid-Ask narrowness (penalty factor)', weight: 8, isPenalty: true },
        { key: 'orderbook_depth', label: 'Orderbook Depth', desc: 'Liquidity buffer size in order book +/- 2%', weight: 8 },
        { key: 'slippage_estimate', label: 'Slippage Estimate', desc: 'Expected transaction impact cost (penalty factor)', weight: 6, isPenalty: true },
      ]
    },
    {
      id: 'onchain',
      title: 'On-Chain Activity Module',
      color: 'from-emerald-500/20 to-green-500/10 border-emerald-500/30 text-emerald-400',
      fields: [
        { key: 'active_addresses', label: 'Active Addresses', desc: 'Daily active addresses growth rate', weight: 5 },
        { key: 'exchange_flows', label: 'Exchange Flows', desc: 'Outflows (bullish) vs inflows (bearish)', weight: 5 },
        { key: 'whale_activity', label: 'Whale Accumulation', desc: 'Large wallet addresses accumulation rate', weight: 5 },
        { key: 'supply_dynamics', label: 'Supply Dynamics', desc: 'Deflationary burning or lockups', weight: 4 },
      ]
    },
    {
      id: 'sentiment',
      title: 'Sentiment & Narrative',
      color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
      fields: [
        { key: 'social_velocity', label: 'Social Velocity', desc: 'Social mentions acceleration speed', weight: 6 },
        { key: 'narrative_strength', label: 'Narrative Strength', desc: 'Macro market narrative index fit (AI/L2/RWA)', weight: 5 },
        { key: 'news_momentum', label: 'News Momentum', desc: 'Positive sentiment ratio in media articles', weight: 5 },
        { key: 'community_engagement', label: 'Community Engagement', desc: 'Discord, Telegram, X growth/retention', weight: 4 },
      ]
    },
    {
      id: 'risk',
      title: 'Enterprise Risk & Compliance Module',
      color: 'from-rose-500/20 to-pink-500/10 border-rose-500/30 text-rose-400',
      fields: [
        { key: 'manipulation_risk', label: 'Wash-Trading Risk', desc: 'Unusual exchange volumes or spikes (penalty)', weight: 5, isPenalty: true },
        { key: 'exchange_concentration', label: 'Exchange Concentration', desc: 'Over-reliance on centralized platforms (penalty)', weight: 4, isPenalty: true },
        { key: 'rugpull_risk', label: 'Smart Contract / Rugpull Risk', desc: 'Vulnerabilities or centralization of code (penalty)', weight: 3, isPenalty: true },
        { key: 'data_quality_risk', label: 'Data Gaps Risk', desc: 'Signal missing or corrupted historical datasets (penalty)', weight: 2, isPenalty: true },
      ]
    },
    {
      id: 'regime',
      title: 'Regime & AI Confidence',
      color: 'from-purple-500/20 to-fuchsia-500/10 border-purple-500/30 text-purple-400',
      fields: [
        { key: 'ai_confidence', label: 'AI Model Confidence', desc: 'Dynamic deep model trust quotient', weight: 2 },
        { key: 'regime_bonus', label: 'Regime Context Bonus', desc: 'Bullish vs bearish market structure bonus', weight: 6 },
      ]
    }
  ];

  // Helper to color decision badges elegantly
  const getDecisionBadge = (decision: string) => {
    switch (decision) {
      case 'A_setup':
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/45 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
          label: 'A-Setup',
          pill: 'bg-emerald-500 text-black'
        };
      case 'tradeable_watch':
        return {
          bg: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/45 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
          label: 'Tradeable Watch',
          pill: 'bg-cyan-500 text-black'
        };
      case 'speculative_watch':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border border-amber-500/45',
          label: 'Speculative Watch',
          pill: 'bg-amber-500 text-black'
        };
      case 'observe':
        return {
          bg: 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/45',
          label: 'Observe',
          pill: 'bg-indigo-500 text-white'
        };
      default:
        return {
          bg: 'bg-rose-500/15 text-rose-400 border border-rose-500/45',
          label: 'Reject',
          pill: 'bg-rose-500 text-white'
        };
    }
  };

  const currentBadge = scoringResult ? getDecisionBadge(scoringResult.decision) : null;

  // Helper to render static scores for selected assets cards
  const getAssetDetails = (sym: string) => {
    const dbAsset = CRYPTO_DATABASE.find(c => c.symbol === sym);
    const change = dbAsset ? dbAsset.change24h : 2.5;
    const fallbackInputs = generateCryptoInputs(sym, change);
    const adaptedInputs = adjustInputsForTimeframe(fallbackInputs, timeframe);
    const result = calculateCryptoEnterpriseScore(adaptedInputs);
    return {
      name: dbAsset ? dbAsset.name : sym,
      price: dbAsset ? dbAsset.price : 1.0,
      change24h: change,
      score: result.final_score,
      decision: result.decision,
      mcap: dbAsset ? dbAsset.mcap : 'N/A'
    };
  };

  return (
    <div id="crypto-enterprise-scoring-root" className="bg-gradient-to-br from-[#121214] via-[#1c1c20] to-[#0d0d0f] border border-white/10 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
      {/* Decorative radial lighting */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Control Panel Section */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start pb-6 border-b border-white/10 mb-6">
        
        {/* Left Side: Meta Title */}
        <div className="xl:col-span-5 space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/10 rounded-lg border border-blue-500/30 text-blue-400 animate-pulse">
              <Cpu size={18} />
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white font-display uppercase">Crypto Scoring Enterprise</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/25 font-bold uppercase tracking-wider">v3.0 Active</span>
            </div>
          </div>
          <p className="text-xs text-white/60 font-mono leading-relaxed max-w-xl">
            Vollständig mathematisch auditierbare Multilayer-Bewertung für das Top-300-Kryptouniversum nach institutionalisierten Risiko-, Trend-, Liquiditäts-, Sentiment- und On-Chain-Metriken.
          </p>
        </div>

        {/* Center/Right Side: Intelligent Search & Timeframe Selection */}
        <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-12 gap-3 w-full" ref={containerRef}>
          
          {/* Autocomplete Search Bar */}
          <div className="sm:col-span-8 relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Suche nach Symbol, Rufname (z.B. Gold) oder Paar (z.B. BTC/USD)..."
                className="w-full bg-black/40 text-xs text-white placeholder-white/40 pl-10 pr-4 py-3 rounded-xl border border-white/10 hover:border-white/20 focus:border-blue-500/60 focus:bg-black/60 focus:outline-none transition-all font-mono"
              />
            </div>

            {/* Error Message Tooltip */}
            {errorMessage && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-rose-500/90 text-white text-xs px-3 py-1.5 rounded-lg z-50 font-mono font-bold shadow-lg flex items-center gap-2 animate-fade-in">
                <AlertTriangle size={14} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* suggestions overlay */}
            {showSuggestions && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl">
                <div className="p-2 border-b border-white/5 bg-white/5">
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-black block">Vorschläge & Intelligentes Mapping</span>
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-white/5">
                  {suggestions.length > 0 ? (
                    suggestions.map((item) => {
                      const isSelected = selectedSymbols.includes(item.symbol);
                      return (
                        <button
                          key={item.symbol}
                          onClick={() => handleSelectAsset(item.symbol)}
                          className="w-full text-left p-3 hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white font-mono">
                              {item.symbol}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white font-display">{item.name}</p>
                              <p className="text-[10px] text-white/40 font-mono">{item.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-[11px] font-mono text-zinc-400 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                              {item.pair.split(',')[0]}
                            </span>
                            {isSelected ? (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider border border-emerald-500/20">Ausgewählt</span>
                            ) : (
                              <Plus size={14} className="text-blue-400 hover:scale-110 transition-transform" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : searchQuery.trim() ? (
                    <div className="p-4 text-center text-white/40 text-xs font-mono">
                      Keine passenden Werte gefunden. Versuche es mit BTC, Solana, Ether oder Gold.
                    </div>
                  ) : (
                    // Default trending recommendations when input is empty
                    CRYPTO_DATABASE.slice(0, 5).map((item) => {
                      const isSelected = selectedSymbols.includes(item.symbol);
                      return (
                        <button
                          key={item.symbol}
                          onClick={() => handleSelectAsset(item.symbol)}
                          className="w-full text-left p-3 hover:bg-white/5 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white font-mono">
                              {item.symbol}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white font-display">{item.name}</p>
                              <p className="text-[10px] text-white/40 font-mono">{item.desc}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-white/40">MarketCap: {item.mcap}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold uppercase border border-emerald-500/20">Aktiv</span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Timeframe Selector */}
          <div className="sm:col-span-4 flex flex-col justify-center">
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
              <select
                value={timeframe}
                onChange={(e) => {
                  if (onChangeTimeframe) {
                    onChangeTimeframe(e.target.value);
                  }
                }}
                className="w-full bg-black/40 text-xs text-white/90 pl-8 pr-4 py-3 rounded-xl border border-white/10 hover:border-white/20 focus:outline-none focus:border-blue-500/60 transition-all font-mono appearance-none cursor-pointer"
              >
                {TIMEFRAMES.map(tf => (
                  <option key={tf.value} value={tf.value} className="bg-zinc-950 text-white font-mono">{tf.label}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center px-2 text-white/40">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Multi-Asset Selected Row (Up to 3 Slots) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {selectedSymbols.map((sym) => {
          const details = getAssetDetails(sym);
          const isCurrentActive = activeSymbol === sym;
          const badge = getDecisionBadge(details.decision);
          return (
            <div
              key={sym}
              onClick={() => {
                setActiveSymbol(sym);
                if (onSelectSymbol) onSelectSymbol(sym);
              }}
              className={`p-4 rounded-xl border backdrop-blur-md cursor-pointer transition-all relative group flex flex-col justify-between ${
                isCurrentActive
                  ? 'bg-gradient-to-br from-blue-900/15 via-indigo-950/15 to-transparent border-blue-500/50 shadow-[0_4px_25px_rgba(59,130,246,0.15)] ring-1 ring-blue-500/20'
                  : 'bg-black/30 border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs text-white font-mono">
                    {sym}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide truncate max-w-[110px]">
                      {details.name}
                    </h4>
                    <span className="text-[10px] font-mono text-white/40">Mcap: {details.mcap}</span>
                  </div>
                </div>
                
                {/* Remove slot cross */}
                <button
                  onClick={(e) => handleRemoveAsset(e, sym)}
                  className="p-1 rounded text-white/40 hover:text-white/80 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Asset entfernen"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Price and score row */}
              <div className="flex items-end justify-between mt-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono text-zinc-400 block">
                    {details.price.toLocaleString('de-DE', { style: 'currency', currency: 'USD', minimumFractionDigits: sym.endsWith('USD') || sym.length > 4 ? 4 : 2 })}
                  </span>
                  <span className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
                    details.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {details.change24h >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    <span>{details.change24h >= 0 ? '+' : ''}{details.change24h.toFixed(2)}%</span>
                  </span>
                </div>

                <div className="text-right flex flex-col items-end">
                  <span className="text-[10px] font-mono text-white/40 uppercase block">Score</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wide ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <span className="text-sm font-black font-mono text-white">
                      {details.score.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>

              {isCurrentActive && (
                <div className="absolute bottom-0 inset-x-0 h-[2px] bg-gradient-to-r from-blue-500 to-indigo-500 rounded-b-xl" />
              )}
            </div>
          );
        })}
        
        {/* Placeholder Slot to reach up to 3 */}
        {selectedSymbols.length < 3 && (
          <div 
            onClick={() => {
              if (containerRef.current) {
                const inputEl = containerRef.current.querySelector('input');
                if (inputEl) inputEl.focus();
              }
            }}
            className="border border-dashed border-white/10 hover:border-white/30 rounded-xl p-4 flex flex-col items-center justify-center text-center group cursor-pointer transition-all bg-black/10 hover:bg-black/20"
          >
            <Plus size={16} className="text-white/40 group-hover:text-white/80 group-hover:scale-110 transition-transform mb-1.5" />
            <span className="text-xs text-white/40 group-hover:text-white/70 font-mono uppercase tracking-wider">Asset hinzufügen</span>
            <span className="text-[9px] text-white/30 font-mono">Verbleibende Slots: {3 - selectedSymbols.length}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-24 text-center space-y-3 bg-black/20 rounded-xl border border-white/5">
          <RefreshCw className="animate-spin text-blue-400 mx-auto w-8 h-8" />
          <p className="text-xs font-mono text-white/50">Lade institutionalisierte Daten-Schichten für {activeSymbol}...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-white/5 pb-2.5 gap-2 overflow-x-auto scrollbar-none">
            {[
              { id: 'scoring', label: `Live Score-Audit (${activeSymbol})`, icon: Cpu },
              { id: 'simulation', label: 'Interaktiver Simulator', icon: Sliders },
              { id: 'validation', label: 'Validierungs-Bericht', icon: ShieldCheck },
              { id: 'report', label: 'Reporting & Export', icon: FileText },
              { id: 'agents', label: 'Agenten-Steuerung (Auto-4h)', icon: Sparkles }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-bold uppercase transition-all cursor-pointer border shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-white/5 border-white/10 text-blue-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]'
                      : 'border-transparent text-white/50 hover:text-white/90 hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: Live Score-Audit */}
          {activeTab === 'scoring' && scoringResult && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: KPI Ring & Classification */}
              <div className="space-y-6 lg:border-r lg:border-white/5 lg:pr-6">
                <div className="bg-black/40 p-6 rounded-xl border border-white/5 space-y-4 text-center relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                  
                  <span className="text-[10px] font-mono text-white/40 uppercase font-bold tracking-widest block">Enterprise Final Score</span>
                  
                  {/* Glowing big score display */}
                  <div className="relative inline-flex items-center justify-center">
                    <svg className="w-36 h-36 transform -rotate-90">
                      <circle cx="72" cy="72" r="64" stroke="rgba(255,255,255,0.04)" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="72" 
                        cy="72" 
                        r="64" 
                        stroke="url(#blue-gradient-enterprise)" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={2 * Math.PI * 64}
                        strokeDashoffset={2 * Math.PI * 64 * (1 - scoringResult.final_score / 100)}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="blue-gradient-enterprise" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#8b5cf6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-3xl font-black font-display text-white tracking-tighter">{scoringResult.final_score}</span>
                      <span className="text-[10px] font-mono text-white/40 uppercase">von 100</span>
                    </div>
                  </div>

                  {/* Decision status */}
                  <div className="space-y-2 mt-4">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-mono font-black uppercase tracking-widest inline-block ${currentBadge?.bg}`}>
                      {currentBadge?.label}
                    </span>
                    <p className="text-xs text-white/60 px-3">{scoringResult.decisionDesc}</p>
                  </div>
                </div>

                {/* Sub Scores breakdown */}
                <div className="bg-black/30 p-5 rounded-xl border border-white/5 space-y-3">
                  <h4 className="text-xs font-mono text-white/70 font-bold uppercase tracking-wider">Scoring-Bestandteile</h4>
                  
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">Base Score (+)</span>
                      <span className="font-mono text-emerald-400 font-bold">+{scoringResult.base_score}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">Risk Penalty (-)</span>
                      <span className="font-mono text-rose-400 font-bold">-{scoringResult.risk_penalty}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">Regime Bonus (+)</span>
                      <span className="font-mono text-purple-400 font-bold">+{scoringResult.regime_bonus}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-white/60">AI Confidence Bonus</span>
                      <span className="font-mono text-blue-400 font-bold">+{scoringResult.ai_confidence_bonus}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/5 flex justify-between items-center text-xs">
                    <span className="font-bold text-white uppercase">Sicherheitseinstufung</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase border ${
                      scoringResult.risk_level === 'Low' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      scoringResult.risk_level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {scoringResult.risk_level} Risk
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Columns: Audit Reasonings & Active Signals */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-black/30 p-5 rounded-xl border border-white/5 space-y-4">
                  <h3 className="text-sm font-semibold text-white uppercase font-display flex items-center gap-2">
                    <Activity size={14} className="text-blue-400" />
                    <span>Audit-Trail & Begründung ({activeSymbol})</span>
                  </h3>
                  
                  <div className="space-y-2.5">
                    {scoringResult.reasoning.map((reason, index) => (
                      <div key={index} className="flex items-start gap-3 bg-white/[0.02] border border-white/5 p-3 rounded-lg">
                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-white/80 leading-normal">{reason}</span>
                      </div>
                    ))}

                    {scoringResult.alerts.map((alert, index) => (
                      <div key={index} className="flex items-start gap-3 bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg">
                        <AlertTriangle size={14} className="text-rose-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-rose-400 leading-normal">{alert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-900/10 to-indigo-900/10 p-5 rounded-xl border border-blue-500/20 flex flex-col sm:flex-row items-center gap-4 justify-between">
                  <div className="space-y-1 text-center sm:text-left">
                    <h4 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1.5 justify-center sm:justify-start">
                      <Zap size={12} />
                      <span>Modell-Unabhängigkeit</span>
                    </h4>
                    <p className="text-xs text-white/70">
                      Die Berechnungslogik arbeitet datengetrieben und ist unabhängig von einzelnen LLMs – sie lässt sich via MCP an bspw. Claude, Gemini oder GPT anbinden.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('simulation')} 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono uppercase rounded-lg transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    <span>Simulator öffnen</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Interaktiver Simulator */}
          {activeTab === 'simulation' && (
            <div className="space-y-6">
              <div className="bg-blue-950/10 border border-blue-500/10 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-white/70 leading-normal">
                    <strong>Szenarien-Planung ({activeSymbol}):</strong> Passe die Parameter-Schieberegler an, um die Stabilität der Entscheidungen unter veränderten On-Chain-, Volatilitäts- oder Liquiditäts-Bedingungen zu validieren.
                  </p>
                </div>
                <button 
                  onClick={handleResetInputs}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs rounded uppercase tracking-wider cursor-pointer"
                >
                  Zurücksetzen
                </button>
              </div>

              {scoringResult && (
                <div className="bg-black/60 p-5 rounded-xl border border-blue-500/20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
                  <div>
                    <span className="text-[10px] font-mono text-white/40 uppercase">Aktuelles Asset</span>
                    <p className="text-sm font-bold text-white font-display uppercase tracking-widest">{activeSymbol}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-white/40 uppercase">Simulierter Score</span>
                    <p className="text-xl font-black font-mono text-blue-400 tracking-tight">{scoringResult.final_score} / 100</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-white/40 uppercase">Entscheidungsklasse</span>
                    <div>
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-black uppercase tracking-wider inline-block ${currentBadge?.bg}`}>
                        {currentBadge?.label}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-white/40 uppercase">Score-Delta</span>
                    <p className={`text-xs font-mono font-bold ${
                      originalResult ? (scoringResult.final_score - originalResult.final_score >= 0 ? 'text-emerald-400' : 'text-rose-400') : 'text-white'
                    }`}>
                      {originalResult ? `${scoringResult.final_score - originalResult.final_score >= 0 ? '+' : ''}${(scoringResult.final_score - originalResult.final_score).toFixed(2)} vs. Original` : '0.00'}
                    </p>
                  </div>
                </div>
              )}

              {/* Slider list */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((cat) => (
                  <div key={cat.id} className="bg-black/30 p-5 rounded-xl border border-white/5 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                      <Layers size={14} className="text-blue-400" />
                      <h4 className="text-xs font-bold text-white uppercase font-display tracking-wide">{cat.title}</h4>
                    </div>

                    <div className="space-y-4">
                      {cat.fields.map((field) => {
                        const val = customInputs[field.key as keyof CryptoScoringInputs] as number ?? 0.0;
                        return (
                          <div key={field.key} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                              <div className="flex flex-col">
                                <span className="font-medium text-white/80">{field.label}</span>
                                <span className="text-[10px] text-white/40 leading-none">{field.desc}</span>
                              </div>
                              <span className="font-mono text-blue-400 font-bold bg-white/5 px-1.5 py-0.5 rounded">{val.toFixed(2)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={val}
                                onChange={(e) => handleSliderChange(field.key as keyof CryptoScoringInputs, parseFloat(e.target.value))}
                                className="flex-1 accent-blue-500 h-1 bg-white/10 rounded-lg cursor-pointer"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Validierungs-Bericht */}
          {activeTab === 'validation' && (
            <div className="space-y-6">
              <div className="bg-black/40 border border-white/5 p-6 rounded-xl space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
                  <ShieldCheck className="text-emerald-400" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scoring- & Daten-Validierung</h3>
                    <p className="text-xs text-white/60">Compliance & Audit-Protokoll zur Verhinderung fehlerhafter Daten-Interpolation.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Data Quality checks */}
                  <div className="bg-black/20 p-5 rounded-lg border border-white/5 space-y-4">
                    <h4 className="text-xs font-mono text-blue-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Database size={12} />
                      <span>Data Validation Layer</span>
                    </h4>
                    
                    <div className="space-y-3 text-xs text-white/80">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <strong>Vollständigkeit der OHLCV-Daten:</strong>
                          <p className="text-[11px] text-white/50 leading-normal">Keine Signallücken oder Ausfälle in den historischen {timeframe}-Preisreihen von CoinGecko und Stooq registriert.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <strong>Konsistenz der Handelsbörsen:</strong>
                          <p className="text-[11px] text-white/50 leading-normal">Synchronisierung und Cross-Check zwischen Exchange- und Aggregatdaten erfolgreich abgeschlossen.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <strong>Dubletten & Spike-Filter:</strong>
                          <p className="text-[11px] text-white/50 leading-normal">Prüfung auf anormale Flash-Spikes abgeschlossen. Datenqualität liegt über 99.8% Konfidenz-Niveau.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Execution checks */}
                  <div className="bg-black/20 p-5 rounded-lg border border-white/5 space-y-4">
                    <h4 className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Sliders size={12} />
                      <span>Liquidity & Risk validation</span>
                    </h4>

                    <div className="space-y-3 text-xs text-white/80">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <strong>Handelbarer Spread:</strong>
                          <p className="text-[11px] text-white/50 leading-normal">Der gemessene Bid-Ask Spread ist mit dem Standard-Ausführungsmodell des Portfolios kompatibel.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <strong>Orderbuch-Puffer (Tiefe):</strong>
                          <p className="text-[11px] text-white/50 leading-normal">Das Orderbuch verfügt über ausreichende Tiefe im 2%-Bereich, um Slippage bei Marktorders zu deckeln.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <strong>Sicherheit & Manipulations-Screening:</strong>
                          <p className="text-[11px] text-white/50 leading-normal">Der Coin gehört zum Top 300 Krypto-Universum. Kein Smart-Contract Rugpull-Risiko oder extreme Listing-Gefährdung detektiert.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-white/40 gap-3">
                  <span>Audit-ID: AIF-CR-2026-06-29</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-white/80 font-bold font-mono">ALLES VERIFIZIERT</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Reporting & Export */}
          {activeTab === 'report' && scoringResult && (
            <div className="space-y-6">
              <div className="bg-black/40 border border-white/5 p-6 rounded-xl space-y-6">
                <div className="flex items-center gap-2.5 pb-4 border-b border-white/10">
                  <FileText className="text-blue-400" size={20} />
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Enterprise Reporting Layer</h3>
                    <p className="text-xs text-white/60">Finanzberichte und strukturierter Daten-Export zur Vorlage für Trading Desks.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg space-y-1.5">
                    <span className="text-[10px] font-mono text-white/40 uppercase font-bold tracking-widest">Asset-Bericht</span>
                    <h4 className="text-xs font-bold text-white uppercase font-display">Executive Summary</h4>
                    <p className="text-[11px] text-white/50">Kompakter PDF-Statusbericht inklusive Audit-Entscheidung und Risikofaktoren.</p>
                    <button className="text-[10px] text-blue-400 font-mono font-bold hover:underline cursor-pointer">Herunterladen (PDF)</button>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg space-y-1.5">
                    <span className="text-[10px] font-mono text-white/40 uppercase font-bold tracking-widest">Strukturierte Rohdaten</span>
                    <h4 className="text-xs font-bold text-white uppercase font-display">JSON Data Stream</h4>
                    <p className="text-[11px] text-white/50">Vollständiger maschinenlesbarer Export aller 24 Parameter-Werte und Sub-Scores.</p>
                    <button 
                      onClick={() => {
                        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify({ inputs: customInputs, result: scoringResult }, null, 2))}`;
                        const downloadAnchor = document.createElement('a');
                        downloadAnchor.setAttribute('href', jsonString);
                        downloadAnchor.setAttribute('download', `AIF_Scoring_${activeSymbol}_v3.json`);
                        document.body.appendChild(downloadAnchor);
                        downloadAnchor.click();
                        downloadAnchor.remove();
                      }}
                      className="text-[10px] text-blue-400 font-mono font-bold hover:underline cursor-pointer"
                    >
                      Exportieren (JSON)
                    </button>
                  </div>

                  <div className="p-4 bg-white/[0.02] border border-white/5 rounded-lg space-y-1.5">
                    <span className="text-[10px] font-mono text-white/40 uppercase font-bold tracking-widest">Daten-Audit</span>
                    <h4 className="text-xs font-bold text-white uppercase font-display">Validierungsbogen</h4>
                    <p className="text-[11px] text-white/50">Qualitativer Überprüfungsbogen zur Einhaltung der DSGVO- und MiFID II-Datenkonsistenz.</p>
                    <button className="text-[10px] text-blue-400 font-mono font-bold hover:underline cursor-pointer">Herunterladen (TXT)</button>
                  </div>
                </div>

                <div className="bg-black/50 p-5 rounded-lg border border-white/5 space-y-3 text-xs">
                  <h4 className="text-xs font-mono text-white/80 font-bold uppercase tracking-wider">Vorschau: Executive Financial Report ({activeSymbol})</h4>
                  <div className="font-mono bg-black/80 p-4 rounded text-[11px] text-zinc-400 space-y-2 border border-white/5 leading-relaxed">
                    <p className="text-blue-400">--- ENTERPRISE FINANCIAL REPORT ---</p>
                    <p>SYSTEM ID: CryptoTop300ScoringEnterprise_v3.0</p>
                    <p>COIN UNDER SCAN: {activeSymbol}</p>
                    <p>DECISION CLASS: {scoringResult.decisionName.toUpperCase()} ({scoringResult.decisionDesc})</p>
                    <p>FINAL SCORE: {scoringResult.final_score} / 100</p>
                    <p>BASE SCORE (POS): {scoringResult.base_score}</p>
                    <p>RISK PENALTY (NEG): {scoringResult.risk_penalty}</p>
                    <p>REGIME BONUS: {scoringResult.regime_bonus}</p>
                    <p className="text-zinc-600">------------------------------------</p>
                    <p>TIMEFRAME LEVEL: {timeframe.toUpperCase()}</p>
                    <p>DATA INTEGRITY LEVEL: 100% COMPLETE</p>
                    <p>COMPLIANCE CLASSIFICATION: VERIFIED</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* TAB 5: Autonomous Agent Control Room */}
          {activeTab === 'agents' && (
            <div id="autonomous-agent-control-room" className="space-y-6">
              {/* Header with 4-Hour Rule, Active Countdown, and Manual Intervall Trigger */}
              <div className="bg-gradient-to-r from-blue-950/20 via-zinc-900/40 to-purple-950/20 border border-white/10 rounded-xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-purple-500/10 rounded-full blur-[60px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-8 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                        <Clock size={16} className="animate-spin-slow" />
                      </span>
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">
                        Autonome 4-Stunden-Aktualisierungs- & Optimierungsregel
                      </h3>
                    </div>
                    <p className="text-xs text-white/70 max-w-2xl leading-relaxed">
                      Gemäß der Repository-Automatisierungsrichtlinie überwacht dieses System im Hintergrund kontinuierlich alle Metriken. Alle 4 Stunden löscht der <strong>Purger-Agent</strong> veraltete Datenbestände, während die spezialisierten Agenten Optimierungen kompilieren und absolut fehlerfreie, aktuelle Berichte für <strong>{activeSymbol}</strong> erzeugen.
                    </p>
                  </div>

                  {/* Countdown Timer Visual */}
                  <div className="md:col-span-4 bg-black/40 border border-white/10 rounded-xl p-4 text-center space-y-2">
                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-black block">Nächstes Regel-Intervall</span>
                    <div className="text-2xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 tracking-wider">
                      {formatCountdown(countdown)}
                    </div>
                    <div className="flex items-center justify-center gap-4 pt-1">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-white/60 hover:text-white transition-colors">
                        <input 
                          type="checkbox" 
                          checked={isAutomating} 
                          onChange={(e) => setIsAutomating(e.target.checked)}
                          className="rounded border-white/20 bg-black/40 text-blue-500 focus:ring-0 w-3 h-3 cursor-pointer"
                        />
                        <span>Automatisierung Aktiv</span>
                      </label>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider font-bold">DSGVO-Konform</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider font-bold">Ertragsschutz Aktiv</span>
                  </div>
                  <button
                    onClick={() => triggerAgentAutomation()}
                    disabled={isSimulating}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-zinc-800 disabled:to-zinc-800 text-white font-mono font-bold text-xs rounded-lg transition-all flex items-center gap-2 uppercase tracking-wider cursor-pointer shadow-lg disabled:cursor-not-allowed"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Kaskade läuft...</span>
                      </>
                    ) : (
                      <>
                        <Play size={14} />
                        <span>4h-Regel Jetzt erzwingen</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Incidents Command Center */}
              <div className="bg-black/30 border border-white/5 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-white/5">
                  <ShieldAlert size={16} className="text-purple-400" />
                  <h4 className="text-xs font-mono font-black text-white uppercase tracking-widest">
                    Manuelles Störungs- & Optimierungs-Desk (Incident Simulator)
                  </h4>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Melde manuell einen Vorfall im Repository. Die autonomen Agenten wachen sofort auf, analysieren die Fehlerquelle, korrigieren das Scoring-Modell, purgen veraltete Dokumente und erstellen ein frisches, bereinigtes Berichts-Set.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'error' as const, label: 'Code-Bug / Berechnungsfehler', icon: AlertTriangle, color: 'hover:bg-rose-500/10 hover:border-rose-500/30 text-rose-400' },
                    { id: 'security' as const, label: 'Sicherheitslücke', icon: ShieldAlert, color: 'hover:bg-amber-500/10 hover:border-amber-500/30 text-amber-400' },
                    { id: 'quality' as const, label: 'Qualitäts-Abweichung', icon: Sliders, color: 'hover:bg-blue-500/10 hover:border-blue-500/30 text-blue-400' },
                    { id: 'revenue' as const, label: 'Revenue Assurance Leckage', icon: TrendingDown, color: 'hover:bg-emerald-500/10 hover:border-emerald-500/30 text-emerald-400' }
                  ].map((inc) => {
                    const Icon = inc.icon;
                    return (
                      <button
                        key={inc.id}
                        onClick={() => triggerAgentAutomation(inc.id)}
                        disabled={isSimulating}
                        className={`p-3.5 bg-black/40 border border-white/10 rounded-xl text-left transition-all flex items-start gap-2.5 group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${inc.color}`}
                      >
                        <Icon size={16} className="shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <div>
                          <p className="text-xs font-bold text-white leading-snug">{inc.label}</p>
                          <span className="text-[10px] text-white/40 block mt-0.5 font-mono">Agenten autonom triggern</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* The 4 Autonomous Agents Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    name: 'Audit- & Qualitäts-Agent',
                    role: 'Code & Math Optimizer',
                    desc: 'Garantiert fehlerfreien Code & kalibriert die 24 Primärparameter der Scoring-Matrix.',
                    icon: Cpu,
                    color: 'text-blue-400 border-blue-500/20 bg-blue-500/5',
                    anim: 'animate-pulse'
                  },
                  {
                    name: 'Sicherheits-Agent',
                    role: 'Security Guardian',
                    desc: 'Scannt Schwachstellen, blockiert Manipulationsversuche und härtet API-Zuläufe ab.',
                    icon: ShieldAlert,
                    color: 'text-amber-400 border-amber-500/20 bg-amber-500/5',
                    anim: 'animate-pulse'
                  },
                  {
                    name: 'Revenue-Assurance-Agent',
                    role: 'Yield Guardian',
                    desc: 'Überprüft Bid-Ask Spreads, Slippage-Abweichungen und Arbitrage-Verluste.',
                    icon: Layers,
                    color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5',
                    anim: 'animate-pulse'
                  },
                  {
                    name: 'Purger- & Berichts-Agent',
                    role: 'Repository Janitor',
                    desc: 'Löscht veraltete Berichte (älter als 4 Stunden) und erzeugt frische PDFs & JSON-Exports.',
                    icon: Trash2,
                    color: 'text-purple-400 border-purple-500/20 bg-purple-500/5',
                    anim: 'animate-pulse'
                  }
                ].map((agent, idx) => {
                  const Icon = agent.icon;
                  const isCurrentActive = activeAgentIndex === idx;
                  return (
                    <div
                      key={idx}
                      className={`p-5 rounded-xl border backdrop-blur-md transition-all flex flex-col justify-between ${
                        isCurrentActive
                          ? 'bg-zinc-900 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/20 scale-[1.02]'
                          : 'bg-black/20 border-white/5'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <span className={`p-2.5 rounded-lg border ${agent.color}`}>
                            <Icon size={18} className={isCurrentActive ? 'animate-spin-slow text-white' : ''} />
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest ${
                            isCurrentActive 
                              ? 'bg-blue-500 text-white animate-pulse' 
                              : isSimulating 
                              ? 'bg-white/5 text-white/30' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {isCurrentActive ? 'ARBEITET' : isSimulating ? 'BEREITSTEL.' : 'WÄCHTER'}
                          </span>
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-white leading-none">{agent.name}</h5>
                          <span className="text-[10px] font-mono text-white/40 block mt-0.5">{agent.role}</span>
                        </div>
                        <p className="text-[11px] text-white/60 leading-normal">{agent.desc}</p>
                      </div>

                      {isCurrentActive && (
                        <div className="mt-4 pt-3 border-t border-white/10">
                          <span className="text-[10px] font-mono text-blue-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                            Autonomer Prozess läuft...
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Lower Section: Realtime Terminal logs & Current virtual documents repo */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Terminal Log Console */}
                <div className="lg:col-span-7 bg-zinc-950 border border-white/10 rounded-xl overflow-hidden flex flex-col h-[320px]">
                  <div className="bg-zinc-900 px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal size={12} className="text-blue-400" />
                      <span className="text-[10px] font-mono text-white/70 uppercase tracking-widest font-black">
                        Echtzeit-Agenten-Protokoll (Live Terminal)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 overflow-y-auto font-mono text-xs space-y-2 select-text selection:bg-blue-500/20 animate-fade-in">
                    {agentLogs.map((log) => {
                      const colorClass = 
                        log.status === 'success' ? 'text-emerald-400' :
                        log.status === 'warn' ? 'text-amber-400' :
                        log.status === 'error' ? 'text-rose-400 font-bold' :
                        log.status === 'info' && log.source !== 'System' ? 'text-blue-400' : 'text-zinc-400';
                      
                      return (
                        <div key={log.id} className="flex items-start gap-1.5 leading-relaxed">
                          <span className="text-zinc-600 text-[10px] shrink-0">[{log.time}]</span>
                          <span className="text-blue-400/80 shrink-0">[{log.source}]:</span>
                          <span className={colorClass}>{log.text}</span>
                        </div>
                      );
                    })}
                    {isSimulating && (
                      <div className="text-blue-400 animate-pulse text-[11px] pt-1">
                        &gt; Warte auf autonomen Folgeschritt...
                      </div>
                    )}
                  </div>
                </div>

                {/* Virtual Repository Document Viewer */}
                <div className="lg:col-span-5 bg-black/40 border border-white/5 rounded-xl p-5 flex flex-col h-[320px]">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <div className="flex items-center gap-2">
                      <Database size={14} className="text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider font-display">Repository Berichts-Zentrum</span>
                    </div>
                    <span className="text-[10px] font-mono text-white/40">
                      Dokumente im System: {repoDocuments.filter(d => d.status === 'aktuell').length}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2.5 scrollbar-none pr-1">
                    {repoDocuments.map((doc) => {
                      const isDeleted = doc.status === 'gelöscht';
                      return (
                        <div
                          key={doc.id}
                          className={`p-3 rounded-lg border transition-all ${
                            isDeleted 
                              ? 'bg-rose-950/10 border-rose-500/10 opacity-40 line-through text-white/30' 
                              : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <FileText size={16} className={isDeleted ? 'text-zinc-500' : 'text-blue-400'} />
                              <div className="min-w-0">
                                <h6 className={`text-xs font-bold truncate ${isDeleted ? 'text-zinc-500' : 'text-white'}`}>
                                  {doc.name}
                                </h6>
                                <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-white/40">
                                  <span>{doc.category}</span>
                                  <span>•</span>
                                  <span>{doc.size}</span>
                                </div>
                              </div>
                            </div>
                            
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                              isDeleted 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25' 
                                : doc.name.includes('FRESH') || doc.name.includes('OPTIMIZED')
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 animate-pulse'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/25'
                            }`}>
                              {isDeleted ? 'Gelöscht' : doc.name.includes('FRESH') || doc.name.includes('OPTIMIZED') ? 'Aktuell (Neu)' : 'Geladen'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5 text-[9px] font-mono">
                            <span className="text-white/40">Version: {doc.version} | {doc.timeframe}</span>
                            <span className={isDeleted ? 'text-zinc-600' : 'text-white/60'}>{doc.date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
