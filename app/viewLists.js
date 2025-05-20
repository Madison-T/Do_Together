import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useUserLists } from '../contexts/UserListsContext';

export default function ListDetailsScreen() {
    const router = useRouter();
    const { listId, listType } = useLocalSearchParams();
    
    const {currentList, listLoading, listError, loadListDetails, addActivity, removeActivity} = useUserLists();

    const [newActivity, setNewActivity] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        loadListData();
    }, [listId]);

    const loadListData = async () => {
        if(listId){
            await loadListDetails(listId);
        }
    };


    const handleAddActivity = async () => {
        if(!newActivity.trim()){
            Alert.alert('Error', 'Please enter an activity');
            return;
        }

        try{
            setIsAdding(true);
            const result = await addActivity(listId, newActivity.trim());

            if(result.success){
                setNewActivity('');
            }else{
                Alert.alert('Error', result.error || 'Failed to add activity');
            }
        }catch(error){
            console.error("Failed to add activity:", error);
        }finally{
            setIsAdding(false);
        }
    };

    const handleRemoveActivity = async (activityToRemove) => {
        const result = await removeActivity(listId, activityToRemove);
        if(!result.success){
            Alert.alert('Error', result.error || 'Failed to remove activity');
        }
    };

    const renderActivity = ({ item }) => (
        <View style={styles.activityItem}>
            <Text style={styles.activityText}>{item}</Text>
            
            <TouchableOpacity 
                style={styles.removeActivityButton}
                onPress={() => handleRemoveActivity(item)}
            >
                <Ionicons name="close-circle" size={24} color="#f44336" />
            </TouchableOpacity>
        </View>
    );

    if (listLoading) {
        return (
            <View style={styles.centeredContainer}>
                <ActivityIndicator size="large" color="#3f51b5" />
                <Text style={styles.loadingText}>Loading list details...</Text>
            </View>
        );
    }

    if (listError) {
        return (
            <View style={styles.centeredContainer}>
                <Ionicons name="alert-circle" size={60} color="#f44336" />
                <Text style={styles.errorText}>{listError}</Text>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!currentList) {
        return null;
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={100}
        >
            <View style={styles.header}>
                <Text style={styles.title}>{currentList.title}</Text>
            </View>
            
            <Text style={styles.sectionTitle}>
                Activities ({currentList.activities?.length || 0})
            </Text>
            
            {/* Add New Activity Input */}
            <View style={styles.addActivityContainer}>
                <TextInput
                    style={styles.addActivityInput}
                    value={newActivity}
                    onChangeText={setNewActivity}
                    placeholder="Add a new activity..."
                    maxLength={100}
                />
                <TouchableOpacity
                    style={[styles.addActivityButton, isAdding && styles.addingButton]}
                    onPress={handleAddActivity}
                    disabled={isAdding || !newActivity.trim()}
                >
                    {isAdding ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Ionicons name="add" size={24} color="#fff" />
                    )}
                </TouchableOpacity>
            </View>
            
            {currentList.activities?.length > 0 ? (
                <FlatList
                    data={currentList.activities}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={renderActivity}
                    contentContainerStyle={styles.activitiesList}
                />
            ) : (
                <View style={styles.emptyContainer}>
                    <Ionicons name="list" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>No activities in this list yet</Text>
                    <Text style={styles.emptySubtext}>
                        Add your first activity using the field above!
                    </Text>
                </View>
            )}
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f5f5f5',
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        marginTop: 10,
        fontSize: 18,
        color: '#f44336',
        textAlign: 'center',
    },
    backButton: {
        marginTop: 20,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#3f51b5',
        borderRadius: 8,
    },
    backButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#3f51b5',
        flex: 1,
    },
    editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3f51b5',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    editButtonText: {
        color: 'white',
        marginLeft: 5,
        fontWeight: '500',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
        marginBottom: 15,
    },
    // New styles for add activity input
    addActivityContainer: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    addActivityInput: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        fontSize: 16,
        marginRight: 10,
    },
    addActivityButton: {
        backgroundColor: '#4CAF50',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    addingButton: {
        backgroundColor: '#81C784',
    },
    activitiesList: {
        paddingBottom: 20,
    },
    activityItem: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    activityText: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    removeActivityButton: {
        padding: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#888',
        marginTop: 10,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#aaa',
        marginTop: 5,
        textAlign: 'center',
    },
});