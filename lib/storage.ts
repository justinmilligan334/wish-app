'use client';

import { AppState, DayEntry, Habit, getHabitColor } from './types';
import { format } from 'date-fns';

const STORAGE_KEY = 'wish-app-state';

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function getInitialState(): AppState {
  return { habits: [], entries: {}, onboardingComplete: false };
}

/** Load state with migration from v1 (emoji icons → colors, old health fields) */
export function loadState(): AppState {
  if (typeof window === 'undefined') return getInitialState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getInitialState();
    const state = JSON.parse(raw) as AppState;

    // Migrate old habits: icon → color
    let migrated = false;
    state.habits = state.habits.map((h: any, i: number) => {
      if (!h.color || h.icon) {
        migrated = true;
        return { id: h.id, name: h.name, color: getHabitColor(i), isCore: h.isCore, createdAt: h.createdAt };
      }
      return h;
    });

    // Migrate old health entries (sleepHours → null them out)
    for (const [key, entry] of Object.entries(state.entries)) {
      const e = entry as any;
      if (e.health && ('sleepHours' in e.health || 'sleepQuality' in e.health)) {
        (state.entries[key] as any).health = null;
        migrated = true;
      }
    }

    if (migrated) saveState(state);
    return state;
  } catch {
    return getInitialState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function todayKey(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getTodayEntry(state: AppState): DayEntry {
  const key = todayKey();
  if (state.entries[key]) return state.entries[key];
  return { date: key, habits: {}, health: null, happiness: null };
}

export function addHabit(state: AppState, name: string, color: string, isCore = false): AppState {
  const habit: Habit = { id: generateId(), name, color, isCore, createdAt: new Date().toISOString() };
  const newState = { ...state, habits: [...state.habits, habit] };
  saveState(newState);
  return newState;
}

export function removeHabit(state: AppState, habitId: string): AppState {
  const newState = { ...state, habits: state.habits.filter((h) => h.id !== habitId) };
  saveState(newState);
  return newState;
}

export function toggleHabitCore(state: AppState, habitId: string): AppState {
  const newState = { ...state, habits: state.habits.map((h) => h.id === habitId ? { ...h, isCore: !h.isCore } : h) };
  saveState(newState);
  return newState;
}

export function renameHabit(state: AppState, habitId: string, name: string): AppState {
  const newState = { ...state, habits: state.habits.map((h) => h.id === habitId ? { ...h, name } : h) };
  saveState(newState);
  return newState;
}

export function toggleHabitCompletion(state: AppState, habitId: string): AppState {
  const key = todayKey();
  const entry = getTodayEntry(state);
  const newHabits = { ...entry.habits };
  newHabits[habitId] = !newHabits[habitId];
  const newState = { ...state, entries: { ...state.entries, [key]: { ...entry, habits: newHabits } } };
  saveState(newState);
  return newState;
}

export function updateHealth(state: AppState, sleepPerformance: number, recovery: number, strain: number): AppState {
  const key = todayKey();
  const entry = getTodayEntry(state);
  const newState = { ...state, entries: { ...state.entries, [key]: { ...entry, health: { sleepPerformance, recovery, strain } } } };
  saveState(newState);
  return newState;
}

export function updateHappiness(state: AppState, rating: number, note: string): AppState {
  const key = todayKey();
  const entry = getTodayEntry(state);
  const newState = { ...state, entries: { ...state.entries, [key]: { ...entry, happiness: { rating, note } } } };
  saveState(newState);
  return newState;
}

export function completeOnboarding(state: AppState): AppState {
  const newState = { ...state, onboardingComplete: true };
  saveState(newState);
  return newState;
}

export function exportData(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function resetData(): AppState {
  const initial = getInitialState();
  saveState(initial);
  return initial;
}
