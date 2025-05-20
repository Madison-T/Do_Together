import { createContext, useContext, useEffect, useState } from 'react';
import { fetchPresetListById, fetchPresetLists } from '../hooks/useFirestore';

const PresetListsContext = createContext();

export const usePresetLists = () => useContext(PresetListsContext);

export const PresetListsProvider = ({ children }) => {
  const [presetLists, setPresetLists] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadPresetLists = async () => {
    setLoading(true);
    const data = await fetchPresetLists();
    setPresetLists(data);
    setLoading(false);
  };

  const getPresetListById = async (listId) => {
    return await fetchPresetListById(listId);
  };

  useEffect(() => {
    loadPresetLists();
  }, []);

  return (
    <PresetListsContext.Provider value={{ presetLists, loading, reload: loadPresetLists, getPresetListById }}>
      {children}
    </PresetListsContext.Provider>
  );
};
