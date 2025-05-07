import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotificationContext } from '../contexts/NotificationContext';

export const NotificationSystem = () => {
  const {
    notifications,
    unreadCount,
    loading,
    permissionState,
    requestPermission,
    sendNotification,
    markAsRead,
    markAllAsRead,
    addLocalNotification
  } = useNotificationContext();
  
  const [showNotificationList, setShowNotificationList] = useState(false);

  // Toggle notifications panel
  const toggleNotificationList = () => {
    setShowNotificationList(prev => !prev);
  };

  // Send a test notification (for development purposes)
  const sendTestNotification = async () => {
    try {
      const testNotification = {
        id: String(Date.now()),
        title: 'Test Notification',
        body: 'This is a test notification from your app!',
        read: false,
        createdAt: new Date().toISOString(),
        data:{
            type:'added_to_group',
            groupId: 'test-group-id',
        },
      };
      
      addLocalNotification(testNotification);
      
      
      console.log('Test notification sent:');
    } catch (error) {
      console.error('Error sending test notification:', error);
      alert('Failed to send test notification: ' + error.message);
    }
  };

  // Handle permission request
  const handleRequestPermission = async () => {
    try {
      const granted = await requestPermission();
      
      if (granted) {
        alert('Notifications enabled successfully!');
      } else {
        alert('Please enable notifications in your device settings to receive updates.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      alert('Failed to enable notifications. Please check your device settings.');
    }
  };

  // Render a notification item in the list
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, item.read ? styles.read : styles.unread]}
      onPress={() => {
        markAsRead(item.id);
        
        // Handle notification action if needed
        if (item.data && item.data.type) {
          handleNotificationAction(item.data);
        }
      }}
    >
      <Text style={styles.title}>{item.title}</Text>
      <Text>{item.body}</Text>
      <Text style={styles.time}>
        {new Date(item.createdAt).toLocaleTimeString()} - {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  // Handle notification action based on type
  const handleNotificationAction = (data) => {
    console.log('Handling notification action:', data);
    if(!data?.type){
        console.warn("Notification data is missing type");
        return;
    }

    switch(data.type){
        case 'added_to_group':
            if(data.groupId){
                router.push({pathname:'/viewGroup', params:{groupId: data.groupId}});
            }
            break;

        case 'member_joined_group':
            if(data.groupId){
                router.push({pathname:'/viewGroup', params: {groupId: data.groupId}});
            }
            break;
        
        case 'new_voting_session':
            //to add
            break;
        
        case 'voting_ended':
            //to add
            break;
        
        default:
            console.warn ("Unhandled notification type:", data.type);
            break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Notification bell icon */}
      <TouchableOpacity style={styles.bell} onPress={toggleNotificationList}>
        <MaterialIcons name="notifications" size={28} color="#000" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Permission Prompt */}
      {permissionState !== 'granted' && Platform.OS !== 'ios' && (
        <View style={styles.permissionRequest}>
          <Text style={styles.permissionText}>
            Enable notifications to stay updated with your group activities.
          </Text>
          <TouchableOpacity onPress={handleRequestPermission} style={styles.permissionButton}>
            <Text style={styles.permissionButtonText}>Enable Notifications</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notification panel */}
      {showNotificationList && (
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Notifications</Text>
            <View style={styles.panelActions}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={markAllAsRead} style={styles.markAllRead}>
                  <Text style={styles.markAllReadText}>Mark all as read</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={toggleNotificationList}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>

          {loading ? (
            <Text style={styles.loading}>Loading notifications...</Text>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id}
              renderItem={renderNotificationItem}
              ListEmptyComponent={
                <Text style={styles.empty}>No notifications yet</Text>
              }
              style={styles.list}
            />
          )}

          {/* DEVELOPMENT ONLY */}
          {__DEV__ && (
            <TouchableOpacity style={styles.devButton} onPress={sendTestNotification}>
              <Text style={styles.devButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};  

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  bell: {
    position: 'relative',
    alignSelf: 'flex-end',
    padding: 10,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  permissionRequest: {
    marginVertical: 10,
    backgroundColor: '#ffecb3',
    padding: 10,
    borderRadius: 8,
  },
  permissionText: {
    fontSize: 14,
    marginBottom: 5,
  },
  permissionButton: {
    backgroundColor: '#ffa000',
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  permissionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  panel: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    width: 300,
    maxHeight: 400,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
      },
      default: {
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      }
    }),
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  panelActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    color: '#2196f3',
    fontWeight: '500',
  },
  markAllRead: {
    marginRight: 10,
  },
  markAllReadText: {
    color: '#666',
    fontSize: 12,
  },
  list: {
    maxHeight: 300,
  },
  notificationItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  time: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  read: {
    backgroundColor: '#f9f9f9',
  },
  unread: {
    backgroundColor: '#fff',
    borderLeftWidth: 3,
    borderLeftColor: '#2196f3',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    marginBottom: 20,
  },
  loading: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    marginBottom: 20,
  },
  devButton: {
    marginTop: 10,
    backgroundColor: '#3f51b5',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  devButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});