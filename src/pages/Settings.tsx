import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AppSettings } from '../types';
import { 
  Settings as SettingsIcon,
  Layout, 
  Image as ImageIcon, 
  Type, 
  Palette, 
  Save, 
  RefreshCw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const Settings: React.FC = () => {
  const { profile } = useAuth();
  const [settings, setSettings] = useState<AppSettings>({
    appName: 'EduFlow Manager',
    appLogoUrl: '',
    themeColor: '#2563EB'
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'app_settings'), (snap) => {
      if (snap.exists()) {
        setSettings(snap.data() as AppSettings);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.role !== 'admin') return;
    setIsSubmitting(true);
    
    try {
      await setDoc(doc(db, 'config', 'app_settings'), settings);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating settings:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center shadow-xl shadow-red-100">
           <AlertTriangle className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Akses Dibatasi</h2>
        <p className="text-gray-500 max-w-sm font-medium">Anda tidak memiliki izin untuk mengakses pengaturan global aplikasi.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">Pengaturan Global</h2>
          <p className="text-gray-500 font-medium mt-3 uppercase tracking-[0.2em] text-[10px]">Kustomisasi Branding Aplikasi</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-sm">
            <SettingsIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Preview Card */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group h-full">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Layout className="w-48 h-48 -mr-10 -mt-10" />
              </div>
              
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-8">Live Preview</h3>
              
              <div className="flex flex-col items-center justify-center space-y-6 py-6">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center border border-white/20 shadow-xl overflow-hidden p-4">
                  {settings.appLogoUrl ? (
                    <img src={settings.appLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-white opacity-20"><ImageIcon className="w-10 h-10" /></div>
                  )}
                </div>
                <div className="text-center">
                  <h4 className="text-2xl font-black tracking-tighter mb-2">{settings.appName}</h4>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Branding Anda</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Warna Utama</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: settings.themeColor }}></div>
                    <span className="text-[10px] font-mono text-gray-400">{settings.themeColor}</span>
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* Input Form */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 md:p-12">
          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 gap-8">
               <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">
                  <Type className="w-3 h-3" /> Nama Aplikasi
                </label>
                <input 
                  type="text" 
                  value={settings.appName}
                  onChange={(e) => setSettings({...settings, appName: e.target.value})}
                  className="w-full bg-gray-50 border-none px-6 py-5 rounded-[1.5rem] text-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                  placeholder="Contoh: EduFlow Manager"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">
                  <ImageIcon className="w-3 h-3" /> URL Logo Aplikasi
                </label>
                <input 
                  type="text" 
                  value={settings.appLogoUrl}
                  onChange={(e) => setSettings({...settings, appLogoUrl: e.target.value})}
                  className="w-full bg-gray-50 border-none px-6 py-5 rounded-[1.5rem] text-xs font-semibold text-gray-600 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                  placeholder="https://link-ke-logo-anda.png"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">
                  <Palette className="w-3 h-3" /> Tema Warna Utama
                </label>
                <div className="flex items-center gap-4">
                  <input 
                    type="color" 
                    value={settings.themeColor}
                    onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                    className="w-16 h-16 rounded-2xl border-4 border-gray-50 cursor-pointer overflow-hidden p-0 bg-transparent shadow-md"
                  />
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={settings.themeColor}
                      onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                      className="w-full bg-gray-50 border-none px-6 py-5 rounded-[1.5rem] text-sm font-mono font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-black text-sm uppercase tracking-widest py-6 rounded-[2rem] shadow-2xl shadow-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                   <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Terapkan Perubahan Global</span>
                  </>
                )}
              </button>
              <p className="mt-6 text-center text-[10px] font-black text-gray-300 uppercase tracking-tighter">
                * Perubahan akan diterapkan seketika untuk semua pengguna aplikasi.
              </p>
            </div>
          </form>
        </div>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-10 right-10 z-50 flex items-center gap-4 bg-gray-900 text-white p-6 rounded-[2rem] shadow-2xl border border-white/10"
          >
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm tracking-tight">Pengaturan Disimpan!</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Tampilan aplikasi telah diperbarui.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
