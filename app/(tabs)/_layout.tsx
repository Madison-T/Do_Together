// app/(tabs)/_layout.tsx
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function TabsLayout() {
  const { user, loading, logoutUser } = useAuth();
  const router = useRouter();

  // as soon as we know we're NOT authenticated, send back to '/'
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading]);

  // while Firebase is rehydrating, show a spinner
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // if still no user here, we've already routed back to '/' so bail
  if (!user) {
    return null;
  }

  // only authenticated users get these three tabs:
  return (
    <Tabs>
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard' }}
      />
      <Tabs.Screen
        name="swipe/index"
        options={{ title: 'Swipe' }}
      />
      <Tabs.Screen
        name="history/index"
        options={{ title: 'History' }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});




