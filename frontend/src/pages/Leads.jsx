import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { leadsAPI, branchesAPI, plansAPI } from '../services/api';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertTriangle,
  ChevronRight,
  Send,
  Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import BulkUploadModal from './BulkUploadModal';

const Leads = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [leads, setLeads] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState({
    status: searchParams.get('status') || '',
    branch_id: searchParams.get('branch_id') || '',
    sla_breached: searchParams.get('sla') === 'true' ? true : ''
  });

  useEffect(() => {
    fetchLeads();
    fetchBranches();
  }, [filter]);

  const fetchLeads = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.branch_id) params.branch_id = filter.branch_id;
      if (filter.sla_breached === true) params.sla_breached = true;
      
      const response = await leadsAPI.getAll(params);
      setLeads(response.data.leads);
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await branchesAPI.getAll();
      setBranches(response.data.branches);
    } catch (error) {
      console.error('Failed to fetch branches');
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    try {
      await leadsAPI.create(data);
      toast.success('Lead created successfully');
      setShowModal(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create lead');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      new: 'status-new',
      contacted: 'status-contacted',
      visited: 'status-visited',
      trial: 'status-trial',
      joined: 'status-joined',
      lost: 'status-lost'
    };
    return statusClasses[status] || 'status-new';
  };

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(search.toLowerCase()) ||
    lead.phone.includes(search)
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-gray-400">Manage your leads and conversions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBulkModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Bulk Upload
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="gym-card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-10"
            />
          </div>
          <select
            value={filter.status}
            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            className="input-field md:w-48"
          >
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="visited">Visited</option>
            <option value="trial">Trial</option>
            <option value="joined">Joined</option>
            <option value="lost">Lost</option>
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
        </div>
      </div>

      {/* Pipeline */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {['new', 'contacted', 'visited', 'trial', 'joined', 'lost'].map(status => (
          <div key={status} className="gym-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 capitalize">{status}</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {leads.filter(l => l.status === status).length}
            </p>
          </div>
        ))}
      </div>

      {/* Leads List */}
      <div className="gym-card">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-accent"></div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Lead</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Assigned To</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Source</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Created</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map(lead => (
                  <tr key={lead.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gym-accent/20 flex items-center justify-center text-gym-accent font-bold">
                          {lead.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-medium">{lead.name}</p>
                          {lead.sla_breached && (
                            <div className="flex items-center gap-1 text-red-400 text-xs">
                              <AlertTriangle className="w-3 h-3" />
                              SLA Breached
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-gray-300 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          {lead.phone}
                        </div>
                        {lead.email && (
                          <div className="flex items-center gap-2 text-gray-500 text-xs">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`status-badge ${getStatusBadge(lead.status)} capitalize`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {lead.assigned_to_name || 'Unassigned'}
                    </td>
                    <td className="py-3 px-4 text-gray-300 text-sm">
                      {lead.source_name || '-'}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {new Date(lead.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="text-gym-accent hover:text-gym-accent/80 flex items-center gap-1"
                      >
                        View <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-4">Add New Lead</h2>
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Name *</label>
                <input name="name" required className="input-field" placeholder="Enter name" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Phone *</label>
                <input name="phone" required className="input-field" placeholder="10-digit phone number" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Email</label>
                <input name="email" type="email" className="input-field" placeholder="email@example.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Gender</label>
                  <select name="gender" className="input-field">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Age</label>
                  <input name="age" type="number" className="input-field" placeholder="Age" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Address</label>
                <textarea name="address" className="input-field" rows="2" placeholder="Full address"></textarea>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Branch</label>
                <select name="branch_id" className="input-field">
                  <option value="">Select Branch</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Notes</label>
                <textarea name="notes" className="input-field" rows="2" placeholder="Additional notes"></textarea>
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
                  Create Lead
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

export default Leads;

