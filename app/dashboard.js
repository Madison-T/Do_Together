import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { NotificationSystem } from '../components/NotificationSystem';
import { useAuth } from '../contexts/AuthContext';
import notificationService from '../modules/notificationService';

//Keep the splash screen visible 
SplashScreen.preventAutoHideAsync();

//Configure default notification behaviour
if(Platform.OS !== 'web'){
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export default function Dashboard ()  {
    const router = useRouter();
    const { logoutUser } = useAuth();
    const [ready, setReady] = useState(false);

    const handleLogout = () =>{
        logoutUser();
        router.replace('/');
    };

    //Initialise notification service
    useEffect(()=>{
      async function prepare(){
        try{
          await notificationService.initialize();
  
          await new Promise(resolve => setTimeout(resolve, 1000));
        }catch(e){
          console.warn(e);
        }finally{
          setReady(true);
        }
      }

      prepare();
    }, []);

    //Handle app being ready
    useEffect(()=>{
      if(ready){
        SplashScreen.hideAsync();
      }
    }, [ready]);

    if(!ready){
      return null;
    }

    return(
        <View style={styles.container}>
          {/** Notification Bell */}
          <View style={{alignItems: 'flex-end'}}>
            <NotificationSystem />
          </View>
            <Text style={styles.title}>Do Together</Text>
            <Text style={styles.subtitle}>Organise activities with friends</Text>

            <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={()=>router.push('/groups')}>
                    <View style={styles.actionIcon}>
                        <Ionicons name="people" size={30} color="#fff" />
                    </View>
                    <Text style={styles.actionText}>My Groups</Text>
                    <Text style={styles.actionDescription}>View and manage your groups</Text>
                    <Ionicons name="chevron-forward" size={22} color="#777" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={()=>router.push('/createGroup')}>
                    <View style={[styles.actionIcon, {backgroundColor: '#4caf50'}]}>
                        <Ionicons name="add-circle" size={30} color="#fff" />
                    </View>
                    <Text style={styles.actionText}>Create Group</Text>
                    <Text style={styles.actionDescription}>Start a new group for activities</Text>
                    <Ionicons name="chevron-forward" size={22} color="#777" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={()=>router.push('/joinGroup')}>
                    <View style={[styles.actionIcon, {backgroundColor: '#ff9800'}]}>
                        <Ionicons name="enter" size={30} color="#fff" />
                    </View>
                    <Text style={styles.actionText}>Join Group</Text>
                    <Text style={styles.actionDescription}>Join an existing group with a code</Text>
                    <Ionicons name="chevron-forward" size={22} color="#777" />
                </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#f44336" />
                <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
        </View>
    )
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
      padding: 20,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginTop: 60,
      color: '#3f51b5',
    },
    subtitle: {
      fontSize: 16,
      color: '#666',
      marginBottom: 40,
    },
    actionContainer: {
      marginTop: 20,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    actionIcon: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#3f51b5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    actionTextContainer: {
      flex: 1,
    },
    actionText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      flex: 1,
    },
    actionDescription: {
      fontSize: 14,
      color: '#666',
      marginTop: 4,
      flex: 1,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 'auto',
      paddingVertical: 12,
    },
    logoutText: {
      color: '#f44336',
      marginLeft: 6,
      fontSize: 16,
      fontWeight: '500',
    },
  });

