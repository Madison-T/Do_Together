import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { NotificationSystem } from '../notificationSystem';


export default function Dashboard() {
  const router = useRouter();
  const { logoutUser } = useAuth();

  const handleLogout = () => {
    logoutUser();
    router.replace('/');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
          {/** Notification Bell */}
          <View style={styles.notificationWrapper}>
            <NotificationSystem />
          </View>
        <Text style={styles.title}>Do Together</Text>
        <Text style={styles.subtitle}>Organise activities with friends</Text>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/groups')}>
            <View style={styles.actionIcon}>
              <Ionicons name="people" size={30} color="#fff" />
            </View>
            <Text style={styles.actionText}>My Groups</Text>
            <Text style={styles.actionDescription}>View and manage your groups</Text>
            <Ionicons name="chevron-forward" size={22} color="#777" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/createGroup')}>
            <View style={[styles.actionIcon, { backgroundColor: '#4caf50' }]}>
              <Ionicons name="add-circle" size={30} color="#fff" />
            </View>
            <Text style={styles.actionText}>Create Group</Text>
            <Text style={styles.actionDescription}>Start a new group for activities</Text>
            <Ionicons name="chevron-forward" size={22} color="#777" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/joinGroup')}>
            <View style={[styles.actionIcon, { backgroundColor: '#ff9800' }]}>
              <Ionicons name="enter" size={30} color="#fff" />
            </View>
            <Text style={styles.actionText}>Join Group</Text>
            <Text style={styles.actionDescription}>Join an existing group with a code</Text>
            <Ionicons name="chevron-forward" size={22} color="#777" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/presetLists')}>
            <View style={[styles.actionIcon, { backgroundColor: '#9c27b0' }]}>
              <Ionicons name="list" size={30} color="#fff" />
            </View>
            <Text style={styles.actionText}>Pre-set Lists</Text>
            <Text style={styles.actionDescription}>Choose from ready-made activity ideas</Text>
            <Ionicons name="chevron-forward" size={22} color="#777" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/myLists')}>
            <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="create" size={30} color="#fff" />
            </View>
          <Text style={styles.actionText}>My Lists</Text>
          <Text style={styles.actionDescription}>Create and manage your own activity lists</Text>
          <Ionicons name="chevron-forward" size={22} color="#777" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#f44336" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
    marginBottom: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 60,
    color: '#3f51b5',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  actionContainer: {
    marginTop: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3f51b5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  actionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 12,
  },
  logoutText: {
    color: '#f44336',
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '500',
  },
    notificationWrapper:{
      position: 'absolute',
      top: 40,
      right: 20,
      zIndex: 9999, //make it so that it will go to the front rather than behind
    },
});