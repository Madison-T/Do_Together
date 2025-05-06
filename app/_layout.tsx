import { Stack, useRouter } from "expo-router";
import React from 'react';
import { Button, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { GroupProvider } from '../contexts/GroupContext';

const LayoutInner = () => {
  const { user, logoutUser } = useAuth();
  const router = useRouter();

  const handleLogout = () =>{
    logoutUser();
    router.replace('/');
};
  return (
    <>
      {/* Sign Out Button only if user is logged in */}
      {user && (
        <View style={styles.logoutContainer}>
          <Button title="Sign Out" onPress={handleLogout} />
        </View>
      )}
      <Stack />
    </>
  );
};

const Layout = () => {
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
    zIndex: 100,  // make sure it's on top
  },
});

export default Layout;
