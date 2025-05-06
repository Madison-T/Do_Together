
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from '../firebaseConfig';
import * as FirestoreService from '../hooks/useFirestore';

export default function Groups(){
    const [userGroups, setUserGroups] = useState([]);
    const[loading, setLoading] = useState(true);

    const currentUserId = auth.currentUser?.uid;

    useEffect(()=>{
        const fetchUserGroups = async() =>{
            setLoading(true);
            try{
                const groups = await FirestoreService.fetchUserGroups(currentUserId);
                setUserGroups(groups);
            }catch(error){
                console.error("Error fetching user groups", error);
            }finally{
                setLoading(false);
            }
        };

        if(currentUserId){
            fetchUserGroups();
        }
    }, [currentUserId]);

    const handleGroupSelect = (group) =>{
        router.push({pathname: '/viewGroup', params: {groupId: group.id, groupName: group.name}});
    };

    const renderGroupItem = ({item}) =>(
        <TouchableOpacity style={styles.groupItem} onPress ={()=> handleGroupSelect(item)}>
            <View style={styles.groupInfo}>
                <Text style={styles.groupInitial}>
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </View>
            <View style ={styles.groupDetails}>
                <Text style={styles.groupName}>{item.name}</Text>
                {item.description && (
                    <Text style={styles.groupDescription} numberOfLines={1}>
                        {item.description}
                    </Text>
                )}
                <Text style={styles.memberCount}>
                    {(item.members?.length || 0)} member{item.members?.length !== 1 ? 's' : ''}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#aaa" />
        </TouchableOpacity>
    );

    if(loading){
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3f51b5" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress = {()=>router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#3f51b5" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Groups</Text>
            </View>

            {userGroups.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyTitle}>No Groups Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Create a new group or join an existing one
                    </Text>
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#3f51b5'}]} onPress={() => router.push('/createGroup')}>
                            <Ionicons name="add-circle-outline" size={20} color="#fff" />
                            <Text style={styles.actionButtonText}>Create Group</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, {backgroundColor: '#4caf50'}]} onPress={()=>router.push('/joinGroup')}>
                            <Ionicons name="enter-outline" size={20} color = '#fff' />
                            <Text style={styles.actionButtonText}>Join Group</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            ) : (
                <>
                    <FlatList data = {userGroups} renderItem={renderGroupItem} keyExtractor={(item) =>item.id} contentContainerStyle={styles.listContainer} />
                    <TouchableOpacity style={styles.createButton} onPress={()=>router.push('/createGroup')}>
                        <Ionicons name="add" size={24} color="#fff" />
                    </TouchableOpacity>
                </>
            )}
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      paddingTop: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      backgroundColor: '#fff',
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginLeft: 10,
      color: '#333',
    },
    listContainer: {
      padding: 16,
    },
    groupItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#fff',
      borderRadius: 10,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    groupInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    groupAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      backgroundColor: '#3f51b5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    groupInitial: {
      color: '#fff',
      fontSize: 22,
      fontWeight: 'bold',
    },
    groupDetails: {
      flex: 1,
    },
    groupName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 4,
    },
    groupDescription: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    memberCount: {
      fontSize: 12,
      color: '#3f51b5',
      fontWeight: '500',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#333',
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      marginTop: 8,
      marginBottom: 24,
    },
    actionButtonsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      width: '100%',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginHorizontal: 8,
      minWidth: 150,
    },
    actionButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      marginLeft: 8,
    },
    createButton: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: '#3f51b5',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
  });