import React from 'react';
import { motion } from 'motion/react';

interface CapitalAiLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function CapitalAiLogo({ className = '', size = 160, showText = true }: CapitalAiLogoProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {/* 3D Network Node Emblem */}
      <motion.div
        animate={{ scale: [1, 1.03, 1], rotateY: [0, 8, 0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="perspective-1000 select-none cursor-pointer"
        style={{ width: size, height: size }}
      >
        <svg viewBox="0 0 200 180" width="100%" height="100%" className="filter drop-shadow-[0_0_25px_rgba(194,157,83,0.35)]" aria-hidden="true">
          <defs>
            {/* 3D Gold Shading for Spheres */}
            <radialGradient id="gold-sphere-3d" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFF4D0" />
              <stop offset="20%" stopColor="#E5C17C" />
              <stop offset="55%" stopColor="#BD984E" />
              <stop offset="85%" stopColor="#87601B" />
              <stop offset="100%" stopColor="#4A340C" />
            </radialGradient>
            
            {/* Soft Glow for Lines */}
            <filter id="glow-line" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Thin cyan / violet neural background lines */}
          <g strokeOpacity="0.55" strokeWidth="1">
            {/* Purple / Violet lines */}
            <line x1="60" y1="50" x2="140" y2="133" stroke="#A78BFA" filter="url(#glow-line)" />
            <line x1="140" y1="48" x2="60" y2="135" stroke="#8B5CF6" />
            <line x1="140" y1="48" x2="78" y2="93" stroke="#A78BFA" />
            <line x1="65" y1="85" x2="140" y2="133" stroke="#8B5CF6" />
            
            {/* Cyan / Blue lines */}
            <line x1="60" y1="50" x2="140" y2="48" stroke="#06B6D4" />
            <line x1="60" y1="135" x2="142" y2="90" stroke="#22D3EE" filter="url(#glow-line)" />
            <line x1="100" y1="145" x2="65" y2="85" stroke="#22D3EE" />
            <line x1="105" y1="55" x2="65" y2="85" stroke="#06B6D4" />
            <line x1="65" y1="85" x2="142" y2="90" stroke="#06B6D4" />
            <line x1="100" y1="100" x2="60" y2="50" stroke="#22D3EE" />
          </g>

          {/* Golden Core framework connections (thicker) */}
          <g stroke="#C29D53" strokeWidth="2.5" strokeOpacity="0.85">
            <line x1="60" y1="50" x2="78" y2="93" />
            <line x1="78" y1="93" x2="60" y2="135" />
            <line x1="60" y1="135" x2="100" y2="145" />
            <line x1="100" y1="145" x2="140" y2="133" />
            <line x1="140" y1="133" x2="142" y2="90" />
            <line x1="142" y1="90" x2="140" y2="48" />
            <line x1="140" y1="48" x2="105" y2="55" />
            <line x1="105" y1="55" x2="100" y2="100" />
            <line x1="100" y1="100" x2="100" y2="145" />
            <line x1="100" y1="100" x2="78" y2="93" />
            <line x1="100" y1="100" x2="142" y2="90" />
          </g>

          {/* 3D Golden spheres overlaid on the vertices */}
          <g>
            {/* Center large sphere */}
            <circle cx="100" cy="100" r="11" fill="url(#gold-sphere-3d)" />

            {/* Vertices spheres with proportional sizes matching original */}
            <circle cx="60" cy="50" r="6.5" fill="url(#gold-sphere-3d)" />
            <circle cx="105" cy="55" r="4.5" fill="url(#gold-sphere-3d)" />
            <circle cx="140" cy="48" r="7" fill="url(#gold-sphere-3d)" />
            
            <circle cx="65" cy="85" r="4.5" fill="url(#gold-sphere-3d)" />
            <circle cx="78" cy="93" r="5" fill="url(#gold-sphere-3d)" />
            <circle cx="142" cy="90" r="6" fill="url(#gold-sphere-3d)" />
            
            <circle cx="60" cy="135" r="7.5" fill="url(#gold-sphere-3d)" />
            <circle cx="100" cy="145" r="5.5" fill="url(#gold-sphere-3d)" />
            <circle cx="140" cy="133" r="8" fill="url(#gold-sphere-3d)" />
          </g>
        </svg>
      </motion.div>

      {showText && (
        <div className="mt-4 flex flex-col items-center">
          {/* Logo brand title with wide letter spacing */}
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#F0D597] via-[#D4A017] to-[#F0D597] tracking-[0.1em] font-display uppercase mr-[-0.1em]">
            CAPITAL-AI
          </h1>
          {/* Subtitle brand module info */}
          <p className="text-[10px] text-white/50 font-mono tracking-[0.3em] uppercase mt-1.5 mr-[-0.3em]">
            CORE
          </p>
        </div>
      )}
    </div>
  );
}
