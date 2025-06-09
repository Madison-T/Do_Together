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

  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user-specific votes for the current group
  useEffect(() => {
    if (user) {
      loadUserVotes(user.uid);
    } else {
      setVotes([]);
    }
  }, [user]);

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

  const castVote = async (activityId, voteType, groupId) => {
    if(!user || !activityId || !groupId){
      console.error('Missing required parameters for voting:', {user, activityId, groupId});
    }
    setLoading(true);
    setError(null);
    try {
      console.log('Casting vote:', {userId: user.uid, activityId, groupId, voteType});

      await voteOnActivity(user.uid, activityId, groupId, voteType);

      const newVote = {
        userId: user.uid,
        activityId,
        groupId,
        vote: voteType,
        createdAt: new Date().toISOString(),
      };
      setVotes(prevVotes => [...prevVotes.filter(v => v.activityId !== activityId), newVote]);

      await loadUserVotes(user.uid); // refresh local state
    } catch (err) {
      setError('Failed to cast vote');
      console.error('VotesContext error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGroupVotes = async (groupId) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching votes for group:', groupId);
      const groupVotes = await fetchVotes(groupId);
      console.log('Retrieved group votes:', groupVotes);
      return groupVotes || [];
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
