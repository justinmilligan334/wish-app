'use client';

import { useState, useEffect } from 'react';

interface HappinessInputProps {
  initial: { rating: number; note: string } | null;
  onUpdate: (rating: number, note: string) => void;
}

// Interpolate color from slate to emerald based on 1-10
function getMoodColor(rating: number): string {
  const t = (rating - 1) / 9;
  const r = Math.round(71 + t * (52 - 71));
  const g = Math.round(85 + t * (211 - 85));
  const b = Math.round(105 + t * (153 - 105));
  return `rgb(${r},${g},${b})`;
}

export default function HappinessInput({ initial, onUpdate }: HappinessInputProps) {
  const [rating, setRating] = useState(initial?.rating ?? 5);
  const [note, setNote] = useState(initial?.note ?? '');
  const [touched, setTouched] = useState(!!initial);

  useEffect(() => {
    if (initial) { setRating(initial.rating); setNote(initial.note); setTouched(true); }
  }, [initial]);

  const handleRating = (value: number) => {
    setRating(value);
    setTouched(true);
    onUpdate(value, note);
  };

  const handleNote = (value: string) => {
    setNote(value);
    onUpdate(rating, value);
  };

  const color = getMoodColor(rating);

  return (
    <div className="bg-surface-card border border-white/[0.04] rounded-2xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium">Mood</p>
        {touched && (
          <span className="text-[10px] text-white/15">
            {rating <= 3 ? 'rough' : rating <= 5 ? 'okay' : rating <= 7 ? 'good' : rating <= 9 ? 'great' : 'peak'}
          </span>
        )}
      </div>

      {/* Large number */}
      <div className="text-center py-2">
        <span className="text-5xl font-heading font-bold tabular-nums transition-colors duration-300"
          style={{ color }}>
          {rating}
        </span>
        <span className="text-lg text-white/10 font-heading"> / 10</span>
      </div>

      {/* Gradient slider */}
      <input
        type="range"
        min="1" max="10" step="1"
        value={rating}
        onChange={(e) => handleRating(parseInt(e.target.value))}
        className="w-full"
      />

      {/* Anchor labels */}
      <div className="flex justify-between px-1">
        <span className="text-[10px] text-slate-500">rough</span>
        <span className="text-[10px] text-emerald-400/60">great</span>
      </div>

      {/* Note */}
      <input
        type="text"
        placeholder="What made today feel this way?"
        value={note}
        onChange={(e) => handleNote(e.target.value)}
        maxLength={120}
        className="w-full bg-white/[0.02] border border-white/[0.04] rounded-xl px-4 py-2.5 text-sm text-white/50 placeholder-white/15 focus:outline-none focus:border-white/10 transition-colors"
      />
    </div>
  );
}
