import { Ionicons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import type { JSX } from 'react';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { GroupProvider } from '../../contexts/GroupContext';
import { VotesProvider } from '../../contexts/VotesContext';

export default function TabsLayout(): JSX.Element | null {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <GroupProvider>
      <VotesProvider>
        <Tabs
          screenOptions={({ route }) => ({
            headerShown: true,
            tabBarStyle: {
              position: 'absolute',
              bottom: 20,
              left: 16,
              right: 16,
              borderRadius: 30,
              height: 60,
              backgroundColor: '#fff',
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
            },
            tabBarIcon: ({ color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'help';

              if (route.name === 'dashboard') iconName = 'grid';
              else if (route.name === 'swipe/index') iconName = 'heart';
              else if (route.name === 'results/index') iconName = 'time';

              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
          <Tabs.Screen name="swipe/index" options={{ title: 'Swipe' }} />
          <Tabs.Screen name="results/index" options={{ title: 'Results' }} />
        </Tabs>
      </VotesProvider>
    </GroupProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
