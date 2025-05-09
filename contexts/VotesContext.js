import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    fetchUserVotes,
    fetchVotes,
    voteOnActivity,
} from '../hooks/useFirestore';
import { useAuth } from './AuthContext';
import { useGroupContext } from './GroupContext';

export const VotesContext = createContext();
export const useVotesContext = () => useContext(VotesContext);

export const VotesProvider = ({ children }) => {
  const { user } = useAuth();
  const { groups } = useGroupContext();
  const currentGroup = groups?.[0];

  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user-specific votes for the current group
  useEffect(() => {
    if (user && currentGroup) {
      loadUserVotes(user.uid);
    } else {
      setVotes([]);
    }
  }, [user, currentGroup]);

  const loadUserVotes = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const userVotes = await fetchUserVotes(userId);
      setVotes(userVotes);
    } catch (err) {
      setError('Failed to fetch user votes');
      console.error('VotesContext error:', err);
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (activityId, voteType) => {
    setLoading(true);
    setError(null);
    try {
      await voteOnActivity(user.uid, activityId, currentGroup.id, voteType);
      await loadUserVotes(user.uid); // refresh local state
    } catch (err) {
      setError('Failed to cast vote');
      console.error('VotesContext error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGroupVotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const groupVotes = await fetchVotes(currentGroup.id);
      return groupVotes;
    } catch (err) {
      setError('Failed to fetch group votes');
      console.error('VotesContext error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const value = {
    votes,
    loading,
    error,
    castVote,
    getGroupVotes,
    refreshVotes: () => user && loadUserVotes(user.uid),
  };

  return <VotesContext.Provider value={value}>{children}</VotesContext.Provider>;
};
