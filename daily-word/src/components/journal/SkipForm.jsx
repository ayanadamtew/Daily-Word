import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const presetReasons = [
  { label: '🏃 Busy', value: 'Busy' },
  { label: '😴 Forgot', value: 'Forgot' },
  { label: '😔 Not feeling it', value: 'Not feeling it' },
  { label: '✈️ Traveling', value: 'Traveling' },
  { label: '🤒 Sick', value: 'Sick' },
  { label: '✏️ Other', value: 'other' },
];

export default function SkipForm({ onSave, loading }) {
  const [selected, setSelected] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleSave = () => {
    const reason = selected === 'other' ? customReason : selected;
    if (!reason) return;
    onSave(reason);
  };

  return (
    <Card className="animate-slide-up">
      <h3 className="text-lg font-semibold text-surface-50 mb-1">⏭️ That's okay!</h3>
      <p className="text-sm text-surface-400 mb-4">Being honest is part of the journey. What happened?</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {presetReasons.map((reason) => (
          <button
            key={reason.value}
            onClick={() => setSelected(reason.value)}
            className={`
              p-3 rounded-xl text-sm text-left transition-all duration-200
              ${selected === reason.value
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

      {selected === 'other' && (
        <textarea
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="Tell us more (optional)..."
          rows={2}
          className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 text-sm text-surface-50 placeholder-surface-500 focus:outline-none focus:border-brand-500 resize-none mb-4 transition-colors"
        />
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full"
        onClick={handleSave}
        loading={loading}
        disabled={!selected || (selected === 'other' && !customReason)}
        id="save-skip-btn"
      >
        Save
      </Button>
    </Card>
  );
}
