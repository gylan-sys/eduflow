import React, { useState, useEffect, useRef } from 'react';
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
  ExternalLink,
  Package,
  Trash2,
  Edit2,
  Search
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { AppSettings, Payment, Announcement, Student, Program } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import { translations } from '../constants/translations';
import { isDateRecent } from '../lib/validation';

export const Financials: React.FC = () => {
  const { profile } = useAuth();
  const { settings: appSettings } = useSettings();
  const lang = appSettings.language || 'id';
  const t = translations[lang];

  const [payments, setPayments] = useState<Payment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'programs'>('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [historyFilter, setHistoryFilter] = useState<{status: string, search: string}>({status: 'all', search: ''});

  // Billing form state
  const [billingForm, setBillingForm] = useState({
    studentId: '',
    programId: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    type: 'tuition' as any
  });

  // Program form state
  const [editingProgram, setEditingProgram] = useState<Partial<Program> | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [payData, annData, settData, studData, progData] = await Promise.all([
          fetchApi('/api/payments'),
          fetchApi('/api/announcements'),
          fetchApi('/api/settings'),
          fetchApi('/api/students'),
          fetchApi('/api/programs')
        ]);
        setPayments(payData);
        setAnnouncements(annData.filter((a: any) => a.type === 'info' || a.type === 'program'));
        setSettings(settData);
        setStudents(studData);
        setPrograms(progData);
      } catch (err) {
        console.error("Failed to load financials:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleProgramSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram?.name || editingProgram.price === undefined) return;

    try {
      if (editingProgram.id) {
        await fetchApi(`/api/programs/${editingProgram.id}`, {
          method: 'PUT',
          body: JSON.stringify(editingProgram)
        });
      } else {
        await fetchApi('/api/programs', {
          method: 'POST',
          body: JSON.stringify(editingProgram)
        });
      }
      setShowProgramModal(false);
      const progData = await fetchApi('/api/programs');
      setPrograms(progData);
    } catch (err) {
      alert("Gagal menyimpan program");
    }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm("Hapus program ini?")) return;
    try {
      await fetchApi(`/api/programs/${id}`, { method: 'DELETE' });
      const progData = await fetchApi('/api/programs');
      setPrograms(progData);
    } catch (err) {
      alert("Gagal menghapus program");
    }
  };

  const handleBillingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingForm.studentId || !billingForm.amount) return;

    // Validation
    if (!isDateRecent(billingForm.date)) {
      alert("Tanggal pembayaran harus dalam rentang 1 tahun terakhir hingga 3 bulan ke depan");
      return;
    }

    try {
      await fetchApi('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          ...billingForm,
          status: 'pending'
        })
      });
      setShowBillingModal(false);
      const payData = await fetchApi('/api/payments');
      setPayments(payData);
      setBillingForm({
        studentId: '',
        programId: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        type: 'tuition'
      });
    } catch (err) {
      alert("Gagal membuat tagihan");
    }
  };

  const handleProgramSelect = (progId: string) => {
    const prog = programs.find(p => p.id === progId);
    if (prog) {
      setBillingForm({
        ...billingForm,
        programId: progId,
        amount: prog.price,
        type: 'tuition'
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('adiba_token');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error("Gagal mengunggah file");
      
      const data = await response.json();
      setProofUrl(data.url);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Gagal mengunggah bukti pembayaran.");
    } finally {
      setUploading(false);
    }
  };

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
  const filteredPayments = payments.filter(p => {
    const matchesStatus = historyFilter.status === 'all' || p.status === historyFilter.status;
    const matchesSearch = p.studentId.toLowerCase().includes(historyFilter.search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0);

  if (loading) return <div className="p-20 text-center font-black uppercase text-gray-400 animate-pulse tracking-widest text-xs">Memuat Data Keuangan...</div>;

  return (
    <div className="space-y-8 pb-10">
      {/* Modals */}
      <AnimatePresence>
        {showBillingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBillingModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative p-10 overflow-visible z-10"
            >
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter mb-8">{t.record_billing}</h3>
              <form onSubmit={handleBillingSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">{t.select_student}</label>
                  <select 
                    required
                    value={billingForm.studentId}
                    onChange={(e) => setBillingForm({...billingForm, studentId: e.target.value})}
                    className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 outline-none"
                  >
                    <option value="">{t.select_student}</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">{t.select_program} ({t.optional})</label>
                    <select 
                      value={billingForm.programId}
                      onChange={(e) => handleProgramSelect(e.target.value)}
                      className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 outline-none"
                    >
                      <option value="">{t.select_program}</option>
                      {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">{t.bill_amount}</label>
                    <input 
                      type="number" 
                      required
                      value={billingForm.amount || ''}
                      onChange={(e) => setBillingForm({...billingForm, amount: Number(e.target.value)})}
                      className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowBillingModal(false)} className="flex-1 px-6 py-4 rounded-2xl bg-gray-100 font-bold text-xs uppercase tracking-widest">{t.cancel}</button>
                  <button type="submit" className="flex-1 px-6 py-4 rounded-2xl bg-gray-900 text-white font-bold text-xs uppercase tracking-widest shadow-xl">{t.create_bill}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showProgramModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowProgramModal(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl relative p-10 z-10"
            >
              <h3 className="text-2xl font-black text-gray-900 tracking-tighter mb-8">
                {editingProgram?.id ? "Edit Program" : "Tambah Program Baru"}
              </h3>
              <form onSubmit={handleProgramSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">Nama Program</label>
                  <input 
                    type="text" required
                    value={editingProgram?.name || ''}
                    onChange={(e) => setEditingProgram({...editingProgram, name: e.target.value})}
                    className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="Contoh: Program Renang Intensif"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">Harga (Nominal)</label>
                  <input 
                    type="number" required
                    value={editingProgram?.price || ''}
                    onChange={(e) => setEditingProgram({...editingProgram, price: Number(e.target.value)})}
                    className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 outline-none"
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">Keterangan / Included Items</label>
                  <textarea 
                    value={editingProgram?.description || ''}
                    onChange={(e) => setEditingProgram({...editingProgram, description: e.target.value})}
                    className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-600 outline-none h-24"
                    placeholder="Apa saja yang didapat siswa..."
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowProgramModal(false)} className="flex-1 px-6 py-4 rounded-2xl bg-gray-100 font-bold text-xs uppercase tracking-widest">Batal</button>
                  <button type="submit" className="flex-1 px-6 py-4 rounded-2xl bg-blue-600 text-white font-bold text-xs uppercase tracking-widest shadow-xl">Simpan Program</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 tracking-tighter leading-tight italic uppercase">
            {t.financials}
          </h1>
          <p className="text-gray-500 font-bold text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-2 italic">
            {isParent ? t.parent_financial_desc : t.financial_overview}
          </p>
        </div>
        {!isParent && (
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setActiveTab(activeTab === 'programs' ? 'overview' : 'programs')}
              className={cn(
                "flex-1 md:flex-none px-6 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
                activeTab === 'programs' ? "bg-blue-600 text-white shadow-xl shadow-blue-100" : "bg-white text-gray-600 border border-gray-100"
              )}
            >
              <Package className="w-4 h-4" /> Program
            </button>
            <button 
              onClick={() => setShowBillingModal(true)}
              className="flex-1 md:flex-none bg-gray-900 text-white px-6 py-4 rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl shadow-gray-100 hover:scale-[1.02] transition-all"
            >
              <Plus className="w-4 h-4" /> Transaksi
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          {isParent ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 border border-gray-100 shadow-xl overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <QrCode className="w-32 sm:w-40 h-32 sm:h-40" />
              </div>
              
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-gray-900 tracking-tight italic uppercase">{t.billing_status}</h3>
              </div>

              {pendingPayment ? (
                <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-red-50/50 p-6 rounded-[1.5rem] border border-red-100">
                    <div>
                      <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 italic">{t.unpaid_bill}</p>
                      <h4 className="text-3xl sm:text-4xl font-black text-red-600 tracking-tighter italic">{formatCurrency(pendingPayment.amount)}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-red-500 font-bold text-[10px] uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full">
                      <AlertCircle className="w-3 h-3" />
                      {t.bill_validity}: {new Date(pendingPayment.date).toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-2 italic">QRIS ADIBA</p>
                      <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex flex-col items-center justify-center shadow-inner">
                        {settings?.qrisUrl ? (
                          <img src={settings.qrisUrl} alt="QRIS" className="w-full max-w-[240px] aspect-square object-contain" />
                        ) : (
                          <div className="p-16 text-gray-300 text-center space-y-3">
                              <QrCode className="w-16 h-16 mx-auto opacity-10" />
                              <p className="text-[10px] uppercase font-black tracking-widest">QRIS Belum Tersedia</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col justify-center space-y-6">
                      <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                         <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-4 italic">{t.payment_guide}</p>
                         <ul className="text-xs space-y-4 font-bold text-blue-800/70">
                           <li className="flex gap-3">
                             <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-[10px] shrink-0">1</span>
                             <span>Scan QRIS via M-Bank / E-Wallet</span>
                           </li>
                           <li className="flex gap-3">
                             <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-[10px] shrink-0">2</span>
                             <span>Bayar sesuai tagihan</span>
                           </li>
                           <li className="flex gap-3">
                             <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-[10px] shrink-0">3</span>
                             <span>Unggah bukti di tombol bawah</span>
                           </li>
                         </ul>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedPayment(pendingPayment);
                          setShowUploadModal(true);
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest py-5 rounded-[1.2rem] shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <Upload className="w-4 h-4" /> {t.upload_proof}
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
                    <h4 className="text-xl font-black text-gray-900 tracking-tight">{t.bill_paid_title}</h4>
                    <p className="text-gray-500 text-xs font-medium max-w-xs mt-1">{t.bill_paid_desc}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'programs' ? (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Daftar Program & Biaya</h3>
                <button 
                  onClick={() => {
                    setEditingProgram({});
                    setShowProgramModal(true);
                  }}
                  className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700"
                >
                  <Plus className="w-3 h-3" /> Tambah Program
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {programs.length === 0 ? (
                  <div className="col-span-2 p-20 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200">
                    <Package className="w-12 h-12 mx-auto text-gray-200 mb-4" />
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Belum ada program terdaftar</p>
                  </div>
                ) : (
                  programs.map(prog => (
                    <div key={prog.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl relative group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                          <Package className="w-5 h-5" />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              setEditingProgram(prog);
                              setShowProgramModal(true);
                            }}
                            className="p-2 hover:bg-gray-100 text-gray-400 hover:text-blue-600 rounded-lg transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProgram(prog.id)}
                            className="p-2 hover:bg-gray-100 text-gray-400 hover:text-red-600 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-lg font-black text-gray-900 tracking-tight mb-2">{prog.name}</h4>
                      <p className="text-2xl font-black text-blue-600 mb-4">{formatCurrency(prog.price)}</p>
                      {prog.description && (
                        <p className="text-xs text-gray-500 font-medium leading-relaxed line-clamp-3">{prog.description}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
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
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.total_verified_revenue}</p>
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
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t.pending_bills}</p>
                   <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{formatCurrency(payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0))}</h3>
                   <div className="mt-4 flex items-center gap-2 text-red-500 text-[10px] font-black uppercase">
                      {payments.filter(p => p.status === 'pending').length} {t.people_unpaid}
                   </div>
                </div>
              </div>
            </>
          )}

          {/* HISTORY TABLE */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-black text-gray-900 tracking-tight">{t.history}</h3>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Cari siswa..."
                    value={historyFilter.search}
                    onChange={(e) => setHistoryFilter({...historyFilter, search: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-100 pl-9 pr-3 py-2 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select 
                  value={historyFilter.status}
                  onChange={(e) => setHistoryFilter({...historyFilter, status: e.target.value})}
                  className="w-full sm:w-auto bg-gray-50 border border-gray-100 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Menunggu</option>
                  <option value="paid">Diproses</option>
                  <option value="verified">Terverifikasi</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.time}</th>
                    {!isParent && <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.students}</th>}
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.amount}</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.status}</th>
                    <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.proof}</th>
                    {!isParent && <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.action}</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredPayments.length === 0 ? (
                    <tr><td colSpan={isParent ? 4 : 6} className="p-16 text-center text-gray-300 text-xs font-black uppercase tracking-widest">{t.no_transactions}</td></tr>
                  ) : (
                    filteredPayments.map(p => (
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
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">{t.no_proof}</span>
                          )}
                        </td>
                        {!isParent && (
                           <td className="px-8 py-5">
                             {isAdmin && p.status === 'paid' && (
                               <button 
                                 onClick={() => handleVerifyPayment(p.id)}
                                 className="px-3 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                               >
                                 {t.verify}
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
              <p className="text-gray-500 font-medium text-xs mb-8">Pilih file dari galeri atau tempelkan URL gambar bukti transfer Anda.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block px-1">Bukti Transfer</label>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      value={proofUrl || ''}
                      onChange={(e) => setProofUrl(e.target.value)}
                      placeholder="Pilih file atau masukkan URL"
                      className="flex-1 bg-gray-50 border-none px-6 py-4 rounded-3xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 outline-none shadow-inner"
                    />
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*"
                    />
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-gray-900 text-white px-6 py-4 rounded-3xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] transition-all disabled:opacity-50"
                    >
                      {uploading ? "..." : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                  {proofUrl && (
                    <div className="mt-3 relative group">
                      <img src={proofUrl} alt="Preview" className="w-full h-32 object-cover rounded-2xl border border-gray-100 shadow-sm" />
                      <button 
                        onClick={() => setProofUrl('')}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
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
