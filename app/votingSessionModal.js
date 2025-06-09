import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { usePresetLists } from '../contexts/PresetListsContext';
import { listCategories, useUserLists } from "../contexts/UserListsContext";
import { auth } from '../firebaseConfig';
import * as FirestoreService from '../hooks/useFirestore';

const VotingSessionModal = ({visible, onClose, onSessionCreated, onShowTMDBGenerator, onShowPlacesGenerator, groupId}) => {
    const [currentView, setCurrentView] = useState('categories');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [activeTab, setActiveTab] = useState('generic');
    const [genericLists, setGenericLists] = useState([]);
    const [personalLists, setPersonalLists] = useState([]);
    const [selectedList, setSelectedList] = useState(null);
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionDescription, setSessionDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [numberOfCards, setNumberOfCards] = useState(5);
    const [selectedItems, setSelectedItems] = useState([]);

    const {userLists = [], tmdbLists = []} = useUserLists();
    const {presetLists = []} = usePresetLists();

    const loadLists = useCallback(async () => {
        setLoading(true);
        try{
            const filteredPresetLists = presetLists.filter(list => {
                return selectedCategory && list.category === selectedCategory.id;
            });
            setGenericLists(filteredPresetLists);

            //Load user's personal lists for the selected categroy
            let filteredPersonalLists = [];

            const regularLists = userLists.filter(list =>{
                if(selectedCategory === 'other'){
                    return !list.category || list.category === 'other';
                }
                return list.category === selectedCategory?.id;
            });

            //Include TMDB lists for movies/tv-shows categories
            if(selectedCategory?.id === 'movies' || selectedCategory?.id === 'tv-shows'){
                const relevantTMDBLists = tmdbLists.filter(list => {
                    if(list.category === selectedCategory.id) return true;

                    if(selectedCategory.id === 'movies' && (list.type === 'movie' || list.contentType === 'movie')) return true;
                    if(selectedCategory.id === 'tv-shows' && (list.type === 'tv' || list.contentType === 'tv')) return true;

                    if(list.tmdbOptions){
                        if(selectedCategory.id === 'movies' && list.tmdbOptions.includeMovies) return true;
                        if(selectedCategory.id === 'tv-shows' && list.tmdbOptions.includeTVShows) return true;
                    }

                    return false;
                });
                filteredPersonalLists = [...regularLists, ...relevantTMDBLists];
            }else{
                filteredPersonalLists = regularLists;
            }

            setPersonalLists(filteredPersonalLists);
        }catch(error){
            console.error('Error loading lists:', error);
        }finally{
            setLoading(false);
        }
    }, [selectedCategory, userLists, tmdbLists, presetLists]);
    
    useEffect(()=>{
        if(visible && selectedCategory){
            loadLists();
        }
    }, [visible, selectedCategory, loadLists]);

    const handleListSelect = (list) => {
        router.push({
            pathname: '/createVoteSession',
            params:{
                listId: list.id,
                listType: userLists.some(userList => userList.id === list.id) ? 'user' :
                        tmdbLists.some(tmdbList => tmdbList.id === list.id) ? 'tmdb':
                        'preset'
            }
        });
        handleClose();
    };

    const handleCreateSession = async () => {
        if(!sessionTitle.trim()){
            return;
        }

        if(!selectedList){
            return;
        }

        setLoading(true);
        try{
            let listType = 'generic';
            if(userLists.some(userList => userList.id === selectedList.id)){
                listType = 'personal';
            }else if(tmdbLists.some(tmdbLists => tmdbLists.id === selectedList.id)){
                listType = 'tmdb';
            }else if(presetLists.some(presetLists => presetLists.id === selectedList.id)){
                listType = 'preset';
            }

            const sessionData = {
                title: sessionTitle.trim(),
                description: sessionDescription.trim(),
                listId: selectedList.id,
                listType: listType,
                groupId: groupId,
                createdBy: auth.currentUser?.uid,
                createdAt: new Date(),
                votes: {},
                status: 'active'
            };

            const result = await FirestoreService.createVotingSession(sessionData);

            if(result.success){
                resetModal();
                onSessionCreated(result.session);
            }
        }catch(error){
            console.error('Error creating voting session:', error);
        }finally{
            setLoading(false);
        }
    };

    const resetModal = () => {
        setCurrentView('categories');
        setSelectedCategory(null);
        setActiveTab('generic');
        setSelectedList(null);
        setSessionTitle('');
        setSessionDescription('');
        setSelectedItems([]);
        setNumberOfCards(20);
    };

    const handleClose = () => {
        if(!loading){
            resetModal();
            onClose();
        }
    };

    const handleCategorySelectWithCards = (category) => {
        setSelectedCategory(category);
        setCurrentView('lists');
    }

    const handleCardNumberSelection = async () =>{
        setLoading(true);
        try{
            const availableItems = genericLists[selectedCategory.id] || [];

            const shuffled = [...availableItems].sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, Math.min(numberOfCards, availableItems.length));

            setSelectedItems(selected);
            setSessionTitle(`Vote on ${selectedCategory.name}`);
            setCurrentView('session');
        }catch(error){
            console.error('Error selecting items:', error);
        }finally{
            setLoading(false);
        }
    };

    const handleGenerateNewList = () => {
        if(selectedCategory?.id === 'movies' || selectedCategory?.id === 'tv-shows'){
            onShowTMDBGenerator();
            return;
        }
        if(selectedCategory?.id === 'restaurants'){
            onShowPlacesGenerator();
            return;
        }

        router.push('/createLists');
        handleClose();
    }

    //render categories
    const renderCategories = () => (
  <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.instructionText}>Select a category to create a voting session</Text>
    <View style={styles.categoriesGrid}>
      {/* Create your own list card */}
      <TouchableOpacity
        style={[styles.categoryCard, styles.createListCard]}
        onPress={() => router.push('/createLists')}
        disabled={loading}
      >
        <View style={styles.categoryRow}>
          <View style={[styles.categoryIcon, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="create-outline" size={24} color="#fff" />
          </View>
          <Text style={styles.categoryName}>Create List</Text>
        </View>
      </TouchableOpacity>

      {/* Category Cards */}
      {listCategories.map((category) => (
        <TouchableOpacity
          key={category.id}
          style={[styles.categoryCard, { borderLeftColor: category.color }]}
          onPress={() => handleCategorySelectWithCards(category)}
          disabled={loading}
        >
          <View style={styles.categoryRow}>
            <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
              <Ionicons name={category.icon} size={24} color="#fff" />
            </View>
            <Text style={styles.categoryName}>{category.name}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>
);


    //Lists selection
    const renderListsSelection = () => (
        <ScrollView style={styles.content}>
            <View style={styles.sectionHeader}>
                <TouchableOpacity onPress={() => setCurrentView('categories')}>
                    <Ionicons name="arrow-back" size={24} color="#3f51b5" />
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>{selectedCategory?.name || 'Select Category'}</Text>
            </View>

            {/** Generate New List Button */}
            <TouchableOpacity
                style={styles.generateNewListButton}
                onPress={handleGenerateNewList}
            >
                <View style={styles.generateNewListContent}>
                    <Ionicons name="add-circle" size={24} color="#4caf50" />
                    <View style={styles.generateNewListText}>
                        <Text style={styles.generateNewListTitle}>Generate New List</Text>
                        <Text style={styles.generateNewListSubtitle}>
                            Create a new {selectedCategory?.name?.toLowerCase() || ''} list
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'generic' && styles.activeTab]}
                    onPress={() => setActiveTab('generic')}
                >
                    <Text style={[styles.tabText, activeTab === 'generic' && styles.activeTabText]}>
                        Preset lists
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
                    onPress={() => setActiveTab('personal')}
                >
                    <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
                        My Lists
                    </Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading lists...</Text>
                </View>
            ):(
                <View style={styles.listContainer}>
                    {activeTab === 'generic' ? (
                        genericLists.length > 0 ? (
                            genericLists.map((list) =>(
                                <TouchableOpacity
                                    key={list.id}
                                    style={styles.listItem}
                                    onPress={() => handleListSelect(list)}
                                >
                                    <Text style={styles.listName}>{list.title}</Text>
                                    <Text style={styles.listDescription}>{list.description || `${list.activities?.length || list.items?.length || 0} items`}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.noListsText}>No preset lists available for this category</Text>
                        )
                    ): (
                        personalLists.length > 0 ? (
                            personalLists.map((list) => (
                                <TouchableOpacity
                                    key={list.id}
                                    style={styles.listItem}
                                    onPress={() => handleListSelect(list)}
                                >
                                    <Text style={styles.listName}>{list.title}</Text>
                                    <Text style={styles.listDescription}>
                                        {list.description ||
                                            `${list.activities?.length || list.items?.length || 0} items` +
                                            (list.type === 'tmdb' ? ' • TMDB Generated' : '')
                                        }
                                    </Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.noListsContainer}>
                                <Text style={styles.noListsText}>No personal lists found for this category</Text>
                                <TouchableOpacity
                                    style={styles.createFirstListButton}
                                    onPress={() => {
                                        router.push('Create Lists');
                                        handleClose();
                                    }}
                                >
                                    <Text style={styles.createFirstListButtonText}>Create your first list</Text>
                                </TouchableOpacity>
                            </View>
                        )
                    )}
                </View>
            )}
        </ScrollView>
    )

    //Card selection
    const renderCardSelection = () => (
        <View style={styles.content}>
            <View style={styles.sectionHeader}>
                <TouchableOpacity onPress={() => setCurrentView('categories')}>
                    <Ionicons name="arrow-back" size={24} color="#3f51b5" />
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>{selectedCategory?.name}</Text>
            </View>

            <Text style={styles.instructionText}>How many items would you like in the voting session?</Text>

            <View style={styles.numberSelector}>
                <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => setNumberOfCards(Math.max(2, numberOfCards - 1))}
                >
                    <Ionicons name="remove" size={20} color="#3f51b5" />
                </TouchableOpacity>

                <Text style={styles.numberText}>{numberOfCards}</Text>

                <TouchableOpacity
                    style={styles.numberButton}
                    onPress={() => setNumberOfCards(Math.min(10, numberOfCards + 1))}
                >
                    <Ionicons name="add" size={20} color="#3f51b5" />
                </TouchableOpacity>
            </View>

            <Text style={styles.helperText}>
                We will randomly select {numberOfCards} items from our {selectedCategory?.name.toLowerCase()} collection
            </Text>

            <TouchableOpacity
                style={styles.continueButton}
                onPress={handleCardNumberSelection}
                disabled={loading}
            >
                <Text style={styles.continueButtonText}>
                    {loading ? 'Selecting Items...' : 'Continue'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {currentView === 'categories' ? 'Create Voting Session' :
                            currentView === 'lists' ? 'Choose List' : 'Session Details'}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {currentView === 'categories' && renderCategories()}
                    {currentView === 'lists' && renderListsSelection()}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay:{
        flex: 1,
        backgroundColor: '#333',
        justifyContent: 'center',
    },
    modalContainer:{
        backgroundColor: '#fff',
        borderRadius: 20,
        width: '100%',
        maxHeight: '100%',
        minHeight: '80%',
        paddingBottom: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    instructionText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    categoryCard:{
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    createListCard: {
        borderLeftColor: '#4CAF50',
        borderStyle: 'dashed',
    },
    categoryIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flexShrink: 1,           // allow text to shrink
    flexWrap: 'wrap',        // allow wrapping
    marginLeft: 10,          // spacing from icon
    },
    selectionHeader:{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 12
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 4,
        marginBottom: 20,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#3f51b5',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    activeTabText: {
        color: '#fff',
    },
    listContainer: {
        flex: 1,
    },
    listItem: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#3f51b5',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    listName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    listDescription: {
        fontSize: 14,
        color: '#666',
        lineHeight: 20,
    },
    noListsText: {
        fontSize: 16,
        color: '#999',
        textAlign: 'center',
        marginTop: 40,
        fontStyle: 'italic',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    numberSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 12,
        padding: 20,
        marginVertical: 20,
    },
    numberButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    numberText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#3f51b5',
        marginHorizontal: 30,
    },
    helperText:{
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        lineHeight: 20,
    },
    continueButton:{
        backgroundColor: '#3f51b5',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 30,
    },
    continueButtonText:{
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    previewContainer:{
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 16,
        marginBottom: 20,
    },
    previewTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    previewItem: {
        backgroundColor: '#fff',
        borderRadius: 6,
        padding: 12,
        marginBottom: 8,
    },
    previewItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    previewItemDescription: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    createButton: {
        backgroundColor: '#3f51b5',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 20,
    },
    createButtonDisabled: {
        backgroundColor: '#ccc',
    },
    createButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    categoryRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    generateNewListButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 2,
        borderColor: '#4CAF50',
        borderStyle: 'dashed',
    },
    generateNewListContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    generateNewListText: {
        marginLeft: 12,
        flex: 1,
    },
    generateNewListTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4caf50',
    },
    generateNewListSubtitle: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
    },
    noListsContainer:{
        alignItems: 'center',
        marginBottom: 40,
    },
    createFirstListButton: {
        backgroundColor: '#3f51b5',
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginTop: 12,
    },
    createFirstListButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 12,
    },
    moreItemsText: {
        fontSize: 12,
        color: '#666',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 8,
    },
    inputContainer: {
        marginBottom: 20,
    },
});

export default VotingSessionModal;