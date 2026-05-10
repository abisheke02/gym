import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { membersAPI, branchesAPI, plansAPI, trainersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Plus,
  Filter,
  Edit2,
  Users,
  Calendar,
  AlertTriangle,
  ChevronRight,
  CheckCircle,
  X,
  Zap,
  Trash2,
  Phone,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

const Members = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [search, setSearch] = useState('');

  // Enforce branch filter for non-owner roles
  const effectiveBranchId = user?.role === 'owner'
    ? (searchParams.get('branch_id') || '')
    : (user?.branch_id || '');

  const [filter, setFilter] = useState({
    status: searchParams.get('status') || '',
    branch_id: effectiveBranchId,
    plan_id: searchParams.get('plan_id') || '',
    birthday: '',
    expiry: '',
    sort: 'newest'
  });

  useEffect(() => {
    fetchMembers();
    fetchBranches();
    fetchPlans();
    fetchTrainers();
  }, [filter]);

  const fetchMembers = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.branch_id) params.branch_id = filter.branch_id;
      if (filter.plan_id) params.plan_id = filter.plan_id;
      
      const response = await membersAPI.getAll(params);
      setMembers(response.data.members);
    } catch (error) {
      toast.error('Failed to fetch members');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchesAPI.getAll();
      setBranches(response.data.branches);
    } catch (error) {
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await plansAPI.getAll();
      setPlans(response.data.plans);
    } catch (error) {
    }
  };

  const fetchTrainers = async () => {
    try {
      const response = await trainersAPI.getAll({ branch_id: effectiveBranchId });
      setTrainers(response.data.trainers);
    } catch (error) {
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    data.joining_date = new Date().toISOString().split('T')[0];
    data.plan_start_date = new Date().toISOString().split('T')[0];
    
    // Calculate plan end date
    const plan = plans.find(p => p.id === data.plan_id);
    if (plan) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration_months);
      data.plan_end_date = endDate.toISOString().split('T')[0];
    }
    
    try {
      await membersAPI.create(data);
      toast.success('Member created successfully');
      setShowModal(false);
      fetchMembers();
    } catch (error) {
      const errorMsg = error.response?.data?.errors?.[0]?.message || error.response?.data?.error || 'Failed to create member';
      toast.error(errorMsg);
    }
  };

  const handleDeleteMember = async (member) => {
    if (!window.confirm(`Delete "${member.name}"? This cannot be undone.`)) return;
    try {
      await membersAPI.delete(member.id);
      toast.success(`${member.name} deleted`);
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete member');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const updatePromise = membersAPI.update(editingMember.id, data);
    toast.promise(updatePromise, {
      loading: 'Updating member...',
      success: () => {
        setEditingMember(null);
        fetchMembers();
        return 'Member updated successfully!';
      },
      error: (err) => err.response?.data?.errors?.[0]?.message || err.response?.data?.error || 'Failed to update member'
    });
  };

  const statusColors = {
    active: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-sm shadow-emerald-500/10',
    expired: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-sm shadow-rose-500/10',
    frozen: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    cancelled: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.phone.includes(search);

    if (!matchesSearch) return false;
    
    if (filter.branch_id && member.branch_id !== filter.branch_id) return false;

    if (filter.birthday) {
      if (!member.dob) return false;
      const dob = new Date(member.dob);
      const today = new Date();
      if (filter.birthday === 'today') return dob.getDate() === today.getDate() && dob.getMonth() === today.getMonth();
      if (filter.birthday === 'month') return dob.getMonth() === today.getMonth();
    }

    if (filter.expiry) {
      if (!member.plan_end_date) return false;
      const daysLeft = Math.ceil((new Date(member.plan_end_date) - new Date()) / (1000 * 60 * 60 * 24));
      if (filter.expiry === 'today' && daysLeft !== 0) return false;
      if (filter.expiry === 'week' && (daysLeft < 0 || daysLeft > 7)) return false;
    }

    return true;
  }).sort((a, b) => {
    if (filter.sort === 'newest') return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    if (filter.sort === 'oldest') return new Date(a.created_at || 0) - new Date(b.created_at || 0);
    return 0;
  });

  return (
    <div className="space-y-8 animate-fadeIn pb-24 dark:bg-[#0a0a0a] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-2">Member Directory</h1>
           <p className="text-sm font-bold text-gray-400 dark:text-gray-500">Managing {members.length} active and expired memberships.</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setShowCreditsModal(true)}
             className="px-6 py-3 bg-white dark:bg-gray-800 text-[#005c5b] dark:text-[#01a2a1] rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-100 dark:border-gray-700 shadow-sm group hover:border-[#005c5b]"
           >
              Message Credits: ₹3
           </button>
           <button
             onClick={() => setShowModal(true)}
             className="btn-primary flex items-center gap-3 px-8 shadow-xl shadow-[#005c5b]/30"
           >
             <Plus className="w-5 h-5" />
             <span className="uppercase tracking-widest text-[11px]">Admission</span>
           </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="gym-card bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20 p-4 rounded-3xl group cursor-pointer hover:bg-emerald-500/10 transition-all">
           <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20"><CheckCircle className="w-5 h-5" /></div>
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] leading-none">Active</span>
           </div>
           <p className="text-3xl font-black text-gray-900 dark:text-white">{members.filter(m => m.status === 'active').length}</p>
        </div>
        <div className="gym-card bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20 p-4 rounded-3xl group cursor-pointer hover:bg-rose-500/10 transition-all">
           <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/20"><AlertTriangle className="w-5 h-5" /></div>
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] leading-none">Expired</span>
           </div>
           <p className="text-3xl font-black text-gray-900 dark:text-white">{members.filter(m => m.status === 'expired').length}</p>
        </div>
        <div className="gym-card bg-blue-500/5 dark:bg-blue-500/10 border-blue-500/20 p-4 rounded-3xl group cursor-pointer">
           <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-500/20"><Users className="w-5 h-5" /></div>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] leading-none">Total Base</span>
           </div>
           <p className="text-3xl font-black text-gray-900 dark:text-white">{members.length}</p>
        </div>
        <div className="gym-card bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/20 p-4 rounded-3xl group cursor-pointer">
           <div className="flex items-center gap-4 mb-2">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20"><Zap className="w-5 h-5" /></div>
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] leading-none">Growth</span>
           </div>
           <p className="text-3xl font-black text-gray-900 dark:text-white">+12%</p>
        </div>
      </div>

      {/* Main Search & Tool Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-xl border-none space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#005c5b] transition-colors" />
             <input
               type="text"
               placeholder="Search by Name, Mobile or Member ID..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-sm font-bold placeholder:text-gray-300 outline-none border-2 border-transparent focus:border-[#005c5b] dark:focus:border-[#01a2a1] transition-all dark:text-white"
             />
           </div>
           <div className="flex gap-2">
              {user?.role === 'owner' ? (
                <select 
                  value={filter.branch_id || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, branch_id: e.target.value }))}
                  className="px-4 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-xs font-black uppercase outline-none border-2 border-transparent focus:border-[#005c5b] dark:text-gray-300"
                >
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              ) : (
                <div className="px-6 py-4 bg-[#005c5b]/5 dark:bg-[#005c5b]/20 rounded-2xl flex items-center border border-[#005c5b]/20">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#005c5b] dark:text-[#01a2a1]">
                    {user?.branch_name || 'My Branch'}
                  </span>
                </div>
              )}
              <button className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-gray-400 hover:text-[#005c5b] transition-all"><Filter className="w-5 h-5" /></button>
           </div>
        </div>
      </div>

      {/* Member List - Mobile Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005c5b]"></div>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl shadow-xl">
             <p className="text-xl font-black text-gray-900 dark:text-white uppercase mb-2">No Members Found</p>
             <p className="text-sm font-bold text-gray-400">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 text-[9px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-2.5">Member Name</th>
                    <th className="px-4 py-2.5">Admission ID</th>
                    <th className="px-4 py-2.5">Contact</th>
                    <th className="px-4 py-2.5">Plan & Amount</th>
                    <th className="px-4 py-2.5">Validity</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#005c5b]/10 dark:bg-[#005c5b]/20 flex items-center justify-center text-[#005c5b] dark:text-[#01a2a1] font-black text-sm">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-xs">{member.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-bold text-[#005c5b] dark:text-[#01a2a1] uppercase tracking-wider">{member.membership_id || '-'}</span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span className="font-bold text-[11px]">{member.phone}</span>
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{member.branch_name || 'No Branch'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="font-bold text-gray-900 dark:text-white text-xs">{member.plan_name || 'N/A'}</p>
                        <p className="text-[11px] font-black text-[#005c5b] dark:text-[#01a2a1]">₹{member.plan_price || 0}</p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[11px] font-bold">{new Date(member.plan_end_date).toLocaleDateString('en-IN')}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest border border-current ${statusColors[member.status || 'active']}`}>
                          {member.status || 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setEditingMember(member)}
                            className="p-1.5 inline-flex bg-gray-100 hover:bg-amber-500 dark:bg-gray-700 dark:hover:bg-amber-500 text-gray-500 hover:text-white dark:text-gray-300 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <Link
                            to={`/members/${member.id}`}
                            className="p-1.5 inline-flex bg-gray-100 hover:bg-[#005c5b] dark:bg-gray-700 dark:hover:bg-[#01a2a1] text-gray-500 hover:text-white dark:text-gray-300 rounded-lg transition-all"
                            title="View"
                          >
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                          {['owner', 'manager'].includes(user?.role) && (
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="p-1.5 inline-flex bg-gray-100 hover:bg-rose-500 dark:bg-gray-700 dark:hover:bg-rose-500 text-gray-500 hover:text-white dark:text-gray-300 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* FAB - Quick Add Member */}
      <button 
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-8 w-16 h-16 bg-[#005c5b] hover:bg-[#004746] text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-[#005c5b]/40 transition-all hover:scale-110 active:scale-95 z-50 group lg:hidden"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Admission Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">New Admission</h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateMember} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Admission Number</label>
                  <input name="membership_id" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-medium outline-none dark:text-white" placeholder="e.g. 1, 2, 3 (Optional)" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Branch *</label>
                  <select name="branch_id" required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-medium outline-none dark:text-white">
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Full Name *</label>
                  <input name="name" required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-medium outline-none dark:text-white" placeholder="Enter full name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Phone *</label>
                  <input name="phone" required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-medium outline-none dark:text-white" placeholder="10 Digit Number" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Gender</label>
                  <select name="gender" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-medium outline-none dark:text-white">
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Membership Plan *</label>
                  <select name="plan_id" required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-medium outline-none dark:text-white">
                    <option value="">Select Plan</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                  </select>
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/20 mt-2">
                 <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-500 mb-3 uppercase tracking-widest flex items-center gap-2"><DollarSign className="w-4 h-4" /> Initial Payment</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-1">Amount Paid (₹)</label>
                      <input name="amount" type="number" required min="0" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 rounded-xl text-sm font-medium outline-none dark:text-white" placeholder="e.g. 5000" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase mb-1">Payment Mode</label>
                      <select name="payment_mode" required className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-emerald-200 dark:border-emerald-800 focus:border-emerald-500 rounded-xl text-sm font-medium outline-none dark:text-white">
                        <option value="upi">UPI / Scanner</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card / POS</option>
                      </select>
                    </div>
                 </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20 mt-2">
                 <h4 className="text-sm font-black text-blue-600 dark:text-blue-500 mb-3 uppercase tracking-widest flex items-center gap-2"><Users className="w-4 h-4" /> Personal Training (Optional)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase mb-1">Select Trainer</label>
                      <select name="pt_trainer_id" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 rounded-xl text-sm font-medium outline-none dark:text-white">
                        <option value="">No Personal Training</option>
                        {trainers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.specialization})</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase mb-1">Total PT Sessions</label>
                      <input name="pt_sessions_total" type="number" defaultValue="0" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 rounded-xl text-sm font-medium outline-none dark:text-white" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase mb-1">PT Joining Date</label>
                      <input name="pt_joining_date" type="date" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 rounded-xl text-sm font-medium outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase mb-1">PT End Date</label>
                      <input name="pt_end_date" type="date" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 rounded-xl text-sm font-medium outline-none dark:text-white" />
                    </div>
                 </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full py-4 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-lg shadow-lg mt-6 active:scale-[0.98] transition-all uppercase tracking-widest"
              >
                Confirm Admission
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Edit details</h2>
              <button 
                onClick={() => setEditingMember(null)} 
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Full Name</label>
                  <input name="name" defaultValue={editingMember.name} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-amber-500 rounded-xl text-sm font-medium outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Phone Number</label>
                  <input name="phone" defaultValue={editingMember.phone} required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-amber-500 rounded-xl text-sm font-medium outline-none dark:text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Admission Number</label>
                  <input name="membership_id" defaultValue={editingMember.membership_id} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-amber-500 rounded-xl text-sm font-medium outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Member Status</label>
                  <select name="status" defaultValue={editingMember.status} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-amber-500 rounded-xl text-sm font-medium outline-none dark:text-white">
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="frozen">Frozen</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Gym Branch</label>
                  <select name="branch_id" defaultValue={editingMember.branch_id} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-amber-500 rounded-xl text-sm font-medium outline-none dark:text-white">
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Membership Plan</label>
                  <select name="plan_id" defaultValue={editingMember.plan_id} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-amber-500 rounded-xl text-sm font-medium outline-none dark:text-white">
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Gender</label>
                  <select name="gender" defaultValue={editingMember.gender} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-amber-500 rounded-xl text-sm font-medium outline-none dark:text-white">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 ml-1">Contact Address</label>
                  <input name="address" defaultValue={editingMember.address} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-amber-500 rounded-xl text-sm font-medium outline-none dark:text-white" />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/20 mt-2">
                 <h4 className="text-xs font-black text-blue-600 dark:text-blue-500 mb-3 uppercase tracking-widest flex items-center gap-2"><Users className="w-4 h-4" /> Personal Training</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                    <div>
                      <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase mb-1">Select Trainer</label>
                      <select name="pt_trainer_id" defaultValue={editingMember.pt_trainer_id || ''} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 rounded-xl text-sm font-medium outline-none dark:text-white">
                        <option value="">No Personal Training</option>
                        {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase mb-1">Total Sessions</label>
                      <input name="pt_sessions_total" type="number" defaultValue={editingMember.pt_sessions_total || 0} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 rounded-xl text-sm font-medium outline-none dark:text-white" />
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase mb-1">PT Start Date</label>
                      <input name="pt_joining_date" type="date" defaultValue={editingMember.pt_joining_date ? editingMember.pt_joining_date.split('T')[0] : ''} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 rounded-xl text-sm font-medium outline-none dark:text-white" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase mb-1">PT End Date</label>
                      <input name="pt_end_date" type="date" defaultValue={editingMember.pt_end_date ? editingMember.pt_end_date.split('T')[0] : ''} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-blue-200 dark:border-blue-800 focus:border-blue-500 rounded-xl text-sm font-medium outline-none dark:text-white" />
                    </div>
                 </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-lg shadow-lg mt-6 active:scale-[0.98] transition-all uppercase tracking-widest"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
