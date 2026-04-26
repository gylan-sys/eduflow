import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
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
  AlertTriangle,
  Wallet,
  ChevronDown,
  Plus,
  Languages,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const Settings: React.FC = () => {
  const { profile } = useAuth();
  const { settings: globalSettings, refreshSettings } = useSettings();
  const [settings, setSettings] = useState<AppSettings>(globalSettings);
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'language'>('general');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const qrisInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSettings(globalSettings);
  }, [globalSettings]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'qris') => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(type);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('adiba_token');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Gagal mengunggah gambar");

      const data = await res.json();
      if (type === 'logo') {
        setSettings({ ...settings, appLogoUrl: data.url });
      } else {
        setSettings({ ...settings, qrisUrl: data.url });
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Gagal mengunggah gambar.");
    } finally {
      setUploading(null);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.role !== 'admin') return;
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('adiba_token');
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      await refreshSettings();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Error updating settings:", error);
      alert("Gagal menyimpan pengaturan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'general', name: settings.language === 'en' ? 'General' : 'Umum', icon: Layout },
    { id: 'appearance', name: settings.language === 'en' ? 'Appearance' : 'Tampilan', icon: Palette },
    { id: 'language', name: settings.language === 'en' ? 'Language' : 'Bahasa', icon: Languages },
  ];

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
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
        <div>
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-tight italic uppercase font-display">
            {settings.language === 'en' ? 'Settings' : 'Pengaturan'}
          </h1>
          <p className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
            <Layout className="w-4 h-4 text-indigo-500" /> {settings.language === 'en' ? 'Adiba System Configuration' : 'Konfigurasi Sistem Adiba'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-100/50">
            <SettingsIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex bg-gray-100/50 p-1.5 rounded-[2.5rem] mx-4 md:mx-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-4 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? "bg-white text-indigo-600 shadow-xl shadow-indigo-100/50" 
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Content Form */}
      <form onSubmit={handleSave} className="space-y-10">
        <div className="bg-white border-2 border-gray-100 rounded-[3rem] p-8 md:p-12 shadow-2xl shadow-gray-100">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-10"
            >
              {activeTab === 'general' && (
                <div className="grid md:grid-cols-5 gap-12">
                  <div className="md:col-span-3 space-y-10">
                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 italic">
                        <Type className="w-3.5 h-3.5" /> {settings.language === 'en' ? 'Application Name' : 'Nama Aplikasi'}
                      </label>
                      <input 
                        type="text" 
                        value={settings.appName || ''}
                        onChange={(e) => setSettings({...settings, appName: e.target.value})}
                        className="w-full bg-gray-50 border-transparent px-6 py-4 rounded-2xl text-lg font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-inner italic" 
                        placeholder={settings.language === 'en' ? "Example: School Manager" : "Contoh: EduFlow Manager"}
                      />
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 italic">
                        <ImageIcon className="w-3.5 h-3.5" /> {settings.language === 'en' ? 'Logo' : 'Logo Aplikasi'}
                      </label>
                      <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100/50">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2 shadow-inner border border-gray-100 shrink-0 overflow-hidden">
                          {settings.appLogoUrl ? (
                            <img src={settings.appLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-gray-200" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <input 
                            type="file" 
                            ref={logoInputRef}
                            onChange={(e) => handleFileUpload(e, 'logo')}
                            className="hidden"
                            accept="image/*"
                          />
                          <button 
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={uploading === 'logo'}
                            className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {uploading === 'logo' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            {settings.language === 'en' ? 'Change Logo' : 'Ganti Logo'}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 italic">
                          <Wallet className="w-3.5 h-3.5" /> {settings.language === 'en' ? 'Monthly Fee' : 'Biaya Bulanan'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base italic">Rp</span>
                          <input 
                            type="number" 
                            value={settings.monthlyFee || 0}
                            onChange={(e) => setSettings({...settings, monthlyFee: parseInt(e.target.value)})}
                            className="w-full bg-gray-50 border-transparent pl-14 pr-6 py-4 rounded-2xl text-lg font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-inner" 
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 italic">
                          <ImageIcon className="w-3.5 h-3.5" /> {settings.language === 'en' ? 'QRIS Image' : 'Gambar QRIS'}
                        </label>
                        <div className="flex items-center gap-2">
                           <input 
                            type="file" 
                            ref={qrisInputRef}
                            onChange={(e) => handleFileUpload(e, 'qris')}
                            className="hidden"
                          />
                          <button 
                            type="button"
                            onClick={() => qrisInputRef.current?.click()}
                            className="w-full bg-gray-50 hover:bg-gray-100 border-2 border-dashed border-gray-200 py-4 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all"
                          >
                            {settings.qrisUrl ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : (
                              <Plus className="w-5 h-5 text-gray-300" />
                            )}
                            <span className="text-[9px] font-black uppercase text-gray-400">{settings.language === 'en' ? 'Upload QRIS' : 'Unggah QRIS'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 flex flex-col items-center justify-center p-8 bg-gray-900 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                     <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                        <Layout className="w-40 h-40 -mr-10 -mt-10" />
                     </div>
                     <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-8 italic relative z-10">Live Preview</h3>
                     <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center p-4 border border-white/20 mb-6 relative z-10">
                        {settings.appLogoUrl ? <img src={settings.appLogoUrl} className="w-full h-full object-contain" /> : <ImageIcon className="w-10 h-10 opacity-20" />}
                     </div>
                     <div className="text-center relative z-10">
                        <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-1">{settings.appName}</h4>
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/40">School Brand Identity</p>
                     </div>
                  </div>
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-12">
                   <div className="space-y-6">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 italic">
                      <Palette className="w-3.5 h-3.5" /> {settings.language === 'en' ? 'Brand Theme Color' : 'Warna Tema Identitas'}
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {['#4f46e5', '#0891b2', '#059669', '#dc2626', '#d97706', '#7c3aed', '#db2777'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setSettings({ ...settings, themeColor: color })}
                          className={cn(
                            "w-14 h-14 rounded-2xl transition-all relative flex items-center justify-center",
                            settings.themeColor === color ? "scale-110 shadow-2xl shadow-gray-200" : "hover:scale-105"
                          )}
                          style={{ backgroundColor: color }}
                        >
                          {settings.themeColor === color && <div className="w-3 h-3 bg-white rounded-full shadow-lg" />}
                        </button>
                      ))}
                      <div className="relative">
                        <input 
                          type="color" 
                          value={settings.themeColor} 
                          onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                          className="w-14 h-14 opacity-0 absolute inset-0 cursor-pointer"
                        />
                        <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
                           <Plus className="w-5 h-5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 italic">
                      <SettingsIcon className="w-3.5 h-3.5" /> {settings.language === 'en' ? 'Typography System' : 'Sistem Tipografi'}
                    </label>
                    <div className="relative group">
                      <select
                        value={settings.fontFamily || 'Quicksand'}
                        onChange={(e) => setSettings({ ...settings, fontFamily: e.target.value })}
                        className="w-full bg-gray-50 border-2 border-gray-50 text-gray-900 rounded-3xl px-8 py-5 font-black text-lg appearance-none cursor-pointer focus:ring-4 focus:ring-indigo-100 transition-all italic tracking-tight"
                        style={{ fontFamily: settings.fontFamily || 'Quicksand' }}
                      >
                        {[
                          { id: 'Quicksand', name: 'Quicksand (Ceria)' },
                          { id: 'Lexend', name: 'Lexend (Modern)' },
                          { id: 'Inter', name: 'Inter (Professional)' },
                          { id: 'Plus Jakarta Sans', name: 'Jakarta' },
                          { id: 'Outfit', name: 'Outfit (High Tech)' },
                          { id: 'Comic Neue', name: 'Comic Neue (Educational)' },
                          { id: 'Montserrat', name: 'Montserrat' },
                          { id: 'Nunito', name: 'Nunito (Soft)' },
                          { id: 'Raleway', name: 'Raleway' },
                          { id: 'Ubuntu', name: 'Ubuntu' },
                          { id: 'Fredoka', name: 'Fredoka (Kids)' }
                        ].map((font) => (
                          <option key={font.id} value={font.id} style={{ fontFamily: font.id }}>
                            {font.name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-8 pointer-events-none text-gray-400 group-hover:text-indigo-600">
                        <ChevronDown className="w-6 h-6" />
                      </div>
                    </div>
                    <div 
                      className="p-10 rounded-[3rem] bg-indigo-50 border-2 border-white flex flex-col items-center text-center space-y-4 shadow-inner"
                      style={{ fontFamily: settings.fontFamily || 'Quicksand' }}
                    >
                      <p className="text-3xl font-black text-indigo-950 uppercase tracking-tighter italic">Preview {settings.fontFamily}</p>
                      <p className="text-sm text-indigo-900/60 leading-relaxed max-w-sm font-bold tracking-tight">
                        {settings.language === 'en' 
                          ? "Education is the most powerful weapon which you can use to change the world." 
                          : "Pendidikan adalah senjata paling mematikan yang dapat digunakan untuk mengubah dunia."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'language' && (
                <div className="space-y-10">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { id: 'id', name: 'Bahasa Indonesia', sub: 'Native Support', flag: '🇮🇩' },
                      { id: 'en', name: 'English', sub: 'International', flag: '🇺🇸' }
                    ].map((lang) => (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setSettings({ ...settings, language: lang.id as any })}
                        className={cn(
                          "p-10 rounded-[2.5rem] border-2 transition-all text-left flex items-center gap-6",
                          settings.language === lang.id 
                            ? "border-indigo-600 bg-indigo-50 shadow-2xl shadow-indigo-100" 
                            : "border-gray-50 bg-gray-50 hover:border-gray-200"
                        )}
                      >
                        <div className="text-5xl">{lang.flag}</div>
                        <div>
                          <p className={cn(
                            "text-xl font-black uppercase tracking-tighter italic",
                            settings.language === lang.id ? "text-indigo-950" : "text-gray-900"
                          )}>
                            {lang.name}
                          </p>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{lang.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 flex items-start gap-4">
                     <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                        <Languages className="w-6 h-6" />
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-amber-950 uppercase tracking-tight italic">{settings.language === 'en' ? 'Language Synchronization' : 'Sinkronisasi Bahasa'}</h4>
                        <p className="text-xs text-amber-800/70 font-bold leading-relaxed mt-1 uppercase tracking-wider">
                           {settings.language === 'en' 
                             ? 'System UI will be translated. User-generated content (names, reports) remains in their original input language.' 
                             : 'UI Sistem akan diterjemahkan. Konten dari pengguna (nama, laporan) tetap dalam bahasa asli inputnya.'}
                        </p>
                     </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Submit Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 px-4 md:px-0">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic text-center md:text-left">
              * Perubahan akan otomatis tersinkronisasi <br className="hidden md:block" /> ke seluruh perangkat pengguna.
           </p>
           <button
            type="submit"
            disabled={isSubmitting}
            className="group bg-gray-900 text-white px-14 py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gray-200 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-4 min-w-full md:min-w-[300px]"
          >
            {isSubmitting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {settings.language === 'en' ? 'Save All Preferences' : 'Simpan Semua Preferensi'}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Success Notification */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 left-6 md:left-auto md:w-[400px] z-[70] flex items-center gap-5 bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-2xl border border-white/5"
          >
            <div className="w-14 h-14 bg-indigo-500 rounded-[1.5rem] flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
              <CheckCircle2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="font-black text-sm tracking-tight italic uppercase">Update Berhasil!</p>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Branding sistem telah diperbarui.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;