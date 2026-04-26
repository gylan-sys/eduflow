import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  X, 
  Mail, 
  Lock, 
  ArrowRight, 
  Briefcase, 
  Waves, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { fetchApi } from '../lib/api';
import { translations } from '../constants/translations';

export const Login: React.FC = () => {
  const { loginWithEmail, login, user, error } = useAuth();
  const { settings: appSettings } = useSettings();
  
  const lang = appSettings.language || 'id';
  const t = translations[lang];

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const [showBootstrap, setShowBootstrap] = useState(false);

  useEffect(() => {
    fetchApi('/api/announcements').then(data => {
      setAnnouncements(data.slice(0, 3));
    }).catch(console.error);
  }, []);

  const handleBootstrap = async () => {
    setIsSubmitting(true);
    try {
      const adminEmail = 'gkrismantara@gmail.com';
      const adminPass = 'admin123';
      
      const res = await fetch('/api/auth/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: adminEmail, 
          password: adminPass,
          displayName: 'Master Admin'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      alert(`Master Admin Siap!\n\nEmail: ${adminEmail}\nPassword: ${adminPass}\n\nSilakan login menggunakan kredensial di atas.`);
      setShowBootstrap(false);
    } catch (err: any) {
      console.error("Bootstrap error:", err);
      alert("Gagal bootstrap: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
    } catch (err) {
      // Error handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row overflow-hidden font-sans">
      {/* Left Content / Information (Landing Surface) */}
      <div className="lg:flex-1 p-8 lg:p-20 bg-blue-600 text-white relative overflow-hidden flex flex-col justify-between">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-1/2 -right-48 w-[32rem] h-[32rem] bg-indigo-400 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-20"
            onDoubleClick={() => setShowBootstrap(true)}
          >
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center p-3 border border-white/30 shadow-xl overflow-hidden">
               {appSettings.appLogoUrl ? (
                 <img src={appSettings.appLogoUrl} alt="Logo" className="w-full h-full object-contain" />
               ) : (
                 <GraduationCap className="w-full h-full" />
               )}
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter leading-none">{appSettings.appName}</h1>
              <p className="text-blue-100/60 text-[10px] font-black uppercase tracking-widest mt-1">{t.management_system}</p>
            </div>
          </motion.div>

          {/* Hero Section */}
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl lg:text-7xl font-black tracking-tight leading-[0.9] text-white uppercase italic font-display"
            >
              School<br />
              <span className="text-blue-300">Management.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-blue-100/80 mt-8 font-medium leading-relaxed"
            >
              {t.login_subtitle}
            </motion.p>
          </div>

          {/* Program Quick Look */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-16">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/15 transition-all group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Briefcase className="w-6 h-6 text-blue-200" />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight mb-3">Shadow Teaching</h4>
              <p className="text-sm text-blue-100/70 leading-relaxed mb-6">Pendampingan personal untuk membantu anak beradaptasi dan berkembang di sekolah.</p>
              <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-blue-300">
                Lihat Detail <ArrowUpRight className="w-3 h-3" />
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white/10 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 hover:bg-white/15 transition-all group"
            >
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6">
                <Waves className="w-6 h-6 text-blue-200" />
              </div>
              <h4 className="text-xl font-black uppercase tracking-tight mb-3">Les Renang</h4>
              <p className="text-sm text-blue-100/70 leading-relaxed mb-6">Program berenang yang menyenangkan dengan pelatih bersertifikat untuk hasil optimal.</p>
              <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 text-blue-300">
                Jadwal Kelas <ArrowUpRight className="w-3 h-3" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer Info / Announcements */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="pt-12 border-t border-white/10 mt-20"
        >
          <div className="flex items-center justify-between mb-6">
             <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-200 flex items-center gap-2">
               <Sparkles className="w-3 h-3 animate-pulse" /> Pengumuman Terbaru
             </h5>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {announcements.map((ann) => (
              <div key={ann.id} className="min-w-[280px] bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-blue-300 uppercase mb-2">Penting • {ann.type}</p>
                <h4 className="text-sm font-black line-clamp-1 mb-2">{ann.title}</h4>
                <p className="text-[10px] text-blue-100/60 line-clamp-2">{ann.content}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Content / Login Section */}
      <div className="lg:w-[500px] bg-white p-8 lg:p-20 flex flex-col justify-center relative shadow-[-40px_0_60px_-15px_rgba(0,0,0,0.1)]">
        <div className="max-w-sm mx-auto w-full">
          <div className="lg:hidden mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center p-2 overflow-hidden" style={{ backgroundColor: appSettings.themeColor }}>
                 {appSettings.appLogoUrl ? (
                   <img src={appSettings.appLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                 ) : (
                   <GraduationCap className="text-white w-full h-full" />
                 )}
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-gray-900">{appSettings.appName}</h1>
            </div>
          </div>

          <div className="mb-10">
            <h3 className="text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase italic">{t.login_title}</h3>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2">{t.management_system}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3"
              >
                <div className="bg-red-500 rounded-full p-1 shrink-0">
                   <X className="w-3 h-3 text-white" />
                </div>
                <p className="text-[10px] text-red-600 font-bold leading-tight uppercase tracking-widest">{error}</p>
              </motion.div>
            )}

            <div className="space-y-4">
              <div className="group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 ml-1 mb-2 block">{t.email}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com" 
                    className="w-full bg-gray-50 border-2 border-gray-50 group-focus-within:border-blue-600 group-focus-within:bg-white pl-12 pr-4 py-4 rounded-2xl text-sm font-bold placeholder:text-gray-300 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="group">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 ml-1 mb-2 block">{t.password}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••" 
                    className="w-full bg-gray-50 border-2 border-gray-50 group-focus-within:border-blue-600 group-focus-within:bg-white pl-12 pr-4 py-4 rounded-2xl text-sm font-bold placeholder:text-gray-300 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="w-5 h-5 rounded-md border-2 border-gray-200 group-hover:border-blue-600 transition-colors" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.remember_me}</span>
              </label>
              <button type="button" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">{t.need_help}</button>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full hover:shadow-2xl hover:shadow-blue-200 text-white font-black text-xs uppercase tracking-widest py-5 px-4 rounded-[2rem] transition-all flex items-center justify-center gap-3 group active:scale-[0.98] mb-4"
              style={{ backgroundColor: appSettings.themeColor }}
            >
              {isSubmitting ? t.signing_in : t.signin}
              {!isSubmitting && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          {/* Social Proof / Trust */}
          <div className="mt-12 pt-12 border-t border-gray-50 text-center">
            <p className="text-[10px] text-gray-300 font-bold uppercase tracking-[0.2em] mb-4">Dipercaya oleh 50+ Keluarga</p>
            <div className="flex justify-center gap-6 grayscale opacity-30">
               {/* Placeholders for partner logos if any */}
            </div>
          </div>

          <p className="text-[10px] text-center text-gray-300 font-bold uppercase tracking-widest mt-12 mb-0">
             v1.0 • 2026 EduFlow Indonesia
          </p>

          {/* Hidden Bootstrap for Developer */}
          <AnimatePresence>
            {showBootstrap && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="w-full mt-8 p-6 bg-red-50 rounded-[2rem] border border-red-100 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                   <h5 className="text-[10px] font-black text-red-600 uppercase tracking-widest">Developer Toolbar</h5>
                   <button onClick={() => setShowBootstrap(false)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button>
                </div>
                <button 
                  onClick={handleBootstrap}
                  disabled={isSubmitting}
                  className="w-full bg-white text-red-600 font-black py-4 rounded-2xl border border-red-100 hover:shadow-lg transition-all text-xs uppercase tracking-widest shadow-sm"
                >
                  🚀 Setup Master Admin
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
