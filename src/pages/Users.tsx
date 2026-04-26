import React, { useEffect, useState } from 'react';
import { UserProfile, UserRole, BusinessLine, Student } from '../types';
import { 
  Users as UsersIcon, 
  ShieldCheck,
  UserPlus,
  Search,
  X,
  Mail,
  Lock,
  User as UserIcon,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { translations } from '../constants/translations';
import { fetchApi } from '../lib/api';

export const Users: React.FC = () => {
  const { profile: currentUser } = useAuth();
  const { settings: appSettings } = useSettings();
  const lang = appSettings.language || 'id';
  const t = translations[lang];

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'teacher' as UserRole,
    businessLine: 'shadow' as BusinessLine,
    studentId: ''
  });

  const fetchData = async () => {
    try {
      const [uData, sData] = await Promise.all([
        fetchApi('/api/users'),
        fetchApi('/api/students')
      ]);
      setUsers(uData);
      setStudents(sData);
    } catch (err) {
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await fetchApi('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser)
      });
      setIsAddModalOpen(false);
      setNewUser({
        email: '',
        password: '',
        displayName: '',
        role: 'teacher',
        businessLine: 'shadow',
        studentId: ''
      });
      fetchData();
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.message || "Gagal membuat user baru.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (currentUser?.role !== 'admin') {
    return <div className="p-8 text-center text-red-500 font-bold">Akses Ditolak. Halaman ini hanya untuk Admin.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t.user_management}</h2>
          <p className="text-gray-500">{t.user_desc}</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-100 active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          <span>{t.add_user}</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={t.search_user} 
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-none pl-12 pr-4 py-3 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.identity}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.role}</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.business_unit}</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">{t.loading_database}</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-400 uppercase">
                         {user.displayName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 tracking-tight">{user.displayName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-xl",
                      user.role === 'admin' ? "bg-red-50 text-red-600" :
                      user.role === 'parent' ? "bg-emerald-50 text-emerald-600" :
                      "bg-blue-50 text-blue-600"
                    )}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                      {user.role === 'parent' ? (
                        <>{t.child}: <span className="text-gray-900">{students.find(s => s.id === user.studentId)?.name || 'N/A'}</span></>
                      ) : (
                        user.businessLine || '-'
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {/* Local deletion functionality can be added here */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 bg-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight">{t.add_user_title}</h3>
                  <button onClick={() => setIsAddModalOpen(false)} className="hover:bg-white/10 p-2 rounded-xl">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="p-8 space-y-5">
                {error && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100">{error}</div>}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.full_name}</label>
                    <input 
                      type="text" 
                      required 
                      value={newUser.displayName || ''}
                      onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                      className="w-full bg-gray-50 border-none px-4 py-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.email}</label>
                    <input 
                      type="email" 
                      required 
                      value={newUser.email || ''}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full bg-gray-50 border-none px-4 py-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.password}</label>
                    <input 
                      type="password" 
                      required 
                      minLength={6}
                      value={newUser.password || ''}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      className="w-full bg-gray-50 border-none px-4 py-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.role}</label>
                      <select 
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                        className="w-full bg-gray-50 border-none px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest outline-none cursor-pointer"
                      >
                        <option value="teacher">{t.teacher}</option>
                        <option value="admin">Admin</option>
                        <option value="parent">{t.parent}</option>
                      </select>
                    </div>
                    <div>
                      {newUser.role === 'parent' ? (
                        <>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.select_child}</label>
                          <select 
                            required={newUser.role === 'parent'}
                            value={newUser.studentId}
                            onChange={(e) => setNewUser({...newUser, studentId: e.target.value})}
                            className="w-full bg-gray-50 border-none px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest outline-none cursor-pointer"
                          >
                            <option value="">{t.select_child}</option>
                            {students.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        </>
                      ) : (
                        <>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.business_line}</label>
                          <select 
                            value={newUser.businessLine}
                            onChange={(e) => setNewUser({...newUser, businessLine: e.target.value as any})}
                            className="w-full bg-gray-50 border-none px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest outline-none cursor-pointer"
                          >
                            <option value="shadow">Shadow</option>
                            <option value="swimming">Swimming</option>
                            <option value="both">{t.both}</option>
                          </select>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-sm uppercase tracking-widest py-4 rounded-[1.5rem] flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? t.signing_in : t.add_account}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
