import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI, plansAPI } from '../services/api';
import { User, Lock, CreditCard, Bell, MessageSquare, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [plans, setPlans] = useState([]);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

  useEffect(() => {
    if (hasRole('owner')) {
      fetchPlans();
    }
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await plansAPI.getAll();
      setPlans(response.data.plans);
    } catch (error) {
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await authAPI.changePassword({ currentPassword: passwords.current, newPassword: passwords.new });
      toast.success('Password changed successfully');
      setPasswords({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    }
  };

  const handleUpdatePlan = async (planId, data) => {
    try {
      await plansAPI.update(planId, data);
      toast.success('Plan updated');
      fetchPlans();
    } catch (error) {
      toast.error('Failed to update plan');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Change Password', icon: Lock },
    ...(hasRole('owner') ? [{ id: 'plans', label: 'Membership Plans', icon: CreditCard }] : [])
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 space-y-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-gym-accent text-white' 
                  : 'text-gray-400 hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="gym-card">
              <h2 className="text-xl font-semibold text-white mb-6">Profile Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                  <p className="text-white text-lg">{user?.full_name}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <p className="text-white text-lg">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Role</label>
                  <p className="text-white text-lg capitalize">{user?.role}</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone</label>
                  <p className="text-white text-lg">{user?.phone || 'Not set'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="gym-card">
              <h2 className="text-xl font-semibold text-white mb-6">Change Password</h2>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Current Password</label>
                  <input 
                    type="password" 
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">New Password</label>
                  <input 
                    type="password" 
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="input-field" 
                    required 
                  />
                </div>
                <button type="submit" className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" /> Update Password
                </button>
              </form>
            </div>
          )}

          {activeTab === 'plans' && hasRole('owner') && (
            <div className="gym-card">
              <h2 className="text-xl font-semibold text-white mb-6">Membership Plans</h2>
              <div className="space-y-4">
                {plans.map(plan => (
                  <div key={plan.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                    <div>
                      <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-400">{plan.duration_months} months</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-green-400">₹{plan.price}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;

