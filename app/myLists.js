import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useUserLists } from '../contexts/UserListsContext';

export default function MyListsScreen() {
    const router = useRouter();
    const {userLists, loading, deleteList, loadUserLists} = useUserLists();

    useEffect(()=>{
      loadUserLists();

      console.log("MyListsScreen mounted");
    }, []);

    const handleSelectList = (list) => {
        router.push({
            pathname: '/viewLists',
            params: {
                listId: list.id,
                listType: 'user',
            }
        });
    };

    const handleCreateNewList = () => {
        router.push('/createLists');
    };

    const handleDeleteList = async (listId) => {
        
        const success = await deleteList(listId);
        if(success){
          Alert.alert('Success', 'List deleted successfully');
        }else{
          Alert.alert("Error", "Failed to delete the list");
        }
    };

    const renderListItem = ({ item }) => (
        <View style={styles.listItemContainer}>
          <TouchableOpacity 
            style={styles.listItem}
            onPress={() => handleSelectList(item)}
          >
            <View style={styles.listItemContent}>
              <Text style={styles.listTitle}>{item.title || item.name || 'Untitled List'}</Text>
              <Text style={styles.listCount}>
              {item.listType === 'tmdb_watchlist'
                ? (item.tmdbContent?.length || 0)
                : (item.activities?.length || 0)}{' '}
              {(item.listType === 'tmdb_watchlist'
                ? (item.tmdbContent?.length === 1 ? 'activity' : 'activities')
                : (item.activities?.length === 1 ? 'activity' : 'activities'))}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#777" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleDeleteList(item.id)}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
          <Text style={styles.title}>My Activity Lists</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading your lists...</Text>
            </View>
          ) : userLists.length > 0 ? (
            <FlatList
              data={userLists}
              keyExtractor={(item) => item.id}
              renderItem={renderListItem}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="list" size={60} color="#ccc" />
              <Text style={styles.emptyText}>You havent created any lists yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first list to get started!
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.createButton}
            onPress={handleCreateNewList}
          >
            <Ionicons name="add" size={24} color="#fff" />
            <Text style={styles.createButtonText}>Create New List</Text>
          </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#f5f5f5',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginTop: 20,
      marginBottom: 20,
      color: '#3f51b5',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 18,
      color: '#666',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingBottom: 100,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '500',
      color: '#666',
      marginTop: 20,
    },
    emptySubtext: {
      fontSize: 16,
      color: '#888',
      marginTop: 10,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
    listContainer: {
      paddingBottom: 80,
    },
    listItemContainer: {
      flexDirection: 'row',
      marginBottom: 12,
      borderRadius: 10,
      overflow: 'hidden',
    },
    listItem: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    listItemContent: {
      flex: 1,
    },
    listTitle: {
      fontSize: 18,
      fontWeight: '500',
      color: '#333',
    },
    listCount: {
      fontSize: 14,
      color: '#666',
      marginTop: 5,
    },
    deleteButton: {
      backgroundColor: '#f44336',
      justifyContent: 'center',
      alignItems: 'center',
      width: 50,
    },
    createButton: {
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      backgroundColor: '#4CAF50',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      borderRadius: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    createButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '500',
      marginLeft: 8,
    },
});