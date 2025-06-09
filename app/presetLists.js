import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { usePresetLists } from '../contexts/PresetListsContext';
import { listCategories } from '../contexts/UserListsContext';

export default function PresetLists() {
  const router = useRouter();
  const { presetLists, loading } = usePresetLists();
  const [selectedFilterCategory, setSelectedFilterCategory] = useState('all');

  //Filter the lists based on the selected category
  const filteredLists = presetLists.filter(list => {
    if(selectedFilterCategory === 'all'){
      return true;
    }
    return list.category === selectedFilterCategory;
  });

  const handleSelect = (list) => {
    router.push({ pathname: '/presetListView', params: { listId: list.id } });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator testID="loading-indicator" size="large" color="#3f51b5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#3f51b5" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Pre-set Lists</Text>

      {/** Category Filter Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        <TouchableOpacity
          style={[styles.filterButton,
            selectedFilterCategory === 'all' && styles.activeFilterButton,
          ]}
          onPress={() => setSelectedFilterCategory('all')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilterCategory === 'all' && styles.activeFilterButtonText,
          ]}>All</Text>
        </TouchableOpacity>

        {listCategories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.filterButton,
              selectedFilterCategory === category.id && styles.activeFilterButton,
            ]}
            onPress={() => setSelectedFilterCategory(category.id)}
          >
            <Text style={[
              styles.filterButtonText,
              selectedFilterCategory === category.id && styles.activeFilterButtonText,
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredLists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const category = listCategories.find(cat => cat.id === item.category);
          const iconName = category ? category.icon : 'ellipsis-horizonal-outline';
          const iconColor = category ? category.color: '#9e9e9e';

          return (
            <TouchableOpacity style={styles.listItem} onPress={() => handleSelect(item)}>
              <Ionicons name={iconName} size={24} color={iconColor} style={styles.icon} />
              <Text style={styles.listTitle}>{item.title}</Text>
              <Ionicons name="chevron-forward" size={20} color="#777" />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyListContainer}>
            <Ionicons name="sad-outline" size={50} color="#ccc" />
            <Text style={styles.emptyListText}>No lists found for this category.</Text>
          </View>
        )}
      />
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 40,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3f51b5',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  icon: {
    marginRight: 12,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  backText: {
    color: '#3f51b5',
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '500',
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
    maxHeight: 40,
    paddingRight: 80,
  },
  filterButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: '#3f51b5',
  },
  filterButtonText: {
    color: '#555',
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#fff',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyListText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
  },
});

