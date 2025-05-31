import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { GroupProvider } from '../contexts/GroupContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { PresetListsProvider } from '../contexts/PresetListsContext';
import { UserListsProvider } from '../contexts/UserListsContext';
import { VotingSessionProvider } from '../contexts/VotingSessionContext';

const LayoutInner = () => {
  return <Stack />;
};

const Layout = () => {
  return (
    <AuthProvider>
      <GroupProvider>
        <PresetListsProvider>
          <VotingSessionProvider>
            <NotificationProvider>
              <UserListsProvider>
                <LayoutInner />
              </UserListsProvider>
            </NotificationProvider>
          </VotingSessionProvider>
        </PresetListsProvider>
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
