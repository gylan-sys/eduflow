import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Payment, Student } from '../types';
import { 
  Wallet, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ArrowUpRight, 
  ArrowDownLeft,
  Filter,
  Search,
  Receipt,
  Truck,
  CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

export const Financials: React.FC = () => {
  const { activeBusinessLine } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'paid'>('all');

  useEffect(() => {
    const qPayments = query(collection(db, 'payments'));
    const unsubscribePayments = onSnapshot(qPayments, (snapshot) => {
      setPayments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Payment[]);
      setLoading(false);
    });

    const qStudents = query(collection(db, 'students'));
    const unsubscribeStudents = onSnapshot(qStudents, (snapshot) => {
      setStudents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Student[]);
    });

    return () => {
      unsubscribePayments();
      unsubscribeStudents();
    };
  }, []);

  const handleMarkPaid = async (paymentId: string) => {
    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        status: 'paid',
        paidAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating payment:", error);
    }
  };

  const filteredPayments = payments.filter(p => {
    const student = students.find(s => s.id === p.studentId || s.name === p.studentId);
    const matchesBusinessLine = activeBusinessLine === 'both' || !student || student.type === 'both' || student.type === activeBusinessLine;
    
    if (activeTab === 'all') return matchesBusinessLine;
    return matchesBusinessLine && p.status === activeTab;
  });

  const totalRevenue = filteredPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingAmount = filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Keuangan</h2>
        <p className="text-gray-500">Kelola tagihan, pembayaran, dan biaya transport.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Terkumpul</p>
            <p className="text-2xl font-black text-gray-900 tracking-tighter">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Belum Bayar</p>
            <p className="text-2xl font-black text-gray-900 tracking-tighter">{formatCurrency(pendingAmount)}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-100 flex flex-col justify-between">
           <div className="flex justify-between items-start">
             <CreditCard className="w-8 h-8 opacity-40" />
             <div className="bg-white/20 px-2 py-1 rounded text-[10px] font-black uppercase">Statistik</div>
           </div>
           <div className="mt-4">
             <p className="text-blue-100 text-xs font-black uppercase tracking-widest">Margin Operasional</p>
             <p className="text-2xl font-black tracking-tighter">74.2%</p>
           </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex bg-gray-50 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('all')}
              className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'all' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-900")}
            >
              Semua
            </button>
            <button 
              onClick={() => setActiveTab('pending')}
              className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'pending' ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-900")}
            >
              Tertunda
            </button>
            <button 
              onClick={() => setActiveTab('paid')}
              className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", activeTab === 'paid' ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-900")}
            >
              Lunas
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari transaksi..." 
              className="bg-gray-50 border-none pl-10 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Siswa & Tipe</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Bulan/Tahun</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Nominal</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                 <tr><td colSpan={5} className="p-10 text-center text-gray-400 font-bold">Memuat data transaksi...</td></tr>
              ) : filteredPayments.length === 0 ? (
                 <tr><td colSpan={5} className="p-20 text-center text-gray-400 font-bold">Tidak ada transaksi ditemukan</td></tr>
              ) : filteredPayments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                        p.type === 'tuition' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                      )}>
                        {p.type === 'tuition' ? <Receipt className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 tracking-tight uppercase">{p.studentId}</p>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{p.type === 'tuition' ? 'Uang Sekolah' : 'Biaya Transport'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-600">
                      {format(new Date(p.year, p.month - 1), 'MMMM yyyy', { locale: idLocale })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-black text-gray-900 tabular-nums tracking-tighter">{formatCurrency(p.amount)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      p.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700 animate-pulse"
                    )}>
                      {p.status === 'paid' ? 'Lunas' : 'Tertunda'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {p.status === 'pending' && (
                      <button 
                        onClick={() => handleMarkPaid(p.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md shadow-emerald-100 transition-all active:scale-95"
                      >
                        Konfirmasi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
