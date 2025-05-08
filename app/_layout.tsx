import { Stack } from "expo-router";
import React from 'react';
import { StyleSheet } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { GroupProvider } from '../contexts/GroupContext';
import { NotificationProvider } from '../contexts/NotificationContext';

const LayoutInner = () => {
  return <Stack />;
};

const Layout = () => {
  return (
    <AuthProvider>
      <GroupProvider>
        <NotificationProvider>
          <LayoutInner />
        </NotificationProvider>
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
