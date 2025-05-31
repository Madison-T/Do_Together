import { createContext, useContext, useState } from 'react';
import { createVotingSession } from '../hooks/useFirestore';
import { useAuth } from './AuthContext';

export const VotingSessionContext = createContext();
export const useVotingSessionContext = () => useContext(VotingSessionContext);

export const VotingSessionProvider = ({ children }) => {
  const { user } = useAuth();

  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addActivity = (activity) => {
    setSelectedActivities((prev) =>
      prev.includes(activity)
        ? prev.filter((a) => a !== activity)
        : [...prev, activity]
    );
  };

  const clearSession = () => {
    setSelectedActivities([]);
    setSelectedGroupId(null);
    setStartTime(null);
    setEndTime(null);
    setSessionName('');
    setError(null);
  };

  const submitSession = async (name) => {
    if (!user || !selectedGroupId || !startTime || !endTime || selectedActivities.length === 0 || !name) {
      setError('All fields are required');
      return { success: false };
    }

    try {
      setLoading(true);
      const sessionId = `${selectedGroupId}_${Date.now()}`;
      await createVotingSession(sessionId, {
        name,
        groupId: selectedGroupId,
        createdBy: user.uid,
        activities: selectedActivities,
        startTime,
        endTime,
      });
      clearSession();
      return { success: true };
    } catch (err) {
      console.error('Error submitting voting session:', err);
      setError('Failed to create voting session');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    selectedActivities,
    selectedGroupId,
    startTime,
    endTime,
    sessionName,
    setSessionName,
    addActivity,
    setSelectedGroupId,
    setStartTime,
    setEndTime,
    clearSession,
    submitSession,
    loading,
    error,
  };

  return (
    <VotingSessionContext.Provider value={value}>
      {children}
    </VotingSessionContext.Provider>
  );
};
