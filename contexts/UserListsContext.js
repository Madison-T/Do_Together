import { addDoc, arrayRemove, arrayUnion, collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, firestore } from '../firebaseConfig';

//Create the context
const UserListsContext = createContext();

//custom hook to use the context
export const useUserLists = () =>{
    const context = useContext(UserListsContext);
    if(!context){
        throw new Error('useUserLists must be used within a UserListsProvider');
    }
    return context;
};

//Provider component
export const UserListsProvider = ({children}) =>{
    const [userLists, setUserLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentList, setCurrentList] = useState(null);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState(null);

    //Load lists when component mounts or when auth state changes
    useEffect(()=>{
        const loadInitialData = async() =>{
            if(auth.currentUser){
                loadUserLists();
            }else{
                setUserLists([]);
                setLoading(false);
            }
        };
        loadInitialData();
    }, [auth.currentUser]);

    const loadUserLists = async () =>{
        try{
            setLoading(true);

            const userId = auth.currentUser?.uid;
            if(!userId){
                setUserLists([]);
                return;
            }

            const listsRef = collection(firestore, "userLists");
            const q = query (listsRef, where("userId", "==", userId));

            const querySnapshot = await getDocs(q);
            const lists = [];

            querySnapshot.forEach((doc) =>{
                lists.push({
                    id:doc.id,
                    ...doc.data()
                });
            });

            setUserLists(lists);
        }catch(error){
            console.error("Failed to load user lists:", error);
        }finally{
            setLoading(false);
        }
    };

    const loadListDetails = async (listId) =>{
        if(!listId){
            setListError("No list ID provided");
            setListLoading(false);
            return {success: false, error: "No list ID provided"};
        }

        try{
            setListError(null);
            setListLoading(true);
            console.log("Fetching list with ID", listId);

            const listRef = doc(firestore, 'userLists', listId);
            const listSnap = await getDoc(listRef);

            if(listSnap.exists()){
                console.log("List data found:", listSnap.data());
                const listData = {
                    id: listSnap.id,
                    ...listSnap.data()
                };

                setCurrentList(listData);
                return {success: true, list: listData};
            }else{
                console.log("List not found");
                setListError("List not found");
                setCurrentList(null);
                return {success: false, error: "List not found"};
            }
        }catch (error){
            console.error("Error loading list details", error);
            setListError('Failed to load list details');
            setCurrentList(null);
            return {success: false, error: 'Failed to load list details'};
        }finally{
            setListLoading(false);
        }
    };

    const addActivity = async (listId, activityText) =>{
        if(!activityText.trim()){
            return {success: false, error: 'Please enter an activity'};
        }

        try{
            const listRef = doc(firestore, 'userLists', listId);

            //add activity to firestore
            await updateDoc(listRef, {
                activities: arrayUnion(activityText.trim())
            });

            //update both current list and lists array
            setCurrentList(prev=>({
                ...prev,
                activities: [...(prev.activities || []), activityText.trim()]
            }));

            //update the item in the user lists array too
            setUserLists(prevLists =>{
                return prevLists.map(list=>{
                    if(list.id === listId){
                        return{
                            ...list,
                            activities: [...(list.activities || []), activityText.trim()]
                        };
                    }
                    return list;
                });
            });

            console.log("Activty added successfully");
            return {success: true};
        }catch(error){
            console.error("Failed to add activity", error);
            return {success: false, error: 'Failed to add activity'};
        }
    };

    const removeActivity = async (listId, activityToRemove) =>{
        try{
            const listRef = doc(firestore, 'userLists', listId);

            //Remove activity from firestore array
            await updateDoc(listRef, {
                activities: arrayRemove(activityToRemove)
            });

            //Update current list state
            setCurrentList(prev =>({
                ...prev,
                activities: prev.activities.filter(activity => activity !== activityToRemove)
            }));

            //Update the item in the user lists array too
            setUserLists(prevLists =>{
                return prevLists.map(list =>{
                    if(list.id === listId){
                        return{
                            ...list,
                            activities: list.activities.filter(activity => activity !== activityToRemove)
                        };
                    }
                    return list;
                });
            });

            console.log("Activity removed successfully");
            return {success: true};
        }catch(error){
            console.error("Failed to remove activity", error);
            return {success: false, error: "Failed to remove activity"};
        }
    };

    const deleteList = async (listId) =>{
        try{
            //Delete document from Firestore
            const listRef = doc(firestore, "userLists", listId);
            await deleteDoc(listRef);

            //Update local state
            const updatedLists = userLists.filter(list => list.id !== listId);
            setUserLists(updatedLists);

            return true;
        }catch(error){
            console.error("Failed to delete list", error);
            return false;
        }
    };

    //Check if a list with the same name already exists for the current user
    const checkListNameExists = async(title) =>{
        if(!auth.currentUser){
            return false;
        }

        const listsRef = collection(firestore, "userLists");
        const q = query (listsRef,
            where("userId", "==", auth.currentUser.uid),
            where("title", "==", title.trim())
        );

        const querySnapshot = await getDocs(q);
        return !querySnapshot.empty;
    }

    const createList = async(title, activities) =>{
        try{
            if(!auth.currentUser){
                throw new Error("You must be logged in to create a list");
            }

            //Check if list name already exists
            const listExists = await checkListNameExists(title);
            if(listExists){
                return {success: false, error:"A list with this name already exists. Please choose a different name"};
            }

            //Filter out empty activities
            const filteredActivities = activities.filter(activity => activity.trim() !== '');

            if(filteredActivities.length === 0){
                throw new Error("Please add at least one activity");
            }

            const listData = {
                title: title.trim(),
                activities: filteredActivities,
                userId: auth.currentUser.uid,
                createdAt: new Date()
            };

            const docRef = await addDoc(collection(firestore, "userLists"), listData);

            const newList = {
                id: docRef.id,
                ...listData
            };

            setUserLists(prevLists => [...prevLists, newList]);

            return {success: true, id:docRef.id};
        }catch(error){
            console.error("Error creating lists", error);
            return {success:false, error:error.message};
        }
    }

    const value = {
        userLists,
        loading,
        loadUserLists,
        deleteList,
        createList,
        currentList,
        listLoading,
        listError,
        loadListDetails,
        addActivity,
        removeActivity
    };

    return (
        <UserListsContext.Provider value={value}>
            {children}
        </UserListsContext.Provider>
    );
};