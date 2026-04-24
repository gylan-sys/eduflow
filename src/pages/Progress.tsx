import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProgressReport, Student } from '../types';
import { 
  LineChart, 
  Plus, 
  Search, 
  Filter, 
  Star, 
  MessageSquare, 
  Calendar,
  X,
  Target,
  Smile,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

export const Progress: React.FC = () => {
  const { profile, activeBusinessLine } = useAuth();
  const [reports, setReports] = useState<ProgressReport[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [newReport, setNewReport] = useState({
    studentId: '',
    content: '',
    metrics: {
      focus: 3,
      social: 3,
      skill: 3
    }
  });

  useEffect(() => {
    const qReports = query(collection(db, 'progressReports'));
    const unsubscribeReports = onSnapshot(qReports, (snapshot) => {
      const allReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ProgressReport[];
      
      // Filter for teachers: only show reports for their assigned students
      if (profile?.role === 'teacher' && profile.assignedStudentIds) {
        setReports(allReports.filter(r => profile.assignedStudentIds?.includes(r.studentId)));
      } else {
        setReports(allReports);
      }
      setLoading(false);
    });

    const qStudents = query(collection(db, 'students'));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      const allStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
      
      let filteredStudents = allStudents.filter(s => 
        activeBusinessLine === 'both' || s.type === activeBusinessLine || s.type === 'both'
      );

      // If teacher, prioritize assigned students
      if (profile?.role === 'teacher' && profile.assignedStudentIds) {
        filteredStudents = filteredStudents.filter(s => profile.assignedStudentIds?.includes(s.id));
      }

      setStudents(filteredStudents);
    });

    return () => {
      unsubscribeReports();
      unsubscribeStudents();
    };
  }, [activeBusinessLine, profile]);

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const student = students.find(s => s.id === newReport.studentId);
      if (!student) return;

      await addDoc(collection(db, 'progressReports'), {
        ...newReport,
        parentId: student.parentId,
        teacherId: profile?.displayName || 'Guru',
        date: serverTimestamp()
      });
      setIsModalOpen(false);
      setNewReport({ studentId: '', content: '', metrics: { focus: 3, social: 3, skill: 3 } });
    } catch (error) {
      console.error("Error creating report:", error);
    }
  };

  const filteredReports = reports.filter(r => {
    const student = students.find(s => s.id === r.studentId);
    if (!student) return false; // If student is filtered out by business line, so is the report
    
    if (selectedStudentId) return r.studentId === selectedStudentId;
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Perkembangan</h2>
          <p className="text-gray-500">Pantau kemajuan akademik dan keterampilan siswa.</p>
        </div>
        {profile?.role !== 'parent' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100"
          >
            <Plus className="w-5 h-5" />
            <span>Buat Laporan</span>
          </button>
        )}
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        <button 
          onClick={() => setSelectedStudentId('')}
          className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap", !selectedStudentId ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-white text-gray-500 border border-gray-100")}
        >
          Semua Siswa
        </button>
        {students.map(s => (
          <button 
            key={s.id}
            onClick={() => setSelectedStudentId(s.id)}
            className={cn("px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap", selectedStudentId === s.id ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" : "bg-white text-gray-500 border border-gray-100")}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-300">
            <LineChart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-400 font-bold tracking-tight uppercase text-xs">Belum ada laporan masuk</p>
          </div>
        ) : filteredReports.sort((a, b) => (b.date?.seconds || 0) - (a.date?.seconds || 0)).map((report) => (
          <ReportCard key={report.id} report={report} studentName={students.find(s => s.id === report.studentId)?.name || report.studentId} />
        ))}
      </div>

      {/* Add Report Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
                <h3 className="text-xl font-bold tracking-tight">Buat Laporan Baru</h3>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddReport} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Pilih Siswa</label>
                  <select 
                    required
                    value={newReport.studentId}
                    onChange={(e) => setNewReport({...newReport, studentId: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors cursor-pointer"
                  >
                    <option value="">Pilih Siswa</option>
                    {students
                      .filter(s => {
                        // If teacher, only show assigned students
                        if (profile?.role === 'teacher' && profile.assignedStudentIds) {
                          return profile.assignedStudentIds.includes(s.id);
                        }
                        return true;
                      })
                      .map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                    }
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <MetricInput 
                    label="Fokus" 
                    value={newReport.metrics.focus} 
                    onChange={(val) => setNewReport({...newReport, metrics: {...newReport.metrics, focus: val}})} 
                    icon={Target}
                  />
                   <MetricInput 
                    label="Sosial" 
                    value={newReport.metrics.social} 
                    onChange={(val) => setNewReport({...newReport, metrics: {...newReport.metrics, social: val}})} 
                    icon={Smile}
                  />
                   <MetricInput 
                    label="Skill" 
                    value={newReport.metrics.skill} 
                    onChange={(val) => setNewReport({...newReport, metrics: {...newReport.metrics, skill: val}})} 
                    icon={ShieldCheck}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Konten Laporan</label>
                  <textarea 
                    required
                    rows={4}
                    value={newReport.content}
                    onChange={(e) => setNewReport({...newReport, content: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-indigo-500 outline-none transition-colors"
                    placeholder="Deskripsikan kemajuan siswa hari ini..."
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 transition-all">
                    Simpan Laporan
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

const MetricInput = ({ label, value, onChange, icon: Icon }: any) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2 text-gray-400">
      <Icon className="w-3.5 h-3.5" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </div>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button 
          key={s} 
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            "w-full h-8 rounded-md transition-all flex items-center justify-center border",
            value >= s ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-100 text-gray-300"
          )}
        >
          <span className="text-[10px] font-bold">{s}</span>
        </button>
      ))}
    </div>
  </div>
);

const ReportCard = ({ report, studentName }: { report: ProgressReport, studentName: string, key?: any }) => {
  const date = report.date?.toDate ? report.date.toDate() : new Date();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
    >
      <div className="p-6 bg-indigo-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
             <Star className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 tracking-tight uppercase">{studentName}</p>
            <p className="text-xs text-gray-500">{format(date, 'd MMMM yyyy (HH:mm)', { locale: idLocale })}</p>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-end">
           <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Guru</p>
           <p className="text-xs font-bold text-gray-700">{report.teacherId}</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-3">
          <ReportMetric label="Fokus" value={report.metrics?.focus || 0} color="blue" />
          <ReportMetric label="Sosial" value={report.metrics?.social || 0} color="emerald" />
          <ReportMetric label="Skill" value={report.metrics?.skill || 0} color="purple" />
        </div>

        <div className="space-y-2">
           <div className="flex items-center gap-2 text-gray-400">
             <MessageSquare className="w-4 h-4" />
             <span className="text-[10px] font-black uppercase tracking-widest">Konten Laporan</span>
           </div>
           <p className="text-sm text-gray-600 leading-relaxed font-medium">
             {report.content}
           </p>
        </div>

        <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
           <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors">
              Lihat Detail Lengkap <ChevronRight className="w-3.5 h-3.5" />
           </button>
           <button className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors">
              Beri Kompatemen <MessageSquare className="w-3.5 h-3.5" />
           </button>
        </div>
      </div>
    </motion.div>
  );
};

const ReportMetric = ({ label, value, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-600',
    emerald: 'bg-emerald-600',
    purple: 'bg-indigo-600'
  };

  return (
    <div className="space-y-1.5">
       <div className="flex justify-between items-center px-1">
         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
         <span className="text-[10px] font-black text-gray-900">{value}/5</span>
       </div>
       <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
         <div className={cn("h-full rounded-full", colors[color])} style={{ width: `${(value / 5) * 100}%` }}></div>
       </div>
    </div>
  );
};
