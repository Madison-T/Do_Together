import { useRouter } from 'expo-router';
import React from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard ()  {
  const router = useRouter();
  const { logoutUser } = useAuth();

  const handleLogout = () => {
    logoutUser();
    router.replace('/'); // Redirect to the home page after logout
  };

    const navigateToCreateGroup = () =>{
      router.push('/createGroup');
    }
  
    const navigateToJoinGroup = () =>{
      router.push('/joinGroup');
    }
  
    const navigateToViewGroup = () =>{
      router.push('/viewGroup');
    }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Button title="Logout" onPress={handleLogout} />
      <Button title="Navigate to Create Group" onPress={navigateToCreateGroup} style={styles.button} />
      <Button title="Navigate to View Group" onPress={navigateToViewGroup} style={styles.button} />
      <Button title="Join Group" onPress={navigateToJoinGroup} style={styles.button} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
});

