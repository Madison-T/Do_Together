import { createContext, useContext, useEffect, useState } from 'react';
import { fetchPresetListById, fetchPresetLists } from '../hooks/useFirestore';

const PresetListsContext = createContext();

export const usePresetLists = () => useContext(PresetListsContext);

export const PresetListsProvider = ({ children }) => {
  const [presetLists, setPresetLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(null);

  const loadPresetLists = async () => {
    setLoading(true);
    const data = await fetchPresetLists();
    setPresetLists(data);
    setLoading(false);
    setCategory(data.category)
  };

  const getPresetListById = async (listId) => {
    return await fetchPresetListById(listId);
  };

  const getCategory = async(listId) => {
    return listId.category;
  }

  useEffect(() => {
    loadPresetLists();
  }, []);

  return (
    <PresetListsContext.Provider value={{ presetLists, loading, reload: loadPresetLists, getPresetListById, getCategory }}>
      {children}
    </PresetListsContext.Provider>
  );
};
