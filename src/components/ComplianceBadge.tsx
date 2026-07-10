import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface ComplianceBadgeProps {
  adr: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  isActive?: boolean;
}

export function ComplianceBadge({ adr, title, description, placement = 'top', className = '', isActive = false }: ComplianceBadgeProps) {
  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#E5C17C]/30 border-x-transparent border-b-transparent -mt-[1px]',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#E5C17C]/30 border-x-transparent border-t-transparent -mb-[1px]',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#E5C17C]/30 border-y-transparent border-r-transparent -ml-[1px]',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#E5C17C]/30 border-y-transparent border-l-transparent -mr-[1px]',
  };

  const badgeStyles = isActive
    ? 'bg-black/80 hover:bg-black text-aif-gold-DEFAULT border-black/20 hover:border-black/40 shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
    : 'bg-aif-gold-DEFAULT/15 hover:bg-aif-gold-DEFAULT/25 text-aif-gold-DEFAULT border-aif-gold-DEFAULT/30 hover:border-aif-gold-DEFAULT/50 shadow-[0_0_8px_rgba(245,196,83,0.05)]';

  const iconColor = isActive ? 'text-aif-gold-DEFAULT' : 'text-aif-gold-DEFAULT';

  return (
    <div className={`relative group inline-block z-40 ${className}`}>
      <span className={`cursor-help text-[9px] font-mono font-extrabold tracking-wider px-2 py-0.5 rounded border transition-all flex items-center gap-1 select-none ${badgeStyles}`}>
        <ShieldCheck size={10} className={`${iconColor} shrink-0`} />
        <span className="font-mono">{adr}</span>
      </span>
      
      {/* Tooltip Card */}
      <div className={`absolute ${placementClasses[placement]} hidden group-hover:block w-72 bg-[#121215] border border-aif-gold-DEFAULT/30 text-white rounded-xl p-3.5 shadow-[0_4px_25px_rgba(0,0,0,0.8),0_0_15px_rgba(245,196,83,0.1)] backdrop-blur-xl pointer-events-none transition-all duration-200`}>
        <div className="space-y-2 relative z-50">
          <div className="flex items-center gap-1.5 border-b border-white/5 pb-1.5">
            <ShieldCheck size={12} className="text-aif-gold-DEFAULT" />
            <p className="text-[9px] font-mono font-black uppercase tracking-widest text-aif-gold-DEFAULT">
              Audit &amp; Compliance Verified
            </p>
          </div>
          
          <div className="space-y-1 text-left">
            <p className="text-[11px] font-black font-display text-white leading-snug">{title}</p>
            <p className="text-[10px] leading-relaxed text-white/70 font-sans">{description}</p>
          </div>
          
          <div className="flex justify-between items-center text-[8px] font-mono text-white/40 pt-1.5 border-t border-white/5">
            <span>DOC REF: {adr}</span>
            <span className="text-aif-gold-DEFAULT/80 font-bold uppercase tracking-wider">Verifizierbare Logik</span>
          </div>
        </div>
        
        {/* Simple arrow indicator */}
        <div className={`absolute border-4 ${arrowClasses[placement]} w-0 h-0 pointer-events-none`} />
      </div>
    </div>
  );
}
