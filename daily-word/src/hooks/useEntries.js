import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import useAppStore from '../store/appStore';

export function useEntries() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(false);

  const getTodayStr = () => new Date().toISOString().split('T')[0];

  const fetchTodayEntry = useCallback(async () => {
    if (!user) return null;
    const { data } = await supabase
      .from('entries').select('*')
      .eq('user_id', user.id).eq('date', getTodayStr()).single();
    return data;
  }, [user]);

  const fetchRecentEntries = useCallback(async (days = 7) => {
    if (!user) return [];
    const start = new Date();
    start.setDate(start.getDate() - days);
    const { data } = await supabase
      .from('entries').select('*')
      .eq('user_id', user.id)
      .gte('date', start.toISOString().split('T')[0])
      .order('date', { ascending: false });
    return data || [];
  }, [user]);

  const fetchAllEntries = useCallback(async (filters = {}) => {
    if (!user) return [];
    let query = supabase.from('entries').select('*').eq('user_id', user.id).order('date', { ascending: false });
    if (filters.type) query = query.eq('type', filters.type);
    if (filters.book) query = query.ilike('book', `%${filters.book}%`);
    if (filters.limit) query = query.limit(filters.limit);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
    const { data } = await query;
    return data || [];
  }, [user]);

  const fetchEntriesForMonth = useCallback(async (year, month) => {
    if (!user) return [];
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const { data } = await supabase
      .from('entries').select('*')
      .eq('user_id', user.id)
      .gte('date', startDate).lte('date', endDate)
      .order('date', { ascending: true });
    return data || [];
  }, [user]);

  const createReadEntry = useCallback(async ({ book, chapter, verse, notes, customDate }) => {
    if (!user) return { error: 'Not authenticated' };
    setLoading(true);
    
    const dateStr = customDate || getTodayStr();
    
    // Check if entry already exists for the date
    const { data: existing, error: selectError } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .maybeSingle();

    console.log('createReadEntry check:', { existing, selectError, dateStr, userId: user.id });

    if (selectError) {
      console.error('Select error in createReadEntry:', selectError);
      setLoading(false);
      return { error: selectError };
    }

    let result;
    if (existing) {
      // Update
      console.log('Updating existing entry:', existing.id);
      result = await supabase
        .from('entries')
        .update({
          type: 'read',
          book,
          chapter,
          verse: verse || null,
          notes: notes || null,
          skip_reason: null
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert
      console.log('Inserting new entry');
      result = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          date: dateStr,
          type: 'read',
          book,
          chapter,
          verse: verse || null,
          notes: notes || null,
          skip_reason: null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    }
    
    console.log('createReadEntry result:', result);
    if (result.error) {
      console.error('Database Error details:', {
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint
      });
    }
    setLoading(false);
    return result;
  }, [user]);

  const createSkipEntry = useCallback(async (skipReason, customDate) => {
    if (!user) return { error: 'Not authenticated' };
    setLoading(true);
    
    const dateStr = customDate || getTodayStr();
    
    // Check if entry already exists for the date
    const { data: existing, error: selectError } = await supabase
      .from('entries')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', dateStr)
      .maybeSingle();

    console.log('createSkipEntry check:', { existing, selectError, dateStr, userId: user.id });

    if (selectError) {
      console.error('Select error in createSkipEntry:', selectError);
      setLoading(false);
      return { error: selectError };
    }

    let result;
    if (existing) {
      // Update
      console.log('Updating existing entry:', existing.id);
      result = await supabase
        .from('entries')
        .update({
          type: 'skip',
          book: null,
          chapter: null,
          verse: null,
          notes: null,
          skip_reason: skipReason
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert
      console.log('Inserting new entry');
      result = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          date: dateStr,
          type: 'skip',
          book: null,
          chapter: null,
          verse: null,
          notes: null,
          skip_reason: skipReason,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    }
    
    console.log('createSkipEntry result:', result);
    if (result.error) {
      console.error('Database Error details:', {
        code: result.error.code,
        message: result.error.message,
        details: result.error.details,
        hint: result.error.hint
      });
    }
    setLoading(false);
    return result;
  }, [user]);

  const fetchCatchUpDays = useCallback(async () => {
    if (!user) return [];
    
    const { data: latest, error } = await supabase
      .from('entries')
      .select('date')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (error || !latest) return [];
    
    const latestDate = new Date(latest.date + 'T00:00:00');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    latestDate.setHours(0,0,0,0);
    yesterday.setHours(0,0,0,0);
    
    if (latestDate >= yesterday) return [];
    
    const gapDates = [];
    let current = new Date(latestDate);
    current.setDate(current.getDate() + 1);
    
    while (current <= yesterday) {
      gapDates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    if (gapDates.length > 30) {
      return gapDates.slice(gapDates.length - 30);
    }
    
    return gapDates;
  }, [user]);

  return { loading, fetchTodayEntry, fetchRecentEntries, fetchAllEntries, fetchEntriesForMonth, createReadEntry, createSkipEntry, fetchCatchUpDays };
}
