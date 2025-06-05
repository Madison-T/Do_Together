// tabs/results/index.js
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroupContext } from '../../../contexts/GroupContext';
import {
  fetchVotes,
  fetchVotingSessionsByGroup
} from '../../../hooks/useFirestore';

export default function ResultsScreen() {
  const { user } = useAuth();
  const { groups } = useGroupContext();
  const [completedSessions, setCompletedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load completed voting sessions for all user's groups
  const loadCompletedSessions = useCallback(async () => {
    if (!user || !groups?.length) {
      console.log('No user or groups available:', { user: !!user, groupsLength: groups?.length });
      setCompletedSessions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const allSessionsWithWinners = [];

      console.log('Loading sessions for groups:', groups.map(g => ({ id: g.id, name: g.name })));

      // Fetch sessions from all groups the user belongs to
      for (const group of groups) {
        try {
          console.log(`Fetching sessions for group: ${group.id}`);
          const groupSessions = await fetchVotingSessionsByGroup(group.id);
          console.log(`Found ${groupSessions.length} sessions for group ${group.id}:`, groupSessions);
          
          // Filter for completed sessions
          const completedGroupSessions = groupSessions.filter(
            session => {
              const status = session.status?.toLowerCase();
              return status === 'completed' || 
                     status === 'ended' || 
                     status === 'finished' ||
                     status === 'closed' ||
                     session.endTime < new Date() || 
                     (session.votes && Object.keys(session.votes).length > 0);
            }
          );
          
          console.log(`Filtered to ${completedGroupSessions.length} completed sessions for group ${group.id}`);
          
          // For each completed session, calculate the winner
          for (const session of completedGroupSessions) {
            try {
              const votes = await fetchVotes(group.id, session.id);
              const winner = calculateWinner(session, votes);
              
              if (winner) {
                allSessionsWithWinners.push({
                  ...session,
                  groupName: group.name,
                  groupId: group.id,
                  winner: winner
                });
              }
            } catch (error) {
              console.error(`Error calculating winner for session ${session.id}:`, error);
            }
          }
        } catch (error) {
          console.error(`Error fetching sessions for group ${group.id}:`, error);
        }
      }

      console.log(`Total sessions with winners found: ${allSessionsWithWinners.length}`);

      // Sort sessions by completion date (most recent first)
      allSessionsWithWinners.sort((a, b) => {
        const dateA = a.completedAt?.toDate?.() || a.endTime?.toDate?.() || a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.completedAt?.toDate?.() || b.endTime?.toDate?.() || b.createdAt?.toDate?.() || new Date(0);
        return dateB - dateA;
      });

      setCompletedSessions(allSessionsWithWinners);
      
    } catch (error) {
      console.error('Error loading completed sessions:', error);
      Alert.alert('Error', 'Failed to load voting results');
    } finally {
      setLoading(false);
    }
  }, [user, groups]);

  useEffect(() => {
    loadCompletedSessions();
  }, [loadCompletedSessions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCompletedSessions();
    setRefreshing(false);
  }, [loadCompletedSessions]);

  // Calculate winner for a session
  const calculateWinner = (session, votes) => {
    const itemVotes = {};

    // Initialize vote counts for all session items
    if (session.selectedItems) {
      session.selectedItems.forEach(item => {
        itemVotes[item.id || item.name] = {
          item: item,
          upvotes: 0,
          downvotes: 0,
          totalVotes: 0
        };
      });
    }

    // Count votes
    votes.forEach(vote => {
      if (vote.sessionId === session.id) {
        const itemId = vote.activityId || vote.itemId;
        if (itemVotes[itemId]) {
          itemVotes[itemId].totalVotes++;
          if (vote.voteType === 'up' || vote.voteType === 'yes') {
            itemVotes[itemId].upvotes++;
          } else if (vote.voteType === 'down' || vote.voteType === 'no') {
            itemVotes[itemId].downvotes++;
          }
        }
      }
    });

    // Find winner (highest score: upvotes - downvotes, then by total votes)
    const results = Object.values(itemVotes).sort((a, b) => {
      const scoreA = a.upvotes - a.downvotes;
      const scoreB = b.upvotes - b.downvotes;
      if (scoreA !== scoreB) return scoreB - scoreA;
      return b.totalVotes - a.totalVotes;
    });

    return results[0] || null;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionIcon = (session) => {
    if (session.listType === 'tmdb' || session.category === 'movies') return 'film-outline';
    if (session.category === 'tv-shows') return 'tv-outline';
    if (session.category === 'restaurants') return 'restaurant-outline';
    if (session.category === 'books') return 'book-outline';
    if (session.category === 'music') return 'musical-notes-outline';
    if (session.category === 'food') return 'pizza-outline';
    if (session.category === 'games') return 'game-controller-outline';
    if (session.category === 'shopping') return 'bag-outline';
    return 'list-outline';
  };

  const renderSessionItem = ({ item: session }) => (
    <View style={styles.sessionCard}>
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
            {session.title || session.name}
          </Text>
          <Text style={styles.sessionGroup}>
            {session.groupName}
          </Text>
          <Text style={styles.sessionDate}>
            Completed: {formatDate(session.completedAt || session.createdAt)}
          </Text>
        </View>
      </View>
      
      {session.description && (
        <Text style={styles.sessionDescription} numberOfLines={2}>
          {session.description}
        </Text>
      )}

      {/* Winner Section */}
      <View style={styles.winnerContainer}>
        <View style={styles.winnerHeader}>
          <Ionicons name="trophy" size={20} color="#FFD700" />
          <Text style={styles.winnerLabel}>Winner</Text>
        </View>
        <Text style={styles.winnerName}>{session.winner.item.name}</Text>
        {session.winner.item.description && (
          <Text style={styles.winnerDescription}>
            {session.winner.item.description}
          </Text>
        )}
        <View style={styles.winnerStats}>
          <View style={styles.voteStat}>
            <Ionicons name="thumbs-up" size={16} color="#4CAF50" />
            <Text style={styles.voteStatText}>{session.winner.upvotes}</Text>
          </View>
          <View style={styles.voteStat}>
            <Ionicons name="thumbs-down" size={16} color="#f44336" />
            <Text style={styles.voteStatText}>{session.winner.downvotes}</Text>
          </View>
          <Text style={styles.scoreText}>
            Score: {session.winner.upvotes - session.winner.downvotes > 0 ? '+' : ''}
            {session.winner.upvotes - session.winner.downvotes}
          </Text>
        </View>
      </View>
    </View>
  );

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
        <Text style={styles.heading}>Voting Winners</Text>
        <Text style={styles.subheading}>
          {completedSessions.length} completed session{completedSessions.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {completedSessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Winners Yet</Text>
          <Text style={styles.emptyText}>
            Winners from completed voting sessions will appear here
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sessionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f2ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    color: '#888',
  },
  sessionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  winnerContainer: {
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  winnerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginLeft: 6,
  },
  winnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  winnerDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 18,
  },
  winnerStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  voteStatText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3f51b5',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
});