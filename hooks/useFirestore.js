import {
  addDoc,
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
import { generateWatchList, ProviderNames } from './useMovieAPI';

// Collection names
const userCollection = 'Users';
const groupCollection = 'Groups';
const voteCollection = 'Votes';
const tmdbActivitiesCollection = 'TMDBActivities';
const tmdbListsCollection = 'TMDBLists';
const votingSessionsCollection = 'VotingSessions';
const activitiesCollection = 'Activities';
const presetListsCollection = 'PresetLists';

// ===================== USERS =====================

export const addUser = async (userId, name, email) => {
  try {
    await setDoc(doc(firestore, userCollection, userId), {
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
    const snapshot = await getDocs(collection(firestore, userCollection));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching users: ', error);
  }
};

export const fetchUserById = async (userId) => {
  try {
    const userDoc = await getDoc(doc(firestore, userCollection, userId));
    return userDoc.exists() ? userDoc.data() : null;
  } catch (error) {
    console.error('Error fetching user: ', error);
  }
};

export const updateUser = async (userId, updatedData) => {
  try {
    await updateDoc(doc(firestore, userCollection, userId), {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating user: ', error);
  }
};

export const deleteUser = async (userId) => {
  try {
    await deleteDoc(doc(firestore, userCollection, userId));
    console.log(`User with ID: ${userId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting user: ', error);
  }
};

// ===================== GROUPS =====================

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
  } catch (error) {
    console.error('Error adding group: ', error);
  }
};

export const fetchGroups = async () => {
  try {
    const snapshot = await getDocs(collection(firestore, groupCollection));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching groups: ', error);
  }
};

export const fetchGroupById = async (groupId) => {
  try {
    const groupDoc = await getDoc(doc(firestore, groupCollection, groupId));
    return groupDoc.exists() ? { id: groupDoc.id, ...groupDoc.data() } : null;
  } catch (error) {
    console.error('Error fetch group: ', error);
  }
};

export const fetchUserGroups = async (userId) => {
  try {
    const snapshot = await getDocs(collection(firestore, groupCollection));
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(group => group.members?.includes(userId));
  } catch (error) {
    console.error('Error fetching user groups: ', error);
  }
};

export const updateGroup = async (groupId, updatedData) => {
  try {
    await updateDoc(doc(firestore, groupCollection, groupId), {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating group: ', error);
  }
};

export const deleteGroup = async (groupId) => {
  try {
    await deleteDoc(doc(firestore, groupCollection, groupId));
    console.log(`Group with ID: ${groupId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting group: ', error);
  }
};

export const findGroupByCode = async (code) => {
  try {
    const snapshot = await getDocs(collection(firestore, groupCollection));
    const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return groups.find(g => g.joinCode === code) || null;
  } catch (error) {
    console.error('Error find group by code:', error);
  }
};

export const addMemberToGroup = async (groupId, userId) => {
  try {
    const groupDoc = await getDoc(doc(firestore, groupCollection, groupId));
    if (!groupDoc.exists()) throw new Error('Group not found');

    const members = groupDoc.data().members || [];
    if (members.includes(userId)) return;

    await updateDoc(doc(firestore, groupCollection, groupId), {
      members: [...members, userId],
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error adding member to group', error);
  }
};

export const removeMemberFromGroup = async (groupId, userId) => {
  try {
    const groupDoc = await getDoc(doc(firestore, groupCollection, groupId));
    if (!groupDoc.exists()) throw new Error('Group not found');

    const members = groupDoc.data().members || [];
    if (!members.includes(userId)) return;

    await updateDoc(doc(firestore, groupCollection, groupId), {
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
    await setDoc(doc(firestore, voteCollection, voteId), {
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
    const snapshot = await getDocs(collection(firestore, voteCollection));
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(vote => vote.groupId === groupId);
  } catch (error) {
    console.error('Error fetching votes: ', error);
  }
};

export const updateVote = async (voteId, updatedData) => {
  try {
    await updateDoc(doc(firestore, voteCollection, voteId), {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating vote: ', error);
  }
};

export const deleteVote = async (voteId) => {
  try {
    await deleteDoc(doc(firestore, voteCollection, voteId));
    console.log(`Vote with ID: ${voteId} deleted successfully`);
  } catch (error) {
    console.error('Error deleting vote: ', error);
  }
};

export const voteOnActivity = async (userId, activityId, groupId, voteType) => {
  try {
    await setDoc(doc(firestore, voteCollection, `${userId}_${activityId}`), {
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
    const snapshot = await getDocs(collection(firestore, voteCollection));
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
    await setDoc(doc(firestore, activitiesCollection, activityId), {
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
    const snapshot = await getDocs(collection(firestore, activitiesCollection));
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
      collection(firestore, activitiesCollection),
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
    await updateDoc(doc(firestore, activitiesCollection, activityId), {
      ...updatedData,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error updating activity: ', error);
  }
};

export const deleteActivity = async (activityId) => {
  try {
    await deleteDoc(doc(firestore, activitiesCollection, activityId));
  } catch (error) {
    console.error('Error deleting activity: ', error);
  }
};

// ===================== TMDB ACTIVITIES =====================

export const tmdbCreateActivity = async (activityData) => {
  try {
    const docRef = await addDoc(collection(firestore, tmdbActivitiesCollection), {
      ...activityData,
      addedAt: new Date(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating activity', error);
    return { success: false, error: error.message };
  }
};

export const tmdbUpdateActivity = async (activityId, updateData) => {
  try {
    const docRef = doc(firestore, tmdbActivitiesCollection, activityId);
    await updateDoc(docRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating activity:', error);
    return { success: false, error: error.message };
  }
};

export const tmdbDeleteActivity = async (activityId) => {
  try {
    const docRef = doc(firestore, tmdbActivitiesCollection, activityId);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting activity:', error);
    return { success: false, error: error.message };
  }
};

export const tmdbGetActivitiesByList = async (listId) => {
  try {
    const q = query(collection(firestore, tmdbActivitiesCollection), where('listId', '==', listId));
    const querySnapshot = await getDocs(q);

    const activities = [];
    querySnapshot.forEach(doc => {
      activities.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: activities };
  } catch (error) {
    console.error('Error getting activity by list:', error);
    return { success: false, error: error.message };
  }
};

// ===================== TMDB LISTS =====================

export const tmdbCreateList = async (listData) => {
  try {
    const docRef = await addDoc(collection(firestore, tmdbListsCollection), {
      ...listData,
      createdAt: new Date(),
      lastUpdated: new Date(),
    });

    const activities = listData.activities || [];
    if (activities.length > 0) {
      const activityPromises = activities.map(activity =>
        tmdbCreateActivity({ ...activity, listId: docRef.id })
      );
      await Promise.all(activityPromises);
    }

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating list:', error);
    return { success: false, error: error.message };
  }
};

export const tmdbGetList = async (listId) => {
  try {
    const docRef = doc(firestore, tmdbListsCollection, listId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const activitiesRef = await tmdbGetActivitiesByList(listId);
      return {
        success: true,
        data: {
          ...docSnap.data(),
          activities: activitiesRef.success ? activitiesRef.data : [],
        },
      };
    } else {
      return { success: false, error: 'List not found' };
    }
  } catch (error) {
    console.error('Error getting list', error);
    return { success: false, error: error.message };
  }
};

export const tmdbUpdateList = async (listId, updateData) => {
  try {
    const docRef = doc(firestore, tmdbListsCollection, listId);
    await updateDoc(docRef, {
      ...updateData,
      lastUpdated: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating list:', error);
    return { success: false, error: error.message };
  }
};

export const tmdbDeleteList = async (listId) => {
  try {
    const activitiesRef = await tmdbGetActivitiesByList(listId);
    if (activitiesRef.success) {
      const deletePromises = activitiesRef.data.map(activity =>
        tmdbDeleteActivity(activity.id)
      );
      await Promise.all(deletePromises);
    }

    const docRef = doc(firestore, tmdbListsCollection, listId);
    await deleteDoc(docRef);

    return { success: true };
  } catch (error) {
    console.error('Error deleting list:', error);
    return { success: false, error: error.message };
  }
};

export const tmdbGetListsByUser = async (userId) => {
  try {
    const q = query(collection(firestore, tmdbListsCollection), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);

    const lists = [];
    for (const doc of querySnapshot.docs) {
      const activitiesRef = await tmdbGetActivitiesByList(doc.id);
      lists.push({
        id: doc.id,
        ...doc.data(),
        activities: activitiesRef.success ? activitiesRef.data : [],
      });
    }

    return { success: true, data: lists };
  } catch (error) {
    console.error('Error getting user lists', error);
    return { success: false, error: error.message };
  }
};

export const tmdbRefreshList = async (listId) => {
  try {
    const listRef = await tmdbGetList(listId);
    if (!listRef.success) return listRef;

    const listData = listRef.data;
    const tmdbOptions = listData.tmdbOptions || {};

    const newContent = await generateWatchList({
      providers: tmdbOptions.providers || [],
      includeMovies: tmdbOptions.includeMovies !== false,
      includeTVShows: tmdbOptions.includeTVShows !== false,
      count: tmdbOptions.count || 20,
      minRating: tmdbOptions.minRating || 0,
      sortBy: tmdbOptions.sortBy || 'popularity.desc',
    });

    const deletePromises = listData.activities.map(activity =>
      tmdbDeleteActivity(activity.id)
    );
    await Promise.all(deletePromises);

    const newActivities = newContent.map(item => ({
      title: item.title,
      tmdbId: item.tmdbId,
      contentType: item.contentType,
      posterPath: item.posterPath,
      providerInfo:
        tmdbOptions.providers?.length > 0
          ? tmdbOptions.providers.map(id => ProviderNames[id]).join(', ')
          : '',
      addedAt: new Date(),
      listId,
    }));

    const createPromises = newActivities.map(activity => tmdbCreateActivity(activity));
    await Promise.all(createPromises);

    await tmdbUpdateList(listId, {
      tmdbContent: newContent,
      generatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error refreshing list', error);
    return { success: false, error: error.message };
  }
};

// ===================== PRESET LISTS =====================

export const addPresetList = async (listId, title, activities) => {
  try {
    await setDoc(doc(firestore, presetListsCollection, listId), {
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
    const snapshot = await getDocs(collection(firestore, presetListsCollection));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching preset lists:', error);
    return [];
  }
};

export const fetchPresetListById = async (listId) => {
  try {
    const docSnap = await getDoc(doc(firestore, presetListsCollection, listId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error('Error fetching preset list:', error);
    return null;
  }
};

// ===================== VOTING SESSIONS =====================

export const createVotingSession = async (
  sessionId,
  { name, groupId, createdBy, activities, startTime, endTime }
) => {
  try {
    await setDoc(doc(firestore, votingSessionsCollection, sessionId), {
      name,
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
      collection(firestore, votingSessionsCollection),
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
