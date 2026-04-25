import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { ClipboardCheck, Search, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export const Attendance: React.FC = () => {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/api/students').then(setStudents).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Kehadiran Hari Ini</h2>
          <p className="text-gray-500">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Siswa</th>
              <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status Kehadiran</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? <tr><td colSpan={2} className="p-10 text-center">Memuat...</td></tr> : 
             students.map(s => (
               <tr key={s.id}>
                 <td className="px-6 py-4 font-bold">{s.name}</td>
                 <td className="px-6 py-4">
                    <div className="flex gap-2">
                       <button className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold uppercase tracking-widest">Hadir</button>
                       <button className="px-4 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold uppercase tracking-widest">Izin</button>
                    </div>
                 </td>
               </tr>
             ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
};
