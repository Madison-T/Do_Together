import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet } from 'react-native';
import { AuthProvider } from '../contexts/AuthContext';
import { GroupProvider } from '../contexts/GroupContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { PresetListsProvider } from '../contexts/PresetListsContext'; // ✅ Add this import
import { VotingSessionProvider } from '../contexts/VotingSessionContext';

import { UserListsProvider } from '../contexts/UserListsContext';

const LayoutInner = () => {
  return <Stack />;
};

const Layout = () => {
  return (
    <AuthProvider>
  <GroupProvider>
    <PresetListsProvider>
      {/* put your notification context *around* anything that might need to send notifications */}
      <NotificationProvider>
        {/* now both VotingSession and UserLists can call `useNotifications()` */}
        <VotingSessionProvider>
          <UserListsProvider>
            <LayoutInner />
          </UserListsProvider>
        </VotingSessionProvider>
      </NotificationProvider>
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
