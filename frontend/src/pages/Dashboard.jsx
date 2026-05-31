import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { financeAPI, membersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import {
  Users, UserPlus, TrendingUp, Clock,
  ChevronRight, Wallet, ClipboardList, Activity,
  Zap, MapPin, DollarSign, AlertTriangle, CheckCircle, RefreshCw
} from 'lucide-react';

const STATS = (summary) => [
  { label: "Today's Revenue", value: `₹${(summary?.todayRevenue  || 0).toLocaleString()}`, icon: TrendingUp, accent: '#10b981', bg: '#ecfdf5', link: '/finance'         },
  { label: 'Weekly Revenue',  value: `₹${(summary?.weekRevenue   || 0).toLocaleString()}`, icon: Activity,   accent: '#3b82f6', bg: '#eff6ff', link: '/reports'         },
  { label: 'MTD Revenue',     value: `₹${(summary?.monthRevenue  || 0).toLocaleString()}`, icon: DollarSign, accent: '#8b5cf6', bg: '#f5f3ff', link: '/reports'         },
  { label: "Today's Net",     value: `₹${(summary?.todayNet      || 0).toLocaleString()}`, icon: Wallet,     accent: '#f59e0b', bg: '#fffbeb', link: '/finance'         },
  { label: 'New Leads Today', value:   summary?.todayLeads   || 0,                          icon: UserPlus,   accent: '#ec4899', bg: '#fdf2f8', link: '/leads'           },
  { label: 'Weekly Leads',    value:   summary?.weekLeads    || 0,                          icon: Zap,        accent: '#f97316', bg: '#fff7ed', link: '/leads'           },
  { label: 'Active Members',  value:   summary?.activeMembers || 0,                         icon: Users,      accent: '#005c5b', bg: '#f0fdf9', link: '/members'         },
  { label: 'Follow-ups Due',  value:   summary?.followUpsDue  || 0,                         icon: Clock,      accent: '#ef4444', bg: '#fef2f2', link: '/manage-enquiry'  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [summary, setSummary]                 = useState(null);
  const [memberCategories, setMemberCategories] = useState({ plans: {}, gender: { male: 0, female: 0, other: 0 } });
  const [expiringMembers, setExpiringMembers] = useState([]);
  const [loading, setLoading]                 = useState(true);
  const branchId = searchParams.get('branch_id') || user?.branch_id;

  useEffect(() => { fetchDashboardData(); }, [branchId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [summaryRes, membersRes, expiringRes] = await Promise.all([
        financeAPI.getDashboardSummary(branchId),
        membersAPI.getAll({ branch_id: branchId }),
        membersAPI.getExpiring(7),
      ]);
      setSummary(summaryRes.data);
      const members = membersRes.data.members || [];
      const plansCount = {};
      const genderCount = { male: 0, female: 0, other: 0 };
      members.forEach(m => {
        const pName = m.plan_name || 'Unassigned';
        plansCount[pName] = (plansCount[pName] || 0) + 1;
        const g = (m.gender || 'other').toLowerCase();
        genderCount[g] !== undefined ? genderCount[g]++ : genderCount.other++;
      });
      setMemberCategories({ plans: plansCount, gender: genderCount });
      setExpiringMembers(expiringRes.data.members || []);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#005c5b]" />
      </div>
    );
  }

  const stats = STATS(summary);
  const totalGender = memberCategories.gender.male + memberCategories.gender.female + memberCategories.gender.other;

  return (
    <div className="flex flex-col gap-5 animate-fadeIn pb-8">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">
            Branch Dashboard
          </h1>
          <p className="text-xs text-gray-400 font-bold mt-1">{summary?.branchName || 'All Branches'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchDashboardData}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-[#005c5b]"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 bg-[#005c5b]/5 border border-[#005c5b]/20 px-3 py-2 rounded-xl">
            <MapPin className="w-3.5 h-3.5 text-[#005c5b]" />
            <span className="text-[11px] font-black text-[#005c5b] uppercase tracking-widest">
              {summary?.branchName || 'My Gym'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 8 Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(s.link)}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all group"
              style={{ borderTop: `3px solid ${s.accent}` }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-xl" style={{ background: s.bg }}>
                    <Icon className="w-4 h-4" style={{ color: s.accent }} />
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-xl font-black" style={{ color: s.accent }}>{s.value}</p>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3 Bottom Panels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Plan Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
             style={{ borderTop: '3px solid #005c5b' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[#005c5b]/10">
                <ClipboardList className="w-3.5 h-3.5 text-[#005c5b]" />
              </div>
              <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Plan Distribution</h3>
            </div>
            <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
              {Object.values(memberCategories.plans).reduce((a, b) => a + b, 0)} total
            </span>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700/50 flex-1">
            {Object.entries(memberCategories.plans).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="w-8 h-8 text-gray-200 dark:text-gray-600 mb-2" />
                <p className="text-xs font-black text-gray-300 dark:text-gray-500 uppercase tracking-widest">No members yet</p>
              </div>
            ) : Object.entries(memberCategories.plans).map(([plan, count], _i, arr) => {
              const maxCount = Math.max(...arr.map(([, c]) => c));
              const pct = Math.round((count / maxCount) * 100);
              return (
                <div key={plan} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{plan}</p>
                    <div className="mt-1.5 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-[#005c5b] rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-black text-[#005c5b] dark:text-[#01a2a1] shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Member Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
             style={{ borderTop: '3px solid #8b5cf6' }}>
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="p-1.5 rounded-lg bg-violet-50 dark:bg-violet-900/20">
              <Users className="w-3.5 h-3.5 text-violet-500" />
            </div>
            <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Member Stats</h3>
          </div>

          <div className="p-5 space-y-5 flex-1">
            {/* Gender */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">By Gender</p>
              <div className="space-y-3">
                {[
                  { label: 'Male',   count: memberCategories.gender.male,   color: '#3b82f6', bg: '#eff6ff' },
                  { label: 'Female', count: memberCategories.gender.female, color: '#ec4899', bg: '#fdf2f8' },
                  { label: 'Other',  count: memberCategories.gender.other,  color: '#9ca3af', bg: '#f9fafb' },
                ].map(({ label, count, color }) => {
                  const pct = totalGender > 0 ? Math.round((count / totalGender) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{label}</span>
                        </div>
                        <span className="text-xs font-black" style={{ color }}>
                          {count} <span className="text-gray-300 font-normal text-[10px]">({pct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden border border-gray-200 dark:border-gray-600">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status grid */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">By Status</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Active',     value: summary?.activeMembers || 0, color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
                  { label: 'Expiring',   value: expiringMembers.length || 0, color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
                  { label: 'Follow-ups', value: summary?.followUpsDue  || 0, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
                  { label: 'SLA Breach', value: summary?.slaBreached   || 0, color: '#dc2626', bg: '#fff1f2', border: '#fecdd3' },
                ].map(s => (
                  <div key={s.label}
                    className="rounded-xl p-3 text-center border"
                    style={{ background: s.bg, borderColor: s.border }}>
                    <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
             style={{ borderTop: '3px solid #f59e0b' }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <h3 className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-widest">Expiring in 7 Days</h3>
            </div>
            {expiringMembers.length > 0 && (
              <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-700">
                {expiringMembers.length} members
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
            {expiringMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 flex items-center justify-center mb-3">
                  <CheckCircle className="w-7 h-7 text-emerald-500" />
                </div>
                <p className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">All Clear!</p>
                <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-1">No memberships expiring soon</p>
              </div>
            ) : expiringMembers.map(m => {
              const daysLeft = Math.ceil((new Date(m.plan_end_date) - new Date()) / (1000 * 60 * 60 * 24));
              const urgent = daysLeft <= 3;
              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/members/${m.id}`)}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 cursor-pointer group transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-[#005c5b]/10 border border-[#005c5b]/20 flex items-center justify-center text-[#005c5b] font-black text-sm shrink-0">
                    {m.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">{m.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{m.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                      urgent
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}>
                      {daysLeft}d
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1 truncate max-w-[80px]">{m.plan_name || '—'}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-amber-500 transition-colors shrink-0" />
                </div>
              );
            })}
          </div>

          {expiringMembers.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
              <button
                onClick={() => navigate('/members')}
                className="w-full text-[10px] font-black uppercase tracking-widest text-[#005c5b] hover:text-[#004746] transition-colors"
              >
                View All Members →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Check-in FAB */}
      <button
        onClick={() => navigate('/attendance')}
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 bg-[#005c5b] hover:bg-[#004746] text-white rounded-2xl shadow-xl shadow-[#005c5b]/30 transition-all hover:scale-105 active:scale-95 z-[60] font-black text-xs uppercase tracking-widest border border-[#004746]"
      >
        <ClipboardList className="w-4 h-4" />
        Quick Check-in
      </button>
    </div>
  );
};

export default Dashboard;
