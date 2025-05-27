import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useUserLists } from "../contexts/UserListsContext";
import { ProviderNames, StreamingProviders, generateWatchList } from "../hooks/useMovieAPI";

const TMDBListGenerator = ({visible, onClose}) => {
    const {createList} = useUserLists();

    //Form state
    const [listTitle, setListTitle] = useState('');
    const [selectedProviders, setSelectedProviders] = useState(new Set());
    const [includeMovies, setIncludeMovies] = useState(true);
    const [includeTVShows, setIncludeTVShows] = useState(true);
    const [itemCount, setItemCount] = useState(20);
    const [minRating, setMinRating] = useState(6.0);
    const [sortBy, setSortBy] = useState('popularity.desc');

    //UI State
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

    const sortOptions = [
        {value: 'popularity.desc', label: 'Most Popular'},
        {value: 'vote_average.desc', label: 'HighestRated'},
        {value: 'release_date.desc', label: 'Newest'},
        {value: 'vote_count.desc', label: 'Most Voted'}
    ];

    const handleProviderToggle = (providerId) =>{
        const newSelected = new Set(selectedProviders);
        if(newSelected.has(providerId)){
            newSelected.delete(providerId);
        }else{
            newSelected.add(providerId);
        }
        setSelectedProviders(newSelected);
    };

    const handleGenerate = async () => {
        //Validation
        if(!listTitle.trim()){
            Alert.alert('Error', 'Please enter a list title');
            return;
        }

        if(!includeMovies && !includeTVShows){
            Alert.alert('Error', 'Please select at least movies or TV shows');
            return;
        }

        if(itemCount < 1 || itemCount > 100){
            Alert.alert('Error', 'Item count must be between 1 and 100');
            return;
        }

        setIsGenerating(true);

        try{
            //Generate watchlist from TMDB
            const watchlistOptions = {
                providers: Array.from(selectedProviders),
                includeMovies,
                includeTVShows,
                count: itemCount,
                minRating,
                sortBy
            };

            const tmdbContent = await generateWatchList(watchlistOptions);

            //Format for our activity list
            const activites = tmdbContent.map(item => {
                const providerText = selectedProviders.size > 0 
                ? ` [${Array.from(selectedProviders).map(id => ProviderNames[id]).join (', ')}]`
                : '';
                return `${item.title}${providerText}`;
            });

            //Create the list
            const result = await createList(listTitle.trim(), activites);

            if(result.success){
                resetForm();
                onClose();
            }else{
                Alert.alert('Error', result.error || 'Failed to create list');
            }
        }catch(error){
            console.error('Error generating TMDB list: ', error);
        }finally{
            setIsGenerating(false);
        }
    };

    const resetForm = () =>{
        setListTitle('');
        selectedProviders(new Set());
        setIncludeMovies(true);
        setIncludeTVShows(true);
        setItemCount(20);
        setMinRating(6.0);
        setSortBy('popularity.desc');
        setShowAdvancedOptions(false);
    };

    const handleClose = () => {
        if(!isGenerating){
            resetForm();
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Generate Watchlist</Text>
                    <TouchableOpacity
                        onPress={handleClose}
                        style={styles.closeButton}
                        disabled={isGenerating}
                    >
                        <Ionicons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                    {/** List Title */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>List Title</Text>
                        <TextInput
                            style={styles.textInput}
                            value = {listTitle}
                            onChangeText={setListTitle}
                            placeholder="e.g., Weekend Movie Night"
                            editable = {!isGenerating}
                        />
                    </View>

                    {/** Content Type Selection */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Content Type</Text>
                        <View style={styles.switchContainer}>
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Include Movies</Text>
                                <Switch
                                    value={includeMovies}
                                    onValueChange={setIncludeMovies}
                                    disabled={isGenerating}
                                />
                            </View>
                            <View style={styles.switchRow}>
                                <Text style={styles.switchLabel}>Include TV Shows</Text>
                                <Switch
                                    value={includeTVShows}
                                    onValueChange={setIncludeTVShows}
                                    disabled={isGenerating}
                                />
                            </View>
                        </View>
                    </View>

                    {/** Streaming Providers */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            Streaming Services {selectedProviders.size > 0 && `(${selectedProviders.size} selected)`}
                        </Text>
                        <Text style={styles.sectionSubtitle}>Leave empty to include all services</Text>
                        <View style={styles.providerGrid}>
                            {Object.entries(StreamingProviders).map(([key, id]) => (
                                <TouchableOpacity
                                    key={id}
                                    style={[
                                        styles.providerButton,
                                        selectedProviders.has(id) && styles.providerButtonSelected
                                    ]}
                                    onPress={() => handleProviderToggle(id)}
                                    disabled = {isGenerating}
                                >
                                    <Text style={[
                                        styles.providerText,
                                        selectedProviders.has(id) && styles.providerTextSelected
                                    ]}>
                                        {ProviderNames[id]}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/** Item Count */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Number of Items</Text>
                        <View style={styles.counterContainer}>
                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={() => setItemCount(Math.max(1, itemCount - 5))}
                                disabled={isGenerating}
                            >
                                <Ionicons name="remove" size={20} color='#3f51b5' />
                            </TouchableOpacity>
                            <Text style={styles.counterTet}>{itemCount}</Text>
                            <TouchableOpacity
                                style={styles.counterButton}
                                onPress={() => setItemCount(Math.min(100, itemCount + 5))}
                                disabled={isGenerating}
                            >
                                <Ionicons name="add" size={20} color="#3f51b5" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/** Advanced Options */}
                    <TouchableOpacity
                        style={styles.advancedToggle}
                        onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        disabled={isGenerating}
                    >
                        <Text style={styles.advancedToggleText}>Advanced Options</Text>
                        <Ionicons
                            name={showAdvancedOptions ? "chevron-up" : "chevron-down"}
                            size={20}
                            color="#3f51b5"
                        />
                    </TouchableOpacity>

                    {showAdvancedOptions && (
                        <View style = {styles.advancedSection}>
                            {/** Sorted By */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Sort By</Text>
                                <View style={styles.sortGrid}>
                                    {sortOptions.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={[
                                                styles.sortButton,
                                                sortBy === option.value && styles.sortButtonSelected
                                            ]}
                                            onPress={() => setSortBy(option.value)}
                                            disabled={isGenerating}
                                        >
                                            <Text style={[
                                                styles.sortText,
                                                sortBy === option.value && styles.sortTextSelected
                                            ]}>
                                                {option.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            {/** Minimum Rating */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Minimum Rating</Text>
                                <View style={styles.ratingContainer}>
                                    <TouchableOpacity
                                        style={styles.counterButton}
                                        onPress={() => setMinRating(Math.max(0, minRating - 0.5))}
                                        disabled={isGenerating}
                                    >
                                        <Ionicons name="remove" size={20} color="#3f51b5" />
                                    </TouchableOpacity>
                                    <Text style={styles.counterText}>{minRating.toFixed(1)}</Text>
                                    <TouchableOpacity
                                        style={styles.counterButton}
                                        onPress={() => setMinRating(Math.min(10, minRating + 0.5))}
                                        disabled={isGenerating}
                                    >
                                        <Ionicons name="add" size={20} color="#3f51b5" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/** Generate Button */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.generateButton, isGenerating && styles.generateButtonDisabled]}
                        onPress={handleGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="list" size={20} color="#fff" />
                        )}
                        <Text style={styles.generateButtonText}>
                            {isGenerating ? 'Generating ...' : 'Generate Watchilist'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 8,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 18,
        color: '#666',
        marginBottom: 12,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    switchContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    switchLabel: {
        fontSize: 16,
        color: '#333',
    },
    providerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    providerButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    providerButtonSelected: {
        backgroundColor: '#3f51b5',
        borderColor: '#3f51b5',
    },
    providerText: {
        fontSize: 14,
        color: '#333',
    },
    providerTextSelected: {
        color: '#fff',
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
    },
    counterButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    counterText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginHorizontal: 20,
        color: '#333',
    },
    advancedToggle: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#fff',
        borderRadius: 8,
        marginBottom: 16,
    },
    advancedToggleText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3f51b5',
    },
    advancedSection: {
        marginBottom: 16,
    },
    sortGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    sortButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
    sortButtonSelected: {
        backgroundColor: '#3f51b5',
        borderColor: '#3f51b5',
    },
    sortText: {
        fontSize: 14,
        color: '#333',
    },
    sortTextSelected: {
        color: '#fff',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 8,
        padding: 12,
    },
    footer: {
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    generateButton: {
        backgroundColor: '#3f51b5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 8,
    },
    generateButtonDisabled:{
        opacity: 0.7,
    },
    generateButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
});

export default TMDBListGenerator;