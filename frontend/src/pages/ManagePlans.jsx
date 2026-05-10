import { useState, useEffect } from 'react';
import { plansAPI } from '../services/api';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  CreditCard,
  Clock,
  Calendar,
  DollarSign,
  X,
  Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const ManagePlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [durationType, setDurationType] = useState('months');
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    duration_months: 1,
    description: ''
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await plansAPI.getAll();
      setPlans(response.data.plans || []);
    } catch (error) {
      toast.error('Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        price: parseFloat(formData.price),
        duration_months: durationType === 'days' 
          ? Math.ceil(parseInt(formData.duration_months) / 30) 
          : parseInt(formData.duration_months),
        description: formData.description
      };

      if (editingPlan) {
        await plansAPI.update(editingPlan.id, data);
        toast.success('Plan updated successfully');
      } else {
        await plansAPI.create(data);
        toast.success('Plan created successfully');
      }
      
      setShowModal(false);
      setEditingPlan(null);
      resetForm();
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save plan');
    }
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      price: plan.price,
      duration_months: plan.duration_months,
      description: plan.description || ''
    });
    setDurationType('months');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await plansAPI.delete(id);
      toast.success('Plan deleted');
      fetchPlans();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', duration_months: 1, description: '' });
    setDurationType('months');
  };

  const openAddModal = () => {
    setEditingPlan(null);
    resetForm();
    setShowModal(true);
  };

  const durationOptions = durationType === 'months'
    ? [1, 2, 3, 6, 12]
    : [30, 60, 90, 180, 365];

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <CreditCard className="w-7 h-7 text-gym-accent" />
            Manage Plans
          </h1>
          <p className="text-gray-400">Create and manage gym membership plans</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Plan
        </button>
      </div>

      {/* Plans List */}
      <div className="gym-card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-accent"></div>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-16">
            <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No Plans Found</h3>
            <p className="text-gray-400 mb-4">Create your first gym plan</p>
            <button
              onClick={openAddModal}
              className="btn-primary inline-flex items-center gap-2 px-6"
            >
              <Plus className="w-5 h-5" />
              Add Plan
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-gym-accent/20 text-gym-accent">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-lg">{plan.name}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1 text-green-400 text-sm font-medium">
                        <DollarSign className="w-3 h-3" />
                        ₹{parseFloat(plan.price).toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400 text-sm">
                        <Clock className="w-3 h-3" />
                        {plan.duration_months} {plan.duration_months === 1 ? 'Month' : 'Months'}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="text-gray-500 text-xs mt-1">{plan.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(plan)}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Plan Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">
                {editingPlan ? 'Edit Plan' : 'Add Plan'}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingPlan(null); }} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instructions */}
            {!editingPlan && (
              <div className="bg-gray-900 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-white mb-2">Gym Plan Creation Instructions</h3>
                <ol className="text-gray-400 space-y-2 text-sm list-decimal list-inside">
                  <li>Set plan name and price<br/>
                    <span className="text-gray-500 text-xs ml-4">Example: "6 Month Premium" - 5000</span>
                  </li>
                  <li>Choose duration in months or days<br/>
                    <span className="text-gray-500 text-xs ml-4">Example: 6 months or 180 days</span>
                  </li>
                  <li>These plans will be assigned to gym members<br/>
                    <span className="text-gray-500 text-xs ml-4">Example: Assign "6 Month Premium" to new members</span>
                  </li>
                </ol>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Plan Name *</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="input-field pl-10"
                    placeholder="Plan Name *"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Price (₹) *</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="input-field pl-10"
                    placeholder="Price *"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Duration Type</label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <input
                      type="radio"
                      value="months"
                      checked={durationType === 'months'}
                      onChange={() => { setDurationType('months'); setFormData({ ...formData, duration_months: 1 }); }}
                      className="accent-gym-accent"
                    />
                    <span className="text-white text-sm">Months</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <input
                      type="radio"
                      value="days"
                      checked={durationType === 'days'}
                      onChange={() => { setDurationType('days'); setFormData({ ...formData, duration_months: 30 }); }}
                      className="accent-gym-accent"
                    />
                    <span className="text-white text-sm">Days</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">
                  Select Plan Duration
                </label>
                <select
                  value={formData.duration_months}
                  onChange={(e) => setFormData({ ...formData, duration_months: e.target.value })}
                  className="input-field"
                >
                  {durationOptions.map(d => (
                    <option key={d} value={d}>
                      {d} {durationType === 'months' ? (d === 1 ? 'Month' : 'Months') : 'Days'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="2"
                  placeholder="Plan description (optional)"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full btn-primary py-3 text-lg font-semibold"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePlans;
