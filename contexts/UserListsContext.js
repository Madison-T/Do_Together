import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
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

    //Load lists when component mounts or when auth state changes
    useEffect(()=>{
        if(auth.currentUser){
            loadUserLists();
        }else{
            setUserLists([]);
            setLoading(false);
        }
    }, [auth.currentUser]);

    const loadUserLists = async () =>{
        try{
            setLoading(true);

            const userId = auth.currentUser.uid;
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

    const createList = async(title, activities) =>{
        try{
            if(!auth.currentUser){
                throw new Error("You must be logged in to create a list");
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
        createList
    };

    return (
        <UserListsContext.Provider value={value}>
            {children}
        </UserListsContext.Provider>
    );
};