import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { ClipboardCheck, Search, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export const Attendance: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/api/students').then(setStudents).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight italic uppercase">
            Presensi
          </h1>
          <p className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-500" /> {format(new Date(), 'EEEE, d MMMM yyyy')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">Nama Siswa</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status Kehadiran</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={2} className="px-8 py-12 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">
                    Sinkronisasi Data Siswa...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-8 py-12 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Belum ada data siswa
                  </td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-gray-900 font-black uppercase tracking-tighter italic text-base">{s.name}</p>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Siswa Aktif</p>
                    </td>
                    <td className="px-8 py-6">
                        <div className="flex justify-end gap-2 sm:gap-3">
                           <button className="px-5 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-600 hover:text-white transition-all active:scale-95">
                             Hadir
                           </button>
                           <button className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-red-600 hover:text-white transition-all active:scale-95">
                             Izin
                           </button>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
