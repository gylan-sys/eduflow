import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Session, Student, UserProfile } from '../types';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  X,
  Clock,
  User as UserIcon,
  GraduationCap,
  Waves
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addDays,
  parseISO
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export const Schedule: React.FC = () => {
  const { profile, activeBusinessLine } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDaySessions, setSelectedDaySessions] = useState<Session[]>([]);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const [newSession, setNewSession] = useState({
    studentId: '',
    teacherId: '',
    type: (activeBusinessLine === 'both' ? 'shadow' : activeBusinessLine) as any,
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '09:00',
    transportFee: 0,
    sessionFee: 0
  });

  useEffect(() => {
    setNewSession(prev => ({
      ...prev,
      type: (activeBusinessLine === 'both' ? 'shadow' : activeBusinessLine) as any
    }));
  }, [activeBusinessLine]);

  useEffect(() => {
    const qSessions = query(collection(db, 'sessions'));
    const unsubscribeSessions = onSnapshot(qSessions, (snapshot) => {
      const allSessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Session[];
      const filtered = allSessions.filter(s => 
        activeBusinessLine === 'both' || s.type === activeBusinessLine
      );
      setSessions(filtered);
    });

    const qStudents = query(collection(db, 'students'));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      const allStudents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[];
      const filtered = allStudents.filter(s => 
        activeBusinessLine === 'both' || s.type === activeBusinessLine || s.type === 'both'
      );
      setStudents(filtered);
    });

    getDocs(collection(db, 'users')).then(snapshot => {
      const allUsers = snapshot.docs.map(doc => doc.data() as UserProfile);
      const filteredTeachers = allUsers.filter(u => 
        u.role === 'teacher' && (activeBusinessLine === 'both' || u.businessLine === 'both' || u.businessLine === activeBusinessLine)
      );
      setTeachers(filteredTeachers);
    });

    return () => {
      unsubscribeSessions();
      unsubscribeStudents();
    };
  }, [activeBusinessLine]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    const daySessions = sessions.filter(s => {
      const sDate = s.startTime?.toDate ? s.startTime.toDate() : (typeof s.startTime === 'string' ? parseISO(s.startTime) : new Date());
      return isSameDay(sDate, day);
    });
    setSelectedDate(day);
    setSelectedDaySessions(daySessions);
    setShowDayDetail(true);
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const student = students.find(s => s.id === newSession.studentId);
      if (!student) return;

      const fullStartTime = new Date(`${newSession.date}T${newSession.startTime}`);
      const fullEndTime = new Date(`${newSession.date}T${newSession.endTime}`);

      await addDoc(collection(db, 'sessions'), {
        studentId: student.name, // Using name for UI simplicity in this demo
        parentId: student.parentId,
        teacherId: newSession.teacherId,
        type: newSession.type,
        startTime: fullStartTime,
        endTime: fullEndTime,
        status: 'scheduled',
        transportFee: Number(newSession.transportFee),
        sessionFee: Number(newSession.sessionFee)
      });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Jadwal Kalender</h2>
          <p className="text-gray-500">Pantau dan kelola jadwal sesi belajar & renang.</p>
        </div>
        {profile?.role === 'admin' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-100"
          >
            <Plus className="w-5 h-5" />
            <span>Tambah Sesi</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden min-h-[600px] flex flex-col">
        {/* Calendar Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <h3 className="text-xl font-bold text-gray-900 capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: idLocale })}
          </h3>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors">
              Hari Ini
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 min-h-0">
          {calendarDays.map((day, idx) => {
            const daySessions = sessions.filter(s => {
              const sDate = s.startTime?.toDate ? s.startTime.toDate() : (typeof s.startTime === 'string' ? parseISO(s.startTime) : new Date());
              return isSameDay(sDate, day);
            });
            
            const hasShadow = daySessions.some(s => s.type === 'shadow');
            const hasSwimming = daySessions.some(s => s.type === 'swimming');

            return (
              <div 
                key={idx}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "border-r border-b border-gray-50 p-2 min-h-[100px] cursor-pointer hover:bg-gray-50/50 transition-colors relative",
                  !isSameMonth(day, monthStart) && "bg-gray-50/30 opacity-40",
                  daySessions.length > 0 && isSameMonth(day, monthStart) && "bg-blue-50/10"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                   <span className={cn(
                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                    isSameDay(day, new Date()) ? "bg-blue-600 text-white" : "text-gray-500"
                  )}>
                    {format(day, 'd')}
                  </span>
                  
                  {/* Indicators for sessions */}
                  <div className="flex gap-0.5">
                    {hasShadow && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-sm" />}
                    {hasSwimming && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm" />}
                  </div>
                </div>
                <div className="space-y-1 overflow-hidden">
                  {daySessions.slice(0, 2).map((s) => (
                    <div 
                      key={s.id} 
                      className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-md truncate font-bold uppercase",
                        s.type === 'shadow' ? "bg-blue-50 text-blue-600 border border-blue-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
                      )}
                    >
                      {s.studentId}
                    </div>
                  ))}
                  {daySessions.length > 2 && (
                    <div className="text-[9px] text-gray-400 font-bold px-1">+{daySessions.length - 2} lagi</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Session Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-600 text-white">
                <h3 className="text-xl font-bold tracking-tight">Atur Jadwal Baru</h3>
                <button onClick={() => setIsModalOpen(false)} className="hover:bg-white/10 p-1 rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={handleAddSession} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Siswa</label>
                    <select 
                      required
                      value={newSession.studentId}
                      onChange={(e) => setNewSession({...newSession, studentId: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-colors cursor-pointer"
                    >
                      <option value="">Pilih Siswa</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Guru</label>
                    <select 
                      required
                      value={newSession.teacherId}
                      onChange={(e) => setNewSession({...newSession, teacherId: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-colors cursor-pointer"
                    >
                      <option value="">Pilih Guru</option>
                      {teachers.map(t => <option key={t.uid} value={t.displayName}>{t.displayName}</option>)}
                      <option value="Mr. Andre">Mr. Andre (Demo)</option>
                      <option value="Ms. Linda">Ms. Linda (Demo)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tanggal</label>
                    <input 
                      type="date" 
                      required
                      value={newSession.date}
                      onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-colors" 
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Mulai</label>
                    <input 
                      type="time" 
                      required
                      value={newSession.startTime}
                      onChange={(e) => setNewSession({...newSession, startTime: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-colors" 
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Selesai</label>
                    <input 
                      type="time" 
                      required
                      value={newSession.endTime}
                      onChange={(e) => setNewSession({...newSession, endTime: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-colors" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tipe Sesi</label>
                    <div className="flex gap-2">
                       <button 
                        type="button"
                        onClick={() => setNewSession({...newSession, type: 'shadow'})}
                        className={cn(
                          "flex-1 py-3 rounded-xl border-2 transition-all font-bold",
                          newSession.type === 'shadow' ? "border-blue-600 bg-blue-50 text-blue-600" : "border-gray-100 text-gray-400"
                        )}
                       >
                         Shadow
                       </button>
                       <button 
                        type="button"
                        onClick={() => setNewSession({...newSession, type: 'swimming'})}
                        className={cn(
                          "flex-1 py-3 rounded-xl border-2 transition-all font-bold",
                          newSession.type === 'swimming' ? "border-emerald-600 bg-emerald-50 text-emerald-600" : "border-gray-100 text-gray-400"
                        )}
                       >
                         Renang
                       </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Transport (Rp)</label>
                    <input 
                      type="number" 
                      value={newSession.transportFee}
                      onChange={(e) => setNewSession({...newSession, transportFee: Number(e.target.value)})}
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl focus:border-blue-500 outline-none transition-colors" 
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-100 transition-all">
                    Konfirmasi Jadwal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Day Detail Modal */}
      <AnimatePresence>
        {showDayDetail && (
          <div 
            className="fixed inset-0 z-[60] flex items-center justify-end md:p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDayDetail(false)}
          >
             <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-md h-full md:h-auto md:max-h-[85vh] md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Detail Jadwal</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {selectedDate && format(selectedDate, 'EEEE, d MMMM yyyy', { locale: idLocale })}
                  </p>
                </div>
                <button 
                  onClick={() => setShowDayDetail(false)} 
                  className="bg-white hover:bg-gray-100 p-3 rounded-2xl transition-all shadow-sm border border-gray-100 active:scale-90"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto space-y-4 bg-white">
                {selectedDaySessions.length === 0 ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center mx-auto">
                      <CalendarIcon className="w-10 h-10 text-gray-200" />
                    </div>
                    <p className="text-gray-400 text-xs font-black uppercase tracking-widest leading-loose">Tidak ada jadwal<br/>untuk hari ini</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedDaySessions.map(s => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={s.id} 
                        className="p-6 rounded-[2rem] border border-gray-100 bg-white hover:border-blue-100 hover:shadow-lg hover:shadow-blue-50/50 transition-all group"
                      >
                         <div className="flex items-center justify-between mb-4">
                            <span className={cn(
                              "px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] shadow-sm",
                               s.type === 'shadow' ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                            )}>
                              {s.type === 'shadow' ? 'Shadow Teacher' : 'Les Renang'}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <div className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                s.status === 'completed' ? "bg-emerald-500" : "bg-amber-500"
                              )} />
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                {s.status === 'completed' ? 'Selesai' : 'Terjadwal'}
                              </span>
                            </div>
                         </div>
                         <div className="space-y-4">
                            <div>
                               <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-1">Siswa</p>
                               <p className="text-xl font-black text-gray-900 tracking-tight uppercase group-hover:text-blue-600 transition-colors">{s.studentId}</p>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-50">
                              <div className="space-y-1">
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Waktu</p>
                                <div className="flex items-center gap-2 text-gray-900 font-bold text-sm tracking-tight">
                                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                                  <span>{format(s.startTime?.toDate ? s.startTime.toDate() : new Date(), 'HH:mm')} - {format(s.endTime?.toDate ? s.endTime.toDate() : new Date(), 'HH:mm')}</span>
                                </div>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Guru</p>
                                <div className="flex items-center gap-2 text-gray-900 font-bold text-sm tracking-tight">
                                  <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                                  <span className="truncate">{s.teacherId}</span>
                                </div>
                              </div>
                            </div>
                         </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="p-8 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={() => setShowDayDetail(false)}
                  className="w-full bg-gray-900 text-white font-black text-xs uppercase tracking-[0.2em] py-4 rounded-2xl shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all active:scale-[0.98]"
                >
                  Tutup Detail
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
