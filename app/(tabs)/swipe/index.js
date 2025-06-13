import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ModalSelector from 'react-native-modal-selector';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroupContext } from '../../../contexts/GroupContext';
import { useVotesContext } from '../../../contexts/VotesContext';
import { fetchVotingSessionsByGroup } from '../../../hooks/useFirestore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

export default function SwipeScreen() {
  console.log('Swipe Scrren: component render start');
  const { user } = useAuth();
  const { groups } = useGroupContext();
  const { votes, castVote } = useVotesContext();
  const { groupId: passedGroupId, sessionId: passedSessionId } = useLocalSearchParams();
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [votingSessions, setVotingSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionActivities, setSessionActivities] = useState([]);

  const position = new Animated.ValueXY();
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-30deg', '0deg', '30deg'],
    extrapolate: 'clamp',
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 10,
    onPanResponderMove: (_, gesture) => {
      position.setValue({ x: gesture.dx, y: gesture.dy });
    },
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dx > SWIPE_THRESHOLD) {
        swipeRight();
      } else if (gesture.dx < -SWIPE_THRESHOLD) {
        swipeLeft();
      } else {
        resetPosition();
      }
    },
  });

  useEffect(() => {
    if (groups.length > 0) {
      const initialGroupId = passedGroupId || groups[0].id;
      setSelectedGroupId(initialGroupId);
    }
  }, [groups, passedGroupId]);

  useEffect(() => {
  const loadSessions = async () => {
    if (!user || !selectedGroupId) return;
    const sessions = await fetchVotingSessionsByGroup(selectedGroupId);

    const now = new Date().toISOString();
    const activeSessions = sessions.filter(s => s.endTime > now);

    setVotingSessions(activeSessions);

    if (passedSessionId && activeSessions.find(s => s.id === passedSessionId)) {
      setSelectedSessionId(passedSessionId);
    } else if (activeSessions.length > 0) {
      setSelectedSessionId(activeSessions[0].id);
    } else {
      setSelectedSessionId(null);
      setSessionActivities([]); // Clear cards
    }
  };

  loadSessions();
}, [selectedGroupId, user, passedSessionId]);


  useEffect(() => {
  if (!selectedSessionId){
    setSessionActivities([]);
    return;
  }
  const session = votingSessions.find((s) => s.id === selectedSessionId);
  if (!session){
    setSessionActivities([]);
    return;
  }

  const votedIds = votes.map((v) => v.activityId);
  console.log('Current voted IDs:', votedIds);
  const activityObjs = (session.activities || []).map((activity, index) => {
    const activityId = `${selectedSessionId}_${index}`;
    let name = 'Untitled';
    let description = '';

    if(typeof activity === 'string'){
      name = activity;
    }else if(typeof activity === 'object'){
      name = activity.title || activity.originalTitle || activity.name || activity.label || 'Untitled';
      description = activity.overview || activity.description || activity.address || '';
    }
    return {
      id: activityId,
      name,
      description,
      originalData: activity
    };
  });
  console.log('Processed activities:', activityObjs);
  const visible = activityObjs.filter((a) => !votedIds.includes(a.id));
  console.log('Visible activities after filtering', visible);
  setSessionActivities(visible);
  position.setValue({ x: 0, y: 0 }); // Reset card position when session changes
}, [selectedSessionId, votes, votingSessions]);

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
    }).start();
  };

  const swipeLeft = () => {
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH * 1.5, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete('no'));
  };

  const swipeRight = () => {
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH * 1.5, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => onSwipeComplete('yes'));
  };

  const onSwipeComplete = (vote) => {
    console.log(`Swipe completed ${vote}`);
    const currentActivityId = sessionActivities[0]?.id;
    if (currentActivityId) {
      console.log(`Current activity id ${currentActivityId}`);
      castVote(currentActivityId, vote, selectedGroupId);
    }
    setSessionActivities((prev) => prev.slice(1));
    position.setValue({ x: 0, y: 0 });
  };

  const renderCard = () => {
    if(sessionActivities.length === 0) {
      if (selectedGroupId && sessionActivities.length === 0) {
        return (
          <View style={styles.noMoreCards}>
            <Ionicons name="megaphone-outline" size={64} color="#ccc" />
            <Text style={styles.noMoreCardsText}>No more activities</Text>
            <Text style={styles.noMoreCardsSubText}>
              Create a new voting session for this group
            </Text>
          </View>
        );
      }
      if(!selectedSessionId){
        return (
          <View style={styles.noMoreCards}>
            <Ionicons name="list-outline" size={64} color="#ccc" />
            <Text style={styles.noMoreCardsText}>No session selected</Text>
            <Text style={styles.noMoreCardsSubText}>
              Please select an active voting session.
            </Text>
          </View>
        );
      }
      return (
        <View style={styles.noMoreCards}>
          <Ionicons name="checkmark-done-outline" size={64} color="#ccc" />
          <Text style={styles.noMoreCardsText}>No activities left</Text>
          <Text style={styles.noMoreCardsSubText}>
            You have voted on all activities in this session.
          </Text>
        </View>
      );
    }
    
    const currentActivity = sessionActivities[0];

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            transform: [
              { translateX: position.x },
              { rotate: rotate },
            ],
          },
        ]}
      >
        <Text style={styles.name}>{currentActivity.name}</Text>
        <Text style={styles.description}>{currentActivity.description}</Text>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.wrapper}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.dropdownContainer}>
          <Text style={styles.label}>Select Group</Text>
          {/* Group Selector */}
<ModalSelector
  data={groups.map((g) => ({ label: g.name, key: g.id }))}
  initValue={
    selectedGroupId
      ? groups.find((g) => g.id === selectedGroupId)?.name || '-- Select Group --'
      : '-- Select Group --'
  }
  onChange={(option) => {
    setSelectedGroupId(option.key);
    setVotingSessions([]);
    setSelectedSessionId(null); // reset session
    setSessionActivities([]);
  }}
  style={styles.modalSelector}
/>

{/* Voting Session Selector */}
<Text style={styles.label}>Select Active Voting Session</Text>
<ModalSelector
  data={votingSessions.map((s) => ({
    label: s.name || new Date(s.startTime).toLocaleString(),
    key: s.id,
  }))}
  initValue={
    selectedSessionId
      ? votingSessions.find((s) => s.id === selectedSessionId)?.name ||
        new Date(
          votingSessions.find((s) => s.id === selectedSessionId)?.startTime || ''
        ).toLocaleString()
      : '-- Select Session --'
  }
  onChange={(option) => {
    setSelectedSessionId(option.key);
    setSessionActivities([]); // reset cards
  }}
  style={styles.modalSelector}
  disabled={votingSessions.length === 0}
/>
        </View>

        <View style={styles.cardContainer}>
          {renderCard()}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, styles.noButton]}
            onPress={() => onSwipeComplete('no')}
            disabled={sessionActivities.length === 0}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.yesButton]}
            onPress={() => onSwipeComplete('yes')}
            disabled={sessionActivities.length === 0}
          >
            <Ionicons name="heart" size={30} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  container: {
    flex: 1,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  dropdownContainer: {
    paddingTop: 8,
    paddingBottom: 30,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  label: {
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 3,
    marginTop: 6,
  },
  modalSelector: {
    marginBottom: 8,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: '55%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: 50,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noButton: {
    backgroundColor: '#f44336',
  },
  yesButton: {
    backgroundColor: '#4caf50',
  },
  noMoreCards: {
    width: SCREEN_WIDTH * 0.9,
    height: '55%',
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  noMoreCardsText: {
    fontSize: 17,
    color: '#999',
  },
});
