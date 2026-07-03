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
  BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { UserSession } from '../App';
import { 
  getSessionAlerts, 
  saveSessionAlerts, 
  toggleSessionAlert, 
  PriceAlertItem 
} from '../lib/alertStore';

interface MarketScreenerProps {
  onSelectSymbol: (symbol: string) => void;
  selectedSymbol: string;
  triggerAttempt?: (actionName: string, onExecute: () => void) => void;
  userSession?: UserSession;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  categoryFilter?: string;
  setCategoryFilter?: (c: string) => void;
}

type SortField = 'symbol' | 'name' | 'price' | 'change24h' | 'score' | 'peRatio' | 'marketCap' | 'dividendYield' | 'debtToEquity' | 'grahamScore' | 'volume24h';
type SortOrder = 'asc' | 'desc';

// Mapping dictionary matching German/English names, nicknames, and aliases to core stock tickers / crypto symbols
const ALIAS_MAP: Record<string, string[]> = {
  'AAPL': ['apple', 'apfel', 'iphone', 'macbook', 'ios', 'steve jobs', 'tim cook', 'tech aktie'],
  'TSLA': ['tesla', 'elon', 'musk', 'e-auto', 'ev', 'model s', 'cyber truck', 'elektroauto'],
  'NVDA': ['nvidia', 'ki-chips', 'gforce', 'gpu', 'grafikkarte', 'ai chips', 'rtx', 'chipsatz'],
  'GLD': ['gold', 'goldbarren', 'gld', 'edelmetall', 'sicherer hafen', 'commodity', 'rohstoff'],
  'SLV': ['silber', 'silver', 'slv', 'edelmetall', 'metall', 'commodity', 'rohstoff'],
  'USO': ['rohöl', 'crude oil', 'öl', 'oil', 'uso', 'energie', 'commodity', 'rohstoff'],
  'NG=F': ['gas', 'natural gas', 'ng=f', 'ng', 'erdgas', 'methan', 'energie', 'rohstoff'],
  'WTI': ['wti', 'wti crude oil', 'us-öl', 'west texas intermediate', 'rohöl', 'öl', 'oil', 'energie', 'rohstoff'],
  'BRENT': ['brent', 'brent crude oil', 'nordsee-öl', 'brent-öl', 'rohöl', 'öl', 'oil', 'energie', 'rohstoff'],
  'BTC': ['bitcoin', 'btc', 'crypto', 'krypto', 'satoshi', 'digitales gold', 'digital gold', 'coin'],
  'ETH': ['ethereum', 'ether', 'eth', 'smart contracts', 'vitalik', 'gas fee', 'altcoin'],
  'EURUSD': ['forex', 'devisen', 'euro', 'dollar', 'währung', 'currency', 'geldkurs']
};

// Reusable simple hover tooltip with an elegant modern dark styling
function SimpleTooltip({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="relative group/tooltip inline-block w-full">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 p-3 rounded-xl bg-neutral-950 border border-white/10 text-xs text-white shadow-2xl hidden group-hover/tooltip:block pointer-events-none z-50 animate-fade-in">
        <div className="font-extrabold text-aif-gold-DEFAULT mb-1 flex items-center gap-1">
          <HelpCircle size={12} className="text-aif-gold-DEFAULT" />
          <span>{title}</span>
        </div>
        <p className="text-[10px] text-white/70 leading-normal font-sans normal-case">{text}</p>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-950" />
      </div>
    </div>
  );
}

export function MarketScreener({ 
  onSelectSymbol, 
  selectedSymbol, 
  triggerAttempt, 
  userSession,
  searchQuery: propSearchQuery,
  setSearchQuery: propSetSearchQuery,
  categoryFilter: propCategoryFilter,
  setCategoryFilter: propSetCategoryFilter
}: MarketScreenerProps) {
  // Trigger attempt on mount
  useEffect(() => {
    if (triggerAttempt) {
      triggerAttempt('Custom Market Screener', () => {});
    }
  }, []);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // Price Alert state
  const [activeAlerts, setActiveAlerts] = useState<PriceAlertItem[]>([]);

  // Load and sync alerts
  useEffect(() => {
    const email = userSession?.email;
    setActiveAlerts(getSessionAlerts(email));

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.email === email) {
        setActiveAlerts(customEvent.detail.alerts);
      }
    };

    window.addEventListener('aif-alerts-updated', handleSync);
    return () => window.removeEventListener('aif-alerts-updated', handleSync);
  }, [userSession]);

  const alertIsActive = (symbol: string) => {
    return activeAlerts.some(a => a.symbol.toUpperCase() === symbol.toUpperCase() && !a.isTriggered);
  };

  const handleToggleAlert = (asset: any) => {
    const email = userSession?.email;
    toggleSessionAlert(asset.symbol, asset.price, asset.name, asset.type, email);
  };

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Custom Filters State
  const [localAssetType, setLocalAssetType] = useState<string>('all');

  const searchQuery = propSearchQuery !== undefined ? propSearchQuery : localSearchQuery;
  const setSearchQuery = propSetSearchQuery !== undefined ? propSetSearchQuery : setLocalSearchQuery;

  const assetType = propCategoryFilter !== undefined ? propCategoryFilter : localAssetType;
  const setAssetType = propSetCategoryFilter !== undefined ? propSetCategoryFilter : setLocalAssetType;
  
  // Custom Filter Criteria
  const [peMin, setPeMin] = useState<string>('');
  const [peMax, setPeMax] = useState<string>('');
  
  const [mcapMin, setMcapMin] = useState<string>('');
  const [mcapMax, setMcapMax] = useState<string>('');
  
  const [divMin, setDivMin] = useState<string>('');
  const [divMax, setDivMax] = useState<string>('');
  
  const [deMax, setDeMax] = useState<string>('');
  const [minKiScore, setMinKiScore] = useState<number>(0);
  const [minGrahamScore, setMinGrahamScore] = useState<number>(0);
  const [areaFilter, setAreaFilter] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('score');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Active presets
  const [activePreset, setActivePreset] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    fetch('/api/market-data')
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) {
          console.error('Expected array of assets, received:', data);
          setAssets([]);
          setLoading(false);
          return;
        }
        const nonVariants = data.filter((asset: any) => !asset.name.toLowerCase().includes('variant'));
        setAssets(nonVariants);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading screener assets:', err);
        setLoading(false);
      });
  }, []);

  // Preset templates
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    // Reset defaults first
    setPeMin('');
    setPeMax('');
    setMcapMin('');
    setMcapMax('');
    setDivMin('');
    setDivMax('');
    setDeMax('');
    setMinKiScore(0);
    setMinGrahamScore(0);
    setAreaFilter('all');

    if (preset === 'value') {
      setAssetType('stock');
      setPeMax('20');
      setDivMin('1.5');
      setMinGrahamScore(6);
      setMinKiScore(7.5);
    } else if (preset === 'growth') {
      setAssetType('stock');
      setPeMin('25');
      setMcapMin('100');
      setMinKiScore(8.5);
    } else if (preset === 'dividend') {
      setAssetType('stock');
      setDivMin('3.0');
      setPeMax('25');
    } else if (preset === 'crypto-high') {
      setAssetType('crypto');
      setMinKiScore(8.0);
    } else {
      setAssetType('all');
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setAssetType('all');
    setPeMin('');
    setPeMax('');
    setMcapMin('');
    setMcapMax('');
    setDivMin('');
    setDivMax('');
    setDeMax('');
    setMinKiScore(0);
    setMinGrahamScore(0);
    setAreaFilter('all');
    setActivePreset('all');
    setCurrentPage(1);
  };

  // Autocomplete Suggestions logic based on fuzzy query and custom alias map
  const suggestedAssets = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    
    return assets.filter(asset => {
      const matchesAlias = Object.entries(ALIAS_MAP).some(([baseSym, aliases]) => {
        const isTargetAsset = asset.symbol.toUpperCase().startsWith(baseSym.toUpperCase());
        return isTargetAsset && aliases.some(alias => alias.includes(q));
      });
      
      return asset.symbol.toLowerCase().includes(q) || 
             asset.name.toLowerCase().includes(q) ||
             matchesAlias;
    }).slice(0, 5);
  }, [assets, searchQuery]);

  // Filter & Sort logic with smart alias mappings
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase().trim();
        const matchesAlias = Object.entries(ALIAS_MAP).some(([baseSym, aliases]) => {
          const isTargetAsset = asset.symbol.toUpperCase().startsWith(baseSym.toUpperCase());
          return isTargetAsset && aliases.some(alias => alias.includes(q));
        });

        const matchesSearch = 
          asset.symbol.toLowerCase().includes(q) || 
          asset.name.toLowerCase().includes(q) ||
          matchesAlias;

        if (!matchesSearch) return false;
      }

      // 2. Asset Type Filter
      if (assetType !== 'all' && asset.type !== assetType) {
        return false;
      }

      // 3. Custom P/E Filter
      if (asset.peRatio !== undefined) {
        const minVal = parseFloat(peMin);
        const maxVal = parseFloat(peMax);
        if (!isNaN(minVal) && asset.peRatio < minVal) return false;
        if (!isNaN(maxVal) && asset.peRatio > maxVal) return false;
      } else if (peMin || peMax) {
        return false;
      }

      // 4. Custom Market Cap Filter (in Billions)
      if (asset.marketCap !== undefined) {
        const minVal = parseFloat(mcapMin);
        const maxVal = parseFloat(mcapMax);
        if (!isNaN(minVal) && asset.marketCap < minVal) return false;
        if (!isNaN(maxVal) && asset.marketCap > maxVal) return false;
      } else if (mcapMin || mcapMax) {
        return false;
      }

      // 5. Custom Dividend Yield Filter (in %)
      const divYield = asset.dividendYield !== undefined ? asset.dividendYield : 0;
      const minVal = parseFloat(divMin);
      const maxVal = parseFloat(divMax);
      if (!isNaN(minVal) && divYield < minVal) return false;
      if (!isNaN(maxVal) && divYield > maxVal) return false;

      // 6. Custom Debt to Equity
      if (deMax) {
        const maxVal = parseFloat(deMax);
        if (asset.debtToEquity === undefined || asset.debtToEquity > maxVal) return false;
      }

      // 7. KI Score
      if (asset.score < minKiScore) {
        return false;
      }

      // Anwendungsbereich Filter
      if (areaFilter !== 'all' && asset.applicationArea !== areaFilter) {
        return false;
      }

      // 8. Graham Score
      const gScore = asset.grahamScore !== undefined ? asset.grahamScore : 0;
      if (gScore < minGrahamScore) {
        return false;
      }

      return true;
    });
  }, [assets, searchQuery, assetType, peMin, peMax, mcapMin, mcapMax, divMin, divMax, deMax, minKiScore, minGrahamScore, areaFilter]);

  // Sorting logic
  const sortedAssets = useMemo(() => {
    const sorted = [...filteredAssets];
    sorted.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (valA === undefined || valA === null) valA = sortOrder === 'asc' ? Infinity : -Infinity;
      if (valB === undefined || valB === null) valB = sortOrder === 'asc' ? Infinity : -Infinity;

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      }

      return sortOrder === 'asc' 
        ? valA - valB 
        : valB - valA;
    });
    return sorted;
  }, [filteredAssets, sortField, sortOrder]);

  // Statistics calculation for dynamic KPI widgets
  const stats = useMemo(() => {
    const count = sortedAssets.length;
    if (count === 0) return { avgPe: 0, totalMcap: 0, maxDiv: 0, avgKi: 0 };
    
    let peSum = 0;
    let peCount = 0;
    let mcapSum = 0;
    let maxDiv = 0;
    let kiSum = 0;

    sortedAssets.forEach(a => {
      kiSum += a.score;
      if (a.peRatio !== undefined) {
        peSum += a.peRatio;
        peCount++;
      }
      if (a.marketCap !== undefined) {
        mcapSum += a.marketCap;
      }
      if (a.dividendYield !== undefined && a.dividendYield > maxDiv) {
        maxDiv = a.dividendYield;
      }
    });

    return {
      avgPe: peCount > 0 ? Number((peSum / peCount).toFixed(1)) : 0,
      totalMcap: Number(mcapSum.toFixed(1)),
      maxDiv: Number(maxDiv.toFixed(2)),
      avgKi: Number((kiSum / count).toFixed(1))
    };
  }, [sortedAssets]);

  // Pagination bounds
  const totalPages = Math.ceil(sortedAssets.length / itemsPerPage);
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedAssets.slice(start, start + itemsPerPage);
  }, [sortedAssets, currentPage, itemsPerPage]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    if (sortedAssets.length === 0) return;
    
    const headers = [
      'Symbol',
      'Name',
      'Assetklasse',
      'Preis (EUR)',
      'Veraenderung 24h (%)',
      'P/E Ratio (KGV)',
      'Marktkapitalisierung (Mrd. EUR)',
      'Dividendenrendite (%)',
      'Debt-to-Equity (D/E)',
      'Graham Score',
      'KI-Score (0-100)',
      'Risiko',
      'Status'
    ];
    
    const rows = sortedAssets.map(asset => [
      asset.symbol,
      `"${asset.name.replace(/"/g, '""')}"`,
      asset.type.toUpperCase(),
      asset.price.toFixed(2),
      asset.change24h.toFixed(2),
      asset.peRatio !== undefined ? asset.peRatio.toFixed(1) : 'N/A',
      asset.marketCap !== undefined ? asset.marketCap.toFixed(1) : 'N/A',
      asset.dividendYield !== undefined ? asset.dividendYield.toFixed(2) : '0.00',
      asset.debtToEquity !== undefined ? asset.debtToEquity.toFixed(2) : 'N/A',
      asset.grahamScore > 0 ? asset.grahamScore.toFixed(1) : 'N/A',
      asset.score.toFixed(1),
      asset.risk,
      asset.status
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `AIF_CORE_Screener_${assetType}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    if (sortedAssets.length === 0) return;
    
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
    doc.text('AIF-CORE', 15, 18);
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('COMPLIANCE MARKET SCREENER REPORT', 15, 28);
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(245, 196, 83);
    doc.text('SYSTEM: AUTO-ROUTER', 152, 18);
    doc.setTextColor(200, 200, 200);
    doc.setFont('helvetica', 'normal');
    doc.text(`DATUM: ${new Date().toLocaleDateString('de-DE')}`, 152, 28);
    
    let y = 50;
    doc.setTextColor(15, 15, 15);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('1. SCREENING PARAMETER & FILTER-KRITERIEN', 15, y);
    doc.setDrawColor(245, 196, 83);
    doc.setLineWidth(0.5);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    
    // Config info
    doc.text('Assetklasse:', 15, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text(assetType === 'all' ? 'Alle Klassen (Aktien, Crypto, Commodities, Forex)' : assetType.toUpperCase(), 45, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Ergebnisse gesamt:', 125, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text(`${sortedAssets.length} Assets gefunden`, 165, y);
    
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('KGV Filter (P/E):', 15, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text(peMin || peMax ? `${peMin || '0'} - ${peMax || 'Max'}` : 'Kein KGV-Limit', 45, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Kombinierter KI-Score:', 125, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text(`\u003e= ${minKiScore}/100`, 165, y);
    
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Dividenden-Rendite:', 15, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text(divMin || divMax ? `${divMin || '0'}% - ${divMax || 'Max'}%` : 'Kein Dividenden-Limit', 45, y);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text('Graham Score:', 125, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 15, 15);
    doc.text(minGrahamScore > 0 ? `>= ${minGrahamScore}` : 'Kein Graham-Limit', 165, y);
    
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 15, 15);
    doc.text('2. TOP MARKTSCREENER ERGEBNISSE (SORTIERT)', 15, y);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 10;
    // Table headers
    doc.setFillColor(30, 30, 30);
    doc.rect(15, y, 180, 6.5, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Symbol', 18, y + 4.5);
    doc.text('Name', 35, y + 4.5);
    doc.text('Preis', 85, y + 4.5);
    doc.text('Aend. 24h', 105, y + 4.5);
    doc.text('KGV', 125, y + 4.5);
    doc.text('Risiko', 142, y + 4.5);
    doc.text('Graham', 160, y + 4.5);
    doc.text('KI-Score', 178, y + 4.5);
    
    y += 6.5;
    doc.setFont('helvetica', 'normal');
    
    const rowsToDraw = sortedAssets.slice(0, 25); // Top 25 in PDF
    rowsToDraw.forEach((asset, idx) => {
      // Zebra striping
      if (idx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(15, y, 180, 6.5, 'F');
      
      doc.setTextColor(15, 15, 15);
      doc.setFont('helvetica', 'bold');
      doc.text(asset.symbol, 18, y + 4.5);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(asset.name.length > 25 ? asset.name.substring(0, 22) + '...' : asset.name, 35, y + 4.5);
      
      doc.setTextColor(15, 15, 15);
      doc.text(`EUR ${asset.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`, 85, y + 4.5);
      
      if (asset.change24h >= 0) {
        doc.setTextColor(16, 185, 129);
        doc.text(`+${asset.change24h.toFixed(2)}%`, 105, y + 4.5);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text(`${asset.change24h.toFixed(2)}%`, 105, y + 4.5);
      }
      
      doc.setTextColor(40, 40, 40);
      doc.text(asset.peRatio !== undefined ? asset.peRatio.toFixed(1) : 'N/A', 125, y + 4.5);
      
      // Risk level coloring
      if (asset.risk === 'Low') {
        doc.setTextColor(16, 185, 129);
      } else if (asset.risk === 'Medium') {
        doc.setTextColor(245, 196, 83);
      } else {
        doc.setTextColor(239, 68, 68);
      }
      doc.text(asset.risk, 142, y + 4.5);
      
      doc.setTextColor(40, 40, 40);
      doc.text(asset.grahamScore > 0 ? asset.grahamScore.toFixed(1) : 'N/A', 160, y + 4.5);
      
      // KI-Score in bold with gold touch if >= 80.0
      doc.setFont('helvetica', 'bold');
      if (asset.score >= 80.0) {
        doc.setTextColor(217, 119, 6); // amber-600
      } else {
        doc.setTextColor(15, 15, 15);
      }
      doc.text(`${asset.score.toFixed(1)}/100`, 178, y + 4.5);
      doc.setFont('helvetica', 'normal');
      
      y += 6.5;
    });
    
    if (sortedAssets.length > 25) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.text(`... und ${sortedAssets.length - 25} weitere Uebereinstimmungen. Bitte nutzen Sie den vollstaendigen CSV-Export fuer alle Ergebnisse.`, 15, y + 6);
    }
    
    // Page bottom footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text('Dieses Dokument wurde automatisch von AIF-CORE generiert. DSGVO-konforme quantitative Echtzeitanalyse.', 15, 285);
    doc.text('Sven Kulessa • sven.kulessa@gmail.com • Compliant with Art. 30 GDPR / BFSG Accessibility Standards.', 15, 289);
    
    doc.save(`AIF_CORE_Screener_${assetType}_Bericht.pdf`);
  };

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl overflow-visible backdrop-blur-md relative p-6">
      
      {/* Upper header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-aif-gold-DEFAULT text-xs font-mono tracking-widest uppercase mb-1">
            <Layers size={12} />
            <span>AIF-CORE MODUL 1</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-widest font-display uppercase flex items-center gap-3">
            Hocheffizienter Markt-Screener
          </h2>
          <p className="text-xs text-white/50 mt-1 max-w-xl">
            Definiere komplexe fundamentale & technische Kriterien für Aktien, Kryptowährungen und Rohstoffe. Filtere Millionen von Kombinationspfaden in Echtzeit.
          </p>
        </div>

        {/* Quick Presets with Tooltips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/40 font-mono uppercase mr-1">Vorgaben:</span>
          {[
            { id: 'all', label: 'Alle', tooltipTitle: 'Alle anzeigen', tooltipText: 'Zeigt alle verfügbaren Vermögenswerte ohne voreingestellte Kriterien an.' },
            { id: 'value', label: 'Graham Value', tooltipTitle: 'Graham Value', tooltipText: 'Sucht solide, unterbewertete Aktien nach dem bewährten Value-Prinzip von Benjamin Graham (z.B. niedriges KGV, Graham Score > 6).' },
            { id: 'growth', label: 'Big Growth', tooltipTitle: 'Big Growth', tooltipText: 'Fokussiert sich auf stark wachsende Tech-Giganten mit überdurchschnittlichem Momentum und hohem KI-Score.' },
            { id: 'dividend', label: 'High Dividend', tooltipTitle: 'High Dividend', tooltipText: 'Findet etablierte, verlässliche Unternehmen, die eine jährliche Dividendenrendite von über 3% ausschütten.' },
            { id: 'crypto-high', label: 'Crypto Top', tooltipTitle: 'Crypto Top', tooltipText: 'Filtert den Kryptomarkt nach hoch bewerteten digitalen Assets mit exzellenter Marktpräsenz.' }
          ].map(p => (
            <div key={p.id} className="w-auto">
              <SimpleTooltip title={p.tooltipTitle} text={p.tooltipText}>
                <button
                  onClick={() => applyPreset(p.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono tracking-wider uppercase transition-all cursor-pointer ${
                    activePreset === p.id 
                      ? 'bg-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT border-aif-gold-DEFAULT/40 font-bold' 
                      : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              </SimpleTooltip>
            </div>
          ))}
        </div>
      </div>

      {/* Synchronized status badge */}
      <div className="bg-gradient-to-r from-emerald-500/10 via-black/40 to-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 backdrop-blur-md mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <p className="text-xs font-mono text-white/70">
            Enterprise Scorer &amp; Filter sind aktiv mit der <span className="text-aif-gold-DEFAULT font-bold uppercase">Hauptsuche synchronisiert</span>.
          </p>
        </div>
        {searchQuery ? (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/40 uppercase">Aktive Suche:</span>
            <span className="px-2.5 py-1 rounded bg-aif-gold-DEFAULT/15 text-aif-gold-DEFAULT border border-aif-gold-DEFAULT/20 text-xs font-mono font-bold uppercase">
              "{searchQuery}"
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-[10px] font-mono text-white/45 hover:text-white uppercase hover:underline cursor-pointer"
            >
              Löschen
            </button>
          </div>
        ) : (
          <span className="text-[10px] font-mono text-white/30 uppercase tracking-wider">Keine aktiven Suchbegriffe</span>
        )}
      </div>

      {/* Dynamic KPI Stats Row with Tooltips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SimpleTooltip 
          title="Ergebnisse" 
          text="Die Gesamtzahl der gefilterten Aktien und Kryptowährungen, die all deine gewählten Suchkriterien erfüllen."
        >
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between h-full hover:bg-white/10 transition-colors">
            <div>
              <p className="text-[11px] text-white/70 font-mono tracking-wider uppercase">Ergebnisse</p>
              <p className="text-2xl font-black font-mono text-white mt-1">{sortedAssets.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-white/60">
              <CheckCircle2 size={18} />
            </div>
          </div>
        </SimpleTooltip>

        <SimpleTooltip 
          title="Ø P/E (KGV)" 
          text="Das durchschnittliche Kurs-Gewinn-Verhältnis aller angezeigten Aktien. Ein niedriger Durchschnitt deutet auf ein tendenziell günstiger bewertetes Portfolio hin."
        >
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between h-full hover:bg-white/10 transition-colors">
            <div>
              <p className="text-[11px] text-white/70 font-mono tracking-wider uppercase">Ø P/E (KGV)</p>
              <p className="text-2xl font-black font-mono text-blue-400 mt-1">{stats.avgPe || 'N/A'}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <BarChart4 size={18} />
            </div>
          </div>
        </SimpleTooltip>

        <SimpleTooltip 
          title="Max Dividende" 
          text="Die höchste Dividendenrendite unter allen gefilterten Werten. Zeigt dir die profitabelste jährliche Ausschüttung."
        >
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between h-full hover:bg-white/10 transition-colors">
            <div>
              <p className="text-[11px] text-white/70 font-mono tracking-wider uppercase">Max Dividende</p>
              <p className="text-2xl font-black font-mono text-emerald-400 mt-1">{stats.maxDiv ? `${stats.maxDiv}%` : '0.0%'}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BadgePercent size={18} />
            </div>
          </div>
        </SimpleTooltip>

        <SimpleTooltip 
          title="Ø KI-Score" 
          text="Der durchschnittliche KI-Score aller gefilterten Werte. Ein Wert nahe 10 bedeutet eine hervorragende Empfehlung der Künstlichen Intelligenz."
        >
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between h-full hover:bg-white/10 transition-colors">
            <div>
              <p className="text-[11px] text-white/70 font-mono tracking-wider uppercase">Ø KI-Score</p>
              <p className="text-2xl font-black font-mono text-aif-gold-DEFAULT mt-1">{stats.avgKi}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-aif-gold-DEFAULT/10 flex items-center justify-center text-aif-gold-DEFAULT">
              <Cpu size={18} />
            </div>
          </div>
        </SimpleTooltip>
      </div>

      {/* Custom Filters Board */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-5 mb-8 overflow-visible">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <SlidersHorizontal size={16} className="text-aif-gold-DEFAULT" />
            <span>Benutzerdefinierte Filterkriterien</span>
          </div>
          <button 
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs font-mono uppercase tracking-wider transition-all cursor-pointer"
          >
            <RotateCcw size={12} />
            <span>Zurücksetzen</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-4">
          
          {/* KGV / PE Ratio Custom Range */}
          <div className="space-y-4">
            <div>
              <SimpleTooltip 
                title="KGV (P/E Ratio)" 
                text="Das Kurs-Gewinn-Verhältnis. Gibt an, wie viel Euro Anleger zahlen, um einen Euro Jahresgewinn des Unternehmens zu erwerben. Ein kleineres KGV ist tendenziell günstiger."
              >
                <label className="block text-[11px] text-white/70 font-mono uppercase tracking-wider mb-1.5 cursor-help">Kurs-Gewinn-Verhältnis (P/E)</label>
              </SimpleTooltip>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  placeholder="Min KGV"
                  value={peMin}
                  onChange={(e) => { setPeMin(e.target.value); setCurrentPage(1); }}
                  disabled={assetType === 'crypto'}
                  className="w-full bg-black/40 border border-white/10 disabled:opacity-30 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20 animate-none"
                />
                <span className="text-white/30 text-xs">-</span>
                <input 
                  type="number"
                  placeholder="Max KGV"
                  value={peMax}
                  onChange={(e) => { setPeMax(e.target.value); setCurrentPage(1); }}
                  disabled={assetType === 'crypto'}
                  className="w-full bg-black/40 border border-white/10 disabled:opacity-30 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20 animate-none"
                />
              </div>
              <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed font-mono">
                Das KGV vergleicht den Aktienkurs mit dem Gewinn je Aktie. Günstig bewertete Qualitätsaktien liegen meist bei 10–25.
              </p>
            </div>

            <div>
              <SimpleTooltip 
                title="Benjamin Graham Score" 
                text="Berechnet den inneren Wert einer Aktie nach der klassischen Graham-Formel. Ein höherer Score signalisiert eine stärkere Unterbewertung relativ zu den fundamentalen Gewinnaussichten."
              >
                <label className="block text-[11px] text-white/70 font-mono uppercase tracking-wider mb-1.5 cursor-help">Graham-DCF Mindestscore</label>
              </SimpleTooltip>
              <div className="flex items-center gap-3">
                <input 
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minGrahamScore}
                  onChange={(e) => { setMinGrahamScore(parseFloat(e.target.value)); setCurrentPage(1); }}
                  disabled={assetType === 'crypto'}
                  className="w-full accent-aif-gold-DEFAULT cursor-pointer disabled:opacity-30"
                />
                <span className="text-xs font-mono font-bold text-aif-gold-DEFAULT min-w-[24px] text-right">{minGrahamScore}</span>
              </div>
              <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed font-mono">
                Misst die Unterbewertung nach Benjamin Graham. Ein höherer Score signalisiert eine starke Sicherheitsmarge.
              </p>
            </div>
          </div>

          {/* Market Cap Custom Range */}
          <div className="space-y-4">
            <div>
              <SimpleTooltip 
                title="Marktkapitalisierung" 
                text="Der Gesamtwert aller an der Börse ausgegebenen Aktien oder Krypto-Münzen. Errechnet sich aus Preis multipliziert mit der Umlaufmenge."
              >
                <label className="block text-[11px] text-white/70 font-mono uppercase tracking-wider mb-1.5 cursor-help">Marktkapitalisierung (Mrd. EUR)</label>
              </SimpleTooltip>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  placeholder="Min Mrd."
                  value={mcapMin}
                  onChange={(e) => { setMcapMin(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20 animate-none"
                />
                <span className="text-white/30 text-xs">-</span>
                <input 
                  type="number"
                  placeholder="Max Mrd."
                  value={mcapMax}
                  onChange={(e) => { setMcapMax(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20 animate-none"
                />
              </div>
              <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed font-mono">
                Der gesamte Börsenwert des Assets. Mega-Konzerne liegen über 100 Mrd., kleinere Nischenwerte (Micro Caps) unter 1 Mrd.
              </p>
            </div>

            <div>
              <SimpleTooltip 
                title="Intelligenter KI-Score" 
                text="Unser komplexes KI-Modell gewichtet über 45 technische, fundamentale und stimmungsbasierte Indikatoren und gibt eine Gesamtempfehlung von 0 (bärisch/verkaufen) bis 100 (bullisch/kaufen)."
              >
                <label className="block text-[11px] text-white/70 font-mono uppercase tracking-wider mb-1.5 cursor-help">KI Intelligent-Score Mindestwert</label>
              </SimpleTooltip>
              <div className="flex items-center gap-3">
                <input 
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={minKiScore}
                  onChange={(e) => { setMinKiScore(parseFloat(e.target.value)); setCurrentPage(1); }}
                  className="w-full accent-aif-gold-DEFAULT cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-aif-gold-DEFAULT min-w-[24px] text-right">{minKiScore}</span>
              </div>
              <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed font-mono">
                KI-Gesamtauswertung aus über 45 technischen & fundamentalen Metriken. Werte ab 75 zeigen sehr hohes Potenzial.
              </p>
            </div>
          </div>

          {/* Dividend Yield & Debt to Equity */}
          <div className="space-y-4">
            <div>
              <SimpleTooltip 
                title="Dividendenrendite" 
                text="Die prozentuale jährliche Ausschüttung des Unternehmens bezogen auf den aktuellen Aktienkurs. Eine hohe Dividende bietet verlässlichen passiven Cashflow."
              >
                <label className="block text-[11px] text-white/70 font-mono uppercase tracking-wider mb-1.5 cursor-help">Dividendenrendite (%)</label>
              </SimpleTooltip>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  placeholder="Min %"
                  value={divMin}
                  onChange={(e) => { setDivMin(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20 animate-none"
                />
                <span className="text-white/30 text-xs">-</span>
                <input 
                  type="number"
                  placeholder="Max %"
                  value={divMax}
                  onChange={(e) => { setDivMax(e.target.value); setCurrentPage(1); }}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20 animate-none"
                />
              </div>
              <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed font-mono">
                Die jährliche Ausschüttung bezogen auf den aktuellen Kurs. Solide, etablierte Dividendenzahler liegen bei 1.5%–4.0%.
              </p>
            </div>

            <div>
              <SimpleTooltip 
                title="Debt-to-Equity (D/E)" 
                text="Verschuldungsgrad. Vergleicht das Gesamtfremdkapital eines Unternehmens mit seinem Eigenkapital. Werte unter 1.5 bedeuten eine gesunde finanzielle Basis."
              >
                <label className="block text-[11px] text-white/70 font-mono uppercase tracking-wider mb-1.5 cursor-help">Debt-to-Equity Verschuldungsgrad Max</label>
              </SimpleTooltip>
              <input 
                type="number"
                step="0.1"
                placeholder="Max D/E"
                value={deMax}
                onChange={(e) => { setDeMax(e.target.value); setCurrentPage(1); }}
                disabled={assetType === 'crypto'}
                className="w-full bg-black/40 border border-white/10 disabled:opacity-30 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all placeholder:text-white/20 animate-none"
              />
              <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed font-mono">
                Verhältnis von Schulden zu Eigenkapital. Werte unter 1.5 signalisieren eine gesunde, risikoarme Finanzierung.
              </p>
            </div>
          </div>

          {/* Anwendungsbereich Selection */}
          <div className="space-y-4">
            <div>
              <SimpleTooltip 
                title="Anwendungsbereich" 
                text="Filtert Assets nach ihrem technologischen Anwendungsbereich (z.B. Webanwendungen)."
              >
                <label className="block text-[11px] text-white/70 font-mono uppercase tracking-wider mb-1.5 cursor-help">Anwendungsbereich</label>
              </SimpleTooltip>
              <select
                value={areaFilter}
                onChange={(e) => { setAreaFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-black/40 border border-white/10 rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-aif-gold-DEFAULT/50 transition-all cursor-pointer"
              >
                <option value="all" className="bg-neutral-900">Alle Bereiche</option>
                <option value="Webanwendungen" className="bg-neutral-900">Webanwendungen</option>
                <option value="DeFi & Smart Contracts" className="bg-neutral-900">DeFi & Smart Contracts</option>
                <option value="Hardware & AI" className="bg-neutral-900">Hardware & AI</option>
                <option value="E-Commerce & Cloud" className="bg-neutral-900">E-Commerce & Cloud</option>
                <option value="Unterhaltung & Services" className="bg-neutral-900">Unterhaltung & Services</option>
              </select>
              <p className="text-[10px] text-white/50 mt-1.5 leading-relaxed font-mono">
                Grenzt die Werte gezielt auf spezifische technologische Marktsegmente, Branchen oder Ökosysteme ein.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Tabulated List and Results Board */}
      <div className="bg-black/40 border border-white/10 rounded-xl overflow-hidden backdrop-blur-md">
        
        {/* Table header control bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white/5 border-b border-white/10 gap-4">
          <div className="text-xs text-white/50 font-mono">
            Zeigt <span className="text-white font-bold">{Math.min(sortedAssets.length, (currentPage - 1) * itemsPerPage + 1)}</span>-
            <span className="text-white font-bold">{Math.min(sortedAssets.length, currentPage * itemsPerPage)}</span> von{' '}
            <span className="text-aif-gold-DEFAULT font-bold">{sortedAssets.length}</span> Treffern
          </div>

          <div className="flex items-center gap-3">
            <SimpleTooltip title="CSV Export" text="Lade die aktuell gefilterten Ergebnisse als strukturierte Excel-kompatible CSV-Datei für Excel oder Python herunter.">
              <button
                onClick={exportToCSV}
                disabled={sortedAssets.length === 0}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 text-white font-mono font-bold text-xs rounded-lg border border-white/10 py-1.5 px-3 transition-all cursor-pointer"
              >
                <Download size={14} className="text-aif-gold-DEFAULT" />
                <span>Ergebnisse exportieren (CSV)</span>
              </button>
            </SimpleTooltip>

            <SimpleTooltip title="PDF Export" text="Lade die aktuell gefilterten Ergebnisse als formatierten, druckfertigen PDF-Analysereport herunter.">
              <button
                onClick={exportToPDF}
                disabled={sortedAssets.length === 0}
                className="flex items-center gap-2 bg-gradient-to-r from-aif-gold-DEFAULT to-amber-500 hover:brightness-110 disabled:opacity-30 disabled:hover:brightness-100 text-black font-mono font-bold text-xs rounded-lg py-1.5 px-3 transition-all cursor-pointer shadow-[0_0_12px_rgba(245,196,83,0.2)] hover:shadow-[0_0_18px_rgba(245,196,83,0.35)]"
              >
                <FileText size={14} />
                <span>PDF-Report</span>
              </button>
            </SimpleTooltip>
          </div>
        </div>

        {/* The responsive table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-white/50 font-mono flex flex-col items-center gap-4">
              <div className="w-8 h-8 rounded-full border-2 border-t-aif-gold-DEFAULT border-white/15 animate-spin" />
              <span>Analysiere globale Markt-Pipelines...</span>
            </div>
          ) : sortedAssets.length === 0 ? (
            <div className="p-16 text-center text-white/40 font-mono">
              <SlidersHorizontal size={24} className="mx-auto text-white/20 mb-3" />
              <p className="text-sm font-bold">Keine Vermögenswerte entsprechen Deinen Kriterien.</p>
              <p className="text-xs text-white/30 mt-1">Passe Deine Filter an oder setze sie zurück, um Ergebnisse zu sehen.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.01]">
                  {[
                    { field: 'symbol', label: 'Symbol', tooltipTitle: 'Wertpapier-Symbol', tooltipText: 'Eindeutiges Kürzel zur Identifizierung des Vermögenswertes an der Börse.' },
                    { field: 'name', label: 'Name', tooltipTitle: 'Vollständiger Name', tooltipText: 'Der Name des börsennotierten Unternehmens oder der Kryptowährung.' },
                    { field: 'price', label: 'Preis', tooltipTitle: 'Aktueller Kurs', tooltipText: 'Der aktuelle Handelswert in Euro (bzw. Einheiten bei Währungen).' },
                    { field: 'change24h', label: '24h %', tooltipTitle: 'Preisschwankung', tooltipText: 'Die prozentuale Kursbewegung innerhalb der vergangenen 24 Stunden.' },
                    { field: 'peRatio', label: 'P/E (KGV)', tooltipTitle: 'Kurs-Gewinn-Verhältnis', tooltipText: 'Kurs-Gewinn-Verhältnis der letzten 12 Monate. Nur für Aktien verfügbar.' },
                    { field: 'marketCap', label: 'Market Cap', tooltipTitle: 'Marktkapitalisierung', tooltipText: 'Der Gesamtwert aller ausgegebenen Einheiten (Aktien/Coins) an der Börse.' },
                    { field: 'volume24h', label: 'Volumen 24h', tooltipTitle: 'Handelsvolumen 24h', tooltipText: 'Das Handelsvolumen der letzten 24 Stunden in Mio. USD. Wichtiger Maßstab für Top-Regulierung.' },
                    { field: 'dividendYield', label: 'Dividende', tooltipTitle: 'Dividendenrendite', tooltipText: 'Die prozentuale jährliche Gewinnausschüttung bezogen auf den Preis.' },
                    { field: 'debtToEquity', label: 'D/E', tooltipTitle: 'Debt-to-Equity Ratio', tooltipText: 'Der Verschuldungsgrad des Unternehmens. Gibt die finanzielle Hebelwirkung an.' },
                    { field: 'grahamScore', label: 'Graham', tooltipTitle: 'Graham Score', tooltipText: 'Der errechnete Grad der fundamentalen Unterbewertung nach Benjamin Graham.' },
                    { field: 'score', label: 'KI-Score', tooltipTitle: 'Zentraler KI-Score', tooltipText: 'Die Gesamtbewertung des Vermögenswertes von 0 bis 10 durch unser KI-Modell.' }
                  ].map(header => (
                    <th 
                      key={header.field}
                      onClick={() => handleSort(header.field as SortField)}
                      className="px-4 py-3 text-[11px] font-mono tracking-widest uppercase text-white/70 font-bold hover:text-white hover:bg-white/5 cursor-pointer transition-all select-none"
                    >
                      <SimpleTooltip title={header.tooltipTitle} text={header.tooltipText}>
                        <div className="flex items-center gap-1.5">
                          <span>{header.label}</span>
                          <ArrowUpDown size={10} className={sortField === header.field ? 'text-aif-gold-DEFAULT' : 'text-white/20'} />
                        </div>
                      </SimpleTooltip>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-[11px] font-mono tracking-widest uppercase text-white/70 font-bold text-right">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence mode="popLayout">
                  {paginatedAssets.map((asset) => {
                    const isSelected = selectedSymbol === asset.symbol;
                    const changeIsPositive = asset.change24h >= 0;

                    return (
                      <motion.tr 
                        key={asset.symbol}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`transition-all ${isSelected ? 'bg-aif-gold-DEFAULT/5' : 'hover:bg-white/[0.02]'}`}
                      >
                        {/* Symbol */}
                        <td className="px-4 py-3.5 font-mono text-xs font-black text-white">
                          <div className="flex items-center gap-2">
                            <AssetLogo symbol={asset.symbol} size="sm" className="shrink-0" />
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase">
                              {asset.symbol}
                            </span>
                          </div>
                        </td>

                        {/* Name & Type */}
                        <td className="px-4 py-3.5">
                          <div className="text-xs font-bold text-white max-w-[120px] truncate" title={asset.name}>
                            {asset.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <span className="text-[11px] text-white/70 font-mono uppercase tracking-wider">
                              {asset.type === 'stock' ? 'Aktie' : asset.type === 'crypto' ? 'Krypto' : asset.type === 'commodity' ? 'Rohstoff' : 'Forex'}
                            </span>
                            {asset.applicationArea && (
                              <span className="px-1.5 py-0.5 rounded text-[11px] uppercase font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                {asset.applicationArea}
                              </span>
                            )}
                            {asset.pattern && (
                              <span className="px-1.5 py-0.5 rounded text-[11px] uppercase font-mono font-bold bg-white/5 text-white/80 border border-white/20 tracking-wide">
                                {asset.pattern}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3.5 font-mono text-xs text-white">
                          €{asset.price < 10 ? asset.price.toLocaleString('de-DE', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) : asset.price.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* 24h Change */}
                        <td className={`px-4 py-3.5 font-mono text-xs font-bold ${changeIsPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          <div className="flex items-center gap-1">
                            {changeIsPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            <span>{changeIsPositive ? '+' : ''}{asset.change24h.toFixed(2)}%</span>
                          </div>
                        </td>

                        {/* P/E Ratio */}
                        <td className="px-4 py-3.5 font-mono text-xs text-blue-300">
                          {asset.peRatio !== undefined ? asset.peRatio.toFixed(1) : '-'}
                        </td>

                        {/* Market Cap */}
                        <td className="px-4 py-3.5 font-mono text-xs text-purple-300">
                          {asset.marketCap !== undefined ? `${asset.marketCap.toFixed(1)}B` : '-'}
                        </td>

                        {/* Volume 24h */}
                        <td className="px-4 py-3.5 font-mono text-xs text-amber-300">
                          {asset.volume24h !== undefined ? `${asset.volume24h.toLocaleString('de-DE', { maximumFractionDigits: 1 })}M` : '-'}
                        </td>

                        {/* Dividend Yield */}
                        <td className="px-4 py-3.5 font-mono text-xs text-emerald-300">
                          {asset.dividendYield !== undefined && asset.dividendYield > 0 ? `${asset.dividendYield.toFixed(2)}%` : '-'}
                        </td>

                        {/* Debt-to-Equity */}
                        <td className="px-4 py-3.5 font-mono text-xs text-white/60">
                          {asset.debtToEquity !== undefined ? asset.debtToEquity.toFixed(2) : '-'}
                        </td>

                        {/* Graham Value */}
                        <td className="px-4 py-3.5">
                          {asset.grahamScore > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              {asset.grahamScore.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-white/20 font-mono text-xs">-</span>
                          )}
                        </td>

                        {/* KI-Score */}
                        <td className="px-4 py-3.5 font-mono text-xs font-bold text-aif-gold-DEFAULT">
                          <span className="px-1.5 py-0.5 rounded bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/25">
                            {asset.score.toFixed(1)}
                          </span>
                        </td>

                        {/* Action select button & Price Alert Toggle */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleAlert(asset);
                              }}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                alertIsActive(asset.symbol)
                                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-[0_0_8px_rgba(245,196,83,0.15)] animate-[pulse_2s_infinite]'
                                  : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20'
                              }`}
                              title={alertIsActive(asset.symbol) ? 'Preisalarm aktiv (Klicken zum Löschen)' : 'Preisalarm für dieses Asset einrichten'}
                            >
                              {alertIsActive(asset.symbol) ? (
                                <BellRing size={13} className="text-amber-400 animate-pulse" />
                              ) : (
                                <Bell size={13} className="text-white/40" />
                              )}
                            </button>
                            <button
                              onClick={() => onSelectSymbol(asset.symbol)}
                              className={`px-3 py-1.5 rounded-lg font-mono text-[11px] tracking-widest uppercase transition-all font-black cursor-pointer ${
                                isSelected 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                  : 'bg-aif-gold-DEFAULT text-black hover:brightness-110 shadow-[0_0_10px_rgba(245,196,83,0.2)]'
                              }`}
                            >
                              {isSelected ? 'AKTIV' : 'WÄHLEN'}
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination control footer bar */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center p-4 bg-white/[0.01] border-t border-white/10">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 bg-white/5 border border-white/10 text-xs font-mono py-1 px-3 rounded-lg text-white/60 hover:text-white disabled:opacity-30 disabled:hover:text-white/60 transition-all cursor-pointer"
            >
              <ChevronLeft size={14} />
              <span>Zurück</span>
            </button>

            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono flex items-center justify-center transition-all cursor-pointer ${
                      currentPage === pageNum 
                        ? 'bg-aif-gold-DEFAULT text-black font-black' 
                        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 bg-white/5 border border-white/10 text-xs font-mono py-1 px-3 rounded-lg text-white/60 hover:text-white disabled:opacity-30 disabled:hover:text-white/60 transition-all cursor-pointer"
            >
              <span>Weiter</span>
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
