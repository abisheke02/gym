import { useState, useEffect } from 'react';
import { financeAPI, membersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign, Plus, TrendingUp, TrendingDown, Wallet,
  AlertCircle, Search, X, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

const Finance = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab]       = useState('payments');
  const [payments, setPayments]         = useState([]);
  const [expenses, setExpenses]         = useState([]);
  const [dues, setDues]                 = useState([]);
  const [duesTotal, setDuesTotal]       = useState(0);
  const [members, setMembers]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [summary, setSummary]           = useState(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const summaryRes = await financeAPI.getDashboardSummary();
      setSummary(summaryRes.data);

      if (activeTab === 'payments') {
        const r = await financeAPI.getPayments({ limit: 100 });
        setPayments(r.data.payments || []);
      } else if (activeTab === 'expenses') {
        const r = await financeAPI.getExpenses({ limit: 100 });
        setExpenses(r.data.expenses || []);
      } else if (activeTab === 'dues') {
        const r = await financeAPI.getPendingDues();
        setDues(r.data.dues || []);
        setDuesTotal(r.data.total || 0);
      }
    } catch {
      toast.error('Failed to load finance data');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (q) => {
    if (!q || q.length < 2) { setMembers([]); return; }
    try {
      const r = await membersAPI.getAll({ search: q, limit: 10 });
      setMembers(r.data.members || []);
    } catch {}
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedMember) { toast.error('Select a member first'); return; }
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.member_id = selectedMember.id;
    // Auto branch from selected member or logged-in user
    if (selectedMember.branch_id) data.branch_id = selectedMember.branch_id;
    else if (user?.branch_id) data.branch_id = user.branch_id;

    try {
      await financeAPI.recordPayment(data);
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      setSelectedMember(null);
      setMemberSearch('');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record payment');
    }
  };

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.expense_date = new Date().toISOString().split('T')[0];
    if (user?.branch_id) data.branch_id = user.branch_id;

    try {
      await financeAPI.recordExpense(data);
      toast.success('Expense recorded');
      setShowExpenseModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record expense');
    }
  };

  const tabs = [
    { id: 'payments', label: 'Payments' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'dues', label: `Pending Dues${dues.length > 0 ? ` (${dues.length})` : ''}` },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Finance</h1>
          <p className="text-xs text-gray-400 font-bold mt-0.5">Payments · Expenses · Pending Dues</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPaymentModal(true)} className="btn-primary flex items-center gap-2 text-xs">
            <Plus className="w-4 h-4" /> Payment
          </button>
          <button onClick={() => setShowExpenseModal(true)} className="btn-secondary flex items-center gap-2 text-xs">
            <Plus className="w-4 h-4" /> Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Revenue", value: `₹${(summary?.todayRevenue || 0).toLocaleString()}`, icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/20' },
          { label: "Today's Expenses", value: `₹${(summary?.todayExpenses || 0).toLocaleString()}`, icon: TrendingDown, color: 'text-orange-400', bg: 'bg-orange-500/20' },
          { label: "Today's Net", value: `₹${(summary?.todayNet || 0).toLocaleString()}`, icon: Wallet, color: summary?.todayNet >= 0 ? 'text-blue-400' : 'text-red-400', bg: 'bg-blue-500/20' },
          { label: 'Pending Dues', value: `₹${duesTotal.toLocaleString()}`, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/20' },
        ].map(s => (
          <div key={s.label} className="gym-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-bold mb-1">{s.label}</p>
                <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
              </div>
              <div className={`p-2.5 ${s.bg} rounded-xl`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === t.id
                ? 'bg-white dark:bg-gray-700 text-[#005c5b] dark:text-[#01a2a1] shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005c5b]" />
          </div>
        ) : activeTab === 'payments' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Mode</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {payments.length > 0 ? payments.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{p.member_name || '—'}</td>
                    <td className="px-4 py-3 font-black text-green-500">₹{parseFloat(p.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400 capitalize">{p.payment_mode}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="text-center py-10 text-gray-400">No payments yet</td></tr>}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'expenses' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Amount</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {expenses.length > 0 ? expenses.map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white capitalize">{e.category}</td>
                    <td className="px-4 py-3 font-black text-orange-400">₹{parseFloat(e.amount).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400">{e.description || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{new Date(e.expense_date).toLocaleDateString('en-IN')}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="text-center py-10 text-gray-400">No expenses yet</td></tr>}
              </tbody>
            </table>
          </div>
        ) : (
          /* Pending Dues tab */
          dues.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">All dues cleared!</p>
              <p className="text-xs text-gray-400 mt-1">No members have pending balance</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border-b border-amber-100 dark:border-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <p className="text-xs font-black text-amber-700 dark:text-amber-400">
                  {dues.length} members have pending dues · Total: ₹{duesTotal.toLocaleString()}
                </p>
              </div>
              <table className="w-full text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="px-4 py-3 text-left">Member</th>
                    <th className="px-4 py-3 text-left">Plan</th>
                    <th className="px-4 py-3 text-left">Plan Price</th>
                    <th className="px-4 py-3 text-left">Total Paid</th>
                    <th className="px-4 py-3 text-left">Pending</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {dues.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <p className="font-black text-gray-900 dark:text-white">{d.name}</p>
                        <p className="text-[10px] text-gray-400">{d.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{d.plan_name}</td>
                      <td className="px-4 py-3 text-gray-500">₹{parseFloat(d.plan_price).toLocaleString()}</td>
                      <td className="px-4 py-3 text-green-500 font-bold">₹{parseFloat(d.total_paid).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className="font-black text-rose-500">₹{parseFloat(d.pending_amount).toLocaleString()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Record Payment</h2>
              <button onClick={() => { setShowPaymentModal(false); setSelectedMember(null); setMemberSearch(''); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              {/* Member search */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Member *</label>
                {selectedMember ? (
                  <div className="flex items-center gap-3 p-3 bg-[#005c5b]/5 rounded-xl border border-[#005c5b]/20">
                    <span className="font-black text-sm text-gray-900 dark:text-white flex-1">{selectedMember.name} · {selectedMember.phone}</span>
                    <button type="button" onClick={() => { setSelectedMember(null); setMemberSearch(''); }} className="text-gray-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      value={memberSearch}
                      onChange={(e) => { setMemberSearch(e.target.value); fetchMembers(e.target.value); }}
                      placeholder="Search member name or phone..."
                      className="w-full pl-9 pr-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                    />
                    {members.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-10 max-h-40 overflow-y-auto">
                        {members.map(m => (
                          <button key={m.id} type="button" onClick={() => { setSelectedMember(m); setMembers([]); setMemberSearch(''); }}
                            className="w-full text-left px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold text-gray-900 dark:text-white">
                            {m.name} · {m.phone}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Amount (₹) *</label>
                  <input name="amount" type="number" min="1" required placeholder="e.g. 5000"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Mode *</label>
                  <select name="payment_mode" required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Notes</label>
                <input name="notes" placeholder="Optional" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowPaymentModal(false); setSelectedMember(null); setMemberSearch(''); }} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-xs uppercase tracking-widest">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Record Expense</h2>
              <button onClick={() => setShowExpenseModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRecordExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Category *</label>
                <select name="category" required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white">
                  <option value="">Select</option>
                  {['salary','rent','utilities','ads','maintenance','supplies','other'].map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Amount (₹) *</label>
                <input name="amount" type="number" min="1" required placeholder="e.g. 5000"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea name="description" rows={2} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-xs uppercase tracking-widest">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
