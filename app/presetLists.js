import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const presetLists = [
  { id: '1', title: 'Movie Night', activities: ['Watch a comedy', 'Go to the cinema', 'Stream Netflix'] },
  { id: '2', title: 'Outdoor Fun', activities: ['Picnic', 'Hiking trail', 'Frisbee at the park'] },
  { id: '3', title: 'Foodie Day', activities: ['Try a new cafe', 'Go to a night market', 'Cook a meal together'] }
];

export default function PresetLists() {
  const router = useRouter();

  const handleSelect = (list) => {
    router.push({ pathname: '/presetListView', params: { listId: list.id } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pre-set Lists</Text>
      <FlatList
        data={presetLists}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={() => handleSelect(item)}>
            <Text style={styles.listTitle}>{item.title}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  listItem: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 10
  },
  listTitle: { fontSize: 18, fontWeight: '500' }
});
