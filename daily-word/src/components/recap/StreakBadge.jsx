import React from 'react';

export default function StreakBadge({ current, longest, size = 'md' }) {
  const sizes = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-2',
    lg: 'text-base px-4 py-3',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`
        inline-flex items-center gap-2 rounded-2xl glass-light
        ${sizes[size]}
        ${current > 0 ? 'animate-pulse-glow' : ''}
      `}>
        <span className="text-xl">🔥</span>
        <div>
          <p className="font-bold text-surface-50">{current} day{current !== 1 ? 's' : ''}</p>
          <p className="text-[10px] text-surface-500">Current streak</p>
        </div>
      </div>
      <div className={`inline-flex items-center gap-2 rounded-2xl glass-light ${sizes[size]}`}>
        <span className="text-xl">🏆</span>
        <div>
          <p className="font-bold text-surface-50">{longest}</p>
          <p className="text-[10px] text-surface-500">Best streak</p>
        </div>
      </div>
    </div>
  );
}
