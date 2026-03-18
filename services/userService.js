// services/userService.js
import { auth, db, storage } from "../firebaseConfig";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  updateProfile as firebaseUpdateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword as firebaseUpdatePassword,
} from "firebase/auth";

/**
 * Upload a local image URI to Firebase Storage under userProfiles/{uid}/profile.jpg
 * Returns the public download URL.
 */
export async function uploadProfileImage(localUri) {
  if (!auth.currentUser) throw new Error("No authenticated user");
  const uid = auth.currentUser.uid;

  // fetch blob
  const response = await fetch(localUri);
  const blob = await response.blob();

  const storageRef = ref(storage, `userProfiles/${uid}/profile.jpg`);
  await uploadBytes(storageRef, blob);
  const url = await getDownloadURL(storageRef);
  return url;
}

/**
 * Update Firebase Auth profile & Firestore user doc with given fields
 * fields = { displayName?, photoURL?, ...customFields }
 */
export async function updateUserProfile(fields = {}) {
  if (!auth.currentUser) throw new Error("No authenticated user");
  // Update Firebase Auth (displayName / photoURL)
  const { displayName, photoURL, ...rest } = fields;
  if (displayName || photoURL) {
    await firebaseUpdateProfile(auth.currentUser, {
      ...(displayName ? { displayName } : {}),
      ...(photoURL ? { photoURL } : {}),
    });
  }

  // Save extra profile data in Firestore under 'users/{uid}'
  const uid = auth.currentUser.uid;
  const userDocRef = doc(db, "users", uid);
  const baseData = {
    uid,
    email: auth.currentUser.email || null,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(userDocRef, { ...baseData, ...(displayName ? { displayName } : {}), ...(photoURL ? { photoURL } : {}), ...rest }, { merge: true });

  // return the user doc as convenience
  const snapshot = await getDoc(userDocRef);
  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Reauthenticate then update password
 */
export async function reauthAndChangePassword(currentPassword, newPassword) {
  if (!auth.currentUser || !auth.currentUser.email) throw new Error("No authenticated user");
  const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
  await reauthenticateWithCredential(auth.currentUser, credential);
  await firebaseUpdatePassword(auth.currentUser, newPassword);
  return true;
}

/**
 * Fetch user doc by UID
 */
export async function fetchUserDoc(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}
