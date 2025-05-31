import { Ionicons } from '@expo/vector-icons';
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
  const { user } = useAuth();
  const { groups } = useGroupContext();
  const { votes, castVote } = useVotesContext();

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
      setSelectedGroupId(groups[0].id);
    }
  }, [groups]);

  useEffect(() => {
    const loadSessions = async () => {
      if (!user || !selectedGroupId) return;
      const sessions = await fetchVotingSessionsByGroup(selectedGroupId);
      setVotingSessions(sessions);
      if (sessions.length > 0) {
        setSelectedSessionId(sessions[0].id);
      } else {
        setSelectedSessionId(null);
      }
    };
    loadSessions();
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedSessionId) return;
    const session = votingSessions.find((s) => s.id === selectedSessionId);
    if (!session) return;

    const votedIds = votes.map((v) => v.activityId);
    const activityObjs = session.activities.map((title, index) => ({
      id: `${selectedSessionId}_${index}`,
      name: title,
      description: '',
    }));
    const visible = activityObjs.filter((a) => !votedIds.includes(a.id));
    setSessionActivities(visible);
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
    const currentActivityId = sessionActivities[0]?.id;
    if (currentActivityId) {
      castVote(currentActivityId, vote);
    }
    setSessionActivities((prev) => prev.slice(1));
    position.setValue({ x: 0, y: 0 });
  };

  const renderCard = () => {
    if (sessionActivities.length === 0) {
      return (
        <View style={styles.noMoreCards}>
          <Text style={styles.noMoreCardsText}>No more activities</Text>
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
          <ModalSelector
            data={groups.map((g) => ({ label: g.name, key: g.id }))}
            initValue="-- Select Group --"
            onChange={(option) => setSelectedGroupId(option.key)}
            selectedKey={selectedGroupId}
            style={styles.modalSelector}
          />
          <Text style={styles.label}>Select Voting Session</Text>
          <ModalSelector
            data={votingSessions.map((s) => ({
              label: s.name || new Date(s.startTime).toLocaleString(),
              key: s.id,
            }))}
            initValue="-- Select Session --"
            onChange={(option) => setSelectedSessionId(option.key)}
            selectedKey={selectedSessionId}
            style={styles.modalSelector}
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
