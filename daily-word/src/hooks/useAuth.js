import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import useAppStore from '../store/appStore';

export function useAuth() {
  const { user, profile, setUser, setProfile } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) setProfile(data);
  };

  const signUp = async (email, password, name) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { setLoading(false); return { error }; }
    // Create profile
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, name, bible_version: 'NIV', is_public: false, created_at: new Date().toISOString() });
      await fetchProfile(data.user.id);
    }
    setLoading(false);
    return { data };
  };

  const signIn = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  const updateProfile = async (updates) => {
    if (!user) return { error: 'Not authenticated' };
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', user.id).select().single();
    if (data) setProfile(data);
    return { data, error };
  };
  const uploadAvatar = async (file) => {
    if (!user) return { error: 'Not authenticated' };
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${user.id}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (uploadError) return { error: uploadError };
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
    await updateProfile({ avatar_url: publicUrl });
    return { url: publicUrl };
  };

  const deleteAccount = async () => {
    if (!user) return;
    await supabase.from('entries').delete().eq('user_id', user.id);
    await supabase.from('recaps').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return { user, profile, loading, signUp, signIn, signOut, updateProfile, uploadAvatar, deleteAccount, fetchProfile };
}
