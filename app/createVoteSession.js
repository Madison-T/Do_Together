// app/createVoteSession.js
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Button,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { useGroupContext } from '../contexts/GroupContext';
import { usePresetLists } from '../contexts/PresetListsContext';
import { useUserLists } from '../contexts/UserListsContext';
import { useVotingSessionContext } from '../contexts/VotingSessionContext';
import { fetchVotingSessionsByGroup } from '../hooks/useFirestore';

export default function CreateVoteSession() {
  const router = useRouter();
  const { listId, listType } = useLocalSearchParams();

  const { getPresetListById } = usePresetLists();
  const { getUserListById } = useUserLists();
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
    clearSession,                // ✅ added
    prefillSessionFromList       // ✅ added
  } = useVotingSessionContext();

  const [activityList, setActivityList] = useState([]);
  const [title, setTitle] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [isStartTime, setIsStartTime] = useState(true);
  const [sessionName, setSessionName] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const loadActivities = async () => {
      if (listId && listType) {
        let data = null;
        if (listType === 'user' || listType === 'tmdb') {
          data = await getUserListById(listId);
        } else {
          data = await getPresetListById(listId);
        }

        if (data) {
          setTitle(data.title || data.name || 'Untitled List');
          setActivityList(data.activities || []);
          clearSession();
          prefillSessionFromList(data);
        }
      }
    };
    loadActivities();
  }, [listId, listType]);

  //check if two activities are the same
  const areActivitiesEqual = (activity1, activity2) => {
    if(typeof activity1 === 'string' && typeof activity2 === 'string'){
      return activity1 === activity2;
    }

    if(typeof activity1 === 'object' && typeof activity2 === 'object'){
      //for places from google places api
      if(activity1.placeId && activity2.placeId){
        return activity1.placeId === activity2.placeId;
      }

      //for tmdb movies/shows
      if(activity1.tmdbId && activity2.tmdbId){
        return activity1.tmdbId === activity2.tmdbId;
      }

      //for other activities
      const title1 = activity1.title || activity1.name || '';
      const title2 = activity2.title || activity2.name || '';

      if(activity1.address && activity2.address){
        return title1 === title2 && activity1.address == activity2.address;
      }

      return title1 === title2;
    }
    return false;
  };

  const isActivitySelected = (activity) => {
    return selectedActivities.some(selectedActivities => 
      areActivitiesEqual(selectedActivities, activity)
    );
  };

  const openPicker = (isStart) => {
    setIsStartTime(isStart);
    setShowPicker(true);
  };

  const handleConfirm = (date) => {
    const iso = date.toISOString();
    if (isStartTime) setStartTime(iso);
    else setEndTime(iso);
    setShowPicker(false);
  };

  const toLocalInputValue = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  const validateFields = async () => {
    const newErrors = {};
    const now = new Date();

    if (!sessionName.trim()) newErrors.name = 'Session name is required';
    if (!selectedGroupId) newErrors.group = 'You must select a group';
    if (selectedActivities.length < 3) newErrors.activities = 'Select at least 3 activities';
    if (!startTime) newErrors.start = 'Start time is required';
    else if (new Date(startTime) < now) newErrors.start = 'Start time must be in the future';

    if (!endTime) newErrors.end = 'End time is required';
    else if (startTime && new Date(endTime) <= new Date(startTime)) {
      newErrors.end = 'End time must be after start time';
    } else if (startTime && new Date(endTime) - new Date(startTime) < 5 * 60 * 1000) {
      newErrors.end = 'Session must be at least 5 minutes long';
    }

    if (sessionName && selectedGroupId) {
      const sessions = await fetchVotingSessionsByGroup(selectedGroupId);
      const duplicate = sessions.find(s =>
        s.name?.trim().toLowerCase() === sessionName.trim().toLowerCase() &&
        new Date(s.endTime) > now
      );
      if (duplicate) newErrors.name = 'A session with this name is already active in this group';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    const valid = await validateFields();
    if (!valid) return;

    const result = await submitSession(sessionName);
    if (result.success) {
      router.replace('/dashboard');
    }
  };

  //function to display text for an activity
  const getActivityDisplayText = (item) => {
    if(typeof item === 'string') return item;
    if(typeof item.title === 'string') return item.title;
    if(typeof item.name === 'string') return item.name;
    console.warn('Invalid activity item title:', item);
    return 'Untitiled';
  };

  const getActivitySubtitle = (item) => {
    if(typeof item === 'object'){
      if(item.address) return item.address;
      if(item.rating && item.rating !== 'N/A') return `Rating: ${item.rating}`;
    }
    return null;
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

        <Text style={styles.sectionHeading}>Voting Session Name</Text>
        <View style={styles.pickerContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter session name"
            value={sessionName}
            onChangeText={setSessionName}
          />
        </View>
        {errors.name && <Text style={styles.error}>{errors.name}</Text>}

        <Text style={styles.sectionHeading}>Select Group</Text>
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
        {errors.group && <Text style={styles.error}>{errors.group}</Text>}

        <Text style={styles.sectionHeading}>Select Activities</Text>
        {activityList.map((item, index) => {
          const isSelected = isActivitySelected(item);
          const displayText = getActivityDisplayText(item);
          const subtitle = getActivitySubtitle(item);

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.activityItem,
                isSelected && styles.selectedActivity,
              ]}
              onPress={() => addActivity(item)}
            >
              <Text style={styles.activityText}>{displayText}</Text>
              {subtitle && (
                <Text style={styles.activitySubtitle}>{subtitle}</Text>
              )}
            </TouchableOpacity>
          );
        })}

        {errors.activities && <Text style={styles.error}>{errors.activities}</Text>}

        <Text style={styles.sectionHeading}>Voting Start Time</Text>
        <View style={styles.pickerContainer}>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              mode="datetime"
              display="spinner"
              textColor="#000"
              value={startTime ? new Date(startTime) : new Date()}
              onChange={(event, date) => {
                if (date) setStartTime(date.toISOString());
              }}
            />
          ) : Platform.OS === 'web' ? (
            <input
              type="datetime-local"
              value={startTime ? toLocalInputValue(new Date(startTime)) : toLocalInputValue(new Date())}
              onChange={(e) => setStartTime(new Date(e.target.value).toISOString())}
              style={styles.webInput}
            />
          ) : (
            <TouchableOpacity onPress={() => openPicker(true)} style={styles.timeButton}>
              <Text style={styles.timeText}>
                {startTime ? new Date(startTime).toLocaleString() : 'Pick Start Time'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {errors.start && <Text style={styles.error}>{errors.start}</Text>}

        <Text style={styles.sectionHeading}>Voting End Time</Text>
        <View style={styles.pickerContainer}>
          {Platform.OS === 'ios' ? (
            <DateTimePicker
              mode="datetime"
              display="spinner"
              textColor="#000"
              value={endTime ? new Date(endTime) : new Date()}
              onChange={(event, date) => {
                if (date) setEndTime(date.toISOString());
              }}
            />
          ) : Platform.OS === 'web' ? (
            <input
              type="datetime-local"
              value={endTime ? toLocalInputValue(new Date(endTime)) : toLocalInputValue(new Date())}
              onChange={(e) => setEndTime(new Date(e.target.value).toISOString())}
              style={styles.webInput}
            />
          ) : (
            <TouchableOpacity onPress={() => openPicker(false)} style={styles.timeButton}>
              <Text style={styles.timeText}>
                {endTime ? new Date(endTime).toLocaleString() : 'Pick End Time'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {errors.end && <Text style={styles.error}>{errors.end}</Text>}

        <DateTimePickerModal
          isVisible={showPicker}
          mode="datetime"
          onConfirm={handleConfirm}
          onCancel={() => setShowPicker(false)}
        />

        <View style={styles.submitContainer}>
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
  },
  sectionHeading: {
    marginTop: 20,
    fontWeight: '600',
    marginBottom: 6,
    fontSize: 16,
    color: '#3f51b5',
  },
  pickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#fff',
    padding: 10,
    fontSize: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  groupItem: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  selectedGroup: {
    backgroundColor: '#c5cae9',
  },
  groupText: {
    fontSize: 15,
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
    fontWeight: '500',
  },
  activitySubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  timeButton: {
    backgroundColor: '#e6e6e6',
    borderRadius: 8,
    padding: 12,
    marginTop: 6,
  },
  timeText: {
    color: '#000',
    fontSize: 16,
  },
  webInput: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#e6e6e6',
    color: '#000',
    fontSize: 16,
    marginTop: 6,
    border: 'none',
  },
  submitContainer: {
    marginTop: 30,
  },
  error: {
    color: '#d32f2f',
    fontSize: 13,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
  infoText: {
    fontStyle: 'italic',
    color: '#888',
  },
  horizontalScroll: {
    marginBottom: 10,
  },
});
