import React, { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { supabase } from './lib/supabase';
import useAppStore from './store/appStore';

export default function App() {
  const { setUser, setProfile } = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        supabase.from('profiles').select('*').eq('id', currentUser.id).single()
          .then(({ data }) => { if (data) setProfile(data); });
      }
      setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        supabase.from('profiles').select('*').eq('id', currentUser.id).single()
          .then(({ data }) => { if (data) setProfile(data); });
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
