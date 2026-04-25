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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Jadwal Kalender</h2>
          <p className="text-gray-500">Pantau dan kelola jadwal sesi (Local DB).</p>
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

        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
            <div key={day} className="py-3 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 grid-rows-5 min-h-0">
          {calendarDays.map((day, idx) => {
            const daySessions = sessions.filter(s => {
              const sDate = parseISO(s.date || (s.startTime as string));
              return isSameDay(sDate, day);
            });
            
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
                </div>
                <div className="space-y-1 overflow-hidden">
                  {daySessions.slice(0, 2).map((s) => (
                    <div 
                      key={s.id} 
                      className="text-[9px] px-1.5 py-0.5 rounded-md truncate font-bold uppercase bg-blue-50 text-blue-600 border border-blue-100"
                    >
                      {s.studentId}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
              <div className="p-6 bg-blue-600 text-white flex items-center justify-between">
                <h3 className="text-xl font-bold">Tambah Jadwal</h3>
                <button onClick={() => setIsModalOpen(false)}><X className="w-6 h-6"/></button>
              </div>
              <form onSubmit={handleAddSession} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Siswa</label>
                  <select 
                    required
                    value={newSession.studentId}
                    onChange={(e) => setNewSession({...newSession, studentId: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl outline-none"
                  >
                    <option value="">Pilih Siswa</option>
                    {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Tanggal</label>
                    <input 
                      type="date" 
                      required
                      value={newSession.date}
                      onChange={(e) => setNewSession({...newSession, date: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Mulai</label>
                    <input 
                      type="time" 
                      required
                      value={newSession.startTime}
                      onChange={(e) => setNewSession({...newSession, startTime: e.target.value})}
                      className="w-full bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl" 
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg">Simpan Jadwal</button>
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
              className="bg-white w-full max-w-md h-full rounded-l-[2.5rem] shadow-2xl p-8 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black uppercase tracking-tight">Detail Jadwal</h3>
                <button onClick={() => setShowDayDetail(false)} className="p-2 bg-gray-100 rounded-xl"><X className="w-5 h-5"/></button>
              </div>
              <div className="space-y-4">
                {selectedDaySessions.length === 0 ? <p className="text-gray-400 text-center py-10 uppercase text-xs font-black">Tidak ada jadwal</p> : 
                  selectedDaySessions.map(s => (
                    <div key={s.id} className="p-6 rounded-2xl border border-gray-100 bg-white">
                      <p className="text-xs font-black text-blue-600 uppercase mb-1">{s.startTime as string} - {s.endTime as string}</p>
                      <p className="text-lg font-black text-gray-900">{s.studentId}</p>
                      <p className="text-xs text-gray-500 mt-2">{s.notes}</p>
                    </div>
                  ))
                }
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
