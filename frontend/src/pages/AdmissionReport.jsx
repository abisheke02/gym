import { useState, useEffect, useCallback } from 'react';
import { financeAPI } from '../services/api';
import {
  Calendar,
  ChevronLeft,
  DollarSign,
  Filter,
  Download,
  Activity,
  RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdmissionReport = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [payments, setPayments] = useState([]);
  const [totalFees, setTotalFees] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!dateRange.startDate || !dateRange.endDate) return;
    setLoading(true);
    try {
      const res = await financeAPI.getPayments({
        start_date: dateRange.startDate,
        end_date: dateRange.endDate,
        limit: 500,
      });
      const data = res.data.payments || [];
      setPayments(data);
      const total = data.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      setTotalFees(total);
    } catch (error) {
      toast.error('Failed to fetch admission report');
    } finally {
      setLoading(false);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  useEffect(() => {
    fetchReport();
  }, []);

  const handleDownload = () => {
    if (payments.length === 0) { toast.error('No data to download'); return; }
    const rows = [
      ['Member', 'Amount', 'Mode', 'Date', 'Branch', 'Notes'],
      ...payments.map((p) => [
        p.member_name || '',
        p.amount,
        p.payment_mode || '',
        new Date(p.created_at).toLocaleDateString('en-IN'),
        p.branch_name || '',
        p.notes || '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admission-report-${dateRange.startDate}-${dateRange.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const paymentModeCount = payments.reduce((acc, p) => {
    acc[p.payment_mode] = (acc[p.payment_mode] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fadeIn min-h-screen dark:bg-[#0a0a0a] pb-40">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#005c5b] -mx-4 -mt-4 p-5 sticky top-0 z-50 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight leading-none">Admission Report</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mt-1">Payment Ledger</p>
          </div>
        </div>
        <button onClick={handleDownload} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Download CSV">
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Date Filters */}
      <div className="gym-card bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border-none space-y-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#005c5b]" />
          <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Accounting Period</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Start Date</label>
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl px-5 py-4 border border-gray-100 dark:border-gray-700 focus-within:border-[#005c5b] transition-all">
              <Calendar className="w-5 h-5 text-[#005c5b]" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="bg-transparent w-full text-sm font-bold text-gray-700 dark:text-gray-200 outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">End Date</label>
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl px-5 py-4 border border-gray-100 dark:border-gray-700 focus-within:border-[#005c5b] transition-all">
              <Calendar className="w-5 h-5 text-[#005c5b]" />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="bg-transparent w-full text-sm font-bold text-gray-700 dark:text-gray-200 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-2">
          <button
            onClick={fetchReport}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-4 bg-[#005c5b] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#005c5b]/30 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            Generate Report
          </button>
          <button
            onClick={() => setDateRange({ startDate: '', endDate: '' })}
            className="px-8 py-4 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 rounded-r-xl">
        <p className="text-xs font-bold text-amber-600 dark:text-amber-500 italic">
          Showing payments recorded between {dateRange.startDate || '—'} and {dateRange.endDate || '—'}.
        </p>
      </div>

      {/* Payment Mode Breakdown */}
      {payments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(paymentModeCount).map(([mode, count]) => (
            <div key={mode} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-xl font-black text-[#005c5b] dark:text-[#01a2a1]">{count}</p>
              <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">{mode}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payment Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#005c5b]" />
        </div>
      ) : payments.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <p className="text-[11px] font-black uppercase text-gray-400 tracking-widest">
              {payments.length} Transaction{payments.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Mode</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Branch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{p.member_name || '—'}</td>
                    <td className="px-4 py-3 font-black text-[#005c5b] dark:text-[#01a2a1]">₹{parseFloat(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded font-black uppercase text-[10px]">
                        {p.payment_mode || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3 text-gray-400">{p.branch_name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center shadow-sm">
          <p className="text-sm font-black uppercase text-gray-400 tracking-widest">No payments found for this period</p>
        </div>
      )}

      {/* Floating Total */}
      <div className="fixed bottom-24 left-6 right-6 lg:left-auto lg:right-6 lg:w-96 z-40">
        <div className="bg-[#005c5b] text-white rounded-3xl p-6 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[80px] -mr-8 -mt-8" />
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <p className="text-[11px] font-black text-white/60 uppercase tracking-widest">Period Revenue</p>
              <h3 className="text-3xl font-black tracking-tight leading-none">₹{totalFees.toLocaleString()}</h3>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-tighter">
                {payments.length} payments · {dateRange.startDate} – {dateRange.endDate}
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdmissionReport;
