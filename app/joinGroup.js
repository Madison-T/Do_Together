import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useGroupContext } from '../contexts/GroupContext';
import { useNotificationContext } from '../contexts/NotificationContext';
import { auth, firestore } from '../firebaseConfig';

export default function JoinGroup() {
  const [groupCode, setGroupCode] = useState('');
  const { joinGroup, loading, error, clearError} = useGroupContext();
  const { sendToGroup} = useNotificationContext();

  const handleJoinGroup = async () => {
    if (!groupCode.trim()) {
      Alert.alert('Error', 'Please enter a group code.');
      return;
    }

    try {
      const result = await joinGroup(groupCode);

      if (result.success) {
        //get current user details
        const currentUser = auth.currentUser;
        const userName = currentUser?.displayName || 'A new member';

        //Create a notification for all group members about the new join
        try{
          const membersRef = collection(firestore, 'Groups');
          const membersQuery = query(
            membersRef,
            where('groupId', '==', result.groupId),
            where('members', '!=', currentUser.uid),
          );

          const membersSnapshot = await getDocs(membersQuery);
          if(!membersSnapshot.empty){
            const memberIds = membersSnapshot.docs.map(doc => doc.data().userId);

            await sendToGroup(
              result.groupId,
              memberIds,
              'New Member Joined',
              `${userName} has joined the group "${result.groupName}"`,
              {
                type: 'member_joined_group',
                id: result.groupId
              }
            );
          }

          console.log("Member joined notification sent successfully");
        }catch(notificationError){
          console.error("Failed to send notification: ", notificationError);
        }
        router.push(`/viewGroup?groupId=${result.groupId}&groupName=${result.groupName}`);
        setGroupCode('') ;
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      console.log("Error joining group:", error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    }
  };

  const handleCancel = () => {
    clearError();
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
      >
        <View style={styles.formContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleCancel}
          >
            <Ionicons name="arrow-back" size={24} color="#3f51b5" />
          </TouchableOpacity>

          <Text style={styles.title}>Join a Group</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Group Code</Text>
            <TextInput
              style={styles.input}
              value={groupCode}
              onChangeText={setGroupCode}
              placeholder="Enter group code"
              placeholderTextColor="#888"
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.joinButton, loading && styles.disabledButton]}
            onPress={handleJoinGroup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Join Group</Text>
            )}
          </TouchableOpacity>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3f51b5',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  joinButton: {
    backgroundColor: '#3f51b5',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9e9e9e',
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  }
});
