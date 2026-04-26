import React, { useEffect, useState } from 'react';
import { Session, Student, UserProfile } from '../types';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  X,
  Clock,
  User as UserIcon,
  Trash2
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
  parseISO
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { fetchApi } from '../lib/api';

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
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '08:00',
    endTime: '09:00',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [sData, stData, tData] = await Promise.all([
        fetchApi('/api/sessions'),
        fetchApi('/api/students'),
        fetchApi('/api/users')
      ]);
      setSessions(sData);
      setStudents(stData);
      setTeachers(tData.filter((u: any) => u.role === 'teacher'));
    } catch (err) {
      console.error("Fetch schedule error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const handleDayClick = (day: Date) => {
    const daySessions = sessions.filter(s => {
      const sDate = parseISO(s.date || (s.startTime as string));
      return isSameDay(sDate, day);
    });
    setSelectedDate(day);
    setSelectedDaySessions(daySessions);
    setShowDayDetail(true);
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchApi('/api/sessions', {
        method: 'POST',
        body: JSON.stringify(newSession)
      });
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const getStudentType = (studentName: string) => {
    const s = students.find(std => std.name === studentName);
    return s?.type || 'shadow';
  };

  const getDaySessionColor = (studentName: string) => {
    const type = getStudentType(studentName);
    if (type === 'shadow') return {
      bg: "bg-blue-50/80 hover:bg-blue-100",
      text: "text-blue-700",
      dot: "bg-blue-500",
      border: "border-blue-100"
    };
    return {
      bg: "bg-emerald-50/80 hover:bg-emerald-100",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
      border: "border-emerald-100"
    };
  };

  return (
    <div className="space-y-8 relative">
       {/* Decorative Background Elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-emerald-50/30 rounded-full blur-3xl -z-10" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 md:px-0">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-gray-900 tracking-tighter leading-tight italic uppercase drop-shadow-sm">
            Penjadwalan
          </h1>
          <div className="flex items-center gap-3 mt-3">
             <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-indigo-100" />
                ))}
             </div>
             <p className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] italic flex items-center gap-2">
              Kalender Aktivitas Ananda
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 mr-4 px-6 py-3 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/20">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Shadow</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Swimming</span>
             </div>
          </div>
          {profile?.role === 'admin' && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-gray-900 hover:bg-black text-white px-8 py-5 rounded-[1.5rem] transition-all shadow-2xl shadow-gray-200 text-[10px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>Tambah Sesi</span>
            </button>
          )}
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/70 backdrop-blur-md rounded-[2.5rem] sm:rounded-[3.5rem] border border-white shadow-2xl overflow-hidden min-h-[550px] sm:min-h-[700px] flex flex-col relative"
      >
        <div className="p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/40 sticky top-0 z-10">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-indigo-600 rounded-[1.2rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                <CalendarIcon className="w-7 h-7" />
             </div>
             <h3 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
              {format(currentDate, 'MMMM yyyy', { locale: idLocale })}
            </h3>
          </div>
          <div className="flex items-center gap-2 bg-gray-50/50 p-2 rounded-[1.5rem] border border-gray-100">
            <button onClick={prevMonth} className="w-12 h-12 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <ChevronLeft className="w-6 h-6 text-gray-400 hover:text-gray-900" />
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())} 
              className="px-6 py-3 text-[10px] font-black text-indigo-600 hover:bg-white hover:shadow-sm rounded-xl transition-all uppercase tracking-[0.2em] whitespace-nowrap"
            >
              Hari Ini
            </button>
            <button onClick={nextMonth} className="w-12 h-12 flex items-center justify-center hover:bg-white hover:shadow-sm rounded-xl transition-all">
              <ChevronRight className="w-6 h-6 text-gray-400 hover:text-gray-900" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 bg-white/20 border-b border-gray-50 font-black">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
            <div key={day} className="py-5 text-center text-[9px] sm:text-[11px] text-indigo-300 uppercase tracking-[0.3em]">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 auto-rows-fr min-h-0">
          {calendarDays.map((day, idx) => {
            const daySessions = sessions.filter(s => {
              const sDate = parseISO(s.date || (s.startTime as string));
              return isSameDay(sDate, day);
            });
            
            const isToday = isSameDay(day, new Date());
            const curMonth = isSameMonth(day, monthStart);

            return (
              <motion.div 
                key={idx}
                whileHover={{ scale: 0.98 }}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "border-r border-b border-gray-50 p-2 sm:p-3 min-h-[85px] sm:min-h-[120px] cursor-pointer hover:bg-white transition-all relative group overflow-hidden",
                  !curMonth && "bg-gray-50/10 grayscale opacity-20",
                  daySessions.length > 0 && curMonth && "bg-white/40 shadow-inner"
                )}
              >
                <div className="flex justify-between items-start mb-3">
                   <div className="relative">
                      {isToday && <motion.div layoutId="today" className="absolute inset-0 bg-indigo-600 rounded-lg blur-md opacity-20" />}
                      <span className={cn(
                        "text-[11px] sm:text-xs font-black w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-xl transition-all relative z-10",
                        isToday ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" : "text-gray-400 group-hover:text-gray-900"
                      )}>
                        {format(day, 'd')}
                      </span>
                   </div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  {daySessions.slice(0, 3).map((s) => {
                    const colors = getDaySessionColor(s.studentId);
                    return (
                      <div 
                        key={s.id} 
                        className={cn(
                          "text-[7px] sm:text-[10px] px-2 py-1.5 rounded-lg truncate font-black uppercase tracking-tighter italic border transition-colors shadow-sm",
                          colors.bg, colors.text, colors.border
                        )}
                      >
                        <div className="flex items-center gap-1">
                           <div className={cn("w-1 h-1 rounded-full shrink-0", colors.dot)} />
                           {s.studentId}
                        </div>
                      </div>
                    );
                  })}
                  {daySessions.length > 3 && (
                    <div className="text-[8px] text-gray-400 font-black px-2 uppercase tracking-widest">+ {daySessions.length - 3} Lagi</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Add Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-indigo-600 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <CalendarIcon className="w-24 h-24 rotate-12" />
                </div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic italic">Tambah Jadwal</h3>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mt-1">Sesi Belajar Baru</p>
                <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors">
                  <X className="w-6 h-6"/>
                </button>
              </div>
              <form onSubmit={handleAddSession} className="p-8 space-y-6 bg-white">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 italic">Nama Siswa</label>
                  <select 
                    required
                    value={newSession.studentId}
                    onChange={(e) => setNewSession({...newSession, studentId: e.target.value})}
                    className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-inner"
                  >
                    <option value="">Pilih Siswa</option>
                    {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 italic">Tanggal</label>
                  <input 
                    type="date" 
                    required
                    value={newSession.date || ''}
                    onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                    className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-inner" 
                  />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1 italic">Mulai</label>
                  <input 
                    type="time" 
                    required
                    value={newSession.startTime || ''}
                    onChange={(e) => setNewSession({...newSession, startTime: e.target.value})}
                    className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-inner" 
                  />
                  </div>
                </div>
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-indigo-100 transition-all active:scale-95 uppercase text-xs tracking-widest">Simpan Jadwal</button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

       {/* Day Detail */}
       <AnimatePresence>
        {showDayDetail && (
          <div className="fixed inset-0 z-[60] flex items-center justify-end p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowDayDetail(false)}>
             <motion.div 
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/95 backdrop-blur-md w-full max-w-lg h-full sm:h-[90vh] sm:rounded-[2.5rem] shadow-2xl p-6 sm:p-10 overflow-y-auto relative border-l border-white/50"
            >
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-tighter italic italic leading-none">Detail Sesi</h3>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 inline-block">
                    {selectedDate && format(selectedDate, 'EEEE, d MMMM yyyy', { locale: idLocale })}
                  </p>
                </div>
                <button onClick={() => setShowDayDetail(false)} className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-gray-900 rounded-2xl transition-all hover:rotate-90">
                  <X className="w-6 h-6"/>
                </button>
              </div>
              <div className="space-y-6">
                {selectedDaySessions.length === 0 ? (
                  <div className="py-24 text-center space-y-4 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                    <CalendarIcon className="w-16 h-16 mx-auto text-gray-200" />
                    <p className="text-gray-400 uppercase text-[10px] font-black tracking-widest">Selamat Beristirahat!</p>
                  </div>
                ) : (
                  selectedDaySessions.map(s => {
                    const colors = getDaySessionColor(s.studentId);
                    return (
                      <div 
                        key={s.id} 
                        className={cn(
                          "p-8 rounded-[2.5rem] border-2 bg-white shadow-xl hover:shadow-2xl transition-all group relative overflow-hidden",
                          colors.border.replace('border-', 'border-')
                        )}
                      >
                        <div className={cn("absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform", colors.text)}>
                           <Clock className="w-20 h-20" />
                        </div>
                        <div className="flex items-center justify-between mb-6">
                          <div className={cn("px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm italic border", colors.bg, colors.text, colors.border)}>
                            {s.startTime as string} - {s.endTime as string}
                          </div>
                          <div className={cn("px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter", colors.bg, colors.text)}>
                             {getStudentType(s.studentId)}
                          </div>
                        </div>
                        <h4 className="text-2xl font-black text-gray-900 tracking-tighter italic uppercase">{s.studentId}</h4>
                        {s.notes && (
                           <div className="mt-6 p-5 bg-gray-50/50 rounded-2xl border border-gray-100 italic font-medium text-xs text-gray-500 leading-relaxed">
                              "{s.notes}"
                           </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
