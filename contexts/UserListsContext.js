import { tmdbCreateActivity, tmdbCreateList, tmdbGetList, tmdbRefreshList } from '@/hooks/useFirestore';
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
  where,
  writeBatch
} from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, firestore } from '../firebaseConfig';

import { ProviderNames } from '../hooks/useMovieAPI';

export const listCategories = [
  {id: 'movies', name: 'Movies', icon: 'film-outline', color: '#e91e63'},
  {id: 'tv-shows', name: 'TV Shows', icon: 'tv-outline', color: '#9c27b0'},
  {id: 'restaurants', name: 'Restaurants', icon: 'restaurant-outline', color: '#ff5722'},
  {id: 'books', name: 'Books', icon: 'book-outline', color: '#795548'},
  {id: 'music', name: 'Music', icon: 'musical-notes-outline', color: '#607d8b'},
  {id: 'food', name: 'Food & Recipes', icon: 'pizza-outline', color: '#ff9800'},
  {id: 'games', name: 'Games', icon: 'game-controller-outline', color: '#4caf50'},
  {id: 'shopping', name: 'Shopping', icon: 'bag-handle-outline', color: '#f9e4bc'},
  {id: 'travel', name: 'Travel', icon: 'airplane-outline', color: '#d3cac8'},
  {id: 'sports', name: 'Sport', icon: 'basketball-outline', color: '#ee6730'},
  {id: 'outdoor', name: 'Outdoor', icon: 'flower-outline', color: '#3c6b36'},
  {id: 'board-game', name: 'Board Games', icon: 'dice-outline', color: '#3056c1'},
  {id: 'art', name: 'Art', icon: 'color-palette-outline', color: '#371F76'},
  {id: 'nature', name: 'Nature', icon: 'leaf-outline', color: '#169128'},
  {id: 'summer', name: 'Summer', icon: 'sunny-outline', color: '#F3c515'},
  {id: 'winter', name: 'Winter', icon: 'snow-outline', color: '#B7F5F4'},
  {id: 'motorsport', name: 'Motorsport & Cars', icon: 'speedometer-outline', color: '#EF1A2D'},
  {id: 'events-festivals', name: 'Events & Festivals', icon: 'ticket-outline', color: '#f45165'},
  {id: 'hiking', name: 'Hiking', icon: 'trail-sign-outline', color: '#1e8f65'},
  {id: 'other', name: 'Other', icon: 'ellipsis-horizontal-outline', color: '#9e9e9e'}
];

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

  const [defaultCategoryAssigned, setDefaultCategoryAssigned] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user)=>{
      if(user){
        loadUserLists();
      }else{
        setUserLists([]);
        setLoading(false);
        setDefaultCategoryAssigned(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const assignDefaultCategory = async(lists) => {
    if(!auth.currentUser || defaultCategoryAssigned){
      return lists;
    }

    console.log("Checking for lists without categories");
    const batch = writeBatch(firestore);
    let listsUpdatedInBatch = false;
    let updatedLists = [...lists];

    for(let i = 0; i < updatedLists.length; i++){
      const list = updatedLists[i];
      const collectionName = list.listType === 'tmdb_watchlist' ? 'TMDBLists' : 'userLists';
      const listDocRef = doc(firestore, collectionName, list.id);

      //Check if category field is missing or nul
      if(list.category === undefined || list.category === null){
        console.log(`Assigning other category to list: ${list.title} (${list.id})`);
        batch.update(listDocRef, {category: 'other'});
        updatedLists[i] = {...list, category: 'other'}; //update local copy
        listsUpdatedInBatch = true;
      }
    }

    if(listsUpdatedInBatch){
      try{
        await batch.commit();
        console.log("Batch update for default categories committed");
        setDefaultCategoryAssigned(true);
        return updatedLists;
      }catch(error){
        console.error("Error commiting batch for default categories:", error);
        return lists;
      }
    }else{
      console.log("No lists found without categories to update");
      setDefaultCategoryAssigned(true);
      return lists;
    }
  };

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

      //handle tmdb lists 
      const tmdbListPromises = tmdbSnapshot.docs.map(async(doc) => {
        const listData = {
          id: doc.id,
          ...doc.data()
        };

        //fetch activities for this tmdb list
        if (listData.listType === 'tmdb_watchlist') {
        const activitiesQuery = query(
          collection(firestore, 'TMDBActivities'),
          where('listId', '==', doc.id)
        );
        const activitySnapshot = await getDocs(activitiesQuery);
        const activities = [];
        activitySnapshot.forEach(activityDoc => {
          activities.push({
            ...activityDoc.data(),
            docId: activityDoc.id
          });
        });
        listData.activities = activities;
      } else {
        listData.activities = listData.activities || [];
      }
      return listData;
      });

      const tmdbLists = await Promise.all(tmdbListPromises);
      lists.push(...tmdbLists);

      const listsAfterDefaultCategory = await assignDefaultCategory(lists);

      setUserLists(listsAfterDefaultCategory);
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

      if(listData.category === undefined || listData.category === null){
        listData.category = 'other';
      }

      // Fetch TMDB activities separately if it's a TMDB list
      if (listData.listType === 'tmdb_watchlist') {
        const activitiesQuery = query(
          collection(firestore, 'TMDBActivities'),
          where('listId', '==', listId)
        );
        const activitySnapshot = await getDocs(activitiesQuery);
        const activities = [];
        activitySnapshot.forEach(doc => {
          activities.push({
            ...doc.data(),
            docId: doc.id
          });
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
      let finalActivityItem = activityItem;

      if(currentList?.listType === 'tmdb_watchlist'){
        const activityData = {
          ...activityItem,
          updatedAt: new Date(),
          listId: listId
        };

          const activityRef = await addDoc(collection(firestore, 'TMDBActivities'), activityData);

          finalActivityItem = {
            ...activityData,
            docId: activityRef.id
          };
      }else{
        const listRef = doc(firestore, 'userLists', listId);
        await updateDoc(listRef, {
          activities: arrayUnion(activityItem)
        });
      }

      setCurrentList((prev) => ({
        ...prev,
        activities: [...(prev.activities || []), finalActivityItem]
      }));

      setUserLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                activities: [...(list.activities || []), finalActivityItem]
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
      //Check if this is a TMDB list by looking at current list data
      if(currentList?.listType === 'tmdb_watchlist'){
        if(activityToRemove.docId){
          const activityRef = doc(firestore, 'TMDBActivities', activityToRemove.docId);
          await deleteDoc(activityRef);
        }else{
          const activitiesQuery = query(
            collection(firestore, 'TMDBActivities'),
            where('listId', '==', listId),
            where('tmdbId', '==', activityToRemove.tmdbId || activityToRemove)
          );

          const snapshot = await getDocs(activitiesQuery);

          if(!snapshot.empty){
            const docToDelete = snapshot.docs[0];
            await deleteDoc(docToDelete.ref);
          }
        }
      }else{
        //For regular user lists
        const listRef = doc(firestore, 'userLists', listId);
        await updateDoc(listRef, {
          activities: arrayRemove(activityToRemove)
        });
      }
      
      //Update local state
      setCurrentList((prev) => ({
        ...prev,
        activities: prev.activities.filter(
          (a) => {
            if(currentList?.listType === 'tmdb_watchlist'){
              return a.tmdbId !== activityToRemove.tmdbId;
            }else{
              return JSON.stringify(a) !== JSON.stringify(activityToRemove);
            }
          }
        )
      }));

      setUserLists((prevLists) =>
        prevLists.map((list) =>
          list.id === listId
            ? {
                ...list,
                activities: list.activities.filter(
                  (a) => {
                    if(currentList?.listType === 'tmdb_watchlist'){
                      return a.tmdbId !== (activityToRemove.tmdbId || activityToRemove);
                    }else{
                      return JSON.stringify(a) !== JSON.stringify(activityToRemove);
                    }
                  }
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
        let listRef = doc(firestore, 'userLists', listId);
        let listSnap = await getDoc(listRef);
        let isRegularList = listSnap.exists();

        if(!isRegularList){
          listRef = doc(firestore, 'TMDBLists', listId);
          listSnap = await getDoc(listRef);

          if(!listSnap.exists()){
            console.error('List not found in any collection');
            return {success: false, error: 'List not found'};
          }
        }
        await deleteDoc(listRef);

        if(!isRegularList){
          const actitvitiesQuery = query(
            collection(firestore, 'TMDBActivities'),
            where('listId', '==', listId)
          );
          const activitiesSnapshot = await getDocs(actitvitiesQuery);

          const deletePromises = activitiesSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
        }

        //Update local state
        const updatedLists = userLists.filter((list) => list.id !== listId);
        setUserLists(updatedLists);

        if(currentList && currentList.id === listId){
          setCurrentList(null);
        }

        return {success: true};
    } catch (error) {
      console.error('Failed to delete list:', error);
      return {success: false, error: 'Failed to delete list'};
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

  const createList = async (title, activities, category = null) => {
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

      //Validate activities
      if(!Array.isArray(activities) || activities.length === 0){
        throw new Error('Activities must be a non-empty array');
      }

      let processedActivities;

      if(activities.every(activity => typeof activity === 'string')){
        processedActivities = activities
        .filter(activity => typeof activity === 'string' && activity.trim() !== '')
        .map(activity => ({
          title: activity.trim(),
          createdAt: new Date(),
          completed: false
        }));
      }else{
        processedActivities = activities
          .filter(activity => activity && typeof activity.title === 'string' && activity.title.trim() !== '')
          .map(activity => ({
            title: activity.title.trim(),
            address: activity.address || '',
            rating: activity.rating || 'N/A',
            placedId: activity.placedId || '',
            location: activity.location || null,
            createdAt: activity.addedAt || new Date(),
            addedBy: activity.addedBy || auth.currentUser.uid,
            completed: false
          }));
      }

      if(processedActivities.length === 0){
        throw new Error('No valid activities provided');
      }

      const listData = {
        title: title.trim(),
        activities: processedActivities,
        category: category || 'other',
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
    let listCollection = 'userLists';

    if (!docSnap.exists()) {
      docRef = doc(firestore, 'TMDBLists', id);
      docSnap = await getDoc(docRef);
      listCollection = 'TMDBLists';
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
        listType: listCollection === 'TMDBLists' ? 'tmdb_watchlist' : 'regular',
        category: data.category === undefined || data.category === null ? 'other' : data.category
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

      let category = 'other';
      if(options.includeMovies && !options.includeTVShows){
        category = 'movies';
      }else if(options.includeTVShows && !options.includeMovies){
        category = 'tv-shows';
      }else{
        category = 'movies';
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
        generatedAt: new Date(),
        category: category
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

  const updateListCategory = async(listId, newCategory, listType) => {
    try{
      let collectionName = '';
      if(listType === 'tmdb_watchlist'){
        collectionName = 'TMDBLists';
      }else{
        collectionName = 'userLists';
      }

      const listRef = doc(firestore, collectionName, listId);
      await updateDoc(listRef, {
        category: newCategory
      });

      //Update local state
      setCurrentList(prev => {
        if(prev && prev.id === listId){
          return {...prev, category: newCategory};
        }
        return prev;
      });

      //update userLists state
      setUserLists(prevLists => 
        prevLists.map(list => 
          list.id === listId ? {...list, category: newCategory} : list
        )
      );;
      return {success: true}
    }catch(error){
      console.error('Error updating list category:', error);
      return {success: false, error: 'Failed to update list category'};
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
    getUserListById,
    updateListCategory
  };

  return (
    <UserListsContext.Provider value={value}>
      {children}
    </UserListsContext.Provider>
  );
};
