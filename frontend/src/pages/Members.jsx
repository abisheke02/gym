import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { membersAPI, branchesAPI, plansAPI, trainersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Search, Plus, Edit2, Users, Calendar,
  AlertTriangle, ChevronRight, CheckCircle,
  X, Zap, Trash2, Phone, DollarSign,
  LayoutGrid, List, UserCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_CONFIG = {
  active:    { label: 'Active',    color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', text: 'text-emerald-600' },
  expired:   { label: 'Expired',   color: '#ef4444', bg: '#fef2f2', border: '#fecaca', text: 'text-red-500'     },
  frozen:    { label: 'Frozen',    color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', text: 'text-blue-500'    },
  cancelled: { label: 'Cancelled', color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', text: 'text-gray-400'    },
};

const Members = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [activeFilter, setActiveFilter] = useState('all');
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

  const filter = {
    branch_id: effectiveBranchId,
    expiry: searchParams.get('expiry') || '',
  };

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


  const filteredMembers = members.filter(member => {
    const matchesSearch =
      member.name.toLowerCase().includes(search.toLowerCase()) ||
      member.phone.includes(search) ||
      (member.membership_id || '').toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter !== 'all' && member.status !== activeFilter) return false;
    if (filter.branch_id && member.branch_id !== filter.branch_id) return false;
    if (filter.expiry) {
      if (!member.plan_end_date) return false;
      const d = Math.ceil((new Date(member.plan_end_date) - new Date()) / 864e5);
      if (filter.expiry === 'week' && (d < 0 || d > 7)) return false;
    }
    return true;
  }).sort((a, b) =>
    new Date(b.created_at || 0) - new Date(a.created_at || 0)
  );

  const handleCheckIn = async (member) => {
    try {
      await membersAPI.checkIn(member.id);
      toast.success(`${member.name} checked in!`);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Check-in failed');
    }
  };

  const counts = {
    all:       members.length,
    active:    members.filter(m => m.status === 'active').length,
    expired:   members.filter(m => m.status === 'expired').length,
    frozen:    members.filter(m => m.status === 'frozen').length,
  };

  const FILTER_TABS = [
    { key: 'all',     label: 'All Members',  count: counts.all,     color: 'text-gray-600'    },
    { key: 'active',  label: 'Active',        count: counts.active,  color: 'text-emerald-600' },
    { key: 'expired', label: 'Expired',       count: counts.expired, color: 'text-red-500'     },
    { key: 'frozen',  label: 'Frozen',        count: counts.frozen,  color: 'text-blue-500'    },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fadeIn pb-24">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">
            Member Directory
          </h1>
          <p className="text-xs font-bold text-gray-400 mt-1">
            {counts.active} active · {counts.expired} expired · {members.length} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#005c5b]/20 transition-all"
        >
          <Plus className="w-4 h-4" /> New Admission
        </button>
      </div>

      {/* ── Quick stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active',  value: counts.active,  color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0', icon: CheckCircle },
          { label: 'Expired', value: counts.expired, color: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: AlertTriangle },
          { label: 'Total',   value: counts.all,     color: '#005c5b', bg: '#f0fdf9', border: '#99f6e4', icon: Users },
          { label: 'Frozen',  value: counts.frozen,  color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: Zap },
        ].map(s => (
          <div key={s.label}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 border flex items-center gap-3"
            style={{ borderColor: s.border, borderTopWidth: 3, borderTopColor: s.color }}>
            <div className="p-2.5 rounded-xl" style={{ background: s.bg }}>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Search + View Toggle ── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone or member ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold placeholder:text-gray-300 outline-none border-2 border-gray-200 dark:border-gray-700 focus:border-[#005c5b] transition-all dark:text-white"
          />
        </div>
        {/* View toggle */}
        <div className="flex bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-3 transition-all ${viewMode === 'grid' ? 'bg-[#005c5b] text-white' : 'text-gray-400 hover:text-[#005c5b]'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-3 transition-all ${viewMode === 'table' ? 'bg-[#005c5b] text-white' : 'text-gray-400 hover:text-[#005c5b]'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
              activeFilter === tab.key
                ? 'bg-[#005c5b] text-white border-[#005c5b] shadow-md'
                : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-[#005c5b]'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 ' + tab.color
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Member List ── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#005c5b]" />
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
          <Users className="w-12 h-12 text-gray-200 dark:text-gray-600 mb-3" />
          <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No Members Found</p>
          <p className="text-xs text-gray-300 mt-1">Try a different search or filter</p>
        </div>
      ) : viewMode === 'grid' ? (

        /* ── CARD GRID (EasyMembr style) ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredMembers.map(member => {
            const st = STATUS_CONFIG[member.status] || STATUS_CONFIG.active;
            const daysLeft = member.plan_end_date
              ? Math.ceil((new Date(member.plan_end_date) - new Date()) / 864e5)
              : null;
            const planPct = (member.duration_months && daysLeft !== null)
              ? Math.max(0, Math.min(100, Math.round((daysLeft / (member.duration_months * 30)) * 100)))
              : 0;
            const isCheckedInToday = member.last_check_in &&
              new Date(member.last_check_in).toDateString() === new Date().toDateString();

            return (
              <div
                key={member.id}
                className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all"
                style={{ borderTop: `3px solid ${st.color}` }}
              >
                {/* Card Header */}
                <div className="p-4 pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shrink-0 shadow-md"
                        style={{ background: `linear-gradient(135deg, ${st.color}, ${st.color}99)` }}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-gray-900 dark:text-white truncate leading-tight">
                          {member.name}
                        </p>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">
                          {member.membership_id ? `#${member.membership_id}` : 'No ID'}
                        </p>
                      </div>
                    </div>
                    {/* Status badge */}
                    <span
                      className="text-[9px] font-black uppercase px-2 py-1 rounded-lg shrink-0"
                      style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}
                    >
                      {st.label}
                    </span>
                  </div>

                  {/* Info row */}
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {member.phone}
                    </span>
                    {member.gender && (
                      <span className="capitalize font-bold">{member.gender.charAt(0).toUpperCase()}</span>
                    )}
                    {isCheckedInToday && (
                      <span className="flex items-center gap-1 text-emerald-500 font-black ml-auto">
                        <UserCheck className="w-3 h-3" /> In
                      </span>
                    )}
                  </div>

                  {/* Plan section */}
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-black text-gray-700 dark:text-gray-300 truncate">
                        {member.plan_name || 'No Plan'}
                      </span>
                      <span className="text-[11px] font-black" style={{ color: '#005c5b' }}>
                        ₹{(member.plan_price || 0).toLocaleString()}
                      </span>
                    </div>
                    {/* Days left bar */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${planPct}%`,
                            background: daysLeft !== null && daysLeft <= 7 ? '#ef4444'
                              : daysLeft !== null && daysLeft <= 30 ? '#f59e0b' : st.color
                          }}
                        />
                      </div>
                      <span className={`text-[10px] font-black shrink-0 ${
                        daysLeft === null ? 'text-gray-400'
                          : daysLeft <= 0 ? 'text-red-500'
                          : daysLeft <= 7 ? 'text-amber-500'
                          : 'text-gray-500'
                      }`}>
                        {daysLeft === null ? '—'
                          : daysLeft <= 0 ? 'Expired'
                          : `${daysLeft}d left`}
                      </span>
                    </div>
                    {member.plan_end_date && (
                      <p className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        Expires {new Date(member.plan_end_date).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Footer — Action buttons */}
                <div className="px-4 pb-4 flex items-center gap-2">
                  {/* Check-in */}
                  <button
                    onClick={() => handleCheckIn(member)}
                    disabled={isCheckedInToday}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
                    style={{
                      background: isCheckedInToday ? '#d1fae5' : '#005c5b',
                      color: isCheckedInToday ? '#059669' : 'white',
                      cursor: isCheckedInToday ? 'default' : 'pointer',
                    }}
                  >
                    {isCheckedInToday
                      ? <><CheckCircle className="w-3.5 h-3.5" /> Checked In</>
                      : <><UserCheck className="w-3.5 h-3.5" /> Check In</>
                    }
                  </button>
                  {/* Edit */}
                  <button
                    onClick={() => setEditingMember(member)}
                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-amber-500 hover:text-white text-gray-500 dark:text-gray-300 transition-all"
                    title="Edit"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {/* View */}
                  <Link
                    to={`/members/${member.id}`}
                    className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-[#005c5b] hover:text-white text-gray-500 dark:text-gray-300 transition-all"
                    title="View Details"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  {/* Delete (owner/manager only) */}
                  {['owner', 'manager'].includes(user?.role) && (
                    <button
                      onClick={() => handleDeleteMember(member)}
                      className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-rose-500 hover:text-white text-gray-500 dark:text-gray-300 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      ) : (
        /* ── TABLE VIEW ── */
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                  <th className="px-4 py-3 text-left">Member</th>
                  <th className="px-4 py-3 text-left">Phone</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Expiry</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredMembers.map(member => {
                  const st = STATUS_CONFIG[member.status] || STATUS_CONFIG.active;
                  const daysLeft = member.plan_end_date
                    ? Math.ceil((new Date(member.plan_end_date) - new Date()) / 864e5)
                    : null;
                  return (
                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                            style={{ background: st.color }}>
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 dark:text-white">{member.name}</p>
                            <p className="text-[10px] text-gray-400">{member.membership_id ? `#${member.membership_id}` : '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-bold">{member.phone}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-800 dark:text-gray-200">{member.plan_name || '—'}</p>
                        <p className="text-[10px] font-black text-[#005c5b]">₹{(member.plan_price || 0).toLocaleString()}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-600 dark:text-gray-400">
                          {member.plan_end_date ? new Date(member.plan_end_date).toLocaleDateString('en-IN') : '—'}
                        </p>
                        {daysLeft !== null && (
                          <p className={`text-[10px] font-black ${daysLeft <= 0 ? 'text-red-500' : daysLeft <= 7 ? 'text-amber-500' : 'text-gray-400'}`}>
                            {daysLeft <= 0 ? 'Expired' : `${daysLeft}d left`}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg"
                          style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                          {st.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setEditingMember(member)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-amber-500 hover:text-white text-gray-500 transition-all" title="Edit">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <Link to={`/members/${member.id}`} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-[#005c5b] hover:text-white text-gray-500 transition-all" title="View">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                          {['owner', 'manager'].includes(user?.role) && (
                            <button onClick={() => handleDeleteMember(member)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-rose-500 hover:text-white text-gray-500 transition-all" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
