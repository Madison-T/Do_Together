import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

const Index = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect if user is logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace('../dashboard');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to DoTogether</Text>

      <Text style={styles.subtitle}>Please sign up or log in to get started</Text>

      <Button title="Go to Sign Up" onPress={() => router.push('../signup')} />
      <View style={{ marginVertical: 10 }} />
      <Button title="Go to Login" onPress={() => router.push('../login')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  subtitle: { fontSize: 16, marginBottom: 30 }
});

export default Index;
