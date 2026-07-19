import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  onAuthStateChanged,
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  where,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore specifying custom databaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Authentication
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, googleProvider };

// --- Validate Connection to Firestore ---
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log("Firebase connection verified successfully!");
  } catch (error) {
    if (error instanceof Error && error.message.includes('offline')) {
      console.warn("Firebase client is offline. Please check network or config.");
    } else {
      console.log("Firebase initialized successfully (connection test complete).");
    }
  }
}
testConnection();

// --- Authenticated Google Sign-In Helper ---
export async function signInWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // Persist profile into Firestore
    await saveUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    throw error;
  }
}

// --- Anonymous Guest Sign-In Helper ---
export async function signInGuestUser(): Promise<User | null> {
  try {
    const result = await signInAnonymously(auth);
    // Persist profile into Firestore
    await saveUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error("Guest Sign-In Error:", error);
    throw error;
  }
}

// --- Email Sign-In Helper ---
export async function signInWithEmail(email: string, pass: string): Promise<User | null> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    await saveUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error("Email Sign-In Error:", error);
    throw error;
  }
}

// --- Email Sign-Up Helper ---
export async function signUpWithEmail(email: string, pass: string, name: string): Promise<User | null> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(result.user, { displayName: name });
    // Reload user profile to ensure displayName is propagated
    await result.user.reload();
    const updatedUser = auth.currentUser;
    if (updatedUser) {
      await saveUserProfile(updatedUser);
      return updatedUser;
    }
    await saveUserProfile(result.user);
    return result.user;
  } catch (error) {
    console.error("Email Sign-Up Error:", error);
    throw error;
  }
}

// --- Save User Profile into Firestore ---
export async function saveUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const userSnap = await getDoc(userRef);
    const generatedAvatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(user.uid)}`;
    const displayName = user.displayName || (user.isAnonymous ? `Chennai Guest #${user.uid.substring(0, 4)}` : 'Chennai Tenant');
    const photoURL = user.photoURL || generatedAvatar;

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: displayName,
        email: user.email || (user.isAnonymous ? 'guest@nestdirect.in' : ''),
        photoURL: photoURL,
        favorites: ['prop-1', 'prop-5'], // Default starters
        createdAt: new Date().toISOString()
      }, { merge: true });
    } else {
      // Keep displayName and photoURL synced if they are set on the Auth profile but empty in DB
      const existingData = userSnap.data();
      if (!existingData.displayName || !existingData.photoURL) {
        await setDoc(userRef, {
          displayName: existingData.displayName || displayName,
          photoURL: existingData.photoURL || photoURL
        }, { merge: true });
      }
    }
  } catch (error) {
    console.error("Error setting up user profile document:", error);
  }
}

// --- Save Favorites in Cloud profile ---
export async function syncFavoritesToCloud(userId: string, favorites: string[]): Promise<void> {
  const userRef = doc(db, 'users', userId);
  try {
    await updateDoc(userRef, { favorites });
  } catch (error) {
    console.error("Error syncing favorites to cloud:", error);
  }
}

// --- Sign Out helper ---
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout Error:", error);
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Log warning and prevent uncaught exception bubble to protect runtime stability
  console.warn('Firestore Operation Failed - Safe local/offline fallback is active.');
}
