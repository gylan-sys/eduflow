import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  ShieldCheck,
  Bell,
  CreditCard,
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Student, Session, Payment, Announcement } from '../types';
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
import { format } from 'date-fns';
import { fetchApi } from '../lib/api';
import { useSettings } from '../contexts/SettingsContext';
import { translations } from '../constants/translations';

export const Dashboard: React.FC = () => {
  const { profile, activeBusinessLine } = useAuth();
  const { settings: appSettings } = useSettings();
  
  const lang = appSettings.language || 'id';
  const t = translations[lang];

  const [statsState, setStatsState] = useState({
    students: 0,
    revenue: 0,
    attendance: 98,
    reports: 0
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [pendingBills, setPendingBills] = useState<Payment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch stats & data from local API
      const [annData, sessionsData, studentsData, reportsData, paymentsData] = await Promise.all([
        fetchApi('/api/announcements'),
        fetchApi('/api/sessions'),
        fetchApi('/api/students'),
        fetchApi('/api/reports'),
        fetchApi('/api/payments')
      ]);
      
      if (annData) setAnnouncements(annData.slice(0, 3));
      if (sessionsData) setSessions(sessionsData);
      if (studentsData) setStudents(studentsData);
      if (reportsData) setReports(reportsData);
      if (paymentsData) {
        setPayments(paymentsData);
        setPendingBills(paymentsData.filter((p: any) => p.status === 'pending'));
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profile) fetchData();
  }, [profile, fetchData]);

  const { stats, revenueData, upcoming } = useMemo(() => {
    // 1. Calculate Upcoming Sessions
    const upcomingFiltered = sessions
      .filter((s: any) => new Date(s.date || s.startTime) >= new Date())
      .slice(0, 3);

    // 2. Handle Parent Stats
    if (profile?.role === 'parent') {
      const myChild = students.find((s: any) => s.id === profile.studentId);
      return {
        upcoming: upcomingFiltered,
        stats: {
          students: myChild ? 1 : 0,
          revenue: 0,
          attendance: 100,
          reports: reports.filter(r => r.studentId === profile.studentId).length
        },
        revenueData: []
      };
    }

    // 3. Handle Admin/Teacher Stats
    const verified = payments.filter((p: any) => p.status === 'verified');
    const totalRev = verified.reduce((s: number, p: any) => s + p.amount, 0);
    
    // Optimized chart data calculation (O(N) single pass)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentMonth = new Date().getMonth();
    const revenueByMonth = new Array(12).fill(0);
    
    verified.forEach((p: any) => {
      const month = new Date(p.date).getMonth();
      if (month >= 0 && month < 12) {
        revenueByMonth[month] += p.amount;
      }
    });

    const chartData = months.slice(0, currentMonth + 1).map((m, i) => ({
      name: m,
      revenue: revenueByMonth[i]
    }));

    return {
      upcoming: upcomingFiltered,
      stats: {
        students: students.length,
        revenue: totalRev,
        attendance: 98,
        reports: reports.length
      },
      revenueData: chartData
    };
  }, [profile, sessions, students, reports, payments]);

  const isParent = profile?.role === 'parent';

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-[1.2rem] sm:rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-gray-100 border border-gray-100 shrink-0">
             {isParent ? <BookOpen className="w-7 h-7 text-emerald-600" /> :
              activeBusinessLine === 'shadow' ? <Briefcase className="w-7 h-7 text-blue-600" /> : 
              activeBusinessLine === 'swimming' ? <Waves className="w-7 h-7 text-emerald-600" /> : 
              <GraduationCap className="w-7 h-7 text-indigo-600" />}
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight italic uppercase font-display">
              {t.welcome}, {profile?.displayName?.split(' ')[0] || 'User'}!
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <p className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase tracking-widest italic">
                {isParent ? 'Status Tumbuh Kembang Ananda' : (
                  <>
                    <span>Pantau Data</span>
                    <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg ml-2">
                      {activeBusinessLine === 'both' ? 'Semua Bisnis' : activeBusinessLine === 'shadow' ? 'Shadow Teacher' : 'Les Renang'}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400">
            <Bell className="w-6 h-6" />
          </div>
          <div className="bg-gray-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-gray-200">
            {format(new Date(), 'EEEE, d MMM yyyy')}
          </div>
        </div>
      </div>

      {/* Bill Notification for Parents */}
      {isParent && pendingBills.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-white border-2 border-red-500/20 p-6 sm:p-8 rounded-[2.5rem] flex flex-col lg:flex-row items-center justify-between gap-8 shadow-2xl shadow-red-100"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-red-500/5 rounded-full -ml-12 -mb-12 blur-xl"></div>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 w-full lg:w-auto text-center sm:text-left">
            <div className="w-20 h-20 bg-red-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-red-200 shrink-0 transform -rotate-3 animate-pulse">
               <CreditCard className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tighter uppercase font-display">{t.pending_bills}</h3>
              </div>
              <p className="text-gray-500 font-medium text-sm sm:text-base max-w-md">
                {t.bill_notice.replace('{count}', pendingBills.length.toString())}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto relative z-10">
            <div className="text-center sm:text-right px-6 py-4 bg-gray-50 rounded-2xl border border-gray-100 flex-1 sm:flex-none">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.total_obligation}</p>
               <p className="text-3xl font-black text-gray-900 tracking-tighter italic font-display">{formatCurrency(pendingBills.reduce((s, b) => s + b.amount, 0))}</p>
            </div>
            <Link 
              to="/financials" 
              className="group bg-gray-900 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-gray-200 hover:bg-indigo-600 transition-all active:scale-95 text-center flex items-center gap-3 w-full sm:w-auto justify-center"
            >
              {t.pay_now}
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* Upcoming Sessions Notification */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 overflow-hidden relative group">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">{t.upcoming_sessions}</h3>
          </div>
          <Link to="/schedule" className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">
            {t.view_all_sessions}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {upcoming.length === 0 ? (
            <div className="col-span-full py-10 flex flex-col items-center justify-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <AlertCircle className="w-8 h-8 text-gray-200 mb-2" />
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest italic">{t.no_schedule}</p>
            </div>
          ) : (
            upcoming.map((s, index) => (
              <motion.div 
                key={s.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-50 hover:bg-white hover:shadow-xl hover:shadow-indigo-50 border border-transparent hover:border-indigo-100 p-4 rounded-2xl transition-all group/item cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-1.5 h-12 rounded-full",
                    s.type.includes('Shadow') ? "bg-blue-500" : "bg-emerald-500"
                  )}></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{s.type}</p>
                    <p className="text-sm font-bold text-gray-900 truncate tracking-tight">{s.studentId}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-[10px] font-bold text-gray-500">{s.startTime}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                      <span className="text-[10px] font-bold text-gray-500 truncate">{s.teacherId}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isParent ? (
           <>
            <StatCard 
              title={t.child_progress} 
              value="Sangat Baik" 
              change={t.monthly_revenue} 
              icon={BookOpen} 
              color="blue" 
            />
            <StatCard 
              title="Sesi Selesai" 
              value={stats.reports.toString()} 
              change="Sesi" 
              icon={Clock} 
              color="emerald" 
            />
            <StatCard 
              title={t.attendance} 
              value="100%" 
              change="Hadir" 
              icon={ShieldCheck} 
              color="orange" 
            />
            <StatCard 
              title="Laporan Baru" 
              value={stats.reports.toString()} 
              change="Laporan" 
              icon={ArrowUpRight} 
              color="indigo" 
            />
           </>
        ) : (
          <>
            <StatCard 
              title={t.active_students} 
              value={stats.students.toString()} 
              change="+0" 
              icon={Users} 
              color="blue" 
            />
            <StatCard 
              title={t.monthly_revenue} 
              value={formatCurrency(stats.revenue)} 
              change="+0" 
              icon={TrendingUp} 
              color="emerald" 
            />
            <StatCard 
              title={t.attendance_rate} 
              value={stats.attendance + "%"} 
              change="Stabil" 
              icon={Clock} 
              color="orange" 
            />
            <StatCard 
              title="Laporan Masuk" 
              value={stats.reports.toString()} 
              change="+0" 
              icon={ArrowUpRight} 
              color="indigo" 
            />
          </>
        )}
      </div>

      {/* Main Charts / Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Card */}
        <div className={cn(
          "lg:col-span-2 bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group",
          isParent && "flex flex-col justify-center items-center text-center p-12"
        )}>
          {isParent ? (
            <div className="space-y-6">
              <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <TrendingUp className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase font-display">{t.child_progress}</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-2">{t.progress_desc}</p>
              </div>
              <Link to="/progress" className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap">{t.view_full_report}</Link>
            </div>
          ) : (
            <>
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
                  <AreaChart data={revenueData.length > 0 ? revenueData : [
                    { name: 'Start', revenue: 0 },
                    { name: 'End', revenue: 0 },
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
            </>
          )}
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-gray-200 relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
               <ShieldCheck className="w-32 h-32" />
            </div>
            <h3 className="font-black text-xs uppercase tracking-[0.2em] mb-4 text-indigo-400">{t.announcements}</h3>
            
            <div className="space-y-4 mb-6">
              {announcements.length === 0 ? (
                <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">No active announcements</p>
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
      className="bg-white p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-100 transition-all duration-500 group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-3 rounded-2xl shadow-sm transition-transform group-hover:scale-110 duration-500", colors[color])}>
          <Icon className="w-6 h-6" />
        </div>
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border",
          change.startsWith('+') ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-gray-50 text-gray-400 border-gray-100"
        )}>
          {change}
        </span>
      </div>
      <div>
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{title}</h4>
        <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tighter italic font-display">{value}</p>
      </div>
    </motion.div>
  );
};
