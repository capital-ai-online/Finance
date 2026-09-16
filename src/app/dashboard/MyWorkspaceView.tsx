import {
  ArrowUpRight,
  BarChart3,
  Eye,
  FolderKanban,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { PortfolioUI } from '../../features';
import type { DashboardView } from './dashboardViews';

export interface MyWorkspaceViewProps {
  watchlist: string[];
  selectedSymbol: string;
  onAddWatchlistSymbol: (symbol: string) => void;
  onRemoveWatchlistSymbol: (symbol: string) => void;
  onSelectSymbol: (symbol: string) => void;
  onNavigate: (view: DashboardView) => void;
  onSimulateScoreEvent: (symbol: string, type: 'crash' | 'rally') => void;
}

/**
 * BB-2G app-owned composition for MyWorkspace.
 *
 * Watchlist state and navigation remain controlled by the parent composition;
 * this view only projects those contracts through the existing feature facade.
 */
export function MyWorkspaceView({
  watchlist,
  selectedSymbol,
  onAddWatchlistSymbol,
  onRemoveWatchlistSymbol,
  onSelectSymbol,
  onNavigate,
  onSimulateScoreEvent,
}: MyWorkspaceViewProps) {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-black/80 via-black/60 to-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/30 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-aif-gold-DEFAULT/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/30 rounded-2xl text-aif-gold-DEFAULT shadow-[0_0_20px_rgba(245,196,83,0.15)]">
              <FolderKanban size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 px-2.5 py-0.5 rounded-full">
                  Persönlicher Arbeitsbereich
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Radar-Engine Aktiv
                </span>
              </div>
              <h2 className="text-2xl font-black text-white font-display mt-1">Myworkspace</h2>
              <p className="text-xs text-white/60 max-w-2xl mt-0.5">
                Dein persönliches Radar-Cockpit für benutzerdefinierte Asset-Überwachung, Scoring-Aktionen und selektive Markt-Transparenz.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('market-screener')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2"
            >
              <SlidersHorizontal size={14} className="text-aif-gold-DEFAULT" />
              <span>Assets suchen</span>
            </button>
            <button
              onClick={() => onNavigate('charts')}
              className="px-4 py-2 bg-aif-gold-DEFAULT text-black font-black rounded-xl text-xs uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(245,196,83,0.25)]"
            >
              <BarChart3 size={14} />
              <span>Chart Analyse</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-full">
          <PortfolioUI.Watchlist
            watchlist={watchlist}
            onRemove={onRemoveWatchlistSymbol}
            onAdd={onAddWatchlistSymbol}
            onSelectAsset={onSelectSymbol}
            selectedSymbol={selectedSymbol}
            onSimulateScoreEvent={onSimulateScoreEvent}
          />
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div className="bg-black/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Eye size={16} className="text-aif-gold-DEFAULT" />
                <h4 className="text-sm font-bold text-white font-display">Radar Telemetrie</h4>
              </div>
              <span className="text-[10px] font-mono text-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 px-2 py-0.5 rounded-full border border-aif-gold-DEFAULT/20">
                PRO-LEVEL
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                <span className="text-xs text-white/60">Überwachte Assets:</span>
                <span className="text-xs font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded-md">{watchlist.length} Assets</span>
              </div>
              <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                <span className="text-xs text-white/60">Fokus-Asset:</span>
                <span className="text-xs font-mono font-bold text-aif-gold-DEFAULT bg-aif-gold-DEFAULT/10 border border-aif-gold-DEFAULT/20 px-2 py-0.5 rounded-md">
                  {selectedSymbol || 'BTC-USD'}
                </span>
              </div>
              <div className="p-3 bg-white/[0.03] border border-white/5 rounded-xl flex items-center justify-between">
                <span className="text-xs text-white/60">Benachrichtigungen:</span>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                  Echtzeit Live
                </span>
              </div>
            </div>

            <div className="pt-2">
              <p className="text-[11px] text-white/40 leading-relaxed">
                Assets auf Deinem persönlichen Radar werden kontinuierlich vom CAPITAL-AI Multi-Modell Router bezüglich Sentiment, Liquidität und Scoring-Veränderungen überwacht.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-black/60 to-purple-950/20 border border-purple-500/20 rounded-2xl p-5 backdrop-blur-md space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <Sparkles size={14} />
              Workspace Schnellzugriff
            </h4>
            <p className="text-xs text-white/60">Nutze die KI-Funktionen für vertiefte Analysen Deines persönlichen Radars:</p>
            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => onNavigate('sentiment-dashboard')}
                className="w-full text-left p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white transition-all flex items-center justify-between group"
              >
                <span>AI Sentiment Cockpit öffnen</span>
                <ArrowUpRight size={14} className="text-white/40 group-hover:text-aif-gold-DEFAULT group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('risiko-assessment')}
                className="w-full text-left p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-medium text-white transition-all flex items-center justify-between group"
              >
                <span>Value-at-Risk Assessment</span>
                <ArrowUpRight size={14} className="text-white/40 group-hover:text-aif-gold-DEFAULT group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
