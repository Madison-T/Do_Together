import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Button,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useGroupContext } from '../contexts/GroupContext';
import { usePresetLists } from '../contexts/PresetListsContext';
import { useVotingSessionContext } from '../contexts/VotingSessionContext';

export default function CreateVoteSession() {
  const router = useRouter();
  const { listId } = useLocalSearchParams();

  const { getPresetListById } = usePresetLists();
  const { groups } = useGroupContext();

  const {
    selectedActivities,
    addActivity,
    setSelectedGroupId,
    selectedGroupId,
    startTime,
    endTime,
    setStartTime,
    setEndTime,
    submitSession,
    loading,
    error,
  } = useVotingSessionContext();

  const [activityList, setActivityList] = useState([]);
  const [title, setTitle] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    const loadPreset = async () => {
      const list = await getPresetListById(listId);
      if (list) {
        setTitle(list.title);
        setActivityList(list.activities);
      }
    };
    loadPreset();
  }, [listId]);

  const handleSubmit = async () => {
    const result = await submitSession();
    if (result.success) {
      router.replace('/dashboard');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#3f51b5" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>New Voting Session</Text>
        <Text style={styles.subtitle}>{title}</Text>

        {/* Group selection */}
        <Text style={styles.label}>Select Group</Text>
        {groups.length === 0 ? (
          <Text style={styles.infoText}>You must join a group first</Text>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {groups.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.groupItem,
                  selectedGroupId === item.id && styles.selectedGroup,
                ]}
                onPress={() => setSelectedGroupId(item.id)}
              >
                <Text style={styles.groupText}>{item.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Activity selection */}
        <Text style={styles.label}>Select Activities</Text>
        {activityList.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.activityItem,
              selectedActivities.includes(item) && styles.selectedActivity,
            ]}
            onPress={() => addActivity(item)}
          >
            <Text style={styles.activityText}>{item}</Text>
          </TouchableOpacity>
        ))}

        {/* Time pickers */}
        <Text style={styles.label}>Voting Start Time</Text>
        <Button
          title={startTime ? new Date(startTime).toLocaleString() : 'Pick Start Time'}
          onPress={() => setShowStartPicker(true)}
        />
        {showStartPicker && (
          <DateTimePicker
            mode="datetime"
            value={startTime ? new Date(startTime) : new Date()}
            onChange={(_, date) => {
              setShowStartPicker(false);
              if (date) setStartTime(date.toISOString());
            }}
          />
        )}

        <Text style={styles.label}>Voting End Time</Text>
        <Button
          title={endTime ? new Date(endTime).toLocaleString() : 'Pick End Time'}
          onPress={() => setShowEndPicker(true)}
        />
        {showEndPicker && (
          <DateTimePicker
            mode="datetime"
            value={endTime ? new Date(endTime) : new Date()}
            onChange={(_, date) => {
              setShowEndPicker(false);
              if (date) setEndTime(date.toISOString());
            }}
          />
        )}

        {/* Submit */}
        <View style={styles.submitContainer}>
          {error && <Text style={styles.error}>{error}</Text>}
          <Button title="Create Voting Session" onPress={handleSubmit} disabled={loading} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 40,
    backgroundColor: '#f5f5f5',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3f51b5',
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  label: {
    marginTop: 20,
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 16,
  },
  infoText: {
    fontStyle: 'italic',
    color: '#888',
  },
  horizontalScroll: {
    marginBottom: 10,
  },
  groupItem: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  selectedGroup: {
    backgroundColor: '#c5cae9',
  },
  groupText: {
    fontWeight: '500',
  },
  activityItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 1,
  },
  selectedActivity: {
    backgroundColor: '#dcedc8',
  },
  activityText: {
    fontSize: 15,
  },
  submitContainer: {
    marginTop: 30,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
});
