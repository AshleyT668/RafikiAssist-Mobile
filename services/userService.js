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

const USERS_COLLECTION = "users";
const USER_PROFILE_IMAGE_PATH = (uid, extension = "jpg") =>
  `userProfiles/${uid}/profile.${extension}`;

function getBlobFromUri(uri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function onLoad() {
      resolve(xhr.response);
    };
    xhr.onerror = function onError() {
      reject(new Error("Failed to read local image file"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
}

function getImageMetadata(file = {}) {
  const mimeType = file.mimeType || "image/jpeg";
  const extensionFromMime = mimeType.split("/")[1]?.toLowerCase();
  const extensionFromName = file.fileName?.split(".").pop()?.toLowerCase();
  const extension = extensionFromName || extensionFromMime || "jpg";

  return { mimeType, extension };
}

const buildUserProfileData = (user, fields = {}) => ({
  uid: user.uid,
  email: user.email || null,
  displayName: fields.displayName ?? user.displayName ?? "",
  photoURL: fields.photoURL ?? user.photoURL ?? null,
  emailVerified: user.emailVerified,
  providers: user.providerData?.map((provider) => provider.providerId) || [],
  updatedAt: new Date().toISOString(),
  ...fields,
});

export function getUserDocRef(uid = auth.currentUser?.uid) {
  if (!uid) throw new Error("No authenticated user");
  return doc(db, USERS_COLLECTION, uid);
}

export async function ensureUserProfile(user = auth.currentUser, fields = {}) {
  if (!user) throw new Error("No authenticated user");

  const userDocRef = getUserDocRef(user.uid);
  const snapshot = await getDoc(userDocRef);
  const now = new Date().toISOString();
  const existingData = snapshot.exists() ? snapshot.data() : {};

  const payload = {
    ...existingData,
    ...buildUserProfileData(user, fields),
    createdAt: existingData.createdAt || now,
    lastLoginAt: now,
  };

  await setDoc(userDocRef, payload, { merge: true });
  return payload;
}

export async function saveUserRole(role, user = auth.currentUser) {
  if (!user) throw new Error("No authenticated user");

  const normalizedRole = role === "child" ? "child" : "caregiver";
  return ensureUserProfile(user, { role: normalizedRole });
}

export async function getCurrentUserProfile() {
  if (!auth.currentUser) throw new Error("No authenticated user");

  const snapshot = await getDoc(getUserDocRef(auth.currentUser.uid));
  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Upload a local image URI to Firebase Storage under userProfiles/{uid}/profile.jpg
 * Returns the public download URL.
 */
export async function uploadProfileImage(file) {
  if (!auth.currentUser) throw new Error("No authenticated user");
  const uid = auth.currentUser.uid;
  const localUri = typeof file === "string" ? file : file?.uri;

  if (!localUri) {
    throw new Error("No image selected");
  }

  const { mimeType, extension } = getImageMetadata(
    typeof file === "string" ? {} : file
  );
  const blob = await getBlobFromUri(localUri);

  try {
    const storageRef = ref(storage, USER_PROFILE_IMAGE_PATH(uid, extension));
    await uploadBytes(storageRef, blob, { contentType: mimeType });
    const url = await getDownloadURL(storageRef);
    await ensureUserProfile(auth.currentUser, { photoURL: url });
    return url;
  } catch (error) {
    const details = error?.serverResponse || error?.message || "Unknown upload error";
    throw new Error(`Failed to upload image: ${details}`);
  } finally {
    if (blob?.close) {
      blob.close();
    }
  }
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

  return ensureUserProfile(auth.currentUser, {
    ...(displayName ? { displayName } : {}),
    ...(photoURL ? { photoURL } : {}),
    ...rest,
  });
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
  const snapshot = await getDoc(getUserDocRef(uid));
  return snapshot.exists() ? snapshot.data() : null;
}
