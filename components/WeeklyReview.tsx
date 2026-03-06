'use client';

import { useMemo } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { DayEntry, Habit } from '@/lib/types';
import { calcScores } from '@/lib/scoring';

interface WeeklyReviewProps {
  entries: Record<string, DayEntry>;
  habits: Habit[];
}

export default function WeeklyReview({ entries, habits }: WeeklyReviewProps) {
  const review = useMemo(() => {
    const days: { date: string; scores: { productivity: number; health: number; happiness: number }; granted: number }[] = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const key = format(date, 'yyyy-MM-dd');
      const entry = entries[key];
      if (entry) {
        const scores = calcScores(entry, habits, entries);
        const granted = Object.values(entry.habits).filter(Boolean).length;
        days.push({ date: key, scores, granted });
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

    return { days: days.length, avgProd, avgHealth, avgHappy, avgComposite, completionPct, bestDay, insight, totalGranted };
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

      {/* Insight */}
      <p className="text-xs text-white/25 mt-3 text-center font-heading">
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
