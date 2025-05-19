import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { addDoc, collection } from 'firebase/firestore';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth, firestore } from '../firebaseConfig';

export default function CreateListScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [activities, setActivities] = useState(['']);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddActivity = () => {
        setActivities([...activities, '']);
    };

    const handleActivityChange = (text, index) => {
        const newActivities = [...activities];
        newActivities[index] = text;
        setActivities(newActivities);
    };

    const handleRemoveActivity = (index) => {
        if (activities.length > 1) {
            const newActivities = [...activities];
            newActivities.splice(index, 1);
            setActivities(newActivities);
        }
    };

    const handleCreateList = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a list title');
            return;
        }

        // Filter out empty activities
        const filteredActivities = activities.filter(activity => activity.trim() !== '');
        
        if (filteredActivities.length === 0) {
            Alert.alert('Error', 'Please add at least one activity');
            return;
        }

        if (!auth.currentUser) {
            Alert.alert('Error', 'You must be logged in to create a list');
            return;
        }

        try {
            setIsSubmitting(true);
            
            const listData = {
                title: title.trim(),
                activities: filteredActivities,
                userId: auth.currentUser.uid,
                createdAt: new Date()
            };

            // Add a new document to the "lists" collection
            const docRef = await addDoc(collection(firestore, "userLists"), listData);
            
            Alert.alert(
                'Success',
                'Your list has been created!',
                [
                    { 
                        text: 'OK', 
                        onPress: () => router.replace('/my-lists')
                    }
                ]
            );
        } catch (error) {
            console.error('Error creating list:', error);
            Alert.alert('Error', 'Failed to create list. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Create New List</Text>
            
            <View style={styles.formGroup}>
                <Text style={styles.label}>List Title</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Enter list title"
                    maxLength={50}
                />
            </View>
            
            <View style={styles.formGroup}>
                <Text style={styles.label}>Activities</Text>
                
                {activities.map((activity, index) => (
                    <View key={index} style={styles.activityRow}>
                        <TextInput
                            style={styles.activityInput}
                            value={activity}
                            onChangeText={(text) => handleActivityChange(text, index)}
                            placeholder={`Activity ${index + 1}`}
                            maxLength={100}
                        />
                        
                        <TouchableOpacity
                            style={styles.removeButton}
                            onPress={() => handleRemoveActivity(index)}
                            disabled={activities.length === 1}
                        >
                            <Ionicons
                                name="close-circle"
                                size={24}
                                color={activities.length === 1 ? '#ccc' : '#f44336'}
                            />
                        </TouchableOpacity>
                    </View>
                ))}
                
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={handleAddActivity}
                >
                    <Ionicons name="add-circle" size={20} color="#4CAF50" />
                    <Text style={styles.addButtonText}>Add Another Activity</Text>
                </TouchableOpacity>
            </View>
            
            <View style={styles.buttonsContainer}>
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => router.back()}
                    disabled={isSubmitting}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                    style={[styles.createButton, isSubmitting && styles.disabledButton]}
                    onPress={handleCreateList}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <Text style={styles.createButtonText}>Creating...</Text>
                    ) : (
                        <Text style={styles.createButtonText}>Create List</Text>
                    )}
                </TouchableOpacity>
            </View>
        </ScrollView>
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
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#333',
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    activityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    activityInput: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    removeButton: {
        padding: 8,
        marginLeft: 8,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    addButtonText: {
        color: '#4CAF50',
        fontSize: 16,
        marginLeft: 5,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        marginBottom: 50,
    },
    cancelButton: {
        flex: 1,
        padding: 15,
        backgroundColor: '#f1f1f1',
        borderRadius: 8,
        alignItems: 'center',
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '500',
    },
    createButton: {
        flex: 2,
        padding: 15,
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#a5d6a7',
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
});