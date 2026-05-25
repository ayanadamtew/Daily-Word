import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import useAppStore from '../../store/appStore';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function TodayCard({ todayEntry, onReadClick, onSkipClick }) {
  const { currentStreak } = useAppStore();
  const today = new Date();
  const dayName = dayNames[today.getDay()];
  const monthName = monthNames[today.getMonth()];
  const dateStr = `${dayName}, ${monthName} ${today.getDate()}`;

  if (todayEntry) {
    return (
      <Card className="relative overflow-hidden">
        {/* Decorative accent */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${todayEntry.type === 'read' ? 'gradient-success' : 'gradient-brand'}`} />

        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-surface-400 text-sm">{dateStr}</p>
            <h2 className="text-xl font-bold text-surface-50 mt-1">Today's Entry</h2>
          </div>
          <Badge color={todayEntry.type === 'read' ? 'success' : 'warning'} icon={todayEntry.type === 'read' ? '📖' : '⏭️'}>
            {todayEntry.type === 'read' ? 'Read' : 'Skipped'}
          </Badge>
        </div>

        {todayEntry.type === 'read' ? (
          <div className="space-y-2">
            <p className="text-brand-400 font-semibold">
              {todayEntry.book} {todayEntry.chapter}{todayEntry.verse ? `:${todayEntry.verse}` : ''}
            </p>
            {todayEntry.notes && (
              <p className="text-surface-300 text-sm leading-relaxed italic font-serif">
                "{todayEntry.notes}"
              </p>
            )}
          </div>
        ) : (
          <p className="text-surface-400 text-sm">
            Reason: {todayEntry.skip_reason || 'No reason given'}
          </p>
        )}

        {currentStreak > 0 && todayEntry.type === 'read' && (
          <div className="mt-4 pt-3 border-t border-surface-700/50 flex items-center gap-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm text-surface-300">
              {currentStreak} day streak! Keep it going!
            </span>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden" glow>
      {/* Decorative gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 gradient-brand" />

      <div className="text-center mb-6">
        <p className="text-surface-400 text-sm mb-1">{dateStr}</p>
        <h2 className="text-2xl font-bold text-surface-50">How was today?</h2>
        <p className="text-surface-400 text-sm mt-2">Did you spend time in God's Word?</p>
      </div>

      <div className="flex gap-3">
        <Button
          variant="success"
          size="lg"
          className="flex-1"
          onClick={onReadClick}
          id="btn-i-read"
        >
          📖 I Read Today
        </Button>
        <Button
          variant="secondary"
          size="lg"
          className="flex-1"
          onClick={onSkipClick}
          id="btn-i-skipped"
        >
          ⏭️ I Skipped
        </Button>
      </div>

      {currentStreak > 0 && (
        <div className="mt-4 pt-3 border-t border-surface-700/50 text-center">
          <span className="text-sm text-surface-400">
            🔥 You're on a <span className="text-brand-400 font-semibold">{currentStreak} day</span> streak!
          </span>
        </div>
      )}
    </Card>
  );
}
