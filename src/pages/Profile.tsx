import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  UserCircle, Mail, Shield, Briefcase, Waves, User as UserIcon, LogOut, 
  Settings, Camera, Phone, MapPin, GraduationCap, BookOpen, Save, X, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { translations } from '../constants/translations';
import { fetchApi } from '../lib/api';
import { validatePhone, isDateInPast } from '../lib/validation';

export const Profile: React.FC = () => {
  const { profile, logout, refreshProfile } = useAuth();
  const { settings } = useSettings();
  const lang = settings.language || 'id';
  const t = translations[lang];

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    photoURL: profile?.photoURL || '',
    phoneNumber: profile?.phoneNumber || '',
    address: profile?.address || '',
    gender: profile?.gender || 'L',
    specialization: profile?.specialization || '',
    education: profile?.education || '',
    birthDate: profile?.birthDate || '',
    birthPlace: profile?.birthPlace || '',
    password: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        photoURL: profile.photoURL || '',
        phoneNumber: profile.phoneNumber || '',
        address: profile.address || '',
        gender: profile.gender || 'L',
        specialization: profile.specialization || '',
        education: profile.education || '',
        birthDate: profile.birthDate || '',
        birthPlace: profile.birthPlace || '',
        password: ''
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (formData.phoneNumber && !validatePhone(formData.phoneNumber)) {
      setError("Format nomor telepon tidak valid. Gunakan format 08..., 62..., atau +62...");
      return;
    }
    if (formData.birthDate && !isDateInPast(formData.birthDate)) {
      setError("Tanggal lahir tidak boleh di masa depan");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      ...formData,
      photoUrl: formData.photoURL,
      phone: formData.phoneNumber
    };

    try {
      await fetchApi('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      await refreshProfile();
      setIsEditing(false);
    } catch (err: any) {
      console.error("Update profile error:", err);
      setError(err.message || "Gagal memperbarui profil.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adiba_token')}`
        },
        body: fd
      });
      const data = await res.json();
      if (data.url) {
        setFormData(prev => ({ ...prev, photoURL: data.url }));
      }
    } catch (err) {
      console.error("Photo upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col lg:flex-row items-stretch gap-8">
        {/* Left Column: Sidebar Profile */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="bg-gray-900 p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl -mr-16 -mt-16"></div>
            
            <div className="relative group">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt={profile.displayName} className="w-32 h-32 rounded-[2.5rem] object-cover ring-4 ring-white/10" />
              ) : (
                <div className="w-32 h-32 bg-gray-800 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white/20 ring-4 ring-white/10 italic">
                  {profile?.displayName?.charAt(0)}
                </div>
              )}
              {isEditing && (
                 <label className="absolute -bottom-2 -right-2 bg-blue-600 p-3 rounded-2xl text-white shadow-xl cursor-pointer hover:scale-110 active:scale-95 transition-all">
                    <Camera className="w-5 h-5" />
                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                 </label>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-[2.5rem] flex items-center justify-center">
                   <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-2">
              <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">{profile?.displayName}</h2>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{profile?.role}</p>
            </div>

            <div className="mt-8 w-full space-y-3">
               <div className="bg-white/5 border border-white/10 p-4 rounded-3xl flex items-center gap-3">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <p className="text-[10px] font-black text-white/60 truncate">{profile?.email}</p>
               </div>
               <div className="bg-white/5 border border-white/10 p-4 rounded-3xl flex items-center gap-3">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">{profile?.role}</p>
               </div>
            </div>

            <div className="mt-10 w-full">
               <button 
                onClick={() => logout()}
                className="w-full py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
               >
                 <LogOut className="w-4 h-4" /> {t.logout}
               </button>
            </div>
          </div>
        </div>

        {/* Right Column: Main Info / Edits */}
        <div className="flex-1 space-y-6">
           <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl min-h-full">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black text-gray-900 tracking-tight italic uppercase flex items-center gap-3">
                    <UserIcon className="w-6 h-6 text-blue-600" /> 
                    {isEditing ? 'Ubah Biodata' : 'Informasi Lengkap'}
                 </h3>
                 <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={cn(
                    "p-3 rounded-2xl transition-all shadow-lg active:scale-95",
                    isEditing ? "bg-red-50 text-red-600" : "bg-gray-900 text-white"
                  )}
                 >
                   {isEditing ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                 </button>
              </div>

              {!isEditing ? (
                 <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nomor Telepon</p>
                          <p className="font-bold text-gray-900 mt-1 flex items-center gap-2"><Phone className="w-3 h-3 text-emerald-500" /> {profile?.phoneNumber || 'Belum diisi'}</p>
                       </div>
                       <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Jenis Kelamin</p>
                          <p className="font-bold text-gray-900 mt-1">{profile?.gender === 'L' ? 'Laki-laki' : profile?.gender === 'P' ? 'Perempuan' : 'Belum diisi'}</p>
                       </div>
                       <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pendidikan Terakhir</p>
                          <p className="font-bold text-gray-900 mt-1 flex items-center gap-2"><GraduationCap className="w-3 h-3 text-indigo-500" /> {profile?.education || 'Belum diisi'}</p>
                       </div>
                       <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Spesialisasi</p>
                          <p className="font-bold text-blue-600 mt-1 flex items-center gap-2 uppercase tracking-tighter italic"><BookOpen className="w-3 h-3" /> {profile?.specialization || 'Umum'}</p>
                       </div>
                       <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tempat Lahir</p>
                          <p className="font-bold text-gray-900 mt-1">{profile?.birthPlace || '-'}</p>
                       </div>
                       <div className="bg-gray-50/50 p-5 rounded-3xl border border-gray-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tanggal Lahir</p>
                          <p className="font-bold text-gray-900 mt-1 italic"><Calendar className="w-3 h-3 text-amber-500" /> {profile?.birthDate || '-'}</p>
                       </div>
                    </div>
                    <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Alamat Domisili</p>
                       <p className="font-bold text-gray-900 mt-2 leading-relaxed flex items-start gap-2 italic text-sm">
                          <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          {profile?.address || 'Alamat belum diatur'}
                       </p>
                    </div>
                 </div>
              ) : (
                 <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase">{error}</div>}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nama Lengkap</label>
                          <input 
                           type="text"
                           value={formData.displayName}
                           onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                           className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all font-sans"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nomor WA</label>
                          <input 
                           type="text"
                           value={formData.phoneNumber}
                           onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                           className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Ganti Password (Kosongkan jika tidak)</label>
                          <input 
                           type="password"
                           value={formData.password}
                           onChange={(e) => setFormData({...formData, password: e.target.value})}
                           className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                           autoComplete="new-password"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Pendidikan</label>
                          <input 
                           type="text"
                           value={formData.education}
                           onChange={(e) => setFormData({...formData, education: e.target.value})}
                           className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Spesialisasi</label>
                          <input 
                           type="text"
                           value={formData.specialization}
                           onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                           className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Jenis Kelamin</label>
                          <select 
                           value={formData.gender}
                           onChange={(e) => setFormData({...formData, gender: e.target.value as any})}
                           className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                          >
                            <option value="L">Laki-laki</option>
                            <option value="P">Perempuan</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Alamat Domisili</label>
                       <textarea 
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none"
                       />
                    </div>

                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2rem] py-5 rounded-[1.5rem] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95"
                    >
                      {loading ? 'Menyimpan...' : <><Save className="w-4 h-4" /> Simpan Perubahan</>}
                    </button>
                 </form>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};
