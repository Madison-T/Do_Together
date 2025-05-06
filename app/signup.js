import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function SignUp() {
  const { registerUser, error, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const router = useRouter();

  const handleSignUp = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      setLocalError('Name is required');
      return;
    }
    if (!emailRegex.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    setLocalError('');
    const success = await registerUser(email, password, name);

    if (success) {
      alert('Sign Up Successful!');
      router.replace('/dashboard');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <Text style={styles.title}>Sign Up</Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput
          placeholder="e.g. Jane Doe"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <Text style={styles.label}>Email Address</Text>
        <TextInput
          placeholder="e.g. jane@example.com"
          placeholderTextColor="#888"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          placeholder="At least 6 characters"
          placeholderTextColor="#888"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        {localError ? <Text style={styles.error}>{localError}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Sign Up" onPress={handleSignUp} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: 24,
    paddingTop: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    marginBottom: 4,
    fontWeight: '600',
    fontSize: 14,
  },
  input: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 16,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
