import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { LineChart, Plus, FileText, Search } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';
import { translations } from '../constants/translations';

export const Progress: React.FC = () => {
  const { settings: appSettings } = useSettings();
  const lang = appSettings.language || 'id';
  const t = translations[lang];

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/api/reports').then(setReports).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight italic uppercase">
            {t.progress}
          </h1>
          <p className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-2 italic flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-500" /> {t.progress_desc_short}
          </p>
        </div>
        <button className="bg-gray-900 hover:bg-black text-white px-8 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-gray-200 transition-all hover:scale-[1.02] active:scale-95">
          <Plus className="w-4 h-4" /> {t.new_report}
        </button>
      </div>

      <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden p-6 sm:p-10">
        <div className="space-y-6">
           {loading ? (
             <div className="p-20 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">{t.loading_database}</div>
           ) : reports.length === 0 ? (
              <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                <FileText className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{t.no_reports}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reports.map(r => (
                  <div key={r.id} className="p-8 border border-gray-50 rounded-[2rem] bg-white hover:shadow-2xl transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity">
                      <FileText className="w-20 h-20" />
                    </div>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        {new Date(r.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <div className="p-2 bg-gray-50 text-gray-300 rounded-lg group-hover:text-indigo-600 transition-colors">
                        <Search className="w-4 h-4" />
                      </div>
                    </div>
                    <h4 className="text-xl font-black text-gray-900 tracking-tighter uppercase italic">{r.studentId}</h4>
                    <p className="text-xs text-gray-500 mt-4 leading-relaxed line-clamp-3 font-medium">{r.content}</p>
                    <div className="mt-6 pt-4 border-t border-gray-50 flex justify-end">
                       <button className="text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-indigo-600 transition-colors">{t.download_pdf}</button>
                    </div>
                  </div>
                ))}
              </div>
            )
           }
        </div>
      </div>
    </div>
  );
};
