import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import { generateWatchList, ProviderNames } from './useMovieAPI';

// Collection names
const userCollection = 'Users';
const groupCollection = 'Groups';
const voteCollection = 'Votes';
const tmdbActivitiesCollection = 'TMDBActivities';
const tmdbListsCollection = 'TMDBLists';

// ===================== USERS =====================

// Adding User to Firestore
export const addUser = async (userId, name, email) => {
  try {
    await setDoc(doc(firestore, userCollection, userId), {
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
    const snapshot = await getDocs(collection(firestore, userCollection));
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
    const userDoc = await getDoc(doc(firestore, userCollection, userId));
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
    await updateDoc(doc(firestore, userCollection, userId), {
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
    await deleteDoc(doc(firestore, userCollection, userId));
    console.log(`User with ID: ${userId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting user: ', error);
  }
};

// ===================== GROUPS =====================

// Adding Group
export const addGroup = async (groupId, name, description, members, createdBy, joinCode) => {
  try {
    await setDoc(doc(firestore, groupCollection, groupId), {
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
    const snapshot = await getDocs(collection(firestore, groupCollection));
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return groups;
  } catch (error) {
    console.error('Error fetching groups: ', error);
  }
};

//Fetch a specific group
export const fetchGroupById = async (groupId) =>{
  try{
    const groupDoc = await getDoc(doc(firestore, groupCollection, groupId));
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
    const snapshot = await getDocs(collection(firestore, groupCollection));
    const groups = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})).filter(group => group.members && group.members.includes(userId));
    return groups;
  }catch(error){
    console.error("Error fetching user groups: ", error);
  }
}

// Updating Group
export const updateGroup = async (groupId, updatedData) => {
  try {
    await updateDoc(doc(firestore, groupCollection, groupId), {
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
    await deleteDoc(doc(firestore, groupCollection, groupId));
    console.log(`Group with ID: ${groupId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting group: ', error);
  }
};

//Finding a group by groupID code
export const findGroupByCode = async(code) =>{
  try{
    const snapshot = await getDocs(collection(firestore, groupCollection));
    const groups = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
    const group = groups.find(g=> g.joinCode === code);
    return group || null;
  }catch(error){
    console.error("Error find group by code:", error);
  }
};

export const addMemberToGroup = async(groupId, userId) =>{
  try{
    const groupDoc = await getDoc(doc(firestore, groupCollection, groupId));
    if(!groupDoc.exists()){
      throw new Error("Group not found");
    }

    const groupData = groupDoc.data();
    const members = groupData.members || [];
    if(members.includes(userId)){
      console.log("User is already a member of this group");
      return;
    }

    await updateDoc(doc(firestore, groupCollection, groupId), {
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
    const groupDoc = await getDoc(doc(firestore, groupCollection, groupId));
    if(!groupDoc.exists()){
      throw new Error("Group not found");
    }

    const groupData = groupDoc.data();
    const members = groupData.members || [];

    if(!members.includes(userId)){
      console.log("User is not a member of this group");
      return;
    }

    await updateDoc(doc(firestore, groupCollection, groupId),{
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
    await setDoc(doc(firestore, voteCollection, voteId), {
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
    const snapshot = await getDocs(collection(firestore, voteCollection));
    const votes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return votes.filter(vote => vote.groupId === groupId);
  } catch (error) {
    console.error('Error fetching votes: ', error);
  }
};

// Updating Vote
export const updateVote = async (voteId, updatedData) => {
  try {
    await updateDoc(doc(firestore, voteCollection, voteId), {
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
    await deleteDoc(doc(firestore, voteCollection, voteId));
    console.log(`Vote with ID: ${voteId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting vote: ', error);
  }
};

// ===================== ACTIVITIES =====================

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

// Record a vote (yes or no)
export const voteOnActivity = async (userId, activityId, groupId, voteType) => {
  try {
    await setDoc(doc(firestore, voteCollection, `${userId}_${activityId}`), {
      userId,
      activityId,
      groupId,
      vote: voteType,
      createdAt: new Date().toISOString(),
    });
    console.log(`Vote '${voteType}' recorded for activity ${activityId}`);
  } catch (error) {
    console.error('Error voting on activity:', error);
  }
};

// Fetch votes for a specific user
export const fetchUserVotes = async (userId) => {
  try {
    const snapshot = await getDocs(collection(firestore, voteCollection));
    return snapshot.docs
      .map(doc => doc.data())
      .filter(vote => vote.userId === userId);
  } catch (error) {
    console.error('Error fetching votes:', error);
    return [];
  }
};

// ===================== TMDB ACTIVITIES =====================

//Create a new activity
export const tmdbCreateActivity = async(activityData) => {
  try{
    const docRef = await addDoc(collection(firestore, tmdbActivitiesCollection), {
      ...activityData,
      addedAt: new Date()
    });
    return {success: true, id: docRef.id};
  }catch(error){
    console.error("Error creating activity", error);
    return {success: false, error: error.message};
  }
};

//Update Activity
export const tmdbUpdateActivity = async(activityId, updateData) => {
  try{
    const docRef = doc(firestore, tmdbActivitiesCollection, activityId);
    await updateDoc(docRef, updateData);
    return {success: true};
  }catch(error){
    console.error("Error updating activity:", error);
    return {success: false, error: error.message};
  }
};

//Delete activity
export const tmdbDeleteActivity = async(activityId) => {
  try{
    const docRef = doc(firestore, tmdbActivitiesCollection, activityId);
    await deleteDoc(docRef);
    return {success: true};
  }catch(error){
    console.error("Error deleting activity:", error);
    return {success: false, error: error.message};
  }
};

export const tmdbGetActivitiesByList = async(listId) => {
  try{
    const q = query(collection(firestore, tmdbActivitiesCollection), where('listId', '==', listId));
    const querySnapshot = await getDocs(q);

    const activites = [];
    querySnapshot.forEach((doc) => {
      activites.push({id: doc.id, ...doc.date()});
    });

    return {success: true, data:activites};
  }catch(error){
    console.error("Error getting activity by list:", error);
    return {success: false, error: error.message};
  }
};

// ===================== TMDB LISTS =====================

//Create a new list
export const tmdbCreateList = async(listData) => {
  try{
    const activites = listData.activites || [];
    const activityPromises = activites.map(activity => 
      tmdbCreateActivity({
        ...activity,
        listId: listData.id
      })
    );

    await Promise.all(activityPromises);

    //Create the list
    const docRef = await addDoc(collection(firestore, tmdbListsCollection), {
      ...listData,
      createdAt: new Date(),
      lastUpdated: new Date()
    });

    return {success: true, id: docRef.id};
  }catch(error){
    console.error("Error creating list:", error);
    return {success: false, error: error.message};
  }
};

//Get list by Id
export const tmdbGetList = async(listId) => {
  try{
    const docRef = doc(firestore, tmdbListsCollection, listId);
    const docSnap = await getDoc(docRef);

    if(docSnap.exists()){
      const activitiesRef = await tmdbGetActivitiesByList(listId);

      return {
        success: true,
        data: {
          ...docSnap.data(),
          activities: activitiesRef.success ? activitiesRef.data : []
        }
      };
    }else{
      return {success: false, error: "List not found"};
    }
  }catch(error){
    console.error("Error getting list", error);
    return {success: false, error: error.message};
  }
};

//Update list
export const tmdbUpdateList = async(listId, updateData) => {
  try{
    const docRef = doc(firestore, tmdbListsCollection, listId);
    await updateDoc(docRef, {
      ...updateData,
      lastUpdated: new Date()
    });

    return {success: true};
  }catch(error){
    console.error("Error updating list:", error);
    return {success: false, error: error.message};
  }
};

//Delete list and its activities
export const tmdbDeleteList = async(listId) => {
  try{
    //First delete all activities associated with list
    const activitiesRef = await tmdbGetActivitiesByList(listId);
    if(activitiesRef.success){
      const deletePromises = activitiesRef.data.map(activity =>
        tmdbDeleteActivity(activity.id)
      );
      await Promise.all(deletePromises);
    }

    //Delete the list
    const docRef = doc(firestore, tmdbListsCollection, listId);
    await deleteDoc(docRef);

    return {success: true};
  }catch(error){
    console.error("Error deleting list:", error);
    return {success: false, error: error.message};
  }
};

//Get lists by user Id
export const tmdbGetListsByUser = async(userId) => {
  try{
    const q = query(
      collection(firestore, tmdbListsCollection),
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);

    const lists = [];
    for(const doc of querySnapshot.docs){
      const activitiesRef = await tmdbGetActivitiesByList(doc.id);
      lists.push({
        id: doc.id,
        ...doc.data(),
        activities: activitiesRef.success ? activitiesRef.data : []
      });
    }

    return {success: true, data: lists};
  }catch(error){
    console.error("Error getting user lists", error);
    return {success: false, error: error.message};
  }
};

//Refresh list content
export const tmdbRefreshList = async(listId) =>{
  try{
    const listRef = await tmdbGetList(listId);
    if(!listRef.success){
      return listRef;
    }

    const listData = listRef.data;
    const tmdbOptions = listData.tmdbOptions || {};

    //Generate new content
    const newContent = await generateWatchList({
      providers: tmdbOptions.providers || [],
      includeMovies: tmdbOptions.includeMovies !== false,
      includeTVShows: tmdbOptions.includeTVShows !== false,
      minRating: tmdbOptions.minRating || 0,
      sortBy: tmdbOptions.sortBy || 'popularity.desc'
    });

    //Delete old activities
    const deletePromises = listData.activities.map(activity =>
      tmdbDeleteActivity(activity.id)
    );
    await Promise.all(deletePromises);

    //Create new activities
    const newActivities = newContent.map(item => ({
      title: item.title,
      tmdbId: item.tmdbId,
      contentType: item.contentType,
      posterPath: item.posterPath,
      providerInfo: tmdbOptions.providers && tmdbOptions.providers.length > 0
        ? tmdbOptions.providers.map(id => ProviderNames[id]).join(', ')
        : '',
      addedAt: new Date(),
      listId: listId
    }));

    const createPromises = newActivities.map(activity =>
      tmdbCreateActivity(activity)
    );
    await Promise.all(createPromises);

    //Update list metdata
    await tmdbUpdateList(listId, {
      tmdbContent: newContent,
      generatedAt: new Date()
    });

    return {success: true};
  }catch(error){
    console.error("Error refreshing list", error);
    return {success: false, error: error.message};
  }
}