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
  updateProfile
} from 'firebase/auth';
import { 
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
  where
} from 'firebase/firestore';

// Credentials derived directly from workspace secure configurations
const firebaseConfig = {
  apiKey: "AIzaSyAUoZ1tBGvgHfyw0yoxUPD1IyNFUZl6r4A",
  authDomain: "lunar-form-hk91c.firebaseapp.com",
  projectId: "lunar-form-hk91c",
  storageBucket: "lunar-form-hk91c.firebasestorage.app",
  messagingSenderId: "10249213938",
  appId: "1:10249213938:web:39a966a3241360bd8c3d6b"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore specifying custom databaseId
const db = initializeFirestore(app, {
  databaseId: "ai-studio-13e3d597-9bed-45a0-bcd2-ad330b9cc15b"
} as any);

// Initialize Authentication
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, db, auth, googleProvider };

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

// --- Save User Profile into Firestore ---
export async function saveUserProfile(user: User): Promise<void> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || 'Chennai Guest',
        email: user.email || '',
        photoURL: user.photoURL || '',
        favorites: ['prop-1', 'prop-5'], // Default starters
        createdAt: new Date().toISOString()
      }, { merge: true });
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
  throw new Error(JSON.stringify(errInfo));
}
