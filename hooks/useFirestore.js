import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

// ===================== USERS =====================

// Adding User to Firestore
export const addUser = async (userId, name, email) => {
  try {
    await setDoc(doc(firestore, 'Users', userId), {
      name: name,
      email: email,
      createdAt: new Date().toISOString(),
    });
    console.log(`User added successfully with ID: ${userId}`);
  } catch (error) {
    console.error('Error adding user: ', error);
  }
};

// Fetching Users from Firestore
export const fetchUsers = async () => {
  try {
    const snapshot = await getDocs(collection(firestore, 'Users'));
    const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log('Users fetched successfully: ', users);
    return users;
  } catch (error) {
    console.error('Error fetching users: ', error);
  }
};

// Fetching Single User
export const fetchUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(firestore, 'Users', userId));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log('No such user found.');
    }
  } catch (error) {
    console.error('Error fetching user: ', error);
  }
};

// Updating User Data
export const updateUser = async (userId, updatedData) => {
  try {
    await updateDoc(doc(firestore, 'Users', userId), {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
    console.log(`User with ID: ${userId} updated successfully`);
  } catch (error) {
    console.error('Error updating user: ', error);
  }
};

// Deleting User
export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(firestore, 'Users', userId));
    console.log(`User with ID: ${userId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting user: ', error);
  }
};

// ===================== GROUPS =====================

// Adding Group
export const addGroup = async (groupId, name, description, members, createdBy, joinCode) => {
  try {
    await setDoc(doc(firestore, 'Groups', groupId), {
      name,
      description,
      members,
      createdBy,
      createdAt: new Date().toISOString(),
      joinCode,
      
    });
    console.log('Group added successfully');
  } catch (error) {
    console.error('Error adding group: ', error);
  }
};

// Fetching Groups
export const fetchGroups = async () => {
  try {
    const snapshot = await getDocs(collection(firestore, 'Groups'));
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return groups;
  } catch (error) {
    console.error('Error fetching groups: ', error);
  }
};

//Fetch a specific group
export const fetchGroupById = async (groupId) =>{
  try{
    const groupDoc = await getDoc(doc(firestore, 'Groups', groupId));
    if(groupDoc.exists()){
      return {id: groupDoc.id, ...groupDoc.data()};
    }else{
      console.log("No such group found");
      return null;
    }
  }catch(error){
    console.error("Error fetch group: ", error);
  }
};

//Fetch groups for a specific user
export const fetchUserGroups = async (userId) =>{
  try{
    const snapshot = await getDocs(collection(firestore, 'Groups'));
    const groups = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})).filter(group => group.members && group.members.includes(userId));
    return groups;
  }catch(error){
    console.error("Error fetching user groups: ", error);
  }
}

// Updating Group
export const updateGroup = async (groupId, updatedData) => {
  try {
    await updateDoc(doc(firestore, 'Groups', groupId), {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
    console.log(`Group with ID: ${groupId} updated successfully`);
  } catch (error) {
    console.error('Error updating group: ', error);
  }
};

// Deleting Group
export const deleteGroup = async (groupId) => {
  try {
    await deleteDoc(doc(firestore, 'Groups', groupId));
    console.log(`Group with ID: ${groupId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting group: ', error);
  }
};

//Finding a group by groupID code
export const findGroupByCode = async(code) =>{
  try{
    const snapshot = await getDocs(collection(firestore, 'Groups'));
    const groups = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    const group = groups.find(g=> g.joinCode === code);
    return group || null;
  }catch(error){
    console.error("Error find group by code:", error);
  }
};

export const addMemberToGroup = async(groupId, userId) =>{
  try{
    const groupDoc = await getDoc(doc(firestore, 'Groups', groupId));
    if(!groupDoc.exists()){
      throw new Error("Group not found");
    }

    const groupData = groupDoc.data();
    const members = groupData.members || [];
    if(members.includes(userId)){
      console.log("User is already a member of this group");
      return;
    }

    await updateDoc(doc(firestore, 'Groups', groupId), {
      members: [...members, userId],
      updatedAt: new Date().toISOString(),
    });

    console.log(`User ${userId} added to group ${groupId} successfully`);
  }catch(error){
    console.log("Error adding member to group", error);
  }
};

export const removeMemberFromGroup = async(groupId, userId) =>{
  try{
    const groupDoc = await getDoc(doc(firestore, 'Groups', groupId));
    if(!groupDoc.exists()){
      throw new Error("Group not found");
    }

    const groupData = groupDoc.data();
    const members = groupData.members || [];

    if(!members.includes(userId)){
      console.log("User is not a member of this group");
      return;
    }

    await updateDoc(doc(firestore, 'Groups', groupId),{
      members: members.filter(memberId => memberId !== userId),
      updatedAt: new DataTransfer().toISOString(),
    });
    console.log(`User ${userId} removed from group ${groupId} successfully`);
  }catch(error){
    console.error("Error removing member from group", error);
  }
};

//Adding multiple users to a group
export const addUsersToGroup = async(groupId, userIds)=>{
  try{
    //First get the current group data
    const groupDoc = await fetchGroupById(groupId);
    if(!groupDoc){
      throw new Error("Group not found");
    }

    //Creat a new members array with unique members only
    const currentMembers = groupDoc.members || [];
    const newMembers = [...new Set([...currentMembers, ...userIds])];

    //Update the group document with the new members
    await updateGroup(groupId, {members: newMembers});
    return true;
  }catch(error){
    console.error("Error adding multiple users to a group", error);
    throw error;
  }
}

// ===================== VOTES =====================

// Adding Vote
export const addVote = async (voteId, groupId, userId, vote) => {
  try {
    await setDoc(doc(firestore, 'Votes', voteId), {
      groupId,
      userId,
      vote,
      createdAt: new Date().toISOString(),
    });
    console.log('Vote added successfully');
  } catch (error) {
    console.error('Error adding vote: ', error);
  }
};

// Fetching Votes
export const fetchVotes = async (groupId) => {
  try {
    const snapshot = await getDocs(collection(firestore, 'Votes'));
    const votes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return votes.filter(vote => vote.groupId === groupId);
  } catch (error) {
    console.error('Error fetching votes: ', error);
  }
};

// Updating Vote
export const updateVote = async (voteId, updatedData) => {
  try {
    await updateDoc(doc(firestore, 'Votes', voteId), {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
    console.log(`Vote with ID: ${voteId} updated successfully`);
  } catch (error) {
    console.error('Error updating vote: ', error);
  }
};

// Deleting Vote
export const deleteVote = async (voteId) => {
  try {
    await deleteDoc(doc(firestore, 'Votes', voteId));
    console.log(`Vote with ID: ${voteId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting vote: ', error);
  }
};

// ===================== ACTIVITIES =====================

// Adding Activity
export const addActivity = async (activityId, name, groupId, description) => {
  try {
    await setDoc(doc(firestore, 'Activities', activityId), {
      name,
      groupId,
      description,
      createdAt: new Date().toISOString(),
    });
    console.log('Activity added successfully');
  } catch (error) {
    console.error('Error adding activity: ', error);
  }
};

// Fetching Activities
export const fetchActivities = async (groupId) => {
  try {
    const snapshot = await getDocs(collection(firestore, 'Activities'));
    const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return activities.filter(activity => activity.groupId === groupId);
  } catch (error) {
    console.error('Error fetching activities: ', error);
  }
};

// Updating Activity
export const updateActivity = async (activityId, updatedData) => {
  try {
    await updateDoc(doc(firestore, 'Activities', activityId), {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
    console.log(`Activity with ID: ${activityId} updated successfully`);
  } catch (error) {
    console.error('Error updating activity: ', error);
  }
};

// Deleting Activity
export const deleteActivity = async (activityId) => {
  try {
    await deleteDoc(doc(firestore, 'Activities', activityId));
    console.log(`Activity with ID: ${activityId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting activity: ', error);
  }
};

//Fetch activity by group id
export const fetchActivitiesByGroupId = async(groupId) =>{
  try{
    const activitiesRef = collection(firestore, 'Activities');
    const q = query(
      activitiesRef,
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const activities = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));

    console.log('Activities for group fetched successfully');
    return activities;
  }catch(error){
    console.error("Error fetching activites by group id", error);
  }
}