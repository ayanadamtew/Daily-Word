import React from 'react';
import Badge from '../ui/Badge';

export default function PastEntries({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-surface-500 text-sm">No recent entries yet. Start your journey today!</p>
      </div>
    );
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today - d) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-surface-400 mb-3">Recent Entries</h3>
      {entries.map((entry) => (
        <div
          key={entry.id || entry.date}
          className={`
            glass-light rounded-xl p-4 transition-all duration-200 hover:bg-surface-700/50
            border-l-2 ${entry.type === 'read' ? 'border-l-emerald-500' : 'border-l-amber-500'}
          `}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-surface-400">{formatDate(entry.date)}</span>
            <Badge color={entry.type === 'read' ? 'success' : 'warning'} className="text-[10px]">
              {entry.type === 'read' ? '📖 Read' : '⏭️ Skip'}
            </Badge>
          </div>
          {entry.type === 'read' ? (
            <>
              <p className="text-sm font-medium text-surface-100">
                {entry.book} {entry.chapter}{entry.verse ? `:${entry.verse}` : ''}
              </p>
              {entry.notes && (
                <p className="text-xs text-surface-400 mt-1 line-clamp-2 italic">"{entry.notes}"</p>
              )}
            </>
          ) : (
            <p className="text-sm text-surface-400">{entry.skip_reason || 'No reason'}</p>
          )}
        </div>
      ))}
    </div>
  );
}
