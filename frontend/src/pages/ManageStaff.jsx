import { useState, useEffect } from 'react';
import { staffAPI, branchesAPI } from '../services/api';
import {
  Users, Plus, Edit2, Trash2, Key, X, Eye, EyeOff,
  CheckCircle, XCircle, Search, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'manager',     label: 'Branch Manager',    desc: 'Manage members, leads, trainers' },
  { value: 'receptionist',label: 'Front Office',      desc: 'View members, check-in/out, leads' },
  { value: 'sales',       label: 'Sales Staff',       desc: 'Manage leads, create members' },
  { value: 'accountant',  label: 'Accountant',        desc: 'View finance, payments, reports' },
];

const ROLE_COLORS = {
  manager:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  receptionist: 'bg-green-500/10 text-green-400 border-green-500/20',
  sales:        'bg-purple-500/10 text-purple-400 border-purple-500/20',
  accountant:   'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

const emptyForm = { full_name: '', email: '', password: '', phone: '', role: 'receptionist', branch_id: '' };

const ManageStaff = () => {
  const [staff, setStaff]           = useState([]);
  const [branches, setBranches]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal]   = useState(false);
  const [editingStaff, setEditingStaff] = useState(null); // null = create mode
  const [pwModal, setPwModal]       = useState(null); // staff object
  const [form, setForm]             = useState(emptyForm);
  const [newPw, setNewPw]           = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffRes, branchRes] = await Promise.all([
        staffAPI.getAll(),
        branchesAPI.getAll(),
      ]);
      setStaff(staffRes.data.staff || []);
      setBranches(branchRes.data.branches || []);
    } catch {
      toast.error('Failed to load staff data');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingStaff(null);
    setForm(emptyForm);
    setShowPw(false);
    setShowModal(true);
  };

  const openEdit = (member) => {
    setEditingStaff(member);
    setForm({
      full_name: member.full_name,
      email: member.email,
      password: '',
      phone: member.phone || '',
      role: member.role,
      branch_id: member.branch_id || '',
    });
    setShowPw(false);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingStaff) {
        const { password, email, ...updateData } = form;
        await staffAPI.update(editingStaff.id, updateData);
        toast.success('Staff updated');
      } else {
        await staffAPI.create(form);
        toast.success(`Account created for ${form.full_name}`);
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPw = async (e) => {
    e.preventDefault();
    if (newPw.length < 6) { toast.error('Minimum 6 characters'); return; }
    setSaving(true);
    try {
      await staffAPI.resetPassword(pwModal.id, newPw);
      toast.success(`Password reset for ${pwModal.full_name}`);
      setPwModal(null);
      setNewPw('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (member) => {
    if (!window.confirm(`Deactivate "${member.full_name}"? They will no longer be able to log in.`)) return;
    try {
      await staffAPI.deactivate(member.id);
      toast.success(`${member.full_name} deactivated`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to deactivate');
    }
  };

  const handleReactivate = async (member) => {
    try {
      await staffAPI.reactivate(member.id);
      toast.success(`${member.full_name} reactivated`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reactivate');
    }
  };

  const filtered = staff.filter(s => {
    if (!showInactive && !s.is_active) return false;
    return (
      !search ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.branch_name?.toLowerCase().includes(search.toLowerCase())
    );
  });
  const inactiveCount = staff.filter(s => !s.is_active).length;

  // Group by branch
  const grouped = filtered.reduce((acc, s) => {
    const key = s.branch_name || 'No Branch Assigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fadeIn pb-24 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Manage Staff
          </h1>
          <p className="text-xs text-gray-400 font-bold mt-0.5">
            Create and manage branch logins — {staff.length} accounts total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#005c5b]/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Staff
        </button>
      </div>

      {/* Role Guide */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ROLES.map(r => (
          <div key={r.value} className={`p-3 rounded-2xl border ${ROLE_COLORS[r.value]} bg-opacity-10`}>
            <p className="text-xs font-black uppercase tracking-widest mb-0.5">{r.label}</p>
            <p className="text-[10px] opacity-70">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* Search + inactive toggle */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or branch..."
            className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-[#005c5b] dark:text-white shadow-sm"
          />
        </div>
        {inactiveCount > 0 && (
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={`px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shrink-0 ${
              showInactive
                ? 'bg-rose-500 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700'
            }`}
          >
            {showInactive ? `Hide Inactive (${inactiveCount})` : `Show Inactive (${inactiveCount})`}
          </button>
        )}
      </div>

      {/* No branches warning */}
      {branches.length === 0 && !loading && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-amber-500 text-lg">⚠️</span>
          <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
            No branches found. Create branches first in the <strong>Branches</strong> section so you can assign staff to specific branches.
          </p>
        </div>
      )}

      {/* Staff List grouped by branch */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#005c5b]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-12 text-center shadow-sm">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-sm font-black uppercase text-gray-400 tracking-widest">No staff accounts yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Staff" to create the first branch login</p>
        </div>
      ) : (
        Object.entries(grouped).map(([branchName, members]) => (
          <div key={branchName} className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 px-5 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <Building2 className="w-4 h-4 text-[#005c5b]" />
              <span className="text-xs font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">
                {branchName}
              </span>
              <span className="ml-auto text-[10px] text-gray-400 font-black">{members.length} staff</span>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {members.map(s => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="w-9 h-9 rounded-xl bg-[#005c5b]/10 flex items-center justify-center text-[#005c5b] font-black text-sm shrink-0">
                    {s.full_name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-black text-sm text-gray-900 dark:text-white truncate">{s.full_name}</p>
                      {!s.is_active && (
                        <span className="text-[9px] font-black uppercase bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-bold truncate">{s.email}</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border hidden md:block ${ROLE_COLORS[s.role]}`}>
                    {ROLES.find(r => r.value === s.role)?.label || s.role}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openEdit(s)}
                      title="Edit"
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-amber-500 hover:text-white text-gray-500 dark:text-gray-300 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => { setPwModal(s); setNewPw(''); setShowPw(false); }}
                      title="Reset Password"
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-blue-500 hover:text-white text-gray-500 dark:text-gray-300 transition-all"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>
                    {s.is_active ? (
                      <button
                        onClick={() => handleDeactivate(s)}
                        title="Deactivate"
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-rose-500 hover:text-white text-gray-500 dark:text-gray-300 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(s)}
                        title="Reactivate"
                        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-green-500 hover:text-white text-gray-500 dark:text-gray-300 transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                {editingStaff ? 'Edit Staff' : 'Add Staff Account'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Full Name *</label>
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    required
                    placeholder="e.g. Priya Sharma"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    disabled={!!editingStaff}
                    placeholder="staff@yourgym.com"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white disabled:opacity-50"
                  />
                </div>
                {!editingStaff && (
                  <div className="col-span-2">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Password *</label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                        minLength={6}
                        placeholder="Min. 6 characters"
                        className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="10-digit number"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                  >
                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">Assigned Branch</label>
                  <select
                    value={form.branch_id}
                    onChange={(e) => setForm({ ...form, branch_id: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                  >
                    <option value="">No specific branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingStaff ? 'Update' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {pwModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Reset Password</h2>
                <p className="text-xs text-gray-400 font-bold mt-0.5">{pwModal.full_name} · {pwModal.email}</p>
              </div>
              <button onClick={() => setPwModal(null)} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleResetPw} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5">New Password</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-gray-900/50 border-2 border-transparent focus:border-[#005c5b] rounded-xl text-sm font-bold outline-none dark:text-white"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPwModal(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-black text-xs uppercase tracking-widest">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-3 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl font-black text-xs uppercase tracking-widest disabled:opacity-60">
                  {saving ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStaff;
