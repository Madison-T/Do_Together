// app/index.tsx

import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Image,
} from 'react-native';
import AppButton from '../components/ui/AppButton';
import { useAuth } from '../contexts/AuthContext';
import { theme } from './theme';

const Index = () => {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace('../dashboard');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Logo with debugging - try different path options */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')} // Updated path
          style={styles.logo}
          resizeMode="contain"
          onError={(error) => {
            console.log('Image load error:', error);
            console.log('Make sure logo.png exists at: assets/images/logo.png');
          }}
          onLoad={() => console.log('Image loaded successfully')}
        />
      </View>

      <Text style={styles.title}>Welcome to DoTogether</Text>
      <Text style={styles.subtitle}>
        Please sign up or log in to get started
      </Text>

      <AppButton
        title="Go to Sign Up"
        onPress={() => router.push('../signup')}
      />
      <View style={{ marginVertical: theme.spacing.sm }} />
      <AppButton
        title="Go to Login"
        onPress={() => router.push('../login')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  logoContainer: {
    width: 180,
    height: 180,
    marginBottom: 32,
    backgroundColor: 'rgba(0,0,0,0.1)', // Light background to see container
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '130%',
    height: '130%',
  },
  title: {
    fontSize: 24,
    marginBottom: 12,
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default Index;