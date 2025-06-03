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

  const result = await createList(listTitle.trim(), activityItems);
  if (result.success) {
    const newList = {
      id: result.id,
      title: listTitle.trim(),
      activities: activityItems
    };

    if (onListCreated) onListCreated(newList);

    // Pre-fill session context just like TMDBListGenerator
    setSelectedGroupId(groupId);
    setSessionName(`${newList.title} Voting`);
    setStartTime(new Date().toISOString());
    setEndTime(new Date(Date.now() + 15 * 60000).toISOString());
    activityItems.forEach(addActivity);

   InteractionManager.runAfterInteractions(() => {
  router.push({
    pathname: '/createVoteSession',
    params: {
      listId: list.id,
      listType: 'userLists'
    }
  });
  onClose(); // Only close the modal after navigation begins
});

    onClose();
  } else {
    Alert.alert("Error", result.error || "Failed to create list.");
  }
};


  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
              <Text style={styles.title}>Generate Places List</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

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
                <TouchableOpacity onPress={() => setLimit(Math.max(1, limit - 1))}>
                  <Ionicons name="remove" size={20} />
                </TouchableOpacity>
                <Text style={styles.counterText}>{limit}</Text>
                <TouchableOpacity onPress={() => setLimit(limit + 1)}>
                  <Ionicons name="add" size={20} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={() => setAdvancedVisible(!advancedVisible)}>
              <Text style={styles.advancedToggle}>
                {advancedVisible ? "Hide" : "Show"} Advanced Options
              </Text>
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

            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerate}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.generateButtonText}>Generate</Text>
              )}
            </TouchableOpacity>

            {places.length > 0 &&
              places.map((p, i) => (
                <View key={i} style={styles.placeCard}>
                  <Text style={styles.placeTitle}>{p.title}</Text>
                  <Text>{p.address}</Text>
                  <Text>Rating: {p.rating}</Text>
                </View>
              ))}

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save List</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  title: { fontSize: 20, fontWeight: "bold" },
  section: { marginBottom: 20 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
  },
  suggestion: { padding: 8, backgroundColor: "#f0f0f0", marginBottom: 4 },
  inlineOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 20,
    borderColor: "#ccc",
    marginRight: 8,
    marginBottom: 8,
  },
  optionSelected: {
    backgroundColor: "#3f51b5",
    borderColor: "#3f51b5",
  },
  optionTextSelected: { color: "#fff", fontWeight: "600" },
  counterRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  counterText: { fontSize: 16, fontWeight: "bold" },
  advancedToggle: {
    color: "#3f51b5",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  generateButton: {
    backgroundColor: "#3f51b5",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  generateButtonText: { color: "#fff", fontWeight: "bold" },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 20,
  },
  saveButtonText: { color: "#fff", fontWeight: "bold" },
  placeCard: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
  },
  placeTitle: { fontWeight: "bold", fontSize: 16 },
});

export default PlaceListGenerator;
