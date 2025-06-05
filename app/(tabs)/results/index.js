// tabs/history/index.js
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useVotesContext } from '../../../contexts/VotesContext';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { votes } = useVotesContext();

  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (user && votes) {
      setHistory(votes);
    } else {
      setHistory([]);
    }
  }, [user, votes]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Your Vote History</Text>
      <FlatList
        data={history}
        keyExtractor={(item, index) => `${item.activityId}-${index}`}
        renderItem={({ item }) => (
          <View style={styles.voteItem}>
            <Text style={styles.voteText}>
              You voted <Text style={styles.voteType}>{item.vote.toUpperCase()}</Text> for activity ID: {item.activityId}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  voteItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  voteText: {
    fontSize: 16,
  },
  voteType: {
    fontWeight: 'bold',
    color: '#007bff',
  },
});