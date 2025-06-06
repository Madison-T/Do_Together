import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import { GOOGLE_PLACES_API_KEY } from "../apiKeys";
import { useUserLists } from "../contexts/UserListsContext";
import { auth } from '../firebaseConfig';


// Utility
const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

const PLACE_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe" },
  { value: "bakery", label: "Bakery" },
  { value: "meal_takeaway", label: "Takeaway" },
  { value: "meal_delivery", label: "Delivery" },
  { value: "bar", label: "Bar" },
  { value: "food", label: "Food" }
];

const SORT_OPTIONS = [
  { value: "prominence", label: "Most Popular" },
  { value: "distance", label: "Closest" }
];

const PRICE_LEVELS = [0, 1, 2, 3]; // $ to $$$$
const PlaceListGenerator = ({ visible, onClose, groupId, onListCreated }) => {
  const router = useRouter();
  const { createList } = useUserLists();

  const [listTitle, setListTitle] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [radius, setRadius] = useState(5);
  const [limit, setLimit] = useState(5);
  const [placeTypes, setPlaceTypes] = useState(new Set(["restaurant"]));
  const [sortBy, setSortBy] = useState("prominence");
  const [priceFilter, setPriceFilter] = useState(new Set());
  const [advancedVisible, setAdvancedVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    if (!visible) resetForm();
  }, [visible]);

  const resetForm = () => {
    setListTitle("");
    setQuery("");
    setSuggestions([]);
    setSelectedPlace(null);
    setRadius(5);
    setLimit(5);
    setPlaceTypes(new Set(["restaurant"]));
    setSortBy("prominence");
    setPriceFilter(new Set());
    setAdvancedVisible(false);
    setPlaces([]);
  };

  const handleAutocomplete = async (text) => {
    setQuery(text);
    setSuggestions([]);
    if (text.length < 3) return;
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_PLACES_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status === "OK") setSuggestions(data.predictions);
  };

  const handleSelectPrediction = (place) => {
    setQuery(place.description);
    setSuggestions([]);
    setSelectedPlace(place);
  };

  const togglePrice = (level) => {
    const newSet = new Set(priceFilter);
    newSet.has(level) ? newSet.delete(level) : newSet.add(level);
    setPriceFilter(newSet);
  };

  const togglePlaceType = (type) => {
    const newSet = new Set(placeTypes);
    newSet.has(type) ? newSet.delete(type) : newSet.add(type);
    if (newSet.size === 0) {
      newSet.add(type); // prevent empty selection
    }
    setPlaceTypes(newSet);
  };

  const handleGenerate = async () => {
    if (!selectedPlace || !listTitle.trim()) {
      Alert.alert("Missing Info", "Enter a title and select a location.");
      return;
    }

    setLoading(true);
    try {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${selectedPlace.place_id}&fields=geometry&key=${GOOGLE_PLACES_API_KEY}`;
      const detailRes = await fetch(detailsUrl);
      const detailData = await detailRes.json();
      const loc = detailData.result.geometry.location;

      const priceParam =
        priceFilter.size > 0
          ? `&minprice=${Math.min(...priceFilter)}&maxprice=${Math.max(...priceFilter)}`
          : "";

      const allResults = [];

      for (const type of placeTypes) {
        const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${loc.lat},${loc.lng}&radius=${radius * 1000}&type=${type}&rankby=${sortBy}${priceParam}&key=${GOOGLE_PLACES_API_KEY}`;
        const nearbyRes = await fetch(nearbyUrl);
        const nearbyData = await nearbyRes.json();

        if (nearbyData.status === "OK") {
          allResults.push(...nearbyData.results);
        }
      }

      const shuffled = shuffle(allResults);
      const trimmed = shuffled.slice(0, limit).map((p) => ({
        title: p.name,
        address: p.vicinity,
        rating: p.rating || "N/A",
        placeId: p.place_id,
        location: p.geometry.location,
      }));

      setPlaces(trimmed);
    } catch (e) {
      Alert.alert("Error", e.message || "Could not fetch places.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
  if (places.length === 0) return Alert.alert("Nothing to save.");

  // Map raw place data into structured activity objects
  const activityItems = places
    .filter(p => p && typeof p.title === 'string' && p.title.trim() !== '')
    .map(p => ({
      title: p.title.trim(),
      address: p.address || '',
      rating: p.rating || 'N/A',
      placeId: p.placeId || '',
      location: p.location || null,
      addedAt: new Date(),
      addedBy: auth.currentUser?.uid || 'unknown'
    }));

  if (activityItems.length === 0) {
    return Alert.alert("Error", "All activities must have a valid title.");
  }

  setLoading(true);

  try{
    if(!auth.currentUser){
      throw new Error("You must be logged in to make a custom list");
    }

    const result = await createList(listTitle.trim(), activityItems, {
      category: 'restaurants'
    });

    if (result.success) {
      const newList = {
        id: result.id,
        title: listTitle.trim(),
        activities: activityItems,
        category: 'restaurants'
      };

      if (onListCreated) onListCreated(newList);

       InteractionManager.runAfterInteractions(() => {
        router.push({
          pathname: '/createVoteSession',
          params: {
            listId: newList.id,
            listType: 'user',
            groupId: groupId,
            listTitle: newList.title
          }
        });
        onClose(); // Only close the modal after navigation begins
        });
    }else{
      Alert.alert("Error", result.error || 'Failed to create google api list');
    }
  }catch (error){
    console.error("Database save error:", error);
  }finally{
    setLoading(false);
  }
};


  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleSave}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Generate Places List</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.section}>
                <Text style={styles.label}>List Title</Text>
                <TextInput
                  style={styles.input}
                  value={listTitle}
                  onChangeText={setListTitle}
                  placeholder="e.g., Saturday Hangouts"
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Search Location</Text>
                <TextInput
                  style={styles.input}
                  value={query}
                  onChangeText={handleAutocomplete}
                  placeholder="Start typing a place..."
                />
                {suggestions.map((s) => (
                  <TouchableOpacity key={s.place_id} onPress={() => handleSelectPrediction(s)}>
                    <Text style={styles.suggestion}>{s.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Place Types</Text>
                <View style={styles.inlineOptions}>
                  {PLACE_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      onPress={() => togglePlaceType(t.value)}
                      style={[styles.option, placeTypes.has(t.value) && styles.optionSelected]}
                    >
                      <Text style={placeTypes.has(t.value) && styles.optionTextSelected}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.label}>Number of Items</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity 
                    style={styles.counterButton}
                    onPress={() => setLimit(Math.max(1, limit - 1))}
                  >
                    <Ionicons name="remove" size={20} color="#3f51b5" />
                  </TouchableOpacity>
                  <Text style={styles.counterText}>{limit}</Text>
                  <TouchableOpacity 
                    style={styles.counterButton}
                    onPress={() => setLimit(limit + 1)}
                  >
                    <Ionicons name="add" size={20} color="#3f51b5" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={styles.advanced}
                onPress={() => setAdvancedVisible(!advancedVisible)}
              >
                <Text style={styles.advancedToggle}>
                  {advancedVisible ? "Hide" : "Show"} Advanced Options
                </Text>
                <Ionicons 
                  name={advancedVisible ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#3f51b5"
                  style={{marginLeft: 6, marginTop: 2}}

                />
              </TouchableOpacity>

              {advancedVisible && (
                <>
                  <View style={styles.section}>
                    <Text style={styles.label}>Sort By</Text>
                    <View style={styles.inlineOptions}>
                      {SORT_OPTIONS.map((opt) => (
                        <TouchableOpacity
                          key={opt.value}
                          onPress={() => setSortBy(opt.value)}
                          style={[styles.option, sortBy === opt.value && styles.optionSelected]}
                        >
                          <Text style={sortBy === opt.value && styles.optionTextSelected}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.section}>
                    <Text style={styles.label}>Price Levels</Text>
                    <View style={styles.inlineOptions}>
                      {PRICE_LEVELS.map((lvl) => (
                        <TouchableOpacity
                          key={lvl}
                          onPress={() => togglePrice(lvl)}
                          style={[styles.option, priceFilter.has(lvl) && styles.optionSelected]}
                        >
                          <Text style={priceFilter.has(lvl) && styles.optionTextSelected}>
                            {"$".repeat(lvl + 1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </>
              )}

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.generateButton, loading && styles.generateButtonDisabled]}
                        onPress={handleGenerate}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Ionicons name="list" size={20} color="#fff" />
                        )}
                        <Text style={styles.generateButtonText}>
                            {loading ? 'Generating ...' : 'Generate'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {places.length > 0 &&
                  places.map((p, i) => (
                    <View key={i} style={styles.placeCard}>
                      <Text style={styles.placeTitle}>{p.title}</Text>
                      <Text>{p.address}</Text>
                      <Text>Rating: {p.rating}</Text>
                    </View>
                  ))}

                <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                  <Ionicons name="checkbox" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save List</Text>
                </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container:{
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  safeArea:{
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardAvoidingView:{
    flex: 1,
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: { 
    fontSize: 20, 
    fontWeight: "bold" 
  },
  scrollView:{
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent:{
    padding: 16,
    paddingBottom: 40,
  },
  section: { 
    marginBottom: 20 
  },
  label: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8 
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  suggestion: { 
    padding: 8, 
    backgroundColor: "#f0f0f0", 
    marginBottom: 4 
  },
  inlineOptions: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 8 
  },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: "#ddd",
    backgroundColor: '#fff',
  },
  optionSelected: {
    backgroundColor: "#3f51b5",
    borderColor: "#3f51b5",
  },
  optionTextSelected: { 
    color: "#fff", 
    fontWeight: "600" 
  },
  counterRow: { 
    flexDirection: "row", 
    alignItems: "center", 
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
    fontWeight: "bold" ,
    marginHorizontal: 20,
    color: '#333',
  },
  advancedToggle: {
    color: "#3f51b5",
    fontWeight: '600',
    marginBottom: 16,
    fontSize: 16,
    paddingRight: 12,
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
  saveButton: {
    backgroundColor: "#4CAF50",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginVertical: 20,
  },
  saveButtonText: { 
    color: "#fff", 
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  placeCard: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  placeTitle: { 
    fontWeight: "bold", 
    fontSize: 16 
  },
  advanced:{
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    justifyContent: 'center',
  },
});

export default PlaceListGenerator;
