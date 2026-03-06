'use client';

import { Habit, AppState, DayEntry } from '@/lib/types';
import { getStreak } from '@/lib/scoring';
import { motion } from 'framer-motion';

interface HabitListProps {
  habits: Habit[];
  entry: DayEntry;
  allEntries: AppState['entries'];
  onToggle: (habitId: string) => void;
}

export default function HabitList({ habits, entry, allEntries, onToggle }: HabitListProps) {
  if (habits.length === 0) return null;

  const granted = Object.values(entry.habits).filter(Boolean).length;

  return (
    <div className="space-y-2.5">
      {/* Section header with aqua accent line */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium">
            Your Wishes
          </p>
          <div className="h-[1px] w-8 bg-gradient-to-r from-sky-400/30 to-transparent" />
        </div>
        <p className="text-[10px] text-sky-400/40 font-heading font-medium">
          {granted}/{habits.length} granted
        </p>
      </div>

      {habits.map((habit, i) => {
        const done = !!entry.habits[habit.id];
        const streak = getStreak(habit.id, entry.date, allEntries);

        return (
          <motion.button
            key={habit.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onToggle(habit.id)}
            className={`w-full flex items-center gap-3.5 rounded-2xl border transition-all duration-200 overflow-hidden relative ${
              done
                ? 'border-white/[0.06]'
                : 'bg-surface-card border-white/[0.06] hover:border-white/[0.10]'
            }`}
            style={done ? {
              backgroundColor: `${habit.color}10`,
              borderColor: `${habit.color}20`,
            } : {}}
          >
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300"
              style={{
                backgroundColor: done ? habit.color : `${habit.color}25`,
              }}
            />

            {/* Content with padding for accent bar */}
            <div className="flex items-center gap-3.5 w-full px-5 py-3.5">
              {/* Checkbox */}
              <motion.div
                animate={done ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.2 }}
                className="w-[18px] h-[18px] rounded-md border-[1.5px] flex items-center justify-center transition-all flex-shrink-0"
                style={done
                  ? { backgroundColor: habit.color, borderColor: habit.color }
                  : { borderColor: 'rgba(255,255,255,0.15)' }
                }
              >
                {done && (
                  <svg className="w-2.5 h-2.5 text-black" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </motion.div>

              {/* Name */}
              <span className={`text-[15px] flex-1 text-left transition-colors font-semibold font-wish ${done ? 'text-white/50' : 'text-white/75'}`}>
                {habit.name}
              </span>

              {/* Core badge */}
              {habit.isCore && (
                <span className="text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded border"
                  style={{ color: `${habit.color}80`, borderColor: `${habit.color}25`, backgroundColor: `${habit.color}08` }}>
                  core
                </span>
              )}

              {/* Streak with sparkle */}
              {streak >= 2 && (
                <span className="flex items-center gap-1 text-[10px] tabular-nums font-medium text-amber-400/60">
                  <span className="text-amber-400/30 text-[8px]">✦</span>
                  {streak}d
                </span>
              )}
            </div>
          </motion.button>
        );
      })}
    </div>
  );
}
