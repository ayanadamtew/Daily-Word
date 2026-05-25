import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import useAppStore from '../store/appStore';

export function useRecap() {
  const { user } = useAppStore();

  const getMonthlyRecap = useCallback(async (year, month) => {
    if (!user) return null;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const { data: entries } = await supabase
      .from('entries').select('*')
      .eq('user_id', user.id)
      .gte('date', startDate).lte('date', endDate)
      .order('date', { ascending: true });

    const allEntries = entries || [];
    const readEntries = allEntries.filter(e => e.type === 'read');
    const skipEntries = allEntries.filter(e => e.type === 'skip');

    // Skip reason breakdown
    const skipReasons = {};
    skipEntries.forEach(e => {
      const reason = e.skip_reason || 'No reason';
      skipReasons[reason] = (skipReasons[reason] || 0) + 1;
    });

    // Entry map by day
    const entryMap = {};
    allEntries.forEach(e => {
      const day = parseInt(e.date.split('-')[2]);
      entryMap[day] = e;
    });

    // Determine how many days to count (up to today if current month)
    const now = new Date();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
    const totalDays = isCurrentMonth ? now.getDate() : daysInMonth;

    return {
      year, month, daysInMonth, totalDays,
      readDays: readEntries.length,
      skipDays: skipEntries.length,
      noEntryDays: totalDays - readEntries.length - skipEntries.length,
      entries: allEntries,
      entryMap,
      skipReasons,
      consistency: totalDays > 0 ? Math.round((readEntries.length / totalDays) * 100) : 0,
    };
  }, [user]);

  const publishRecap = useCallback(async (recapData, imageBlob) => {
    if (!user) return { error: 'Not authenticated' };

    let imageUrl = null;
    if (imageBlob) {
      const path = `${user.id}/${recapData.year}-${recapData.month}.png`;
      const { error: uploadErr } = await supabase.storage.from('recaps').upload(path, imageBlob, { upsert: true, contentType: 'image/png' });
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from('recaps').getPublicUrl(path);
        imageUrl = publicUrl;
      }
    }

    const { data, error } = await supabase.from('recaps').upsert({
      user_id: user.id,
      year: recapData.year,
      month: recapData.month,
      read_days: recapData.readDays,
      total_days: recapData.totalDays,
      image_url: imageUrl,
      is_public: true,
      likes: 0,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,year,month' }).select().single();

    return { data, error };
  }, [user]);

  const getPublicRecaps = useCallback(async (filter = 'recent', church = null) => {
    let query = supabase
      .from('recaps').select('*, profiles(name, church, avatar_url)')
      .eq('is_public', true);

    if (filter === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else if (filter === 'faithful') {
      query = query.order('read_days', { ascending: false });
    }
    if (church) {
      query = query.eq('profiles.church', church);
    }
    query = query.limit(20);
    const { data } = await query;
    return data || [];
  }, []);

  const toggleEncouragement = useCallback(async (recapId) => {
    if (!user) return;
    const { data: existing } = await supabase
      .from('encouragements').select('id')
      .eq('recap_id', recapId).eq('from_user_id', user.id).single();

    if (existing) {
      await supabase.from('encouragements').delete().eq('id', existing.id);
      await supabase.rpc('decrement_likes', { recap_id_param: recapId }).catch(() => {
        // Fallback: manual decrement
        supabase.from('recaps').select('likes').eq('id', recapId).single().then(({ data }) => {
          if (data) supabase.from('recaps').update({ likes: Math.max(0, (data.likes || 0) - 1) }).eq('id', recapId);
        });
      });
      return false;
    } else {
      await supabase.from('encouragements').insert({ recap_id: recapId, from_user_id: user.id, created_at: new Date().toISOString() });
      await supabase.rpc('increment_likes', { recap_id_param: recapId }).catch(() => {
        supabase.from('recaps').select('likes').eq('id', recapId).single().then(({ data }) => {
          if (data) supabase.from('recaps').update({ likes: (data.likes || 0) + 1 }).eq('id', recapId);
        });
      });
      return true;
    }
  }, [user]);

  return { getMonthlyRecap, publishRecap, getPublicRecaps, toggleEncouragement };
}
