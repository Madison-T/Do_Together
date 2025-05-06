import { router } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useGroupContext } from '../contexts/GroupContext';


export default function GroupScreen() {
    const [groupName, setGroupName] = useState('');
    const [description, setDescription] = useState('');

    const {createGroup, loading, error, clearError} = useGroupContext();

    const handleCreateGroup = async () =>{
        //group name is required to make group
        if(!groupName.trim()){ 
            Alert.alert('Error', 'Please enter a group name');
            return;
        }

        try{
            //send the result to the create Group in group context
            const result = await createGroup(groupName.trim(), description.trim());
            
            if(result && result.groupId){
                //if created successfully go to the view group
                router.push(`/viewGroup?groupId=${result.groupId}&groupName=${groupName}`);

                //reset variables
                setGroupName('');
                setDescription('');
            }else{
                Alert.alert('Error', 'Failed to creat group. Please try again');
            }
            
        }catch(error){
            console.log("Error. Failed to create group", error);
        }
    };

    //go back to previous page (reset errors)
    const handleCancel = () =>{
        clearError();
        router.back();
    };
    
    return(
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardAvoidingContainer}
            >
                <View style={styles.formContainer}>
                    <Text style={styles.title}>Create a New Group</Text>

                    {/** Set Group Name part */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Group Name</Text>
                        <TextInput
                            style={styles.input}
                            value={groupName}
                            onChangeText={setGroupName}
                            placeholder='Enter group name'
                            placeholderTextColor='#888'
                        />
                    </View>

                    {/** Set Description part (optional) */}
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Description (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder='Enter group description'
                            placeholderTextColor='#888'
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    {/** Buttons */}
                    <View style={styles.buttonContainer}>
                        {/** Cancel button */}
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={handleCancel}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>

                        {/** Create group button */}
                        <TouchableOpacity
                            style={[styles.button, styles.createButton, loading && styles.disabledButton]}
                            onPress={handleCreateGroup}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ):(
                                <Text style={styles.buttonText}>Create Group</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/** Error message to show */}
                    {error && (
                        <Text style={styles.errorText}>{error}</Text>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    keyboardAvoidingContainer: {
        flex: 1,
    },
    formContainer: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#3f51b5',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    button: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 5,
    },
    cancelButton: {
        backgroundColor: '#9e9e9e',
    },
    createButton: {
        backgroundColor: '#3f51b5',
    },
    disabledButton: {
        backgroundColor: '#9e9e9e',
        opacity: 0.7,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    errorText: {
        color: 'red',
        marginTop: 10,
        textAlign: 'center',
    }
});