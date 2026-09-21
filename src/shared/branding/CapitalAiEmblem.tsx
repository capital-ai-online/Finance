import React from 'react';

/**
 * Pure SVG Vector Emblem: Capital-AI Cyber-Earth & Planetary Neural Grid
 * Sophisticated FinTech design with 4 distinct market hub accents:
 * 1. AIF Gold (var(--color-brand-primary)) – Planetary Capital & Primary Hub
 * 2. Emerald Green (var(--color-brand-success)) – Market Performance & Live Telemetry
 * 3. AI Magenta (var(--color-asset-forex)) – High-Frequency Quantitative Intelligence
 * 4. Deep Royal Purple (var(--color-brand-accent)) – Global Neural Grid
 */
export const CapitalAiEmblem: React.FC<{
  sizeClass?: string;
  className?: string;
}> = ({ sizeClass = 'w-10 h-10', className = '' }) => {
  return (
    <div data-logo-source="SvenKulessa/FRONTEND" data-logo-source-commit="f2a101330d74420c373f0ec56fa58caac53d741d" className={`relative ${sizeClass} flex items-center justify-center shrink-0 select-none ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          {/* Earth 3D Sphere Shading: Deep Cosmic Space to Illuminated Rim */}
          <radialGradient id="globeSphereGrad" cx="36%" cy="30%" r="70%">
            <stop offset="0%" stopColor="var(--color-surface)" />
            <stop offset="35%" stopColor="var(--color-surface)" />
            <stop offset="70%" stopColor="var(--color-background)" />
            <stop offset="100%" stopColor="var(--color-background)" />
          </radialGradient>

          {/* Atmosphere Rim Luminescence (Gold + Emerald + Magenta + Purple) */}
          <linearGradient id="atmosphereRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-brand-primary)" stopOpacity="0.95" />
            <stop offset="32%" stopColor="var(--color-brand-success)" stopOpacity="0.85" />
            <stop offset="68%" stopColor="var(--color-asset-forex)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--color-brand-accent)" stopOpacity="0.9" />
          </linearGradient>

          {/* Orbital Ring Back Gradient (Behind the Earth) */}
          <linearGradient id="orbitalRingGradBack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand-success)" stopOpacity="0.3" />
            <stop offset="35%" stopColor="var(--color-brand-primary)" stopOpacity="0.4" />
            <stop offset="70%" stopColor="var(--color-asset-forex)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-brand-accent)" stopOpacity="0.3" />
          </linearGradient>

          {/* Orbital Ring Front Gradient (Luminous 4-Color Ribbon in Front of Earth) */}
          <linearGradient id="orbitalRingGradFront" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand-accent)" stopOpacity="0.95" />
            <stop offset="30%" stopColor="var(--color-asset-forex)" stopOpacity="1" />
            <stop offset="65%" stopColor="var(--color-brand-primary)" stopOpacity="1" />
            <stop offset="100%" stopColor="var(--color-brand-success)" stopOpacity="0.95" />
          </linearGradient>

          {/* Inner Secondary Orbital Ring Gradient */}
          <linearGradient id="orbitalRingSubGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand-accent)" stopOpacity="0.8" />
            <stop offset="33%" stopColor="var(--color-asset-forex)" stopOpacity="0.9" />
            <stop offset="66%" stopColor="var(--color-brand-primary)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--color-brand-success)" stopOpacity="0.8" />
          </linearGradient>

          {/* Node 1: AIF Gold Shading (var(--color-brand-primary)) */}
          <radialGradient id="nodeGoldGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="var(--color-foreground)" />
            <stop offset="30%" stopColor="var(--color-brand-primary)" />
            <stop offset="70%" stopColor="var(--color-brand-primary)" />
            <stop offset="100%" stopColor="var(--color-brand-primary)" />
          </radialGradient>

          {/* Node 2: Emerald Green Shading (var(--color-brand-success)) */}
          <radialGradient id="nodeEmeraldGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="var(--color-foreground)" />
            <stop offset="25%" stopColor="var(--color-brand-success)" />
            <stop offset="65%" stopColor="var(--color-brand-success)" />
            <stop offset="100%" stopColor="var(--color-brand-success)" />
          </radialGradient>

          {/* Node 3: AI Magenta Shading (var(--color-asset-forex)) */}
          <radialGradient id="nodeMagentaGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="var(--color-foreground)" />
            <stop offset="25%" stopColor="var(--color-asset-forex)" />
            <stop offset="60%" stopColor="var(--color-asset-forex)" />
            <stop offset="100%" stopColor="var(--color-asset-forex)" />
          </radialGradient>

          {/* Node 4: Royal Purple Shading (var(--color-brand-accent)) */}
          <radialGradient id="nodePurpleGrad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="var(--color-foreground)" />
            <stop offset="25%" stopColor="var(--color-brand-accent)" />
            <stop offset="60%" stopColor="var(--color-brand-accent)" />
            <stop offset="100%" stopColor="var(--color-brand-accent)" />
          </radialGradient>

          {/* Great-Circle Interconnecting Arcs */}
          <linearGradient id="arcGoldEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand-primary)" />
            <stop offset="100%" stopColor="var(--color-brand-success)" />
          </linearGradient>

          <linearGradient id="arcEmeraldMagenta" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand-success)" />
            <stop offset="100%" stopColor="var(--color-asset-forex)" />
          </linearGradient>

          <linearGradient id="arcMagentaPurple" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-asset-forex)" />
            <stop offset="100%" stopColor="var(--color-brand-accent)" />
          </linearGradient>

          <linearGradient id="arcPurpleGold" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-brand-accent)" />
            <stop offset="100%" stopColor="var(--color-brand-primary)" />
          </linearGradient>

          {/* Glow Filters */}
          <filter id="goldPulse" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="emeraldPulse" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="magentaPulse" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="purplePulse" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="ringGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="earthBloom" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4.0" result="blur" />
          </filter>

          {/* Strict Globe Clipping Mask */}
          <clipPath id="globeClip">
            <circle cx="50" cy="50" r="28.5" />
          </clipPath>
        </defs>

        {/* 1. Ambient Cosmic Space Blooms behind the Globe */}
        <circle cx="50" cy="50" r="34" fill="var(--color-brand-accent)" opacity="0.16" filter="url(#earthBloom)" />
        <circle cx="60" cy="42" r="24" fill="var(--color-asset-forex)" opacity="0.16" filter="url(#earthBloom)" />
        <circle cx="44" cy="44" r="26" fill="var(--color-brand-primary)" opacity="0.14" filter="url(#earthBloom)" />
        <circle cx="50" cy="56" r="22" fill="var(--color-brand-success)" opacity="0.12" filter="url(#earthBloom)" />

        {/* 2. Planetary Orbital Ring (BACK HALF – sweeps behind the globe) */}
        <g transform="rotate(-25 50 50)">
          {/* Main outer ring back segment */}
          <path
            d="M 5,50 A 45 13 0 0 1 95,50"
            fill="none"
            stroke="url(#orbitalRingGradBack)"
            strokeWidth="1.6"
            strokeDasharray="4 3"
          />
          {/* Inner satellite sub-rail */}
          <path
            d="M 12,50 A 38 10 0 0 1 88,50"
            fill="none"
            stroke="var(--color-brand-primary)"
            strokeWidth="0.8"
            opacity="0.3"
            strokeDasharray="2 2"
          />
        </g>

        {/* 3. The 3D Earth Globe (Clipped sphere) */}
        <g clipPath="url(#globeClip)">
          {/* Planetary Body Gradient */}
          <circle cx="50" cy="50" r="28.5" fill="url(#globeSphereGrad)" />

          {/* Latitude Parallels (Grid lines curving along the sphere) */}
          <ellipse cx="50" cy="32" rx="22" ry="4.2" fill="none" stroke="var(--color-brand-primary)" strokeWidth="0.6" opacity="0.22" strokeDasharray="2 2" />
          <ellipse cx="50" cy="41" rx="26.5" ry="5.5" fill="none" stroke="var(--color-brand-success)" strokeWidth="0.7" opacity="0.25" strokeDasharray="3 2" />
          <ellipse cx="50" cy="50" rx="28.5" ry="6.8" fill="none" stroke="var(--color-asset-forex)" strokeWidth="0.75" opacity="0.3" />
          <ellipse cx="50" cy="59" rx="26.5" ry="5.5" fill="none" stroke="var(--color-brand-accent)" strokeWidth="0.7" opacity="0.25" strokeDasharray="3 2" />
          <ellipse cx="50" cy="68" rx="22" ry="4.2" fill="none" stroke="var(--color-brand-accent)" strokeWidth="0.6" opacity="0.2" strokeDasharray="2 2" />

          {/* Longitude Meridians (Cybernetic curvature) */}
          <ellipse cx="50" cy="50" rx="9.5" ry="28.5" fill="none" stroke="var(--color-brand-success)" strokeWidth="0.7" opacity="0.3" strokeDasharray="3 2" />
          <ellipse cx="50" cy="50" rx="19" ry="28.5" fill="none" stroke="var(--color-asset-forex)" strokeWidth="0.7" opacity="0.25" strokeDasharray="3 2" />
          <ellipse cx="50" cy="50" rx="28.5" ry="28.5" fill="none" stroke="var(--color-brand-primary)" strokeWidth="0.6" opacity="0.25" />

          {/* Stylized Cybernetic Continents (Americas, Europe/Africa, Asia/Pacific) */}
          {/* Americas (West) */}
          <path
            d="M 27,33 Q 32,30 35,36 Q 34,42 30,44 Q 28,49 32,58 Q 36,66 32,71 Q 28,66 26,58 Q 23,48 24,38 Z"
            fill="var(--color-brand-success)"
            fillOpacity="0.14"
            stroke="var(--color-brand-success)"
            strokeWidth="0.8"
            strokeOpacity="0.75"
          />
          {/* Europe & Africa (Center-East) */}
          <path
            d="M 43,30 Q 52,28 54,34 Q 50,38 46,39 Q 53,44 55,54 Q 53,64 47,67 Q 43,62 44,52 Q 41,43 43,30 Z"
            fill="var(--color-brand-primary)"
            fillOpacity="0.16"
            stroke="var(--color-brand-primary)"
            strokeWidth="0.8"
            strokeOpacity="0.8"
          />
          {/* Asia & Pacific Rim (Far East) */}
          <path
            d="M 62,32 Q 72,30 76,36 Q 74,44 68,46 Q 73,53 74,59 Q 67,56 63,50 Q 59,42 62,32 Z"
            fill="var(--color-asset-forex)"
            fillOpacity="0.15"
            stroke="var(--color-asset-forex)"
            strokeWidth="0.8"
            strokeOpacity="0.8"
          />

          {/* Great-Circle Interconnecting AI Data Arcs linking all 4 hubs */}
          {/* Hub 1 (Gold 30,44) -> Hub 2 (Emerald 48,35) */}
          <path d="M 30,44 Q 39,33 48,35" fill="none" stroke="url(#arcGoldEmerald)" strokeWidth="1.6" strokeLinecap="round" />
          {/* Hub 2 (Emerald 48,35) -> Hub 3 (Magenta 68,38) */}
          <path d="M 48,35 Q 58,31 68,38" fill="none" stroke="url(#arcEmeraldMagenta)" strokeWidth="1.6" strokeLinecap="round" />
          {/* Hub 3 (Magenta 68,38) -> Hub 4 (Purple 54,61) */}
          <path d="M 68,38 Q 63,52 54,61" fill="none" stroke="url(#arcMagentaPurple)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Hub 4 (Purple 54,61) -> Hub 1 (Gold 30,44) */}
          <path d="M 54,61 Q 39,57 30,44" fill="none" stroke="url(#arcPurpleGold)" strokeWidth="1.3" strokeDasharray="3 2" opacity="0.85" />
          {/* Diagonal Cross Connection Europe (Emerald 48,35) to South (Purple 54,61) */}
          <path d="M 48,35 Q 52,47 54,61" fill="none" stroke="var(--color-brand-accent)" strokeWidth="1.1" strokeDasharray="2 2" opacity="0.6" />

          {/* Planetary Financial Hub Nodes on Earth (The 4 Distinct Brand Colors) */}
          {/* Hub 1: Americas Financial Hub (AIF Gold - var(--color-brand-primary)) */}
          <circle cx="30" cy="44" r="3.2" fill="url(#nodeGoldGrad)" />
          <circle cx="30" cy="44" r="5.5" fill="var(--color-brand-primary)" opacity="0.4" filter="url(#goldPulse)" />
          <circle cx="29.3" cy="43.3" r="1.0" fill="var(--color-foreground)" opacity="0.9" />

          {/* Hub 2: European Financial Hub (Emerald Green - var(--color-brand-success)) */}
          <circle cx="48" cy="35" r="3.4" fill="url(#nodeEmeraldGrad)" />
          <circle cx="48" cy="35" r="5.8" fill="var(--color-brand-success)" opacity="0.45" filter="url(#emeraldPulse)" />
          <circle cx="47.2" cy="34.2" r="1.1" fill="var(--color-foreground)" opacity="0.9" />

          {/* Hub 3: Asian AI Tech Hub (AI Magenta - var(--color-asset-forex)) */}
          <circle cx="68" cy="38" r="3.3" fill="url(#nodeMagentaGrad)" />
          <circle cx="68" cy="38" r="5.6" fill="var(--color-asset-forex)" opacity="0.45" filter="url(#magentaPulse)" />
          <circle cx="67.2" cy="37.2" r="1.0" fill="var(--color-foreground)" opacity="0.95" />

          {/* Hub 4: Global Core / Indo-Pacific Hub (Royal Purple - var(--color-brand-accent)) */}
          <circle cx="54" cy="61" r="3.0" fill="url(#nodePurpleGrad)" />
          <circle cx="54" cy="61" r="5.2" fill="var(--color-brand-accent)" opacity="0.45" filter="url(#purplePulse)" />
          <circle cx="53.3" cy="60.3" r="0.9" fill="var(--color-foreground)" opacity="0.9" />

          {/* Central AI Nexus Spark (Luminous Core Beacon) */}
          <circle cx="50" cy="47" r="1.7" fill="var(--color-foreground)" opacity="0.95" filter="url(#goldPulse)" />

          {/* Sunlight Glint across the Upper-Left Atmosphere */}
          <ellipse cx="38" cy="33" rx="14" ry="9" fill="var(--color-foreground)" opacity="0.1" transform="rotate(-25 38 33)" />
        </g>

        {/* 4. Atmospheric Luminous Edge Rim */}
        <circle cx="50" cy="50" r="28.5" fill="none" stroke="url(#atmosphereRingGrad)" strokeWidth="1.6" opacity="0.9" />

        {/* 5. Planetary Orbital Ring (FRONT HALF – sweeps prominently in front of the globe) */}
        <g transform="rotate(-25 50 50)">
          {/* Main front glowing ribbon */}
          <path
            d="M 95,50 A 45 13 0 0 1 5,50"
            fill="none"
            stroke="url(#orbitalRingGradFront)"
            strokeWidth="2.4"
            strokeLinecap="round"
            filter="url(#ringGlow)"
          />
          {/* Inner front detail track */}
          <path
            d="M 88,50 A 38 10 0 0 1 12,50"
            fill="none"
            stroke="url(#orbitalRingSubGrad)"
            strokeWidth="1.0"
            opacity="0.85"
            strokeLinecap="round"
          />

          {/* Orbiting Intelligence Data Satellites (Active Market Beacons in 4 Colors) */}
          {/* Orbiting Satellite 1: Gold Beacon */}
          <circle cx="80" cy="58" r="2.5" fill="url(#nodeGoldGrad)" filter="url(#goldPulse)" />
          <circle cx="79.3" cy="57.3" r="0.8" fill="var(--color-foreground)" />

          {/* Orbiting Satellite 2: Emerald Beacon */}
          <circle cx="58" cy="63" r="2.6" fill="url(#nodeEmeraldGrad)" filter="url(#emeraldPulse)" />
          <circle cx="57.2" cy="62.2" r="0.8" fill="var(--color-foreground)" />

          {/* Orbiting Satellite 3: Magenta Beacon */}
          <circle cx="36" cy="56" r="2.6" fill="url(#nodeMagentaGrad)" filter="url(#magentaPulse)" />
          <circle cx="35.3" cy="55.3" r="0.8" fill="var(--color-foreground)" />

          {/* Orbiting Satellite 4: Purple Beacon */}
          <circle cx="18" cy="42" r="2.4" fill="url(#nodePurpleGrad)" filter="url(#purplePulse)" />
          <circle cx="17.3" cy="41.3" r="0.7" fill="var(--color-foreground)" />
        </g>

        {/* 6. Cosmic Constellation Sparkles in all 4 Brand Colors */}
        {/* Gold Star (Top Left) */}
        <path d="M11 20 L12 16 L13 20 L17 21 L13 22 L12 26 L11 22 L7 21 Z" fill="var(--color-brand-primary)" opacity="0.9" />
        {/* Emerald Star (Top Right) */}
        <path d="M89 18 L90 15 L91 18 L94 19 L91 20 L90 23 L89 20 L86 19 Z" fill="var(--color-brand-success)" opacity="0.9" filter="url(#emeraldPulse)" />
        {/* Magenta Star (Bottom Right) */}
        <path d="M88 80 L89 77 L90 80 L93 81 L90 82 L89 85 L88 82 L85 81 Z" fill="var(--color-asset-forex)" opacity="0.9" filter="url(#magentaPulse)" />
        {/* Purple Star (Bottom Left) */}
        <path d="M12 78 L13 75 L14 78 L17 79 L14 80 L13 83 L12 80 L9 79 Z" fill="var(--color-brand-accent)" opacity="0.85" filter="url(#purplePulse)" />
        {/* Micro-stars */}
        <circle cx="49" cy="6" r="1.2" fill="var(--color-brand-primary)" opacity="0.8" />
        <circle cx="94" cy="50" r="1.1" fill="var(--color-asset-forex)" opacity="0.75" />
      </svg>
    </div>
  );
};
