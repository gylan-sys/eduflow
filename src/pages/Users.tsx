import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { initializeApp, deleteApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, firebaseConfig } from '../lib/firebase';
import { UserProfile, UserRole, BusinessLine, Student } from '../types';
import { 
  Users as UsersIcon, 
  Shield, 
  UserCircle, 
  Baby, 
  MoreVertical, 
  Search, 
  UserPlus,
  ShieldCheck,
  GraduationCap,
  Waves,
  Briefcase,
  X,
  Mail,
  Lock,
  User as UserIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export const Users: React.FC = () => {
  const { profile: currentUser } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Assignment state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<UserProfile | null>(null);

  // New User Form State
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'teacher' as UserRole,
    businessLine: 'shadow' as BusinessLine
  });

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ ...doc.data() })) as UserProfile[]);
      setLoading(false);
    });

    const qStudents = query(collection(db, 'students'));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[]);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeStudents();
    };
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    let secondaryApp;
    try {
      // Initialize a secondary Firebase app to create user without signing out current admin
      const appName = `SecondaryApp_${Date.now()}`;
      secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);

      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth, 
        newUser.email, 
        newUser.password
      );

      const uid = userCredential.user.uid;

      // 2. Create Firestore Profile
      const profileData: UserProfile = {
        uid,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        businessLine: newUser.businessLine
      };

      await setDoc(doc(db, 'users', uid), profileData);

      // 3. Sign out from secondary app and cleanup
      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      setIsAddModalOpen(false);
      setNewUser({
        email: '',
        password: '',
        displayName: '',
        role: 'teacher',
        businessLine: 'shadow'
      });
    } catch (err: any) {
      console.error("Error creating user:", err);
      let message = "Gagal membuat user baru.";
      if (err.code === 'auth/email-already-in-use') {
        message = "Email ini sudah terdaftar. Gunakan email lain.";
      } else if (err.code === 'auth/weak-password') {
        message = "Password terlalu lemah. Gunakan minimal 6 karakter.";
      } else if (err.code === 'auth/invalid-email') {
        message = "Format email tidak valid.";
      } else if (err.message.includes('permission')) {
        message = "Maaf, Anda tidak memiliki izin untuk melakukan ini.";
      }
      setError(message);
      if (secondaryApp) await deleteApp(secondaryApp);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (uid: string, role: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
    } catch (error) {
      console.error("Error updating role:", error);
    }
  };

  const handleUpdateBusinessLine = async (uid: string, line: BusinessLine) => {
    try {
      await updateDoc(doc(db, 'users', uid), { businessLine: line });
    } catch (error) {
      console.error("Error updating business line:", error);
    }
  };

  const handleAssignStudent = async (uid: string, studentId: string, currentIds: string[] = []) => {
    try {
      const newIds = currentIds.includes(studentId) 
        ? currentIds.filter(id => id !== studentId)
        : [...currentIds, studentId].slice(0, 2);
      
      await updateDoc(doc(db, 'users', uid), { assignedStudentIds: newIds });
    } catch (error) {
      console.error("Error assigning student:", error);
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
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen User</h2>
          <p className="text-gray-500">Kelola peran dan hak akses untuk Guru, Orang Tua, dan Admin.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-100 active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          <span>Tambah User Manual</span>
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari nama atau email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border-none pl-12 pr-4 py-3 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identitas</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Peran (Role)</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bidang & Murid</th>
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-400">Memuat data...</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName}`} 
                        className="w-10 h-10 rounded-xl border border-gray-100 shadow-sm"
                        alt={user.displayName}
                      />
                      <div>
                        <p className="font-bold text-gray-900 tracking-tight">{user.displayName}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateRole(user.uid, e.target.value as UserRole)}
                        className={cn(
                          "text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-none focus:ring-2 focus:ring-offset-1 outline-none transition-all cursor-pointer",
                          user.role === 'admin' ? "bg-red-50 text-red-600 focus:ring-red-100" :
                          user.role === 'teacher' ? "bg-blue-50 text-blue-600 focus:ring-blue-100" :
                          "bg-emerald-50 text-emerald-600 focus:ring-emerald-100"
                        )}
                      >
                        <option value="parent">Orang Tua</option>
                        <option value="teacher">Guru</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === 'teacher' && (
                      <div className="space-y-2">
                        <select
                          value={user.businessLine || 'both'}
                          onChange={(e) => handleUpdateBusinessLine(user.uid, e.target.value as BusinessLine)}
                          className="w-full text-[10px] font-black uppercase tracking-widest bg-gray-50 text-gray-600 px-3 py-1.5 rounded-xl border-none focus:ring-2 focus:ring-gray-200 outline-none cursor-pointer"
                        >
                          <option value="shadow">Shadow Teacher</option>
                          <option value="swimming">Les Renang</option>
                          <option value="both">Keduanya</option>
                        </select>
                        <div className="flex flex-wrap gap-1">
                          {user.assignedStudentIds?.map(sid => (
                            <span key={sid} className="text-[9px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold uppercase truncate max-w-[80px]">
                              {students.find(s => s.id === sid)?.name || sid}
                            </span>
                          ))}
                          {(user.assignedStudentIds?.length || 0) < 2 && (
                            <button 
                              onClick={() => {
                                setSelectedTeacher(user);
                                setIsAssignModalOpen(true);
                              }}
                              className="text-[9px] bg-gray-100 text-gray-400 hover:text-gray-600 px-2 py-0.5 rounded-md font-bold uppercase transition-colors"
                            >
                              + Murid
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-gray-300 hover:text-gray-900 transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 p-6 rounded-[2.5rem] flex flex-col md:flex-row gap-6 items-center">
        <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-100">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="font-bold text-blue-900 tracking-tight">Privasi & Keamanan</h4>
          <p className="text-sm text-blue-700 font-medium">Hanya Admin yang dapat mengubah peran atau menambah user. Akun yang dibuat akan langsung dapat masuk menggunakan email dan password yang Anda tentukan.</p>
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
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white">
                <div>
                  <h3 className="text-xl font-bold tracking-tight leading-tight">Tambah User Baru</h3>
                  <p className="text-blue-100 text-xs font-medium">Buat akun untuk guru atau orang tua secara manual.</p>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)} 
                  className="hover:bg-white/10 p-2 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="p-8 space-y-5">
                {error && (
                  <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-2xl border border-red-100">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Nama Lengkap</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        required 
                        value={newUser.displayName}
                        onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                        className="w-full bg-gray-50 border-none pl-12 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                        placeholder="Contoh: Siti Aminah"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Alamat Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="email" 
                        required 
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        className="w-full bg-gray-50 border-none pl-12 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Password Awal</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="password" 
                        required 
                        minLength={6}
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="w-full bg-gray-50 border-none pl-12 pr-4 py-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
                        placeholder="Minimal 6 karakter"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Peran (Role)</label>
                      <select 
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value as any})}
                        className="w-full bg-gray-50 border-none px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                      >
                        <option value="parent">Orang Tua</option>
                        <option value="teacher">Guru</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Lini Bisnis</label>
                      <select 
                        disabled={newUser.role !== 'teacher'}
                        value={newUser.businessLine}
                        onChange={(e) => setNewUser({...newUser, businessLine: e.target.value as any})}
                        className="w-full bg-gray-50 border-none px-4 py-3.5 rounded-2xl text-sm font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <option value="shadow">Shadow</option>
                        <option value="swimming">Swimming</option>
                        <option value="both">Keduanya</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-black text-sm uppercase tracking-widest py-4 rounded-[1.5rem] shadow-xl shadow-blue-100 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Daftarkan Akun</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Assign Student Modal */}
      <AnimatePresence>
        {isAssignModalOpen && selectedTeacher && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-900 text-white">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Pilih Murid</h3>
                  <p className="text-gray-400 text-xs font-medium">Assign ke {selectedTeacher.displayName}</p>
                </div>
                <button 
                  onClick={() => setIsAssignModalOpen(false)} 
                  className="hover:bg-white/10 p-2 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-8 space-y-2 max-h-[400px] overflow-y-auto">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Daftar Siswa (Maks 2)</p>
                {students.map(student => {
                  const isAssigned = selectedTeacher.assignedStudentIds?.includes(student.id);
                  const isFull = (selectedTeacher.assignedStudentIds?.length || 0) >= 2;
                  
                  return (
                    <button
                      key={student.id}
                      disabled={!isAssigned && isFull}
                      onClick={() => handleAssignStudent(selectedTeacher.uid, student.id, selectedTeacher.assignedStudentIds)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                        isAssigned 
                          ? "bg-blue-50 border-blue-200 text-blue-900" 
                          : "bg-gray-50 border-gray-100 text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      )}
                    >
                      <div>
                        <p className="font-bold uppercase text-xs tracking-tight">{student.name}</p>
                        <p className="text-[10px] opacity-60 uppercase font-black">{student.type}</p>
                      </div>
                      {isAssigned && <ShieldCheck className="w-5 h-5 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
