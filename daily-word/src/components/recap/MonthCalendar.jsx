import React from 'react';

const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function MonthCalendar({ year, month, entryMap, daysInMonth }) {
  // Get the day of week the month starts on
  const firstDay = new Date(year, month - 1, 1).getDay();

  const cells = [];
  // Empty cells for days before month start
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="w-9 h-9" />);
  }
  // Day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const entry = entryMap[day];
    const isToday = (() => {
      const now = new Date();
      return now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day;
    })();

    let bgColor = 'bg-surface-800'; // no entry
    let textColor = 'text-surface-500';
    if (entry?.type === 'read') {
      bgColor = 'bg-emerald-500/20';
      textColor = 'text-emerald-400';
    } else if (entry?.type === 'skip') {
      bgColor = 'bg-rose-500/20';
      textColor = 'text-rose-400';
    }

    cells.push(
      <div
        key={day}
        className={`
          w-9 h-9 rounded-lg flex items-center justify-center text-xs font-medium
          transition-all duration-200 cursor-default
          ${bgColor} ${textColor}
          ${isToday ? 'ring-2 ring-brand-500/50' : ''}
        `}
        title={entry ? `${entry.type === 'read' ? '📖 ' + entry.book : '⏭️ ' + (entry.skip_reason || 'Skipped')}` : 'No entry'}
      >
        {day}
      </div>
    );
  }

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {dayLabels.map((d, i) => (
          <div key={i} className="w-9 h-6 flex items-center justify-center text-[10px] text-surface-500 font-medium">
            {d}
          </div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells}
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-surface-400">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/50" /> Read</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/50" /> Skipped</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-surface-700" /> No entry</span>
      </div>
    </div>
  );
}
