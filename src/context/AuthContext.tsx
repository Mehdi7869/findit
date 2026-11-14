import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../firebase/client';
import { upsertUserProfiles } from '../services/finditApi';
import { UserPrivateInfo, UserPublicProfile, UserRole } from '../types/findit';

interface RegisterParams {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  department: string;
  phone: string;
  campusId: string;
}

interface AuthContextValue {
  user: User | null;
  publicProfile: UserPublicProfile | null;
  privateInfo: UserPrivateInfo | null;
  isAdmin: boolean;
  authReady: boolean;
  registerWithEmail: (params: RegisterParams) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (defaultRole?: UserRole) => Promise<void>;
  sendResetEmail: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshVerification: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfileDetails: (params: {
    displayName: string;
    department: string;
    phone: string;
    campusId: string;
    photoURL: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [publicProfile, setPublicProfile] = useState<UserPublicProfile | null>(null);
  const [privateInfo, setPrivateInfo] = useState<UserPrivateInfo | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let unsubPublic: (() => void) | null = null;
    let unsubPrivate: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (unsubPublic) unsubPublic();
      if (unsubPrivate) unsubPrivate();
      unsubPublic = null;
      unsubPrivate = null;

      setUser(firebaseUser);

      if (!firebaseUser) {
        setPublicProfile(null);
        setPrivateInfo(null);
        setIsAdmin(false);
        setAuthReady(true);
        return;
      }

      // Check admin status from admins/{uid} or verified bootstrapped admin email
      try {
        const adminSnap = await getDoc(doc(db, 'admins', firebaseUser.uid));
        const isBootstrapped =
          firebaseUser.emailVerified && firebaseUser.email === 'mehndihussain28@gmail.com';
        setIsAdmin(adminSnap.exists() || isBootstrapped);
      } catch {
        setIsAdmin(
          Boolean(firebaseUser.emailVerified && firebaseUser.email === 'mehndihussain28@gmail.com')
        );
      }

      // Attach real-time listeners for user's own public & private profiles
      unsubPublic = onSnapshot(
        doc(db, 'users', firebaseUser.uid),
        (snap) => {
          setPublicProfile(snap.exists() ? (snap.data() as UserPublicProfile) : null);
          setAuthReady(true);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      );

      unsubPrivate = onSnapshot(
        doc(db, 'users', firebaseUser.uid, 'private', 'info'),
        (snap) => {
          setPrivateInfo(snap.exists() ? (snap.data() as UserPrivateInfo) : null);
        },
        (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}/private/info`);
        }
      );
    });

    return () => {
      unsubAuth();
      if (unsubPublic) unsubPublic();
      if (unsubPrivate) unsubPrivate();
    };
  }, []);

  const registerWithEmail = async (params: RegisterParams) => {
    const cred = await createUserWithEmailAndPassword(auth, params.email, params.password);
    await updateProfile(cred.user, { displayName: params.displayName.trim() });
    await upsertUserProfiles({
      uid: cred.user.uid,
      displayName: params.displayName,
      role: params.role,
      department: params.department,
      photoURL: '',
      email: params.email,
      phone: params.phone,
      campusId: params.campusId,
      isNewUser: true,
    });
    await sendEmailVerification(cred.user);
  };

  const loginWithEmail = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Ensure profile exists if user was created outside standard flow
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists()) {
      await upsertUserProfiles({
        uid: cred.user.uid,
        displayName: cred.user.displayName || email.split('@')[0],
        role: 'student',
        department: 'General Studies',
        photoURL: cred.user.photoURL || '',
        email: cred.user.email || email,
        phone: '',
        campusId: '',
        isNewUser: true,
      });
    }
  };

  const loginWithGoogle = async (defaultRole: UserRole = 'student') => {
    const cred = await signInWithPopup(auth, googleProvider);
    const snap = await getDoc(doc(db, 'users', cred.user.uid));
    if (!snap.exists()) {
      await upsertUserProfiles({
        uid: cred.user.uid,
        displayName: cred.user.displayName || 'Campus User',
        role: defaultRole,
        department: 'General Studies',
        photoURL: cred.user.photoURL || '',
        email: cred.user.email || '',
        phone: '',
        campusId: '',
        isNewUser: true,
      });
    }
  };

  const sendResetEmail = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No signed-in user.');
    await sendEmailVerification(auth.currentUser);
  };

  const refreshVerification = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    setUser(auth.currentUser ? { ...auth.currentUser } : null);
    const verified = Boolean(auth.currentUser?.emailVerified);
    if (verified && auth.currentUser?.email === 'mehndihussain28@gmail.com') {
      setIsAdmin(true);
    }
    return verified;
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfileDetails = async (params: {
    displayName: string;
    department: string;
    phone: string;
    campusId: string;
    photoURL: string;
  }) => {
    if (!auth.currentUser || !publicProfile) throw new Error('Profile not loaded.');
    await updateProfile(auth.currentUser, {
      displayName: params.displayName.trim(),
      photoURL: params.photoURL || null,
    });
    await upsertUserProfiles({
      uid: auth.currentUser.uid,
      displayName: params.displayName,
      role: publicProfile.role,
      department: params.department,
      photoURL: params.photoURL,
      email: auth.currentUser.email || privateInfo?.email || '',
      phone: params.phone,
      campusId: params.campusId,
      isNewUser: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        publicProfile,
        privateInfo,
        isAdmin,
        authReady,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        sendResetEmail,
        resendVerificationEmail,
        refreshVerification,
        logout,
        updateProfileDetails,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
