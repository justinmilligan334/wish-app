'use client';

import { useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { DayEntry, Habit } from '@/lib/types';
import { calcScores, getStreak } from '@/lib/scoring';

interface WeeklyReviewProps {
  entries: Record<string, DayEntry>;
  habits: Habit[];
}

export default function WeeklyReview({ entries, habits }: WeeklyReviewProps) {
  const review = useMemo(() => {
    const days: { date: string; scores: { productivity: number; health: number; happiness: number }; granted: number; entry: DayEntry }[] = [];
    const today = new Date();
    const todayKey = format(today, 'yyyy-MM-dd');

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const key = format(date, 'yyyy-MM-dd');
      const entry = entries[key];
      if (entry) {
        const scores = calcScores(entry, habits, entries);
        const granted = Object.values(entry.habits).filter(Boolean).length;
        days.push({ date: key, scores, granted, entry });
      }
    }

    if (days.length < 3) return null;

    const avgProd = Math.round(days.reduce((s, d) => s + d.scores.productivity, 0) / days.length);
    const avgHealth = Math.round(days.reduce((s, d) => s + d.scores.health, 0) / days.length);
    const avgHappy = Math.round(days.reduce((s, d) => s + d.scores.happiness, 0) / days.length);
    const avgComposite = Math.round((avgProd + avgHealth + avgHappy) / 3);
    const totalGranted = days.reduce((s, d) => s + d.granted, 0);
    const totalPossible = days.length * habits.length;
    const completionPct = totalPossible > 0 ? Math.round((totalGranted / totalPossible) * 100) : 0;

    // Best day
    let bestDay = days[0];
    for (const d of days) {
      const dAvg = (d.scores.productivity + d.scores.health + d.scores.happiness) / 3;
      const bAvg = (bestDay.scores.productivity + bestDay.scores.health + bestDay.scores.happiness) / 3;
      if (dAvg > bAvg) bestDay = d;
    }

    // Per-habit stats for the week
    const habitStats = habits.map(habit => {
      let completed = 0;
      for (const d of days) {
        if (d.entry.habits[habit.id]) completed++;
      }
      const streak = getStreak(habit.id, todayKey, entries);
      return { habit, completed, total: days.length, pct: Math.round((completed / days.length) * 100), streak };
    });

    // Mood trend (daily mood values for sparkline)
    const moodTrend = days.map(d => ({
      day: format(parseISO(d.date), 'EEE').charAt(0),
      value: d.entry.happiness?.rating ?? 0,
      hasData: !!d.entry.happiness,
    }));

    // WHOOP averages (if any days have health data)
    const healthDays = days.filter(d => d.entry.health);
    const whoopAvg = healthDays.length > 0 ? {
      recovery: Math.round(healthDays.reduce((s, d) => s + (d.entry.health?.recovery ?? 0), 0) / healthDays.length),
      sleep: Math.round(healthDays.reduce((s, d) => s + (d.entry.health?.sleepPerformance ?? 0), 0) / healthDays.length),
      strain: +(healthDays.reduce((s, d) => s + (d.entry.health?.strain ?? 0), 0) / healthDays.length).toFixed(1),
      days: healthDays.length,
    } : null;

    // Auto insight
    let insight = '';
    if (avgHappy >= 70 && avgProd >= 70) {
      insight = 'Productive weeks tend to be happy weeks for you.';
    } else if (avgHealth >= 70 && avgHappy < 50) {
      insight = 'Health is strong — focus on mood-boosting habits.';
    } else if (completionPct >= 80) {
      insight = 'Incredible consistency. Your wishes are becoming reality.';
    } else if (completionPct >= 50) {
      insight = 'Solid week. Small improvements compound over time.';
    } else {
      insight = 'Every new week is a fresh start.';
    }

    return { days: days.length, avgProd, avgHealth, avgHappy, avgComposite, completionPct, bestDay, insight, totalGranted, habitStats, moodTrend, whoopAvg };
  }, [entries, habits]);

  if (!review) return null;

  return (
    <div className="bg-surface-card border border-white/[0.04] rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium">
          Weekly Review
        </p>
        <span className="text-[10px] text-white/15">
          Last {review.days} days
        </span>
      </div>

      {/* Composite average */}
      <div className="text-center mb-5">
        <span className="text-4xl font-heading font-bold text-white/70">{review.avgComposite}</span>
        <span className="text-lg text-white/15 font-heading"> avg</span>
      </div>

      {/* Score averages row */}
      <div className="flex items-center gap-3 mb-5">
        <MiniStat label="Prod" value={review.avgProd} color="#f59e0b" />
        <MiniStat label="Health" value={review.avgHealth} color="#38bdf8" />
        <MiniStat label="Mood" value={review.avgHappy} color="#34d399" />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between py-3 border-t border-white/[0.04]">
        <div>
          <p className="text-[10px] text-white/20 uppercase tracking-wider">Wishes Granted</p>
          <p className="text-sm font-heading font-semibold text-amber-400/70">{review.totalGranted}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-white/20 uppercase tracking-wider">Completion</p>
          <p className="text-sm font-heading font-semibold text-amber-400/70">{review.completionPct}%</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/20 uppercase tracking-wider">Best Day</p>
          <p className="text-sm font-heading font-semibold text-amber-400/70">
            {format(parseISO(review.bestDay.date), 'EEE')}
          </p>
        </div>
      </div>

      {/* Habit Streaks & Completion */}
      {review.habitStats.length > 0 && (
        <div className="pt-4 mt-1 border-t border-white/[0.04]">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-3">Habit Streaks</p>
          <div className="space-y-2.5">
            {review.habitStats.map(({ habit, pct, streak }) => (
              <div key={habit.id} className="flex items-center gap-3">
                <span className="text-[11px] text-white/40 w-24 truncate">{habit.name}</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: habit.color }}
                  />
                </div>
                <span className="text-[10px] text-white/20 w-8 text-right">{pct}%</span>
                {streak >= 2 && (
                  <span className="text-[10px] font-heading font-semibold text-amber-400/60 w-10 text-right">
                    {streak}d
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mood Trend Sparkline */}
      {review.moodTrend.some(m => m.hasData) && (
        <div className="pt-4 mt-4 border-t border-white/[0.04]">
          <p className="text-[9px] uppercase tracking-[0.2em] text-white/20 mb-3">Mood Trend</p>
          <div className="flex items-end gap-1.5 h-12">
            {review.moodTrend.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end justify-center" style={{ height: '32px' }}>
                  {m.hasData ? (
                    <div
                      className="w-full max-w-[20px] rounded-sm transition-all"
                      style={{
                        height: `${(m.value / 10) * 100}%`,
                        backgroundColor: m.value >= 7 ? '#34d399' : m.value >= 4 ? '#fbbf24' : '#fb7185',
                        opacity: 0.6,
                      }}
                    />
                  ) : (
                    <div className="w-full max-w-[20px] h-[2px] rounded-sm bg-white/[0.06]" />
                  )}
                </div>
                <span className="text-[8px] text-white/15">{m.day}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* WHOOP Averages */}
      {review.whoopAvg && (
        <div className="pt-4 mt-4 border-t border-white/[0.04]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[9px] uppercase tracking-[0.2em] text-white/20">WHOOP Averages</p>
            <span className="text-[9px] text-white/10">{review.whoopAvg.days}d data</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 text-center py-2 rounded-lg bg-sky-400/[0.06]">
              <p className="text-sm font-heading font-bold text-sky-400/80">{review.whoopAvg.sleep}%</p>
              <p className="text-[8px] uppercase tracking-wider text-white/15">Sleep</p>
            </div>
            <div className="flex-1 text-center py-2 rounded-lg bg-emerald-400/[0.06]">
              <p className="text-sm font-heading font-bold text-emerald-400/80">{review.whoopAvg.recovery}%</p>
              <p className="text-[8px] uppercase tracking-wider text-white/15">Recovery</p>
            </div>
            <div className="flex-1 text-center py-2 rounded-lg bg-amber-400/[0.06]">
              <p className="text-sm font-heading font-bold text-amber-400/80">{review.whoopAvg.strain}</p>
              <p className="text-[8px] uppercase tracking-wider text-white/15">Strain</p>
            </div>
          </div>
        </div>
      )}

      {/* Insight */}
      <p className="text-xs text-white/25 mt-4 text-center font-heading">
        {review.insight}
      </p>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 text-center py-2 rounded-lg" style={{ backgroundColor: `${color}08` }}>
      <p className="text-base font-heading font-bold" style={{ color }}>{value}</p>
      <p className="text-[9px] uppercase tracking-wider text-white/20">{label}</p>
    </div>
  );
}
