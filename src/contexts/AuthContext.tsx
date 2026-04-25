import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile, BusinessLine } from '../types';

interface AuthContextType {
  user: any | null; // Simpler for local auth
  profile: UserProfile | null;
  loading: boolean;
  activeBusinessLine: BusinessLine;
  setActiveBusinessLine: (line: BusinessLine) => void;
  error: string | null;
  login: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBusinessLine, setActiveBusinessLine] = useState<BusinessLine>('both');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('adiba_token');
      const savedUser = localStorage.getItem('adiba_user');
      
      if (token && savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setProfile(userData);
          if (userData.businessLine) setActiveBusinessLine(userData.businessLine);
          
          // Verify token with backend
          const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!res.ok) {
            throw new Error("Session invalid");
          }
          
          const freshUser = await res.json();
          setUser(freshUser);
          setProfile(freshUser);
          localStorage.setItem('adiba_user', JSON.stringify(freshUser));
        } catch (err) {
          console.error("Auth check failed:", err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('adiba_token', data.token);
        localStorage.setItem('adiba_user', JSON.stringify(data.user));
        setUser(data.user);
        setProfile(data.user);
        if (data.user.businessLine) setActiveBusinessLine(data.user.businessLine);
      } else {
        throw new Error(data.error || "Gagal masuk");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      let msg = err.message || "Gagal masuk. Periksa email dan password.";
      if (msg.includes('User not found')) msg = "User tidak ditemukan";
      if (msg.includes('Invalid password')) msg = "Password salah";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    // Standard login removed, only email/pass allowed for now as requested
    setError("Fitur login Google dinonaktifkan. Silakan gunakan email/password.");
  };

  const logout = () => {
    localStorage.removeItem('adiba_token');
    localStorage.removeItem('adiba_user');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      profile, 
      loading, 
      activeBusinessLine, 
      setActiveBusinessLine, 
      error, 
      login, 
      loginWithEmail, 
      logout 
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
