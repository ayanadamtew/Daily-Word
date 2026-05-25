import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { useGroups } from '../hooks/useGroups';
import useAppStore from '../store/appStore';

export default function Groups() {
  const { user } = useAppStore();
  const {
    createGroup,
    joinGroup,
    leaveGroup,
    removeMember,
    closeGroup,
    fetchUserGroups,
    fetchGroupDetails,
    fetchGroupActivity,
    toggleReaction,
    fetchGroupStats
  } = useGroups();

  // Navigation states
  const [joinedGroups, setJoinedGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null); // Full group object
  const [groupDetails, setGroupDetails] = useState(null); // Group info + members
  const [activity, setActivity] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' | 'members' | 'stats'
  
  // Loading states
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form states
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupChurch, setGroupChurch] = useState('');
  const [formError, setFormError] = useState('');

  // Initial load
  useEffect(() => {
    loadGroups();
  }, []);

  // Reload details when active group or active tab changes
  useEffect(() => {
    if (selectedGroup) {
      loadGroupData(selectedGroup.id);
    }
  }, [selectedGroup]);

  const loadGroups = async () => {
    setLoadingList(true);
    const groups = await fetchUserGroups();
    setJoinedGroups(groups);
    setLoadingList(false);
  };

  const loadGroupData = async (groupId) => {
    setLoadingDetail(true);
    const [details, feed, statistics] = await Promise.all([
      fetchGroupDetails(groupId),
      fetchGroupActivity(groupId),
      fetchGroupStats(groupId)
    ]);
    setGroupDetails(details);
    setActivity(feed);
    setStats(statistics);
    setLoadingDetail(false);
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!groupName.trim()) {
      setFormError('Please enter a group name');
      return;
    }
    setActionLoading(true);
    const { data, error } = await createGroup(groupName, groupDesc, groupChurch);
    setActionLoading(false);
    
    if (error) {
      setFormError(error.message || 'Failed to create group');
    } else {
      setShowCreateModal(false);
      setGroupName('');
      setGroupDesc('');
      setGroupChurch('');
      loadGroups();
      if (data) setSelectedGroup(data);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!inviteCodeInput.trim()) {
      setFormError('Please enter a 6-digit code');
      return;
    }
    setActionLoading(true);
    const { data, error } = await joinGroup(inviteCodeInput);
    setActionLoading(false);

    if (error) {
      setFormError(error.message || 'Failed to join group');
    } else {
      setShowJoinModal(false);
      setInviteCodeInput('');
      loadGroups();
      // Select the joined group (needs fetching all groups first to get info)
      const freshGroups = await fetchUserGroups();
      setJoinedGroups(freshGroups);
      const found = freshGroups.find(g => g.id === data.group_id);
      if (found) setSelectedGroup(found);
    }
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup) return;
    setActionLoading(true);
    const { error } = await leaveGroup(selectedGroup.id);
    setActionLoading(false);
    if (!error) {
      setSelectedGroup(null);
      setGroupDetails(null);
      loadGroups();
    }
  };

  const handleRemoveMember = async (memberUserId) => {
    if (!selectedGroup) return;
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember(selectedGroup.id, memberUserId);
      loadGroupData(selectedGroup.id);
    }
  };

  const handleCloseGroup = async () => {
    if (!selectedGroup) return;
    setActionLoading(true);
    const { error } = await closeGroup(selectedGroup.id);
    setActionLoading(false);
    if (!error) {
      setShowDeleteModal(false);
      setSelectedGroup(null);
      setGroupDetails(null);
      loadGroups();
    }
  };

  const handleReact = async (entryId) => {
    // Optimistic UI updates
    setActivity(prev => prev.map(item => {
      if (item.id === entryId) {
        const diff = item.hasReacted ? -1 : 1;
        return {
          ...item,
          hasReacted: !item.hasReacted,
          reactionsCount: Math.max(0, item.reactionsCount + diff)
        };
      }
      return item;
    }));

    await toggleReaction(entryId);
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert('Invite code copied to clipboard!');
  };

  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 1. Header Navigation */}
      <div>
        <div className="flex items-center gap-2">
          {selectedGroup && (
            <button
              onClick={() => { setSelectedGroup(null); setGroupDetails(null); }}
              className="p-1 rounded-lg hover:bg-surface-700 transition-colors text-surface-400 hover:text-surface-100 mr-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-surface-50">
              {selectedGroup ? selectedGroup.name : '👥 Study Groups'}
            </h2>
            <p className="text-sm text-surface-400 mt-0.5">
              {selectedGroup
                ? selectedGroup.church ? `🏠 ${selectedGroup.church}` : 'Private Study'
                : 'Study & grow in scripture together'
              }
            </p>
          </div>
        </div>
      </div>

      {/* 2. Group Selection List (Dashboard View) */}
      {!selectedGroup && (
        <div className="space-y-4">
          {/* Quick Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="md"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => { setFormError(''); setShowJoinModal(true); }}
            >
              <span>🔑 Join Group</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              className="w-full flex items-center justify-center gap-2"
              onClick={() => { setFormError(''); setShowCreateModal(true); }}
            >
              <span>➕ Create Group</span>
            </Button>
          </div>

          {/* Groups List */}
          {loadingList ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2].map(i => <div key={i} className="skeleton rounded-2xl h-24" />)}
            </div>
          ) : joinedGroups.length === 0 ? (
            <Card className="text-center py-12 space-y-4">
              <div className="text-4xl">👥</div>
              <div>
                <p className="font-semibold text-surface-200">No Groups Joined Yet</p>
                <p className="text-sm text-surface-500 mt-1">Create a group or join your church circle to start sharing.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {joinedGroups.map(group => (
                <Card
                  key={group.id}
                  className="flex items-center justify-between hover:border-brand-500/30 hover:bg-surface-800/40 cursor-pointer transition-all duration-200"
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="space-y-1">
                    <p className="font-bold text-surface-100">{group.name}</p>
                    {group.church && (
                      <p className="text-xs text-surface-400">🏠 {group.church}</p>
                    )}
                    {group.description && (
                      <p className="text-xs text-surface-500 line-clamp-1">{group.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-surface-500 uppercase tracking-widest block">Invite Code</span>
                      <span className="font-mono text-sm font-semibold text-brand-400">{group.invite_code}</span>
                    </div>
                    <svg className="w-5 h-5 text-surface-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Selected Group Detail View */}
      {selectedGroup && (
        <div className="space-y-4">
          {/* Header Card with Invite Code & Settings */}
          <Card className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-surface-50">{selectedGroup.name}</h3>
                {selectedGroup.description && (
                  <p className="text-sm text-surface-400">{selectedGroup.description}</p>
                )}
              </div>
              
              {/* Settings / Actions */}
              <div className="flex gap-2">
                {selectedGroup.created_by === user.id ? (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/25 transition-all text-xs font-semibold btn-press"
                  >
                    🗑️ Close Group
                  </button>
                ) : (
                  <button
                    onClick={handleLeaveGroup}
                    className="p-2 rounded-xl bg-surface-800 text-surface-400 border border-surface-700 hover:text-surface-100 hover:border-surface-600 transition-all text-xs font-semibold btn-press"
                  >
                    🚪 Leave
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-surface-800 pt-3 text-xs">
              <div className="flex items-center gap-1.5 text-surface-400">
                <span>🔑 Invite Code:</span>
                <span className="font-mono font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">{selectedGroup.invite_code}</span>
                <button
                  onClick={() => copyCode(selectedGroup.invite_code)}
                  className="p-1 text-surface-400 hover:text-brand-400 transition-colors"
                >
                  📋
                </button>
              </div>
              <span className="text-surface-500">
                Created: {new Date(selectedGroup.created_at).toLocaleDateString()}
              </span>
            </div>
          </Card>

          {/* Navigation Tabs */}
          <div className="flex gap-1 bg-surface-800/50 rounded-xl p-1">
            {[
              { id: 'feed', label: '📖 Activity Feed' },
              { id: 'members', label: '👥 Members' },
              { id: 'stats', label: '📊 Statistics' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'gradient-brand text-surface-950 shadow-md shadow-brand-500/10'
                    : 'text-surface-400 hover:text-surface-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          {loadingDetail ? (
            <div className="space-y-4 animate-pulse">
              <div className="skeleton rounded-2xl h-48" />
              <div className="skeleton rounded-2xl h-24" />
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Tab 1: Activity Feed */}
              {activeTab === 'feed' && (
                <div className="space-y-3">
                  {activity.length === 0 ? (
                    <Card className="text-center py-10">
                      <p className="text-surface-500">No activity yet. Readings logged after members join will appear here.</p>
                    </Card>
                  ) : (
                    activity.map(entry => (
                      <Card key={entry.id} className="space-y-3">
                        {/* Member Header */}
                        <div className="flex items-center gap-2.5">
                          {entry.avatarUrl ? (
                            <img src={entry.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-surface-950 font-bold text-xs">
                              {getInitial(entry.userName)}
                            </div>
                          )}
                          <div className="flex-1">
                            <span className="text-sm font-semibold text-surface-100">{entry.userName}</span>
                            <span className="text-[10px] text-surface-500 block">
                              {new Date(entry.date + 'T00:00:00').toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </span>
                          </div>
                          <Badge color={entry.type === 'read' ? 'success' : 'warning'}>
                            {entry.type === 'read' ? 'READ' : 'SKIPPED'}
                          </Badge>
                        </div>

                        {/* Reflections Details */}
                        {entry.type === 'read' ? (
                          <div className="glass-light rounded-xl p-3 space-y-2 border border-surface-700/30">
                            <p className="text-sm font-bold text-brand-400">📖 {entry.book} {entry.chapter}{entry.verse ? `:${entry.verse}` : ''}</p>
                            {entry.notes && (
                              <p className="text-sm text-surface-200 italic leading-relaxed">"{entry.notes}"</p>
                            )}
                          </div>
                        ) : (
                          <div className="glass-light rounded-xl p-3 border border-surface-700/20 text-xs text-surface-400">
                            ⏭️ Skipped today's suggestion. Reason: <span className="text-surface-300 font-semibold">{entry.skip_reason || 'No reason specified'}</span>
                          </div>
                        )}

                        {/* Encouragement Reaction */}
                        <div className="flex items-center justify-between pt-1">
                          <button
                            onClick={() => handleReact(entry.id)}
                            className={`
                              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                              transition-all btn-press
                              ${entry.hasReacted
                                ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30'
                                : 'glass-light text-surface-400 hover:text-surface-200'
                              }
                            `}
                          >
                            <span>🙏 Prayer hands</span>
                            {entry.reactionsCount > 0 && (
                              <span className="text-[10px] bg-surface-700 text-surface-300 px-1.5 py-0.5 rounded-full font-bold">
                                {entry.reactionsCount}
                              </span>
                            )}
                          </button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Members Grid */}
              {activeTab === 'members' && groupDetails && (
                <Card className="space-y-4">
                  <h4 className="text-sm font-bold text-surface-300">Active Members ({groupDetails.members.length})</h4>
                  <div className="space-y-3">
                    {groupDetails.members.map(member => {
                      const isAdmin = selectedGroup.created_by === member.userId;
                      const isMe = member.userId === user.id;

                      return (
                        <div
                          key={member.userId}
                          className="flex items-center justify-between border-b border-surface-800/60 pb-3 last:border-b-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover" />
                            ) : (
                              <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-surface-950 font-bold text-xs">
                                {getInitial(member.name)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-surface-100">{member.name}</span>
                                {isMe && <span className="text-[10px] bg-surface-700 text-surface-400 px-1.5 py-0.2 rounded-full">Me</span>}
                                {isAdmin && <span className="text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20 px-1.5 py-0.2 rounded-full">Admin</span>}
                              </div>
                              <span className="text-[10px] text-surface-500 block">Joined {new Date(member.joinedAt).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Member Today Status or Admin remove member controls */}
                          <div className="flex items-center gap-3">
                            {/* Daily Status Indicator */}
                            <div className="text-right">
                              <span className="text-[9px] text-surface-500 uppercase tracking-widest block mb-0.5">Today</span>
                              {member.todayStatus === 'read' ? (
                                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">✅ Read</span>
                              ) : member.todayStatus === 'skip' ? (
                                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">✗ Skipped</span>
                              ) : (
                                <span className="text-xs bg-surface-800 text-surface-500 px-2 py-0.5 rounded-full font-bold">· No entry</span>
                              )}
                            </div>

                            {/* Admin Remove Button */}
                            {selectedGroup.created_by === user.id && !isAdmin && (
                              <button
                                onClick={() => handleRemoveMember(member.userId)}
                                className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
                                title="Remove member"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Tab 3: Group Statistics */}
              {activeTab === 'stats' && stats && (
                <div className="space-y-4">
                  {/* Group Combined Stats Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="text-center p-4">
                      <p className="text-2xl font-bold text-emerald-400">{stats.totalGroupReadDays}</p>
                      <p className="text-[10px] text-surface-500 uppercase tracking-wider mt-1">📖 Total Read Days</p>
                    </Card>
                    <Card className="text-center p-4">
                      <p className="text-2xl font-bold text-amber-400">{stats.totalGroupSkipDays}</p>
                      <p className="text-[10px] text-surface-500 uppercase tracking-wider mt-1">⏭️ Total Skip Days</p>
                    </Card>
                  </div>

                  {/* Leaderboard Consistency */}
                  <Card className="space-y-4">
                    <h4 className="text-sm font-bold text-surface-300">🏆 Consistency Leaderboard</h4>
                    <div className="space-y-3">
                      {stats.leaderboard.map((item, index) => {
                        const pct = item.totalDaysActive > 0
                          ? Math.round((item.readCount / item.totalDaysActive) * 100)
                          : 0;

                        return (
                          <div key={item.userId} className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-brand-400 w-4">{index + 1}.</span>
                                {item.avatarUrl ? (
                                  <img src={item.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center text-surface-950 font-bold text-[10px]">
                                    {getInitial(item.name)}
                                  </div>
                                )}
                                <span className="font-semibold text-surface-200">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-surface-400">{item.readCount} read days</span>
                                <Badge color={pct >= 85 ? 'success' : pct >= 50 ? 'brand' : 'warning'}>
                                  {pct}% Consistent
                                </Badge>
                              </div>
                            </div>
                            {/* Tiny progress bar */}
                            <div className="h-1 bg-surface-800 rounded-full overflow-hidden">
                              <div className="h-full gradient-success rounded-full" style={{ width: `${Math.min(100, pct)}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              )}

            </div>
          )}
        </div>
      )}

      {/* --- Modals Section --- */}

      {/* 1. Join Group Modal */}
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="🔑 Join Study Group">
        <form onSubmit={handleJoinGroup} className="space-y-4">
          <div>
            <label className="block text-xs text-surface-400 mb-1.5">Enter 6-Digit Invite Code</label>
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
              placeholder="E.G. A4B6C9"
              maxLength={6}
              className="w-full bg-surface-850 border border-surface-700 rounded-xl px-4 py-3 text-center font-mono text-lg font-bold text-brand-400 focus:outline-none focus:border-brand-500 transition-colors uppercase placeholder-surface-600"
              id="invite-code-input"
            />
          </div>
          {formError && (
            <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
              {formError}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="md" className="flex-1" type="button" onClick={() => setShowJoinModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" className="flex-1" type="submit" loading={actionLoading} id="join-submit">
              Join Group
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Create Group Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="➕ Create Study Group">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-surface-400 mb-1">Group Name</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Youth Church Bethel, Family Study..."
                className="w-full bg-surface-850 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-50 focus:outline-none focus:border-brand-500 transition-colors placeholder-surface-500"
                id="create-group-name"
              />
            </div>
            <div>
              <label className="block text-xs text-surface-400 mb-1">Church / Fellowship (Optional)</label>
              <input
                type="text"
                value={groupChurch}
                onChange={(e) => setGroupChurch(e.target.value)}
                placeholder="Bethel Temple..."
                className="w-full bg-surface-850 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-50 focus:outline-none focus:border-brand-500 transition-colors placeholder-surface-500"
                id="create-group-church"
              />
            </div>
            <div>
              <label className="block text-xs text-surface-400 mb-1">Description</label>
              <textarea
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="Daily reading group for accountability and discussion..."
                rows={3}
                className="w-full bg-surface-850 border border-surface-700 rounded-xl px-4 py-2.5 text-sm text-surface-50 focus:outline-none focus:border-brand-500 transition-colors placeholder-surface-500"
                id="create-group-desc"
              />
            </div>
          </div>
          {formError && (
            <div className="text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
              {formError}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="md" className="flex-1" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" className="flex-1" type="submit" loading={actionLoading} id="create-submit">
              Create Group
            </Button>
          </div>
        </form>
      </Modal>

      {/* 3. Delete/Close Group Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="⚠️ Close Study Group?">
        <div className="space-y-4">
          <p className="text-sm text-surface-300">
            Are you absolutely sure you want to close this group? This will permanently delete the group, all member connections, activity logs, reactions, and statistics. 
          </p>
          <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2.5 rounded-xl font-medium">
            This action is irreversible and will remove all members from the group immediately.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="md" className="flex-1" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="md" className="flex-1" onClick={handleCloseGroup} loading={actionLoading}>
              Yes, Delete Group
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
