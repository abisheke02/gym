import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { membersAPI, plansAPI } from '../services/api';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  CreditCard,
  Clock,
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const MemberDetail = () => {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchMemberDetail();
    fetchPlans();
  }, [id]);

  const fetchMemberDetail = async () => {
    try {
      const response = await membersAPI.getById(id);
      setMember(response.data.member);
    } catch (error) {
      toast.error('Failed to fetch member details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await plansAPI.getAll();
      setPlans(response.data.plans);
    } catch (error) {
      console.error('Failed to fetch plans');
    }
  };

  const handleCheckIn = async () => {
    try {
      await membersAPI.checkIn(id);
      toast.success('Member checked in successfully');
      fetchMemberDetail();
    } catch (error) {
      toast.error('Failed to check in');
    }
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      plan_id: formData.get('plan_id'),
      amount: formData.get('amount'),
      payment_mode: formData.get('payment_mode')
    };
    
    try {
      await membersAPI.renew(id, data);
      toast.success('Member renewed successfully');
      setShowRenewModal(false);
      fetchMemberDetail();
    } catch (error) {
      toast.error('Failed to renew member');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      active: 'bg-green-500/20 text-green-400 border border-green-500/30',
      expired: 'bg-orange-500/20 text-orange-500 border border-orange-500/30',
      frozen: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      cancelled: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    };
    return statusClasses[status] || statusClasses.active;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gym-accent"></div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Member not found</p>
        <Link to="/members" className="text-gym-accent mt-2 inline-block">Back to Members</Link>
      </div>
    );
  }

  const daysLeft = Math.ceil((new Date(member.plan_end_date) - new Date()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/members" className="p-2 hover:bg-gray-800 rounded-lg">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{member.name}</h1>
            <span className={`status-badge ${getStatusBadge(member.status)} capitalize`}>
              {member.status}
            </span>
          </div>
          <p className="text-gray-400">Member Details</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCheckIn} className="btn-secondary flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Check In
          </button>
          {member.status === 'active' || member.status === 'expired' ? (
            <button onClick={() => setShowRenewModal(true)} className="btn-primary flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Renew
            </button>
          ) : null}
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
                  <p className="text-white">{member.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-400">Email</p>
                  <p className="text-white">{member.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-400">Address</p>
                  <p className="text-white">{member.address || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-400">Joined</p>
                  <p className="text-white">{new Date(member.joining_date).toLocaleDateString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Details */}
          <div className="gym-card">
            <h3 className="text-lg font-semibold text-white mb-4">Plan Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Current Plan</p>
                <p className="text-xl font-bold text-white">{member.plan_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Price</p>
                <p className="text-xl font-bold text-white">₹{member.plan_price}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Start Date</p>
                <p className="text-white">{new Date(member.plan_start_date).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">End Date</p>
                <p className={`font-bold ${daysLeft <= 7 ? 'text-orange-400' : 'text-white'}`}>
                  {new Date(member.plan_end_date).toLocaleDateString('en-IN')}
                  {daysLeft > 0 && <span className="text-sm ml-2">({daysLeft} days left)</span>}
                </p>
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="gym-card">
            <h3 className="text-lg font-semibold text-white mb-4">Payment History</h3>
            {member.payments?.length > 0 ? (
              <div className="space-y-3">
                {member.payments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-white font-medium">₹{payment.amount}</p>
                      <p className="text-sm text-gray-400">{payment.payment_mode} • {new Date(payment.created_at).toLocaleDateString('en-IN')}</p>
                    </div>
                    <span className="text-green-400 text-sm">Paid</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400">No payment history</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="gym-card">
            <h3 className="text-lg font-semibold text-white mb-4">Membership Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Branch</p>
                <p className="text-white">{member.branch_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Duration</p>
                <p className="text-white">{member.duration_months} months</p>
              </div>
              {member.last_check_in && (
                <div>
                  <p className="text-sm text-gray-400">Last Check-in</p>
                  <p className="text-white">{new Date(member.last_check_in).toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Check-in Stats */}
          <div className="gym-card">
            <h3 className="text-lg font-semibold text-white mb-4">Today's Status</h3>
            <div className="text-center py-4">
              {member.last_check_in && new Date(member.last_check_in).toDateString() === new Date().toDateString() ? (
                <div>
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                  <p className="text-green-400 font-medium">Checked In Today</p>
                  <p className="text-sm text-gray-400">{new Date(member.last_check_in).toLocaleTimeString('en-IN')}</p>
                </div>
              ) : (
                <div>
                  <Clock className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                  <p className="text-gray-400">Not checked in today</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Renew Membership</h2>
            <form onSubmit={handleRenew} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Select Plan *</label>
                <select name="plan_id" required className="input-field">
                  <option value="">Select Plan</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.name} - ₹{plan.price}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Amount *</label>
                <input name="amount" type="number" required className="input-field" placeholder="Amount paid" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Payment Mode *</label>
                <select name="payment_mode" required className="input-field">
                  <option value="">Select Mode</option>
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowRenewModal(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn-primary">
                  Renew
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetail;

