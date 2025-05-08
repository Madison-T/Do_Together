import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as FirestoreService from '../hooks/useFirestore';

export default function UserSearchModal({visible, onClose, onAddUser, currentMembers, groupId}){
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    useEffect(()=>{
        if(visible){
            fetchUsers();
        }
    }, [visible]);

    useEffect(()=>{
        if(users.length > 0 && searchQuery.trim() !== ''){
            const filtered = users.filter(user =>
                //filter out users already in the group and filter by name containing search query
                !currentMembers.includes(user.id) && user.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredUsers(filtered);
        }else{
            setFilteredUsers([]);
        }
    }, [searchQuery, users, currentMembers]);

    const fetchUsers = async () =>{
        setLoading(true);
        try{
            const allUsers = await FirestoreService.fetchUsers();
            setUsers(allUsers);
        }catch(error){
            console.error('Error fetching users', error);
        }finally{
            setLoading(false);
        }
    };

    const toggleUserSelection = (userId) =>{
        if(selectedUsers.includes(userId)){
            setSelectedUsers(selectedUsers.filter(id=>id !== userId));
        }else{
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleAddSelectedUsers = async() =>{
        if(selectedUsers.length === 0){
            return;
        }
        try{
            await onAddUser(selectedUsers);
            setSelectedUsers([]);
            setSearchQuery('');
            onClose();
        }catch(error){
            console.error("Error adding users to group", error);
        }
    }

    const renderUser = ({ item }) =>(
        <TouchableOpacity
            style={[
                styles.userItem,
                selectedUsers.includes(item.id) && styles.selectedUserItem
            ]}
            onPress={() => toggleUserSelection(item.id)}
        >
            <View style={styles.userAvatar}>
                <Text style={styles.userInitial}>
                    {item.name.charAt(0).toUpperCase()}
                </Text>
            </View>
            <Text style={styles.userName}>{item.name}</Text>
            {selectedUsers.includes(item.id) && (
                <Ionicons name="checkmark-circle" size={24} color="#3f51b5" />
            )}
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType='slide'
            transparent={false}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Add Members</Text>
                    <TouchableOpacity
                        onPress={handleAddSelectedUsers}
                        disabled={selectedUsers.length === 0}
                        style={[
                            styles.addButton,
                            selectedUsers.length === 0 && styles.disabledButton
                        ]}
                    >
                        <Text style={styles.addButtonText}>
                            Add ({selectedUsers.length})
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder='Search users by name...'
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        autoCapitalize='none'
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color="#666" />
                        </TouchableOpacity>
                    )}
                </View>

                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3f51b5" />
                    </View>
                ):(
                    <>
                        {searchQuery.trim() === '' ? (
                            <View style={styles.emptyStateContainer}>
                                <Text style={styles.emptyStateText}>
                                    Search for users by name to add them to your group
                                </Text>
                            </View>
                        ): filteredUsers.length === 0 ? (
                            <View style={styles.emptyStateContainer}>
                                <Text style={styles.emptyStateText}>
                                    No users found matching "{searchQuery}"
                                </Text>
                            </View>
                        ):(
                            <FlatList
                                data={filteredUsers}
                                renderItem={renderUser}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={styles.userList}
                            />
                        )}
                    </>
                )}
            </SafeAreaView>
        </Modal>
    )
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#f5f5f5',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
      backgroundColor: '#fff',
    },
    closeButton: {
      padding: 8,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
    },
    addButton: {
      backgroundColor: '#3f51b5',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    disabledButton: {
      backgroundColor: '#9e9e9e',
    },
    addButtonText: {
      color: '#fff',
      fontWeight: 'bold',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      margin: 16,
      paddingHorizontal: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 48,
      fontSize: 16,
    },
    clearButton: {
      padding: 4,
    },
    userList: {
      paddingHorizontal: 16,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#fff',
      marginBottom: 8,
      borderRadius: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 1,
    },
    selectedUserItem: {
      backgroundColor: '#e8eaf6',
    },
    userAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#3f51b5',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    userInitial: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    userName: {
      fontSize: 16,
      color: '#333',
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    emptyStateText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
    },
  });