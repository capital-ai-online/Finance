import React, { useState } from 'react';
import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MARKET_ASSETS } from '../data/mockData';
import { MarketAsset, MainCategory } from '../types';
import { AssetLogo } from '../../runtime/AssetLogo';

interface MarketOverviewProps {
  onSelectAsset: (asset: MarketAsset) => void;
  onViewAllMarkets: () => void;
}

type CategoryFilter = 'ALLE' | MainCategory;

const CATEGORIES: { id: CategoryFilter; label: string; color: string }[] = [
  { id: 'ALLE', label: 'Alle Märkte', color: '#F9BF21' },
  { id: 'KRYPTO', label: 'Krypto', color: '#F9BF21' },
  { id: 'AKTIEN', label: 'Aktien', color: '#44DE88' },
  { id: 'INDIZIES', label: 'Indizies', color: '#8D26FF' },
  { id: 'FOREX', label: 'Forex', color: '#E879F9' },
  { id: 'ROHSTOFFE', label: 'Rohstoffe', color: '#F9BF21' },
];

export const MarketOverview: React.FC<MarketOverviewProps> = ({ onSelectAsset, onViewAllMarkets }) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('ALLE');

  const filteredAssets = selectedCategory === 'ALLE'
    ? MARKET_ASSETS
    : MARKET_ASSETS.filter((asset) => asset.mainCategory === selectedCategory);

  const getCategoryColor = (cat: MainCategory) => {
    switch (cat) {
      case 'KRYPTO':
        return '#F9BF21';
      case 'AKTIEN':
        return '#44DE88';
      case 'INDIZIES':
        return '#8D26FF';
      case 'FOREX':
        return '#E879F9';
      case 'ROHSTOFFE':
        return '#F9BF21';
      default:
        return '#F9BF21';
    }
  };


  return (
    <section className="px-5 py-4">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <h2 className="text-[17.5px] font-bold text-white tracking-tight">
            Globale Märkte im Überblick
          </h2>
          <p className="text-[11px] text-slate-400">
            Komplettes Asset Universum: Krypto, Aktien, Indizies, Forex & Rohstoffe
          </p>
        </div>
        <button
          type="button"
          onClick={onViewAllMarkets}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#F9BF21] hover:text-amber-300 transition-colors shrink-0 cursor-pointer"
        >
          <span>Alle ({MARKET_ASSETS.length})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category Pills (KRYPTO, AKTIEN, INDIZIES, FOREX, ROHSTOFFE) */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2 -mx-5 px-5 snap-x">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          const count = cat.id === 'ALLE'
            ? MARKET_ASSETS.length
            : MARKET_ASSETS.filter((a) => a.mainCategory === cat.id).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`snap-start shrink-0 px-3 py-1.5 rounded-xl text-[11.5px] font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isActive
                  ? 'bg-slate-800/90 text-white shadow-md'
                  : 'bg-[#060c1d]/80 text-slate-400 hover:text-white hover:bg-slate-800/50 border-slate-800/80'
              }`}
              style={{
                borderColor: isActive ? `${cat.color}70` : undefined,
                boxShadow: isActive ? `0 0 12px ${cat.color}25` : undefined,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                  isActive ? 'bg-white/10 text-white' : 'text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Market Cards Container (Horizontal scrolling with touch snap) */}
      <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-2 pt-1 -mx-5 px-5 snap-x snap-mandatory">
        <AnimatePresence mode="popLayout">
          {filteredAssets.map((asset) => {
            const catColor = getCategoryColor(asset.mainCategory);

            return (
              <motion.div
                key={asset.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectAsset(asset)}
                className="snap-start shrink-0 w-[150px] sm:w-[165px] rounded-2xl bg-[#060c1d] border border-slate-800/90 relative overflow-hidden p-3 flex flex-col justify-between cursor-pointer transition-all duration-200 hover:border-slate-700 shadow-[0_4px_16px_rgba(0,0,0,0.4)] group"
                style={{
                  boxShadow: `0 8px 20px -8px ${asset.glowColor}`,
                }}
              >
                {/* Category & owner-correct data authority */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[9.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border font-mono"
                    style={{
                      color: catColor,
                      backgroundColor: `${catColor}12`,
                      borderColor: `${catColor}35`,
                    }}
                  >
                    {asset.mainCategory}
                  </span>
                  <span
                    className="text-[9px] font-mono text-slate-500 bg-slate-800/50 px-1.5 py-0.5 rounded"
                    data-local-scoring="disabled"
                  >
                    FINTECH
                  </span>
                </div>

                {/* Name & Icon */}
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <AssetLogo asset={asset} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[12.5px] font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                        {asset.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {asset.symbol}
                      </div>
                    </div>
                  </div>

                  {/* Value & Percentage */}
                  <div className="text-[15px] font-bold text-white tracking-tight leading-snug font-mono mt-1">
                    {asset.value}
                  </div>
                  <div
                    className={`text-[11px] font-bold leading-tight mt-0.5 flex items-center gap-0.5 ${
                      asset.isPositive ? 'text-[#44DE88]' : 'text-[#F87171]'
                    }`}
                  >
                    {asset.isPositive ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    <span>{asset.change}</span>
                  </div>
                </div>

                {/* Sparkline Neon Graph & Subtle bottom neon border */}
                <div className="relative h-9 w-full mt-2.5 overflow-hidden flex items-end">
                  <svg
                    viewBox="0 0 200 45"
                    className="w-full h-8 overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <filter id={`glow-${asset.id}`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                      </filter>
                      <linearGradient id={`grad-${asset.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={asset.waveColor} stopOpacity="0.28" />
                        <stop offset="100%" stopColor={asset.waveColor} stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Area Fill */}
                    <path
                      d={`${asset.sparklinePath} L 200,45 L 0,45 Z`}
                      fill={`url(#grad-${asset.id})`}
                    />

                    {/* Neon Stroke */}
                    <path
                      d={asset.sparklinePath}
                      fill="none"
                      stroke={asset.waveColor}
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      filter={`url(#glow-${asset.id})`}
                    />
                  </svg>
                </div>

                {/* Bottom glowing accent edge */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] opacity-75"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${asset.waveColor} 50%, transparent 100%)`,
                  }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
};
