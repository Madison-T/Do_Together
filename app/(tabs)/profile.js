// app/(tabs)/profile.js
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, firestore } from '../../firebaseConfig'; // adjust if needed
import { uploadProfilePicture } from '../../services/profileService';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1) Subscribe to Auth so we know when user is ready
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (u) => {
      if (u) {
        setUser(u);
        // load from Firestore
        const userRef = doc(firestore, 'Users', u.uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setDob(data.dob || '');
          setPhotoURL(data.photoURL || null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // 2) Save profile fields
  const handleSave = async () => {
    if (!user) return;
    const userRef = doc(firestore, 'Users', user.uid);
    try {
      await setDoc(userRef, {
        firstName,
        lastName,
        dob,
        email: user.email,
        photoURL,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      Alert.alert('Success', 'Profile updated.');
    } catch (err) {
      console.error('Failed to save profile:', err);
      Alert.alert('Error', 'Could not save profile.');
    }
  };

  // 3) Pick & upload via our service
  const pickImage = async () => {
    if (!user) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setLoading(true);
    try {
      // uploadProfilePicture will:
      //  • POST to Cloudinary
      //  • update Firestore Users/<uid>.photoURL
      //  • return the new secure_url
      const newUrl = await uploadProfilePicture(user.uid, result.assets[0].uri);
      setPhotoURL(newUrl);
    } catch (err) {
      console.error('Image upload failed:', err);
      Alert.alert('Error', 'Failed to upload image.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={pickImage}>
        {photoURL ? (
          <Image source={{ uri: photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>+</Text>
          </View>
        )}
      </TouchableOpacity>

      <TextInput
        placeholder="First Name"
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        placeholder="Last Name"
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        placeholder="Date of Birth (dd/mm/yyyy)"
        style={styles.input}
        value={dob}
        keyboardType="numeric"
        maxLength={10}
        onChangeText={(text) => {
          const num = text.replace(/[^\d]/g, '');
          let fmt = num;
          if (num.length > 2 && num.length <= 4)
            fmt = `${num.slice(0, 2)}/${num.slice(2)}`;
          else if (num.length > 4)
            fmt = `${num.slice(0, 2)}/${num.slice(2, 4)}/${num.slice(4, 8)}`;
          setDob(fmt);
        }}
      />

      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, marginTop: 40, alignItems: 'center' },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 20 },
  avatarPlaceholder: {
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: '#ccc', justifyContent: 'center',
    alignItems: 'center', marginBottom: 20,
  },
  avatarText: { fontSize: 36, color: '#fff' },
  input: {
    width: '100%', borderBottomWidth: 1, borderColor: '#aaa',
    paddingVertical: 8, marginBottom: 20, fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007BFF', padding: 14, borderRadius: 10,
    width: '100%', alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: 'bold' },
});
