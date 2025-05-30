import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

// ===================== USERS =====================

export const addUser = async (userId, name, email) => {
  try {
    await setDoc(doc(firestore, 'Users', userId), {
      name,
      email,
      createdAt: new Date().toISOString(),
    });
    console.log(`User added successfully with ID: ${userId}`);
  } catch (error) {
    console.error('Error adding user: ', error);
  }
};

export const fetchUsers = async () => {
  try {
    const snapshot = await getDocs(collection(firestore, 'Users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching users: ', error);
  }
};

export const fetchUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(firestore, 'Users', userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Error fetching user: ', error);
  }
};

export const updateUser = async (userId, updatedData) => {
  try {
    await updateDoc(doc(firestore, 'Users', userId), {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user: ', error);
  }
};

export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(firestore, 'Users', userId));
  } catch (error) {
    console.error('Error deleting user: ', error);
  }
};

// ===================== GROUPS =====================

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
  } catch (error) {
    console.error('Error adding group: ', error);
  }
};

export const fetchGroups = async () => {
  try {
    const snapshot = await getDocs(collection(firestore, 'Groups'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching groups: ', error);
  }
};

export const fetchGroupById = async (groupId) => {
  try {
    const docSnap = await getDoc(doc(firestore, 'Groups', groupId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error('Error fetch group: ', error);
  }
};

export const fetchUserGroups = async (userId) => {
  try {
    const snapshot = await getDocs(collection(firestore, 'Groups'));
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(group => group.members?.includes(userId));
  } catch (error) {
    console.error('Error fetching user groups: ', error);
  }
};

export const updateGroup = async (groupId, updatedData) => {
  try {
    await updateDoc(doc(firestore, 'Groups', groupId), {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating group: ', error);
  }
};

export const deleteGroup = async (groupId) => {
  try {
    await deleteDoc(doc(firestore, 'Groups', groupId));
  } catch (error) {
    console.error('Error deleting group: ', error);
  }
};

export const findGroupByCode = async (code) => {
  try {
    const snapshot = await getDocs(collection(firestore, 'Groups'));
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return groups.find(g => g.joinCode === code) || null;
  } catch (error) {
    console.error('Error find group by code:', error);
  }
};

export const addMemberToGroup = async (groupId, userId) => {
  try {
    const groupDoc = await getDoc(doc(firestore, 'Groups', groupId));
    if (!groupDoc.exists()) throw new Error('Group not found');

    const members = groupDoc.data().members || [];
    if (members.includes(userId)) return;

    await updateDoc(doc(firestore, 'Groups', groupId), {
      members: [...members, userId],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding member to group', error);
  }
};

export const removeMemberFromGroup = async (groupId, userId) => {
  try {
    const groupDoc = await getDoc(doc(firestore, 'Groups', groupId));
    if (!groupDoc.exists()) throw new Error('Group not found');

    const members = groupDoc.data().members || [];
    if (!members.includes(userId)) return;

    await updateDoc(doc(firestore, 'Groups', groupId), {
      members: members.filter(id => id !== userId),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error removing member from group', error);
  }
};

export const addUsersToGroup = async (groupId, userIds) => {
  try {
    const group = await fetchGroupById(groupId);
    if (!group) throw new Error('Group not found');

    const members = group.members || [];
    const newMembers = [...new Set([...members, ...userIds])];

    await updateGroup(groupId, { members: newMembers });
    return true;
  } catch (error) {
    console.error('Error adding multiple users to a group', error);
    throw error;
  }
};

// ===================== VOTES =====================

export const addVote = async (voteId, groupId, userId, vote) => {
  try {
    await setDoc(doc(firestore, 'Votes', voteId), {
      groupId,
      userId,
      vote,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding vote: ', error);
  }
};

export const fetchVotes = async (groupId) => {
  try {
    const snapshot = await getDocs(collection(firestore, 'Votes'));
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(vote => vote.groupId === groupId);
  } catch (error) {
    console.error('Error fetching votes: ', error);
  }
};

export const updateVote = async (voteId, updatedData) => {
  try {
    await updateDoc(doc(firestore, 'Votes', voteId), {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating vote: ', error);
  }
};

export const deleteVote = async (voteId) => {
  try {
    await deleteDoc(doc(firestore, 'Votes', voteId));
  } catch (error) {
    console.error('Error deleting vote: ', error);
  }
};

export const voteOnActivity = async (userId, activityId, groupId, voteType) => {
  try {
    await setDoc(doc(firestore, 'Votes', `${userId}_${activityId}`), {
      userId,
      activityId,
      groupId,
      vote: voteType,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error voting on activity:', error);
  }
};

export const fetchUserVotes = async (userId) => {
  try {
    const snapshot = await getDocs(collection(firestore, 'Votes'));
    return snapshot.docs
      .map(doc => doc.data())
      .filter(vote => vote.userId === userId);
  } catch (error) {
    console.error('Error fetching votes:', error);
    return [];
  }
};

// ===================== ACTIVITIES =====================

export const addActivity = async (activityId, name, groupId, description) => {
  try {
    await setDoc(doc(firestore, 'Activities', activityId), {
      name,
      groupId,
      description,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding activity: ', error);
  }
};

export const fetchActivities = async (groupId) => {
  try {
    const snapshot = await getDocs(collection(firestore, 'Activities'));
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(activity => activity.groupId === groupId);
  } catch (error) {
    console.error('Error fetching activities: ', error);
  }
};

export const fetchActivitiesByGroupId = async (groupId) => {
  try {
    const q = query(
      collection(firestore, 'Activities'),
      where('groupId', '==', groupId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching activities by group id', error);
  }
};

export const updateActivity = async (activityId, updatedData) => {
  try {
    await updateDoc(doc(firestore, 'Activities', activityId), {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating activity: ', error);
  }
};

export const deleteActivity = async (activityId) => {
  try {
    await deleteDoc(doc(firestore, 'Activities', activityId));
  } catch (error) {
    console.error('Error deleting activity: ', error);
  }
};

// ===================== PRESET LISTS =====================

export const addPresetList = async (listId, title, activities) => {
  try {
    await setDoc(doc(firestore, 'PresetLists', listId), {
      title,
      activities,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding preset list:', error);
  }
};

export const fetchPresetLists = async () => {
  try {
    const snapshot = await getDocs(collection(firestore, 'PresetLists'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching preset lists:', error);
    return [];
  }
};

export const fetchPresetListById = async (listId) => {
  try {
    const docSnap = await getDoc(doc(firestore, 'PresetLists', listId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error('Error fetching preset list:', error);
    return null;
  }
};

// ===================== VOTING SESSIONS =====================


export const createVotingSession = async (
  sessionId,
  {
    name,          // ✅ include name in parameter destructuring
    groupId,
    createdBy,
    activities,
    startTime,
    endTime,
  }
) => {
  try {
    await setDoc(doc(firestore, 'VotingSessions', sessionId), {
      name,        // ✅ save session name
      groupId,
      createdBy,
      activities,
      startTime,
      endTime,
      createdAt: new Date().toISOString(),
    });
    console.log('Voting session created:', sessionId);
  } catch (error) {
    console.error('Error creating voting session:', error);
    throw error;
  }
};

export const fetchVotingSessionsByGroup = async (groupId) => {
  try {
    const q = query(
      collection(firestore, 'VotingSessions'),
      where('groupId', '==', groupId),
      orderBy('startTime', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching voting sessions:', error);
    return [];
  }
};
