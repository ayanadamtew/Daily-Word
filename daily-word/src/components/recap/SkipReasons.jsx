import React from 'react';

export default function SkipReasons({ skipReasons }) {
  const entries = Object.entries(skipReasons || {});
  if (entries.length === 0) {
    return (
      <div className="text-center py-3">
        <p className="text-sm text-surface-500">No skip reasons this month 🎉</p>
      </div>
    );
  }

  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div>
      <p className="text-sm font-medium text-surface-400 mb-2">Skip Breakdown</p>
      <div className="space-y-2">
        {entries.sort((a, b) => b[1] - a[1]).map(([reason, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={reason}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-surface-300">{reason}</span>
                <span className="text-surface-500">{count}x ({pct}%)</span>
              </div>
              <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500/50 rounded-full transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
