import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { leadsAPI, branchesAPI, plansAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Clock,
  Send,
  UserPlus,
  MessageSquare,
  AlertTriangle,
  DollarSign
} from 'lucide-react';
import toast from 'react-hot-toast';

const LeadDetail = () => {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchLeadDetail();
    fetchBranches();
    fetchPlans();
  }, [id]);

  const fetchLeadDetail = async () => {
    try {
      const response = await leadsAPI.getById(id);
      setLead(response.data.lead);
    } catch (error) {
      toast.error('Failed to fetch lead details');
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

  const handleUpdateStatus = async (status) => {
    try {
      await leadsAPI.updateStatus(id, status);
      toast.success('Status updated');
      setShowStatusModal(false);
      fetchLeadDetail();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleSendWhatsApp = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const message = formData.get('message');
    
    try {
      await leadsAPI.sendWhatsApp(id, message);
      toast.success('Message sent');
      setShowWhatsAppModal(false);
      fetchLeadDetail();
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const handleConvertToMember = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Calculate accurate end date based on selected plan
    const plan = plans.find(p => p.id === data.plan_id);
    if (plan) {
      data.plan_start_date = new Date().toISOString().split('T')[0];
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration_months);
      data.plan_end_date = endDate.toISOString().split('T')[0];
    } else {
      data.plan_start_date = new Date().toISOString().split('T')[0];
      data.plan_end_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    try {
      await leadsAPI.convertToMember(id, data);
      toast.success('Lead converted to member');
      setShowConvertModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to convert lead');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-accent"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Lead not found</p>
        <Link to="/leads" className="text-gym-accent mt-2 inline-block">Back to Leads</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/leads" className="p-2 hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{lead.name}</h1>
            {lead.sla_breached && (
              <span className="flex items-center gap-1 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm">
                <AlertTriangle className="w-4 h-4" /> SLA Breached
              </span>
            )}
          </div>
          <p className="text-gray-400">Lead Details</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Send WhatsApp
          </button>
          {hasRole('owner', 'manager', 'sales') && lead.status !== 'joined' && lead.status !== 'lost' && (
            <button
              onClick={() => setShowConvertModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Convert to Member
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <div className="gym-card">
            <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-400">Phone</p>
                  <p className="text-white">{lead.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white">{lead.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-400">Address</p>
                  <p className="text-white">{lead.address || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-400">Created</p>
                  <p className="text-white">{new Date(lead.created_at).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="gym-card">
            <h3 className="text-lg font-semibold text-white mb-4">Activity Timeline</h3>
            <div className="space-y-4">
              {lead.timeline?.length > 0 ? (
                lead.timeline.map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-2 h-2 mt-2 rounded-full bg-gym-accent"></div>
                    <div className="flex-1">
                      <p className="text-white">{item.description}</p>
                      <p className="text-sm text-gray-500">
                        {item.performed_by_name && `${item.performed_by_name} • `}
                        {new Date(item.created_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No activity yet</p>
              )}
            </div>
          </div>

          {/* WhatsApp Chat */}
          <div className="gym-card">
            <h3 className="text-lg font-semibold text-white mb-4">WhatsApp Chat</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {lead.chatHistory?.length > 0 ? (
                lead.chatHistory.map((msg, index) => (
                  <div key={index} className={`p-3 rounded-lg ${msg.direction === 'outbound' ? 'bg-gym-accent/20 ml-8' : 'bg-gray-800 mr-8'}`}>
                    <p className="text-sm text-white">{msg.message_text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {msg.direction === 'outbound' ? 'Sent' : 'Received'} • {new Date(msg.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">No messages yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="gym-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Status</h3>
              {hasRole('owner', 'manager', 'sales') && (
                <button
                  onClick={() => setShowStatusModal(true)}
                  className="text-sm text-gym-accent hover:underline"
                >
                  Change
                </button>
              )}
            </div>
            <span className={`status-badge text-lg ${getStatusBadge(lead.status)} capitalize`}>
              {lead.status}
            </span>
          </div>

          {/* Assignment */}
          <div className="gym-card">
            <h3 className="text-lg font-semibold text-white mb-4">Assignment</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400">Assigned To</p>
                <p className="text-white">{lead.assigned_to_name || 'Unassigned'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Branch</p>
                <p className="text-white">{lead.branch_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Source</p>
                <p className="text-white">{lead.source_name || '-'}</p>
              </div>
            </div>
          </div>

          {/* SLA Info */}
          <div className="gym-card">
            <h3 className="text-lg font-semibold text-white mb-4">SLA Status</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">WhatsApp Replied</span>
                <span className={lead.whatsapp_replied ? 'text-green-400' : 'text-yellow-400'}>
                  {lead.whatsapp_replied ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400">SLA Breached</span>
                <span className={lead.sla_breached ? 'text-orange-400' : 'text-green-400'}>
                  {lead.sla_breached ? 'Yes' : 'No'}
                </span>
              </div>
              {lead.follow_up_schedule && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Follow-up</span>
                  <span className="text-white">
                    {new Date(lead.follow_up_schedule).toLocaleString('en-IN')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Update Status</h2>
            <div className="space-y-2">
              {['new', 'contacted', 'visited', 'trial', 'joined', 'lost'].map(status => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(status)}
                  className={`w-full p-3 rounded-lg text-left capitalize ${lead.status === status ? 'bg-gym-accent text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                >
                  {status}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowStatusModal(false)}
              className="w-full mt-4 btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Convert Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Convert to Member</h2>
            <form onSubmit={handleConvertToMember} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 mb-1">Branch *</label>
                  <select name="branch_id" required className="input-field cursor-pointer">
                    <option value="">Select Branch</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 mb-1">Admission ID (Optional)</label>
                  <input name="membership_id" className="input-field" placeholder="Auto-generated if left blank" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1 mb-1">Plan *</label>
                  <select name="plan_id" required className="input-field cursor-pointer">
                    <option value="">Select Plan</option>
                    {plans.map(plan => (
                      <option key={plan.id} value={plan.id}>{plan.name} - ₹{plan.price}</option>
                    ))}
                  </select>
                </div>

                <div className="bg-[#005c5b]/10 p-4 rounded-2xl border border-[#005c5b]/20 mt-2">
                   <h4 className="text-[10px] font-black text-emerald-500 mb-3 uppercase tracking-widest flex items-center gap-2"><DollarSign className="w-4 h-4" /> Initial Payment</h4>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase px-1 mb-1">Amount Paid (₹)</label>
                        <input name="amount" type="number" min="0" required className="input-field bg-white/50 dark:bg-black/20 focus:border-emerald-500" placeholder="e.g. 5000" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase px-1 mb-1">Payment Mode</label>
                        <select name="payment_mode" required className="input-field bg-white/50 dark:bg-black/20 focus:border-emerald-500">
                          <option value="upi">UPI / Scanner</option>
                          <option value="cash">Cash</option>
                          <option value="card">Card / POS</option>
                        </select>
                      </div>
                   </div>
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowConvertModal(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Convert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Send WhatsApp Message</h2>
            <form onSubmit={handleSendWhatsApp} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Message</label>
                <textarea name="message" required className="input-field" rows="4" placeholder="Type your message..."></textarea>
              </div>
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowWhatsAppModal(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" /> Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetail;

