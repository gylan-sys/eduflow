import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, updateDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Session, Attendance as IAttendance } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MapPin, 
  User, 
  GraduationCap, 
  Waves,
  Search,
  Filter
} from 'lucide-react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export const Attendance: React.FC = () => {
  const { profile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => {
    const q = query(collection(db, 'sessions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Session[];
      setSessions(sessionData);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleMarkAttendance = async (session: Session, teacherPresent: boolean, studentPresent: boolean) => {
    try {
      const attendanceId = `${session.id}_attendance`;
      await setDoc(doc(db, 'attendance', attendanceId), {
        sessionId: session.id,
        studentId: session.studentId,
        teacherId: session.teacherId,
        studentPresent,
        teacherPresent,
        timestamp: serverTimestamp(),
        notes: ''
      });

      await updateDoc(doc(db, 'sessions', session.id), {
        status: 'completed'
      });
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (filter === 'all') return true;
    if (filter === 'pending') return s.status === 'scheduled';
    if (filter === 'completed') return s.status === 'completed';
    return true;
  });

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Kehadiran</h2>
          <p className="text-gray-500">Catat kehadiran guru dan siswa untuk setiap sesi.</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-200">
          <button 
            onClick={() => setFilter('pending')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              filter === 'pending' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-500 hover:text-gray-900"
            )}
          >
            Belum Selesai
          </button>
          <button 
            onClick={() => setFilter('completed')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              filter === 'completed' ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "text-gray-500 hover:text-gray-900"
            )}
          >
            Selesai
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
            <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Tidak ada sesi yang perlu dicatat</p>
          </div>
        ) : filteredSessions.map((session) => (
          <SessionCard 
            key={session.id} 
            session={session} 
            onMark={handleMarkAttendance} 
          />
        ))}
      </div>
    </div>
  );
};

const SessionCard = ({ session, onMark }: { session: Session, onMark: any, key?: any }) => {
  const isCompleted = session.status === 'completed';
  const startTime = session.startTime?.toDate ? session.startTime.toDate() : new Date();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col"
    >
      <div className={cn(
        "px-5 py-3 flex items-center justify-between",
        session.type === 'shadow' ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700"
      )}>
        <div className="flex items-center gap-2">
          {session.type === 'shadow' ? <GraduationCap className="w-4 h-4" /> : <Waves className="w-4 h-4" />}
          <span className="text-xs font-black uppercase tracking-widest">{session.type === 'shadow' ? 'Shadow' : 'Renang'}</span>
        </div>
        <span className="text-xs font-bold font-mono">#{session.id.slice(0, 6)}</span>
      </div>

      <div className="p-5 flex-1 space-y-4">
        <div>
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Siswa</h4>
          <p className="text-lg font-bold text-gray-900 tracking-tight">{session.studentId}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <Clock className="w-4 h-4 opacity-50" />
            <span>{format(startTime, 'EEEE, d MMMM yyyy HH:mm', { locale: idLocale })}</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <User className="w-4 h-4 opacity-50" />
            <span>Guru: {session.teacherId}</span>
          </div>
        </div>

        {!isCompleted ? (
          <div className="pt-4 grid grid-cols-2 gap-3">
             <button 
              onClick={() => onMark(session, true, true)}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-emerald-100"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Hadir Semua</span>
            </button>
            <button 
              className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-2.5 rounded-xl transition-all"
              onClick={() => onMark(session, true, false)}
            >
              <XCircle className="w-5 h-5 opacity-40" />
              <span>Siswa Absen</span>
            </button>
          </div>
        ) : (
          <div className="pt-4 flex items-center justify-center gap-2 text-emerald-600 font-bold bg-emerald-50 rounded-xl py-3">
            <CheckCircle2 className="w-5 h-5" />
            <span>Sudah Tercatat</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const ClipboardCheck = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
    <path d="m9 14 2 2 4-4"/>
  </svg>
);
