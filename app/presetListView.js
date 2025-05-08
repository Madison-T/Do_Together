import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const presetLists = {
  '1': ['Watch a comedy', 'Go to the cinema', 'Stream Netflix'],
  '2': ['Picnic', 'Hiking trail', 'Frisbee at the park'],
  '3': ['Try a new cafe', 'Go to a night market', 'Cook a meal together']
};

export default function PresetListView() {
  const { listId } = useLocalSearchParams();
  const activities = presetLists[listId] || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Activities</Text>
      <FlatList
        data={activities}
        keyExtractor={(item, index) => `${listId}-${index}`}
        renderItem={({ item }) => <Text style={styles.item}>{`\u2022 ${item}`}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  item: { fontSize: 16, marginBottom: 10 }
});