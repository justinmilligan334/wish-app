'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AppState } from '@/lib/types';
import { loadState } from '@/lib/storage';
import { calcScores, generateInsights } from '@/lib/scoring';
import Navigation from '@/components/Navigation';

export default function CorrelationsPage() {
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

  // Build last 30 days of data
  const chartData = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const key = format(date, 'yyyy-MM-dd');
    const entry = state.entries[key];
    if (entry) {
      const scores = calcScores(entry, state.habits, state.entries);
      chartData.push({
        date: format(date, 'MMM d'),
        productivity: scores.productivity,
        health: scores.health,
        happiness: scores.happiness,
      });
    }
  }

  const insights = generateInsights(state.entries, state.habits);

  // Heatmap: last 28 days in 4 rows of 7
  const heatmapDays = [];
  for (let i = 27; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const key = format(date, 'yyyy-MM-dd');
    const entry = state.entries[key];
    let avg = 0;
    if (entry) {
      const scores = calcScores(entry, state.habits, state.entries);
      avg = Math.round((scores.productivity + scores.health + scores.happiness) / 3);
    }
    heatmapDays.push({ date, key, avg, label: format(date, 'd') });
  }

  const getHeatColor = (avg: number) => {
    if (avg === 0) return 'bg-white/[0.02]';
    if (avg < 30) return 'bg-red-400/15';
    if (avg < 50) return 'bg-orange-400/15';
    if (avg < 70) return 'bg-amber-400/20';
    if (avg < 85) return 'bg-emerald-400/20';
    return 'bg-emerald-400/35';
  };

  return (
    <>
      <main className="max-w-lg mx-auto px-4 pt-8 pb-28">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-heading font-bold text-white mb-1">Insights</h1>
          <p className="text-xs text-white/25 uppercase tracking-[0.2em]">Last 30 days</p>
        </div>

        {/* Chart */}
        {chartData.length >= 2 ? (
          <div className="bg-surface-card border border-white/[0.04] rounded-2xl p-5 mb-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium mb-4">
              Score Trends
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111111',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="productivity"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                  name="Productivity"
                />
                <Line
                  type="monotone"
                  dataKey="health"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  dot={false}
                  name="Health"
                />
                <Line
                  type="monotone"
                  dataKey="happiness"
                  stroke="#34d399"
                  strokeWidth={2}
                  dot={false}
                  name="Happiness"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="bg-surface-card border border-white/[0.04] rounded-2xl p-8 text-center mb-6">
            <p className="text-white/20 text-sm">
              Log at least 2 days to see trend charts.
            </p>
          </div>
        )}

        {/* Insights */}
        <div className="bg-surface-card border border-white/[0.04] rounded-2xl p-5 mb-6 space-y-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium mb-2">
            Correlations
          </p>
          {insights.map((insight, i) => (
            <p key={i} className="text-sm text-white/40 leading-relaxed">
              {insight}
            </p>
          ))}
        </div>

        {/* Heatmap */}
        <div className="bg-surface-card border border-white/[0.04] rounded-2xl p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium mb-4">
            Daily Average — Last 4 Weeks
          </p>
          <div className="grid grid-cols-7 gap-1.5">
            {heatmapDays.map((day) => (
              <div
                key={day.key}
                className={`aspect-square rounded-lg flex items-center justify-center text-[10px] text-white/25 ${getHeatColor(day.avg)}`}
                title={`${day.key}: avg ${day.avg}`}
              >
                {day.label}
              </div>
            ))}
          </div>
        </div>
      </main>
      <Navigation />
    </>
  );
}
