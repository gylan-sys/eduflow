import React, { useEffect, useState } from 'react';
import { Announcement } from '../types';
import { 
  Megaphone, 
  Plus, 
  X, 
  Trash2, 
  Info, 
  Calendar, 
  Star,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { translations } from '../constants/translations';
import { format } from 'date-fns';

export const Announcements: React.FC = () => {
  const { profile } = useAuth();
  const { settings: appSettings } = useSettings();
  const lang = appSettings.language || 'id';
  const t = translations[lang];

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    type: 'info' as Announcement['type'],
    isActive: true
  });

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (err) {
      console.error("Fetch announcements failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('eduflow_token');
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newAnnouncement)
      });

      if (!res.ok) throw new Error("Gagal membuat pengumuman");

      setIsAddModalOpen(false);
      setNewAnnouncement({
        title: '',
        content: '',
        type: 'info',
        isActive: true
      });
      fetchAnnouncements();
    } catch (err) {
      console.error("Error creating announcement:", err);
      alert("Gagal membuat pengumuman.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm("Hapus pengumuman ini?")) return;
    try {
      const token = localStorage.getItem('eduflow_token');
      const res = await fetch(`/api/announcements/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) fetchAnnouncements();
    } catch (err) {
      console.error("Error deleting announcement:", err);
    }
  };

  const canManage = profile?.role === 'admin' || profile?.role === 'teacher';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.info_program}</h2>
          <p className="text-gray-500">{t.announcement_desc}</p>
        </div>
        {canManage && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-100 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>{t.add_info}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">{t.loading_database}</div>
        ) : announcements.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400 font-bold uppercase tracking-widest bg-white rounded-[2.5rem] border border-dashed border-gray-200">{t.no_info}</div>
        ) : announcements.map((item) => (
          <motion.div 
            layout
            key={item.id}
            className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-gray-100 transition-all duration-500"
          >
            <div className={cn(
              "p-6 flex items-start justify-between",
              item.type === 'program' ? "bg-emerald-50/50" : 
              item.type === 'event' ? "bg-amber-50/50" : "bg-blue-50/50"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-3 rounded-2xl shadow-sm",
                  item.type === 'program' ? "bg-white text-emerald-600" : 
                  item.type === 'event' ? "bg-white text-amber-600" : "bg-white text-blue-600"
                )}>
                  {item.type === 'program' ? <Star className="w-5 h-5 transition-transform group-hover:rotate-12" /> : 
                   item.type === 'event' ? <Calendar className="w-5 h-5 transition-transform group-hover:scale-110" /> : 
                   <Info className="w-5 h-5 transition-transform group-hover:-rotate-12" />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  {item.type === 'program' ? t.program : item.type === 'event' ? t.agenda : t.info}
                </span>
              </div>
              {canManage && (
                <button 
                  onClick={() => handleDeleteAnnouncement(item.id)}
                  className="bg-white p-2.5 rounded-xl text-gray-300 hover:text-red-500 hover:shadow-md transition-all active:scale-90"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="p-8 flex-1 flex flex-col">
              <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-4 group-hover:text-indigo-600 transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-4">
                {item.content}
              </p>
              
              <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden">
                      <img 
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${item.authorName}`} 
                        alt="Author" 
                        className="w-full h-full object-cover" 
                      />
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-black text-gray-900 uppercase truncate tracking-tight">{item.authorName}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        {item.createdAt ? format(new Date(item.createdAt), 'dd MMM yyyy') : t.just_now}
                      </p>
                   </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">{t.create_info}</h3>
                  <p className="text-indigo-100 text-xs font-medium">{t.announcement_desc}</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="hover:bg-white/10 p-2 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateAnnouncement} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.info_title}</label>
                    <input 
                      type="text" 
                      required 
                      value={newAnnouncement.title || ''}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, title: e.target.value})}
                      className="w-full bg-gray-50 border-none px-4 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
                      placeholder={t.info_title}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.info_type}</label>
                    <div className="grid grid-cols-3 gap-2">
                       {['info', 'program', 'event'].map((type) => (
                         <button
                           key={type}
                           type="button"
                           onClick={() => setNewAnnouncement({...newAnnouncement, type: type as any})}
                           className={cn(
                             "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                             newAnnouncement.type === type 
                               ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100" 
                               : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                           )}
                         >
                           {type === 'info' ? t.info : type === 'program' ? t.program : t.agenda}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.info_content}</label>
                    <textarea 
                      required 
                      rows={4}
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement({...newAnnouncement, content: e.target.value})}
                      className="w-full bg-gray-50 border-none px-4 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none" 
                      placeholder={t.info_content}
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-black text-sm uppercase tracking-widest py-4 rounded-[1.5rem] shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Megaphone className="w-5 h-5" />
                      <span>{t.publish}</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
