import { collection, deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
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
export const addGroup = async (groupId, name, description, members) => {
  try {
    await setDoc(doc(firestore, 'Groups', groupId), {
      name,
      description,
      members,
      createdAt: new Date().toISOString(),
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