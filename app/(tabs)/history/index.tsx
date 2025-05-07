// HistoryScreen.tsx

import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { auth } from '../../../firebaseConfig';
import { fetchVotes } from '../../../hooks/useFirestore';

type Vote = {
  id: string;        // same as cardId
  groupId: string;
  userId: string;
  vote: 'yes' | 'no';
  createdAt: string;
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<Vote[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    (async () => {
      if (!user) return;
  
      // if fetchVotes returns undefined, treat it as an empty array
      const raw: any[] = (await fetchVotes('defaultGroup')) ?? [];
  
      const allVotes: Vote[] = raw.map(item => ({
        id:        item.id,
        groupId:   item.groupId,
        userId:    item.userId,
        vote:      item.vote,
        createdAt: item.createdAt,
      }));
  
      const mine = allVotes.filter(v => v.userId === user.uid);
      setHistory(mine);
    })();
  }, [user]);
  
  const renderItem = ({ item }: { item: Vote }) => (
    <Text style={styles.item}>
      User {item.userId} voted ‘{item.vote}’ on card {item.id}
    </Text>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No votes yet.</Text>}
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
