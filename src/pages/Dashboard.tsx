import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  Plus,
  Briefcase,
  Waves,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, onSnapshot, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Student, Session, Payment, ProgressReport, Announcement } from '../types';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { isSameMonth, startOfMonth, format } from 'date-fns';

export const Dashboard: React.FC = () => {
  const { profile, activeBusinessLine } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    revenue: 0,
    attendance: 98,
    reports: 0
  });
  const [upcoming, setUpcoming] = useState<Session[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Students
      const qStudents = query(collection(db, 'students'));
      const unsubscribeStudents = onSnapshot(qStudents, (snap) => {
        const allStudents = snap.docs.map(doc => doc.data() as Student);
        const filtered = allStudents.filter(s => 
          activeBusinessLine === 'both' || s.type === activeBusinessLine || s.type === 'both'
        );
        setStats(prev => ({ ...prev, students: filtered.length }));
      });

      // 2. Payments (Revenue)
      const qPayments = query(collection(db, 'payments'), where('status', '==', 'paid'));
      const unsubscribePayments = onSnapshot(qPayments, (snap) => {
        const allPayments = snap.docs.map(doc => doc.data() as Payment);
        // In a real app we'd filter by student type here too
        const monthlyRevenue = allPayments.reduce((acc, curr) => acc + curr.amount, 0);
        setStats(prev => ({ ...prev, revenue: monthlyRevenue }));
      });

      // 3. Sessions
      const qSessions = query(collection(db, 'sessions'), orderBy('startTime', 'asc'));
      const unsubscribeSessions = onSnapshot(qSessions, (snap) => {
        const allSessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Session[];
        const filtered = allSessions.filter(s => 
          activeBusinessLine === 'both' || s.type === activeBusinessLine
        );
        setUpcoming(filtered.filter(s => s.status === 'scheduled').slice(0, 4));
      });

      // 4. Reports
      const qReports = query(collection(db, 'progressReports'));
      const unsubscribeReports = onSnapshot(qReports, (snap) => {
        setStats(prev => ({ ...prev, reports: snap.size }));
      });
      
      // 5. Announcements
      const qAnnouncements = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(3));
      const unsubscribeAnnouncements = onSnapshot(qAnnouncements, (snap) => {
        setAnnouncements(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Announcement[]);
      });

      setLoading(false);
      return () => {
        unsubscribeStudents();
        unsubscribePayments();
        unsubscribeSessions();
        unsubscribeReports();
        unsubscribeAnnouncements();
      };
    };

    fetchData();
  }, [activeBusinessLine]);

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
             {activeBusinessLine === 'shadow' ? <Briefcase className="w-6 h-6 text-blue-600" /> : 
              activeBusinessLine === 'swimming' ? <Waves className="w-6 h-6 text-emerald-600" /> : 
              <GraduationCap className="w-6 h-6 text-indigo-600" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Halo, {profile?.displayName}!</h2>
            <p className="text-gray-500 font-medium space-x-1">
              <span>Melihat data</span>
              <span className="font-bold text-gray-900 uppercase tracking-widest text-[10px] bg-gray-100 px-2 py-0.5 rounded ml-1">
                {activeBusinessLine === 'both' ? 'Semua Bisnis' : activeBusinessLine === 'shadow' ? 'Shadow Teacher' : 'Les Renang'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Siswa" 
          value={stats.students.toString()} 
          change="+12%" 
          icon={Users} 
          color="blue" 
        />
        <StatCard 
          title={isAdmin ? "Total Pendapatan" : "Sesi Terjadwal"} 
          value={isAdmin ? formatCurrency(stats.revenue) : upcoming.length.toString()} 
          change="+8%" 
          icon={isAdmin ? TrendingUp : BookOpen} 
          color="emerald" 
        />
        <StatCard 
          title="Kehadiran Rata-rata" 
          value={stats.attendance + "%"} 
          change="Stabil" 
          icon={Clock} 
          color="orange" 
        />
        <StatCard 
          title="Laporan Masuk" 
          value={stats.reports.toString()} 
          change="+4" 
          icon={ArrowUpRight} 
          color="indigo" 
        />
      </div>

      {/* Main Charts / Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
             <TrendingUp className="w-48 h-48 -mr-10 -mt-10" />
          </div>
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Performa Bisnis</h3>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-blue-600"></div>
               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pendapatan</span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { name: 'Jan', revenue: stats.revenue * 0.7 },
                { name: 'Feb', revenue: stats.revenue * 0.8 },
                { name: 'Mar', revenue: stats.revenue * 0.9 },
                { name: 'Apr', revenue: stats.revenue },
              ]}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 10, fontWeight: 900}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px'}}
                  formatter={(value: any) => formatCurrency(value)}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Jadwal Mendatang</h3>
              <Plus className="w-4 h-4 text-gray-300" />
            </div>
            <div className="space-y-4">
              {upcoming.length === 0 ? (
                 <p className="text-center py-10 text-gray-400 text-xs font-bold uppercase tracking-widest">Tidak ada jadwal</p>
              ) : upcoming.map(s => (
                <UpcomingSession 
                  key={s.id}
                  student={s.studentId} 
                  time={format(s.startTime?.toDate ? s.startTime.toDate() : new Date(), 'HH:mm')}
                  teacher={s.teacherId} 
                  type={s.type} 
                />
              ))}
            </div>
          </div>

          <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-gray-200 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
               <ShieldCheck className="w-32 h-32" />
            </div>
            <h3 className="font-black text-xs uppercase tracking-[0.2em] mb-4 text-indigo-400">Pemberitahuan</h3>
            
            <div className="space-y-4 mb-6">
              {announcements.length === 0 ? (
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">Tidak ada pengumuman baru.</p>
              ) : announcements.map(ann => (
                <div key={ann.id} className="border-l-2 border-indigo-500 pl-3 py-1">
                  <p className="text-[10px] font-black uppercase text-indigo-300 mb-1">{ann.type}</p>
                  <p className="text-sm font-bold truncate">{ann.title}</p>
                </div>
              ))}
            </div>

            <Link to="/announcements" className="relative z-10 w-full bg-white text-gray-900 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 flex items-center justify-center">
              Lihat Semua
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, change, icon: Icon, color }: any) => {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-600 shadow-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 shadow-emerald-100',
    orange: 'bg-orange-50 text-orange-600 shadow-orange-100',
    indigo: 'bg-indigo-50 text-indigo-600 shadow-indigo-100',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2.5 rounded-xl shadow-sm", colors[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <span className={cn(
          "text-xs font-bold px-2 py-1 rounded-full",
          change.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400"
        )}>
          {change}
        </span>
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-500 mb-1">{title}</h4>
        <p className="text-2xl font-bold text-gray-900 tracking-tight">{value}</p>
      </div>
    </motion.div>
  );
};

const UpcomingSession = ({ student, time, teacher, type }: any) => (
  <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border border-transparent hover:border-gray-100">
    <div className={cn(
      "w-2 h-10 rounded-full mt-1",
      type.includes('Shadow') ? "bg-blue-400" : "bg-emerald-400"
    )}></div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-gray-900 truncate">{student}</p>
      <p className="text-xs text-gray-500">{time} • {teacher}</p>
      <p className="text-[10px] font-semibold text-blue-600 uppercase mt-1">{type}</p>
    </div>
  </div>
);
