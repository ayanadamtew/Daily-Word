import React, { useState } from 'react';
import { allBooks, getChapterCount } from '../../lib/bibleBooks';

export default function PassagePicker({ value, onChange }) {
  const [search, setSearch] = useState('');

  const filteredBooks = search
    ? allBooks.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : allBooks;

  const chapters = value.book ? Array.from({ length: getChapterCount(value.book) }, (_, i) => i + 1) : [];

  return (
    <div className="space-y-4">
      {/* Book selector */}
      <div>
        <label className="block text-sm font-medium text-surface-300 mb-1.5">Book</label>
        <div className="relative">
          <input
            type="text"
            value={search || value.book}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!e.target.value) onChange({ ...value, book: '', chapter: '', verse: '' });
            }}
            placeholder="Search books..."
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-50 placeholder-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
            id="passage-book-input"
          />
          {search && filteredBooks.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface-800 border border-surface-700 rounded-xl max-h-48 overflow-y-auto z-10 shadow-xl">
              {filteredBooks.map(book => (
                <button
                  key={book.name}
                  className="w-full text-left px-4 py-2 text-sm text-surface-200 hover:bg-surface-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                  onClick={() => {
                    onChange({ ...value, book: book.name, chapter: '', verse: '' });
                    setSearch('');
                  }}
                >
                  {book.name} <span className="text-surface-500 text-xs">({book.chapters} ch)</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {/* Chapter selector */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-surface-300 mb-1.5">Chapter</label>
          <select
            value={value.chapter}
            onChange={(e) => onChange({ ...value, chapter: e.target.value })}
            disabled={!value.book}
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-50 focus:outline-none focus:border-brand-500 disabled:opacity-50 transition-colors"
            id="passage-chapter-select"
          >
            <option value="">Ch.</option>
            {chapters.map(ch => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>

        {/* Verse input */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-surface-300 mb-1.5">Verse(s)</label>
          <input
            type="text"
            value={value.verse}
            onChange={(e) => onChange({ ...value, verse: e.target.value })}
            placeholder="e.g. 1-5"
            disabled={!value.chapter}
            className="w-full bg-surface-800 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-50 placeholder-surface-500 focus:outline-none focus:border-brand-500 disabled:opacity-50 transition-colors"
            id="passage-verse-input"
          />
        </div>
      </div>
    </div>
  );
}
