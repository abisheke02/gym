import { useState, useEffect } from 'react';
import { branchesAPI } from '../services/api';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Phone, 
  Users, 
  Edit, 
  Trash2,
  ChevronLeft,
  Circle,
  MoreVertical,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [addingToBranch, setAddingToBranch] = useState(null);
  const [editingBranch, setEditingBranch] = useState(null);
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [branchMembers, setBranchMembers] = useState({});
  const [branchStats, setBranchStats] = useState({});
  const [loadingMembers, setLoadingMembers] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBranches();
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const { plansAPI } = await import('../services/api');
      const response = await plansAPI.getAll();
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Failed to load plans');
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchesAPI.getAll();
      setBranches(response.data.branches);
    } catch (error) {
      toast.error('Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
      if (editingBranch) {
        await branchesAPI.update(editingBranch.id, data);
        toast.success('Branch updated');
      } else {
        await branchesAPI.create(data);
        toast.success('Branch created');
      }
      setShowModal(false);
      setEditingBranch(null);
      fetchBranches();
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    
    try {
      await branchesAPI.delete(id);
      toast.success('Branch deleted');
      fetchBranches();
    } catch (error) {
      toast.error('Failed to delete branch');
    }
  };

  const toggleBranch = async (id) => {
    if (expandedBranch === id) {
      setExpandedBranch(null);
      return;
    }
    
    setExpandedBranch(id);
    if (!branchMembers[id]) {
      setLoadingMembers(true);
      try {
        const { membersAPI, financeAPI } = await import('../services/api');
        
        // Fetch members and all-time revenue concurrently
        const startDate = '2020-01-01';
        const endDate = new Date().toISOString().split('T')[0];
        
        const [membersRes, statsRes] = await Promise.all([
          membersAPI.getAll({ branch_id: id }),
          financeAPI.getBranchPL({ branch_id: id, start_date: startDate, end_date: endDate }).catch(() => ({ data: { revenue: 0, expenses: 0 } }))
        ]);
        
        setBranchMembers(prev => ({...prev, [id]: membersRes.data.members || []}));
        if (statsRes.data) {
          setBranchStats(prev => ({...prev, [id]: statsRes.data}));
        }
      } catch (error) {
        toast.error('Failed to load branch details');
      } finally {
        setLoadingMembers(false);
      }
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    data.branch_id = addingToBranch;
    data.joining_date = new Date().toISOString().split('T')[0];
    data.plan_start_date = new Date().toISOString().split('T')[0];
    
    const plan = plans.find(p => p.id === data.plan_id);
    if (plan) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration_months);
      data.plan_end_date = endDate.toISOString().split('T')[0];
    }
    
    try {
      const { membersAPI } = await import('../services/api');
      await membersAPI.create(data);
      toast.success('Member successfully added to branch!');
      setShowMemberModal(false);
      
      // Refresh branch members and counts
      setLoadingMembers(true);
      const membersRes = await membersAPI.getAll({ branch_id: addingToBranch });
      setBranchMembers(prev => ({...prev, [addingToBranch]: membersRes.data.members || []}));
      fetchBranches();
      setLoadingMembers(false);
    } catch (error) {
      toast.error('Failed to add member directly');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn min-h-[calc(100vh-10rem)] pb-24">
      {/* Header (Screenshot 7 styled) */}
      <div className="flex items-center gap-4 bg-gray-900 -mx-4 -mt-4 p-4 mb-2 sticky top-0 z-10 border-b border-gray-800">
        <button onClick={() => navigate(-1)} className="p-2 text-white hover:bg-gray-800 rounded-full transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">Manage Gym Branch</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-accent"></div>
        </div>
      ) : branches.length === 0 ? (
        <div className="text-center py-24">
           <Building2 className="w-16 h-16 text-gray-700 mx-auto mb-4" />
           <p className="text-gray-400">No Branch Available</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-4xl mx-auto px-2">
          {branches.map(branch => (
            <div key={branch.id} className="bg-white rounded-xl shadow-sm group overflow-hidden">
              <div 
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleBranch(branch.id)}
              >
                <div className="flex items-center gap-4">
                   <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                      <div className={`w-3 h-3 rounded-full ${expandedBranch === branch.id ? 'bg-gym-accent' : 'bg-gray-200'}`}></div>
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-gray-900">{branch.name} <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md ml-2">{branch.active_members || 0} Members</span></h3>
                      <p className="text-sm text-gray-500 font-medium">{branch.address || 'No Address Provided'}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={(e) => { e.stopPropagation(); setEditingBranch(branch); setShowModal(true); }} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(branch.id) }} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {expandedBranch === branch.id && (
                <div className="border-t border-gray-100 bg-gray-50 p-5">
                  {loadingMembers ? (
                    <div className="flex justify-center p-4">
                       <div className="w-6 h-6 border-2 border-gym-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Branch Financial Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                         <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">All-Time Revenue</p>
                            <p className="text-xl font-black text-emerald-600">₹{branchStats[branch.id]?.revenue?.toLocaleString() || 0}</p>
                         </div>
                         <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Expenses</p>
                            <p className="text-xl font-black text-rose-500">₹{branchStats[branch.id]?.expenses?.toLocaleString() || 0}</p>
                         </div>
                         <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Net Profit</p>
                            <p className="text-xl font-black text-blue-600">₹{branchStats[branch.id]?.netIncome?.toLocaleString() || 0}</p>
                         </div>
                         <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Members</p>
                              <p className="text-xl font-black text-gray-900">{branch.active_members || 0}</p>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setAddingToBranch(branch.id); setShowMemberModal(true); }}
                              className="w-10 h-10 bg-gym-accent hover:bg-[#004746] text-white rounded-xl flex items-center justify-center transition-colors shadow-md"
                              title="Add Member Directly"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                         </div>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Registered Members</h4>
                      </div>
                      
                      {branchMembers[branch.id]?.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left text-gray-600">
                            <thead className="text-xs text-gray-500 uppercase bg-gray-200/50 rounded-lg">
                              <tr>
                                <th className="px-4 py-2">ID</th>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Phone</th>
                                <th className="px-4 py-2">Plan</th>
                                <th className="px-4 py-2">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {branchMembers[branch.id].map(member => (
                                <tr key={member.id} className="border-b border-gray-100 hover:bg-white transition-colors">
                                  <td className="px-4 py-2 font-medium text-gym-accent">{member.membership_id || '-'}</td>
                                  <td className="px-4 py-2 font-semibold text-gray-900">{member.name}</td>
                                  <td className="px-4 py-2">{member.phone}</td>
                                  <td className="px-4 py-2"><span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{member.plan_name || 'N/A'}</span></td>
                                  <td className="px-4 py-2">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      member.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                      {member.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center text-sm text-gray-500 py-4">No members assigned to this branch yet.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* FAB - Screenshot 7 style: Wide button at bottom right */}
      <div className="fixed bottom-6 right-6">
          <button 
            onClick={() => { setEditingBranch(null); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-4 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl shadow-2xl transition-all transform hover:scale-105"
          >
            <Plus className="w-6 h-6" />
            <span className="font-bold">Add Gym Branch</span>
          </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">{editingBranch ? 'Edit Branch' : 'Add Branch'}</h2>
              <button onClick={() => { setShowModal(false); setEditingBranch(null); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Name *</label>
                <input 
                  name="name" 
                  required 
                  defaultValue={editingBranch?.name} 
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#005c5b] focus:bg-white rounded-xl text-gray-900 font-medium transition-all outline-none" 
                  placeholder="Ironman Fitness..." 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Address</label>
                <textarea 
                  name="address" 
                  defaultValue={editingBranch?.address} 
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#005c5b] focus:bg-white rounded-xl text-gray-900 font-medium transition-all outline-none" 
                  rows="2"
                  placeholder="Store location..."
                ></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Phone</label>
                <input 
                  name="phone" 
                  defaultValue={editingBranch?.phone} 
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-[#005c5b] focus:bg-white rounded-xl text-gray-900 font-medium transition-all outline-none" 
                  placeholder="+91 00000 00000" 
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-4 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-lg shadow-lg transition-all"
              >
                {editingBranch ? 'Update Details' : 'Save Branch'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Direct Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">Add Member to Branch</h2>
              <button 
                onClick={() => { setShowMemberModal(false); setAddingToBranch(null); }} 
                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddMember} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 ml-1">Full Name *</label>
                  <input name="name" required className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-gym-accent rounded-xl text-sm font-medium outline-none" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 ml-1">Phone *</label>
                  <input name="phone" required className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-gym-accent rounded-xl text-sm font-medium outline-none" placeholder="10 Digits" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 ml-1">Email</label>
                  <input name="email" type="email" className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-gym-accent rounded-xl text-sm font-medium outline-none" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 ml-1">Membership Plan *</label>
                  <select name="plan_id" required className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-gym-accent rounded-xl text-sm font-medium outline-none">
                    <option value="">Select Plan</option>
                    {plans.map(p => <option key={p.id} value={p.id}>{p.name} (₹{p.price})</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-1 ml-1">Gender</label>
                <select name="gender" className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-gym-accent rounded-xl text-sm font-medium outline-none">
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                className="w-full py-4 bg-gym-accent hover:bg-[#004746] text-white rounded-xl font-black text-lg shadow-lg mt-4"
              >
                Create Member
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Branches;
