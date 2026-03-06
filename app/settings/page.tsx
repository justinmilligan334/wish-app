'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppState, DEFAULT_WISHES, getHabitColor } from '@/lib/types';
import {
  loadState,
  addHabit,
  removeHabit,
  toggleHabitCore,
  exportData,
  resetData,
} from '@/lib/storage';
import Navigation from '@/components/Navigation';
import HabitIcon from '@/components/HabitIcon';

export default function SettingsPage() {
  const [state, setState] = useState<AppState | null>(null);
  const [newHabitName, setNewHabitName] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [quickSelected, setQuickSelected] = useState<Set<number>>(new Set());

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

  const handleAddHabit = () => {
    if (!newHabitName.trim()) return;
    const color = getHabitColor(state.habits.length);
    const updated = addHabit(state, newHabitName.trim(), color, false);
    setState(updated);
    setNewHabitName('');
  };

  const handleRemove = (id: string) => {
    setState(removeHabit(state, id));
  };

  const handleToggleCore = (id: string) => {
    setState(toggleHabitCore(state, id));
  };

  const handleExport = () => {
    const json = exportData(state);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'wish-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    const fresh = resetData();
    setState(fresh);
    setShowReset(false);
  };

  // Quick-add: filter out already-added wishes
  const existingNames = new Set(state.habits.map((h) => h.name.toLowerCase()));
  const suggestions = DEFAULT_WISHES.map((w, i) => ({ ...w, originalIndex: i })).filter(
    (s) => !existingNames.has(s.name.toLowerCase())
  );

  const toggleQuickSelect = (idx: number) => {
    const next = new Set(quickSelected);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setQuickSelected(next);
  };

  const handleBatchAdd = () => {
    let s = state;
    for (const idx of Array.from(quickSelected)) {
      const wish = DEFAULT_WISHES[idx];
      if (wish) {
        const color = getHabitColor(s.habits.length);
        s = addHabit(s, wish.name, color, false);
      }
    }
    setState(s);
    setQuickSelected(new Set());
  };

  return (
    <>
      <main className="max-w-lg mx-auto px-4 pt-8 pb-28">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-heading font-bold text-white mb-1">Settings</h1>
          <p className="text-xs text-white/25 uppercase tracking-[0.2em]">Manage your wishes</p>
        </div>

        {/* Current wishes */}
        <section className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium mb-4">
            Your Wishes ({state.habits.length})
          </p>
          <div className="space-y-2">
            {state.habits.map((habit) => (
              <div
                key={habit.id}
                className="flex items-center gap-3 bg-surface-card border border-white/[0.04] rounded-xl px-4 py-3"
              >
                <HabitIcon name={habit.name} color={habit.color} size={24} />
                <span className="flex-1 text-sm text-white/70">{habit.name}</span>

                <button
                  onClick={() => handleToggleCore(habit.id)}
                  className={`text-[9px] uppercase tracking-wider px-2 py-1 rounded border transition-all ${
                    habit.isCore
                      ? 'border-opacity-30'
                      : 'text-white/20 border-white/[0.04] hover:text-white/40'
                  }`}
                  style={habit.isCore ? { color: habit.color, borderColor: `${habit.color}40`, backgroundColor: `${habit.color}10` } : {}}
                >
                  {habit.isCore ? 'Core' : 'Regular'}
                </button>

                <button
                  onClick={() => handleRemove(habit.id)}
                  className="text-white/15 hover:text-red-400/60 transition-colors text-lg"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Add custom wish */}
        <section className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium mb-4">
            Add Custom Wish
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="What do you wish you did?"
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
              maxLength={40}
              className="flex-1 bg-surface-card border border-white/[0.04] rounded-xl px-4 py-3 text-sm text-white/70 placeholder-white/15 focus:outline-none focus:border-amber-400/30 transition-colors"
            />
            <button
              onClick={handleAddHabit}
              disabled={!newHabitName.trim()}
              className={`px-5 py-3 rounded-xl text-sm font-heading font-semibold uppercase tracking-wider border transition-all ${
                newHabitName.trim()
                  ? 'bg-amber-400 text-black border-amber-400 hover:bg-amber-300'
                  : 'bg-white/[0.03] text-white/15 border-white/[0.04] cursor-not-allowed'
              }`}
            >
              Add
            </button>
          </div>
        </section>

        {/* Quick add wishes — multi-select */}
        {suggestions.length > 0 && (
          <section className="mb-8">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium mb-4">
              Quick Add Wishes
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestions.map((s) => {
                const color = getHabitColor(s.originalIndex);
                const on = quickSelected.has(s.originalIndex);
                return (
                  <button
                    key={s.originalIndex}
                    onClick={() => toggleQuickSelect(s.originalIndex)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all border ${
                      on
                        ? 'border-opacity-30'
                        : 'bg-white/[0.02] border-white/[0.04] text-white/35 hover:text-white/55 hover:border-white/[0.08]'
                    }`}
                    style={on ? { backgroundColor: `${color}12`, borderColor: `${color}30`, color } : {}}
                  >
                    <HabitIcon name={s.name} color={on ? color : 'rgba(255,255,255,0.2)'} size={18} />
                    {s.name}
                  </button>
                );
              })}
            </div>

            {/* Batch add button */}
            <AnimatePresence>
              {quickSelected.size > 0 && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  onClick={handleBatchAdd}
                  className="w-full py-3 rounded-xl text-sm font-heading font-semibold uppercase tracking-wider bg-amber-400 text-black border border-amber-400 hover:bg-amber-300 transition-all"
                >
                  Add {quickSelected.size} Wish{quickSelected.size > 1 ? 'es' : ''}
                </motion.button>
              )}
            </AnimatePresence>
          </section>
        )}

        {/* Data */}
        <section className="mb-8 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium mb-4">Data</p>

          <button
            onClick={handleExport}
            className="w-full py-3 rounded-xl text-sm text-white/40 border border-white/[0.04] hover:border-white/[0.08] hover:text-white/60 transition-all"
          >
            Export to JSON
          </button>

          {!showReset ? (
            <button
              onClick={() => setShowReset(true)}
              className="w-full py-3 rounded-xl text-sm text-red-400/40 border border-white/[0.04] hover:border-red-400/20 hover:text-red-400/70 transition-all"
            >
              Reset All Data
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl text-sm text-red-400 border border-red-400/30 bg-red-400/10 hover:bg-red-400/20 transition-all"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setShowReset(false)}
                className="flex-1 py-3 rounded-xl text-sm text-white/40 border border-white/[0.04] hover:text-white/60 transition-all"
              >
                Cancel
              </button>
            </div>
          )}
        </section>

        <p className="text-center text-white/10 text-xs mt-12 mb-6 font-heading">
          wish v2 — make it real
        </p>
      </main>
      <Navigation />
    </>
  );
}
