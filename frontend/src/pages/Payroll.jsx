import { useState, useEffect } from 'react';
import { payrollAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  DollarSign, Plus, Trash2, X, ChevronDown, Users, Calendar, TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() - i);
  return d.toISOString().slice(0, 7);
});

const PAY_MODES = ['cash', 'upi', 'card', 'bank_transfer'];

const Payroll = () => {
  const { user } = useAuth();
  const [staffList, setStaffList]     = useState([]);
  const [records, setRecords]         = useState([]);
  const [summary, setSummary]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [filterMonth, setFilterMonth] = useState(MONTHS[0]);
  const [form, setForm] = useState({
    user_id: '', amount: '', salary_month: MONTHS[0],
    payment_date: new Date().toISOString().split('T')[0],
    payment_mode: 'cash', notes: ''
  });

  useEffect(() => { fetchData(); }, [filterMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, payrollRes] = await Promise.all([
        payrollAPI.getStaffList(),
        payrollAPI.getAll({ month: filterMonth }),
      ]);
      setStaffList(staffRes.data.staff || []);
      setRecords(payrollRes.data.payroll || []);
      setSummary(payrollRes.data.summary || []);
    } catch {
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecord = async (e) => {
    e.preventDefault();
    if (!form.user_id || !form.amount) {
      toast.error('Select staff and enter amount');
      return;
    }
    setSaving(true);
    try {
      await payrollAPI.record(form);
      toast.success('Salary recorded');
      setShowModal(false);
      setForm({ user_id: '', amount: '', salary_month: MONTHS[0], payment_date: new Date().toISOString().split('T')[0], payment_mode: 'cash', notes: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to record');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payroll record?')) return;
    try {
      await payrollAPI.delete(id);
      toast.success('Deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const totalThisMonth = records.reduce((s, r) => s + parseFloat(r.amount), 0);
  const currentMonthStaff = staffList.filter(s => parseFloat(s.paid_this_month) > 0).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Payroll</h1>
          <p className="text-xs text-gray-400 font-bold mt-0.5">Staff salary management</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
        >
          <Plus className="w-4 h-4" /> Pay Salary
        </button>
      </div>

      {/* Month filter + stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-[#005c5b]/10 rounded-xl"><DollarSign className="w-6 h-6 text-[#005c5b]" /></div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">This Month Total</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">₹{totalThisMonth.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-xl"><Users className="w-6 h-6 text-blue-500" /></div>
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Staff Paid</p>
            <p className="text-2xl font-black text-gray-900 dark:text-white">{currentMonthStaff} / {staffList.length}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Filter Month</label>
          <div className="relative">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white appearance-none"
            >
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Staff Payment Status */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500">Staff Status — {filterMonth}</p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005c5b]" />
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm font-bold">No staff accounts found</div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {staffList.map(s => {
              const paid = parseFloat(s.paid_this_month) > 0;
              return (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-9 h-9 rounded-xl bg-[#005c5b]/10 flex items-center justify-center text-[#005c5b] font-black text-sm shrink-0">
                    {s.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-gray-900 dark:text-white truncate">{s.full_name}</p>
                    <p className="text-[10px] text-gray-400 font-bold capitalize">{s.role}</p>
                  </div>
                  {paid ? (
                    <div className="text-right">
                      <p className="font-black text-green-500 text-sm">₹{parseFloat(s.paid_this_month).toLocaleString()}</p>
                      <p className="text-[10px] text-gray-400">
                        {s.last_payment_date ? new Date(s.last_payment_date).toLocaleDateString('en-IN') : ''}
                      </p>
                    </div>
                  ) : (
                    <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded-full">
                      Pending
                    </span>
                  )}
                  <button
                    onClick={() => { setForm(f => ({ ...f, user_id: s.id, salary_month: filterMonth })); setShowModal(true); }}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-[#005c5b] hover:text-white text-gray-500 transition-all"
                    title="Record salary"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Records */}
      {records.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Payment Records</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {records.map(r => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-gray-900 dark:text-white">{r.full_name}</p>
                  <p className="text-[10px] text-gray-400 font-bold">
                    {r.salary_month} · {r.payment_mode?.toUpperCase()}
                    {r.notes && ` · ${r.notes}`}
                  </p>
                </div>
                <p className="font-black text-green-500">₹{parseFloat(r.amount).toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 w-20 text-right">{new Date(r.payment_date).toLocaleDateString('en-IN')}</p>
                {user?.role === 'owner' && (
                  <button onClick={() => handleDelete(r.id)} className="p-2 rounded-lg hover:bg-rose-50 hover:text-rose-500 text-gray-400 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Record Salary</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRecord} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Staff Member *</label>
                <select
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                  required
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                >
                  <option value="">Select staff member</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Amount (₹) *</label>
                  <input
                    type="number" min="1" value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    required placeholder="e.g. 15000"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Salary Month *</label>
                  <select
                    value={form.salary_month}
                    onChange={(e) => setForm({ ...form, salary_month: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                  >
                    {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Payment Date</label>
                  <input
                    type="date" value={form.payment_date}
                    onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Payment Mode</label>
                  <select
                    value={form.payment_mode}
                    onChange={(e) => setForm({ ...form, payment_mode: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                  >
                    {PAY_MODES.map(m => <option key={m} value={m}>{m.replace('_', ' ').toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Notes</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Optional note"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-60">
                  {saving ? 'Saving...' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;
