import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { listCategories, useUserLists } from '../contexts/UserListsContext';
import { auth } from '../firebaseConfig';

export default function ListDetailsScreen() {
    const router = useRouter();
    const { listId, listType } = useLocalSearchParams();

    const {
        currentList,
        listLoading,
        listError,
        loadListDetails,
        addActivity,
        removeActivity,
        updateListCategory
    } = useUserLists();

    const [newActivity, setNewActivity] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    useEffect(() => {
        loadListData();
    }, [listId]);

    const loadListData = async () => {
        if (listId) {
            await loadListDetails(listId);
        }
    };

    const handleAddActivity = async () => {
        setErrorMessage('');

        if (!newActivity.trim()) {
            Alert.alert('Error', 'Please enter an activity');
            return;
        }

        try {
            const activityText = newActivity.trim();
            const isDuplicate = currentList.activities?.some(activity => {
                if(currentList.listType === 'tmdb_watchlist'){
                    return activity.title?.toLowerCase() === activityText.toLowerCase() ||
                        activity.tmdbId === activityText;
                }else{
                    const activityValue = typeof activity === 'string' ? activity : activity.title;
                    return activityValue?.toLowerCase() === activityText.toLowerCase();
                }
            });

            if (isDuplicate) {
                setErrorMessage('This activity already exists in the list');
                return;
            }

            setIsAdding(true);

            let activityToAdd;
            if(currentList.listType === 'tmdb_watchlist'){
                activityToAdd = {
                    title: activityText,
                    tmdbId: activityText,
                    contentType: 'movie',
                    addedAt: new Date(),
                    addedBy: auth.currentUser?.uid,
                    listId: listId
                };
            }else{
                activityToAdd = {
                    title: activityText,
                    addedAt: new Date()
                };
            }

            const result = await addActivity(listId, activityToAdd);

            if (result.success) {
                setNewActivity('');
            } else {
                setErrorMessage(result.error || 'Failed to add activity');
            }
        } catch (error) {
            console.error("Failed to add activity:", error);
            setErrorMessage('An unexpected error occured');
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemoveActivity = async (activityToRemove) => {
        const result = await removeActivity(listId, activityToRemove);
        if (!result.success) {
            Alert.alert('Error', result.error || 'Failed to remove activity');
        }
    };

    const handleCreateSession = () => {
        router.push({
            pathname: '/createVoteSession',
            params: { listId, listType: listType || 'user' }
        });
    };

    const handleCategorySelect = async(category) => {
        if(currentList && currentList.category !== category.id){
            const result = await updateListCategory(listId, category.id, currentList.listType);
            if(result.success){
                console.log('Success. List category updated');
            }else{
                console.log('Error. Failed to update category');
            }
        }
        setShowCategoryModal(false);
    };

    const currentCategory = listCategories.find(
        cat => cat.id === currentList?.category
    );

    const renderActivity = ({ item, index }) => (
  <View style={styles.activityItem} key={index}>
    <Text style={styles.activityText}>
      {typeof item === 'string'
        ? item
        : item.title || item.name || 'Untitled'}
    </Text>
    <TouchableOpacity
      style={styles.removeActivityButton}
      onPress={() => handleRemoveActivity(item)}
    >
      <Ionicons name="close-circle" size={24} color="#f44336" />
    </TouchableOpacity>
  </View>
);
    const activityCount = currentList?.activities?.length || 0;

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

                {/** Activity category */}
                <TouchableOpacity
                    onPress={() => setShowCategoryModal(true)}
                    style={[styles.categoryIconContainer, {backgroundColor: currentCategory.color}]}
                >
                    <Ionicons
                        name={currentCategory.icon}
                        size={24}
                        color='#fff'
                    />
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>
                Activities ({activityCount})
            </Text>

            {errorMessage ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="close-circle" size={24} color="#d32f2f" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            ) : null}

            <View style={styles.addActivityContainer}>
                <TextInput
                    style={styles.addActivityInput}
                    value={newActivity}
                    onChangeText={(text) => {
                        setNewActivity(text);
                        setErrorMessage('');
                    }}
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

            {activityCount > 0 ? (
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

            <TouchableOpacity
                style={[
                    styles.createSessionButton,
                    activityCount < 3 && styles.disabledButton
                ]}
                onPress={handleCreateSession}
                disabled={activityCount < 3}
            >
                <Text style={styles.createSessionText}>Start Voting Session</Text>
                {activityCount < 3 && (
                    <Text style={styles.disabledHint}>
                        Add at least 3 activities to start
                    </Text>
                )}
            </TouchableOpacity>

            {/** Category Modal */}
            <Modal  
                animationType='slide'
                transparent={true}
                visible={showCategoryModal}
                onRequestClose={() => setShowCategoryModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={()=> setShowCategoryModal(false)}
                >
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalTitle}>Change List Category</Text>
                        <FlatList
                            data={listCategories}
                            keyExtractor={(item) => item.id}
                            renderItem={({item}) => (
                                <TouchableOpacity
                                    style={styles.categoryOption}
                                    onPress={() => handleCategorySelect(item)}
                                >
                                    <Ionicons name={item.icon} size={20} color={item.color} style={styles.categoryOptionIcon} />
                                    <Text style={styles.categoryOptionText}>{item.name}</Text>
                                    {currentList?.category === item.id && (
                                        <Ionicons name={'checkmark-circle'} size={20} color="#4CAF50" />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity
                            style={styles.modalCloseButton}
                            onPress={() => setShowCategoryModal(false)}
                        >
                            <Text style={styles.modalCloseButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>

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
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#555',
        marginBottom: 15,
    },
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
    errorContainer: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 3,
        borderColor: '#d32f2f',
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText: {
        marginLeft: 10,
        color: 'black',
        fontSize: 14,
        textAlign: 'center',
    },
    createSessionButton: {
        marginTop: 30,
        backgroundColor: '#3f51b5',
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    createSessionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledHint: {
        color: 'white',
        fontSize: 12,
        fontStyle: 'italic',
        marginTop: 4,
    },
    categoryIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
    },
    modalOverlay:{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '80%',
        maxHeight: '70%',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: -.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#35f1b5',
    },
    categoryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    categoryOptionIcon:{
        marginRight: 10,
    },
    categoryOptionText:{
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    modalCloseButton: {
        marginTop: 20,
        padding: 12,
        backgroundColor: '#f44336',
        borderRadius: 8,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
