'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { AppState } from '@/lib/types';
import { loadState } from '@/lib/storage';
import { calcScores } from '@/lib/scoring';
import Navigation from '@/components/Navigation';
import WeeklyReview from '@/components/WeeklyReview';

export default function HistoryPage() {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    setState(loadState());
  }, []);

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/20 text-sm">Loading...</p>
      </div>
    );
  }

  const sortedDates = Object.keys(state.entries).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <main className="max-w-lg mx-auto px-4 pt-8 pb-28">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-heading font-bold text-white mb-1">History</h1>
          <p className="text-xs text-white/25 uppercase tracking-[0.2em]">
            {sortedDates.length} day{sortedDates.length !== 1 ? 's' : ''} logged
          </p>
        </div>

        {/* Weekly Review */}
        <WeeklyReview entries={state.entries} habits={state.habits} />

        {sortedDates.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/20 text-sm">No entries yet. Start granting wishes today.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedDates.map((dateKey) => {
              const entry = state.entries[dateKey];
              const scores = calcScores(entry, state.habits, state.entries);
              const completedHabits = Object.values(entry.habits).filter(Boolean).length;
              const totalHabits = state.habits.length;
              const dateObj = parseISO(dateKey);

              // Composite for the day
              const active = [scores.productivity, scores.health, scores.happiness].filter(s => s > 0);
              const dayComposite = active.length > 0 ? Math.round(active.reduce((a, b) => a + b, 0) / active.length) : 0;

              return (
                <div
                  key={dateKey}
                  className="bg-surface-card border border-white/[0.04] rounded-2xl p-5"
                >
                  {/* Date header */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-heading font-semibold text-white/80">
                        {format(dateObj, 'EEEE')}
                      </p>
                      <p className="text-[10px] text-white/25 uppercase tracking-wider">
                        {format(dateObj, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-heading font-bold text-white/60">{dayComposite}</p>
                      <p className="text-[10px] text-white/20 uppercase tracking-wider">
                        {completedHabits}/{totalHabits} granted
                      </p>
                    </div>
                  </div>

                  {/* Score row */}
                  <div className="flex items-center gap-3">
                    <ScorePill label="Prod" value={scores.productivity} color="amber" />
                    <ScorePill label="Health" value={scores.health} color="sky" />
                    <ScorePill label="Mood" value={scores.happiness} color="emerald" />
                  </div>

                  {/* Happiness note */}
                  {entry.happiness?.note && (
                    <p className="text-xs text-white/20 mt-3">
                      &ldquo;{entry.happiness.note}&rdquo;
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Navigation />
    </>
  );
}

function ScorePill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'amber' | 'sky' | 'emerald';
}) {
  const colorMap = {
    amber: 'text-amber-400 bg-amber-400/10 border-amber-400/15',
    sky: 'text-sky-400 bg-sky-400/10 border-sky-400/15',
    emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/15',
  };

  return (
    <div className={`flex-1 text-center py-2 rounded-xl border ${colorMap[color]}`}>
      <p className="text-lg font-heading font-bold">{value}</p>
      <p className="text-[9px] uppercase tracking-wider opacity-50">{label}</p>
    </div>
  );
}
