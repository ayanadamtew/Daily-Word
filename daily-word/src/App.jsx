import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { supabase } from './lib/supabase';
import useAppStore from './store/appStore';

export default function App() {
  const { setUser, setProfile } = useAppStore();
  const [ready, setReady] = useState(false);

  const loadOrCreateProfile = async (userId, email) => {
    try {
      console.log('loadOrCreateProfile starting for:', userId);
      const { data, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (selectError) {
        console.error('Error checking profile existence:', selectError);
      }

      if (data) {
        console.log('Profile found:', data);
        setProfile(data);
        return;
      }

      console.log('Profile not found, attempting auto-creation...');
      // Profile does not exist, auto-create it
      const fallbackName = email ? email.split('@')[0] : 'Faithful Reader';
      const newProfile = {
        id: userId,
        name: fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1),
        bible_version: 'NIV',
        is_public: false,
        created_at: new Date().toISOString()
      };

      const { data: inserted, error: insertError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        console.error('Failed to auto-create profile row in database:', insertError);
      }

      if (inserted) {
        console.log('Profile successfully auto-created:', inserted);
        setProfile(inserted);
      } else {
        console.warn('Profile insert returned no data, setting local fallback');
        setProfile(newProfile);
      }
    } catch (e) {
      console.error('Exception in loadOrCreateProfile:', e);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadOrCreateProfile(currentUser.id, currentUser.email);
      }
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        loadOrCreateProfile(currentUser.id, currentUser.email);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile]);

  if (!ready) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center animate-pulse">
          <div className="text-4xl mb-3">📖</div>
          <p className="text-surface-400 text-sm">Loading Daily Word...</p>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}
