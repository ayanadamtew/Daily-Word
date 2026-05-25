import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import useAppStore from '../store/appStore';

export function useStreak() {
  const { user, setStreaks } = useAppStore();

  const calculateStreaks = useCallback(async () => {
    if (!user) return { current: 0, longest: 0 };

    const { data: entries } = await supabase
      .from('entries').select('date, type')
      .eq('user_id', user.id).eq('type', 'read')
      .order('date', { ascending: false });

    if (!entries || entries.length === 0) {
      setStreaks(0, 0);
      return { current: 0, longest: 0 };
    }

    const dates = new Set(entries.map(e => e.date));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Current streak: count consecutive days backwards from today/yesterday
    let current = 0;
    let checkDate = new Date(today);

    // Check if today has an entry, if not start from yesterday
    const todayStr = checkDate.toISOString().split('T')[0];
    if (!dates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (dates.has(dateStr)) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak: iterate through all dates
    const sortedDates = [...dates].sort();
    let longest = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr - prev) / 86400000);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        longest = Math.max(longest, tempStreak);
        tempStreak = 1;
      }
    }
    longest = Math.max(longest, tempStreak);

    setStreaks(current, longest);
    return { current, longest };
  }, [user, setStreaks]);

  return { calculateStreaks };
}
