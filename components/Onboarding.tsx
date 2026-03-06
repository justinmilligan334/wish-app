'use client';

import { DEFAULT_WISHES, getHabitColor } from '@/lib/types';
import { motion } from 'framer-motion';
import { useState } from 'react';
import HabitIcon from './HabitIcon';

interface OnboardingProps {
  onComplete: (selected: { name: string; color: string }[]) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  };

  const handleStart = () => {
    const wishes = Array.from(selected).map((i) => ({
      name: DEFAULT_WISHES[i].name,
      color: getHabitColor(i),
    }));
    onComplete(wishes);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full text-center"
      >
        {/* Star accent */}
        <div className="text-amber-400/20 text-3xl mb-4">✦</div>

        <h1 className="text-5xl sm:text-6xl font-heading font-bold text-white mb-2 tracking-tight">
          wish
        </h1>
        <p className="text-white/25 text-sm mb-12">
          What do you wish you did every day?
        </p>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {DEFAULT_WISHES.map((w, i) => {
            const color = getHabitColor(i);
            const on = selected.has(i);
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm transition-all border ${
                  on ? 'border-opacity-30' : 'bg-white/[0.02] border-white/[0.04] text-white/35 hover:text-white/55 hover:border-white/[0.08]'
                }`}
                style={on ? { backgroundColor: `${color}12`, borderColor: `${color}30`, color } : {}}
              >
                <HabitIcon name={w.name} color={on ? color : 'rgba(255,255,255,0.2)'} size={20} />
                {w.name}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleStart}
          disabled={selected.size === 0}
          className={`px-8 py-3 rounded-xl text-sm font-heading font-semibold uppercase tracking-wider transition-all border ${
            selected.size > 0
              ? 'bg-amber-400 text-black border-amber-400 hover:bg-amber-300'
              : 'bg-white/[0.03] text-white/15 border-white/[0.04] cursor-not-allowed'
          }`}
        >
          {selected.size > 0 ? `Make ${selected.size} Wish${selected.size > 1 ? 'es' : ''} Real` : 'Select wishes'}
        </button>

        <p className="text-white/10 text-xs mt-6">
          You can always add more later.
        </p>
      </motion.div>
    </div>
  );
}
