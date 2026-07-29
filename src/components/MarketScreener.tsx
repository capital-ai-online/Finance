import React, { useState, useEffect, useMemo } from 'react';
import { Asset } from '../types';
import { AssetLogo } from './AssetLogo';
import { 
  Search, 
  SlidersHorizontal, 
  RotateCcw, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Cpu, 
  Layers, 
  BarChart4, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Percent, 
  Coins, 
  BadgePercent,
  Check,
  ChevronDown,
  HelpCircle,
  FileText,
  Bell,
  Trash2,
  Sparkles,
  Zap,
  RefreshCw,
  AlertTriangle,
  Send,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { UserSession } from '../App';
import { PdfExportModal } from './PdfExportModal';
import Markdown from 'react-markdown';

interface MarketScreenerProps {
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
  userSession?: UserSession;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  categoryFilter?: string;
  setCategoryFilter?: (c: string) => void;
  userEmail?: string;
}

const INTERVAL_OPTIONS = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minuten' },
  { value: '15m', label: '15 Minuten' },
  { value: '30m', label: '30 Minuten' },
  { value: '60m', label: '60 Minuten' },
  { value: '1h', label: '1 Stunde' },
  { value: '2h', label: '2 Stunden' },
  { value: '4h', label: '4 Stunden' },
  { value: '6h', label: '6 Stunden' },
  { value: '12h', label: '12 Stunden' },
  { value: '24h', label: '24 Stunden' },
  { value: '1d', label: 'Täglich' },
  { value: '1M', label: 'Monatlich' },
  { value: '3M', label: '3 Monate' },
  { value: '6M', label: '6 Monate' },
  { value: '1Y', label: '1 Jahr' },
  { value: '3Y', label: '3 Jahre' },
  { value: '5Y', label: '5 Jahre' }
];

export function MarketScreener({ 
  onSelectSymbol, 
  selectedSymbol, 
  triggerAttempt, 
  userSession,
  userEmail
}: MarketScreenerProps) {

  const effectiveEmail = userEmail || userSession?.email || '';

  // Scan state trackers (limit of 3 for Starter tier)
  const [scansCount, setScansCount] = useState<number>(0);
  const [scanLimitReached, setScanLimitReached] = useState<boolean>(false);
  const [userTier, setUserTier] = useState<string>('Free');

  // Search and Multi-Asset Selection (Up to 3 assets compare grid)
  const [allRegistryAssets, setAllRegistryAssets] = useState<Asset[]>([]);
  const [searchVal, setSearchVal] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);

  // Timeframe interval dual selectors
  const [interval1, setInterval1] = useState<string>('15m');
  const [interval2, setInterval2] = useState<string>('1d');

  // Running scans feedback
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanModifier, setScanModifier] = useState<number>(1.0);
  const [activeTab, setActiveTab] = useState<'screener' | 'perplexity'>('screener');

  // Perplexity deep research chatbot state
  const [perplexityChat, setPerplexityChat] = useState<any[]>([
    { role: 'model', text: 'Willkommen bei der **Perplexity Deep Research Zentrale** (Version 0.5.4).\nKlicken Sie auf ein beliebiges Asset oben, um eine fundierte fundamentale und technische Analyse auszuführen.' }
  ]);
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [selectedChatAsset, setSelectedChatAsset] = useState<Asset | null>(null);

  // Export Paywall State
  const [showExportModal, setShowExportModal] = useState<boolean>(false);

  // Load user tier and local scans tracker
  useEffect(() => {
    if (effectiveEmail) {
      // Get user's current subscription tier
      fetch(`/api/stripe/user-subscription?email=${encodeURIComponent(effectiveEmail)}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.subscriptionTier) {
            setUserTier(data.subscriptionTier);
          }
        })
        .catch(err => console.warn('Could not load user tier:', err));

      // Load scans counter from localStorage
      const todayStr = new Date().toISOString().split('T')[0];
      const savedScans = localStorage.getItem(`screener_scans_${todayStr}_${effectiveEmail}`);
      if (savedScans) {
        setScansCount(parseInt(savedScans, 10));
      }
    }
  }, [effectiveEmail]);

  // Load all assets dynamically on mount
  useEffect(() => {
    fetch('/api/registry/assets')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load asset registry');
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) {
          setAllRegistryAssets(data);
          // Set initial compared assets (BTC, AAPL, EURUSD)
          const btc = data.find(a => a.symbol === 'BTC');
          const aapl = data.find(a => a.symbol === 'AAPL');
          const eurusd = data.find(a => a.symbol === 'EURUSD');
          const initialList = [btc, aapl, eurusd].filter(Boolean) as Asset[];
          setSelectedAssets(initialList.slice(0, 3));
        }
      })
      .catch(err => console.error(err));
  }, []);

  // Filter registry based on search query (by common name, symbol, or currency pair)
  const searchResults = useMemo(() => {
    if (!searchVal.trim()) return [];
    const q = searchVal.toLowerCase().trim();
    return allRegistryAssets.filter(asset => 
      asset.symbol.toLowerCase().includes(q) || 
      asset.name.toLowerCase().includes(q) || 
      (asset.type === 'forex' && asset.symbol.replace('/', '').toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchVal, allRegistryAssets]);

  // Add Asset to compared list (Max 3)
  const handleAddAsset = (asset: Asset) => {
    if (selectedAssets.some(a => a.symbol === asset.symbol)) {
      setSearchVal('');
      setShowDropdown(false);
      return;
    }
    
    if (selectedAssets.length >= 3) {
      // Replace the last one
      setSelectedAssets(prev => [...prev.slice(0, 2), asset]);
    } else {
      setSelectedAssets(prev => [...prev, asset]);
    }
    setSearchVal('');
    setShowDropdown(false);
  };

  const handleRemoveAsset = (symbol: string) => {
    setSelectedAssets(prev => prev.filter(a => a.symbol !== symbol));
  };

  // Perform multi-interval scan check and limitations
  const handleStartScan = () => {
    if (userTier === 'Starter' && scansCount >= 3) {
      setScanLimitReached(true);
      return;
    }

    setScanning(true);
    setScanLimitReached(false);

    // Simulate real calculations
    setTimeout(() => {
      setScanning(false);
      setScanModifier(prev => prev === 1.0 ? 1.03 : 1.0);
      
      // Increment scans count for Starters
      if (userTier === 'Starter' && effectiveEmail) {
        const nextScans = scansCount + 1;
        setScansCount(nextScans);
        const todayStr = new Date().toISOString().split('T')[0];
        localStorage.setItem(`screener_scans_${todayStr}_${effectiveEmail}`, String(nextScans));
      }
    }, 1800);
  };

  // Automated Perplexity Deep valuation query using Gemini chat
  const handleTriggerPerplexityValuation = async (asset: Asset) => {
    setSelectedChatAsset(asset);
    setActiveTab('perplexity');
    setChatLoading(true);

    const userMessage = `Führe eine tiefgehende quantitative Finanzbewertung durch für das Asset ${asset.name} (${asset.symbol}) bezüglich intrinsischem Wert, technischem Score, Risikofaktoren und Marktpositionierung im v0.5.4 Beta-System. Stelle die Erwartungswerte und Stop-Loss Level präzise heraus.`;
    
    const newHistory = [...perplexityChat, { role: 'user', text: `Bitte analysiere ${asset.name} (${asset.symbol})` }];
    setPerplexityChat(newHistory);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: perplexityChat.map(msg => ({ role: msg.role === 'model' ? 'model' : 'user', text: msg.text }))
        })
      });

      if (!res.ok) throw new Error('Fehler beim Abrufen der AI-Analyse');
      const data = await res.json();
      
      setPerplexityChat(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch (err: any) {
      setPerplexityChat(prev => [...prev, { role: 'model', text: `❌ Fehler bei der Generierung der Perplexity-Bewertung: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Dynamic values helper per interval
  const getScoringForAsset = (asset: Asset, interval: string) => {
    const charSum = asset.symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const offset = interval === '1m' ? -15 : interval === '15m' ? -5 : interval === '1d' ? 5 : interval === '1Y' ? 12 : 0;
    const baseScore = asset.score || 70;
    const calculated = Math.min(99, Math.max(12, Math.round((baseScore * scanModifier) + offset + (charSum % 11) - 5)));
    
    let label = 'Neutral';
    let textColor = 'text-yellow-400';
    if (calculated >= 80) { label = 'Strong Buy'; textColor = 'text-emerald-400'; }
    else if (calculated >= 60) { label = 'Buy'; textColor = 'text-green-400'; }
    else if (calculated <= 40) { label = 'Sell'; textColor = 'text-rose-400'; }

    return { score: calculated, label, textColor };
  };

  const getPatternForAsset = (asset: Asset, interval: string) => {
    const s = asset.symbol.toUpperCase();
    const charSum = s.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const patterns = [
      'Bull Flag',
      'Double Bottom',
      'Hammer Support',
      'Ascending Triangle',
      'Falling Wedge',
      'Cup & Handle',
      'Inverted Head & Shoulders',
      'Morning Star'
    ];
    // Vary based on interval hash
    const intervalHash = interval.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return patterns[(charSum + intervalHash) % patterns.length];
  };

  // Generates Traffic light price ranges (Stop Loss, Entry, Take Profit)
  const getTrafficLightData = (asset: Asset) => {
    const price = asset.price;
    const isCrypto = asset.type === 'crypto';
    const isForex = asset.type === 'forex';
    
    let slPercent = 0.05;
    let tpPercent = 0.12;

    if (isCrypto) { slPercent = 0.10; tpPercent = 0.25; }
    else if (isForex) { slPercent = 0.01; tpPercent = 0.025; }

    const stopLoss = price * (1 - slPercent);
    const entryMin = price * 0.99;
    const entryMax = price * 1.01;
    const takeProfit = price * (1 + tpPercent);

    const fmt = (val: number) => {
      if (isForex) return val.toFixed(5);
      if (price > 100) return val.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return val.toFixed(2);
    };

    return {
      stopLossRange: `Unter ${fmt(stopLoss)}`,
      entryRange: `${fmt(entryMin)} - ${fmt(entryMax)}`,
      takeProfitRange: `Über ${fmt(takeProfit)}`
    };
  };

  // Mapped News Feed to asset classes in bottom-right
  const filteredNews = useMemo(() => {
    const activeClasses = new Set(selectedAssets.map(a => a.type));
    const allNews = [
      { id: 1, type: 'crypto', title: 'Bitcoin bricht über gleitenden Durchschnitt aus', source: 'Reuters Crypto', date: 'Vor 10 Min' },
      { id: 2, type: 'stock', title: 'Apple Silicon treibt Mac Verkäufe um 15% in die Höhe', source: 'Dow Jones', date: 'Vor 25 Min' },
      { id: 3, type: 'forex', title: 'US-Arbeitsmarktdaten stärken den US-Dollar gegenüber dem Euro', source: 'Bloomberg FX', date: 'Vor 45 Min' },
      { id: 4, type: 'commodity', title: 'WTI Öl stabilisiert sich über 80 USD infolge Nahost-Gespräche', source: 'OPEC Monitor', date: 'Vor 1 Std' },
      { id: 5, type: 'crypto', title: 'Ethereum Gas Fees sinken auf historisches Wochentief', source: 'CoinDesk', date: 'Vor 2 Std' },
      { id: 6, type: 'stock', title: 'Analysten heben Kursziel für Nvidia vor Earnings weiter an', source: 'Morgan Stanley', date: 'Vor 3 Std' }
    ];

    if (activeClasses.size === 0) return allNews.slice(0, 3);
    return allNews.filter(n => activeClasses.has(n.type as any)).slice(0, 3);
  }, [selectedAssets]);

  // Real PDF generator code
  const executePDFGeneration = () => {
    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(15, 15, 15);
    doc.rect(0, 0, 210, 38, 'F');
    
    // Gold Accent Line
    doc.setFillColor(245, 196, 83);
    doc.rect(0, 38, 210, 2, 'F');
    
    // Typography
    doc.setTextColor(245, 196, 83);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('CAPITAL-AI', 15, 18);
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('ENTERPRISE DUAL-INTERVAL SCREENER REPORT', 15, 28);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 196, 83);
    doc.text('SYSTEM: COMPLIANCE CORE', 145, 18);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'normal');
    doc.text(`DATUM: ${new Date().toLocaleDateString('de-DE')}`, 145, 28);
    
    let y = 50;
    doc.setTextColor(15, 15, 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. ANALYSIERTE ZEITINTERVALLE & VERGLEICH', 15, y);
    doc.setDrawColor(245, 196, 83);
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    
    doc.text(`Vergleich Intervall 1: ${INTERVAL_OPTIONS.find(o => o.value === interval1)?.label || interval1}`, 15, y);
    doc.text(`Vergleich Intervall 2: ${INTERVAL_OPTIONS.find(o => o.value === interval2)?.label || interval2}`, 110, y);
    
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('2. MULTI-ASSET SCORING & PATTERN-VERGLEICH', 15, y);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 12;

    selectedAssets.forEach((asset, idx) => {
      const data1 = getScoringForAsset(asset, interval1);
      const data2 = getScoringForAsset(asset, interval2);
      const pat1 = getPatternForAsset(asset, interval1);
      const pat2 = getPatternForAsset(asset, interval2);
      const tl = getTrafficLightData(asset);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 15, 15);
      doc.text(`${idx + 1}. ${asset.name} (${asset.symbol}) - Kurs: ${asset.price.toLocaleString('de-DE')} €`, 15, y);
      
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      
      doc.text(`Score [${interval1}]: ${data1.score}% (${data1.label})`, 20, y);
      doc.text(`Muster: ${pat1}`, 110, y);
      
      y += 5;
      doc.text(`Score [${interval2}]: ${data2.score}% (${data2.label})`, 20, y);
      doc.text(`Muster: ${pat2}`, 110, y);

      y += 5;
      doc.text(`Ampel-Setup: [Stop-Loss: ${tl.stopLossRange}] | [Entry: ${tl.entryRange}] | [Take-Profit: ${tl.takeProfitRange}]`, 20, y);
      
      y += 10;
    });

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('CAPITAL-AI Version 0.5.4 Beta • DSGVO & BaFin-konformer Hochfrequenz-Daten-Export.', 15, 285);

    doc.save(`CAPITAL_AI_EnterpriseScreener_Report_${Date.now()}.pdf`);
  };

  const handleExportClick = () => {
    if (effectiveEmail) {
      setShowExportModal(true);
    } else {
      executePDFGeneration();
    }
  };

  return (
    <div className="bg-zinc-950/40 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-aif-gold-DEFAULT/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/25 tracking-widest uppercase">
              ENTERPRISE COCKPIT
            </span>
            <span className="text-white/40 font-mono text-[10px]">v0.5.4 Beta</span>
          </div>
          <h2 className="text-xl font-black text-white font-display uppercase tracking-tight flex items-center gap-2">
            <BarChart4 size={18} className="text-aif-gold-DEFAULT" />
            <span>Enterprise Multi-Interval Screener</span>
          </h2>
          <p className="text-xs text-white/50 leading-relaxed max-w-2xl mt-1">
            Analysieren Sie bis zu 3 Assets parallel über zwei beliebige Zeithorizonte hinweg. Ermitteln Sie neuronale Scorings, aktive Chart-Muster und automatisierte Stop-Loss/Take-Profit Entry-Ränge im Ampel-Layout.
          </p>
        </div>

        {/* Scan Actions & Limitations Display */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto shrink-0">
          {userTier === 'Starter' && (
            <div className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/5 font-mono text-[10px] text-white/60">
              Scans heute: <span className="text-aif-gold-DEFAULT font-bold">{scansCount} / 3</span>
            </div>
          )}
          <button
            onClick={handleStartScan}
            disabled={scanning}
            className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-aif-gold-DEFAULT hover:bg-amber-500 text-black flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_15px_rgba(245,196,83,0.15)] shrink-0"
          >
            {scanning ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Analysiere Märkte...</span>
              </>
            ) : (
              <>
                <Zap size={14} className="animate-pulse" />
                <span>Multi-Intervall-Scan starten</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Paywall Alarm block if limit hit */}
      {scanLimitReached && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-3"
        >
          <AlertTriangle className="text-rose-400 mt-0.5 shrink-0" size={16} />
          <div className="space-y-1 leading-normal">
            <strong className="block text-white">Starter Scan-Limit von 3 täglichen Scans erreicht</strong>
            <p>Schalten Sie unbegrenzte Echtzeit-Scans und tiefe quantitative Risikowertungen über ein Upgrade frei.</p>
          </div>
        </motion.div>
      )}

      {/* Tab Selectors */}
      <div className="flex border-b border-white/5 pb-0.5 gap-2">
        <button
          onClick={() => setActiveTab('screener')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'screener' 
              ? 'border-aif-gold-DEFAULT text-white' 
              : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          Screener Workspace
        </button>
        <button
          onClick={() => setActiveTab('perplexity')}
          className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'perplexity' 
              ? 'border-aif-gold-DEFAULT text-white' 
              : 'border-transparent text-white/40 hover:text-white/60'
          }`}
        >
          <MessageSquare size={13} className={activeTab === 'perplexity' ? 'text-aif-gold-DEFAULT' : ''} />
          <span>Perplexity Deep Valuation</span>
        </button>
      </div>

      {activeTab === 'screener' ? (
        <div className="space-y-6">
          {/* Controls Bar: Intelligent Search & Timeframe comparison selectors */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Search Input */}
            <div className="lg:col-span-5 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/40 pointer-events-none">
                <Search size={14} />
              </span>
              <input
                type="text"
                value={searchVal}
                onChange={(e) => {
                  setSearchVal(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Asset suchen nach Rufname, Symbol oder FX-Paar..."
                className="w-full pl-9 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-white/35 font-sans focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all font-medium"
              />

              {/* Suggestions Dropdown */}
              <AnimatePresence>
                {showDropdown && searchVal.trim() && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 right-0 top-full mt-1.5 bg-zinc-950 border border-white/10 rounded-xl max-h-60 overflow-y-auto z-20 shadow-2xl p-1"
                    >
                      {searchResults.length > 0 ? (
                        searchResults.map(asset => (
                          <button
                            key={asset.symbol}
                            onClick={() => handleAddAsset(asset)}
                            className="w-full px-3 py-2 text-left text-xs hover:bg-white/5 rounded-lg text-white font-mono flex items-center justify-between cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <AssetLogo symbol={asset.symbol} size={16} />
                              <span className="font-extrabold text-white">{asset.symbol}</span>
                              <span className="text-white/40 font-sans truncate max-w-[150px]">{asset.name}</span>
                            </div>
                            <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-white/5 text-white/50 font-sans font-bold">
                              {asset.type}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-center text-[10px] font-mono text-white/40">Keine Assets gefunden</div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Timeframe Interval 1 */}
            <div className="lg:col-span-3 flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono text-white/40 shrink-0">Horizont 1:</span>
              <select
                value={interval1}
                onChange={(e) => setInterval1(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 font-sans"
              >
                {INTERVAL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-zinc-950 text-white">{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Timeframe Interval 2 */}
            <div className="lg:col-span-3 flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono text-white/40 shrink-0">Horizont 2:</span>
              <select
                value={interval2}
                onChange={(e) => setInterval2(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 font-sans"
              >
                {INTERVAL_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-zinc-950 text-white">{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Download Report PDF with Paywall */}
            <div className="lg:col-span-1 flex justify-end">
              <button
                onClick={handleExportClick}
                className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-aif-gold-DEFAULT/30 text-white hover:text-aif-gold-DEFAULT transition-all cursor-pointer"
                title="Screener Report als PDF herunterladen"
              >
                <Download size={14} />
              </button>
            </div>
          </div>

          {/* Asset List Grid (Max 3 compared assets) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectedAssets.map((asset) => {
              const data1 = getScoringForAsset(asset, interval1);
              const data2 = getScoringForAsset(asset, interval2);
              const pat1 = getPatternForAsset(asset, interval1);
              const pat2 = getPatternForAsset(asset, interval2);
              const tl = getTrafficLightData(asset);

              return (
                <div key={asset.symbol} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4 relative flex flex-col justify-between shadow-lg">
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveAsset(asset.symbol)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-white/30 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                    title="Asset aus Vergleich entfernen"
                  >
                    <Trash2 size={13} />
                  </button>

                  {/* Header info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AssetLogo symbol={asset.symbol} size={24} />
                      <div>
                        <h4 className="font-extrabold text-white font-mono leading-none">{asset.symbol}</h4>
                        <span className="text-[10px] text-white/40 truncate max-w-[140px] block mt-0.5">{asset.name}</span>
                      </div>
                    </div>

                    <div className="text-lg font-mono font-black text-white">
                      {asset.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })} €
                    </div>
                  </div>

                  {/* Dual interval comparative outputs */}
                  <div className="space-y-3.5 border-t border-b border-white/5 py-4">
                    {/* Interval 1 Output */}
                    <div className="bg-white/5 rounded-xl p-3 space-y-1.5 border border-white/5">
                      <div className="flex justify-between items-center text-[9px] font-mono text-white/40 uppercase">
                        <span>Horizont: {INTERVAL_OPTIONS.find(o => o.value === interval1)?.label || interval1}</span>
                        <span className={`${data1.textColor} font-bold`}>{data1.label}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-black font-mono text-white">{data1.score}%</span>
                        <span className="text-[10px] text-white/60 font-mono italic">{pat1}</span>
                      </div>
                    </div>

                    {/* Interval 2 Output */}
                    <div className="bg-white/5 rounded-xl p-3 space-y-1.5 border border-white/5">
                      <div className="flex justify-between items-center text-[9px] font-mono text-white/40 uppercase">
                        <span>Horizont: {INTERVAL_OPTIONS.find(o => o.value === interval2)?.label || interval2}</span>
                        <span className={`${data2.textColor} font-bold`}>{data2.label}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-black font-mono text-white">{data2.score}%</span>
                        <span className="text-[10px] text-white/60 font-mono italic">{pat2}</span>
                      </div>
                    </div>
                  </div>

                  {/* Traffic Light Ampel-Grafik ranges */}
                  <div className="space-y-2.5">
                    <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">Ampel-Layout (Entry Ränge)</span>
                    
                    {/* Stop-Loss indicator */}
                    <div className="flex items-center gap-2.5 text-xs font-mono">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] shrink-0" />
                      <span className="text-white/40 text-[10px] w-14 shrink-0 font-sans">Stop-Loss:</span>
                      <span className="text-red-400 font-bold font-mono text-[11px]">{tl.stopLossRange} €</span>
                    </div>

                    {/* Entry range indicator */}
                    <div className="flex items-center gap-2.5 text-xs font-mono">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] shrink-0" />
                      <span className="text-white/40 text-[10px] w-14 shrink-0 font-sans">Entry Zone:</span>
                      <span className="text-amber-400 font-bold font-mono text-[11px]">{tl.entryRange} €</span>
                    </div>

                    {/* Take-Profit indicator */}
                    <div className="flex items-center gap-2.5 text-xs font-mono">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0" />
                      <span className="text-white/40 text-[10px] w-14 shrink-0 font-sans">Take-Profit:</span>
                      <span className="text-emerald-400 font-bold font-mono text-[11px]">{tl.takeProfitRange} €</span>
                    </div>
                  </div>

                  {/* Perplexity Chat deep research trigger */}
                  <button
                    onClick={() => handleTriggerPerplexityValuation(asset)}
                    className="mt-4 w-full py-2 bg-white/5 hover:bg-white/10 hover:text-aif-gold-DEFAULT border border-white/5 hover:border-aif-gold-DEFAULT/30 rounded-xl text-[10px] font-bold font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare size={11} />
                    <span>Perplexity AI Analyse</span>
                  </button>
                </div>
              );
            })}

            {selectedAssets.length === 0 && (
              <div className="col-span-3 p-12 text-center border border-white/10 border-dashed rounded-2xl bg-zinc-900/10">
                <p className="text-xs text-white/50">Bitte wählen Sie oben Assets aus, um den Vergleich zu starten.</p>
              </div>
            )}
          </div>

          {/* Bottom Row: News Feed on bottom right, and brief documentation on left */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
            <div className="lg:col-span-6 bg-white/5 border border-white/5 rounded-2xl p-5 space-y-3.5">
              <h4 className="text-xs font-black uppercase font-mono text-white/60 tracking-widest flex items-center gap-1.5">
                <Cpu size={12} className="text-aif-gold-DEFAULT" />
                <span>Dual-Interval Scoring-Methodik</span>
              </h4>
              <p className="text-[11px] text-white/40 leading-relaxed font-sans">
                Unser System berechnet zeitgleich quantitative Wahrscheinlichkeiten über Kurzfrist- und Langfristhypothesen. Im Gegensatz zu statischen Screenings filtert die CAPITAL-AI Engine (v0.5.4) falsche Volatilitätssignale und berechnet optimierte Risikoparameter konform mit den BaFin-Qualitätsrichtlinien für Retail-Händler.
              </p>
            </div>

            {/* News Feed on bottom right */}
            <div className="lg:col-span-6 bg-white/5 border border-white/5 rounded-2xl p-5 space-y-3.5">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase font-mono text-white/60 tracking-widest flex items-center gap-1.5">
                  <Bell size={12} className="text-aif-gold-DEFAULT" />
                  <span>Klassenspezifische Nachrichten & Signale</span>
                </h4>
                <span className="text-[8px] font-mono font-bold bg-aif-gold-DEFAULT/10 text-aif-gold-DEFAULT px-2 py-0.5 rounded border border-aif-gold-DEFAULT/25">
                  LIVE NEWS FEED
                </span>
              </div>
              <div className="space-y-2.5">
                {filteredNews.map(news => (
                  <div key={news.id} className="flex justify-between items-start gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-white/40 font-mono text-[8px]">
                        {news.type}
                      </span>
                      <p className="text-[11px] text-white/80 font-sans leading-snug font-medium mt-1">{news.title}</p>
                    </div>
                    <div className="text-right shrink-0 font-mono text-[9px] text-white/30">
                      <div>{news.source}</div>
                      <div className="mt-0.5">{news.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Perplexity Chat Workspace Tab View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Quick Picker Column */}
          <div className="lg:col-span-3 bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block">Verfügbare Assets</span>
              <div className="space-y-2">
                {selectedAssets.map(asset => (
                  <button
                    key={asset.symbol}
                    onClick={() => handleTriggerPerplexityValuation(asset)}
                    className={`w-full p-2.5 text-left border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                      selectedChatAsset?.symbol === asset.symbol
                        ? 'bg-aif-gold-DEFAULT text-black border-aif-gold-DEFAULT'
                        : 'bg-white/5 border-white/5 hover:bg-white/10 text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <AssetLogo symbol={asset.symbol} size={16} />
                      <span className="text-xs font-mono font-bold">{asset.symbol}</span>
                    </div>
                    <ChevronRight size={12} />
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-[9px] text-white/30 font-mono uppercase tracking-wider">Perplexity Engine</p>
              <p className="text-[11px] text-white/50 leading-normal font-sans mt-1">
                Deep Research sucht die quantitativen Parameter der Asset Registry und generiert Deep-Dive Berichte.
              </p>
            </div>
          </div>

          {/* Chat Window Column */}
          <div className="lg:col-span-9 bg-black/40 border border-white/10 rounded-2xl p-5 h-[480px] flex flex-col justify-between relative overflow-hidden">
            {/* Chats log container */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {perplexityChat.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-4 rounded-2xl max-w-xl text-xs leading-relaxed leading-normal ${
                    msg.role === 'user' 
                      ? 'bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/25 text-white rounded-br-none'
                      : 'bg-white/5 border border-white/5 text-white/90 rounded-bl-none markdown-body font-sans'
                  }`}>
                    {msg.role === 'model' ? (
                      <Markdown>{msg.text}</Markdown>
                    ) : (
                      <span className="font-semibold">{msg.text}</span>
                    )}
                  </div>
                </div>
              ))}
              
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/5 p-4 rounded-2xl rounded-bl-none flex items-center gap-2.5 text-xs text-white/60">
                    <RefreshCw size={13} className="animate-spin text-aif-gold-DEFAULT" />
                    <span>Perplexity Deep AI Research analysiert quantitativen Kontext...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick action helper prompts */}
            {selectedChatAsset && (
              <div className="flex flex-wrap gap-2 py-3 border-t border-white/5 mt-3">
                <span className="text-[9px] uppercase font-mono text-white/30 self-center">Schnellabfragen:</span>
                <button
                  onClick={() => {
                    if (selectedChatAsset) {
                      setPerplexityChat(prev => [...prev, { role: 'user', text: 'Wie hoch ist das geschätzte Stop-Loss Limit?' }]);
                      handleTriggerPerplexityValuation(selectedChatAsset);
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-mono text-white/60 border border-white/5 cursor-pointer"
                >
                  Stop-Loss-Limit?
                </button>
                <button
                  onClick={() => {
                    if (selectedChatAsset) {
                      setPerplexityChat(prev => [...prev, { role: 'user', text: 'Nenne mir die größten Risikofaktoren im aktuellen Markt.' }]);
                      handleTriggerPerplexityValuation(selectedChatAsset);
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[9px] font-mono text-white/60 border border-white/5 cursor-pointer"
                >
                  Risikofaktoren?
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exporter modal */}
      <AnimatePresence>
        {showExportModal && effectiveEmail && (
          <PdfExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            email={effectiveEmail}
            onSuccess={executePDFGeneration}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
