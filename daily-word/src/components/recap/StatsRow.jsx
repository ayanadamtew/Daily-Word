import React from 'react';

export default function StatsRow({ readDays, skipDays, noEntryDays, totalDays }) {
  const pct = totalDays > 0 ? Math.round((readDays / totalDays) * 100) : 0;

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between text-xs text-surface-400 mb-1.5">
          <span>Faithfulness</span>
          <span className="text-brand-400 font-semibold">{pct}%</span>
        </div>
        <div className="h-2.5 bg-surface-800 rounded-full overflow-hidden">
          <div
            className="h-full gradient-success rounded-full transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Stats chips */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-light rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-400">{readDays}</p>
          <p className="text-[10px] text-surface-400 mt-0.5">Days Read</p>
        </div>
        <div className="glass-light rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-amber-400">{skipDays}</p>
          <p className="text-[10px] text-surface-400 mt-0.5">Skipped</p>
        </div>
        <div className="glass-light rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-surface-500">{noEntryDays}</p>
          <p className="text-[10px] text-surface-400 mt-0.5">No Entry</p>
        </div>
      </div>
    </div>
  );
}
