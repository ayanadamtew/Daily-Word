import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PassagePicker from './PassagePicker';
import SuggestionGrid from './SuggestionGrid';
import { fetchPassage, buildReference } from '../../lib/bibleApi';
import useAppStore from '../../store/appStore';

const presetReasons = [
  { label: '🏃 Busy', value: 'Busy' },
  { label: '😴 Forgot', value: 'Forgot' },
  { label: '😔 Not feeling it', value: 'Not feeling it' },
  { label: '✈️ Traveling', value: 'Traveling' },
  { label: '🤒 Sick', value: 'Sick' },
  { label: '✏️ Other', value: 'other' },
];

export default function CatchUpFlow({ gapDates, onSaveRead, onSaveSkip, onComplete }) {
  const { profile } = useAppStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState(null); // 'read', 'skip', or null

  // Passage Picker states
  const [passage, setPassage] = useState({ book: '', chapter: '', verse: '' });
  const [notes, setNotes] = useState('');
  const [passageText, setPassageText] = useState('');
  const [loadingPassage, setLoadingPassage] = useState(false);
  const [saving, setSaving] = useState(false);

  // Skip States
  const [selectedSkipReason, setSelectedSkipReason] = useState('');
  const [customSkipReason, setCustomSkipReason] = useState('');

  const currentRawDate = gapDates[currentIndex];
  
  // Format Date beautifully
  const formatFriendlyDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Reset states when moving to a new day
  useEffect(() => {
    setMode(null);
    setPassage({ book: '', chapter: '', verse: '' });
    setNotes('');
    setPassageText('');
    setSelectedSkipReason('');
    setCustomSkipReason('');
  }, [currentIndex]);

  // Fetch scripture preview dynamically
  useEffect(() => {
    if (passage.book && passage.chapter) {
      const ref = buildReference(passage.book, passage.chapter, passage.verse);
      setLoadingPassage(true);
      fetchPassage(ref, profile?.bible_version || 'KJV')
        .then(data => {
          if (!data.error) setPassageText(data.text);
          else setPassageText('');
        })
        .finally(() => setLoadingPassage(false));
    } else {
      setPassageText('');
    }
  }, [passage.book, passage.chapter, passage.verse, profile?.bible_version]);

  const handleSuggestionSelect = (s) => {
    setPassage({ book: s.book, chapter: s.chapter, verse: s.verse || '' });
  };

  const handleSaveRead = async () => {
    if (!passage.book || !passage.chapter) return;
    setSaving(true);
    try {
      await onSaveRead({
        book: passage.book,
        chapter: passage.chapter,
        verse: passage.verse,
        notes,
        customDate: currentRawDate,
      });
      advance();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSkip = async () => {
    const reason = selectedSkipReason === 'other' ? customSkipReason : selectedSkipReason;
    if (!reason) return;
    setSaving(true);
    try {
      await onSaveSkip(reason, currentRawDate);
      advance();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const advance = () => {
    if (currentIndex + 1 >= gapDates.length) {
      onComplete();
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const progressPercent = Math.round(((currentIndex) / gapDates.length) * 100);

  // Greeting messages depending on size of gap
  const renderGreeting = () => {
    if (gapDates.length === 1) {
      return (
        <div className="text-center space-y-2 mb-6">
          <h2 className="text-2xl font-extrabold text-surface-50 tracking-tight">Welcome back! 👋</h2>
          <p className="text-sm text-surface-400">
            Before today, what happened yesterday — <span className="text-brand-400 font-semibold">{formatFriendlyDate(currentRawDate)}</span>?
          </p>
        </div>
      );
    }
    
    if (currentIndex === 0) {
      // First day of multi-day gap
      if (gapDates.length >= 7) {
        return (
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-2xl font-extrabold text-surface-50 tracking-tight font-serif italic text-brand-400">Welcome back, friend. 🌿</h2>
            <p className="text-sm text-surface-300">
              It looks like you've been away for a while. That's okay — let's catch up together.
            </p>
            <p className="text-xs text-surface-500">
              You have {gapDates.length} unlogged days. Let's fill them in, starting with <span className="text-brand-300">{formatFriendlyDate(currentRawDate)}</span>.
            </p>
          </div>
        );
      } else {
        return (
          <div className="text-center space-y-2 mb-6">
            <h2 className="text-2xl font-extrabold text-surface-50 tracking-tight">Let's catch up! 🗓</h2>
            <p className="text-sm text-surface-300">
              You have {gapDates.length} unlogged days. Let's fill them in together.
            </p>
            <p className="text-xs text-surface-400">
              First up: <span className="text-brand-400 font-semibold">{formatFriendlyDate(currentRawDate)}</span>
            </p>
          </div>
        );
      }
    }

    // Ongoing backfill days
    return (
      <div className="text-center space-y-1 mb-6">
        <span className="text-xs font-bold text-brand-400 tracking-wider uppercase">Next Unlogged Day</span>
        <h2 className="text-xl font-bold text-surface-50">{formatFriendlyDate(currentRawDate)}</h2>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto space-y-5 py-2 px-1 animate-fade-in">
      {/* 1. Header Progress Stepper */}
      <div className="glass rounded-2xl px-5 py-4 border border-surface-800/40">
        <div className="flex items-center justify-between text-xs text-surface-400 font-bold mb-2">
          <span>CATCH-UP FLOW</span>
          <span className="text-brand-400 font-mono">Day {currentIndex + 1} of {gapDates.length}</span>
        </div>
        
        {/* Animated Progress Bar */}
        <div className="w-full h-1.5 bg-surface-800 rounded-full overflow-hidden">
          <div 
            className="h-full gradient-brand rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${Math.round(((currentIndex + 1) / gapDates.length) * 100)}%` }}
          />
        </div>
      </div>

      {/* 2. Interactive Greeting */}
      {renderGreeting()}

      {/* 3. Stepper Content */}
      {mode === null ? (
        <Card className="flex flex-col gap-4 p-6 hover:shadow-glow/5 border border-surface-800/40 animate-slide-up">
          <h3 className="text-center text-sm font-semibold text-surface-300 uppercase tracking-widest mb-1">
            Choose Status for {new Date(currentRawDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </h3>
          
          <button
            onClick={() => setMode('read')}
            className="group flex flex-col items-center justify-center p-6 rounded-2xl border border-surface-700 bg-surface-900/60 hover:bg-surface-800/60 hover:border-brand-500/50 transition-all duration-300 text-center scale-in"
          >
            <span className="text-4xl mb-2 group-hover:scale-110 transition-transform duration-200">📖</span>
            <span className="text-base font-bold text-surface-100">I Read Today</span>
            <span className="text-xs text-surface-500 mt-1 max-w-[200px]">Log your bible passage and reflection notes</span>
          </button>

          <button
            onClick={() => setMode('skip')}
            className="group flex flex-col items-center justify-center p-5 rounded-2xl border border-surface-800 bg-surface-950/20 hover:bg-surface-900/40 hover:border-surface-700 transition-all duration-300 text-center scale-in"
          >
            <span className="text-3xl mb-1.5 group-hover:rotate-12 transition-transform duration-200">⏭️</span>
            <span className="text-sm font-semibold text-surface-300">I Skipped</span>
            <span className="text-xs text-surface-500 mt-0.5 max-w-[200px]">Be honest with your habits to build consistency</span>
          </button>
        </Card>
      ) : mode === 'read' ? (
        <Card className="animate-slide-up space-y-4 border border-surface-800/40">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-surface-50">📖 What did you read?</h3>
            <button 
              onClick={() => setMode(null)} 
              className="text-xs font-semibold text-surface-400 hover:text-brand-400 transition-colors"
            >
              ← Back
            </button>
          </div>

          <SuggestionGrid onSelect={handleSuggestionSelect} />

          <div className="flex items-center gap-3 py-1">
            <div className="flex-1 h-px bg-surface-800" />
            <span className="text-[10px] text-surface-500 uppercase tracking-widest">or choose freely</span>
            <div className="flex-1 h-px bg-surface-800" />
          </div>

          <PassagePicker value={passage} onChange={setPassage} />

          {/* Live Scripture Preview */}
          {loadingPassage && (
            <div className="p-3 rounded-xl bg-surface-800/40 border border-surface-700/20 animate-pulse">
              <div className="h-3 bg-surface-800 rounded w-3/4 mb-1.5" />
              <div className="h-3 bg-surface-800 rounded w-1/2" />
            </div>
          )}
          {passageText && !loadingPassage && (
            <div className="p-4 rounded-xl bg-surface-800/40 border border-surface-700/30">
              <p className="text-xs text-brand-400 font-bold mb-1">
                {passage.book} {passage.chapter}{passage.verse ? `:${passage.verse}` : ''} ({profile?.bible_version || 'KJV'})
              </p>
              <p className="text-xs text-surface-300 leading-relaxed font-serif italic max-h-24 overflow-y-auto">
                {passageText.trim()}
              </p>
            </div>
          )}

          {/* Reflection textarea */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-surface-400 uppercase tracking-wide">
              Reflection Notes <span className="text-surface-600">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What spoke to you? What did you learn?"
              rows={3}
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder-surface-500 focus:outline-none focus:border-brand-500 resize-none transition-colors"
            />
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full mt-2"
            onClick={handleSaveRead}
            loading={saving}
            disabled={!passage.book || !passage.chapter}
          >
            Save Entry
          </Button>
        </Card>
      ) : (
        <Card className="animate-slide-up border border-surface-800/40">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-surface-50">⏭️ That's okay!</h3>
              <p className="text-xs text-surface-400 mt-0.5">Being honest is part of the journey. What happened?</p>
            </div>
            <button 
              onClick={() => setMode(null)} 
              className="text-xs font-semibold text-surface-400 hover:text-brand-400 transition-colors"
            >
              ← Back
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 my-4">
            {presetReasons.map((reason) => (
              <button
                key={reason.value}
                onClick={() => setSelectedSkipReason(reason.value)}
                className={`
                  p-3 rounded-xl text-xs text-left transition-all duration-200 font-medium
                  ${selectedSkipReason === reason.value
                    ? 'bg-brand-500/15 border-brand-500/50 text-brand-300'
                    : 'glass-light text-surface-300 hover:bg-surface-700/50'
                  }
                  border border-transparent
                `}
              >
                {reason.label}
              </button>
            ))}
          </div>

          {selectedSkipReason === 'other' && (
            <textarea
              value={customSkipReason}
              onChange={(e) => setCustomSkipReason(e.target.value)}
              placeholder="Tell us more..."
              rows={2}
              className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder-surface-500 focus:outline-none focus:border-brand-500 resize-none mb-4 transition-colors"
            />
          )}

          <Button
            variant="primary"
            size="lg"
            className="w-full mt-2"
            onClick={handleSaveSkip}
            loading={saving}
            disabled={!selectedSkipReason || (selectedSkipReason === 'other' && !customSkipReason)}
          >
            Save Day
          </Button>
        </Card>
      )}
    </div>
  );
}
