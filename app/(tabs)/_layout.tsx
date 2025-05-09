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
              bottom: 50,
              left: 16,
              right: 16,
              borderRadius: 30,
              height: 70,
              backgroundColor: '#fff',
              elevation: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
            },
            tabBarIcon: ({ color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'help';

              if (route.name === 'dashboard') iconName = 'grid';
              else if (route.name === 'swipe') iconName = 'heart';
              else if (route.name === 'history') iconName = 'time';

              return <Ionicons name={iconName} size={size} color={color} />;
            },
          })}
        >
          <Tabs.Screen name="dashboard" options={{ title: 'Dashboard' }} />
          <Tabs.Screen name="swipe" options={{ title: 'Swipe' }} />
          <Tabs.Screen name="history" options={{ title: 'History' }} />
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
