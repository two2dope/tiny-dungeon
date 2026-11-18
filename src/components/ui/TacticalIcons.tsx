import React from 'react';
import { DieSymbol, HeroClass } from '../../engine/types';

interface DieSymbolSvgProps {
  symbol: DieSymbol;
  className?: string;
}

export const DieSymbolSvg: React.FC<DieSymbolSvgProps> = ({
  symbol,
  className = 'w-6 h-6',
}) => {
  const palette: Record<DieSymbol, { bg: string; stroke: string; fill: string; highlight: string }> = {
    boot: { bg: '#451a03', stroke: '#fbbf24', fill: '#f59e0b', highlight: '#fef3c7' },
    sword: { bg: '#431407', stroke: '#fb923c', fill: '#ea580c', highlight: '#ffedd5' },
    magic: { bg: '#3b0764', stroke: '#c084fc', fill: '#9333ea', highlight: '#f3e8ff' },
    rogue: { bg: '#022c22', stroke: '#34d399', fill: '#059669', highlight: '#d1fae5' },
    shield: { bg: '#0c4a6e', stroke: '#38bdf8', fill: '#0284c7', highlight: '#e0f2fe' },
    skull: { bg: '#4c0519', stroke: '#fb7185', fill: '#e11d48', highlight: '#ffe4e6' },
  };
  const c = palette[symbol];

  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={`${className} transition-transform duration-150 group-hover:scale-110`}
    >
      {/* Back beveled plaque */}
      <rect x="2" y="3" width="28" height="27" rx="6" fill={c.bg} stroke={c.stroke} strokeWidth="1.75" />
      <rect x="4" y="4" width="24" height="5" rx="3" fill={c.highlight} opacity="0.16" />

      {symbol === 'boot' && (
        <g>
          <path
            d="M11 8h6v10l6 2v4H10v-5l1-11z"
            fill={c.fill}
            stroke={c.highlight}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M9 24h15" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {symbol === 'sword' && (
        <g>
          <path
            d="M22 7l3 3-10 10-3-3 10-10z"
            fill={c.fill}
            stroke={c.highlight}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M10 15l7 7M8 24l4-4" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {symbol === 'magic' && (
        <g>
          <path
            d="M16 7l2.2 5.4L24 14l-5.8 1.6L16 21l-2.2-5.4L8 14l5.8-1.6L16 7z"
            fill={c.fill}
            stroke={c.highlight}
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
          <circle cx="22.5" cy="22.5" r="2" fill={c.highlight} />
        </g>
      )}

      {symbol === 'rogue' && (
        <g>
          <circle cx="12" cy="13" r="4.2" fill={c.fill} stroke={c.highlight} strokeWidth="1.5" />
          <path d="M15.5 16.5L23 24M20 21l2.5-2.5M18 23l2-2" stroke={c.highlight} strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}

      {symbol === 'shield' && (
        <g>
          <path
            d="M16 7l7 3v6c0 5-3 7.8-7 9.5-4-1.7-7-4.5-7-9.5v-6l7-3z"
            fill={c.fill}
            stroke={c.highlight}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path d="M16 10v11M12 14h8" stroke={c.highlight} strokeWidth="1.5" strokeLinecap="round" />
        </g>
      )}

      {symbol === 'skull' && (
        <g>
          <path
            d="M10 15a6 6 0 1112 0c0 2.4-1.2 4-2.5 4.8V23h-7v-3.2C11.2 19 10 17.4 10 15z"
            fill={c.fill}
            stroke={c.highlight}
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <circle cx="13.5" cy="14.5" r="1.4" fill={c.bg} />
          <circle cx="18.5" cy="14.5" r="1.4" fill={c.bg} />
        </g>
      )}
    </svg>
  );
};

interface HeroCrestSvgProps {
  classType: HeroClass;
  className?: string;
}

export const HeroCrestSvg: React.FC<HeroCrestSvgProps> = ({
  classType,
  className = 'w-9 h-9',
}) => {
  const palette: Record<HeroClass, { ring: string; bg: string; fill: string; accent: string }> = {
    warrior: { ring: '#f59e0b', bg: '#451a03', fill: '#ea580c', accent: '#fde68a' },
    mage: { ring: '#a855f7', bg: '#2e1065', fill: '#9333ea', accent: '#f3e8ff' },
    cleric: { ring: '#38bdf8', bg: '#0c4a6e', fill: '#0284c7', accent: '#e0f2fe' },
    rogue: { ring: '#10b981', bg: '#022c22', fill: '#059669', accent: '#d1fae5' },
  };
  const c = palette[classType];

  return (
    <svg viewBox="0 0 36 36" aria-hidden="true" className={`${className} shrink-0`}>
      <circle cx="18" cy="18" r="16" fill={c.bg} stroke={c.ring} strokeWidth="2" />
      <circle cx="18" cy="18" r="13" fill="none" stroke={c.accent} strokeWidth="0.8" opacity="0.45" />

      {classType === 'warrior' && (
        <g>
          <path d="M12 22c0-4 2.5-7 6-7s6 3 6 7v4H12v-4z" fill={c.fill} stroke={c.accent} strokeWidth="1.3" />
          <path d="M18 8l3 4-3 3-3-3 3-4z" fill={c.accent} />
          <path d="M14 19h8" stroke={c.bg} strokeWidth="1.6" strokeLinecap="round" />
        </g>
      )}

      {classType === 'mage' && (
        <g>
          <path d="M18 7l5 12H13l5-12z" fill={c.fill} stroke={c.accent} strokeWidth="1.3" strokeLinejoin="round" />
          <ellipse cx="18" cy="20" rx="9" ry="2.2" fill={c.ring} stroke={c.accent} strokeWidth="1" />
          <circle cx="18" cy="25" r="2.2" fill={c.accent} />
        </g>
      )}

      {classType === 'cleric' && (
        <g>
          <path d="M18 8l7 3v7c0 4.5-3 7-7 9-4-2-7-4.5-7-9v-7l7-3z" fill={c.fill} stroke={c.accent} strokeWidth="1.3" />
          <path d="M18 12v10M14 16h8" stroke={c.accent} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {classType === 'rogue' && (
        <g>
          <path d="M11 23c0-7 3-13 7-14 4 1 7 7 7 14l-7 3-7-3z" fill={c.fill} stroke={c.accent} strokeWidth="1.3" />
          <path d="M14 18l4 2 4-2" stroke={c.accent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>
      )}
    </svg>
  );
};
