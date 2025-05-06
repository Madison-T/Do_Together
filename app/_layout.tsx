import { Stack, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { GroupProvider } from '../contexts/GroupContext';

const LayoutInner: React.FC = () => {
  const { user, logoutUser } = useAuth();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await logoutUser();
    router.replace('/');
  }, [logoutUser, router]);

  return (
    <>
      {user && (
        <View style={styles.logoutContainer}>
          <Button title="Sign Out" onPress={handleLogout} />
        </View>
      )}
      <Stack />
    </>
  );
};

const Layout: React.FC = () => {
  return (
    <AuthProvider>
      <GroupProvider>
        <LayoutInner />
      </GroupProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  logoutContainer: {
    paddingTop: 40,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    zIndex: 100,
  },
});

export default Layout;
