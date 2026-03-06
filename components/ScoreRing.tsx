'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ScoreRingProps {
  score: number;
  label: string;
  color: 'amber' | 'sky' | 'emerald' | 'white';
  size?: number;
}

const COLOR_MAP: Record<string, { from: string; to: string; glow: string; text: string }> = {
  amber:   { from: '#fbbf24', to: '#d97706', glow: 'rgba(245,158,11,0.15)', text: 'text-amber-400' },
  sky:     { from: '#7dd3fc', to: '#0284c7', glow: 'rgba(56,189,248,0.15)', text: 'text-sky-400' },
  emerald: { from: '#6ee7b7', to: '#059669', glow: 'rgba(52,211,153,0.15)', text: 'text-emerald-400' },
  white:   { from: '#e2e8f0', to: '#94a3b8', glow: 'rgba(148,163,184,0.08)', text: 'text-white' },
};

export default function ScoreRing({ score, label, color, size = 120 }: ScoreRingProps) {
  const [displayed, setDisplayed] = useState(0);
  const c = COLOR_MAP[color] || COLOR_MAP.amber;
  const gradId = `grad-${color}-${size}`;

  const radius = 42;
  const innerRadius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  // Tick marks at 25, 50, 75
  const ticks = [0.25, 0.5, 0.75].map((pct) => {
    const angle = pct * 360 - 90;
    const rad = (angle * Math.PI) / 180;
    const r1 = 48, r2 = 50;
    return {
      x1: 50 + r1 * Math.cos(rad), y1: 50 + r1 * Math.sin(rad),
      x2: 50 + r2 * Math.cos(rad), y2: 50 + r2 * Math.sin(rad),
    };
  });

  useEffect(() => {
    if (score === 0) { setDisplayed(0); return; }
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1000, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(eased * score));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow */}
        <div
          className={`absolute inset-0 rounded-full blur-xl ${score >= 80 ? 'glow-pulse' : ''}`}
          style={{ backgroundColor: c.glow }}
        />
        <svg width={size} height={size} viewBox="0 0 100 100" className="relative z-10 -rotate-90">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={c.from} />
              <stop offset="100%" stopColor={c.to} />
            </linearGradient>
          </defs>

          {/* Decorative inner ring */}
          <circle cx="50" cy="50" r={innerRadius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

          {/* Track */}
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />

          {/* Progress arc with gradient */}
          <motion.circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />

          {/* Tick marks */}
          {ticks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          ))}
        </svg>

        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className={`font-heading font-bold ${c.text}`}
            style={{ fontSize: size * 0.28 }}>
            {displayed}
          </span>
        </div>
      </div>
      <p className="text-[9px] uppercase tracking-[0.25em] text-white/30 font-medium">{label}</p>
    </div>
  );
}
