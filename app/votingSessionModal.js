import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { TextInput } from "react-native-web";
import { useUserLists } from "../contexts/UserListsContext";
import { auth } from '../firebaseConfig';
import * as FirestoreService from '../hooks/useFirestore';

const VotingSessionModal = ({visible, onClose, onSessionCreated, onShowTMDBGenerator, groupId}) => {
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

    const {userLists} = useUserLists();

    const listCategories = [
        {id: 'movies', name: 'Movies', icon: 'film-outline', color: '#e91e63'},
        {id: 'tv-shows', name: 'TV Shows', icon: 'tv-outline', color: '#9c27b0'},
        {id: 'restaurants', name: 'Restaurants', icon: 'restaurant-outline', color: '#ff5722'},
        {id: 'books', name: 'Books', icon: 'book-outline', color: '#795548'},
        {id: 'music', name: 'Music', icon: 'musical-notes-outline', color: '#607d8b'},
        {id: 'food', name: 'Food & Recipes', icon: 'pizza-outline', color: '#ff9800'},
        {id: 'games', name: 'Games', icon: 'game-controller-outline', color: '#4caf50'},
        {id: 'shopping', name: 'Shopping', icon: 'bag-outline', color: '#f44336'}
    ];

    const sampleGenericLists = {
        movies: [
            { id: 'top-action-movies', name: 'Top Action Movies 2024', description: 'Best action movies of the year' },
            { id: 'romantic-comedies', name: 'Best Romantic Comedies', description: 'Feel-good romantic movies' },
            { id: 'sci-fi-classics', name: 'Sci-Fi Classics', description: 'Must-watch science fiction films' }
        ],
        'tv-shows': [
            { id: 'trending-series', name: 'Trending TV Series', description: 'Currently popular shows' },
            { id: 'comedy-series', name: 'Comedy Series to Binge', description: 'Hilarious TV shows' },
            { id: 'drama-series', name: 'Award-Winning Dramas', description: 'Critically acclaimed dramas' }
        ],
        restaurants: [
            { id: 'local-favorites', name: 'Local Favorites', description: 'Popular restaurants in your area' },
            { id: 'date-night-spots', name: 'Date Night Restaurants', description: 'Perfect for romantic dinners' },
            { id: 'family-friendly', name: 'Family-Friendly Dining', description: 'Great for kids and families' }
        ],
        activities: [
            { id: 'outdoor-activities', name: 'Outdoor Adventures', description: 'Fun activities for nature lovers' },
            { id: 'indoor-activities', name: 'Indoor Fun', description: 'Perfect for any weather' },
            { id: 'group-activities', name: 'Group Activities', description: 'Fun with friends and family' }
        ],
        travel: [
            { id: 'weekend-getaways', name: 'Weekend Getaways', description: 'Short trips near you' },
            { id: 'bucket-list-destinations', name: 'Bucket List Destinations', description: 'Dream travel spots' },
            { id: 'budget-travel', name: 'Budget-Friendly Trips', description: 'Amazing places without breaking the bank' }
        ],
        books: [
            { id: 'bestsellers-2024', name: '2024 Bestsellers', description: 'Most popular books this year' },
            { id: 'classic-literature', name: 'Classic Literature', description: 'Timeless literary works' },
            { id: 'mystery-thrillers', name: 'Mystery & Thrillers', description: 'Page-turning suspense novels' }
        ],
        music: [
            { id: 'trending-songs', name: 'Trending Songs', description: 'Current chart toppers' },
            { id: 'chill-playlists', name: 'Chill Vibes', description: 'Relaxing music for any mood' },
            { id: 'workout-music', name: 'Workout Bangers', description: 'High-energy songs for exercise' }
        ],
        food: [
            { id: 'easy-recipes', name: 'Easy Weeknight Dinners', description: 'Quick and delicious meals' },
            { id: 'dessert-recipes', name: 'Decadent Desserts', description: 'Sweet treats to try' },
            { id: 'healthy-meals', name: 'Healthy Meal Ideas', description: 'Nutritious and tasty options' }
        ],
        games: [
            { id: 'party-games', name: 'Party Games', description: 'Fun games for groups' },
            { id: 'board-games', name: 'Best Board Games', description: 'Top-rated tabletop games' },
            { id: 'video-games', name: 'Must-Play Video Games', description: 'Gaming recommendations' }
        ],
        shopping: [
            { id: 'fashion-trends', name: 'Fashion Trends 2024', description: 'Current style must-haves' },
            { id: 'tech-gadgets', name: 'Cool Tech Gadgets', description: 'Latest technology products' },
            { id: 'home-decor', name: 'Home Decor Ideas', description: 'Beautiful home accessories' }
        ]
    };

    useEffect(()=>{
        if(visible && selectedCategory){
            loadLists();
        }
    }, [visible, selectedCategory, activeTab]);

    const loadLists = async () => {
        setLoading(true);
        try{
            setGenericLists(sampleGenericLists[selectedCategory] || []);

            const filteredPersonalLists = userLists.filter(list => {
                if(selectedCategory === 'movies' || selectedCategory === 'tv-shows'){
                    return list.type === 'tmdb' || list.category === selectedCategory;
                }
                return list.category === selectedCategory;
            });
            setPersonalLists(filteredPersonalLists);
        }catch(error){
            console.error('Error loading lists:', error);
        }finally{
            setLoading(false);
        }
    };

    const handleListSelect = (list) => {
        setSelectedList(list);
        setSessionTitle(`Vote on ${list.name}`);
        setCurrentView('session');
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
            const sessionData = {
                title: sessionTitle.trim(),
                description: sessionDescription.trim(),
                listId: selectedList.id,
                listType: activeTab,
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
        if(category.id === 'movies' || category.id === 'tv-shows'){
            onShowTMDBGenerator();
            return;
        }
        setCurrentView('cardSelection');
    }

    const handleCardNumberSelection = async () =>{
        setLoading(true);
        try{
            const availableItems = sampleGenericLists[selectedCategory.id] || [];

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

    //render categories
    const renderCategories = () => (
  <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.instructionText}>Select a category to create a voting session</Text>
    <View style={styles.categoriesGrid}>
      {/* Create your own list card */}
      <TouchableOpacity
        style={[styles.categoryCard, styles.createListCard]}
        onPress={() => router.push('Create Lists')}
        disabled={loading}
      >
        <View style={styles.categoryRow}>
          <View style={[styles.categoryIcon, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="add" size={24} color="#fff" />
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
                <Text style={styles.sectionTitle}>{selectedCategory?.name}</Text>
            </View>

            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'generic' && styles.activeTab]}
                    onPress={() => setActiveTab('generic')}
                >
                    <Text style={[styles.tabText, activeTab === 'generic' && styles.activeTabText]}>
                        Generic lists
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
                                    <Text style={styles.listName}>{list.name}</Text>
                                    <Text style={styles.listDescription}>{list.description}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.noListsText}>No generic lists available for this category</Text>
                        )
                    ): (
                        personalLists.length > 0 ? (
                            personalLists.map((list) => (
                                <TouchableOpacity
                                    key={list.id}
                                    style={styles.listItem}
                                    onPress={() => handleListSelect(list)}
                                >
                                    <Text style={styles.listName}>{list.name}</Text>
                                    <Text style={styles.listDescription}>{list.description || 'Personal list'}</Text>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <Text style={styles.noListsText}>No personal lists found for this category</Text>
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

    //Session details
    const renderSessionDetails = () => (
        <ScrollView style={styles.content}>
            <View style = {styles.sectionHeader}>
                <TouchableOpacity onPress={() => setCurrentView('cardSelection')}>
                    <Ionicons name="arrow-back" size={24} color="#3f51b5" />
                </TouchableOpacity>
                <Text style={styles.sectionTitle}>Session Details</Text>
            </View>

            <View style={styles.inputContainter}>
                <Text style={styles.inputLabel}>Session Title</Text>
                <TextInput
                    style={styles.textInput}
                    value={sessionTitle}
                    onChangeText={setSessionTitle}
                    placeholder="Enter session title"
                    maxLength={100}
                />
            </View>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={sessionDescription}
                    onChangeText={setSessionDescription}
                    placeholder="Add a description for your voting session"
                    multiline
                    numberOfLines={3}
                    maxLength={500}
                />
            </View>

            <View style={styles.previewContainer}>
                <Text style={styles.previewTitle}>Items to Vote On:</Text>
                {selectedItems.map((item, index) => (
                    <View key={item.id || index} style={styles.previewItem}>
                        <Text style={styles.previewItemName}>{item.name}</Text>
                        <Text style={styles.previewItemDescription}>{item.description}</Text>
                    </View>
                ))}
            </View>

            <TouchableOpacity
                style={[styles.createButton, (!sessionTitle.trim() || loading) && styles.createButtonDisabled]}
                onPress={handleCreateSession}
                disabled={!sessionTitle.trim() || loading}
            >
                <Text style={styles.createButtonText}>
                    {loading ? 'Creating Session...' : 'Create Voting Session'}
                </Text>
            </TouchableOpacity>
        </ScrollView>
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
                            currentView === 'cardSelection' ? 'Select Items' :
                            currentView === 'lists' ? 'Choose List' : 'Session Details'}
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color="#333" />
                        </TouchableOpacity>
                    </View>

                    {currentView === 'categories' && renderCategories()}
                    {currentView === 'lists' && renderListsSelection()}
                    {currentView === 'cardSelection' && renderCardSelection()}
                    {currentView === 'session' && renderSessionDetails()}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay:{
        flex: 1,
        backgroundColor: '#333',
        justifyContent: 'flex-end',
    },
    modalContainer:{
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
        minHeight: '50%',
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
});

export default VotingSessionModal;