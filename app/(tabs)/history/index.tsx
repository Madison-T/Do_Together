// app/(tabs)/history/index.tsx
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../../contexts/AuthContext';
import { useGroupContext } from '../../../contexts/GroupContext';
import { fetchVotes } from '../../../hooks/useFirestore';

// 1) Mirror the shape that fetchVotes returns:
type Vote = {
  id: string;        // Firestore doc ID
  groupId: string;
  userId: string;
  vote: 'yes' | 'no';
  createdAt: string;
};

export default function HistoryScreen() {
  const { user } = useAuth();
  const { groupId } = useGroupContext();
  const [history, setHistory] = useState<Vote[]>([]);

  useEffect(() => {
    if (!user || !groupId) return;

    (async () => {
      // 2) Grab raw array (or undefined), default to []
      const raw = (await fetchVotes(groupId)) ?? [];
      // 3) Quick-cast into our Vote[] type
      const all = raw as Vote[];
      // 4) Filter and set
      setHistory(all.filter(v => v.userId === user.uid));
    })();
  }, [user, groupId]);

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <Text style={styles.item}>
            You voted “{item.vote}” on card {item.id}
          </Text>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No votes recorded yet.</Text>
        }
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  list: { paddingBottom: 32 },
  item: { fontSize: 16, marginVertical: 8 },
  empty: { fontSize: 16, textAlign: 'center', marginTop: 32 },
});
