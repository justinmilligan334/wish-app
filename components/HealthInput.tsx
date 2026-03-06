'use client';

import { useState, useEffect } from 'react';

interface HealthInputProps {
  initial: { sleepPerformance: number; recovery: number; strain: number } | null;
  onUpdate: (sleepPerformance: number, recovery: number, strain: number) => void;
}

type InputMode = 'manual' | 'import';

function getRecoveryColor(v: number): string {
  if (v >= 67) return '#34d399';
  if (v >= 34) return '#fbbf24';
  return '#fb7185';
}

function Bar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function HealthInput({ initial, onUpdate }: HealthInputProps) {
  const [mode, setMode] = useState<InputMode>('manual');
  const [sleep, setSleep] = useState(initial?.sleepPerformance ?? 0);
  const [recovery, setRecovery] = useState(initial?.recovery ?? 0);
  const [strain, setStrain] = useState(initial?.strain ?? 0);

  useEffect(() => {
    if (initial) { setSleep(initial.sleepPerformance); setRecovery(initial.recovery); setStrain(initial.strain); }
  }, [initial]);

  const commit = (s: number, r: number, st: number) => onUpdate(s, r, st);

  const metrics = [
    { label: 'Sleep', value: sleep, set: (v: number) => { setSleep(v); commit(v, recovery, strain); }, max: 100, unit: '%', color: '#38bdf8', step: 1 },
    { label: 'Recovery', value: recovery, set: (v: number) => { setRecovery(v); commit(sleep, v, strain); }, max: 100, unit: '%', color: getRecoveryColor(recovery), step: 1 },
    { label: 'Strain', value: strain, set: (v: number) => { setStrain(v); commit(sleep, recovery, v); }, max: 21, unit: '', color: '#f59e0b', step: 0.1 },
  ];

  return (
    <div className="bg-surface-card border border-white/[0.06] rounded-2xl overflow-hidden">
      {/* Header with mode toggle */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-medium">WHOOP</p>

        {/* Manual / Import toggle */}
        <div className="flex items-center bg-surface-elevated rounded-lg p-0.5">
          <button
            onClick={() => setMode('manual')}
            className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-medium transition-all ${
              mode === 'manual'
                ? 'bg-sky-400/15 text-sky-400 border border-sky-400/25'
                : 'text-white/25 border border-transparent hover:text-white/40'
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setMode('import')}
            className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-medium transition-all ${
              mode === 'import'
                ? 'bg-sky-400/15 text-sky-400 border border-sky-400/25'
                : 'text-white/25 border border-transparent hover:text-white/40'
            }`}
          >
            Import
          </button>
        </div>
      </div>

      {mode === 'manual' ? (
        /* Manual input mode */
        <div className="px-5 pb-5 space-y-4">
          {metrics.map((m) => (
            <div key={m.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-xs text-white/40">{m.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  <input type="number" min={0} max={m.max} step={m.step}
                    value={m.value || ''} placeholder="—"
                    onChange={(e) => m.set(Math.min(m.max, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-14 text-right bg-transparent text-sm font-heading font-semibold focus:outline-none tabular-nums"
                    style={{ color: m.color }}
                  />
                  {m.unit && <span className="text-[10px] text-white/15">{m.unit}</span>}
                </div>
              </div>
              <Bar value={m.value} max={m.max} color={m.color} />
            </div>
          ))}
        </div>
      ) : (
        /* Import mode — Connect to WHOOP */
        <div className="px-5 pb-6 pt-2">
          <div className="flex flex-col items-center text-center py-6 rounded-xl border border-dashed border-sky-400/15 bg-sky-400/[0.02]">
            {/* WHOOP-style icon */}
            <div className="w-12 h-12 rounded-full border-2 border-teal-400/30 flex items-center justify-center mb-4">
              <div className="w-6 h-6 rounded-full border-2 border-teal-400/50 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-teal-400/70" />
              </div>
            </div>

            <p className="text-sm text-white/60 font-heading font-semibold mb-1">
              Connect to WHOOP
            </p>
            <p className="text-[11px] text-white/25 mb-4 max-w-[220px] leading-relaxed">
              Automatic sync will pull your Sleep, Recovery & Strain data daily
            </p>

            <button
              disabled
              className="px-6 py-2 rounded-xl text-xs font-heading font-semibold uppercase tracking-wider bg-teal-400/10 text-teal-400/40 border border-teal-400/15 cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
