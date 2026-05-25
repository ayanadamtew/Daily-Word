import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import MonthCalendar from '../components/recap/MonthCalendar';
import StatsRow from '../components/recap/StatsRow';
import SkipReasons from '../components/recap/SkipReasons';
import ShareCard from '../components/share/ShareCard';
import { useRecap } from '../hooks/useRecap';
import useAppStore from '../store/appStore';

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function Recap() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [recap, setRecap] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getMonthlyRecap, publishRecap } = useRecap();
  const { profile, currentStreak } = useAppStore();

  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await getMonthlyRecap(year, month);
      setRecap(data);
      setLoading(false);
    })();
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth() + 1) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const handlePublish = async (blob) => {
    if (recap) await publishRecap(recap, blob);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton rounded-2xl h-12" />
        <div className="skeleton rounded-2xl h-64" />
        <div className="skeleton rounded-2xl h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-50">🗓 Monthly Recap</h2>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between glass rounded-xl px-4 py-3">
        <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface-700 transition-colors text-surface-400 hover:text-surface-50">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-base font-semibold text-surface-50">
          {monthNames[month - 1]} {year}
        </h3>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="p-1.5 rounded-lg hover:bg-surface-700 transition-colors text-surface-400 hover:text-surface-50 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {recap && (
        <>
          {/* Calendar */}
          <Card>
            <MonthCalendar
              year={year}
              month={month}
              entryMap={recap.entryMap}
              daysInMonth={recap.daysInMonth}
            />
          </Card>

          {/* Stats */}
          <Card>
            <StatsRow
              readDays={recap.readDays}
              skipDays={recap.skipDays}
              noEntryDays={recap.noEntryDays}
              totalDays={recap.totalDays}
            />
          </Card>

          {/* Skip reasons */}
          <Card>
            <SkipReasons skipReasons={recap.skipReasons} />
          </Card>

          {/* Share */}
          <ShareCard
            recap={recap}
            userName={profile?.name}
            streak={currentStreak}
            onPublish={handlePublish}
          />
        </>
      )}
    </div>
  );
}
