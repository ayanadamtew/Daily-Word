import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useRecap } from '../hooks/useRecap';
import useAppStore from '../store/appStore';

const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// Sample data for the explore feed to demonstrate community features
const SAMPLE_RECAPS = [
  { id: 'sample-1', user_id: 'sample', year: 2026, month: 4, read_days: 28, total_days: 30, likes: 15, is_public: true, image_url: null, created_at: '2026-05-01T00:00:00Z', profiles: { name: 'Grace M.', church: 'Hope Community Church', avatar_url: null } },
  { id: 'sample-2', user_id: 'sample', year: 2026, month: 4, read_days: 22, total_days: 30, likes: 8, is_public: true, image_url: null, created_at: '2026-05-01T00:00:00Z', profiles: { name: 'David K.', church: 'New Life Fellowship', avatar_url: null } },
  { id: 'sample-3', user_id: 'sample', year: 2026, month: 4, read_days: 30, total_days: 30, likes: 42, is_public: true, image_url: null, created_at: '2026-05-01T00:00:00Z', profiles: { name: 'Sarah L.', church: 'Cornerstone Church', avatar_url: null } },
  { id: 'sample-4', user_id: 'sample', year: 2026, month: 3, read_days: 25, total_days: 31, likes: 11, is_public: true, image_url: null, created_at: '2026-04-01T00:00:00Z', profiles: { name: 'James W.', church: 'Hope Community Church', avatar_url: null } },
  { id: 'sample-5', user_id: 'sample', year: 2026, month: 3, read_days: 18, total_days: 31, likes: 5, is_public: true, image_url: null, created_at: '2026-04-01T00:00:00Z', profiles: { name: 'Ruth A.', church: 'Grace Bible Church', avatar_url: null } },
  { id: 'sample-6', user_id: 'sample', year: 2026, month: 4, read_days: 26, total_days: 30, likes: 19, is_public: true, image_url: null, created_at: '2026-05-02T00:00:00Z', profiles: { name: 'Esther N.', church: 'New Life Fellowship', avatar_url: null } },
];

export default function Explore() {
  const [recaps, setRecaps] = useState([]);
  const [filter, setFilter] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const { getPublicRecaps, toggleEncouragement } = useRecap();
  const { profile } = useAppStore();

  useEffect(() => {
    loadRecaps();
  }, [filter]);

  const loadRecaps = async () => {
    setLoading(true);
    const church = filter === 'church' ? profile?.church : null;
    const data = await getPublicRecaps(filter === 'church' ? 'recent' : filter, church);

    // Merge with sample data if no real data
    let finalData = data;
    if (data.length === 0) {
      finalData = SAMPLE_RECAPS;
      if (filter === 'faithful') {
        finalData = [...finalData].sort((a, b) => b.read_days - a.read_days);
      }
    }
    setRecaps(finalData);
    setLoading(false);
  };

  const handleLike = async (recapId) => {
    const isSample = recapId.startsWith('sample');
    if (isSample) {
      // Toggle locally for sample data
      setLikedIds(prev => {
        const next = new Set(prev);
        if (next.has(recapId)) next.delete(recapId);
        else next.add(recapId);
        return next;
      });
      setRecaps(prev => prev.map(r => {
        if (r.id === recapId) {
          const liked = likedIds.has(recapId);
          return { ...r, likes: liked ? r.likes - 1 : r.likes + 1 };
        }
        return r;
      }));
    } else {
      const liked = await toggleEncouragement(recapId);
      setLikedIds(prev => {
        const next = new Set(prev);
        if (liked) next.add(recapId);
        else next.delete(recapId);
        return next;
      });
      loadRecaps();
    }
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';
  const getPct = (read, total) => total > 0 ? Math.round((read / total) * 100) : 0;

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-surface-50">🌍 Explore</h2>
        <p className="text-sm text-surface-400 mt-1">Celebrate faithfulness together</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { key: 'recent', label: '🕐 Recent' },
          { key: 'faithful', label: '🏆 Most Faithful' },
          { key: 'church', label: '🏠 My Church' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`
              px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200
              ${filter === f.key ? 'gradient-brand text-surface-950' : 'glass-light text-surface-300 hover:text-surface-50'}
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Recap cards */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="skeleton rounded-2xl h-40" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {recaps.map((recap) => {
            const pct = getPct(recap.read_days, recap.total_days);
            const isLiked = likedIds.has(recap.id);
            return (
              <Card key={recap.id} className="space-y-3">
                {/* User info */}
                <div className="flex items-center gap-3">
                  {recap.profiles?.avatar_url ? (
                    <img src={recap.profiles.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-surface-950 font-bold text-sm">
                      {getInitial(recap.profiles?.name)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-surface-100">{recap.profiles?.name || 'Anonymous'}</p>
                    {recap.profiles?.church && (
                      <p className="text-xs text-surface-500">🏠 {recap.profiles.church}</p>
                    )}
                  </div>
                  <Badge color={pct >= 80 ? 'success' : pct >= 50 ? 'brand' : 'warning'}>
                    {pct}%
                  </Badge>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 glass-light rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-emerald-400">{recap.read_days}</p>
                    <p className="text-[10px] text-surface-500">Days Read</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-surface-400">
                      {monthNames[recap.month - 1]} {recap.year}
                    </p>
                  </div>
                  <div className="flex-1 glass-light rounded-xl p-2.5 text-center">
                    <p className="text-lg font-bold text-surface-400">{recap.total_days}</p>
                    <p className="text-[10px] text-surface-500">Total Days</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-1.5 bg-surface-800 rounded-full overflow-hidden">
                  <div className="h-full gradient-success rounded-full" style={{ width: `${pct}%` }} />
                </div>

                {/* Like button */}
                <button
                  onClick={() => handleLike(recap.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    transition-all duration-200 btn-press
                    ${isLiked
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                      : 'glass-light text-surface-400 hover:text-surface-200'
                    }
                  `}
                >
                  <span className={`transition-transform duration-200 ${isLiked ? 'scale-125' : ''}`}>
                    {isLiked ? '❤️' : '🤍'}
                  </span>
                  <span>Encourage</span>
                  {recap.likes > 0 && (
                    <span className="text-xs text-surface-500">({recap.likes + (isLiked ? 1 : 0)})</span>
                  )}
                </button>
              </Card>
            );
          })}

          {recaps.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-surface-500">No public recaps yet. Be the first to share!</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
