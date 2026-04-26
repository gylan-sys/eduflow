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
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export const Settings: React.FC = () => {
  const { profile } = useAuth();
  const { settings: globalSettings, refreshSettings } = useSettings();
  const [settings, setSettings] = useState<AppSettings>(globalSettings);
  const [loading, setLoading] = useState(false);
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
    <div className="max-w-4xl mx-auto space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight italic uppercase">
            Pengaturan
          </h1>
          <p className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
            <Layout className="w-4 h-4 text-indigo-500" /> Konfigurasi Sistem Adiba
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white border border-gray-100 rounded-2xl shadow-xl shadow-gray-100/50">
            <SettingsIcon className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 md:px-0">
        {/* Preview Card */}
        <div className="lg:col-span-1 space-y-6">
           <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group min-h-[300px] flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                <Layout className="w-48 h-48 -mr-10 -mt-10" />
              </div>
              
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-8 italic">Live Preview</h3>
              
              <div className="flex flex-col items-center justify-center space-y-6 flex-1">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden p-5 group-hover:scale-105 transition-transform">
                  {settings.appLogoUrl ? (
                    <img src={settings.appLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-white opacity-20"><ImageIcon className="w-12 h-12" /></div>
                  )}
                </div>
                <div className="text-center">
                  <h4 className="text-2xl font-black tracking-tighter mb-2 italic uppercase">{settings.appName}</h4>
                  <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Identity Branding</p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Theme Base</span>
                  <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: settings.themeColor }}></div>
                    <span className="text-[9px] font-mono text-gray-400 uppercase">{settings.themeColor}</span>
                  </div>
                </div>
              </div>
           </div>
        </div>

        {/* Input Form */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-50 shadow-2xl p-8 md:p-12">
          <form onSubmit={handleSave} className="space-y-10">
            <div className="grid grid-cols-1 gap-10">
              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 italic">
                  <Type className="w-3.5 h-3.5" /> Nama Aplikasi
                </label>
                <input 
                  type="text" 
                  value={settings.appName || ''}
                  onChange={(e) => setSettings({...settings, appName: e.target.value})}
                  className="w-full bg-gray-50 border-transparent px-6 py-4 rounded-2xl text-lg font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-inner italic" 
                  placeholder="Contoh: EduFlow Manager"
                />
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 italic">
                  <ImageIcon className="w-3.5 h-3.5" /> Logo Aplikasi
                </label>
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100/50">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2 shadow-inner border border-gray-100 shrink-0">
                    {settings.appLogoUrl ? (
                      <img src={settings.appLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-200" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                      {settings.appLogoUrl ? 'Logo Terunggah' : 'Belum Ada Logo'}
                    </p>
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
                      className="bg-gray-900 hover:bg-black text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg shadow-gray-200"
                    >
                      {uploading === 'logo' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Ganti Logo
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 italic">
                    <Wallet className="w-3.5 h-3.5" /> Biaya Bulanan
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base italic">Rp</span>
                    <input 
                      type="number" 
                      value={settings.monthlyFee || 0}
                      onChange={(e) => setSettings({...settings, monthlyFee: parseInt(e.target.value)})}
                      className="w-full bg-gray-50 border-transparent pl-14 pr-6 py-4 rounded-2xl text-lg font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-inner italic" 
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 italic">
                    <ImageIcon className="w-3.5 h-3.5" /> Gambar QRIS
                  </label>
                  <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl border border-gray-100/50">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2 shadow-inner border border-gray-100 shrink-0">
                      {settings.qrisUrl ? (
                        <img src={settings.qrisUrl} alt="QRIS" className="w-full h-full object-contain" />
                      ) : (
                        <RefreshCw className="w-6 h-6 text-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                        {settings.qrisUrl ? 'QRIS Terunggah' : 'Belum Ada QRIS'}
                      </p>
                      <input 
                        type="file" 
                        ref={qrisInputRef}
                        onChange={(e) => handleFileUpload(e, 'qris')}
                        className="hidden"
                        accept="image/*"
                      />
                      <button 
                        type="button"
                        onClick={() => qrisInputRef.current?.click()}
                        disabled={uploading === 'qris'}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-100"
                      >
                        {uploading === 'qris' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Ganti QRIS
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 italic">
                  <Palette className="w-3.5 h-3.5" /> Warna Tema
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <input 
                      type="color" 
                      value={settings.themeColor || '#000000'}
                      onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-4 border-gray-50 cursor-pointer overflow-hidden p-0 bg-transparent shadow-md active:scale-95 transition-transform"
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="text" 
                      value={settings.themeColor || ''}
                      onChange={(e) => setSettings({...settings, themeColor: e.target.value})}
                      className="w-full bg-gray-50 border-transparent px-6 py-4 rounded-2xl text-sm font-mono font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-inner uppercase tracking-wider" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-10">
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white font-black text-sm uppercase tracking-[0.2em] py-7 rounded-[2.5rem] shadow-2xl shadow-indigo-100 transition-all active:scale-[0.98] flex items-center justify-center gap-4 group"
              >
                {isSubmitting ? (
                   <RefreshCw className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Save className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span>Simpan Perubahan</span>
                  </>
                )}
              </button>
              <p className="mt-8 text-center text-[10px] font-black text-gray-300 uppercase tracking-widest leading-relaxed">
                * Konfigurasi akan diterapkan ke seluruh sesi pengguna <br/> secara real-time melalui cloud engine.
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
