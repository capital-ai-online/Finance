import { GovernanceUI } from '../../features';
import { CapitalAiLogo } from '../../shared/branding/CapitalAiLogo';
import type { DashboardView } from './dashboardViews';

export interface DashboardFooterProps {
  onNavigate: (view: DashboardView) => void;
}

/** Shared authenticated footer composition retained during BB-2G cutover. */
export function DashboardFooter({ onNavigate }: DashboardFooterProps) {
  return (
    <>
      <GovernanceUI.SecurityRadarBadge className="mt-12" />
      <footer className="pt-8 pb-12 text-center border-t border-white/10 mt-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-4">
          <GovernanceUI.SystemLatencyMonitor />

          <div className="flex flex-col sm:flex-row items-center gap-3 bg-gradient-to-r from-aif-gold-DEFAULT/10 via-black/40 to-aif-gold-DEFAULT/5 border border-aif-gold-DEFAULT/20 rounded-2xl px-5 py-2.5 backdrop-blur-md shadow-[0_0_25px_rgba(245,196,83,0.08)] mb-4">
            <div className="flex items-center gap-2">
              <CapitalAiLogo size={24} showText={false} />
              <span className="font-display font-black tracking-widest text-sm uppercase text-aif-gold-DEFAULT">Capital-AI</span>
            </div>
            <span className="hidden sm:inline text-white/20">|</span>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-white/80 font-mono tracking-wider uppercase">Sicherheitssiegel</span>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider font-mono uppercase">Zertifiziert</span>
            </div>
          </div>

          <div className="text-xs text-white/60 flex items-center justify-center gap-2 mb-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-aif-gold-DEFAULT animate-pulse" />
            <span>Kundenservice:</span>
            <a href="mailto:support@capital-ai.online" className="text-aif-gold-DEFAULT hover:text-aif-gold-light hover:underline font-bold transition-all">support@capital-ai.online</a>
          </div>

          <p className="text-xs text-white/70 leading-relaxed max-w-2xl">
            ⚠️ Keine Anlageberatung. Capital-AI zeigt ausschließlich quantitative Berechnungsmodelle und sentimentbasierte Live-Informationen – die Anlageentscheidung trifft immer der Nutzer selbst. Kapitalverlust ist möglich. MiFID II konforme Datenanalyse-Software.
          </p>

          <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/20 to-black/50 border border-violet-500/20 max-w-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_25px_rgba(139,92,246,0.05)] mt-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-violet-300 font-mono">Kraken Pro Partner-Bonus</span>
              </div>
              <p className="text-xs text-white/80 leading-relaxed">
                Melde dich über meinen Link unten oder mit meinem Empfehlungscode <code className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-aif-gold-DEFAULT font-mono font-bold select-all">yc4ggk3f</code> bei Kraken Pro an, dann können wir beide Prämien verdienen.
              </p>
            </div>
            <a
              href="https://proinvite.kraken.com/9f1e/5bq7c9cn"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span>Kraken Pro</span>
              <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-xs">↗</span>
            </a>
          </div>

          <p className="text-[11px] font-mono text-white/60 uppercase tracking-widest mt-3">
            Strikte No-Demo-Data-Policy: Keine Interpolation unvollständiger Datenreihen.
          </p>

          <div className="w-full max-w-4xl border-t border-white/5 mt-6 pt-4 flex flex-col items-center gap-4">
            <div className="w-full max-w-md bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2.5 text-xs text-amber-200/80 font-mono tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.03)]">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span>Diese Webseite befindet sich aktuell im Aufbau.</span>
            </div>

            <div className="flex justify-center gap-4 text-[11px] font-mono text-white/40">
              <a href="https://capital-ai.online/datenschutz/" target="_blank" rel="noopener noreferrer" className="hover:text-aif-gold-DEFAULT hover:underline transition-colors cursor-pointer">Datenschutz</a>
              <span>•</span>
              <a href="https://capital-ai.online/impressum" target="_blank" rel="noopener noreferrer" className="hover:text-aif-gold-DEFAULT hover:underline transition-colors cursor-pointer">Impressum</a>
              <span>•</span>
              <a href="https://capital-ai.online/agb/" target="_blank" rel="noopener noreferrer" className="hover:text-aif-gold-DEFAULT hover:underline transition-colors cursor-pointer">AGB</a>
              <span>•</span>
              <button onClick={() => onNavigate('abonnements')} className="hover:text-aif-gold-DEFAULT hover:underline transition-colors cursor-pointer">Abonnements</button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
