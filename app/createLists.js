import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { listCategories, useUserLists } from '../contexts/UserListsContext';

export default function CreateListScreen() {
    const router = useRouter();
    const {createList} = useUserLists();
    const [title, setTitle] = useState('');
    const [activities, setActivities] = useState(['']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

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
        setErrorMessage('');

        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a list title');
            return;
        }

        const hasActivities = activities.some(activity => activity.trim() !== '');
            if(!hasActivities){
                Alert.alert("Error", "Please add at least one activity");
                return;
            }

        try{
            setIsSubmitting(true);            

            const filteredActivities = activities.filter(activity => activity.trim() !== '');
            const result = await createList(title, filteredActivities, selectedCategory);

            if(result.success){
                setTitle('');
                setActivities([]);
                setSelectedCategory(null);
                setIsSubmitting(false);
                router.push({
                    pathname: '/viewLists',
                    params: {
                        listId: result.id,
                        listType: 'regular',
                    }
                });
            }else{
                setIsSubmitting(false);
                setErrorMessage(result.error || 'Failed to create list. Please try again');
            }
        }catch(error){
            console.error("Error in create list flow:", error);
            setIsSubmitting(false);
            setErrorMessage('An unexpected error occured. Please try again');
        }

    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Create New List</Text>
            
            {/** Display error message if there is one */}
            {errorMessage ? (
                <View style={styles.errorContainer}>
                    <Ionicons name="close-circle" size={24} color="#d32f2f" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
            ): null}

            <View style={styles.formGroup}>
                <Text style={styles.label}>List Title</Text>
                <TextInput
                    style={styles.input}
                    value={title}
                    onChangeText={(text) =>{
                        setTitle(text);
                        setErrorMessage('');
                    }}
                    placeholder="Enter list title"
                    maxLength={50}
                />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Category (Optional)</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesContainer}
                    contentContainerStyle={styles.categoriesContent}
                >
                    {listCategories.map((category) => (
                        <TouchableOpacity
                            key={category.id}
                            style={[
                                styles.categoryChip,
                                selectedCategory?.id === category.id && styles.selectedCategoryChip
                            ]}
                            onPress={() => setSelectedCategory(category)}
                        >
                            <Ionicons 
                                name={category.icon}
                                size={16}
                                color={selectedCategory?.id === category.id ? '#fff': category.color}
                            />
                            <Text style = {[
                                styles.categoryChipText,
                                selectedCategory?.id === category.id && styles.selectedCategoryChipText
                            ]}>
                                {category.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                {
                    selectedCategory && (
                        <TouchableOpacity
                            style={styles.clearCategoryButton}
                            onPress={() => setSelectedCategory(null)}
                        >
                            <Text style={styles.clearCategoryText}>Clear category</Text>
                        </TouchableOpacity>
                    )
                }
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
    errorContainer:{
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 3,
        borderColor: '#d32f2f',
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText:{
        marginLeft: 10,
        color: 'black',
        fontSize: 14,
        textAlign: 'center',
    },
    categoriesContainer: {
        flexDirection: 'row',
    },
    categoriesContent: {
        paddingHorizontal: 4,
    },
    categoryChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        backgroundColor: '#fff',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
    },
    selectedCategoryChip: {
        backgroundColor: '#3f51b5',
        borderColor: '#3f51b5',
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#666',
        marginLeft: 4,
    },
    selectedCategoryChipText: {
        color: '#fff',
    },
    clearCategoryButton: {
        alignSelf: 'flex-start',
        marginTop: 8,
        paddingVertical: 4,
    },
    clearCategoryText: {
        fontSize: 12,
        color: '#3f51b5',
        textDecorationLine: 'underline',
    },
});