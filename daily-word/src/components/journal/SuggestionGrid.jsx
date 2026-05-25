import React from 'react';
import { getDailySuggestions } from '../../lib/suggestions';

export default function SuggestionGrid({ onSelect }) {
  const suggestions = getDailySuggestions();

  return (
    <div>
      <p className="text-sm font-medium text-surface-400 mb-2">💡 Today's Suggestions</p>
      <div className="grid grid-cols-2 gap-2">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelect({ book: s.book, chapter: s.chapter, verse: s.verse })}
            className="glass-light rounded-xl p-3 text-left card-hover group"
            id={`suggestion-${i}`}
          >
            <p className="text-xs text-brand-400 font-medium group-hover:text-brand-300 transition-colors">
              {s.book} {s.chapter}{s.verse ? `:${s.verse}` : ''}
            </p>
            <p className="text-xs text-surface-400 mt-0.5 leading-snug">{s.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
