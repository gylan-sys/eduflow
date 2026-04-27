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
  AlertCircle
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
  const [teacherStatus, setTeacherStatus] = useState<any>(null);
  const [teacherHistory, setTeacherHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        status: data.status,
        notes: data.notes
      }));

      await fetchApi('/api/attendance/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: selectedSessionId || 'daily', records })
      });
      alert('Presensi berhasil disimpan');
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan presensi');
    } finally {
      setSaving(false);
    }
  };

  const handleTeacherClockIn = async () => {
    try {
      const res = await fetchApi('/api/attendance/teacher/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: '' })
      });
      setTeacherStatus({ ...teacherStatus, checkIn: res.checkIn, date: format(new Date(), 'yyyy-MM-dd') });
    } catch (error) {
      console.error(error);
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
                <select 
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="bg-gray-50 border-none rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-500/20 w-full md:w-64"
                >
                  <option value="">-- {t.select_session} --</option>
                  {sessions.map(s => {
                    const student = students.find(std => std.id === s.studentId);
                    return <option key={s.id} value={s.id}>{s.startTime} - {student?.name || t.students}</option>
                  })}
                </select>
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
                 ) : (
                   <button 
                    onClick={handleTeacherClockIn}
                    className="relative w-48 h-48 bg-white border-8 border-blue-50 rounded-full flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-xl group"
                   >
                     <LogIn className="w-12 h-12 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                     <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{t.clock_in}</span>
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
