import React, { useState, useEffect } from 'react';
import { fetchApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Plus, 
  QrCode, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Megaphone,
  History,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { AppSettings, Payment, Announcement } from '../types';
import { motion, AnimatePresence } from 'motion/react';

export const Financials: React.FC = () => {
  const { profile } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [proofUrl, setProofUrl] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [payData, annData, settData] = await Promise.all([
          fetchApi('/api/payments'),
          fetchApi('/api/announcements'),
          fetchApi('/api/settings')
        ]);
        setPayments(payData);
        setAnnouncements(annData.filter((a: any) => a.type === 'info' || a.type === 'program'));
        setSettings(settData);
      } catch (err) {
        console.error("Failed to load financials:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleUploadProof = async () => {
    if (!selectedPayment || !proofUrl) return;
    try {
      await fetchApi(`/api/payments`, {
        method: 'POST',
        body: JSON.stringify({
          ...selectedPayment,
          proofUrl,
          status: 'paid'
        })
      });
      setShowUploadModal(false);
      setProofUrl('');
      // Refresh
      const payData = await fetchApi('/api/payments');
      setPayments(payData);
    } catch (err) {
      alert("Gagal mengunggah bukti");
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      const paymentToVerify = payments.find(p => p.id === paymentId);
      if (!paymentToVerify) return;

      await fetchApi(`/api/payments`, {
        method: 'POST',
        body: JSON.stringify({
          ...paymentToVerify,
          status: 'verified'
        })
      });
      // Refresh
      const payData = await fetchApi('/api/payments');
      setPayments(payData);
    } catch (err) {
      alert("Gagal memverifikasi pembayaran");
    }
  };

  const isParent = profile?.role === 'parent';
  const isAdmin = profile?.role === 'admin';
  const pendingPayment = payments.find(p => p.status === 'pending');
  const totalRevenue = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <div className="p-20 text-center font-black uppercase text-gray-400 animate-pulse tracking-widest text-xs">Memuat Data Keuangan...</div>;

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tighter leading-none">Keuangan & Tagihan</h2>
          <p className="text-gray-500 font-medium mt-2 uppercase tracking-[0.2em] text-[10px]">
            {isParent ? "Informasi Pembayaran Bulanan Siswa" : "Rekapitulasi Keuangan Operasional"}
          </p>
        </div>
        {!isParent && (
          <button className="bg-gray-900 text-white px-6 py-4 rounded-[1.5rem] text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-gray-200 hover:scale-[1.02] transition-all">
            <Plus className="w-4 h-4" /> Catat Transaksi
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {isParent ? (
            <>
              {/* CURRENT BILL SECTION FOR PARENTS */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-xl overflow-hidden relative"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <QrCode className="w-40 h-40" />
                </div>
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight">Status Tagihan</h3>
                </div>

                {pendingPayment ? (
                  <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-red-50/50 p-6 rounded-[2rem] border border-red-100">
                      <div>
                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Total Tagihan Belum Dibayar</p>
                        <h4 className="text-3xl font-black text-red-600">{formatCurrency(pendingPayment.amount)}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-red-500 font-bold text-xs">
                        <AlertCircle className="w-4 h-4" />
                        Jatuh Tempo: {new Date(pendingPayment.date).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Metode Pembayaran QRIS</p>
                        <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 flex flex-col items-center justify-center">
                          {settings?.qrisUrl ? (
                            <img src={settings.qrisUrl} alt="QRIS" className="w-full max-w-[200px] aspect-square object-contain" />
                          ) : (
                            <div className="p-10 text-gray-300 text-center space-y-2">
                                <QrCode className="w-12 h-12 mx-auto opacity-20" />
                                <p className="text-[10px] uppercase font-black">QRIS Belum Diatur</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col justify-center space-y-4">
                        <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                           <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-3">Instruksi Pembayaran</p>
                           <ul className="text-xs space-y-3 font-semibold text-blue-700/80">
                             <li className="flex gap-2"><span>1.</span> Scan QRIS diatas menggunakan aplikasi bank atau e-wallet.</li>
                             <li className="flex gap-2"><span>2.</span> Masukkan nominal sesuai tagihan.</li>
                             <li className="flex gap-2"><span>3.</span> Simpan bukti transfer & unggah di aplikasi.</li>
                           </ul>
                        </div>
                        <button 
                          onClick={() => {
                            setSelectedPayment(pendingPayment);
                            setShowUploadModal(true);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest py-5 rounded-[1.5rem] shadow-xl shadow-blue-100 flex items-center justify-center gap-2 transition-all"
                        >
                          <Upload className="w-4 h-4" /> Unggah Bukti Bayar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-xl font-black text-gray-900 tracking-tight">Tagihan Lunas</h4>
                      <p className="text-gray-500 text-xs font-medium max-w-xs mt-1">Terima kasih! Tidak ada tagihan tertunda saat ini.</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* ADVERTISEMENTS / ANNOUNCEMENTS FOR PARENTS */}
              {announcements.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Megaphone className="w-4 h-4 text-blue-600" />
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Informasi Penting</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {announcements.slice(0, 2).map((ann) => (
                      <div key={ann.id} className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:rotate-12 transition-transform duration-500">
                          <Megaphone className="w-20 h-20" />
                        </div>
                        <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest mb-3">{ann.type}</span>
                        <h5 className="text-lg font-black tracking-tight mb-2 leading-tight">{ann.title}</h5>
                        <p className="text-xs text-gray-300 font-medium line-clamp-2 leading-relaxed opacity-80">{ann.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* ADMIN VIEW OVERVIEW */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl relative overflow-hidden">
                   <div className="absolute -bottom-10 -right-10 opacity-5 text-emerald-600">
                      <TrendingUp className="w-40 h-40" />
                   </div>
                   <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl w-fit mb-6">
                      <TrendingUp className="w-6 h-6"/>
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Pendapatan Terverifikasi</p>
                   <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{formatCurrency(totalRevenue)}</h3>
                   <div className="mt-4 flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase">
                      <TrendingUp className="w-3 h-3" /> +12% dari bulan lalu
                   </div>
                </div>
                
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl relative overflow-hidden">
                   <div className="absolute -bottom-10 -right-10 opacity-5 text-red-600">
                      <Clock className="w-40 h-40" />
                   </div>
                   <div className="p-4 bg-red-50 text-red-600 rounded-2xl w-fit mb-6">
                      <Clock className="w-6 h-6"/>
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tagihan Tertunda</p>
                   <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{formatCurrency(payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0))}</h3>
                   <div className="mt-4 flex items-center gap-2 text-red-500 text-[10px] font-black uppercase">
                      {payments.filter(p => p.status === 'pending').length} Orang belum bayar
                   </div>
                </div>
              </div>
            </>
          )}

          {/* HISTORY TABLE */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-black text-gray-900 tracking-tight">Riwayat Pembayaran</h3>
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{payments.length} Transaksi</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Waktu</th>
                    {!isParent && <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Siswa</th>}
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Jumlah</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bukti</th>
                    {!isParent && <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.length === 0 ? (
                    <tr><td colSpan={isParent ? 4 : 6} className="p-16 text-center text-gray-300 text-xs font-black uppercase tracking-widest">Tidak ada riwayat transaksi</td></tr>
                  ) : (
                    payments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <p className="text-sm font-bold text-gray-900">{new Date(p.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{p.type}</p>
                        </td>
                        {!isParent && (
                          <td className="px-8 py-5 text-sm font-black text-blue-600">{p.studentId}</td>
                        )}
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-gray-900">{formatCurrency(p.amount)}</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                            p.status === 'verified' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            p.status === 'paid' ? "bg-blue-50 text-blue-600 border-blue-100" :
                            "bg-red-50 text-red-600 border-red-100"
                          )}>
                            {p.status === 'verified' ? 'Terverifikasi' : p.status === 'paid' ? 'Diproses' : 'Menunggu'}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          {p.proofUrl ? (
                            <a href={p.proofUrl} target="_blank" rel="noreferrer" className="p-2 bg-gray-100 text-gray-500 hover:text-blue-600 rounded-xl transition-colors inline-block">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">Tidak Ada</span>
                          )}
                        </td>
                        {!isParent && (
                           <td className="px-8 py-5">
                             {isAdmin && p.status === 'paid' && (
                               <button 
                                 onClick={() => handleVerifyPayment(p.id)}
                                 className="px-3 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                               >
                                 Verifikasi
                               </button>
                             )}
                           </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Info Area */}
        <div className="space-y-6">
          <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <GradientLogoIcon className="w-40 h-40" />
             </div>
             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-200 mb-6 relative">Estimasi Biaya</h3>
             
             <div className="space-y-6 relative">
                <div className="border-b border-white/10 pb-4">
                  <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Biaya Bulanan Saat Ini</p>
                  <h4 className="text-2xl font-black">{formatCurrency(settings?.monthlyFee || 0)}</h4>
                  <p className="text-[9px] text-blue-100/60 font-medium mt-1">* Berlaku untuk layanan shadow teacher & terapi intensif.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-blue-200">
                    <span>Shadow TK</span>
                    <span className="text-white">2.0jt</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-blue-200">
                    <span>Shadow SD (1-3)</span>
                    <span className="text-white">3.0jt</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-blue-200">
                    <span>Shadow SD (4-6)</span>
                    <span className="text-white">3.5jt</span>
                  </div>
                </div>

                <div className="pt-4 mt-6 border-t border-white/10">
                   <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest leading-relaxed">
                     Punya pertanyaan terkait biaya? Hubungi Admin kami langsung melalui WhatsApp di menu Bantuan.
                   </p>
                </div>
             </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-4 group cursor-pointer hover:border-blue-200 transition-all">
             <div className="p-4 bg-gray-50 group-hover:bg-blue-50 text-gray-400 group-hover:text-blue-500 rounded-2xl transition-colors">
                <Download className="w-6 h-6" />
             </div>
             <div>
                <h5 className="text-sm font-black text-gray-900 tracking-tight">Unduh Laporan</h5>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">PDF Rekap Tahunan</p>
             </div>
          </div>
        </div>
      </div>

      {/* Upload Proof Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl relative p-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Upload className="w-32 h-32" />
              </div>
              
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter mb-2">Unggah Bukti Pembayaran</h3>
              <p className="text-gray-500 font-medium text-xs mb-8">Tempelkan URL gambar bukti transfer Anda untuk proses verifikasi oleh admin.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">Link Bukti Transfer (Image URL)</label>
                  <input 
                    type="text" 
                    value={proofUrl}
                    onChange={(e) => setProofUrl(e.target.value)}
                    placeholder="https://imgur.com/bukti-saya.png"
                    className="w-full bg-gray-50 border-none px-6 py-4 rounded-3xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 outline-none shadow-inner"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-500 font-black text-xs uppercase tracking-widest py-5 rounded-3xl transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    onClick={handleUploadProof}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest py-5 rounded-3xl shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
                  >
                    Kirim Bukti
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple helper for logo icon
const GradientLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
