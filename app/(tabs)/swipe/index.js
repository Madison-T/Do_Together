import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, Dimensions, PanResponder, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroupContext } from '../../../contexts/GroupContext';
import { useVotesContext } from '../../../contexts/VotesContext';
import { fetchActivities } from '../../../hooks/useFirestore';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

const dummyData = [
  { id: '1', name: 'Bowling Night', description: 'Compete for strikes and laughs' },
  { id: '2', name: 'Picnic at the Park', description: 'Enjoy nature and snacks together' },
  { id: '3', name: 'Escape Room', description: 'Solve puzzles as a team under pressure' },
  { id: '4', name: 'Karaoke Night', description: 'Sing your heart out with friends' },
  { id: '5', name: 'Mini Golf', description: 'Challenge your group to a fun putting game' },
];

export default function SwipeScreen() {
  const { user } = useAuth();
  const { groups } = useGroupContext();
  const { votes, castVote } = useVotesContext();
  const currentGroup = groups?.[0];

  const [activities, setActivities] = useState([]);
  const position = new Animated.ValueXY();
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
    outputRange: ['-30deg', '0deg', '30deg'],
    extrapolate: 'clamp'
  });

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderMove: (evt, gesture) =>{
      position.setValue({x: gesture.dx, y: gesture.dy});
    },
    onPanResponderRelease: (evt, gesture) =>{
      if(gesture.dx > SWIPE_THRESHOLD){
        swipeRight();
      }else if(gesture.dx < -SWIPE_THRESHOLD){
        swipeLeft();
      }else{
        resetPosition();
      }
    }
  });


  useEffect(() => {
    const load = async () => {
      if (!user || !currentGroup) return;

      let all = await fetchActivities(currentGroup.id);

      // fallback to dummy data if no activities loaded
      if (!all || all.length === 0) {
        all = dummyData;
      }

      const votedIds = votes.map(v => v.activityId);
      const visible = all.filter(activity => !votedIds.includes(activity.id));
      setActivities(visible);
    };

    load();
  }, [user, currentGroup, votes]);


  const resetPosition = () =>{
    Animated.spring(position, {
      toValue: {x:0, y:0},
      useNativeDriver: false
    }).start();
  };

  const swipeLeft = () =>{
    Animated.timing(position, {
      toValue: {x: -SCREEN_WIDTH * 1.5, y: 0},
      duration: 250,
      useNativeDriver: false
    }).start(() =>onSwipeComplete('no'));
  };

  const swipeRight = () =>{
    Animated.timing(position,{
      toValue: {x: SCREEN_WIDTH * 1.5, y:0},
      duration: 250,
      useNativeDriver: false
    }).start(()=>onSwipeComplete('yes'));
  };

  const onSwipeComplete = (vote) =>{
    //Reset the position and move to next card
    const currentActivityId = activities[0]?.id;
    if(currentActivityId){
      castVote(currentActivityId, vote);
    }

    //Remove the top card
    setActivities(prev => prev.slice(1));

    //Reset position for the next card
    position.setValue({x:0, y:0});
  };

  const handleVoteButtonPress = (vote) =>{
    if(activities.length === 0){
      return;
    }
    if(vote === 'yes'){
      swipeRight();
    }else{
      swipeLeft();
    }
  };
  
  const renderCard = () =>{
    if(activities.length === 0){
      return (
        <View style={styles.noMoreCards}>
          <Text style={styles.noMoreCardsText}>No more activities</Text>
        </View>
      );
    }

    const currentActivity = activities[0];

    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.card,
          {
            transform: [
              {translateX: position.x},
              {rotate: rotate}
            ]
          }
        ]}
      >
        <Text style={styles.name}>{currentActivity.name}</Text>
        <Text style={styles.description}>{currentActivity.description}</Text>

        <Animated.View style={[
          styles.overlayLeft,
          {
            opacity: position.x.interpolate({
              inputRange: [-SCREEN_WIDTH / 2, 0],
              outputRange: [1,0],
              extrapolate: 'clamp'
            })
          }
        ]}>
          <Text style={styles.overlayText}>NOPE</Text>
        </Animated.View>

        <Animated.View style={[
          styles.overlayRight,
          {
            opacity: position.x.interpolate({
              inputRange: [0, SCREEN_WIDTH / 2],
              outputRange: [0,1],
              extrapolate: 'clamp'
            })
          }
        ]}>
          <Text style={styles.overlayText}>LIKE</Text>
        </Animated.View>
      </Animated.View>
    );
  };

  const renderNextCard = () =>{
    if(activities.length <= 1){
      return null;
    }

    return (
      <View style={[styles.card, styles.nextCard]}>
        <Text style={styles.name}>{activities[1].name}</Text>
        <Text style={styles.description}>{activities[1].description}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {activities.length > 1 && renderNextCard()}
        {renderCard()}
      </View>
      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.noButton]}
          onPress={()=>handleVoteButtonPress('no')}
          disabled={activities.length === 0}
        >
          <Ionicons name="close" size={36} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.yesButton]}
          onPress={()=> handleVoteButtonPress('yes')}
          disabled={activities.length === 0}
        >
          <Ionicons name='heart' size={36} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  cardContainer:{
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.9,
    height: '70%',
    padding: 20,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 2,
  },
  nextCard:{
    top: 10,
    left: 5,
    transform: [{scale: 0.95}],
    opacity: 0.6,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description:{
    fontSize: 18,
    textAlign: 'center',
    color: '#444',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    paddingHorizontal: 60,
  },
  button:{
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  noButton:{
    backgroundColor: 'red',
  },
  yesButton:{
    backgroundColor: 'green',
  },
  noMoreCards:{
    width: SCREEN_WIDTH * 0.9,
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  noMoreCardsText:{
    fontSize: 20,
    color: '#888',
    fontWeight: 'bold',
  },
  overlayLeft:{
    position: 'absolute',
    top: 25,
    left: 25,
    borderWidth: 3,
    borderRadius: 8,
    padding: 10,
    borderColor: 'red',
    transform: [{rotate: '-20deg'}],
  },
  overlayRight:{
    position: 'absolute',
    top: 25,
    right: 25,
    borderWidth: 3,
    borderColor: 'green',
    borderRadius: 8,
    padding: 10,
    transform: [{rotate: '20deg'}],
  },
  overlayText:{
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
