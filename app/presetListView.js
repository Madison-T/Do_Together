import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { usePresetLists } from '../contexts/PresetListsContext';

export default function PresetListView() {
  const { listId } = useLocalSearchParams();
  const router = useRouter();
  const { getPresetListById } = usePresetLists();
  const [activities, setActivities] = useState([]);
  const [title, setTitle] = useState('');

  useEffect(() => {
    const loadList = async () => {
      const list = await getPresetListById(listId);
      if (list) {
        setTitle(list.title);
        setActivities(list.activities);
      }
    };
    loadList();
  }, [listId]);

  const handleCreateSession = () => {
    router.push({ pathname: '/createVoteSession', params: { listId, listType: 'preset' } });
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#3f51b5" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Explore a curated list of ideas to enjoy with friends!</Text>

        <View style={styles.card}>
          {activities.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#4caf50"
                style={styles.bulletIcon}
              />
              <Text style={styles.itemText}>{item}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.createSessionButton} onPress={handleCreateSession}>
          <Text style={styles.createSessionText}>Start Voting Session</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    paddingBottom: 30,
  },
  container: {
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    color: '#3f51b5',
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '500',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3f51b5',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexShrink: 1,
  },
  bulletIcon: {
    marginRight: 10,
    marginTop: 3,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
    flex: 1,
  },
  createSessionButton: {
    marginTop: 30,
    backgroundColor: '#3f51b5',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  createSessionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});