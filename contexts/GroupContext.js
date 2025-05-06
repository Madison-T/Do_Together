import { nanoid } from 'nanoid'; // Importing shortid for generating unique IDs
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as FirestoreService from '../hooks/useFirestore';
import { useAuth } from './AuthContext';

//Create the context
export const GroupContext = createContext();

//Custom hook to use the group context
export const useGroupContext = () => useContext(GroupContext);

//Provider Component
export const GroupProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [groups, setGroups] = useState([]);
    const [error, setError] = useState(null);

    const {user : currentUser} = useAuth();

    //Set up the authentication state listener
    useEffect(()=>{
       if(currentUser){
        fetchUserGroups(currentUser.uid);
       }else{
        setGroups([]);
       }
    }, [currentUser]);


    //Fetch all the groups the user is a member of
    const fetchUserGroups = async (userId) =>{
        setLoading(true);
        setError(null);
        try{
            const userGroups = await FirestoreService.fetchUserGroups(userId);
            setGroups(userGroups || []);
        }catch(error){
            setError("Failed to fetch groups");
            console.error("Error fetching groups", error);
        }finally{
            setLoading(false);
        }
    };

    //Creating a new group
    const createGroup = async (groupName, description) =>{
        setLoading(true);
        setError(null);

        try{
            if(!currentUser){
                throw new Error("User not authenticated");
            }

            const groupId = nanoid(8);
            const joinCode = groupId;

            await FirestoreService.addGroup(
                groupId,
                groupName,
                description,
                [currentUser.uid], //Initial members array with only the creator
                currentUser.uid, //created by
                joinCode
            );

            //Add the new group to the local state
            const newGroup = {
                id: groupId,
                name: groupName,
                description,
                members: [currentUser.uid],
                createdBy: currentUser.uid,
                createdAt: new Date().toISOString(),
                joinCode: joinCode
            };

            setGroups([...groups, newGroup]);
            setLoading(false);

            return { groupId, groupName, joinCode}
        } catch(error){
            setError("Failed to create group");
            console.error("Error creating group:", error);
            setLoading(false);
            throw error;
        }
    };

    const joinGroup = async (groupId) =>{
        setLoading(true);
        setError(null);
        try {
            if(!currentUser){
                throw new Error("User not authenticated");
            }

            //Check if group exists
            const group = await FirestoreService.fetchGroupById(groupId);
            if(!group){
                setError("Group not found");
                return;
            }

            // check if user is already a member
            if(group.members && group.members.includes(currentUser.uid)) {
                setError("You are already a member of this group");
                setLoading(false);
                return {
                    success : false, 
                    message: "You are already a member of this group"
                };
            }

            //add user to group
            const updatedMembers = [...(group.members || []), currentUser.uid];
            await FirestoreService.updateGroup(groupId, { members: updatedMembers});


            //Update the local state
            await fetchUserGroups(currentUser.uid);

            return {
                success: true,
                groupId: groupId,
                groupName: group.name,
                message: "You have successfully joined the group",
            };
    } catch (error){
        setError("Failed to join group");
        console.error("Error joining group", error);
        setLoading(false);
        throw error;
    } finally {
        setLoading(false);
    }
}

    const leaveGroup = async(groupId) =>{
        setLoading(true);
        setError(null);
        try{
            if (!currentUser){
                throw new Error("User not authenticated");
            }

            //fetch the gorup
            const group = await FirestoreService.fetchGroupById(groupId);
            if(!group){
                throw new Error("Group not found");
            }

            //check if user is a member of the group
            if(!group.members || !group.members.includes(currentUser.uid)){
                setError("You are not a member of this group");
                setLoading(false);
                return {
                    success: false,
                    messgae: "You are not a member of this group"
                };
            }

            //check if user is the admin of the group
            if (group.createdBy === currentUser.uid) {
                setError("You cannot leave a group you are admin of.");
                setLoading(false);
                return {
                    success: false,
                    message: "Admin cannot leave the group"
                };
            }

            //remoce user from members array
            const updatedMembers = group.members.filter(id => id !== currentUser.uid);
            await FirestoreService.updateGroup(groupId, { members: updatedMembers });

            //update loacl state by removing the group
            setGroups(groups.filter(group => group.id !== groupId));
            
            return {success: true };
        } catch(error) {
            setError("Failed to leave group");
            console.error("Error leaving group", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const createActivity = async(groupId) =>{

    };

    //context value
    const value ={
        loading,
        groups,
        error,
        createGroup,
        joinGroup,
        leaveGroup,
        createActivity,
        refreshGroups: () => currentUser && fetchUserGroups(currentUser.uid),
    };

    return (
        <GroupContext.Provider value={value}>
            {children}
        </GroupContext.Provider>
    );

};