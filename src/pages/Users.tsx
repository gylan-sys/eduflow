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
  Trash2,
  Eye,
  Camera,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  GraduationCap,
  Briefcase,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { translations } from '../constants/translations';
import { fetchApi } from '../lib/api';
import { validateEmail, validatePhone, isDateInPast } from '../lib/validation';

export const Users: React.FC = () => {
  const { profile: currentUser } = useAuth();
  const { settings: appSettings } = useSettings();
  const lang = appSettings.language || 'id';
  const t = translations[lang];

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    displayName: '',
    role: 'teacher' as UserRole,
    businessLine: 'shadow' as BusinessLine,
    studentId: '',
    assignedStudentIds: [] as string[],
    photoURL: '',
    phoneNumber: '',
    address: '',
    gender: 'L' as 'L' | 'P',
    specialization: '',
    education: '',
    birthDate: '',
    birthPlace: '',
    joinDate: ''
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

    // Validation
    if (!validateEmail(newUser.email)) {
      setError("Format email tidak valid");
      return;
    }
    if (newUser.phoneNumber && !validatePhone(newUser.phoneNumber)) {
      setError("Format nomor telepon tidak valid. Gunakan format 08..., 62..., atau +62...");
      return;
    }
    if (newUser.birthDate && !isDateInPast(newUser.birthDate)) {
      setError("Tanggal lahir tidak boleh di masa depan");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Map photoURL to photoUrl for server if needed, though server expects photoUrl
    const payload = {
      ...newUser,
      photoUrl: newUser.photoURL,
      phone: newUser.phoneNumber,
      uid: editingUser?.uid
    };

    try {
      if (editingUser) {
        await fetchApi(`/api/users/${editingUser.uid}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/api/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setIsAddModalOpen(false);
      setEditingUser(null);
      setNewUser({
        email: '',
        username: '',
        password: '',
        displayName: '',
        role: 'teacher',
        businessLine: 'shadow',
        studentId: '',
        assignedStudentIds: [],
        photoURL: '',
        phoneNumber: '',
        address: '',
        gender: 'L',
        specialization: '',
        education: '',
        birthDate: '',
        birthPlace: '',
        joinDate: ''
      });
      fetchData();
    } catch (err: any) {
      console.error("Error saving user:", err);
      setError(err.message || "Gagal menyimpan data user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adiba_token')}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setNewUser(prev => ({ ...prev, photoURL: data.url }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Gagal mengunggah foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (user: UserProfile) => {
    setEditingUser(user);
    setNewUser({
      email: user.email,
      username: (user as any).username || '',
      password: '', // Leave blank unless changing
      displayName: user.displayName || '',
      role: user.role,
      businessLine: user.businessLine || 'shadow',
      studentId: user.studentId || '',
      assignedStudentIds: user.assignedStudentIds || [],
      photoURL: user.photoURL || '',
      phoneNumber: user.phoneNumber || '',
      address: user.address || '',
      gender: user.gender || 'L',
      specialization: user.specialization || '',
      education: user.education || '',
      birthDate: user.birthDate || '',
      birthPlace: user.birthPlace || '',
      joinDate: user.joinDate || ''
    });
    setIsAddModalOpen(true);
  };

  const handleViewDetail = (user: UserProfile) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
                         u.email?.toLowerCase().includes(search.toLowerCase()) ||
                         (u as any).username?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={t.search_user} 
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-none pl-12 pr-4 py-3 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <button 
              onClick={() => setRoleFilter('all')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                roleFilter === 'all' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              Semua
            </button>
            <button 
              onClick={() => setRoleFilter('teacher')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                roleFilter === 'teacher' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              {t.teacher}
            </button>
            <button 
              onClick={() => setRoleFilter('parent')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                roleFilter === 'parent' ? "bg-emerald-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              {t.parent}
            </button>
            <button 
              onClick={() => setRoleFilter('admin')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                roleFilter === 'admin' ? "bg-red-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              Admin
            </button>
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
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-xl object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-400 uppercase">
                           {user.displayName?.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900 tracking-tight">{user.displayName}</p>
                        <p className="text-xs text-gray-500">{user.email} { (user as any).username && <span className="text-blue-500 ml-1">(@{(user as any).username})</span> }</p>
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
                      ) : user.role === 'teacher' ? (
                        <div className="flex flex-wrap gap-1">
                          {user.assignedStudentIds && user.assignedStudentIds.length > 0 ? (
                            user.assignedStudentIds.map(id => {
                              const s = students.find(std => std.id === id);
                              return s ? (
                                <span key={id} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[8px] border border-gray-200">{s.name}</span>
                              ) : null;
                            })
                          ) : (
                            <span className="text-gray-300 italic">Belum ada siswa</span>
                          )}
                        </div>
                      ) : (
                        user.businessLine || '-'
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 text-gray-300">
                       <button 
                        onClick={() => handleViewDetail(user)}
                        className="p-2 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                        title="Lihat Biodata"
                       >
                          <Eye className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => handleEditClick(user)}
                        className="p-2 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Edit User"
                       >
                          <Edit2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit User Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 bg-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold tracking-tight">{editingUser ? 'Edit User' : t.add_user_title}</h3>
                  <button onClick={() => { setIsAddModalOpen(false); setEditingUser(null); }} className="hover:bg-white/10 p-2 rounded-xl">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                {error && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100">{error}</div>}
                
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center gap-4 py-2">
                   <div className="relative group">
                     {newUser.photoURL ? (
                        <img src={newUser.photoURL} alt="Preview" className="w-24 h-24 rounded-[2rem] object-cover border-4 border-blue-50 shadow-lg" />
                     ) : (
                        <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center border-4 border-dashed border-gray-200 text-gray-300 group-hover:text-blue-400 group-hover:border-blue-200 transition-all">
                           <UserIcon className="w-10 h-10" />
                        </div>
                     )}
                     <label className="absolute -bottom-2 -right-2 bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all">
                        <Camera className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                     </label>
                     {uploading && (
                       <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-[2rem] flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                       </div>
                     )}
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Foto Profil</p>
                </div>

                <div className="space-y-6">
                  {/* Account Info Section */}
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 italic">
                      <Lock className="w-3 h-3" /> Informasi Akun
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.email}</label>
                        <input 
                          type="email" 
                          required 
                          value={newUser.email || ''}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Username</label>
                        <input 
                          type="text" 
                          value={newUser.username || ''}
                          onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                          placeholder="username"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">
                          {editingUser ? 'Ganti Password (Kosongkan jika tidak ganti)' : t.password}
                        </label>
                        <input 
                          type="password" 
                          required={!editingUser}
                          minLength={6}
                          value={newUser.password || ''}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.full_name}</label>
                      <input 
                        type="text" 
                        required 
                        value={newUser.displayName || ''}
                        onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                        className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.role}</label>
                        <select 
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer"
                        >
                          <option value="teacher">{t.teacher}</option>
                          <option value="admin">Admin</option>
                          <option value="parent">{t.parent}</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        {newUser.role === 'parent' ? (
                          <>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">{t.select_child}</label>
                            <select 
                              required={newUser.role === 'parent'}
                              value={newUser.studentId}
                              onChange={(e) => setNewUser({...newUser, studentId: e.target.value})}
                              className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer"
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
                              className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer"
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

                  {/* Assignments Section (For Teachers) */}
                  {newUser.role === 'teacher' && (
                    <div className="p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
                      <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 px-1 italic">Tugaskan Siswa (Maks. 2)</label>
                      <div className="grid grid-cols-2 gap-2">
                        {students.map(s => {
                          const isSelected = newUser.assignedStudentIds.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setNewUser({...newUser, assignedStudentIds: newUser.assignedStudentIds.filter(id => id !== s.id)});
                                } else if (newUser.assignedStudentIds.length < 2) {
                                  setNewUser({...newUser, assignedStudentIds: [...newUser.assignedStudentIds, s.id]});
                                }
                              }}
                              className={cn(
                                "p-3 rounded-xl border text-[10px] font-bold text-left transition-all truncate",
                                isSelected ? "bg-indigo-600 border-indigo-600 text-white shadow-lg" : "bg-white border-gray-100 text-gray-500 hover:border-indigo-200"
                              )}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Biodata Section */}
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-4 border border-gray-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 italic">
                      <UserIcon className="w-3 h-3" /> Biodata Lengkap
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nomor Telepon</label>
                        <input 
                          type="text" 
                          placeholder="0812..."
                          value={newUser.phoneNumber || ''}
                          onChange={(e) => setNewUser({...newUser, phoneNumber: e.target.value})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Jenis Kelamin</label>
                        <select 
                          value={newUser.gender}
                          onChange={(e) => setNewUser({...newUser, gender: e.target.value as any})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer"
                        >
                          <option value="L">Laki-laki</option>
                          <option value="P">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Tempat Lahir</label>
                        <input 
                          type="text" 
                          value={newUser.birthPlace || ''}
                          onChange={(e) => setNewUser({...newUser, birthPlace: e.target.value})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Tanggal Lahir</label>
                        <input 
                          type="date" 
                          value={newUser.birthDate || ''}
                          onChange={(e) => setNewUser({...newUser, birthDate: e.target.value})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-xs font-bold outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Pendidikan Terakhir</label>
                        <input 
                          type="text" 
                          value={newUser.education || ''}
                          onChange={(e) => setNewUser({...newUser, education: e.target.value})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium outline-none" 
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Spesialisasi</label>
                        <input 
                          type="text" 
                          value={newUser.specialization || ''}
                          onChange={(e) => setNewUser({...newUser, specialization: e.target.value})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium outline-none" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Alamat Domisili</label>
                      <textarea 
                        value={newUser.address || ''}
                        onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                        className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl text-sm font-medium outline-none resize-none h-20" 
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 sticky bottom-0 bg-white">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-xs uppercase tracking-[0.2em] py-4 rounded-[1.5rem] flex items-center justify-center gap-2 shadow-xl shadow-blue-100"
                  >
                    {isSubmitting ? 'Memproses...' : editingUser ? 'Simpan Perubahan' : 'Tambah Akun'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative"
            >
              <button 
                onClick={() => setIsDetailModalOpen(false)} 
                className="absolute top-6 right-6 z-20 p-3 bg-white/20 hover:bg-white/40 text-white md:text-gray-400 md:bg-gray-100 md:hover:bg-gray-200 rounded-2xl transition-all"
               >
                 <X className="w-6 h-6" />
               </button>

               <div className="w-full md:w-1/3 bg-gray-900 p-10 flex flex-col items-center justify-center space-y-6 text-center">
                  <div className="relative">
                    {selectedUser.photoURL ? (
                      <img src={selectedUser.photoURL} alt={selectedUser.displayName} className="w-32 h-32 rounded-[2.5rem] object-cover ring-4 ring-white/10" />
                    ) : (
                      <div className="w-32 h-32 bg-gray-800 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white/20 ring-4 ring-white/10">
                        {selectedUser.displayName?.charAt(0)}
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-blue-500 p-3 rounded-2xl text-white shadow-xl">
                       <ShieldCheck className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-tight">{selectedUser.displayName}</h3>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1 italic">{selectedUser.role}</p>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <span className="bg-white/5 border border-white/10 text-white/60 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">
                       {selectedUser.email}
                    </span>
                    {selectedUser.role === 'teacher' && (
                       <span className="bg-blue-600/20 text-blue-400 border border-blue-500/20 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">
                          {selectedUser.businessLine || 'All Programs'}
                       </span>
                    )}
                  </div>
               </div>

               <div className="flex-1 p-10 max-h-[70vh] md:max-h-[600px] overflow-y-auto space-y-8 custom-scrollbar">
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3 italic">
                        <UserIcon className="w-4 h-4 text-blue-500" /> Profil Pribadi
                     </h4>
                     <div className="grid grid-cols-2 gap-x-8 gap-y-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Jenis Kelamin</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{selectedUser.gender === 'L' ? 'Laki-laki' : selectedUser.gender === 'P' ? 'Perempuan' : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kontak</p>
                          <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-2">
                             <Phone className="w-3 h-3 text-emerald-500" /> {selectedUser.phoneNumber || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tempat Lahir</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{selectedUser.birthPlace || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tanggal Lahir</p>
                          <p className="text-sm font-bold text-gray-900 mt-1 italic">{selectedUser.birthDate || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Alamat Domisili</p>
                          <p className="text-sm font-bold text-gray-900 mt-1 leading-relaxed">{selectedUser.address || '-'}</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3 italic">
                        <GraduationCap className="w-4 h-4 text-indigo-500" /> Latar Belakang & Spesialisasi
                     </h4>
                     <div className="space-y-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pendidikan</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{selectedUser.education || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Spesialisasi</p>
                          <p className="text-sm font-bold text-indigo-600 mt-1 uppercase tracking-wider">{selectedUser.specialization || '-'}</p>
                        </div>
                     </div>
                  </div>

                  {selectedUser.role === 'teacher' && (
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3 italic">
                           <Briefcase className="w-4 h-4 text-amber-500" /> Tugas & Tanggung Jawab
                        </h4>
                        <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Siswa yang Ditangani</p>
                           <div className="flex flex-wrap gap-2">
                              {selectedUser.assignedStudentIds && selectedUser.assignedStudentIds.length > 0 ? (
                                 selectedUser.assignedStudentIds.map(id => {
                                    const s = students.find(std => std.id === id);
                                    return s ? (
                                       <div key={id} className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-3 shadow-sm">
                                          <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase">
                                             {s.name.charAt(0)}
                                          </div>
                                          <p className="text-[11px] font-black text-gray-700 uppercase tracking-tight italic">{s.name}</p>
                                       </div>
                                    ) : null;
                                 })
                              ) : (
                                 <p className="text-[10px] font-bold text-gray-300 italic">Belum ada tugas siswa</p>
                              )}
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
