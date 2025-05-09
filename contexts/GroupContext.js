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

    //Join a new group
    const joinGroup = async (groupId) =>{
        setLoading(true);
        setError(null);
        try {
            //Can't join a group if they aren't logged in
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

    //Leave groups
    const leaveGroup = async(groupId) =>{
        setLoading(true);
        setError(null);
        try{
            //if not logged in they aren't in any groups
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

    //Remove member from group (admin only)
    const removeMember = async (groupId, memberId) => {
        setLoading(true);
        setError(null);
        try {
            if (!currentUser) {
                throw new Error("User not authenticated");
            }

            //fetch the group
            const group = await FirestoreService.fetchGroupById(groupId);
            if (!group) {
                throw new Error("Group not found");
            }

            //checking if current user is the admin
            if(group.createdBy !== currentUser.uid) {
                setError("Only the group creator can remove members");
                return {
                    success: false,
                    message: "Only the group creator can remove members"
                };
            }

            //checking if target user is a member
            if (!group.members || !group.members.includes(memberId)) {
                setError("User is not a member of this group");
                return {
                    success: false,
                    message: "User is not a member of this group"
                };
            }

            //prevent admin from removing themselves
            if (memberId === currentUser.uid) {
                setError("Admin cannot remove themselves from the group");
                return {
                    success: false,
                    message: "Admin cannot remove themselves from the group"
                };
            }

            //remove member from the group
            const updatedMembers = group.members.filter(id => id !== memberId);
            await FirestoreService.updateGroup(groupId, { members: updatedMembers });

            //if the current user is viewing their own groups, refresh them
            if (currentUser.uid === memberId) {
                setGroups(groups.filter(group => group.id !== groupId));
            } else {
                //else, update the current group members local state
                setGroups(groups.map(group => {
                    if (group.id === groupId) {
                        return { ...group, members: updatedMembers };
                    }
                    return group;
                }));
            }
            return {
                success: true,
                message: "Member removed successfully",
            };
        } catch (error) {
            setError("Failed to remove member from group");
            console.error("Error removing member from group", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const addUsersToGroup = async (groupId, userIds) =>{
        setLoading(true);
        setError(null);
        try{
            if(!currentUser){
                throw new Error("User not authenticated");
            }

            //Fetch the group to check if the current user is the admin
            const group = await FirestoreService.fetchGroupById(groupId);
            if(!group){
                throw new Error("Group not found");
            }

            //Check if the current user is the admin
            if(group.createdBy !== currentUser.uid){
                setError("Only the group admin can add members");
                setLoading(false);
                return{success: false, message: "Only the group admin can add members"};
            }

            //Add the users to the group
            await FirestoreService.addUsersToGroup(groupId, userIds);

            //Refresh the groups to update the ui
            await fetchUserGroups(currentUser.uid);

            return{success: true, message: "Successfully added members by search"};
        }catch(error){
            setError("Failed to add users to group");
            console.error("Error adding users to group by search", error);
            throw error;
        }finally{
            setLoading(false);
        }
    }

    //This is to remove the error code when pressing back
    const clearError = () =>{
        setError(null);
    };

    //TO DO
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
        removeMember,
        createActivity,
        clearError,
        addUsersToGroup,
        refreshGroups: () => currentUser && fetchUserGroups(currentUser.uid),
    };

    return (
        <GroupContext.Provider value={value}>
            {children}
        </GroupContext.Provider>
    );

};