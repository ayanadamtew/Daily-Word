import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { useEntries } from '../hooks/useEntries';

export default function History() {
  const { fetchAllEntries } = useEntries();
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const loadEntries = useCallback(async (reset = false) => {
    setLoading(true);
    const offset = reset ? 0 : page * PAGE_SIZE;
    const filters = { limit: PAGE_SIZE, offset };
    if (filter !== 'all') filters.type = filter;
    if (search) filters.book = search;

    const data = await fetchAllEntries(filters);
    if (reset) {
      setEntries(data);
      setPage(1);
    } else {
      setEntries(prev => [...prev, ...data]);
      setPage(prev => prev + 1);
    }
    setHasMore(data.length === PAGE_SIZE);
    setLoading(false);
  }, [fetchAllEntries, filter, search, page]);

  useEffect(() => {
    loadEntries(true);
  }, [filter, search]);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-50">📅 History</h2>
        <p className="text-sm text-surface-400 mt-1">Your complete reading journal</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'read', 'skip'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
              ${filter === f ? 'gradient-brand text-surface-950' : 'glass-light text-surface-300 hover:text-surface-50'}
            `}
          >
            {f === 'all' ? '📋 All' : f === 'read' ? '📖 Read' : '⏭️ Skipped'}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by book name..."
          className="w-full bg-surface-800/50 border border-surface-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-surface-50 placeholder-surface-500 focus:outline-none focus:border-brand-500 transition-colors"
          id="history-search"
        />
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
            className={`
              glass-light rounded-xl p-4 cursor-pointer transition-all duration-200
              border-l-2 ${entry.type === 'read' ? 'border-l-emerald-500' : 'border-l-amber-500'}
              hover:bg-surface-700/50
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-surface-400">{formatDate(entry.date)}</p>
                {entry.type === 'read' ? (
                  <p className="text-sm font-medium text-surface-100 mt-0.5">
                    {entry.book} {entry.chapter}{entry.verse ? `:${entry.verse}` : ''}
                  </p>
                ) : (
                  <p className="text-sm text-surface-400 mt-0.5">{entry.skip_reason || 'No reason'}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge color={entry.type === 'read' ? 'success' : 'warning'}>
                  {entry.type === 'read' ? 'Read' : 'Skip'}
                </Badge>
                <svg className={`w-4 h-4 text-surface-500 transition-transform duration-200 ${expandedId === entry.id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Expanded content */}
            {expandedId === entry.id && entry.notes && (
              <div className="mt-3 pt-3 border-t border-surface-700/50 animate-fade-in">
                <p className="text-sm text-surface-300 font-serif italic leading-relaxed">"{entry.notes}"</p>
              </div>
            )}
          </div>
        ))}

        {entries.length === 0 && !loading && (
          <Card className="text-center py-8">
            <p className="text-surface-500">No entries found</p>
          </Card>
        )}

        {/* Load more */}
        {hasMore && entries.length > 0 && (
          <button
            onClick={() => loadEntries(false)}
            disabled={loading}
            className="w-full py-3 text-sm text-brand-400 hover:text-brand-300 transition-colors"
          >
            {loading ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}
