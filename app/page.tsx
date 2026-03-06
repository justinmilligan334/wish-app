'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, subDays } from 'date-fns';
import { AppState, getMotivation } from '@/lib/types';
import {
  loadState,
  getTodayEntry,
  todayKey,
  toggleHabitCompletion,
  updateHealth,
  updateHappiness,
  addHabit,
  completeOnboarding,
} from '@/lib/storage';
import { calcScores } from '@/lib/scoring';
import ScoreRing from '@/components/ScoreRing';
import HabitList from '@/components/HabitList';
import HealthInput from '@/components/HealthInput';
import HappinessInput from '@/components/HappinessInput';
import Navigation from '@/components/Navigation';
import Onboarding from '@/components/Onboarding';

function getTrend(today: number, yesterday: number): '↑' | '↓' | '–' {
  if (today > yesterday + 3) return '↑';
  if (today < yesterday - 3) return '↓';
  return '–';
}

export default function Dashboard() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  const handleOnboardingComplete = useCallback(
    (habits: { name: string; color: string }[]) => {
      let s = loadState();
      for (const h of habits) {
        s = addHabit(s, h.name, h.color, false);
      }
      s = completeOnboarding(s);
      setState(s);
    },
    []
  );

  const handleToggleHabit = useCallback((habitId: string) => {
    setState((prev) => {
      if (!prev) return prev;
      return toggleHabitCompletion(prev, habitId);
    });
  }, []);

  const handleHealthUpdate = useCallback(
    (sleepPerformance: number, recovery: number, strain: number) => {
      setState((prev) => {
        if (!prev) return prev;
        return updateHealth(prev, sleepPerformance, recovery, strain);
      });
    },
    []
  );

  const handleHappinessUpdate = useCallback((rating: number, note: string) => {
    setState((prev) => {
      if (!prev) return prev;
      return updateHappiness(prev, rating, note);
    });
  }, []);

  // Loading
  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sky-400/30 text-2xl mb-2">✦</p>
          <p className="text-white/20 text-sm font-heading">Loading...</p>
        </div>
      </div>
    );
  }

  // Onboarding
  if (!state.onboardingComplete) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const entry = getTodayEntry(state);
  const scores = calcScores(entry, state.habits, state.entries);
  const today = format(new Date(), 'EEEE, MMMM d');

  // Health penalty logic
  const hasHealth = entry.health !== null;
  const hasHappiness = entry.happiness !== null;
  const hasAnyInput = hasHealth || hasHappiness || Object.values(entry.habits).some(Boolean);
  const healthPenalty = !hasHealth && hasAnyInput;

  // Composite score — always average all 3 (including 0 for missing)
  const rawComposite = Math.round(
    (scores.productivity + scores.health + scores.happiness) / 3
  );
  const composite = healthPenalty
    ? Math.round(rawComposite * 0.85)
    : rawComposite;

  // Yesterday's scores for trend
  const yesterdayKey = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const yesterdayEntry = state.entries[yesterdayKey];
  let yesterdayComposite = 0;
  if (yesterdayEntry) {
    const ys = calcScores(yesterdayEntry, state.habits, state.entries);
    yesterdayComposite = Math.round((ys.productivity + ys.health + ys.happiness) / 3);
  }

  const trend = getTrend(composite, yesterdayComposite);
  const trendColor = trend === '↑' ? 'text-emerald-400' : trend === '↓' ? 'text-rose-400' : 'text-white/20';

  const granted = Object.values(entry.habits).filter(Boolean).length;
  const motivation = getMotivation(composite, granted, state.habits.length);

  return (
    <>
      <main className="max-w-lg mx-auto px-4 pt-8 pb-28">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-sky-400/15 text-xl mb-2">✦</div>
          <h1 className="text-3xl font-heading font-bold text-white mb-1">wish</h1>
          <p className="text-xs text-white/25 uppercase tracking-[0.2em]">{today}</p>
        </div>

        {/* Composite Wish Score */}
        <div className="flex flex-col items-center mb-3">
          <ScoreRing score={composite} label="Wish Score" color="white" size={160} />
          {/* Trend arrow */}
          {yesterdayEntry && (
            <span className={`text-xs font-heading font-semibold mt-1 ${trendColor}`}>
              {trend} vs yesterday
            </span>
          )}
        </div>

        {/* Motivational copy */}
        <p className="text-center text-white/25 text-sm font-heading mb-2">
          {motivation}
        </p>

        {/* Health penalty note */}
        {healthPenalty && (
          <p className="text-center text-sky-400/30 text-[11px] mb-6 flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            No health data — score reduced 15%
          </p>
        )}

        {!healthPenalty && <div className="mb-6" />}

        {/* Three Sub-Rings */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 mb-10">
          <ScoreRing score={scores.productivity} label="Productivity" color="amber" size={100} />
          <ScoreRing score={scores.health} label="Health" color="sky" size={100} />
          <ScoreRing score={scores.happiness} label="Happiness" color="emerald" size={100} />
        </div>

        {/* Habits */}
        <section className="mb-8">
          <HabitList
            habits={state.habits}
            entry={entry}
            allEntries={state.entries}
            onToggle={handleToggleHabit}
          />
        </section>

        {/* Health */}
        <section className="mb-8">
          <HealthInput initial={entry.health} onUpdate={handleHealthUpdate} />
        </section>

        {/* Happiness */}
        <section className="mb-8">
          <HappinessInput initial={entry.happiness} onUpdate={handleHappinessUpdate} />
        </section>
      </main>

      <Navigation />
    </>
  );
}
