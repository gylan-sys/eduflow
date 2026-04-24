import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { UserProfile, UserRole, BusinessLine } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  activeBusinessLine: BusinessLine;
  setActiveBusinessLine: (line: BusinessLine) => void;
  error: string | null;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBusinessLine, setActiveBusinessLine] = useState<BusinessLine>('both');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setError(null);
      setUser(user);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
      }

      if (user) {
        // Real-time profile listener
        unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), async (profileDoc) => {
          if (profileDoc.exists()) {
            const data = profileDoc.data() as UserProfile;
            setProfile(data);
            if (data.businessLine) setActiveBusinessLine(data.businessLine);
            setLoading(false);
          } else {
            // Check if it's the master admin email first
            const isAdminEmail = user.email === 'gkrismantara@gmail.com' || user.email === 'admin@eduflow.com';
            if (isAdminEmail) {
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || 'Admin',
                role: 'admin',
                businessLine: 'both',
              };
              await setDoc(doc(db, 'users', user.uid), newProfile);
              // Profile state will be updated by the listener
            } else {
              // Sign out and show error for unknown users
              await signOut(auth);
              setError("Akun Anda belum terdaftar. Silakan hubungi Admin untuk dibuatkan akun.");
              setLoading(false);
            }
          }
        }, (err) => {
          console.error("Profile internal error:", err);
          setError("Gagal memuat profil: " + err.message);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async () => {
    try {
      setError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/popup-blocked') {
        setError("Popup masuk diblokir. Harap buka aplikasi di tab baru atau izinkan popup.");
      } else {
        setError("Gagal masuk: " + (err.message || "Kesalahan tidak diketahui"));
      }
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error("Login email error:", err);
      if (err.code === 'auth/user-not-found') setError("Pengguna tidak ditemukan.");
      else if (err.code === 'auth/wrong-password') setError("Kata sandi salah.");
      else setError("Gagal masuk: " + err.message);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, activeBusinessLine, setActiveBusinessLine, error, login, loginWithEmail, logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
