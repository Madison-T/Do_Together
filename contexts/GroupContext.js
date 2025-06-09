import * as Crypto from 'expo-crypto';
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as FirestoreService from '../hooks/useFirestore';
import { useAuth } from './AuthContext';

// Create the context
export const GroupContext = createContext();

// Custom hook to use the group context
export const useGroupContext = () => useContext(GroupContext);

// Generate a short readable 6-char group ID using random bytes
const generateShortId = async () => {
  const bytes = await Crypto.getRandomBytesAsync(4); // 32-bit random number
  const num = bytes.reduce((acc, b) => (acc << 8) | b, 0);
  return num.toString(36).substring(0, 6); // base36, trimmed to 6 chars
};

export const GroupProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState(null);

  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchUserGroups(currentUser.uid);
    } else {
      setGroups([]);
    }
  }, [currentUser]);

  const fetchUserGroups = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const userGroups = await FirestoreService.fetchUserGroups(userId);
      setGroups(userGroups || []);
    } catch (error) {
      setError('Failed to fetch groups');
      console.error('Error fetching groups', error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (groupName, description) => {
    setLoading(true);
    setError(null);

    try {
      if (!currentUser) throw new Error('User not authenticated');

      const groupId = await generateShortId();
      const joinCode = groupId;

      await FirestoreService.addGroup(
        groupId,
        groupName,
        description,
        [currentUser.uid],
        currentUser.uid,
        joinCode
      );

      const newGroup = {
        id: groupId,
        name: groupName,
        description,
        members: [currentUser.uid],
        createdBy: currentUser.uid,
        createdAt: new Date().toISOString(),
        joinCode,
      };

      setGroups([...groups, newGroup]);
      return { groupId, groupName, joinCode };
    } catch (error) {
      setError('Failed to create group');
      console.error('Error creating group:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const joinGroup = async (groupId) => {
    setLoading(true);
    setError(null);
    try {
      if (!currentUser) throw new Error('User not authenticated');

      const group = await FirestoreService.fetchGroupById(groupId);
      if (!group) {
        setError('Group not found');
        return;
      }

      if (group.members.includes(currentUser.uid)) {
        setError('You are already a member of this group');
        return { success: false, message: 'Already a member' };
      }

      await FirestoreService.updateGroup(groupId, {
        members: [...group.members, currentUser.uid],
      });

      await fetchUserGroups(currentUser.uid);
      return { success: true, groupId, groupName: group.name };
    } catch (error) {
      setError('Failed to join group');
      console.error('Error joining group', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const leaveGroup = async (groupId) => {
    setLoading(true);
    setError(null);
    try {
      if (!currentUser) throw new Error('User not authenticated');

      const group = await FirestoreService.fetchGroupById(groupId);
      if (!group) throw new Error('Group not found');

      if (!group.members.includes(currentUser.uid)) {
        return { success: false, message: 'You are not a member of this group' };
      }

      if (group.createdBy === currentUser.uid) {
        return { success: false, message: 'Admin cannot leave the group' };
      }

      const updatedMembers = group.members.filter(id => id !== currentUser.uid);
      await FirestoreService.updateGroup(groupId, { members: updatedMembers });

      setGroups(groups.filter(g => g.id !== groupId));
      return { success: true };
    } catch (error) {
      setError('Failed to leave group');
      console.error('Error leaving group', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (groupId, memberId) => {
    setLoading(true);
    setError(null);
    try {
      if (!currentUser) throw new Error('User not authenticated');

      const group = await FirestoreService.fetchGroupById(groupId);
      if (!group) throw new Error('Group not found');

      if (group.createdBy !== currentUser.uid) {
        return { success: false, message: 'Only the group creator can remove members' };
      }

      if (!group.members.includes(memberId)) {
        return { success: false, message: 'User is not a member of this group' };
      }

      if (memberId === currentUser.uid) {
        return { success: false, message: 'Admin cannot remove themselves' };
      }

      const updatedMembers = group.members.filter(id => id !== memberId);
      await FirestoreService.updateGroup(groupId, { members: updatedMembers });

      if (currentUser.uid === memberId) {
        setGroups(groups.filter(g => g.id !== groupId));
      } else {
        setGroups(groups.map(g => g.id === groupId ? { ...g, members: updatedMembers } : g));
      }

      return { success: true, message: 'Member removed successfully' };
    } catch (error) {
      setError('Failed to remove member from group');
      console.error('Error removing member from group', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const addUsersToGroup = async (groupId, userIds) => {
    setLoading(true);
    setError(null);
    try {
      if (!currentUser) throw new Error('User not authenticated');

      const group = await FirestoreService.fetchGroupById(groupId);
      if (!group) throw new Error('Group not found');

      if (group.createdBy !== currentUser.uid) {
        return { success: false, message: 'Only the group admin can add members' };
      }

      await FirestoreService.addUsersToGroup(groupId, userIds);
      await fetchUserGroups(currentUser.uid);
      return { success: true, message: 'Successfully added members by search' };
    } catch (error) {
      setError('Failed to add users to group');
      console.error('Error adding users to group', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  const createActivity = async (groupId) => {
    // Placeholder
  };

  const value = {
    loading,
    groups,
    error,
    createGroup,
    joinGroup,
    leaveGroup,
    removeMember,
    createActivity,
    clearError,
    addUsersToGroup,
    refreshGroups: () => currentUser && fetchUserGroups(currentUser.uid),
  };

  return (
    <GroupContext.Provider value={value}>
      {children}
    </GroupContext.Provider>
  );
};
