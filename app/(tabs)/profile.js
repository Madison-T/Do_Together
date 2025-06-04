// app/(tabs)/profile.js
import * as ImagePicker from 'expo-image-picker';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
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
import { auth, firestore } from '../../firebaseConfig'; // ✅ Correct path

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [photoURL, setPhotoURL] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userRef = doc(firestore, 'Users', currentUser.uid);
        try {
          const docSnap = await getDoc(userRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFirstName(data.firstName || '');
            setLastName(data.lastName || '');
            setDob(data.dob || '');
            setPhotoURL(data.photoURL || null);
          }
        } catch (err) {
          console.error('Error loading profile:', err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && user) {
      const imageUri = result.assets[0].uri;
      await uploadImage(imageUri);
    }
  };

  const uploadImage = async (uri) => {
  try {
    const formData = new FormData();

    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: `${user.uid}_profile.jpg`,
    });
    formData.append('upload_preset', 'dotogether_preset'); // your preset name
    formData.append('cloud_name', 'dpdgsaq56'); // your cloud name

    const response = await fetch('https://api.cloudinary.com/v1_1/dpdgsaq56/image/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.secure_url) {
      setPhotoURL(data.secure_url);
      const userRef = doc(firestore, 'Users', user.uid);
      await updateDoc(userRef, { photoURL: data.secure_url });
    } else {
      throw new Error('Cloudinary upload failed');
    }
  } catch (err) {
    console.error('Cloudinary upload failed:', err);
    Alert.alert('Upload Error', 'Could not upload photo.');
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
  onChangeText={(text) => {
    const numericText = text.replace(/[^\d]/g, '');

    let formatted = numericText;
    if (numericText.length > 2 && numericText.length <= 4)
      formatted = `${numericText.slice(0, 2)}/${numericText.slice(2)}`;
    else if (numericText.length > 4)
      formatted = `${numericText.slice(0, 2)}/${numericText.slice(2, 4)}/${numericText.slice(4, 8)}`;

    setDob(formatted);
  }}
  maxLength={10}
/>

      <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginTop: 40,
    alignItems: 'center',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 36,
    color: '#fff',
  },
  input: {
    width: '100%',
    borderBottomWidth: 1,
    borderColor: '#aaa',
    paddingVertical: 8,
    marginBottom: 20,
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007BFF',
    padding: 14,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

