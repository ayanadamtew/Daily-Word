import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import useAppStore from '../store/appStore';

export function useGroups() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(false);

  // Helper to generate a unique 6-character uppercase alphanumeric code
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const createGroup = useCallback(async (name, description, church) => {
    if (!user) return { error: { message: 'Not authenticated' } };
    setLoading(true);

    try {
      const inviteCode = generateInviteCode();
      
      // 1. Insert the group
      const { data: group, error: groupErr } = await supabase
        .from('groups')
        .insert({
          name,
          description: description || null,
          church: church || null,
          invite_code: inviteCode,
          created_by: user.id
        })
        .select()
        .single();

      if (groupErr) throw groupErr;

      // 2. Add the creator to group_members
      const { error: memberErr } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id
        });

      if (memberErr) throw memberErr;

      setLoading(false);
      return { data: group };
    } catch (err) {
      console.error('Error creating group:', err);
      setLoading(false);
      return { error: err };
    }
  }, [user]);

  const joinGroup = useCallback(async (inviteCode) => {
    if (!user) return { error: { message: 'Not authenticated' } };
    setLoading(true);

    try {
      const upperCode = inviteCode.trim().toUpperCase();

      // 1. Get the group by invite code
      const { data: group, error: findErr } = await supabase
        .from('groups')
        .select('id')
        .eq('invite_code', upperCode)
        .maybeSingle();

      if (findErr) throw findErr;
      if (!group) throw new Error('Invalid invite code. Group not found.');

      // 2. Add user to group members
      const { data: membership, error: joinErr } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id
        })
        .select()
        .single();

      if (joinErr) {
        if (joinErr.code === '23505') {
          throw new Error('You are already a member of this group!');
        }
        throw joinErr;
      }

      setLoading(false);
      return { data: membership };
    } catch (err) {
      console.error('Error joining group:', err);
      setLoading(false);
      return { error: err };
    }
  }, [user]);

  const leaveGroup = useCallback(async (groupId) => {
    if (!user) return { error: { message: 'Not authenticated' } };
    setLoading(true);

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id);

    setLoading(false);
    return { error };
  }, [user]);

  const removeMember = useCallback(async (groupId, memberUserId) => {
    if (!user) return { error: { message: 'Not authenticated' } };
    setLoading(true);

    // SQL policy ensures only the creator/admin can delete someone else's membership row
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', memberUserId);

    setLoading(false);
    return { error };
  }, [user]);

  const closeGroup = useCallback(async (groupId) => {
    if (!user) return { error: { message: 'Not authenticated' } };
    setLoading(true);

    // SQL policy ensures only the creator/admin can delete the group
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId);

    setLoading(false);
    return { error };
  }, [user]);

  const fetchUserGroups = useCallback(async () => {
    if (!user) return [];
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups (
            id,
            name,
            description,
            church,
            invite_code,
            created_by,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setLoading(false);
      return data.map(item => item.groups).filter(Boolean);
    } catch (err) {
      console.error('Error fetching user groups:', err);
      setLoading(false);
      return [];
    }
  }, [user]);

  const fetchGroupDetails = useCallback(async (groupId) => {
    if (!user) return null;
    setLoading(true);

    try {
      // 1. Fetch group general details
      const { data: group, error: groupErr } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupErr) throw groupErr;

      // 2. Fetch all members with their profiles
      const { data: members, error: membersErr } = await supabase
        .from('group_members')
        .select(`
          user_id,
          joined_at,
          profiles (
            id,
            name,
            avatar_url,
            church
          )
        `)
        .eq('group_id', groupId);

      if (membersErr) throw membersErr;

      // 3. Fetch today's entry status for each member
      const todayStr = new Date().toISOString().split('T')[0];
      const memberIds = members.map(m => m.user_id);

      const { data: todayEntries, error: entriesErr } = await supabase
        .from('entries')
        .select('user_id, type')
        .in('user_id', memberIds)
        .eq('date', todayStr);

      if (entriesErr) throw entriesErr;

      // Map today's status back to members
      const statusMap = {};
      todayEntries?.forEach(entry => {
        statusMap[entry.user_id] = entry.type; // 'read' or 'skip'
      });

      const formattedMembers = members.map(m => ({
        userId: m.user_id,
        joinedAt: m.joined_at,
        name: m.profiles?.name || 'Anonymous',
        avatarUrl: m.profiles?.avatar_url || null,
        church: m.profiles?.church || null,
        todayStatus: statusMap[m.user_id] || 'none' // 'read', 'skip', or 'none'
      }));

      setLoading(false);
      return {
        ...group,
        members: formattedMembers
      };
    } catch (err) {
      console.error('Error fetching group details:', err);
      setLoading(false);
      return null;
    }
  }, [user]);

  const fetchGroupActivity = useCallback(async (groupId) => {
    if (!user) return [];
    setLoading(true);

    try {
      // 1. Get all members in the group
      const { data: members, error: membersErr } = await supabase
        .from('group_members')
        .select('user_id, joined_at')
        .eq('group_id', groupId);

      if (membersErr) throw membersErr;

      // 2. Fetch activity entries from members.
      // Privacy check: Entries must be strictly after the member's joined_at date.
      // To satisfy this, we fetch all entries and filter locally or construct an OR query.
      // Since it's within a group, fetching recent entries is fast.
      const memberIds = members.map(m => m.user_id);
      const { data: entries, error: entriesErr } = await supabase
        .from('entries')
        .select(`
          id,
          user_id,
          date,
          type,
          book,
          chapter,
          verse,
          notes,
          skip_reason,
          created_at,
          profiles (
            name,
            avatar_url
          )
        `)
        .in('user_id', memberIds)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100);

      if (entriesErr) throw entriesErr;

      // Map joined dates for easy privacy verification
      const joinMap = {};
      members.forEach(m => {
        joinMap[m.user_id] = new Date(m.joined_at).toISOString().split('T')[0];
      });

      // Filter entries based on the privacy rule: entry date >= joined date
      const visibleEntries = entries.filter(entry => {
        const joinDateStr = joinMap[entry.user_id];
        return entry.date >= joinDateStr;
      });

      // 3. Fetch reactions for these entries
      const entryIds = visibleEntries.map(e => e.id);
      let reactions = [];
      if (entryIds.length > 0) {
        const { data: rxns, error: rxnsErr } = await supabase
          .from('group_reactions')
          .select('entry_id, user_id')
          .in('entry_id', entryIds);
        if (!rxnsErr) reactions = rxns || [];
      }

      // Format entries with reactions and like status
      const formattedActivity = visibleEntries.map(e => {
        const entryRxns = reactions.filter(r => r.entry_id === e.id);
        const hasReacted = entryRxns.some(r => r.user_id === user.id);
        return {
          ...e,
          userName: e.profiles?.name || 'Anonymous',
          avatarUrl: e.profiles?.avatar_url || null,
          reactionsCount: entryRxns.length,
          hasReacted
        };
      });

      setLoading(false);
      return formattedActivity;
    } catch (err) {
      console.error('Error fetching group activity:', err);
      setLoading(false);
      return [];
    }
  }, [user]);

  const toggleReaction = useCallback(async (entryId) => {
    if (!user) return false;

    try {
      // Check if reaction exists
      const { data: existing, error: findErr } = await supabase
        .from('group_reactions')
        .select('id')
        .eq('entry_id', entryId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (findErr) throw findErr;

      if (existing) {
        // Delete
        const { error: delErr } = await supabase
          .from('group_reactions')
          .delete()
          .eq('id', existing.id);
        if (delErr) throw delErr;
        return false;
      } else {
        // Insert
        const { error: insErr } = await supabase
          .from('group_reactions')
          .insert({
            entry_id: entryId,
            user_id: user.id
          });
        if (insErr) throw insErr;
        return true;
      }
    } catch (err) {
      console.error('Error toggling reaction:', err);
      return false;
    }
  }, [user]);

  const fetchGroupStats = useCallback(async (groupId) => {
    if (!user) return null;
    setLoading(true);

    try {
      // 1. Get all members in the group
      const { data: members, error: membersErr } = await supabase
        .from('group_members')
        .select(`
          user_id,
          joined_at,
          profiles (
            name,
            avatar_url
          )
        `)
        .eq('group_id', groupId);

      if (membersErr) throw membersErr;

      // 2. Fetch all entries for these members since they joined the group
      const memberIds = members.map(m => m.user_id);
      const { data: entries, error: entriesErr } = await supabase
        .from('entries')
        .select('user_id, date, type')
        .in('user_id', memberIds);

      if (entriesErr) throw entriesErr;

      // Map joined dates for easy privacy verification
      const joinMap = {};
      members.forEach(m => {
        joinMap[m.user_id] = new Date(m.joined_at).toISOString().split('T')[0];
      });

      // Filter entries by join date
      const visibleEntries = entries.filter(entry => {
        const joinDateStr = joinMap[entry.user_id];
        return entry.date >= joinDateStr;
      });

      // Compute statistics per member
      const memberStatsMap = {};
      members.forEach(m => {
        memberStatsMap[m.user_id] = {
          userId: m.user_id,
          name: m.profiles?.name || 'Anonymous',
          avatarUrl: m.profiles?.avatar_url || null,
          readCount: 0,
          skipCount: 0,
          totalDaysActive: 0
        };
      });

      visibleEntries.forEach(entry => {
        const stats = memberStatsMap[entry.user_id];
        if (stats) {
          if (entry.type === 'read') stats.readCount += 1;
          else if (entry.type === 'skip') stats.skipCount += 1;
        }
      });

      // Calculate active days for each member since they joined the group
      const today = new Date();
      Object.keys(memberStatsMap).forEach(uid => {
        const stats = memberStatsMap[uid];
        const joinedDate = new Date(joinMap[uid]);
        const diffTime = Math.abs(today - joinedDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
        stats.totalDaysActive = diffDays;
      });

      // Convert map to array and sort by readCount (descending)
      const leaderboard = Object.values(memberStatsMap).sort((a, b) => b.readCount - a.readCount);

      // Combined group statistics
      const totalGroupReadDays = visibleEntries.filter(e => e.type === 'read').length;
      const totalGroupSkipDays = visibleEntries.filter(e => e.type === 'skip').length;

      setLoading(false);
      return {
        totalGroupReadDays,
        totalGroupSkipDays,
        leaderboard
      };
    } catch (err) {
      console.error('Error fetching group stats:', err);
      setLoading(false);
      return null;
    }
  }, [user]);

  return {
    loading,
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
  };
}
