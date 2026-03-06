import { DayEntry, Habit, Scores } from './types';
import { format, subDays, parseISO } from 'date-fns';

export function calcProductivity(entry: DayEntry, habits: Habit[], allEntries: Record<string, DayEntry>): number {
  if (habits.length === 0) return 0;
  let totalWeight = 0, completedWeight = 0;
  for (const habit of habits) {
    const w = habit.isCore ? 1.5 : 1;
    totalWeight += w;
    if (entry.habits[habit.id]) completedWeight += w;
  }
  let base = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0;
  let streakBonus = 0;
  for (const habit of habits) {
    if (getStreak(habit.id, entry.date, allEntries) >= 3) streakBonus += 2;
  }
  return Math.min(100, Math.round(base + Math.min(streakBonus, 10)));
}

/** Health score from WHOOP data: sleep %, recovery %, strain 0-21 */
export function calcHealth(entry: DayEntry): number {
  if (!entry.health) return 0;
  const { sleepPerformance, recovery, strain } = entry.health;

  // Strain score: moderate (8-14) is optimal
  let strainScore: number;
  if (strain >= 8 && strain <= 14) {
    strainScore = 80 + (1 - Math.abs(strain - 11) / 3) * 20;
  } else if (strain < 8) {
    strainScore = 40 + (strain / 8) * 40;
  } else {
    strainScore = Math.max(20, 80 - (strain - 14) * 10);
  }

  return Math.round(Math.min(100, Math.max(0,
    sleepPerformance * 0.35 + recovery * 0.40 + strainScore * 0.25
  )));
}

export function calcHappiness(entry: DayEntry): number {
  if (!entry.happiness) return 0;
  return Math.round((entry.happiness.rating / 10) * 100);
}

export function calcScores(entry: DayEntry, habits: Habit[], allEntries: Record<string, DayEntry>): Scores {
  return {
    productivity: calcProductivity(entry, habits, allEntries),
    health: calcHealth(entry),
    happiness: calcHappiness(entry),
  };
}

export function getStreak(habitId: string, endDate: string, entries: Record<string, DayEntry>): number {
  let streak = 0;
  let cur = parseISO(endDate);
  for (let i = 0; i < 365; i++) {
    const key = format(cur, 'yyyy-MM-dd');
    if (entries[key]?.habits[habitId]) { streak++; cur = subDays(cur, 1); }
    else break;
  }
  return streak;
}

export function generateInsights(entries: Record<string, DayEntry>, habits: Habit[]): string[] {
  const insights: string[] = [];
  const scored = Object.entries(entries).map(([date, entry]) => ({
    date, scores: calcScores(entry, habits, entries),
  })).filter(d => d.scores.productivity > 0 || d.scores.health > 0 || d.scores.happiness > 0);

  if (scored.length < 3) { insights.push('Log at least 3 days to unlock insights.'); return insights; }

  const highHealth = scored.filter(d => d.scores.health >= 70);
  if (highHealth.length >= 2) {
    const avg = Math.round(highHealth.reduce((s, d) => s + d.scores.happiness, 0) / highHealth.length);
    insights.push(`When Health is 70+, Happiness averages ${avg}.`);
  }
  const highProd = scored.filter(d => d.scores.productivity >= 70);
  if (highProd.length >= 2) {
    const avg = Math.round(highProd.reduce((s, d) => s + d.scores.happiness, 0) / highProd.length);
    insights.push(`On productive days (70+), Happiness averages ${avg}.`);
  }
  const avgP = Math.round(scored.reduce((s, d) => s + d.scores.productivity, 0) / scored.length);
  const avgH = Math.round(scored.reduce((s, d) => s + d.scores.health, 0) / scored.length);
  const avgM = Math.round(scored.reduce((s, d) => s + d.scores.happiness, 0) / scored.length);
  insights.push(`30-day averages: Productivity ${avgP}, Health ${avgH}, Mood ${avgM}.`);
  return insights;
}
