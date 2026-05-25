import React, { useState, useEffect } from 'react';
import TodayCard from '../components/journal/TodayCard';
import EntryForm from '../components/journal/EntryForm';
import SkipForm from '../components/journal/SkipForm';
import PastEntries from '../components/journal/PastEntries';
import { useEntries } from '../hooks/useEntries';
import { useStreak } from '../hooks/useStreak';
import useAppStore from '../store/appStore';
import { fetchVerseOfTheDay } from '../lib/bibleApi';

export default function Journal() {
  const { fetchTodayEntry, fetchRecentEntries, createReadEntry, createSkipEntry, loading } = useEntries();
  const { calculateStreaks } = useStreak();
  const { entryMode, setEntryMode, resetEntryMode, profile } = useAppStore();
  const [todayEntry, setTodayEntry] = useState(null);
  const [recentEntries, setRecentEntries] = useState([]);
  const [votd, setVotd] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const loadData = async () => {
    setPageLoading(true);
    const [today, recent] = await Promise.all([
      fetchTodayEntry(),
      fetchRecentEntries(7),
    ]);
    setTodayEntry(today);
    setRecentEntries(recent);
    await calculateStreaks();
    setPageLoading(false);
  };

  useEffect(() => {
    loadData();
    // Fetch verse of the day
    fetchVerseOfTheDay(profile?.bible_version).then(setVotd);
  }, []);

  const handleSaveRead = async (data) => {
    const result = await createReadEntry(data);
    if (!result.error) {
      resetEntryMode();
      loadData();
    }
  };

  const handleSaveSkip = async (reason) => {
    const result = await createSkipEntry(reason);
    if (!result.error) {
      resetEntryMode();
      loadData();
    }
  };

  if (pageLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="glass rounded-2xl p-6 h-48 skeleton" />
        <div className="glass rounded-2xl p-4 h-24 skeleton" />
        <div className="glass rounded-2xl p-4 h-24 skeleton" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Verse of the day */}
      {votd && !votd.error && (
        <div className="glass-light rounded-xl p-4 border-l-2 border-l-brand-500">
          <p className="text-xs text-brand-400 font-medium mb-1">✨ Verse of the Day</p>
          <p className="text-sm text-surface-200 font-serif italic leading-relaxed line-clamp-3">
            "{votd.text.trim()}"
          </p>
          <p className="text-xs text-surface-500 mt-1.5">— {votd.reference}</p>
        </div>
      )}

      {/* Today's card */}
      <TodayCard
        todayEntry={todayEntry}
        onReadClick={() => setEntryMode('read')}
        onSkipClick={() => setEntryMode('skip')}
      />

      {/* Entry forms */}
      {entryMode === 'read' && !todayEntry && (
        <EntryForm onSave={handleSaveRead} loading={loading} />
      )}
      {entryMode === 'skip' && !todayEntry && (
        <SkipForm onSave={handleSaveSkip} loading={loading} />
      )}

      {/* Cancel button */}
      {entryMode && !todayEntry && (
        <button
          onClick={resetEntryMode}
          className="w-full text-center text-sm text-surface-500 hover:text-surface-300 transition-colors py-2"
        >
          ← Go back
        </button>
      )}

      {/* Recent entries */}
      <PastEntries entries={recentEntries} />
    </div>
  );
}
