import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { membersAPI, plansAPI, trainersAPI, ptSessionsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Phone, Mail, MapPin, Calendar, Clock,
  RefreshCw, CheckCircle, Dumbbell, Plus, Trash2, X,
  TrendingUp, User, Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

const MemberDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [member, setMember]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [plans, setPlans]           = useState([]);
  const [trainers, setTrainers]     = useState([]);
  const [activeTab, setActiveTab]   = useState('overview');

  // PT sessions
  const [sessions, setSessions]     = useState([]);
  const [ptSummary, setPtSummary]   = useState({ pt_sessions_total: 0, pt_sessions_completed: 0 });
  const [ptLoading, setPtLoading]   = useState(false);
  const [showPtModal, setShowPtModal] = useState(false);
  const [ptForm, setPtForm]         = useState({
    session_date: new Date().toISOString().split('T')[0],
    trainer_id: '',
    duration_minutes: 60,
    notes: '',
  });
  const [savingPt, setSavingPt]     = useState(false);

  // Modals
  const [showRenewModal, setShowRenewModal] = useState(false);

  useEffect(() => {
    fetchMemberDetail();
    fetchPlans();
    fetchTrainers();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'pt') fetchPtSessions();
  }, [activeTab]);

  const fetchMemberDetail = async () => {
    try {
      const response = await membersAPI.getById(id);
      setMember(response.data.member);
    } catch {
      toast.error('Failed to fetch member details');
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try { const r = await plansAPI.getAll(); setPlans(r.data.plans || []); } catch {}
  };

  const fetchTrainers = async () => {
    try { const r = await trainersAPI.getAll(); setTrainers(r.data.trainers || []); } catch {}
  };

  const fetchPtSessions = async () => {
    setPtLoading(true);
    try {
      const r = await ptSessionsAPI.getMemberSessions(id);
      setSessions(r.data.sessions || []);
      setPtSummary(r.data.summary || { pt_sessions_total: 0, pt_sessions_completed: 0 });
    } catch {
      toast.error('Failed to load PT sessions');
    } finally {
      setPtLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      await membersAPI.checkIn(id);
      toast.success('Checked in successfully');
      fetchMemberDetail();
    } catch {
      toast.error('Failed to check in');
    }
  };

  const handleRenew = async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target).entries());
    try {
      await membersAPI.renew(id, data);
      toast.success('Membership renewed');
      setShowRenewModal(false);
      fetchMemberDetail();
    } catch {
      toast.error('Failed to renew membership');
    }
  };

  const handleLogSession = async (e) => {
    e.preventDefault();
    setSavingPt(true);
    try {
      await ptSessionsAPI.logSession({ member_id: id, ...ptForm });
      toast.success('Session logged');
      setShowPtModal(false);
      setPtForm({ session_date: new Date().toISOString().split('T')[0], trainer_id: '', duration_minutes: 60, notes: '' });
      fetchPtSessions();
      fetchMemberDetail(); // refresh sessions_completed count
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to log session');
    } finally {
      setSavingPt(false);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Delete this session record?')) return;
    try {
      await ptSessionsAPI.deleteSession(sessionId);
      toast.success('Session deleted');
      fetchPtSessions();
      fetchMemberDetail();
    } catch {
      toast.error('Failed to delete session');
    }
  };

  const getStatusColor = (status) => ({
    active:    'bg-green-500/20 text-green-400 border border-green-500/30',
    expired:   'bg-orange-500/20 text-orange-500 border border-orange-500/30',
    frozen:    'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  }[status] || 'bg-gray-500/20 text-gray-400');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005c5b]" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Member not found</p>
        <Link to="/members" className="text-[#005c5b] mt-2 inline-block font-bold">← Back to Members</Link>
      </div>
    );
  }

  const daysLeft = member.plan_end_date
    ? Math.ceil((new Date(member.plan_end_date) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const ptProgress = ptSummary.pt_sessions_total > 0
    ? Math.min(100, Math.round((ptSummary.pt_sessions_completed / ptSummary.pt_sessions_total) * 100))
    : 0;

  const hasPT = member.pt_trainer_id || ptSummary.pt_sessions_total > 0;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'payments', label: 'Payments' },
    { id: 'pt',       label: `PT Sessions${hasPT ? ` (${ptSummary.pt_sessions_completed}/${ptSummary.pt_sessions_total})` : ''}` },
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/members" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black text-gray-900 dark:text-white truncate">{member.name}</h1>
            <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${getStatusColor(member.status)}`}>
              {member.status}
            </span>
            {member.membership_id && (
              <span className="text-xs font-black text-[#005c5b] uppercase tracking-widest">
                #{member.membership_id}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 font-bold mt-0.5">{member.phone}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={handleCheckIn}
            className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-black text-gray-700 dark:text-gray-300 hover:border-[#005c5b] transition-all">
            <CheckCircle className="w-4 h-4" /> Check In
          </button>
          {['active','expired'].includes(member.status) && (
            <button onClick={() => setShowRenewModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl text-sm font-black shadow-lg">
              <RefreshCw className="w-4 h-4" /> Renew
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === t.id
                ? 'bg-white dark:bg-gray-700 text-[#005c5b] dark:text-[#01a2a1] shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Contact */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Contact Info</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: Phone,    label: 'Phone',   value: member.phone },
                  { icon: Mail,     label: 'Email',   value: member.email || '—' },
                  { icon: MapPin,   label: 'Address', value: member.address || '—' },
                  { icon: Calendar, label: 'Joined',  value: member.joining_date ? new Date(member.joining_date).toLocaleDateString('en-IN') : '—' },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Plan Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white">{member.plan_name || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Price</p>
                  <p className="text-xl font-black text-[#005c5b] dark:text-[#01a2a1]">₹{(member.plan_price || 0).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Date</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {member.plan_start_date ? new Date(member.plan_start_date).toLocaleDateString('en-IN') : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">End Date</p>
                  <p className={`text-sm font-black ${daysLeft <= 7 && daysLeft >= 0 ? 'text-orange-400' : daysLeft < 0 ? 'text-rose-500' : 'text-gray-900 dark:text-white'}`}>
                    {member.plan_end_date ? new Date(member.plan_end_date).toLocaleDateString('en-IN') : '—'}
                    {daysLeft > 0 && <span className="text-xs font-bold ml-1.5">({daysLeft}d left)</span>}
                    {daysLeft === 0 && <span className="text-xs font-bold ml-1.5 text-orange-400">(expires today)</span>}
                    {daysLeft < 0 && <span className="text-xs font-bold ml-1.5">(expired)</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* PT Summary (if assigned) */}
            {hasPT && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Personal Training</h3>
                  <button onClick={() => setActiveTab('pt')}
                    className="text-xs font-black text-[#005c5b] uppercase tracking-widest hover:underline">
                    View All →
                  </button>
                </div>
                <div className="flex items-center gap-6 mb-4">
                  <div className="text-center">
                    <p className="text-3xl font-black text-[#005c5b]">{ptSummary.pt_sessions_completed}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-gray-400">{ptSummary.pt_sessions_total}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">Total</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-gray-400">Progress</span>
                      <span className="text-xs font-black text-[#005c5b]">{ptProgress}%</span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#005c5b] rounded-full transition-all duration-500"
                        style={{ width: `${ptProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
                {member.trainer_name && (
                  <div className="flex items-center gap-2 p-3 bg-[#005c5b]/5 rounded-xl border border-[#005c5b]/10">
                    <User className="w-4 h-4 text-[#005c5b]" />
                    <span className="text-xs font-black text-[#005c5b]">Trainer: {member.trainer_name}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Membership Info</h3>
              <div className="space-y-3">
                {[
                  { label: 'Gender',   value: member.gender ? member.gender.charAt(0).toUpperCase() + member.gender.slice(1) : '—' },
                  { label: 'Duration', value: member.duration_months ? `${member.duration_months} month${member.duration_months > 1 ? 's' : ''}` : '—' },
                  { label: 'Last Check-in', value: member.last_check_in ? new Date(member.last_check_in).toLocaleString('en-IN') : 'Never' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Today's Status</h3>
              {member.last_check_in && new Date(member.last_check_in).toDateString() === new Date().toDateString() ? (
                <>
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-black text-green-500">Checked In</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(member.last_check_in).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
                </>
              ) : (
                <>
                  <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm font-black text-gray-400">Not In Yet</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PAYMENTS TAB ── */}
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {member.payments?.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {member.payments.map((p, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm text-gray-900 dark:text-white capitalize">{p.payment_mode}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{new Date(p.created_at).toLocaleDateString('en-IN')}</p>
                  </div>
                  <p className="font-black text-green-500">₹{parseFloat(p.amount).toLocaleString()}</p>
                  <span className="text-[10px] font-black uppercase bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">Paid</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Activity className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No payment records</p>
            </div>
          )}
        </div>
      )}

      {/* ── PT SESSIONS TAB ── */}
      {activeTab === 'pt' && (
        <div className="space-y-4">
          {/* PT Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">
                {ptSummary.pt_sessions_completed} of {ptSummary.pt_sessions_total} sessions completed
              </p>
              {ptSummary.pt_sessions_total > 0 && (
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden" style={{ width: 200 }}>
                    <div className="h-full bg-[#005c5b] rounded-full" style={{ width: `${ptProgress}%` }} />
                  </div>
                  <span className="text-xs font-black text-[#005c5b]">{ptProgress}%</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setShowPtModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg"
            >
              <Plus className="w-4 h-4" /> Log Session
            </button>
          </div>

          {/* Sessions list */}
          {ptLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005c5b]" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center shadow-sm border border-gray-100 dark:border-gray-700">
              <Dumbbell className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No sessions logged yet</p>
              <p className="text-xs text-gray-400 mt-1">Click "Log Session" to record the first PT session</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {sessions.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="w-8 h-8 rounded-xl bg-[#005c5b]/10 flex items-center justify-center text-[#005c5b] font-black text-xs shrink-0">
                      {sessions.length - i}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-sm text-gray-900 dark:text-white">
                          {new Date(s.session_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        {s.trainer_name && (
                          <span className="text-[10px] font-black bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full">
                            {s.trainer_name}
                          </span>
                        )}
                        <span className="text-[10px] font-black bg-gray-100 dark:bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">
                          {s.duration_minutes} min
                        </span>
                      </div>
                      {s.notes && <p className="text-xs text-gray-400 font-bold mt-0.5 truncate">{s.notes}</p>}
                    </div>
                    {['owner', 'manager'].includes(user?.role) && (
                      <button
                        onClick={() => handleDeleteSession(s.id)}
                        className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 text-gray-400 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── LOG SESSION MODAL ── */}
      {showPtModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Log PT Session</h2>
                <p className="text-xs text-gray-400 font-bold mt-0.5">{member.name}</p>
              </div>
              <button onClick={() => setShowPtModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLogSession} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Session Date</label>
                <input
                  type="date"
                  value={ptForm.session_date}
                  onChange={(e) => setPtForm({ ...ptForm, session_date: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Trainer</label>
                <select
                  value={ptForm.trainer_id}
                  onChange={(e) => setPtForm({ ...ptForm, trainer_id: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                >
                  <option value="">No trainer / Self</option>
                  {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Duration (minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="240"
                  value={ptForm.duration_minutes}
                  onChange={(e) => setPtForm({ ...ptForm, duration_minutes: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Notes</label>
                <textarea
                  value={ptForm.notes}
                  onChange={(e) => setPtForm({ ...ptForm, notes: e.target.value })}
                  rows={2}
                  placeholder="e.g. Chest & triceps, good form..."
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white resize-none"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowPtModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest">
                  Cancel
                </button>
                <button type="submit" disabled={savingPt} className="flex-1 py-3 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-60">
                  {savingPt ? 'Saving...' : 'Log Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RENEW MODAL ── */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Renew Membership</h2>
              <button onClick={() => setShowRenewModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleRenew} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Plan *</label>
                <select name="plan_id" required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white">
                  <option value="">Select plan</option>
                  {plans.map(p => <option key={p.id} value={p.id}>{p.name} — ₹{p.price}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Amount *</label>
                  <input name="amount" type="number" min="1" required placeholder="₹"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Mode *</label>
                  <select name="payment_mode" required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white">
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRenewModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-xs uppercase tracking-widest">Renew</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberDetail;
