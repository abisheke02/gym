import { useState, useEffect } from 'react';
import { financeAPI, branchesAPI } from '../services/api';
import { DollarSign, Plus, TrendingUp, TrendingDown, Wallet, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

const Finance = () => {
  const [activeTab, setActiveTab] = useState('payments');
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [summaryRes] = await Promise.all([
        financeAPI.getDashboardSummary()
      ]);
      setSummary(summaryRes.data);

      if (activeTab === 'payments') {
        const response = await financeAPI.getPayments({ limit: 50 });
        setPayments(response.data.payments);
      } else {
        const today = new Date().toISOString().split('T')[0];
        const response = await financeAPI.getExpenses({ start_date: today, end_date: today });
        setExpenses(response.data.expenses);
      }

      const branchRes = await branchesAPI.getAll();
      setBranches(branchRes.data.branches);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await financeAPI.recordPayment(data);
      toast.success('Payment recorded');
      setShowPaymentModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleRecordExpense = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.expense_date = new Date().toISOString().split('T')[0];
    
    try {
      await financeAPI.recordExpense(data);
      toast.success('Expense recorded');
      setShowExpenseModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to record expense');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Finance</h1>
          <p className="text-gray-400">Manage payments and expenses</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPaymentModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Record Payment
          </button>
          <button onClick={() => setShowExpenseModal(true)} className="btn-secondary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Record Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="gym-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Today's Revenue</p>
              <p className="text-2xl font-bold text-green-400">₹{summary?.todayRevenue?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </div>
        <div className="gym-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Today's Expenses</p>
              <p className="text-2xl font-bold text-orange-500">₹{summary?.todayExpenses?.toLocaleString() || 0}</p>
            </div>
            <div className="p-3 bg-orange-500/20 rounded-xl">
              <TrendingDown className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>
        <div className="gym-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Today's Net</p>
              <p className={`text-2xl font-bold ${summary?.todayNet >= 0 ? 'text-green-400' : 'text-orange-500'}`}>
                ₹{summary?.todayNet?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Wallet className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="gym-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Members</p>
              <p className="text-2xl font-bold text-white">{summary?.activeMembers || 0}</p>
            </div>
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <CreditCard className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 px-4 font-medium ${activeTab === 'payments' ? 'text-gym-accent border-b-2 border-gym-accent' : 'text-gray-400'}`}
        >
          Payments
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`pb-3 px-4 font-medium ${activeTab === 'expenses' ? 'text-gym-accent border-b-2 border-gym-accent' : 'text-gray-400'}`}
        >
          Expenses
        </button>
      </div>

      {/* Content */}
      <div className="gym-card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-accent"></div>
          </div>
        ) : activeTab === 'payments' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400">Member</th>
                  <th className="text-left py-3 px-4 text-gray-400">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-400">Mode</th>
                  <th className="text-left py-3 px-4 text-gray-400">Branch</th>
                  <th className="text-left py-3 px-4 text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? payments.map((payment, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-3 px-4 text-white">{payment.member_name || 'N/A'}</td>
                    <td className="py-3 px-4 text-green-400">₹{parseFloat(payment.amount).toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-300 capitalize">{payment.payment_mode}</td>
                    <td className="py-3 px-4 text-gray-300">{payment.branch_name}</td>
                    <td className="py-3 px-4 text-gray-400">{new Date(payment.created_at).toLocaleDateString('en-IN')}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="text-center py-8 text-gray-400">No payments found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400">Category</th>
                  <th className="text-left py-3 px-4 text-gray-400">Amount</th>
                  <th className="text-left py-3 px-4 text-gray-400">Description</th>
                  <th className="text-left py-3 px-4 text-gray-400">Branch</th>
                  <th className="text-left py-3 px-4 text-gray-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? expenses.map((expense, index) => (
                  <tr key={index} className="border-b border-gray-800">
                    <td className="py-3 px-4 text-white capitalize">{expense.category}</td>
                    <td className="py-3 px-4 text-orange-500">₹{parseFloat(expense.amount).toLocaleString()}</td>
                    <td className="py-3 px-4 text-gray-300">{expense.description || '-'}</td>
                    <td className="py-3 px-4 text-gray-300">{expense.branch_name}</td>
                    <td className="py-3 px-4 text-gray-400">{new Date(expense.expense_date).toLocaleDateString('en-IN')}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="text-center py-8 text-gray-400">No expenses found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Record Payment</h2>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Member ID *</label>
                <input name="member_id" required className="input-field" placeholder="Member UUID" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Amount *</label>
                <input name="amount" type="number" required className="input-field" placeholder="Amount" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Payment Mode *</label>
                <select name="payment_mode" required className="input-field">
                  <option value="">Select</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Branch *</label>
                <select name="branch_id" required className="input-field">
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Record Expense</h2>
            <form onSubmit={handleRecordExpense} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Category *</label>
                <select name="category" required className="input-field">
                  <option value="">Select</option>
                  <option value="salary">Salary</option>
                  <option value="rent">Rent</option>
                  <option value="utilities">Utilities</option>
                  <option value="ads">Ads</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="supplies">Supplies</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Amount *</label>
                <input name="amount" type="number" required className="input-field" placeholder="Amount" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea name="description" className="input-field" rows="2"></textarea>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Branch *</label>
                <select name="branch_id" required className="input-field">
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 btn-secondary">Cancel</button>
                <button type="submit" className="flex-1 btn-primary">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;

