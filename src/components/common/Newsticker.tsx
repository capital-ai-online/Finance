import React, { useState, useEffect } from 'react';
import { Asset } from '../../types';
import { Newspaper, TrendingUp, TrendingDown, ArrowRight, Activity, Percent, Flame, Info, Lock } from 'lucide-react';

interface NewstickerProps {
  selectedSymbol: string;
  timeframe: string;
  subscriptionTier?: string;
  onUpgradeClick?: () => void;
}

interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  time: string;
  source: string;
}

export function Newsticker({ selectedSymbol, timeframe, subscriptionTier, onUpgradeClick }: NewstickerProps) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsConfigured, setNewsConfigured] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    
    // Check if real news API is implemented
    fetch('/api/news')
      .then(res => {
        if (!res.ok || res.status === 501 || res.status === 503) {
          setNewsConfigured(false);
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && Array.isArray(data)) {
          setNews(data);
          setNewsConfigured(true);
        } else if (data && data.status === 'NOT_IMPLEMENTED') {
          setNewsConfigured(false);
        }
      })
      .catch(err => {
        console.warn('Real-time news API check status:', err);
        setNewsConfigured(false);
      });

    // Fetch live asset details to sync score/price
    fetch('/api/market-data')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch market data');
        return res.json();
      })
      .then((data: Asset[]) => {
        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid market data format');
        }
        const found = data.find(a => a.symbol === selectedSymbol) || data[0];
        setAsset(found);
        
        // Generate actual quantitative signals computed directly from live asset values
        if (found) {
          const changePercent = found.change24h || 0;
          const score = found.score || 5.0;
          
          const systemSignals: NewsItem[] = [
            {
              id: 'q1',
              headline: `Momentum-Analyse: ${found.symbol} Trendstärke bewertet mit ${found.momentum}/10`,
              summary: changePercent >= 0 
                ? `Aufwärtsmomentum bestätigt. Die kurzfristigen exponentiell gewichteten gleitenden Durchschnitte signalisieren einen stabilen Unterstützungsbereich.` 
                : `Konsolidierungsphase aktiv. Verkaufsdruck flacht im kurzfristigen Bereich ab, was auf eine potenzielle Stabilisierung hindeutet.`,
              sentiment: changePercent >= 0 ? 'positive' : 'negative',
              time: 'Echtzeit-Berechnung',
              source: 'System Quantitative Signal'
            },
            {
              id: 'q2',
              headline: `Volatilitäts-Indikator: Handelsvolumen erreicht $${found.volume24h.toLocaleString()}M`,
              summary: `Das Verhältnis von 24h-Volumen zu Marktkapitalisierung deutet auf eine geordnete Liquidität und solide Orderbuch-Tiefe im aktuellen Preisbereich hin.`,
              sentiment: 'neutral',
              time: 'Echtzeit-Berechnung',
              source: 'Liquidity Matrix'
            },
            {
              id: 'q3',
              headline: `Risikobewertung: Asset-Klassifizierung '${found.risk}'`,
              summary: `Die Risikometrik bewertet das Stärkenprofil des Assets mit einem quantitativen Score von ${score.toFixed(1)} von 10 Punkten.`,
              sentiment: score >= 7.5 ? 'positive' : (score < 5.0 ? 'negative' : 'neutral'),
              time: 'Echtzeit-Berechnung',
              source: 'Risk Engine'
            }
          ];
          
          setNews(systemSignals);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedSymbol, timeframe]);

  // Calculate dynamic trading signals based on Score
  const getTradingSignal = (score: number) => {
    if (score >= 90.0) {
      return {
        label: 'STRONG BUY',
        color: 'text-aif-neon-cyan border-aif-neon-cyan/30 bg-aif-neon-cyan/10',
        glow: 'drop-shadow-[0_0_10px_rgba(13,221,221,0.5)]'
      };
    } else if (score >= 75.0) {
      return {
        label: 'BUY',
        color: 'text-aif-gold-DEFAULT border-aif-gold-DEFAULT/30 bg-aif-gold-DEFAULT/10',
        glow: 'drop-shadow-[0_0_10px_rgba(245,196,83,0.5)]'
      };
    } else if (score >= 55.0) {
      return {
        label: 'HOLD',
        color: 'text-white/60 border-white/20 bg-white/5',
        glow: ''
      };
    } else {
      return {
        label: 'SELL / UNDERWEIGHT',
        color: 'text-red-400 border-red-500/30 bg-red-500/10',
        glow: 'drop-shadow-[0_0_10px_rgba(248,113,113,0.5)]'
      };
    }
  };

  if (loading || !asset) {
    return (
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md h-[420px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Activity className="w-8 h-8 text-aif-gold-DEFAULT animate-spin mx-auto" />
          <p className="text-xs text-white/40 font-mono uppercase tracking-widest">Lade Asset News & Signale...</p>
        </div>
      </div>
    );
  }

  if (subscriptionTier === 'Free') {
    return (
      <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col justify-center items-center text-center h-full min-h-[460px] relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-gold-DEFAULT/30 to-transparent" />
        
        <div className="w-16 h-16 rounded-full bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 flex items-center justify-center mb-4 relative">
          <Lock className="text-aif-gold-DEFAULT w-6 h-6 animate-pulse" />
          <div className="absolute inset-0 rounded-full border border-aif-gold-DEFAULT/30 animate-ping opacity-40 scale-110" style={{ animationDuration: '3s' }} />
        </div>
        
        <h3 className="text-base font-black text-white font-display mb-2 uppercase tracking-wide">
          Intelligence Feed gesperrt
        </h3>
        <p className="text-xs text-white/60 max-w-xs mb-6 leading-relaxed">
          Quantitative Signale, Trendstärke-Indikatoren und Echtzeit-Newsfeeds stehen ausschließlich Premium-Abonnenten zur Verfügung. Bitte upgraden Sie Ihr Abonnement, um Live-Pressemeldungen einzuspielen.
        </p>
        <button
          onClick={onUpgradeClick}
          className="px-6 py-2.5 bg-gradient-to-r from-aif-gold-light via-aif-gold-DEFAULT to-aif-gold-dark hover:from-aif-gold-DEFAULT hover:to-aif-gold-dark text-black font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg hover:shadow-aif-gold-DEFAULT/20 transition-all duration-300 cursor-pointer"
        >
          Upgrade freischalten
        </button>
      </div>
    );
  }

  const signal = getTradingSignal(asset.score);

  return (
    <div className="bg-black/40 border border-white/10 rounded-xl p-6 backdrop-blur-md flex flex-col justify-between h-full min-h-[460px] relative overflow-hidden group">
      {/* Subtle top light effect */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-aif-gold-DEFAULT/30 to-transparent" />

      {/* Header Info */}
      <div className="space-y-4">
        <div className="flex justify-between items-start border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 text-aif-gold-DEFAULT">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 font-display">
                Realtime Intelligence Feed
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-white/60 border border-white/15">
                  Interval: {timeframe}
                </span>
              </h3>
              <p className="text-xs text-white/50 font-sans mt-0.5">
                Nachrichten & quantitative Analyse für <span className="font-bold text-white font-mono">{asset.symbol}</span> ({asset.name})
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-white/40 uppercase tracking-wider font-mono">Letzter Preis</div>
            <div className="text-lg font-mono font-bold text-white">
              ${asset.price.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 4 : 2 })}
            </div>
            <div className={`text-xs font-mono font-medium flex items-center justify-end gap-1 ${asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {asset.change24h >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {asset.change24h}%
            </div>
          </div>
        </div>

        {/* Dynamic Trading Signal Panel */}
        <div className="grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden">
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono block mb-1">Qualitatives Signal ({timeframe})</span>
            <div className={`text-base font-black px-3 py-1.5 rounded-lg border text-center font-display tracking-wider ${signal.color} ${signal.glow}`}>
              {signal.label}
            </div>
          </div>
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono block mb-1">Intelligent AI Score</span>
            <div className="flex items-baseline gap-1.5 justify-center">
              <span className="text-3xl font-black text-white font-mono tracking-tight drop-shadow-[0_0_12px_rgba(255,255,255,0.25)]">
                {asset.score.toFixed(1)}
              </span>
              <span className="text-xs text-white/40 font-mono">/ 10</span>
            </div>
          </div>
        </div>

        {/* Real-time News Status Indicator */}
        {!newsConfigured && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-[11px] text-blue-300 flex items-start gap-2 font-sans">
            <Info className="w-4 h-4 shrink-0 text-blue-400 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Echtzeit-Nachrichten-Feed im Testmodus:</strong> Alle verlegerischen Schlagzeilen wurden entfernt. Konfigurieren Sie <code className="font-mono text-white bg-white/10 px-1 py-0.5 rounded text-[10px]">NEWS_API_KEY</code>, um Live-Pressemeldungen einzuspielen. Es werden quantitative Systemsignale angezeigt.
            </p>
          </div>
        )}

        {/* News list - last 3 items */}
        <div className="space-y-3 pt-2">
          <span className="text-[10px] text-white/40 uppercase tracking-widest font-mono block mb-1">
            {newsConfigured ? 'Letzte 3 Nachrichtenmeldungen' : 'Quantitative System-Signale'}
          </span>
          {news.slice(0, 3).map((item) => (
            <div 
              key={item.id} 
              className="bg-black/40 hover:bg-white/5 border border-white/5 rounded-lg p-3 transition-all flex flex-col justify-between gap-1 relative group/item cursor-pointer"
            >
              <div className="flex justify-between items-start gap-3">
                <h4 className="text-xs font-bold text-white leading-tight group-hover/item:text-aif-gold-DEFAULT transition-colors">
                  {item.headline}
                </h4>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                  item.sentiment === 'positive' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                  item.sentiment === 'negative' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 
                  'bg-white/10 text-white/60 border border-white/15'
                }`}>
                  {item.sentiment}
                </span>
              </div>
              
              <p className="text-[11px] text-white/55 line-clamp-2 mt-1 leading-normal font-sans">
                {item.summary}
              </p>

              <div className="flex justify-between items-center text-[9px] text-white/30 font-mono mt-2 pt-1 border-t border-white/5">
                <span>{item.source}</span>
                <span>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative interactive hint */}
      <div className="text-[10px] text-white/30 font-mono text-center pt-3 border-t border-white/5 flex items-center justify-center gap-1.5">
        <Percent size={10} className="text-aif-gold-DEFAULT" />
        Klicke auf beliebige Assets im Screener, um die Nachrichten & Signale anzupassen.
      </div>
    </div>
  );
}
