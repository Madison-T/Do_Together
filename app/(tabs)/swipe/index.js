import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroupContext } from '../../../contexts/GroupContext';
import { useVotesContext } from '../../../contexts/VotesContext';
import { fetchActivities } from '../../../hooks/useFirestore';

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

  const handleVote = async (id, vote) => {
    await castVote(id, vote);
    setActivities(prev => prev.filter(a => a.id !== id));
  };

  return (
    <FlatList
      data={activities}
      keyExtractor={item => item.id}
      contentContainerStyle={{ padding: 16 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{item.name}</Text>
          <Text>{item.description}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity onPress={() => handleVote(item.id, 'no')}>
              <Ionicons name="close" size={36} color="red" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleVote(item.id, 'yes')}>
              <Ionicons name="heart" size={36} color="green" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    marginBottom: 16,
    elevation: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
});
