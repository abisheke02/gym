import { useState, useEffect } from 'react';
import { financeAPI, branchesAPI } from '../services/api';
import { 
  Plus, 
  Search, 
  Calendar, 
  Filter, 
  DollarSign,
  Trash2,
  MoreVertical,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const EXPENSE_CATEGORIES = [
  { value: '', label: 'All Types' },
  { value: 'salary', label: 'Salary' },
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'ads', label: 'Advertisements' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'other', label: 'Other' }
];

const ManageExpense = () => {
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({
    fromDate: '',
    toDate: '',
    category: '',
    branch_id: ''
  });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [filter]);

  const fetchBranches = async () => {
    try {
      const response = await branchesAPI.getAll();
      setBranches(response.data.branches);
    } catch (error) {
    }
  };

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.fromDate) params.start_date = filter.fromDate;
      if (filter.toDate) params.end_date = filter.toDate;
      if (filter.branch_id) params.branch_id = filter.branch_id;

      const response = await financeAPI.getExpenses(params);
      let expenseList = response.data.expenses || [];
      
      // Filter by category on client side if needed
      if (filter.category) {
        expenseList = expenseList.filter(e => e.category === filter.category);
      }
      
      setExpenses(expenseList);
      setTotal(expenseList.reduce((sum, e) => sum + parseFloat(e.amount), 0));
    } catch (error) {
      toast.error('Failed to load expenses');
      setExpenses([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await financeAPI.recordExpense(data);
      toast.success('Expense added successfully');
      setShowModal(false);
      fetchExpenses();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add expense');
    }
  };

  const clearFilters = () => {
    setFilter({ fromDate: '', toDate: '', category: '', branch_id: '' });
  };

  const getCategoryColor = (category) => {
    const colors = {
      salary: 'text-blue-400 bg-blue-500/20',
      rent: 'text-purple-400 bg-purple-500/20',
      utilities: 'text-yellow-400 bg-yellow-500/20',
      ads: 'text-green-400 bg-green-500/20',
      maintenance: 'text-orange-400 bg-orange-500/20',
      supplies: 'text-cyan-400 bg-cyan-500/20',
      other: 'text-gray-400 bg-gray-500/20'
    };
    return colors[category] || 'text-gray-400 bg-gray-500/20';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Expense</h1>
          <p className="text-gray-400">Track and manage all expenses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      {/* Filters */}
      <div className="gym-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filter.fromDate}
                onChange={(e) => setFilter({ ...filter, fromDate: e.target.value })}
                className="input-field pl-10 text-sm"
                placeholder="From Date"
              />
            </div>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filter.toDate}
                onChange={(e) => setFilter({ ...filter, toDate: e.target.value })}
                className="input-field pl-10 text-sm"
                placeholder="To Date"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchExpenses}
              className="px-4 py-2 bg-gym-accent hover:bg-gym-accent/90 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Search
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between mt-4 gap-4">
          <select
            value={filter.category}
            onChange={(e) => setFilter({ ...filter, category: e.target.value })}
            className="input-field md:w-48"
          >
            {EXPENSE_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <select
            value={filter.branch_id}
            onChange={(e) => setFilter({ ...filter, branch_id: e.target.value })}
            className="input-field md:w-48"
          >
            <option value="">All Branches</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.name}</option>
            ))}
          </select>
          <div className="text-right">
            <span className="text-gray-400 text-sm">Total: </span>
            <span className="text-white text-lg font-bold">₹{total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Expense List */}
      <div className="gym-card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-accent"></div>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Expense Found</h3>
            <p className="text-gray-400 mb-4">Start Adding Expense Click Top + Icon</p>
            <p className="text-gray-500 mb-4">OR</p>
            <button
              onClick={() => setShowModal(true)}
              className="btn-primary inline-flex items-center gap-2 px-6"
            >
              Add Expense
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map(expense => (
              <div key={expense.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${getCategoryColor(expense.category)}`}>
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize">{expense.category}</p>
                    <p className="text-gray-400 text-sm">{expense.description || 'No description'}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-gray-500 text-xs">
                        {new Date(expense.expense_date).toLocaleDateString('en-IN')}
                      </span>
                      {expense.branch_name && (
                        <span className="text-gray-500 text-xs">• {expense.branch_name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-red-400 font-bold text-lg">-₹{parseFloat(expense.amount).toLocaleString()}</p>
                  {expense.recorded_by_name && (
                    <p className="text-gray-500 text-xs">by {expense.recorded_by_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB for mobile */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gym-accent hover:bg-gym-accent/90 rounded-full flex items-center justify-center shadow-lg shadow-gym-accent/30 transition-colors lg:hidden z-30"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Add Expense</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Category *</label>
                <select name="category" required className="input-field">
                  <option value="">Select Category</option>
                  {EXPENSE_CATEGORIES.filter(c => c.value).map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Amount (₹) *</label>
                <input name="amount" type="number" step="0.01" required className="input-field" placeholder="Enter amount" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Branch *</label>
                <select name="branch_id" required className="input-field">
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Date *</label>
                <input name="expense_date" type="date" required className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea name="description" className="input-field" rows="2" placeholder="Description of expense"></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageExpense;
