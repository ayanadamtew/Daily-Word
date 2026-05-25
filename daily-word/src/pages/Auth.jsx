import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CrossIcon from '../components/ui/CrossIcon';
import Button from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import useAppStore from '../store/appStore';

export default function Auth() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { signIn, signUp } = useAuth();
  const { user } = useAppStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error.message);
    } else {
      if (!name.trim()) { setError('Please enter your name'); setLoading(false); return; }
      const { error } = await signUp(email, password, name);
      if (error) setError(error.message);
      else setSuccess('Account created! Check your email to verify, then log in.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-500/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative w-full max-w-sm animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl glass mb-4">
            <CrossIcon size={36} />
          </div>
          <h1 className="text-3xl font-bold text-gradient">Daily Word</h1>
          <p className="text-surface-400 text-sm mt-2">Build real Bible reading habits</p>
        </div>

        {/* Form card */}
        <div className="glass rounded-2xl p-6">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-surface-800/50 rounded-xl p-1">
            <button
              onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'login' ? 'gradient-brand text-surface-950' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'signup' ? 'gradient-brand text-surface-950' : 'text-surface-400 hover:text-surface-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs text-surface-400 mb-1">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="How should we call you?"
                  className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-50 placeholder-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
                  id="auth-name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-surface-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-50 placeholder-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
                id="auth-email"
              />
            </div>

            <div>
              <label className="block text-xs text-surface-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-50 placeholder-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
                id="auth-password"
              />
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-2.5 text-sm text-rose-400 animate-fade-in">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5 text-sm text-emerald-400 animate-fade-in">
                {success}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading} id="auth-submit">
              {mode === 'login' ? 'Log In' : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-surface-600 mt-6">
          "Your word is a lamp to my feet and a light to my path." — Psalm 119:105
        </p>
      </div>
    </div>
  );
}
