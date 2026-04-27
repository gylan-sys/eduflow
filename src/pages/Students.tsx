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
  Trash2,
  MessageSquare,
  Edit2,
  Camera,
  User as UserIcon,
  MapPin,
  Heart,
  Activity,
  Book,
  HeartPulse,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../lib/api';
import { useSettings } from '../contexts/SettingsContext';
import { translations } from '../constants/translations';
import { validateEmail, validatePhone, isDateInPast } from '../lib/validation';

export const Students: React.FC = () => {
  const { profile, activeBusinessLine } = useAuth();
  const { settings: appSettings } = useSettings();
  
  const lang = appSettings.language || 'id';
  const t = translations[lang];

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Add new student form state
  const [newStudent, setNewStudent] = useState({
    id: '',
    name: '',
    parentName: '',
    phone: '',
    email: '',
    educationLevel: '',
    type: (activeBusinessLine === 'both' ? 'shadow' : activeBusinessLine) as any,
    photoUrl: '',
    address: '',
    gender: 'L' as 'L' | 'P',
    hobbies: '',
    emergencyContact: '',
    religion: '',
    placeOfBirth: '',
    dateOfBirth: '',
    notes: ''
  });

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
    
    // Validation
    if (newStudent.email && !validateEmail(newStudent.email)) {
      alert("Format email tidak valid");
      return;
    }
    if (newStudent.phone && !validatePhone(newStudent.phone)) {
      alert("Format nomor telepon tidak valid. Gunakan format 08..., 62..., atau +62...");
      return;
    }
    if (newStudent.dateOfBirth && !isDateInPast(newStudent.dateOfBirth)) {
      alert("Tanggal lahir tidak boleh di masa depan");
      return;
    }

    try {
      await fetchApi('/api/students', {
        method: 'POST',
        body: JSON.stringify({ ...newStudent, id: editStudent?.id || newStudent.id })
      });
      setIsAddModalOpen(false);
      setEditStudent(null);
      setNewStudent({ 
        id: '',
        name: '', 
        parentName: '', 
        phone: '', 
        email: '', 
        educationLevel: '',
        type: (activeBusinessLine === 'both' ? 'shadow' : activeBusinessLine) as any,
        photoUrl: '',
        address: '',
        gender: 'L',
        hobbies: '',
        emergencyContact: '',
        religion: '',
        placeOfBirth: '',
        dateOfBirth: '',
        notes: ''
      });
      fetchStudents();
    } catch (error) {
      console.error("Error saving student:", error);
      alert("Gagal menyimpan data siswa");
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
        setNewStudent(prev => ({ ...prev, photoUrl: data.url }));
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Gagal mengunggah foto.");
    } finally {
      setUploading(false);
    }
  };

  const handleEditClick = (student: Student) => {
    setEditStudent(student);
    setNewStudent({
      id: student.id,
      name: student.name,
      parentName: student.parentName || '',
      phone: student.phone || '',
      email: student.email || '',
      educationLevel: student.educationLevel || '',
      type: student.type,
      photoUrl: student.photoUrl || '',
      address: student.address || '',
      gender: (student.gender as any) || 'L',
      hobbies: student.hobbies || '',
      emergencyContact: student.emergencyContact || '',
      religion: student.religion || '',
      placeOfBirth: student.placeOfBirth || '',
      dateOfBirth: student.dateOfBirth || '',
      notes: student.notes || ''
    });
    setIsAddModalOpen(true);
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

  const [selectedType, setSelectedType] = useState<'all' | 'shadow' | 'swimming'>('all');

  const filteredStudents = students.filter(s => {
    // Teachers only see their assigned students
    if (profile?.role === 'teacher') {
      const assignedIds = profile.assignedStudentIds || [];
      if (!assignedIds.includes(s.id)) return false;
    }

    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'all' || s.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight italic uppercase">
            {t.students_data}
          </h1>
          <p className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-500" /> {t.database_growth}
          </p>
        </div>
        {profile?.role === 'admin' && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.2rem] transition-all shadow-xl shadow-gray-200 text-[10px] font-black uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" />
            <span>{t.new_student}</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={t.search_student} 
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 pl-11 pr-4 py-3.5 rounded-[1.2rem] text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-all shadow-inner"
            />
          </div>
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 shrink-0 w-full sm:w-auto">
            <button 
              onClick={() => setSelectedType('all')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                selectedType === 'all' ? "bg-gray-900 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              Semua
            </button>
            <button 
              onClick={() => setSelectedType('shadow')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                selectedType === 'shadow' ? "bg-blue-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              Shadow
            </button>
            <button 
              onClick={() => setSelectedType('swimming')}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                selectedType === 'swimming' ? "bg-emerald-600 text-white shadow-lg" : "text-gray-400 hover:bg-gray-50"
              )}
            >
              Renang
            </button>
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.students}</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.program}</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.parent_name}</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.contact}</th>
                <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-black uppercase tracking-widest text-xs animate-pulse">{t.loading_database}</td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <Users className="w-12 h-12 text-gray-200" />
                      <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">{t.no_students}</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {student.photoUrl ? (
                         <img src={student.photoUrl} alt={student.name} className="w-12 h-12 rounded-2xl object-cover border border-indigo-100 shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg shadow-sm border border-indigo-100">
                          {student.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-gray-900 uppercase tracking-tighter text-base italic">{student.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{student.educationLevel || 'General'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                      student.type === 'shadow' ? "bg-blue-50 text-blue-600 border-blue-100" : 
                      "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>
                      {student.type === 'shadow' ? <GraduationCap className="w-3 h-3" /> : <Waves className="w-3 h-3" />}
                      {student.type === 'shadow' ? t.shadow : t.swimming}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-bold text-gray-600">
                    {student.parentName || '-'}
                  </td>
                  <td className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-300" />
                      {student.phone || '-'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button 
                        onClick={() => { setSelectedStudent(student); setIsDetailModalOpen(true); }}
                        className="p-3 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Lihat Biodata Lengkap"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {student.phone && (
                        <a 
                          href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 text-gray-300 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </a>
                      )}
                      <button 
                        onClick={() => handleEditClick(student)}
                        className="p-3 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(student.id)}
                        className="p-3 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card List */}
        <div className="sm:hidden grid grid-cols-1 divide-y divide-gray-50">
          {loading ? (
             <div className="p-10 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">{t.loading_database.replace('...', '')}</div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-10 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.no_students}</div>
          ) : filteredStudents.map((student) => (
             <div key={student.id} className="p-5 space-y-4 active:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black text-lg shadow-sm border border-indigo-100 shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                         <h4 className="font-black text-gray-900 uppercase tracking-tighter truncate italic">{student.name}</h4>
                         <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{student.educationLevel || 'General'}</p>
                      </div>
                   </div>
                    <div className="flex items-center gap-2">
                       <button 
                        onClick={() => { setSelectedStudent(student); setIsDetailModalOpen(true); }}
                        className="p-2.5 text-gray-300 hover:text-emerald-600 rounded-xl"
                       >
                         <Eye className="w-4 h-4" />
                       </button>
                       <button 
                        onClick={() => handleEditClick(student)}
                        className="p-2.5 text-gray-300 hover:text-indigo-600 rounded-xl"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                       <button 
                        onClick={() => handleDelete(student.id)}
                        className="p-2.5 text-gray-300 hover:text-red-600 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                 </div>
                 <div className="flex items-center justify-between gap-4 pt-2">
                   <span className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                      student.type === 'shadow' ? "bg-blue-50 text-blue-600 border-blue-100" : 
                      "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>
                      {student.type === 'shadow' ? <GraduationCap className="w-3 h-3" /> : <Waves className="w-3 h-3" />}
                      {student.type === 'shadow' ? t.shadow : t.swimming}
                    </span>
                    <div className="flex flex-col items-end">
                       <div className="flex items-center gap-2">
                         {student.phone && (
                           <a 
                             href={`https://wa.me/${student.phone.replace(/[^0-9]/g, '')}`}
                             target="_blank"
                             rel="noreferrer"
                             className="text-emerald-500"
                           >
                             <MessageSquare className="w-3 h-3" />
                           </a>
                         )}
                         <span className="text-[10px] font-black text-gray-900">{student.parentName || '-'}</span>
                       </div>
                       <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{student.phone || '-'}</span>
                    </div>
                 </div>
             </div>
          ))}
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
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-900 text-white">
                <h3 className="text-xl font-black italic uppercase tracking-tighter shadow-sm">{editStudent ? 'Edit Data Siswa' : t.new_student}</h3>
                <button onClick={() => { 
                  setIsAddModalOpen(false); 
                  setEditStudent(null);
                  setNewStudent({ 
                    id: '',
                    name: '', 
                    parentName: '', 
                    phone: '', 
                    email: '', 
                    educationLevel: '',
                    type: (activeBusinessLine === 'both' ? 'shadow' : activeBusinessLine) as any,
                    photoUrl: '',
                    address: '',
                    gender: 'L',
                    hobbies: '',
                    emergencyContact: '',
                    religion: '',
                    placeOfBirth: '',
                    dateOfBirth: '',
                    notes: ''
                  });
                }} className="hover:bg-white/10 p-1 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddStudent} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Photo Upload Section */}
                <div className="flex flex-col items-center gap-4 py-2">
                   <div className="relative group">
                     {newStudent.photoUrl ? (
                        <img src={newStudent.photoUrl} alt="Preview" className="w-24 h-24 rounded-[2rem] object-cover border-4 border-indigo-50 shadow-lg" />
                     ) : (
                        <div className="w-24 h-24 bg-gray-50 rounded-[2rem] flex items-center justify-center border-4 border-dashed border-gray-200 text-gray-300 group-hover:text-indigo-400 group-hover:border-indigo-200 transition-all">
                           <UserIcon className="w-10 h-10" />
                        </div>
                     )}
                     <label className="absolute -bottom-2 -right-2 bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg cursor-pointer hover:scale-110 active:scale-95 transition-all">
                        <Camera className="w-4 h-4" />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                     </label>
                     {uploading && (
                       <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] rounded-[2rem] flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                       </div>
                     )}
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Foto Siswa</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl space-y-4">
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 italic">
                      <UserIcon className="w-3 h-3" /> Informasi Dasar
                    </p>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nama Lengkap</label>
                      <input 
                        type="text" 
                        required 
                        value={newStudent.name || ''}
                        onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                        className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors text-sm font-bold" 
                        placeholder={t.full_name}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Jenis Kelamin</label>
                        <select 
                          value={newStudent.gender}
                          onChange={(e) => setNewStudent({...newStudent, gender: e.target.value as any})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors cursor-pointer text-sm font-bold"
                        >
                          <option value="L">Laki-laki</option>
                          <option value="P">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">{t.program_type}</label>
                        <select 
                          value={newStudent.type}
                          onChange={(e) => setNewStudent({...newStudent, type: e.target.value as any})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors cursor-pointer text-sm font-bold"
                        >
                          <option value="shadow">{t.shadow}</option>
                          <option value="swimming">{t.swimming}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl space-y-4">
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 italic">
                      <Calendar className="w-3 h-3" /> Kelahiran & Agama
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Tempat Lahir</label>
                        <input 
                          type="text" 
                          value={newStudent.placeOfBirth || ''}
                          onChange={(e) => setNewStudent({...newStudent, placeOfBirth: e.target.value})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors text-sm font-bold" 
                          placeholder="Ex: Jakarta"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Tanggal Lahir</label>
                        <input 
                          type="date" 
                          value={newStudent.dateOfBirth || ''}
                          onChange={(e) => setNewStudent({...newStudent, dateOfBirth: e.target.value})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors text-sm font-bold" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Agama</label>
                      <input 
                        type="text" 
                        value={newStudent.religion || ''}
                        onChange={(e) => setNewStudent({...newStudent, religion: e.target.value})}
                        className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors text-sm font-bold" 
                        placeholder="Ex: Islam, Kristen, dll"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl space-y-4">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 italic">
                      <Phone className="w-3 h-3" /> Kontak & Alamat
                    </p>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Nama Orang Tua</label>
                      <input 
                        type="text" 
                        value={newStudent.parentName || ''}
                        onChange={(e) => setNewStudent({...newStudent, parentName: e.target.value})}
                        className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors text-sm font-bold" 
                        placeholder={t.parent_name}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">No. HP Orang Tua</label>
                        <input 
                          type="text" 
                          value={newStudent.phone || ''}
                          onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                          className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors text-sm font-bold" 
                          placeholder="0812..."
                        />
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Kontak Darurat</label>
                         <input 
                           type="text" 
                           value={newStudent.emergencyContact || ''}
                           onChange={(e) => setNewStudent({...newStudent, emergencyContact: e.target.value})}
                           className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors text-sm font-bold" 
                           placeholder="Nama - No. HP"
                         />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Alamat Domisili</label>
                      <textarea 
                        value={newStudent.address || ''}
                        onChange={(e) => setNewStudent({...newStudent, address: e.target.value})}
                        className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors text-sm font-bold resize-none h-20" 
                        placeholder="Jl. Contoh No. 123..."
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl space-y-4">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2 italic">
                      <HeartPulse className="w-3 h-3" /> Lainnya
                    </p>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Tingkat Pendidikan</label>
                      <input 
                        type="text" 
                        value={newStudent.educationLevel || ''}
                        onChange={(e) => setNewStudent({...newStudent, educationLevel: e.target.value})}
                        className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors text-sm font-bold" 
                        placeholder="Ex: SD Kelas 3"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Hobi / Minat</label>
                      <input 
                        type="text" 
                        value={newStudent.hobbies || ''}
                        onChange={(e) => setNewStudent({...newStudent, hobbies: e.target.value})}
                        className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors text-sm font-bold" 
                        placeholder="Ex: Menggambar, Berenang"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 px-1">Catatan Tambahan</label>
                      <textarea 
                        value={newStudent.notes || ''}
                        onChange={(e) => setNewStudent({...newStudent, notes: e.target.value})}
                        className="w-full bg-white border border-gray-100 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors text-sm font-bold resize-none h-20" 
                        placeholder="Informasi penting lainnya..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 transition-all">
                    {t.save_student}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Detail Modal */}
      <AnimatePresence>
        {isDetailModalOpen && selectedStudent && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-3xl overflow-hidden flex flex-col md:flex-row relative"
            >
               <button 
                onClick={() => setIsDetailModalOpen(false)} 
                className="absolute top-6 right-6 z-10 p-3 bg-white/20 hover:bg-white/40 text-white md:text-gray-400 md:bg-gray-100 md:hover:bg-gray-200 rounded-2xl transition-all"
               >
                 <X className="w-6 h-6" />
               </button>

               <div className="w-full md:w-1/3 bg-gray-900 p-10 flex flex-col items-center justify-center space-y-6 text-center">
                  <div className="relative">
                    {selectedStudent.photoUrl ? (
                      <img src={selectedStudent.photoUrl} alt={selectedStudent.name} className="w-32 h-32 rounded-[2.5rem] object-cover ring-4 ring-white/10" />
                    ) : (
                      <div className="w-32 h-32 bg-gray-800 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white/20 ring-4 ring-white/10">
                        {selectedStudent.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute -bottom-2 -right-2 bg-indigo-500 p-3 rounded-2xl text-white shadow-xl">
                       <UserIcon className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-tight">{selectedStudent.name}</h3>
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1 italic">{selectedStudent.educationLevel || 'General'}</p>
                  </div>
                  <div className={cn(
                    "px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border border-white/5",
                    selectedStudent.type === 'shadow' ? "bg-blue-600/20 text-blue-400" : "bg-emerald-600/20 text-emerald-400"
                  )}>
                    {selectedStudent.type === 'shadow' ? 'Shadow Teacher' : 'Swimming Program'}
                  </div>
               </div>

               <div className="flex-1 p-10 max-h-[70vh] md:max-h-[600px] overflow-y-auto space-y-8 custom-scrollbar">
                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3 italic">
                        <UserIcon className="w-4 h-4 text-indigo-500" /> Biodata Lengkap
                     </h4>
                     <div className="grid grid-cols-2 gap-x-8 gap-y-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Jenis Kelamin</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{selectedStudent.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Agama</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{selectedStudent.religion || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tempat Lahir</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{selectedStudent.placeOfBirth || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tanggal Lahir</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{selectedStudent.dateOfBirth || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Alamat</p>
                          <p className="text-sm font-bold text-gray-900 mt-1 leading-relaxed">{selectedStudent.address || '-'}</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3 italic">
                        <Phone className="w-4 h-4 text-emerald-500" /> Kontak Orang Tua
                     </h4>
                     <div className="grid grid-cols-2 gap-x-8 gap-y-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nama Wali</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{selectedStudent.parentName || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</p>
                          <p className="text-sm font-bold text-emerald-600 mt-1">{selectedStudent.phone || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kontak Darurat</p>
                          <p className="text-sm font-bold text-red-600 mt-1 italic uppercase tracking-wider">{selectedStudent.emergencyContact || '-'}</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3 italic">
                        <HeartPulse className="w-4 h-4 text-amber-500" /> Informasi Pendukung
                     </h4>
                     <div className="space-y-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hobi / Minat</p>
                          <p className="text-sm font-bold text-gray-900 mt-1">{selectedStudent.hobbies || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Catatan Medis / Khusus</p>
                          <p className="text-sm font-bold text-gray-600 mt-1 leading-relaxed italic">{selectedStudent.notes || '-'}</p>
                        </div>
                     </div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
