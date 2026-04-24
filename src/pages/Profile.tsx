import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  User as UserIcon, 
  Mail, 
  Camera, 
  Save, 
  Shield, 
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [photoURL, setPhotoURL] = useState(profile?.photoURL || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setIsSubmitting(true);
    
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        displayName,
        photoURL
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-3 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-all active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">Profil Saya</h2>
          <p className="text-gray-500 font-medium text-sm uppercase tracking-widest">Kelola identitas dan akun Anda</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="p-8 md:p-12 space-y-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-gray-50 shadow-2xl transition-transform group-hover:scale-105 duration-500">
                <img 
                  src={photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`} 
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-blue-600 p-3 rounded-2xl text-white shadow-xl shadow-blue-100 cursor-pointer hover:bg-blue-700 transition-colors">
                <Camera className="w-5 h-5" />
              </div>
            </div>
            <p className="mt-6 text-xs font-black text-gray-400 uppercase tracking-widest">Foto Profil Anda</p>
          </div>

          <form onSubmit={handleUpdate} className="grid grid-cols-1 gap-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Nama Lengkap</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-gray-50 border-none pl-12 pr-4 py-4 rounded-[1.5rem] text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                    placeholder="Masukkan nama Anda"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Alamat Email (Tetap)</label>
                <div className="relative opacity-60">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="email" 
                    readOnly
                    value={profile?.email}
                    className="w-full bg-gray-100 border-none pl-12 pr-4 py-4 rounded-[1.5rem] text-sm font-bold text-gray-400 outline-none cursor-not-allowed" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">URL Foto Profil</label>
                <input 
                  type="text" 
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className="w-full bg-gray-50 border-none px-6 py-4 rounded-[1.5rem] text-xs font-medium text-gray-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                  placeholder="https://example.com/foto.jpg"
                />
              </div>

              <div className="p-6 bg-blue-50/50 rounded-[2rem] border border-blue-50 flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-2xl text-white">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Peran Akun</p>
                  <p className="text-sm font-bold text-blue-700 capitalize">{profile?.role}</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-sm uppercase tracking-widest py-5 rounded-[2rem] shadow-2xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-3 group"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-900 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-emerald-100"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Profil berhasil diperbarui!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
