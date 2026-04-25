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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats & data from local API
        const [annData, sessions, studentsData, reportsData] = await Promise.all([
          fetchApi('/api/announcements'),
          fetchApi('/api/sessions'),
          profile?.role === 'parent' ? fetchApi(`/api/students`) : Promise.resolve(null),
          profile?.role === 'parent' ? fetchApi(`/api/reports`) : Promise.resolve(null)
        ]);
        
        if (annData) {
          setAnnouncements(annData.slice(0, 3));
        }

        if (sessions) {
          setUpcoming(sessions.filter((s: any) => new Date(s.date || s.startTime) >= new Date()).slice(0, 3));
        }

        if (profile?.role === 'parent' && studentsData && reportsData) {
          const myChild = studentsData.find((s: any) => s.id === profile.studentId);
          
          if (myChild) {
            setStats({
              students: 1, // Only 1 child
              revenue: 0, // Parents don't see revenue, maybe show "Sessions Paid" later
              attendance: 100, // Hardcoded for now
              reports: reportsData.length
            });
          }
        } else if (profile?.role !== 'parent') {
           // Admin/Teacher stats can be fetched similarly
           // For now keeping defaults or fetching basic counts
        }

      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (profile) fetchData();
  }, [profile, activeBusinessLine]);

  const isParent = profile?.role === 'parent';

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100">
             {isParent ? <BookOpen className="w-6 h-6 text-emerald-600" /> :
              activeBusinessLine === 'shadow' ? <Briefcase className="w-6 h-6 text-blue-600" /> : 
              activeBusinessLine === 'swimming' ? <Waves className="w-6 h-6 text-emerald-600" /> : 
              <GraduationCap className="w-6 h-6 text-indigo-600" />}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight leading-tight">Halo, {profile?.displayName}!</h2>
            <p className="text-gray-500 font-medium space-x-1">
              {isParent ? (
                <span>Memantau perkembangan anak Anda.</span>
              ) : (
                <>
                  <span>Melihat data</span>
                  <span className="font-bold text-gray-900 uppercase tracking-widest text-[10px] bg-gray-100 px-2 py-0.5 rounded ml-1">
                    {activeBusinessLine === 'both' ? 'Semua Bisnis' : activeBusinessLine === 'shadow' ? 'Shadow Teacher' : 'Les Renang'}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isParent ? (
           <>
            <StatCard 
              title="Status Belajar" 
              value="Sangat Baik" 
              change="Bulan Ini" 
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
              title="Kehadiran" 
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
              title="Total Siswa" 
              value={stats.students.toString()} 
              change="+0" 
              icon={Users} 
              color="blue" 
            />
            <StatCard 
              title="Total Pendapatan" 
              value={formatCurrency(stats.revenue)} 
              change="+0" 
              icon={TrendingUp} 
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
                <h3 className="text-xl font-black text-gray-900 uppercase">Perkembangan Anak</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-2">Semua laporan dan aktivitas anak Anda terekam dengan baik dalam sistem.</p>
              </div>
              <Link to="/progress" className="inline-block bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap">Lihat Laporan Lengkap</Link>
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
                  <AreaChart data={[
                    { name: 'Jan', revenue: 0 },
                    { name: 'Feb', revenue: 0 },
                    { name: 'Mar', revenue: 0 },
                    { name: 'Apr', revenue: 0 },
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
                  time={s.startTime}
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
