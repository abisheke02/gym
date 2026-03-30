import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { leadsAPI, branchesAPI } from '../services/api';
import { 
  Search, 
  Plus, 
  Phone,
  Mail,
  AlertTriangle,
  ChevronRight,
  Upload,
  Download,
  Filter,
  MessageSquare,
  UserPlus,
  Clock,
  CheckCircle,
  XCircle,
  MoreVertical,
  ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import BulkUploadModal from './BulkUploadModal';

const ManageEnquiry = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    status: searchParams.get('status') || '',
    branch_id: searchParams.get('branch_id') || ''
  });

  const fetchLeads = useCallback(async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.branch_id) params.branch_id = filter.branch_id;

      const response = await leadsAPI.getAll(params);
      setLeads(response.data.leads || []);
    } catch (error) {
      toast.error('Failed to fetch enquiries');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchBranches = useCallback(async () => {
    try {
      const response = await branchesAPI.getAll();
      setBranches(response.data.branches || []);
    } catch (error) {
      console.error('Failed to fetch branches');
    }
  }, []);

  useEffect(() => {
    fetchLeads();
    fetchBranches();
  }, [fetchLeads, fetchBranches]);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      await leadsAPI.create(data);
      toast.success('Enquiry added successfully');
      setShowModal(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to add enquiry');
    }
  };

  const statusMap = {
    new: { label: 'New', color: 'bg-blue-500/10 text-blue-500 border-blue-200 dark:border-blue-500/30' },
    contacted: { label: 'Contacted', color: 'bg-amber-500/10 text-amber-500 border-amber-200 dark:border-amber-500/30' },
    visited: { label: 'Visited', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-200 dark:border-indigo-500/30' },
    trial: { label: 'Trial', color: 'bg-cyan-500/10 text-cyan-500 border-cyan-200 dark:border-cyan-500/30' },
    joined: { label: 'Joined', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-200 dark:border-emerald-500/30' },
    lost: { label: 'Lost', color: 'bg-rose-500/10 text-rose-500 border-rose-200 dark:border-rose-500/30' }
  };

  const filteredLeads = leads.filter(lead =>
    lead.name.toLowerCase().includes(search.toLowerCase()) ||
    lead.phone.includes(search)
  );

  return (
    <div className="space-y-8 animate-fadeIn pb-24 dark:bg-[#0a0a0a] max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-2">Enquiry Pipeline</h1>
           <p className="text-sm font-bold text-gray-400 dark:text-gray-500">Track and convert {leads.length} potential members.</p>
        </div>
        <div className="flex gap-4">
           <button
             onClick={() => setShowBulkModal(true)}
             className="px-6 py-3 bg-white dark:bg-gray-800 text-[#005c5b] dark:text-[#01a2a1] rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:border-[#005c5b] flex items-center gap-2"
           >
             <Download className="w-4 h-4" />
             Import Bulk
           </button>
           <button
             onClick={() => setShowModal(true)}
             className="btn-primary flex items-center gap-3 px-8 shadow-xl shadow-[#005c5b]/30"
           >
             <Plus className="w-5 h-5" />
             <span className="uppercase tracking-widest text-[11px]">New Lead</span>
           </button>
        </div>
      </div>

      {/* Quick Summary Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
         <div className="gym-card p-6 bg-[#005c5b] text-white border-none">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">New Leads</p>
            <p className="text-3xl font-black">{leads.filter(l => l.status === 'new').length}</p>
         </div>
         <div className="gym-card p-6 bg-white dark:bg-gray-800 border-none shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">In Trial</p>
            <p className="text-3xl font-black text-[#005c5b] dark:text-[#01a2a1]">{leads.filter(l => l.status === 'trial').length}</p>
         </div>
         <div className="gym-card p-6 bg-white dark:bg-gray-800 border-none shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">Conversion</p>
            <p className="text-3xl font-black text-emerald-500">{leads.filter(l => l.status === 'joined').length}</p>
         </div>
         <div className="gym-card p-6 bg-white dark:bg-gray-800 border-none shadow-xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">SLA Breached</p>
            <p className="text-3xl font-black text-rose-500">{leads.filter(l => l.sla_breached).length}</p>
         </div>
      </div>

      {/* Search & Tool Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-xl border-none space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
           <div className="flex-1 relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#005c5b] transition-colors" />
             <input
               type="text"
               placeholder="Search by lead name or contact number..."
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-sm font-bold placeholder:text-gray-300 outline-none border-2 border-transparent focus:border-[#005c5b] dark:focus:border-[#01a2a1] transition-all dark:text-white"
             />
           </div>
           <div className="flex gap-2">
              <select 
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-xs font-black uppercase outline-none border-2 border-transparent focus:border-[#005c5b] dark:text-gray-300 cursor-pointer"
              >
                <option value="">All Status</option>
                {Object.keys(statusMap).map(s => <option key={s} value={s}>{statusMap[s].label}</option>)}
              </select>
              <button className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-gray-400 hover:text-[#005c5b] transition-all border-none"><Filter className="w-5 h-5" /></button>
           </div>
        </div>
      </div>

      {/* Enquiry List - Mobile Card Style */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005c5b]"></div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-24 bg-white dark:bg-gray-800 rounded-[3rem] shadow-xl space-y-6">
            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-900/50 rounded-full flex items-center justify-center mx-auto text-gray-200 dark:text-gray-700">
               <UserPlus className="w-12 h-12" />
            </div>
            <div>
               <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase mb-2">No Enquiries Found</h3>
               <p className="text-sm font-bold text-gray-400 max-w-xs mx-auto">Start building your pipeline by adding a new lead.</p>
            </div>
            <button
               onClick={() => setShowModal(true)}
               className="btn-primary inline-flex items-center gap-3 px-10"
            >
               <Plus className="w-5 h-5" />
               New Enquiry
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4">Lead Name</th>
                    <th className="px-6 py-4">Contact Detail</th>
                    <th className="px-6 py-4">SLA Alert</th>
                    <th className="px-6 py-4">Pipeline Status</th>
                    <th className="px-6 py-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredLeads.map(lead => (
                    <tr key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-[#005c5b] dark:text-[#01a2a1] font-black text-lg">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">{lead.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-2 mb-1">
                            <Phone className="w-3 h-3" />
                            <span className="font-bold text-xs">{lead.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {lead.sla_breached ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-500/30 text-rose-500 bg-rose-500/10">
                            <AlertTriangle className="w-3 h-3" />
                            Breached
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                            <CheckCircle className="w-3 h-3" />
                            On Track
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-current ${statusMap[lead.status]?.color || 'text-gray-400'}`}>
                          {statusMap[lead.status]?.label || lead.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link 
                          to={`/leads/${lead.id}`}
                          className="p-2 inline-flex bg-gray-100 hover:bg-[#005c5b] dark:bg-gray-700 dark:hover:bg-[#01a2a1] text-gray-500 hover:text-white dark:text-gray-300 rounded-xl transition-all"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* FAB for mobile */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-24 right-8 w-16 h-16 bg-[#005c5b] hover:bg-[#004746] text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-[#005c5b]/40 transition-all z-[60] group lg:hidden"
      >
        <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Create Enquiry Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">Register Enquiry</h2>
            <form onSubmit={handleCreateLead} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Full Name *</label>
                <input name="name" required className="input-field" placeholder="Enter prospective member name" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Contact Number *</label>
                <div className="relative group">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                   <input name="phone" required className="input-field pl-12" placeholder="10-digit mobile number" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Email Address</label>
                <input name="email" type="email" className="input-field" placeholder="email@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Gender</label>
                  <select name="gender" className="input-field cursor-pointer">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Age Group</label>
                  <input name="age" type="number" className="input-field" placeholder="Age" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Target Branch</label>
                <select name="branch_id" className="input-field cursor-pointer">
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Consultation Notes</label>
                <textarea name="notes" className="input-field resize-none h-24" placeholder="Mention interests, trial requests, or concerns..."></textarea>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn-secondary"
                >
                  Discard
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Save Enquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onUploadSuccess={fetchLeads}
        branches={branches}
      />
    </div>
  );
};

export default ManageEnquiry;
