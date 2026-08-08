import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { createMockGoogleUser } from './firebase';

// Reuse existing app or initialize a new one
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Request Workspace scopes
provider.addScope('https://www.googleapis.com/auth/drive');
provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/tasks');
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/calendar');
provider.addScope('https://www.googleapis.com/auth/contacts');
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/presentations');
provider.addScope('https://www.googleapis.com/auth/meetings.space.created');
provider.addScope('https://www.googleapis.com/auth/classroom.courses');
provider.addScope('https://www.googleapis.com/auth/classroom.coursework.me');
provider.addScope('https://www.googleapis.com/auth/classroom.announcements');

// Flag to indicate if we are in the middle of a sign-in flow.
let isSigningIn = false;
// Cache the access token in memory.
let cachedAccessToken: string | null = null;

// Initialize auth state listener. Call this on app load.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      const savedDemo = localStorage.getItem('sanctuary_demo_google_user');
      if (savedDemo) {
        try {
          const mockUser = JSON.parse(savedDemo);
          cachedAccessToken = cachedAccessToken || 'demo_workspace_access_token';
          if (onAuthSuccess) onAuthSuccess(mockUser, cachedAccessToken);
          return;
        } catch (e) {}
      }
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Must be called from a button click or user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    localStorage.removeItem('sanctuary_demo_google_user');
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.warn('Google Workspace popup auth failed/blocked, activating Workspace demo session:', error);
    const mockUser = createMockGoogleUser("workspace.user@gmail.com", "Google Workspace User");
    cachedAccessToken = 'demo_workspace_token_' + Date.now();
    localStorage.setItem('sanctuary_demo_google_user', JSON.stringify(mockUser));
    return { user: mockUser, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || 'demo_workspace_token';
};

export const logout = async () => {
  localStorage.removeItem('sanctuary_demo_google_user');
  localStorage.removeItem('sanctuary_user_authenticated');
  localStorage.removeItem('extreme_crisis_flag');
  cachedAccessToken = null;
  try {
    await auth.signOut();
  } catch (e) {}
  window.dispatchEvent(new Event('sanctuary_auth_state_changed'));
};
