import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePresetLists } from '../contexts/PresetListsContext';

export default function PresetLists() {
  const router = useRouter();
  const { presetLists, loading } = usePresetLists();

  const handleSelect = (list) => {
    router.push({ pathname: '/presetListView', params: { listId: list.id } });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3f51b5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#3f51b5" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Pre-set Lists</Text>

      <FlatList
        data={presetLists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={() => handleSelect(item)}>
            <Ionicons name="list-circle-outline" size={24} color="#3f51b5" style={styles.icon} />
            <Text style={styles.listTitle}>{item.title}</Text>
            <Ionicons name="chevron-forward" size={20} color="#777" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3f51b5',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  icon: {
    marginRight: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backText: {
    color: '#3f51b5',
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '500',
  },
});
