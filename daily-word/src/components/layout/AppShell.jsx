import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';
import useAppStore from '../../store/appStore';

export default function AppShell() {
  const { user } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/auth');
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-lg mx-auto px-4 pb-24 pt-2">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
