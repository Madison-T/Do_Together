// services/profileService.js

// Import Firestore from your existing firebaseConfig (ES module stays untouched).
// Jest will mock this file during testing, so this import won’t break your tests.
const { firestore } = require('../firebaseConfig');
const { doc, updateDoc } = require('firebase/firestore');

/**
 * uploadProfilePicture:
 *   – userId: string (the authenticated user’s UID)
 *   – uri:    string (local file/URI, e.g. “file://…/photo.jpg”)
 *
 * Returns a Promise that resolves with the new Cloudinary secure_url,
 * or rejects with an Error if anything goes wrong.
 */
async function uploadProfilePicture(userId, uri) {
  // 1) Validate arguments
  if (!userId || !uri) {
    throw new Error('Missing arguments: userId and uri are required');
  }

  // 2) Build the FormData for Cloudinary
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: `${userId}_profile.jpg`,
  });
  formData.append('upload_preset', 'dotogether_preset');
  formData.append('cloud_name', 'dpdgsaq56');

  // 3) POST to Cloudinary’s upload endpoint
  const response = await fetch(
    'https://api.cloudinary.com/v1_1/dpdgsaq56/image/upload',
    {
      method: 'POST',
      body: formData,
    }
  );

  // 4) Parse the JSON response
  const data = await response.json();

  // 5) If no secure_url, throw an error
  if (!data.secure_url) {
    throw new Error('Cloudinary upload failed');
  }

  const newPhotoURL = data.secure_url;

  // 6) Update Firestore user document at "Users/<userId>"
  const userRef = doc(firestore, 'Users', userId);
  await updateDoc(userRef, { photoURL: newPhotoURL });

  // 7) Return the new secure_url
  return newPhotoURL;
}

module.exports = { uploadProfilePicture };
