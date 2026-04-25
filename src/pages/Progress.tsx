import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { LineChart, Plus, FileText, Search } from 'lucide-react';

export const Progress: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/api/reports').then(setReports).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan Perkembangan</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Laporan Baru
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="space-y-4">
           {loading ? <p className="text-center py-10">Memuat...</p> : 
            reports.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Belum ada laporan perkembangan</p>
              </div>
            ) : 
            reports.map(r => (
              <div key={r.id} className="p-6 border border-gray-100 rounded-[2rem] hover:shadow-lg transition-all">
                <p className="text-[10px] font-black text-blue-600 uppercase mb-1">{r.date}</p>
                <h4 className="text-lg font-black text-gray-900 uppercase">{r.studentId}</h4>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{r.content}</p>
              </div>
            ))
           }
        </div>
      </div>
    </div>
  );
};
