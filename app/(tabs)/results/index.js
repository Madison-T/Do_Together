// tabs/results/index.js - Optimized Version
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroupContext } from '../../../contexts/GroupContext';
import { useVotesContext } from '../../../contexts/VotesContext';
import {
    fetchVotes,
    fetchVotingSessionsByGroup
} from '../../../hooks/useFirestore';

// Constants for better maintainability
const COMPLETION_STATUSES = ['completed', 'ended', 'finished', 'closed'];
const SESSION_TIMEOUT_HOURS = 1;

export default function ResultsScreen() {
  const { user } = useAuth();
  const { groups } = useGroupContext();
  const { getGroupVotes } = useVotesContext();
  const [completedSessions, setCompletedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Memoized helper functions for better performance
  const sessionHelpers = useMemo(() => ({
    isSessionCompleted: (session) => {
      const status = session.status?.toLowerCase();
      
      // Check explicit completion status
      if (COMPLETION_STATUSES.includes(status)) {
        return true;
      }
      
      // Check if endTime has passed
      if (session.endTime) {
        try {
          const endDate = session.endTime.toDate ? session.endTime.toDate() : new Date(session.endTime);
          if (endDate < new Date()) {
            return true;
          }
        } catch (error) {
          console.warn('Error parsing endTime:', error);
        }
      }
      
      // Check if session is old (fallback for sessions without proper status)
      if (session.createdAt) {
        try {
          const createdDate = session.createdAt.toDate ? session.createdAt.toDate() : new Date(session.createdAt);
          const hoursOld = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60);
          return hoursOld > SESSION_TIMEOUT_HOURS;
        } catch (error) {
          console.warn('Error parsing createdAt:', error);
        }
      }
      
      return false;
    },

    getSessionDate: (session) => {
      const dates = [
        session.completedAt,
        session.endTime,
        session.createdAt
      ].filter(Boolean);
      
      for (const date of dates) {
        try {
          return date.toDate ? date.toDate() : new Date(date);
        } catch (error) {
          console.warn('Error parsing date:', error);
        }
      }
      return new Date(0);
    },

    getActivityId: (activity) => {
      return activity.tmdbId || activity.placeId || activity.id || activity._id || activity.activityId;
    },

    getActivityName: (activity) => {
      return activity.title || activity.name || 'Unknown Activity';
    },

    getActivityDescription: (activity) => {
      return activity.overview || activity.description || activity.address || '';
    },

    doIdsMatch: (activityId, voteActivityId) => {
      if (activityId === voteActivityId) return true;
      
      const activityStr = String(activityId);
      const voteStr = String(voteActivityId);
      
      if (activityStr === voteStr) return true;
      if (voteStr.endsWith(`_${activityStr}`)) return true;
      
      const voteIdParts = voteStr.split('_');
      if (voteIdParts.length >= 3) {
        const voteIndex = voteIdParts[voteIdParts.length - 1];
        if (activityStr === voteIndex) return true;
      }
      
      return false;
    }
  }), []);

  // Calculate results for a voting session with improved performance
  const calculateSessionResults = useCallback((session, allGroupVotes) => {
    const activities = session.activities || session.selectedItems || session.items || [];
    
    if (!activities || activities.length === 0) {
      return {
        winner: null,
        totalVotes: 0,
        totalParticipants: 0,
        allResults: [],
        hasVotes: false
      };
    }

    const activityVotes = new Map();
    const uniqueVoters = new Set();
    
    // Initialize vote counts for all activities
    activities.forEach((activity) => {
      const activityId = sessionHelpers.getActivityId(activity);
      activityVotes.set(activityId, {
        activity: activity,
        yesVotes: 0,
        noVotes: 0,
        totalVotes: 0,
        voters: new Set(),
        votes: []
      });
    });

    // Filter and count votes that match this session's activities
    const sessionVotes = allGroupVotes.filter(vote => {
      const voteActivityId = vote.activityId;
      return Array.from(activityVotes.keys()).some(activityId => 
        sessionHelpers.doIdsMatch(activityId, voteActivityId)
      );
    });

    sessionVotes.forEach((vote) => {
      const voterId = vote.userId || 'anonymous';
      const voteActivityId = vote.activityId;
      
      uniqueVoters.add(voterId);
      
      const matchingActivityId = Array.from(activityVotes.keys()).find(activityId => 
        sessionHelpers.doIdsMatch(activityId, voteActivityId)
      );
      
      if (matchingActivityId && activityVotes.has(matchingActivityId)) {
        const activityData = activityVotes.get(matchingActivityId);
        activityData.totalVotes++;
        activityData.voters.add(voterId);
        activityData.votes.push(vote);
        
        if (vote.vote === 'yes') {
          activityData.yesVotes++;
        } else if (vote.vote === 'no') {
          activityData.noVotes++;
        }
      }
    });

    // Sort results by yes votes with improved tie-breaking
    const sortedResults = Array.from(activityVotes.values()).sort((a, b) => {
      if (a.yesVotes !== b.yesVotes) {
        return b.yesVotes - a.yesVotes;
      }
      
      const aRatio = a.totalVotes > 0 ? a.yesVotes / a.totalVotes : 0;
      const bRatio = b.totalVotes > 0 ? b.yesVotes / b.totalVotes : 0;
      if (aRatio !== bRatio) {
        return bRatio - aRatio;
      }
      
      const aName = sessionHelpers.getActivityName(a.activity);
      const bName = sessionHelpers.getActivityName(b.activity);
      return aName.localeCompare(bName);
    });

    const winner = sortedResults[0];
    const totalVotes = sessionVotes.length;
    const totalParticipants = uniqueVoters.size;

    return {
      winner: winner && winner.yesVotes > 0 ? {
        activity: winner.activity,
        yesVotes: winner.yesVotes,
        noVotes: winner.noVotes,
        totalVotes: winner.totalVotes,
        uniqueVoters: winner.voters.size,
        supportPercentage: winner.totalVotes > 0 ? Math.round((winner.yesVotes / winner.totalVotes) * 100) : 0
      } : null,
      totalVotes,
      totalParticipants,
      allResults: sortedResults,
      hasVotes: totalVotes > 0
    };
  }, [sessionHelpers]);

  // Load completed voting sessions with improved error handling
  const loadCompletedSessions = useCallback(async () => {
    if (!user || !groups?.length) {
      setCompletedSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const allSessionsWithResults = [];

      // Process groups in parallel for better performance
      const groupPromises = groups.map(async (group) => {
        try {
          const groupSessions = await fetchVotingSessionsByGroup(group.id);
          const completedGroupSessions = groupSessions.filter(sessionHelpers.isSessionCompleted);
          
          // Process sessions in parallel
          const sessionPromises = completedGroupSessions.map(async (session) => {
            try {
              const allGroupVotes = await fetchVotes(group.id);
              const sessionResults = calculateSessionResults(session, allGroupVotes);
              
              return {
                ...session,
                groupName: group.name,
                groupId: group.id,
                results: sessionResults
              };
            } catch (error) {
              console.error(`Error calculating result for session ${session.id}:`, error);
              return {
                ...session,
                groupName: group.name,
                groupId: group.id,
                results: {
                  winner: null,
                  totalVotes: 0,
                  totalParticipants: 0,
                  allResults: [],
                  hasVotes: false
                }
              };
            }
          });
          
          return await Promise.all(sessionPromises);
        } catch (error) {
          console.error(`Error fetching sessions for group ${group.id}:`, error);
          return [];
        }
      });

      const groupResults = await Promise.all(groupPromises);
      const flatResults = groupResults.flat();

      // Sort sessions by completion date (most recent first)
      flatResults.sort((a, b) => {
        const dateA = sessionHelpers.getSessionDate(a);
        const dateB = sessionHelpers.getSessionDate(b);
        return dateB - dateA;
      });

      setCompletedSessions(flatResults);
      
    } catch (error) {
      console.error('Error loading completed sessions:', error);
      setError('Failed to load voting results');
      Alert.alert('Error', 'Failed to load voting results');
    } finally {
      setLoading(false);
    }
  }, [user, groups, sessionHelpers, calculateSessionResults]);

  useEffect(() => {
    loadCompletedSessions();
  }, [loadCompletedSessions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCompletedSessions();
    setRefreshing(false);
  }, [loadCompletedSessions]);

  const formatDate = useCallback((date) => {
    if (!date) return 'Unknown date';
    
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown date';
    }
  }, []);

  const getSessionIcon = useCallback((session) => {
    // Check if any activity has TMDB data (movies/TV)
    if (session.activities?.some(a => a.tmdbId)) {
      return 'film-outline';
    }
    
    // Check for place-based activities (restaurants, etc.)
    if (session.activities?.some(a => a.placeId || a.address)) {
      return 'restaurant-outline';
    }
    
    // Icon mapping
    const iconMap = {
      'tmdb': 'film-outline',
      'movies': 'film-outline',
      'tv-shows': 'tv-outline',
      'restaurants': 'restaurant-outline',
      'books': 'book-outline',
      'music': 'musical-notes-outline',
      'food': 'pizza-outline',
      'games': 'game-controller-outline',
      'shopping': 'bag-outline'
    };
    
    return iconMap[session.listType] || iconMap[session.category] || 'list-outline';
  }, []);

  const handleSessionPress = useCallback((session) => {
    // Add navigation or modal to show detailed results
    console.log('Session pressed:', session.id);
  }, []);

  const renderSessionItem = useCallback(({ item: session }) => (
    <Pressable 
      style={({ pressed }) => [
        styles.sessionCard,
        pressed && styles.sessionCardPressed
      ]}
      onPress={() => handleSessionPress(session)}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionIconContainer}>
          <Ionicons 
            name={getSessionIcon(session)} 
            size={24} 
            color="#3f51b5" 
          />
        </View>
        <View style={styles.sessionInfo}>
          <Text style={styles.sessionTitle} numberOfLines={2}>
            {session.name || session.title || 'Voting Session'}
          </Text>
          <Text style={styles.sessionGroup}>
            {session.groupName}
          </Text>
          <Text style={styles.sessionDate}>
            Completed: {formatDate(session.endTime || session.createdAt)}
          </Text>
        </View>
      </View>
      
      {session.description && (
        <Text style={styles.sessionDescription} numberOfLines={2}>
          {session.description}
        </Text>
      )}

      <View style={styles.resultContainer}>
        <View style={styles.resultHeader}>
          <Ionicons 
            name={session.results.hasVotes ? "trophy" : "hourglass-outline"} 
            size={20} 
            color={session.results.hasVotes ? "#FFD700" : "#ccc"} 
          />
          <Text style={styles.resultLabel}>
            {session.results.hasVotes ? 'Winner' : 'No Votes Yet'}
          </Text>
        </View>
        
        {session.results.winner ? (
          <>
            <Text style={styles.resultName}>
              {sessionHelpers.getActivityName(session.results.winner.activity)}
            </Text>
            {sessionHelpers.getActivityDescription(session.results.winner.activity) && (
              <Text style={styles.resultDescription} numberOfLines={2}>
                {sessionHelpers.getActivityDescription(session.results.winner.activity)}
              </Text>
            )}
            <View style={styles.resultStats}>
              <View style={styles.voteStat}>
                <Ionicons name="thumbs-up" size={16} color="#4CAF50" />
                <Text style={styles.voteStatText}>
                  {session.results.winner.yesVotes} yes
                </Text>
              </View>
              <View style={styles.voteStat}>
                <Ionicons name="thumbs-down" size={16} color="#f44336" />
                <Text style={styles.voteStatText}>
                  {session.results.winner.noVotes} no
                </Text>
              </View>
              <View style={styles.voteStat}>
                <Ionicons name="people" size={16} color="#3f51b5" />
                <Text style={styles.voteStatText}>
                  {session.results.winner.uniqueVoters} voter{session.results.winner.uniqueVoters !== 1 ? 's' : ''}
                </Text>
              </View>
              <Text style={styles.scoreText}>
                {session.results.winner.supportPercentage}% approval
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.resultName}>
            {session.results.hasVotes ? 'No clear winner' : 'Waiting for votes...'}
          </Text>
        )}
        
        <View style={styles.participantStats}>
          <Text style={styles.participantText}>
            {session.results.totalParticipants} participant{session.results.totalParticipants !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.participantText}>
            {session.results.totalVotes} total vote{session.results.totalVotes !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>
    </Pressable>
  ), [getSessionIcon, formatDate, sessionHelpers, handleSessionPress]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3f51b5" />
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Voting Results</Text>
        <Text style={styles.subheading}>
          {completedSessions.length} completed session{completedSessions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color="#f44336" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={loadCompletedSessions}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}

      {completedSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bar-chart-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Results Yet</Text>
          <Text style={styles.emptyText}>
            Results from completed voting sessions will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={completedSessions}
          renderItem={renderSessionItem}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subheading: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    flex: 1,
    marginLeft: 8,
    color: '#d32f2f',
  },
  retryButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#999',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  listContainer: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionIconContainer: {
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  sessionGroup: {
    fontSize: 14,
    color: '#3f51b5',
    fontWeight: '500',
    marginBottom: 2,
  },
  sessionDate: {
    fontSize: 12,
    color: '#666',
  },
  sessionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  resultContainer: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  resultStats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  voteStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  voteStatText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  scoreText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  participantStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  participantText: {
    fontSize: 12,
    color: '#999',
  },
});