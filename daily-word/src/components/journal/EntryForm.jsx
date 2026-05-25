import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import PassagePicker from './PassagePicker';
import SuggestionGrid from './SuggestionGrid';
import { fetchPassage, buildReference } from '../../lib/bibleApi';
import useAppStore from '../../store/appStore';

export default function EntryForm({ onSave, loading }) {
  const { selectedPassage, clearSelectedPassage, profile } = useAppStore();
  const [passage, setPassage] = useState({ book: '', chapter: '', verse: '' });
  const [notes, setNotes] = useState('');
  const [passageText, setPassageText] = useState('');
  const [loadingPassage, setLoadingPassage] = useState(false);

  // Prefill from suggestion or selectedPassage
  useEffect(() => {
    if (selectedPassage) {
      setPassage(selectedPassage);
      clearSelectedPassage();
    }
  }, [selectedPassage, clearSelectedPassage]);

  // Fetch passage text when passage changes
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

  const handleSave = () => {
    if (!passage.book || !passage.chapter) return;
    onSave({
      book: passage.book,
      chapter: passage.chapter,
      verse: passage.verse,
      notes,
    });
  };

  return (
    <Card className="animate-slide-up">
      <h3 className="text-lg font-semibold text-surface-50 mb-4">📖 What did you read?</h3>

      <SuggestionGrid onSelect={handleSuggestionSelect} />

      <div className="my-4 flex items-center gap-3">
        <div className="flex-1 h-px bg-surface-700" />
        <span className="text-xs text-surface-500 uppercase tracking-wider">or choose freely</span>
        <div className="flex-1 h-px bg-surface-700" />
      </div>

      <PassagePicker value={passage} onChange={setPassage} />

      {/* Live passage preview */}
      {loadingPassage && (
        <div className="mt-3 p-3 rounded-xl bg-surface-800/50 animate-pulse">
          <div className="h-3 bg-surface-700 rounded w-3/4 mb-2" />
          <div className="h-3 bg-surface-700 rounded w-1/2" />
        </div>
      )}
      {passageText && !loadingPassage && (
        <div className="mt-3 p-4 rounded-xl bg-surface-800/50 border border-surface-700/50">
          <p className="text-xs text-brand-400 font-medium mb-1.5">
            {passage.book} {passage.chapter}{passage.verse ? `:${passage.verse}` : ''} ({profile?.bible_version || 'KJV'})
          </p>
          <p className="text-sm text-surface-300 leading-relaxed font-serif italic max-h-32 overflow-y-auto">
            {passageText.trim()}
          </p>
        </div>
      )}

      {/* Notes */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-surface-300 mb-1.5">
          Reflection Notes <span className="text-surface-500">(optional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What spoke to you? What did you learn?"
          rows={3}
          className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder-surface-500 focus:outline-none focus:border-brand-500 resize-none transition-colors"
          id="entry-notes"
        />
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full mt-4"
        onClick={handleSave}
        loading={loading}
        disabled={!passage.book || !passage.chapter}
        id="save-entry-btn"
      >
        Save Entry
      </Button>
    </Card>
  );
}
