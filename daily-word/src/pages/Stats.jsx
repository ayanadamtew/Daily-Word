import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import StreakBadge from '../components/recap/StreakBadge';
import { useEntries } from '../hooks/useEntries';
import { useStreak } from '../hooks/useStreak';
import useAppStore from '../store/appStore';

export default function Stats() {
  const { fetchAllEntries } = useEntries();
  const { calculateStreaks } = useStreak();
  const { currentStreak, longestStreak } = useAppStore();
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await fetchAllEntries({ limit: 1000 });
      setAllEntries(data);
      await calculateStreaks();
      setLoading(false);
    })();
  }, []);

  const readEntries = allEntries.filter(e => e.type === 'read');
  const totalDaysRead = readEntries.length;

  // Favourite books
  const bookCounts = {};
  readEntries.forEach(e => {
    if (e.book) bookCounts[e.book] = (bookCounts[e.book] || 0) + 1;
  });
  const topBooks = Object.entries(bookCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxBookCount = topBooks.length > 0 ? topBooks[0][1] : 1;

  // Monthly consistency
  const monthlyData = {};
  allEntries.forEach(e => {
    const key = e.date.substring(0, 7); // YYYY-MM
    if (!monthlyData[key]) monthlyData[key] = { read: 0, total: 0 };
    monthlyData[key].total++;
    if (e.type === 'read') monthlyData[key].read++;
  });
  const months = Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0])).slice(-6);

  // Heatmap data (last 52 weeks)
  const heatmapData = {};
  readEntries.forEach(e => { heatmapData[e.date] = true; });

  const today = new Date();
  const heatmapWeeks = [];
  for (let w = 51; w >= 0; w--) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - (w * 7 + (6 - d)));
      const dateStr = date.toISOString().split('T')[0];
      const hasEntry = heatmapData[dateStr];
      const isFuture = date > today;
      week.push({ date: dateStr, hasEntry, isFuture });
    }
    heatmapWeeks.push(week);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton rounded-2xl h-20" />
        <div className="skeleton rounded-2xl h-48" />
        <div className="skeleton rounded-2xl h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-50">📊 Stats Dashboard</h2>
        <p className="text-sm text-surface-400 mt-1">Your reading journey at a glance</p>
      </div>

      {/* Streaks */}
      <StreakBadge current={currentStreak} longest={longestStreak} size="md" />

      {/* Total days read */}
      <Card>
        <div className="text-center">
          <p className="text-4xl font-bold text-gradient">{totalDaysRead}</p>
          <p className="text-sm text-surface-400 mt-1">Total days in the Word</p>
        </div>
      </Card>

      {/* Favourite books */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-300 mb-3">📚 Most Read Books</h3>
        {topBooks.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-4">Start reading to see your favorites!</p>
        ) : (
          <div className="space-y-2.5">
            {topBooks.map(([book, count]) => (
              <div key={book}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-surface-200">{book}</span>
                  <span className="text-surface-500 text-xs">{count} times</span>
                </div>
                <div className="h-2 bg-surface-800 rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-brand rounded-full transition-all duration-700"
                    style={{ width: `${(count / maxBookCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Monthly consistency chart */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-300 mb-3">📈 Monthly Consistency</h3>
        {months.length === 0 ? (
          <p className="text-sm text-surface-500 text-center py-4">Not enough data yet</p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {months.map(([month, data]) => {
              const pct = data.total > 0 ? Math.round((data.read / data.total) * 100) : 0;
              const label = new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' });
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-surface-400">{pct}%</span>
                  <div className="w-full bg-surface-800 rounded-t-lg flex-1 relative overflow-hidden">
                    <div
                      className="absolute bottom-0 left-0 right-0 gradient-success rounded-t-lg transition-all duration-700"
                      style={{ height: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-surface-500">{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Heatmap */}
      <Card>
        <h3 className="text-sm font-semibold text-surface-300 mb-3">🗓 Activity Heatmap</h3>
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-[3px] min-w-[700px]">
            {heatmapWeeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`heatmap-cell ${
                      day.isFuture
                        ? 'bg-transparent'
                        : day.hasEntry
                          ? 'bg-emerald-500/60'
                          : 'bg-surface-800'
                    }`}
                    title={day.isFuture ? '' : `${day.date}${day.hasEntry ? ' ✓' : ''}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.5 mt-2 text-[10px] text-surface-500">
          <span>Less</span>
          <span className="w-2.5 h-2.5 rounded-sm bg-surface-800" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40" />
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/60" />
          <span>More</span>
        </div>
      </Card>
    </div>
  );
}
