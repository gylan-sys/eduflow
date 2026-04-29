import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { 
  ClipboardCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  UserX, 
  Calendar,
  LogIn,
  LogOut,
  History,
  AlertCircle,
  Camera,
  RefreshCw,
  LineChart
} from 'lucide-react';
import { format } from 'date-fns';
import { useSettings } from '../contexts/SettingsContext';
import { translations } from '../constants/translations';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export const Attendance: React.FC = () => {
  const { profile } = useAuth();
  const { settings: appSettings } = useSettings();
  const lang = appSettings.language || 'id';
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [students, setStudents] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: string, notes: string }>>({});
  const [sessionReport, setSessionReport] = useState({
    activities: '',
    studentResponse: '',
    challenges: '',
    notes: '',
    focusScore: 5,
    socialScore: 5,
    skillScore: 5
  });
  const [teacherStatus, setTeacherStatus] = useState<any>(null);
  const [teacherHistory, setTeacherHistory] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'teacher') {
      loadTeacherHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionAttendance(selectedSessionId);
      loadSessionReport(selectedSessionId);
    }
  }, [selectedSessionId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stdData, sesData, statusData] = await Promise.all([
        fetchApi('/api/students'),
        fetchApi('/api/sessions'),
        fetchApi('/api/attendance/teacher/status')
      ]);
      setStudents(stdData);
      setSessions(sesData.filter((s: any) => s.status !== 'completed'));
      setTeacherStatus(statusData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherHistory = async () => {
    try {
      const data = await fetchApi('/api/attendance/teacher/history');
      setTeacherHistory(data);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSessionAttendance = async (sessionId: string) => {
    try {
      const data = await fetchApi(`/api/attendance/student/${sessionId}`);
      const records: Record<string, { status: string, notes: string }> = {};
      data.forEach((r: any) => {
        records[r.studentId] = { status: r.status, notes: r.notes };
      });
      setAttendanceRecords(records);
    } catch (error) {
      console.error(error);
    }
  };

  const loadSessionReport = async (sessionId: string) => {
    try {
      const report = await fetchApi(`/api/session-reports/${sessionId}`);
      if (report) {
        setSessionReport({
          activities: report.activities,
          studentResponse: report.studentResponse,
          challenges: report.challenges,
          notes: report.notes,
          focusScore: report.focusScore || 5,
          socialScore: report.socialScore || 5,
          skillScore: report.skillScore || 5
        });
      } else {
        setSessionReport({
          activities: '',
          studentResponse: '',
          challenges: '',
          notes: '',
          focusScore: 5,
          socialScore: 5,
          skillScore: 5
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const selectedSession = sessions.find(s => s.id === selectedSessionId);
  const enrolledStudents = selectedSession 
    ? students.filter(s => s.id === selectedSession.studentId)
    : students.filter(s => {
        if (profile?.role === 'teacher') {
          return profile.assignedStudentIds?.includes(s.id);
        }
        return true;
      });

  const handleMarkAttendance = (studentId: string, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSessionId && enrolledStudents.length > 1) {
      alert('Pilih sesi terlebih dahulu');
      return;
    }
    
    setSaving(true);
    try {
      const records = Object.entries(attendanceRecords).map(([studentId, data]) => ({
        studentId,
        status: (data as any).status,
        notes: (data as any).notes
      }));

      await fetchApi('/api/attendance/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId || 'daily', records })
      });

      if (selectedSessionId && selectedSession) {
        await fetchApi('/api/session-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: selectedSessionId,
            studentId: selectedSession.studentId,
            ...sessionReport
          })
        });
      }

      alert('Presensi & Dokumentasi berhasil disimpan');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan presensi');
    } finally {
      setSaving(false);
    }
  };

  const handleTeacherClockIn = async () => {
    if (!photoPreview) {
      alert('Silakan ambil foto terlebih dahulu untuk bukti kehadiran');
      return;
    }

    try {
      const res = await fetchApi('/api/attendance/teacher/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '', photoUrl: photoPreview })
      });
      setTeacherStatus({ ...teacherStatus, checkIn: res.checkIn, date: format(new Date(), 'yyyy-MM-dd'), photoUrl: photoPreview });
      setPhotoPreview(null);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCapturePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTeacherClockOut = async () => {
    try {
      const res = await fetchApi('/api/attendance/teacher/clock-out', {
        method: 'POST'
      });
      setTeacherStatus({ ...teacherStatus, checkOut: res.checkOut });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight italic uppercase">
            {t.presensi}
          </h1>
          <p className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-500" /> {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>

        <div className="flex p-1.5 bg-gray-100 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab('student')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'student' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t.students}
          </button>
          <button 
            onClick={() => setActiveTab('teacher')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'teacher' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {t.teachers_staff}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'student' ? (
          <motion.div 
            key="student"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-500" /> {t.select_session}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.attendance_by_session}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex flex-col space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Pilih Tanggal</label>
                      <input 
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-gray-50 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/20 w-full sm:w-48"
                      />
                    </div>
                    <div className="flex flex-col space-y-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4">Pilih Sesi (Shadow Teacher)</label>
                      <select 
                        value={selectedSessionId}
                        onChange={(e) => setSelectedSessionId(e.target.value)}
                        className="bg-gray-50 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/20 w-full md:w-64"
                      >
                        <option value="">-- Presensi Harian (Umum) --</option>
                        {sessions.filter(s => s.date === selectedDate || !s.date).map(s => {
                          const student = students.find(std => std.id === s.studentId);
                          return <option key={s.id} value={s.id}>{s.startTime} - {student?.name || t.students}</option>
                        })}
                      </select>
                    </div>
                  </div>
                </div>

              <div className="overflow-x-auto -mx-8 sm:mx-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.students}</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Kehadiran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={2} className="px-8 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Memuat data...</td></tr>
                    ) : enrolledStudents.length === 0 ? (
                      <tr><td colSpan={2} className="px-8 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-[10px]">{t.no_student_data}</td></tr>
                    ) : (
                      enrolledStudents.map(s => (
                        <tr key={s.id} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <p className="text-gray-900 font-black uppercase tracking-tighter italic text-base group-hover:text-blue-600 transition-colors">{s.name}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{s.type || t.students}</p>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => handleMarkAttendance(s.id, 'present')}
                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${attendanceRecords[s.id]?.status === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              >
                                <UserCheck className="w-3.5 h-3.5" /> {t.present}
                              </button>
                              <button 
                                onClick={() => handleMarkAttendance(s.id, 'permit')}
                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${attendanceRecords[s.id]?.status === 'permit' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              >
                                <AlertCircle className="w-3.5 h-3.5" /> {t.permit}
                              </button>
                              <button 
                                onClick={() => handleMarkAttendance(s.id, 'absent')}
                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${attendanceRecords[s.id]?.status === 'absent' ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                              >
                                <UserX className="w-3.5 h-3.5" /> {t.absent}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {selectedSessionId && (
                <div className="pt-8 border-t border-gray-100 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-indigo-500" /> Dokumentasi Sesi (Shadow Teacher)
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Laporan pendampingan siswa berkebutuhan khusus</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scoring Section */}
                    <div className="col-span-1 md:col-span-2 bg-gray-50/50 p-6 rounded-3xl border border-gray-100 space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <LineChart className="w-4 h-4 text-indigo-500" />
                        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Penilaian Metrik Sesi (1-10)</h4>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {[
                          { key: 'focusScore', label: 'Konsentrasi & Fokus', color: 'blue' },
                          { key: 'socialScore', label: 'Interaksi Sosial', color: 'emerald' },
                          { key: 'skillScore', label: 'Tahapan Belajar/Skill', color: 'orange' }
                        ].map(metric => (
                          <div key={metric.key} className="space-y-3">
                            <div className="flex justify-between items-center">
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{metric.label}</label>
                              <span className="text-sm font-black text-gray-900 italic">{(sessionReport as any)[metric.key]}/10</span>
                            </div>
                            <input 
                              type="range"
                              min="1"
                              max="10"
                              value={(sessionReport as any)[metric.key]}
                              onChange={(e) => setSessionReport(prev => ({ ...prev, [metric.key]: parseInt(e.target.value) }))}
                              className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600`}
                            />
                            <div className="flex justify-between text-[8px] font-bold text-gray-300 uppercase tracking-tighter">
                              <span>Perlu Bantuan</span>
                              <span>Mandiri</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aktivitas Belajar</label>
                      <textarea 
                        value={sessionReport.activities}
                        onChange={(e) => setSessionReport(prev => ({ ...prev, activities: e.target.value }))}
                        placeholder="Misal: Latihan konsentrasi, mengerjakan matematika..."
                        className="w-full bg-gray-50 border-none rounded-2xl p-5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 h-32 resize-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Respon/Progres Siswa</label>
                      <textarea 
                        value={sessionReport.studentResponse}
                        onChange={(e) => setSessionReport(prev => ({ ...prev, studentResponse: e.target.value }))}
                        placeholder="Misal: Siswa kooperatif, sudah mulai bisa fokus 10 menit..."
                        className="w-full bg-gray-50 border-none rounded-2xl p-5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 h-32 resize-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hambatan/Masalah</label>
                      <textarea 
                        value={sessionReport.challenges}
                        onChange={(e) => setSessionReport(prev => ({ ...prev, challenges: e.target.value }))}
                        placeholder="Misal: Sempat tantrum saat diminta menulis..."
                        className="w-full bg-gray-50 border-none rounded-2xl p-5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 h-32 resize-none"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Catatan Tambahan</label>
                      <textarea 
                        value={sessionReport.notes}
                        onChange={(e) => setSessionReport(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Info lain untuk orang tua atau sekolah..."
                        className="w-full bg-gray-50 border-none rounded-2xl p-5 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20 h-32 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-gray-100 flex justify-end">
                <button 
                  onClick={handleSaveAttendance}
                  disabled={saving || !selectedSessionId}
                  className="px-10 py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {saving ? 'Menyimpan...' : t.save_attendance}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="teacher"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            <div className="bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
               
               <div className="space-y-2">
                 <h2 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">
                   {format(new Date(), 'HH:mm')}
                 </h2>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{t.current_time}</p>
               </div>

               <div className="relative group">
                 <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                 
                 {photoPreview && !teacherStatus?.checkIn && (
                   <div className="relative w-48 h-48 rounded-full overflow-hidden border-8 border-blue-50 shadow-xl group mb-4">
                     <img src={photoPreview} alt="Selfie" className="w-full h-full object-cover" />
                     <button 
                       onClick={() => setPhotoPreview(null)}
                       className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                     >
                       <RefreshCw className="w-8 h-8 text-white animate-spin-slow" />
                     </button>
                   </div>
                 )}

                 {teacherStatus?.photoUrl && (
                   <div className="relative w-48 h-48 rounded-full overflow-hidden border-8 border-emerald-50 shadow-xl mb-4 group">
                     <img src={teacherStatus.photoUrl || ''} alt="Bukti Hadir" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                        <UserCheck className="w-12 h-12 text-white drop-shadow-lg" />
                     </div>
                   </div>
                 )}

                 {teacherStatus?.checkIn && !teacherStatus?.checkOut ? (
                   <button 
                    onClick={handleTeacherClockOut}
                    className="relative w-48 h-48 bg-white border-8 border-red-50 rounded-full flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl group"
                   >
                     <LogOut className="w-12 h-12 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{t.clock_out}</span>
                   </button>
                 ) : teacherStatus?.checkOut ? (
                   <div className="relative w-48 h-48 bg-emerald-50 border-8 border-white rounded-full flex flex-col items-center justify-center shadow-xl">
                      <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-2" />
                      <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{t.verified}</span>
                   </div>
                 ) : photoPreview ? (
                   <button 
                    onClick={handleTeacherClockIn}
                    className="relative w-48 h-48 bg-gray-900 border-8 border-blue-50 rounded-full flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl group"
                   >
                     <LogIn className="w-12 h-12 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-black text-white uppercase tracking-widest">{t.clock_in}</span>
                   </button>
                 ) : (
                   <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-48 h-48 bg-white border-8 border-blue-50 rounded-full flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl group"
                   >
                     <Camera className="w-12 h-12 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Ambil Foto</span>
                     <input 
                       type="file" 
                       accept="image/*" 
                       capture="user" 
                       className="hidden" 
                       ref={fileInputRef} 
                       onChange={handleCapturePhoto} 
                     />
                   </button>
                 )}
               </div>

               <div className="flex gap-4 w-full pt-4">
                 <div className="flex-1 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Check In</p>
                    <p className="text-lg font-black text-gray-900 italic">{teacherStatus?.checkIn || '--:--'}</p>
                 </div>
                 <div className="flex-1 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Check Out</p>
                    <p className="text-lg font-black text-gray-900 italic">{teacherStatus?.checkOut || '--:--'}</p>
                 </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase italic flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-400" /> {t.attendance_history}
                </h3>
              </div>
              <div className="space-y-4">
                {teacherHistory.length > 0 ? (
                  teacherHistory.map((h, idx) => (
                    <div key={h.id || idx} className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Clock className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black text-gray-900 uppercase italic">{format(new Date(h.date), 'EEEE, d MMMM')}</p>
                            <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-tight ${h.status === 'present' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                              {h.status === 'present' ? t.present : t.permit}
                            </span>
                          </div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                            {h.checkIn} - {h.checkOut || '--:--'}
                          </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-10">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">{t.no_history}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
