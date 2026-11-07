import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInAnonymously,
  linkWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../services/firebase';
import { FirestoreService } from '../services/firestoreService';
import { AuthSessionRepository } from '../services/repositories';
import { AuthUser, UserRole } from '../types';

interface AuthContextType {
  currentUser: AuthUser | null;
  isAdmin: boolean;
  isVisitor: boolean;
  isGuest: boolean;
  isAnonymous: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOfflineSession: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  continueAsVisitor: () => void;
  upgradeGuestWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  syncRoleFromFirebase: () => Promise<void>;
  setRoleForTesting: (role: UserRole) => void;
  authError: string | null;
  clearAuthError: () => void;
}

const GUEST_VISITOR: AuthUser = {
  uid: 'guest_visitor',
  email: '',
  displayName: 'Guest Visitor',
  role: 'guest',
  isAnonymous: true,
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOfflineSession, setIsOfflineSession] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = () => setAuthError(null);

  // 1. Initial Load: Restore Offline Session immediately from SQLite / Local Session
  useEffect(() => {
    let mounted = true;

    async function restoreSession() {
      try {
        const session = await AuthSessionRepository.getActiveSession();
        if (session && session.isAuthenticated && mounted) {
          const user: AuthUser = {
            uid: session.uid,
            email: session.email,
            displayName: session.displayName,
            photoURL: session.photoUrl,
            role: session.role,
            isAnonymous: session.role === 'guest' || session.isAnonymous,
          };
          setCurrentUser(user);
          setIsOfflineSession(typeof navigator !== 'undefined' ? !navigator.onLine : false);
        }
      } catch (err) {
        console.warn('Could not restore offline session:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    restoreSession();

    return () => {
      mounted = false;
    };
  }, []);

  // 2. Firebase Auth State Listener (Background Token & Role Verification when Online)
  useEffect(() => {
    if (!isFirebaseConfigured() || !auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        try {
          // If Firebase reports an anonymous session:
          if (fbUser.isAnonymous) {
            const guestUser: AuthUser = {
              uid: fbUser.uid,
              email: '',
              displayName: 'Guest Visitor',
              role: 'guest',
              isAnonymous: true,
            };

            setCurrentUser(guestUser);
            setIsOfflineSession(false);
            const token = await fbUser.getIdToken(false);
            await AuthSessionRepository.saveSession(guestUser, token);
            return;
          }

          // Online non-anonymous: fetch fresh role from Firestore doc 'users/{uid}'
          const profile = await FirestoreService.getUserProfile(fbUser.uid);
          const resolvedRole: UserRole = profile?.role === 'admin' ? 'admin' : 'visitor';

          const refreshedUser: AuthUser = {
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || profile?.displayName || fbUser.email?.split('@')[0] || 'Member',
            photoURL: fbUser.photoURL || profile?.photoURL,
            role: resolvedRole,
            isAnonymous: false,
          };

          setCurrentUser(refreshedUser);
          setIsOfflineSession(false);

          // Persist verified session locally for future offline launches
          await AuthSessionRepository.saveSession(refreshedUser, await fbUser.getIdToken(false));
        } catch (err) {
          console.warn('Network issue while verifying online Firebase session. Retaining local session:', err);
        }
      } else {
        // If online and Firebase explicitly reports null user, clear the session
        // unless user is explicitly testing locally
        if (typeof navigator !== 'undefined' && navigator.onLine) {
          setCurrentUser((prev) => {
            if (prev?.uid === 'guest_visitor' || prev?.uid?.startsWith('demo_')) return prev;
            AuthSessionRepository.clearSession();
            return null;
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Option 1: Continue as Guest (Firebase Anonymous Authentication)
   */
  const continueAsGuest = async (): Promise<void> => {
    clearAuthError();
    setIsLoading(true);

    try {
      if (isFirebaseConfigured() && auth) {
        // Reuse existing anonymous session if already present
        let fbUser = auth.currentUser;
        if (!fbUser || !fbUser.isAnonymous) {
          const cred = await signInAnonymously(auth);
          fbUser = cred.user;
        }

        const guestUser: AuthUser = {
          uid: fbUser.uid,
          email: '',
          displayName: 'Guest Visitor',
          role: 'guest',
          isAnonymous: true,
        };

        setCurrentUser(guestUser);
        setIsOfflineSession(false);
        const token = await fbUser.getIdToken();
        await AuthSessionRepository.saveSession(guestUser, token);
      } else {
        // Local / Offline demo mode
        const offlineGuest: AuthUser = {
          uid: `anon_guest_${Date.now()}`,
          email: '',
          displayName: 'Guest Visitor',
          role: 'guest',
          isAnonymous: true,
        };
        setCurrentUser(offlineGuest);
        setIsOfflineSession(true);
        await AuthSessionRepository.saveSession(offlineGuest, 'anon_token');
      }
    } catch (err: any) {
      console.error('Guest authentication error:', err);
      let msg = err.message || 'Failed to authenticate in Guest Mode.';
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Anonymous authentication is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.';
      }
      setAuthError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Backward-compatible alias for continueAsGuest
   */
  const continueAsVisitor = () => {
    continueAsGuest().catch(() => {
      // Fallback local visitor
      setCurrentUser(GUEST_VISITOR);
      AuthSessionRepository.saveSession(GUEST_VISITOR, 'guest_token');
    });
  };

  /**
   * Option 2: Sign in / Sign up with Google
   */
  const loginWithGoogle = async (): Promise<void> => {
    clearAuthError();
    setIsLoading(true);

    try {
      if (isFirebaseConfigured() && auth && googleProvider) {
        const result = await signInWithPopup(auth, googleProvider);
        const fbUser = result.user;

        let profile = await FirestoreService.getUserProfile(fbUser.uid);
        if (!profile) {
          profile = await FirestoreService.saveUserProfile({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Authorized Member',
            photoURL: fbUser.photoURL || '',
            role: 'visitor',
          });
        }

        const role: UserRole = profile.role === 'admin' ? 'admin' : 'visitor';
        const userObj: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: profile.displayName || fbUser.displayName || 'Google User',
          photoURL: fbUser.photoURL || undefined,
          role,
          isAnonymous: false,
        };

        setCurrentUser(userObj);
        setIsOfflineSession(false);
        await AuthSessionRepository.saveSession(userObj, await fbUser.getIdToken());
      } else {
        const demoGoogleUser: AuthUser = {
          uid: `google_demo_${Date.now()}`,
          email: 'user@gmail.com',
          displayName: 'Google Member',
          role: 'visitor',
          isAnonymous: false,
        };
        setCurrentUser(demoGoogleUser);
        setIsOfflineSession(true);
        await AuthSessionRepository.saveSession(demoGoogleUser, 'demo_offline_token');
      }
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      let message = err.message || 'Google sign-in was cancelled or failed.';
      if (err.code === 'auth/popup-closed-by-user') {
        message = 'Google sign-in window was closed.';
      }
      setAuthError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Upgrade Guest Account to Google Account via Firebase Account Linking
   */
  const upgradeGuestWithGoogle = async (): Promise<void> => {
    clearAuthError();
    setIsLoading(true);

    try {
      if (isFirebaseConfigured() && auth && googleProvider) {
        if (!auth.currentUser || !auth.currentUser.isAnonymous) {
          // If not currently an anonymous user, proceed with standard Google login
          await loginWithGoogle();
          return;
        }

        let fbUser: FirebaseUser;
        try {
          // 1. Link anonymous user credentials to Google provider
          const linkResult = await linkWithPopup(auth.currentUser, googleProvider);
          fbUser = linkResult.user;
        } catch (linkErr: any) {
          if (linkErr.code === 'auth/credential-already-in-use') {
            // Google account is already registered to another user; sign in directly with that account
            const credResult = await signInWithPopup(auth, googleProvider);
            fbUser = credResult.user;
          } else {
            throw linkErr;
          }
        }

        let profile = await FirestoreService.getUserProfile(fbUser.uid);
        if (!profile) {
          profile = await FirestoreService.saveUserProfile({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Authorized Member',
            photoURL: fbUser.photoURL || '',
            role: 'visitor',
          });
        }

        const role: UserRole = profile.role === 'admin' ? 'admin' : 'visitor';
        const upgradedUser: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: profile.displayName || fbUser.displayName || 'Google Member',
          photoURL: fbUser.photoURL || undefined,
          role,
          isAnonymous: false,
        };

        setCurrentUser(upgradedUser);
        setIsOfflineSession(false);
        await AuthSessionRepository.saveSession(upgradedUser, await fbUser.getIdToken());
      } else {
        // Demo fallback
        const upgradedDemo: AuthUser = {
          uid: currentUser?.uid || `upgraded_${Date.now()}`,
          email: 'member@gmail.com',
          displayName: 'Google Member (Upgraded)',
          role: 'visitor',
          isAnonymous: false,
        };
        setCurrentUser(upgradedDemo);
        setIsOfflineSession(true);
        await AuthSessionRepository.saveSession(upgradedDemo, 'upgraded_token');
      }
    } catch (err: any) {
      console.error('Account upgrade error:', err);
      let msg = err.message || 'Failed to upgrade to Google account.';
      if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Google account selection window was closed.';
      }
      setAuthError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Log in with Email and Password
   */
  const loginWithEmail = async (email: string, password: string): Promise<void> => {
    clearAuthError();
    setIsLoading(true);

    try {
      if (isFirebaseConfigured() && auth) {
        const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = credential.user;

        let profile = await FirestoreService.getUserProfile(fbUser.uid);
        if (!profile) {
          profile = await FirestoreService.saveUserProfile({
            uid: fbUser.uid,
            email: fbUser.email || email,
            displayName: fbUser.displayName || email.split('@')[0],
            role: 'visitor',
          });
        }

        const role: UserRole = profile.role === 'admin' ? 'admin' : 'visitor';
        const userObj: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email || email,
          displayName: profile.displayName || fbUser.displayName || email.split('@')[0],
          photoURL: fbUser.photoURL || undefined,
          role,
          isAnonymous: false,
        };

        setCurrentUser(userObj);
        setIsOfflineSession(false);
        await AuthSessionRepository.saveSession(userObj, await fbUser.getIdToken());
      } else {
        const role: UserRole = email.toLowerCase().includes('admin') ? 'admin' : 'visitor';
        const demoUser: AuthUser = {
          uid: `demo_${Date.now()}`,
          email,
          displayName: role === 'admin' ? 'Abdur Rahman Khan (Admin)' : 'Authorized Member',
          role,
          isAnonymous: false,
        };
        setCurrentUser(demoUser);
        setIsOfflineSession(true);
        await AuthSessionRepository.saveSession(demoUser, 'demo_offline_token');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      let message = err.message || 'Login failed. Please verify your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        message = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Please provide a valid email address.';
      }
      setAuthError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Sign up with Email and Password
   */
  const signupWithEmail = async (email: string, password: string): Promise<void> => {
    clearAuthError();
    setIsLoading(true);

    try {
      if (isFirebaseConfigured() && auth) {
        const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const fbUser = credential.user;

        const profile = await FirestoreService.saveUserProfile({
          uid: fbUser.uid,
          email: fbUser.email || email,
          displayName: email.split('@')[0],
          role: 'visitor',
        });

        const userObj: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email || email,
          displayName: profile.displayName,
          role: 'visitor',
          isAnonymous: false,
        };

        setCurrentUser(userObj);
        setIsOfflineSession(false);
        await AuthSessionRepository.saveSession(userObj, await fbUser.getIdToken());
      } else {
        const demoUser: AuthUser = {
          uid: `demo_user_${Date.now()}`,
          email,
          displayName: email.split('@')[0] || 'Visitor',
          role: 'visitor',
          isAnonymous: false,
        };
        setCurrentUser(demoUser);
        setIsOfflineSession(true);
        await AuthSessionRepository.saveSession(demoUser, 'demo_offline_token');
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      let message = err.message || 'Registration failed.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'An account already exists with this email address. Please log in.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password must be at least 6 characters.';
      }
      setAuthError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user and return directly to Login page
   */
  const logout = async (): Promise<void> => {
    try {
      if (isFirebaseConfigured() && auth) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      await AuthSessionRepository.clearSession();
      setCurrentUser(null);
      setIsOfflineSession(false);
      clearAuthError();
    }
  };

  /**
   * Refresh role directly from Firestore when online
   */
  const syncRoleFromFirebase = async (): Promise<void> => {
    if (!currentUser || currentUser.role === 'guest') return;

    try {
      const profile = await FirestoreService.getUserProfile(currentUser.uid);
      if (profile) {
        const updatedUser: AuthUser = { ...currentUser, role: profile.role };
        setCurrentUser(updatedUser);
        await AuthSessionRepository.saveSession(updatedUser);
      }
    } catch (err) {
      console.error('Failed to sync role from Firebase:', err);
    }
  };

  /**
   * Quick helper for testing role transitions
   */
  const setRoleForTesting = (role: UserRole) => {
    const isAnon = role === 'guest';
    const updated: AuthUser = currentUser
      ? {
          ...currentUser,
          role,
          isAnonymous: isAnon,
          displayName: role === 'admin' ? 'Abdur Rahman Khan (Admin)' : (role === 'guest' ? 'Guest Visitor' : 'Authorized Member'),
        }
      : {
          uid: `test_${role}`,
          email: role === 'admin' ? 'admin@masjidmehmoodiya.org' : (role === 'visitor' ? 'visitor@masjidmehmoodiya.org' : ''),
          displayName: role === 'admin' ? 'Abdur Rahman Khan (Admin)' : (role === 'guest' ? 'Guest Visitor' : 'Authorized Member'),
          role,
          isAnonymous: isAnon,
        };

    setCurrentUser(updated);
    AuthSessionRepository.saveSession(updated);
  };

  const isAdmin = currentUser?.role === 'admin';
  const isGuest = currentUser?.role === 'guest';
  const isVisitor = currentUser?.role === 'visitor';
  const isAnonymous = Boolean(currentUser?.isAnonymous || currentUser?.role === 'guest');
  const isAuthenticated = Boolean(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAdmin,
        isVisitor,
        isGuest,
        isAnonymous,
        isAuthenticated,
        isLoading,
        isOfflineSession,
        loginWithEmail,
        signupWithEmail,
        loginWithGoogle,
        continueAsGuest,
        continueAsVisitor,
        upgradeGuestWithGoogle,
        logout,
        syncRoleFromFirebase,
        setRoleForTesting,
        authError,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
