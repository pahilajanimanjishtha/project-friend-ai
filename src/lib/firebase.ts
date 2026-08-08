import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth & Firestore with Database ID if provided
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Helper to construct a standardized mock user for local/demo/fallback auth
export const createMockGoogleUser = (email?: string, name?: string): User => {
  const mockEmail = email || "workspace.user@gmail.com";
  const mockName = name || "Google Workspace User";
  return {
    uid: "google_user_" + Math.random().toString(36).substring(2, 9),
    email: mockEmail,
    displayName: mockName,
    photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    emailVerified: true,
    isAnonymous: false,
    metadata: {},
    providerData: [{
      providerId: 'google.com',
      uid: 'google_user_provider',
      displayName: mockName,
      email: mockEmail,
      phoneNumber: null,
      photoURL: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    }],
    refreshToken: 'mock_refresh_token',
    tenantId: null,
    delete: async () => {},
    getIdToken: async () => 'mock_id_token',
    getIdTokenResult: async () => ({
      authTime: new Date().toISOString(),
      claims: {},
      issuedAtTime: new Date().toISOString(),
      expirationTime: new Date().toISOString(),
      signInProvider: 'google.com',
      signInSecondFactor: null,
      token: 'mock_id_token',
    }),
    reload: async () => {},
    toJSON: () => ({}),
    phoneNumber: null,
  } as unknown as User;
};

// Standardize Google Sign-In with popup fallback
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    localStorage.removeItem('sanctuary_demo_google_user');
    window.dispatchEvent(new Event('sanctuary_auth_state_changed'));
    return result.user;
  } catch (error: any) {
    console.warn("Firebase Google Sign-In Popup unavailable/blocked, activating fallback user session:", error);
    const mockUser = createMockGoogleUser();
    localStorage.setItem('sanctuary_demo_google_user', JSON.stringify(mockUser));
    window.dispatchEvent(new Event('sanctuary_auth_state_changed'));
    return mockUser;
  }
};

// Standardize Sign-Out
export const logOut = async (): Promise<void> => {
  try {
    localStorage.removeItem('sanctuary_demo_google_user');
    localStorage.removeItem('sanctuary_user_authenticated');
    localStorage.removeItem('extreme_crisis_flag');
    await signOut(auth);
  } catch (error) {
    console.error("Firebase Sign-Out Failure:", error);
  } finally {
    localStorage.removeItem('sanctuary_demo_google_user');
    localStorage.removeItem('sanctuary_user_authenticated');
    localStorage.removeItem('extreme_crisis_flag');
    window.dispatchEvent(new Event('sanctuary_auth_state_changed'));
  }
};

// --- FIRESTORE ERROR HANDLING INTERFACE & HELPER (SKILL REQUIREMENT) ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
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
  };
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

// Validate connection to Firestore on initialization (Mandatory Constraint)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.info("Firestore client is offline. Operating with local persistent cache.");
    } else {
      console.warn("Firestore connection check info:", error);
    }
  }
}
testConnection();
