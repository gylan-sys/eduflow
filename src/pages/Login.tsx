import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, GraduationCap, X, Mail, Lock, User as UserIcon, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { AppSettings, UserProfile } from '../types';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

export const Login: React.FC = () => {
  const { login, loginWithEmail, error } = useAuth();
  const [mode, setMode] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appSettings, setAppSettings] = useState<AppSettings>({
    appName: 'EduFlow Manager',
    appLogoUrl: '',
    themeColor: '#2563EB'
  });
  const [showBootstrap, setShowBootstrap] = useState(false);

  useEffect(() => {
    // Hidden shortcut: Click the logo 5 times to show bootstrap
    let clicks = 0;
    const logo = document.getElementById('app-logo-container');
    if (logo) {
      const handler = () => {
        clicks++;
        if (clicks >= 5) setShowBootstrap(true);
      };
      logo.addEventListener('click', handler);
      return () => logo.removeEventListener('click', handler);
    }
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'app_settings'), (snap) => {
      if (snap.exists()) {
        setAppSettings(snap.data() as AppSettings);
      }
    });
    return unsub;
  }, []);

  const handleBootstrap = async () => {
    setIsSubmitting(true);
    try {
      // Use the email/pass requested by user
      const adminEmail = 'admin@eduflow.com';
      const adminPass = '$3cr3tadmin';
      
      let uid = '';
      try {
        const res = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
        uid = res.user.uid;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use' || authErr.code === 'auth/credential-already-in-use') {
          // If already in auth, we try to sign in to get the UID. 
          // If this fails with invalid-credential, it means the password in Auth doesn't match $3cr3tadmin.
          const signRes = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
          uid = signRes.user.uid;
        } else {
          throw authErr;
        }
      }

      const newProfile: UserProfile = {
        uid,
        email: adminEmail,
        displayName: 'Master Admin',
        role: 'admin',
        businessLine: 'both'
      };
      await setDoc(doc(db, 'users', uid), newProfile);
      alert("Master Admin siap! Silakan login dengan: " + adminEmail);
      setShowBootstrap(false);
    } catch (err: any) {
      console.error("Bootstrap error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        alert("Gagal: Email sudah terdaftar dengan password berbeda di sistem Firebase Auth. Silakan gunakan email lain atau hubungi developer.");
      } else {
        alert("Gagal bootstrap: " + err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (mode === 'email') {
      await loginWithEmail(email, password);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-8 md:p-10 border border-gray-100 flex flex-col items-center"
      >
        <div className="flex flex-col items-center mb-8">
          <div 
            id="app-logo-container"
            className={cn(
              "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-100 rotate-3 transform hover:rotate-0 transition-all duration-500 overflow-hidden cursor-pointer",
              !appSettings.appLogoUrl && "p-4"
            )}
            style={!appSettings.appLogoUrl ? { backgroundColor: appSettings.themeColor } : {}}
          >
            {appSettings.appLogoUrl ? (
              <img src={appSettings.appLogoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <GraduationCap className="w-12 h-12 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tighter text-center">{appSettings.appName}</h1>
          <p className="text-gray-500 mt-2 text-center text-sm font-medium">Sistem Manajemen Pendidikan & Les Renang</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
          >
            <div className="bg-red-500 rounded-full p-1 shrink-0">
               <X className="w-3 h-3 text-white" />
            </div>
            <p className="text-xs text-red-600 font-bold leading-tight">{error}</p>
          </motion.div>
        )}

        <div className="w-full space-y-4">
          {mode === 'google' ? (
            <div className="space-y-4">
              <button
                onClick={() => login()}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 hover:border-gray-900 text-gray-900 font-black text-sm uppercase tracking-widest py-4 px-4 rounded-2xl transition-all duration-300 shadow-sm active:scale-95 group"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Lanjutkan dengan Google
              </button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px bg-gray-100 flex-1"></div>
                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Atau</span>
                <div className="h-px bg-gray-100 flex-1"></div>
              </div>

              <button
                onClick={() => setMode('email')}
                className="w-full hover:bg-opacity-90 text-white font-black text-sm uppercase tracking-widest py-4 px-4 rounded-2xl transition-all duration-300 shadow-xl active:scale-95"
                style={{ backgroundColor: appSettings.themeColor, boxShadow: `0 20px 25px -5px ${appSettings.themeColor}33` }}
              >
                Gunakan Email & Password
              </button>
              
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                <p className="text-[10px] text-blue-700 leading-relaxed text-center font-black uppercase tracking-wider">
                  💡 Tips: Jika popup Google tidak muncul, coba buka lewat tab baru.
                </p>
              </div>
            </div>
          ) : (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleSubmit} 
              className="space-y-4 w-full"
            >
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  required 
                  placeholder="Email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 pl-11 pr-4 py-4 rounded-2xl text-sm font-bold placeholder:text-gray-300 outline-none transition-all"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  required 
                  placeholder="Password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border-none focus:ring-2 focus:ring-blue-500 pl-11 pr-4 py-4 rounded-2xl text-sm font-bold placeholder:text-gray-300 outline-none transition-all"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full hover:opacity-90 text-white font-black text-xs uppercase tracking-widest py-4 px-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 group"
                style={{ backgroundColor: appSettings.themeColor, boxShadow: `0 20px 25px -5px ${appSettings.themeColor}33` }}
              >
                {isSubmitting ? "Memproses..." : "Masuk"}
                {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
              </button>

              <div className="flex flex-col gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={() => setMode('google')}
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors"
                >
                  Masuk dengan Google
                </button>
              </div>
            </motion.form>
          )}
        </div>

        <p className="text-[10px] text-center text-gray-300 font-bold uppercase tracking-widest mt-12 mb-0">
          EduFlow v1.0 • 2026
        </p>
        {showBootstrap && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full mt-6 pt-6 border-t border-dashed border-gray-100"
          >
            <button 
              onClick={handleBootstrap}
              className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-2xl border border-red-100 hover:bg-red-100 transition-colors text-xs uppercase tracking-widest"
            >
              🚀 Bootstrap Master Admin
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};
