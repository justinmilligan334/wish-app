'use client';

import { useState, useEffect, useCallback } from 'react';

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
  const [whoopConnected, setWhoopConnected] = useState<boolean | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [lastSynced, setLastSynced] = useState('');

  useEffect(() => {
    if (initial) { setSleep(initial.sleepPerformance); setRecovery(initial.recovery); setStrain(initial.strain); }
  }, [initial]);

  // Check WHOOP connection status
  useEffect(() => {
    fetch('/api/whoop/status')
      .then(r => r.json())
      .then(d => setWhoopConnected(d.connected))
      .catch(() => setWhoopConnected(false));
  }, []);

  const commit = (s: number, r: number, st: number) => onUpdate(s, r, st);

  const syncWhoop = useCallback(async () => {
    setSyncing(true);
    setSyncError('');
    try {
      const res = await fetch('/api/whoop/data');
      if (!res.ok) {
        if (res.status === 401) {
          setWhoopConnected(false);
          setSyncError('Session expired. Reconnect in Settings.');
        } else {
          setSyncError('Sync failed. Try again.');
        }
        return;
      }
      const data = await res.json();

      const s = data.sleepPerformance ?? sleep;
      const r = data.recovery ?? recovery;
      const st = data.strain ?? strain;

      setSleep(s);
      setRecovery(r);
      setStrain(st);
      commit(s, r, st);
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {
      setSyncError('Network error. Try again.');
    } finally {
      setSyncing(false);
    }
  }, [sleep, recovery, strain]);

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
          {whoopConnected === null ? (
            // Loading state
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-teal-400/30 border-t-teal-400 rounded-full animate-spin" />
            </div>
          ) : whoopConnected ? (
            // Connected — show sync button
            <div className="flex flex-col items-center text-center py-4 rounded-xl border border-teal-400/15 bg-teal-400/[0.03]">
              <div className="w-10 h-10 rounded-full border-2 border-teal-400/40 flex items-center justify-center mb-3">
                <div className="w-5 h-5 rounded-full border-2 border-teal-400/60 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-teal-400" />
                </div>
              </div>

              <p className="text-sm text-teal-400/80 font-heading font-semibold mb-1">WHOOP Connected</p>

              {lastSynced && (
                <p className="text-[10px] text-white/20 mb-3">Last synced {lastSynced}</p>
              )}

              {syncError && (
                <p className="text-[10px] text-red-400/70 mb-3">{syncError}</p>
              )}

              <button
                onClick={syncWhoop}
                disabled={syncing}
                className={`px-6 py-2 rounded-xl text-xs font-heading font-semibold uppercase tracking-wider transition-all ${
                  syncing
                    ? 'bg-teal-400/5 text-teal-400/30 border border-teal-400/10 cursor-wait'
                    : 'bg-teal-400/15 text-teal-400 border border-teal-400/25 hover:bg-teal-400/25'
                }`}
              >
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>

              {/* Show current values if synced */}
              {(sleep > 0 || recovery > 0 || strain > 0) && (
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/[0.04] w-full px-4">
                  <div className="flex-1 text-center">
                    <p className="text-sm font-heading font-bold text-sky-400">{sleep}%</p>
                    <p className="text-[9px] text-white/20 uppercase tracking-wider">Sleep</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-sm font-heading font-bold" style={{ color: getRecoveryColor(recovery) }}>{recovery}%</p>
                    <p className="text-[9px] text-white/20 uppercase tracking-wider">Recovery</p>
                  </div>
                  <div className="flex-1 text-center">
                    <p className="text-sm font-heading font-bold text-amber-400">{strain}</p>
                    <p className="text-[9px] text-white/20 uppercase tracking-wider">Strain</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Not connected
            <div className="flex flex-col items-center text-center py-6 rounded-xl border border-dashed border-sky-400/15 bg-sky-400/[0.02]">
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

              <a
                href="/api/whoop/auth"
                className="px-6 py-2 rounded-xl text-xs font-heading font-semibold uppercase tracking-wider bg-teal-400/15 text-teal-400 border border-teal-400/25 hover:bg-teal-400/25 transition-all"
              >
                Connect WHOOP
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
