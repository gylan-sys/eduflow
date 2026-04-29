import React, { useState, useEffect, useMemo } from 'react';
import { fetchApi } from '../lib/api';
import { LineChart as LineChartIcon, Plus, FileText, Search, TrendingUp, Brain, Users, Zap } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { translations } from '../constants/translations';
import { useAuth } from '../contexts/AuthContext';
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';
import { cn } from '../lib/utils';

export const Progress: React.FC = () => {
  const { profile } = useAuth();
  const { settings: appSettings } = useSettings();
  const lang = appSettings.language || 'id';
  const t = translations[lang];

  const [reports, setReports] = useState<any[]>([]);
  const [sessionReports, setSessionReports] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  useEffect(() => {
    Promise.all([
      fetchApi('/api/reports'),
      fetchApi('/api/session-reports'),
      fetchApi('/api/students')
    ]).then(([rData, srData, sData]) => {
      setReports(rData);
      setSessionReports(srData);
      setStudents(sData);
      
      if (sData && sData.length > 0) {
        if (profile?.role === 'parent' && profile.studentId) {
          setSelectedStudentId(profile.studentId);
        } else if (profile?.role === 'teacher' && profile.assignedStudentIds?.length > 0) {
          setSelectedStudentId(profile.assignedStudentIds[0]);
        } else {
          setSelectedStudentId(sData[0].id);
        }
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [profile]);

  const getStudentName = (id: string) => {
    return students.find(s => s.id === id)?.name || id;
  };

  const chartData = useMemo(() => {
    if (!selectedStudentId) return [];
    return sessionReports
      .filter(r => r.studentId === selectedStudentId)
      .map(r => ({
        date: new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        fullDate: r.date,
        focus: r.focusScore || 0,
        social: r.socialScore || 0,
        skill: r.skillScore || 0
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
      .slice(-10);
  }, [sessionReports, selectedStudentId]);

  const metricsSummary = useMemo(() => {
    if (chartData.length === 0) return null;
    const latest = chartData[chartData.length - 1];
    const prev = chartData.length > 1 ? chartData[chartData.length - 2] : latest;
    
    return {
      focus: { val: latest.focus, diff: latest.focus - prev.focus },
      social: { val: latest.social, diff: latest.social - prev.social },
      skill: { val: latest.skill, diff: latest.skill - prev.skill }
    };
  }, [chartData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="p-20 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
          {t.loading_database}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight italic uppercase">
            {t.progress}
          </h1>
          <p className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
            <LineChartIcon className="w-4 h-4 text-emerald-500" /> {t.progress_desc_short}
          </p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'teacher') && (
          <button className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-gray-200 transition-all hover:scale-[1.02] active:scale-95">
            <Plus className="w-4 h-4" /> {t.new_report}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
               <div>
                  <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Kurva Perkembangan</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Metrik terukur dari sesi pendampingan</p>
               </div>
               <select 
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64"
               >
                 {students
                    .filter(s => {
                      if (profile?.role === 'teacher') return profile.assignedStudentIds?.includes(s.id);
                      if (profile?.role === 'parent') return profile.studentId === s.id;
                      return true;
                    })
                    .map(s => (
                   <option key={s.id} value={s.id}>{s.name}</option>
                 ))}
               </select>
            </div>

            {chartData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSocial" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSkill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 800, fill: '#9ca3af' }}
                      dy={10}
                    />
                    <YAxis 
                      domain={[0, 10]} 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fontWeight: 800, fill: '#9ca3af' }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: '10px', fontWeight: 'bold' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '20px' }} />
                    <Area type="monotone" dataKey="focus" name="Fokus" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorFocus)" />
                    <Area type="monotone" dataKey="social" name="Sosial" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSocial)" />
                    <Area type="monotone" dataKey="skill" name="Skill" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSkill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                <TrendingUp className="w-12 h-12 text-gray-200 mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center px-10">
                  Belum ada data metrik tersedia untuk ananda {getStudentName(selectedStudentId)}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl h-full space-y-6">
             <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">Kondisi Terkini</h3>
             <div className="space-y-4">
                {[
                  { label: 'Fokus & Konsentrasi', key: 'focus', icon: Brain, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'Interaksi Sosial', key: 'social', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  { label: 'Kemajuan Belajar', key: 'skill', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' }
                ].map(m => {
                  const stat = metricsSummary ? (metricsSummary as any)[m.key] : { val: 0, diff: 0 };
                  return (
                    <div key={m.key} className="p-5 rounded-2xl bg-gray-50 border border-gray-100 group hover:shadow-lg transition-all">
                      <div className="flex items-center gap-4">
                        <div className={cn("p-3 rounded-xl", m.bg, m.color)}>
                          <m.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{m.label}</p>
                          <div className="flex items-baseline gap-2">
                             <p className="text-2xl font-black text-gray-900 italic">{stat.val}/10</p>
                             {stat.diff !== 0 && (
                               <span className={cn("text-[10px] font-bold", stat.diff > 0 ? "text-emerald-500" : "text-red-500")}>
                                 {stat.diff > 0 ? '+' : ''}{stat.diff}
                               </span>
                             )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
             </div>
             <p className="text-[9px] font-bold text-gray-400 italic text-center leading-relaxed">
               Skor berdasarkan rata-rata penilaian pendamping pada sesi terbaru.
             </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-indigo-500" />
          <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">Laporan & Dokumentasi</h3>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 sm:p-12">
            {reports.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                <FileText className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{t.no_reports}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {reports
                  .filter(r => {
                    if (profile?.role === 'teacher') return profile.assignedStudentIds?.includes(r.studentId);
                    if (profile?.role === 'parent') return profile.studentId === r.studentId;
                    return true;
                  })
                  .map(r => (
                  <div key={r.id} className="p-8 border border-slate-100 rounded-[2.5rem] bg-slate-50/30 hover:bg-white hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-full hover:-translate-y-1">
                    <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                      <FileText className="w-24 h-24" />
                    </div>
                    <div className="flex items-center justify-between mb-6">
                      <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-4 py-1.5 bg-white rounded-full border border-indigo-100 shadow-sm">
                        {new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <h4 className="text-xl font-black text-gray-900 tracking-tight uppercase italic">{getStudentName(r.studentId)}</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{r.type || 'Laporan Perkembangan'}</p>
                    <p className="text-xs text-slate-600 mt-6 leading-relaxed line-clamp-4 font-medium flex-1">{r.content}</p>
                    <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                       <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors flex items-center gap-2">
                         <Search className="w-4 h-4" /> Baca Detail
                       </button>
                       <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">{t.download_pdf}</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
