import React from 'react';

interface DuellioLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const DuellioLogo: React.FC<DuellioLogoProps> = ({
  className = '',
  size = 40,
  showText = false
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size}
        height={showText ? size * 1.35 : size}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-[1.03]"
      >
        <defs>
          {/* Subtle Outer Ambient Shadows */}
          <filter id="ambient-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="12" stdDeviation="16" floodColor="#000000" floodOpacity="0.75" />
          </filter>

          {/* Intense Neon Glow for the Emerald Border */}
          <filter id="emerald-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feGaussianBlur stdDeviation="15" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Custom High-Tech Gradients */}
          <linearGradient id="shield-bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0B1C1A" />
            <stop offset="50%" stopColor="#071210" />
            <stop offset="100%" stopColor="#030605" />
          </linearGradient>

          <linearGradient id="shield-rim" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="40%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="emerald-metallic" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#86EFAC" />
            <stop offset="100%" stopColor="#065F46" />
          </linearGradient>

          <linearGradient id="steel-blade" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#CBD5E1" />
            <stop offset="70%" stopColor="#64748B" />
            <stop offset="100%" stopColor="#1E293B" />
          </linearGradient>

          <linearGradient id="dark-steel" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          <linearGradient id="gold-hilt" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBBF24" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
        </defs>

        {/* Layer 1: Shield & Swords Group (with composite shadows) */}
        <g filter="url(#ambient-shadow)">
          {/* BACKGROUND SHIELD ORNAMENTATION GLOW */}
          <path
            d="M 100,20 L 165,42 V 95 C 165,142 135,172 100,188 C 65,172 35,142 35,95 V 42 Z"
            fill="none"
            stroke="#10B981"
            strokeWidth="8"
            opacity="0.25"
            filter="url(#emerald-glow)"
          />

          {/* THE METALLIC BACKPLATE SHIELD SHAPE */}
          <path
            d="M 100,22 L 162,43 V 94 C 162,140 133,169 100,185 C 67,140 38,140 38,94 V 43 Z"
            fill="url(#shield-bg)"
            stroke="url(#shield-rim)"
            strokeWidth="3.5"
          />

          {/* INNER EMBOSS DETAIL FOR SHIELD HOOD */}
          <path
            d="M 100,32 L 150,48 V 88 C 150,123 127,146 100,159 C 73,146 50,123 50,88 V 48 Z"
            fill="none"
            stroke="#10B981"
            strokeWidth="1.5"
            opacity="0.35"
          />

          {/* ==================== CROSSED SWORDS ==================== */}

          {/* SWORD A: Top-Left to Bottom-Right */}
          <g>
            {/* Blade */}
            <path
              d="M 46,46 L 150,150 L 144,156 L 40,52 Z"
              fill="url(#steel-blade)"
              stroke="#000000"
              strokeWidth="0.5"
            />
            {/* Central blood grove groove on blade */}
            <line x1="43" y1="49" x2="147" y2="153" stroke="#475569" strokeWidth="1" />
            
            {/* Sword Guard */}
            <rect
              x="36"
              y="45"
              width="6"
              height="20"
              rx="1"
              transform="rotate(45, 39, 55)"
              fill="url(#dark-steel)"
              stroke="#0F172A"
              strokeWidth="0.75"
            />
            {/* Sword Grip Handle */}
            <path
              d="M 39,55 L 25,41"
              stroke="#1E293B"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Golden Grip Wire wrap */}
            <path
              d="M 39,55 L 25,41"
              stroke="url(#gold-hilt)"
              strokeWidth="2.5"
              strokeDasharray="2 3"
              strokeLinecap="round"
            />
            {/* Pommel Knob */}
            <circle cx="23" cy="39" r="4.5" fill="url(#emerald-metallic)" stroke="#065F46" strokeWidth="1" />
          </g>

          {/* SWORD B: Top-Right to Bottom-Left */}
          <g>
            {/* Blade */}
            <path
              d="M 154,46 L 160,52 L 56,156 L 50,150 Z"
              fill="url(#steel-blade)"
              stroke="#000000"
              strokeWidth="0.5"
            />
            {/* Central Blood Groove */}
            <line x1="157" y1="49" x2="53" y2="153" stroke="#475569" strokeWidth="1" />
            
            {/* Sword Guard */}
            <rect
              x="158"
              y="45"
              width="6"
              height="20"
              rx="1"
              transform="rotate(-45, 161, 55)"
              fill="url(#dark-steel)"
              stroke="#0F172A"
              strokeWidth="0.75"
            />
            {/* Sword Grip Handle */}
            <path
              d="M 161,55 L 175,41"
              stroke="#1E293B"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            {/* Golden Grip Wire wrap */}
            <path
              d="M 161,55 L 175,41"
              stroke="url(#gold-hilt)"
              strokeWidth="2.5"
              strokeDasharray="2 3"
              strokeLinecap="round"
            />
            {/* Pommel Knob */}
            <circle cx="177" cy="39" r="4.5" fill="url(#emerald-metallic)" stroke="#065F46" strokeWidth="1" />
          </g>

          {/* ==================== GAMING WHITE DICE ==================== */}
          <g transform="translate(118, 92) rotate(18)">
            {/* Soft shadow of die */}
            <rect x="0.5" y="4.5" width="24" height="24" rx="5" fill="#000000" opacity="0.4" />
            {/* Die base plate */}
            <rect
              x="0"
              y="4"
              width="24"
              height="24"
              rx="5"
              fill="#FFFFFF"
              stroke="#E2E8F0"
              strokeWidth="1.5"
            />
            {/* Inner shading gradient for 3D look */}
            <rect
              x="1"
              y="5"
              width="22"
              height="22"
              rx="4"
              fill="none"
              stroke="url(#dark-steel)"
              strokeWidth="0.75"
              opacity="0.1"
            />
            {/* Dots */}
            {/* Top Left */}
            <circle cx="6" cy="10" r="2.5" fill="#1e293b" />
            {/* Center */}
            <circle cx="12" cy="16" r="2.5" fill="#1e293b" />
            {/* Bottom Right */}
            <circle cx="18" cy="22" r="2.5" fill="#1e293b" />
          </g>

          {/* ==================== CENTRAL CHESS PIECE (PAWN) ==================== */}
          {/* Glowing Aura for Chess piece pawn */}
          <g filter="url(#emerald-glow)">
            <circle cx="100" cy="80" r="16" fill="#10B981" opacity="0.15" />
          </g>

          {/* Drawn Chess Piece Pawn */}
          <g>
            {/* Pawn Shadow */}
            <ellipse cx="100" cy="133" rx="20" ry="5" fill="#000000" opacity="0.6" />

            {/* Base platform 2 (Lowest) */}
            <path
              d="M 80,129 C 80,127 82,126 85,126 L 115,126 C 118,126 120,127 120,129 L 117,133 C 117,134 116,135 113,135 L 87,135 C 84,135 83,134 83,133 Z"
              fill="url(#emerald-metallic)"
              stroke="#047857"
              strokeWidth="1"
            />

            {/* Base platform 1 (Middle Rim) */}
            <rect
              x="84"
              y="120"
              width="32"
              height="6"
              rx="1.5"
              fill="url(#emerald-metallic)"
              stroke="#071210"
              strokeWidth="0.75"
            />

            {/* Waist Collar connector */}
            <path
              d="M 88,120 Q 100,95 100,88 Q 100,95 112,120 Z"
              fill="url(#emerald-metallic)"
              stroke="#047857"
              strokeWidth="0.5"
            />

            {/* Neck Trim ring */}
            <ellipse
              cx="100"
              cy="92"
              rx="9"
              ry="3"
              fill="#D1FAE5"
              stroke="#059669"
              strokeWidth="0.5"
            />

            {/* Sphere Head */}
            <circle
              cx="100"
              cy="80"
              r="12.5"
              fill="url(#emerald-metallic)"
              stroke="#047857"
              strokeWidth="1"
            />

            {/* Bright highlight reflection on pawn's head */}
            <circle
              cx="96.5"
              cy="76.5"
              r="4"
              fill="#FFFFFF"
              opacity="0.45"
            />
          </g>
        </g>
      </svg>
      {showText && (
        <span className="text-xl font-extrabold text-white tracking-[0.25em] font-display mt-2 ml-1 text-glow-purple uppercase select-none">
          DUELLIO
        </span>
      )}
    </div>
  );
};
