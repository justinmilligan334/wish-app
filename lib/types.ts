export const HABIT_COLORS = [
  '#f59e0b', '#38bdf8', '#34d399', '#a78bfa',
  '#fb7185', '#2dd4bf', '#f97316', '#818cf8',
];

export function getHabitColor(index: number): string {
  return HABIT_COLORS[index % HABIT_COLORS.length];
}

export interface Habit {
  id: string;
  name: string;
  color: string;
  isCore: boolean;
  createdAt: string;
}

export interface DayEntry {
  date: string;
  habits: Record<string, boolean>;
  health: {
    sleepPerformance: number; // 0-100 (WHOOP Sleep Performance %)
    recovery: number;         // 0-100 (WHOOP Recovery %)
    strain: number;           // 0-21  (WHOOP Day Strain)
  } | null;
  happiness: {
    rating: number; // 1-10
    note: string;
  } | null;
}

export interface Scores {
  productivity: number;
  health: number;
  happiness: number;
}

export interface AppState {
  habits: Habit[];
  entries: Record<string, DayEntry>;
  onboardingComplete: boolean;
}

export const DEFAULT_WISHES: { name: string }[] = [
  { name: 'Gym' },
  { name: 'Deep Work' },
  { name: 'Reading' },
  { name: 'Meditation' },
  { name: 'No Alcohol' },
  { name: 'Cold Shower' },
  { name: 'Journaling' },
  { name: 'Healthy Eating' },
  { name: 'Walk Outside' },
  { name: 'No Social Media' },
  { name: 'Stretch' },
  { name: '8hrs Sleep' },
  { name: 'Cook a Meal' },
  { name: 'Call Someone' },
  { name: 'Learn Something' },
  { name: 'Gratitude' },
];

export function getMotivation(composite: number, granted: number, total: number): string {
  if (total === 0) return 'Add some wishes to start.';
  if (composite >= 85) return 'You\'re making it all real.';
  if (composite >= 70) return 'Solid day. Keep stacking.';
  if (composite >= 50) return 'Building momentum.';
  if (granted > 0) return `${granted} wish${granted !== 1 ? 'es' : ''} granted. Keep going.`;
  return 'Every wish starts with one check.';
}
