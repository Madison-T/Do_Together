import { tmdbCreateList, tmdbGetList, tmdbRefreshList } from '@/hooks/useFirestore';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where
} from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, firestore } from '../firebaseConfig';
import { tmdbCreateActivity } from '../hooks/useFirestore';
import { ProviderNames } from '../hooks/useMovieAPI';



// Create the context
const UserListsContext = createContext();

// Custom hook to use the context
export const useUserLists = () => {
  const context = useContext(UserListsContext);
  if (!context) {
    throw new Error('useUserLists must be used within a UserListsProvider');
  }
  return context;
};

// Provider component
export const UserListsProvider = ({ children }) => {
  const [userLists, setUserLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentList, setCurrentList] = useState(null);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);

  useEffect(() => {
    const loadInitialData = async () => {
      if (auth.currentUser) {
        loadUserLists();
      } else {
        setUserLists([]);
        setLoading(false);
      }
    };
    loadInitialData();
  }, [auth.currentUser]);

  const loadUserLists = async () => {
    try {
      setLoading(true);

      const userId = auth.currentUser?.uid;
      if (!userId) {
        setUserLists([]);
        return;
      }

      const listsRef = collection(firestore, 'userLists');
      const tmdbListsRef = collection(firestore, 'TMDBLists');

      const q1 = query(listsRef, where('userId', '==', userId));
      const q2 = query(tmdbListsRef, where('userId', '==', userId));

      const [regularSnapshot, tmdbSnapshot] = await Promise.all([
        getDocs(q1),
        getDocs(q2)
      ]);

      const lists = [];

      regularSnapshot.forEach((doc) => {
        lists.push({
          id: doc.id,
          ...doc.data(),
          listType: 'regular'
        });
      });

      tmdbSnapshot.forEach((doc) => {
        lists.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setUserLists(lists);
    } catch (error) {
      console.error('Failed to load user lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadListDetails = async (listId) => {
  if (!listId) {
    setListError("No list ID provided");
    setListLoading(false);
    return { success: false, error: "No list ID provided" };
  }

  try {
    setListError(null);
    setListLoading(true);

    // Try to load from 'userLists' first
    let listRef = doc(firestore, 'userLists', listId);
    let listSnap = await getDoc(listRef);

    if (!listSnap.exists()) {
      // Fallback to 'TMDBLists'
      listRef = doc(firestore, 'TMDBLists', listId);
      listSnap = await getDoc(listRef);
    }

    if (listSnap.exists()) {
      const listData = {
        id: listSnap.id,
        ...listSnap.data()
      };

      // Fetch TMDB activities separately if it's a TMDB list
      if (listData.listType === 'tmdb_watchlist') {
        const activitiesQuery = query(
          collection(firestore, 'TMDBActivities'),
          where('listId', '==', listId)
        );
        const activitySnapshot = await getDocs(activitiesQuery);
        const activities = [];
        activitySnapshot.forEach(doc => {
          activities.push(doc.data());
        });

        listData.activities = activities;
      } else {
        // Regular user list
        listData.activities = listData.activities || [];
      }

      setCurrentList(listData);
      return { success: true, list: listData };
    } else {
      setListError("List not found");
      setCurrentList(null);
      return { success: false, error: "List not found" };
    }
  } catch (error) {
    console.error("Error loading list details", error);
    setListError("Failed to load list details");
    setCurrentList(null);
    return { success: false, error: "Failed to load list details" };
  } finally {
    setListLoading(false);
  }
};
  // ✅ Updated to support activity objects (e.g. TMDB items)
  const addActivity = async (listId, activityItem) => {
    if (!activityItem) return { success: false, error: 'Invalid activity' };

    try {
      const listRef = doc(firestore, 'userLists', listId);
      const listSnap = await getDoc(listRef);
      let actualRef = listRef;

      if (!listSnap.exists()) {
        actualRef = doc(firestore, 'TMDBLists', listId);
      }

      await updateDoc(actualRef, {
        activities: arrayUnion(activityItem)
      });

      setCurrentList((prev) => ({
        ...prev,
        activities: [...(prev.activities || []), activityItem]
      }));

      setUserLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                activities: [...(list.activities || []), activityItem]
              }
            : list
        )
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to add activity', error);
      return { success: false, error: 'Failed to add activity' };
    }
  };

  const removeActivity = async (listId, activityToRemove) => {
    try {
      const listRef = doc(firestore, 'userLists', listId);
      const listSnap = await getDoc(listRef);
      let actualRef = listRef;

      if (!listSnap.exists()) {
        actualRef = doc(firestore, 'TMDBLists', listId);
      }

      await updateDoc(actualRef, {
        activities: arrayRemove(activityToRemove)
      });

      setCurrentList((prev) => ({
        ...prev,
        activities: prev.activities.filter(
          (a) => JSON.stringify(a) !== JSON.stringify(activityToRemove)
        )
      }));

      setUserLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                activities: list.activities.filter(
                  (a) => JSON.stringify(a) !== JSON.stringify(activityToRemove)
                )
              }
            : list
        )
      );

      return { success: true };
    } catch (error) {
      console.error('Failed to remove activity', error);
      return { success: false, error: 'Failed to remove activity' };
    }
  };
  const deleteList = async (listId) => {
    try {
      try {
        const listRef = doc(firestore, 'userLists', listId);
        await deleteDoc(listRef);
      } catch (error) {
        const tmdbListRef = doc(firestore, 'TMDBLists', listId);
        await deleteDoc(tmdbListRef);
      }

      const updatedLists = userLists.filter((list) => list.id !== listId);
      setUserLists(updatedLists);
      return true;
    } catch (error) {
      console.error('Failed to delete list', error);
      return false;
    }
  };

  const checkListNameExists = async (title) => {
    if (!auth.currentUser) return false;

    const listsRef = collection(firestore, 'userLists');
    const tmdbListsRef = collection(firestore, 'TMDBLists');

    const q1 = query(
      listsRef,
      where('userId', '==', auth.currentUser.uid),
      where('title', '==', title.trim())
    );

    const q2 = query(
      tmdbListsRef,
      where('userId', '==', auth.currentUser.uid),
      where('title', '==', title.trim())
    );

    const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    return !snapshot1.empty || !snapshot2.empty;
  };

  const createList = async (title, activities) => {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to create a list');
      }

      const listExists = await checkListNameExists(title);
      if (listExists) {
        return {
          success: false,
          error: 'A list with this name already exists. Please choose a different name'
        };
      }

      const filteredActivities = activities.filter(
  (activity) => typeof activity?.title === 'string' && activity.title.trim() !== ''
);

      const listData = {
        title: title.trim(),
        activities: filteredActivities,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        listType: 'regular'
      };

      const docRef = await addDoc(collection(firestore, 'userLists'), listData);

      const newList = {
        id: docRef.id,
        ...listData
      };

      setUserLists((prevLists) => [...prevLists, newList]);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error creating list', error);
      return { success: false, error: error.message };
    }
  };

  const getUserListById = async (id) => {
  try {
    let docRef = doc(firestore, 'userLists', id);
    let docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      docRef = doc(firestore, 'TMDBLists', id);
      docSnap = await getDoc(docRef);
    }

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // 🔍 If it's a TMDB watchlist, fetch activities from TMDBActivities
      let activities = [];
      if (data.listType === 'tmdb_watchlist') {
        const q = query(collection(firestore, 'TMDBActivities'), where('listId', '==', id));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
          activities.push(doc.data());
        });
      } else {
        activities = data.activities || [];
      }

      return {
        id: docSnap.id,
        ...data,
        activities,
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error fetching user list by ID:', error);
    return null;
  }
};


  const createTMDBList = async (title, tmdbContent, options = {}) => {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to create a list');
      }

      const listExists = await checkListNameExists(title);
      if (listExists) {
        return {
          success: false,
          error: 'A list with this name already exists. Please choose a different name'
        };
      }

      if (!Array.isArray(tmdbContent)) {
        throw new Error('Invalid content format');
      }

      const listData = {
        title: title.trim(),
        description: options.description || '',
        userId: auth.currentUser.uid,
        isPublic: options.isPublic || false,
        listType: 'tmdb_watchlist',
        isGrouplist: options.isGrouplist || false,
        groupId: options.groupId || null,
        tmdbOptions: {
          providers: options.providers || [],
          includeMovies: options.includeMovies !== false,
          includeTVShows: options.includeTVShows !== false,
          minRating: options.minRating || 0,
          sortBy: options.sortBy || 'popularity.desc',
          region: options.region || 'NZ',
          genres: options.genres || []
        },
        tmdbContent: tmdbContent,
        generatedAt: new Date()
      };

      const result = await tmdbCreateList({
        ...listData,
        activities: []
      });

      if (!result.success) return result;

      const listId = result.id;

      const activities = tmdbContent.map((item) => ({
        title: item.title,
        tmdbId: item.tmdbId,
        contentType: item.contentType,
        posterPath: item.posterPath,
        backdropPath: item.backdropPath,
        providerInfo: options.providers?.map((id) => ProviderNames[id]).join(', ') || '',
        addedAt: new Date(),
        addedBy: auth.currentUser.uid,
        listId: listId,
        ...item
      }));

      const activityPromises = activities.map((activity) => tmdbCreateActivity(activity));
      await Promise.all(activityPromises);

      const newList = {
        ...listData,
        id: listId,
        activities: activities
      };

      setUserLists((prev) => [...prev, newList]);
      return { success: true, id: listId, list: newList };
    } catch (error) {
      console.error('Error creating TMDB list:', error);
      return { success: false, error: error.message };
    }
  };

  const refreshTMDBList = async (listId) => {
    try {
      const result = await tmdbRefreshList(listId);

      if (result.success) {
        const listRef = await tmdbGetList(listId);
        if (listRef.success) {
          setUserLists((prevList) =>
            prevList.map((list) => (list.id === listId ? listRef.data : list))
          );

          if (currentList && currentList.id === listId) {
            setCurrentList(listRef.data);
          }
        }
      }

      return result;
    } catch (error) {
      console.error('Error refreshing TMDB list: ', error);
      return { success: false, error: 'Failed to refresh list' };
    }
  };

  const value = {
    userLists,
    loading,
    loadUserLists,
    deleteList,
    createList,
    createTMDBList,
    refreshTMDBList,
    currentList,
    listLoading,
    listError,
    loadListDetails,
    addActivity,
    removeActivity,
    getUserListById
  };

  return (
    <UserListsContext.Provider value={value}>
      {children}
    </UserListsContext.Provider>
  );
};
