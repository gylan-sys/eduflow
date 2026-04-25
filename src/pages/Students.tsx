import React, { useEffect, useState } from 'react';
import { Student } from '../types';
import { 
  Users, 
  Search, 
  Plus, 
  MoreVertical, 
  GraduationCap, 
  Waves,
  X,
  Phone,
  Calendar,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../lib/api';

export const Students: React.FC = () => {
  const { profile, activeBusinessLine } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Add new student form state
  const [newStudent, setNewStudent] = useState({
    name: '',
    parentName: '',
    phone: '',
    email: '',
    educationLevel: '',
    type: (activeBusinessLine === 'both' ? 'shadow' : activeBusinessLine) as any
  });

  const fetchStudents = async () => {
    try {
      const data = await fetchApi('/api/students');
      setStudents(data);
    } catch (err) {
      console.error("Fetch students error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/api/students', {
        method: 'POST',
        body: JSON.stringify(newStudent)
      });
      setIsAddModalOpen(false);
      setNewStudent({ 
        name: '', 
        parentName: '', 
        phone: '', 
        email: '', 
        educationLevel: '',
        type: (activeBusinessLine === 'both' ? 'shadow' : activeBusinessLine) as any 
      });
      fetchStudents();
    } catch (error) {
      console.error("Error adding student:", error);
      alert("Gagal menambah siswa");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus siswa ini?")) return;
    try {
      await fetchApi(`/api/students/${id}`, { method: 'DELETE' });
      fetchStudents();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    // Note: Local DB schema matches the structure I'll use
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Daftar Siswa</h2>
          <p className="text-gray-500">Kelola informasi dan perkembangan siswa Anda (Local Store).</p>
        </div>
        {profile?.role === 'admin' && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-100"
          >
            <Plus className="w-5 h-5" />
            <span>Siswa Baru</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari nama siswa..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tipe Program</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Orang Tua</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Kontak</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Memuat data...</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <Users className="w-8 h-8 text-gray-300" />
                      <p className="text-gray-500 font-medium">Belum ada data siswa</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 uppercase tracking-tight">{student.name}</p>
                        <p className="text-xs text-gray-500">{student.educationLevel || 'Tidak Spesifik'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shadow-sm",
                      student.type === 'shadow' ? "bg-blue-50 text-blue-600" : 
                      "bg-emerald-50 text-emerald-600"
                    )}>
                      {student.type === 'shadow' ? <GraduationCap className="w-3 h-3" /> : <Waves className="w-3 h-3" />}
                      <span className="capitalize">{student.type === 'shadow' ? 'Shadow Teacher' : 'Les Renang'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">
                    {student.parentName || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-500">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3 h-3 opacity-40" />
                      {student.phone || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(student.id)}
                      className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white">
                <h3 className="text-xl font-bold tracking-tight">Siswa Baru</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="hover:bg-white/10 p-1 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddStudent} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required 
                    value={newStudent.name}
                    onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-colors" 
                    placeholder="Nama Siswa"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Jenjang Pend.</label>
                    <input 
                      type="text" 
                      value={newStudent.educationLevel}
                      onChange={(e) => setNewStudent({...newStudent, educationLevel: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-colors" 
                      placeholder="Contoh: SD"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tipe Program</label>
                    <select 
                      value={newStudent.type}
                      onChange={(e) => setNewStudent({...newStudent, type: e.target.value as any})}
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-colors cursor-pointer"
                    >
                      <option value="shadow">Shadow Teacher</option>
                      <option value="swimming">Les Renang</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Nama Orang Tua</label>
                  <input 
                    type="text" 
                    value={newStudent.parentName}
                    onChange={(e) => setNewStudent({...newStudent, parentName: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-colors" 
                    placeholder="Nama Orang Tua"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">No. HP Orang Tua</label>
                  <input 
                    type="text" 
                    value={newStudent.phone}
                    onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-colors" 
                    placeholder="Contoh: 0812..."
                  />
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 transition-all">
                    Simpan Data Siswa
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
