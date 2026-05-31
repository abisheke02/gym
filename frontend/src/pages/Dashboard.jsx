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

const StatCard = ({ label, value, icon: Icon, color, bg, link, navigate }) => (
  <div
    onClick={() => navigate(link)}
    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 cursor-pointer hover:shadow-lg transition-all group flex flex-col justify-between min-h-[110px]"
  >
    <div className="flex items-center justify-between">
      <div className={`p-2.5 rounded-xl ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all" />
    </div>
    <div className="mt-3">
      <p className={`text-2xl font-black ${color}`}>{value}</p>
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{label}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = useState(null);
  const [memberCategories, setMemberCategories] = useState({
    plans: {}, gender: { male: 0, female: 0, other: 0 }, branch: {}
  });
  const [expiringMembers, setExpiringMembers] = useState([]);
  const [loading, setLoading] = useState(true);

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
      toast.error('Failed to load dashboard data');
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

  const stats = [
    { label: "Today's Revenue",  value: `₹${(summary?.todayRevenue  || 0).toLocaleString()}`, icon: TrendingUp,  color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20', link: '/finance' },
    { label: 'Weekly Revenue',   value: `₹${(summary?.weekRevenue   || 0).toLocaleString()}`, icon: Activity,    color: 'text-blue-600',    bg: 'bg-blue-50 dark:bg-blue-900/20',       link: '/reports' },
    { label: 'MTD Revenue',      value: `₹${(summary?.monthRevenue  || 0).toLocaleString()}`, icon: DollarSign,  color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/20',   link: '/reports' },
    { label: 'Today Net',        value: `₹${(summary?.todayNet      || 0).toLocaleString()}`, icon: Wallet,      color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20',     link: '/finance' },
    { label: 'Leads Today',      value: summary?.todayLeads   || 0,                            icon: UserPlus,    color: 'text-pink-600',    bg: 'bg-pink-50 dark:bg-pink-900/20',       link: '/leads' },
    { label: 'Weekly Leads',     value: summary?.weekLeads    || 0,                            icon: Zap,         color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-900/20',   link: '/leads' },
    { label: 'Active Members',   value: summary?.activeMembers || 0,                           icon: Users,       color: 'text-[#005c5b]',   bg: 'bg-[#005c5b]/10',                      link: '/members' },
    { label: 'Follow-ups Due',   value: summary?.followUpsDue  || 0,                           icon: Clock,       color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20',         link: '/manage-enquiry' },
  ];

  return (
    <div className="h-full flex flex-col gap-5 animate-fadeIn pb-6">

      {/* ── Top Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Branch Dashboard
          </h1>
          <p className="text-xs text-gray-400 font-bold mt-0.5">{summary?.branchName || 'All Branches'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchDashboardData}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400 hover:text-[#005c5b]">
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 bg-[#005c5b]/10 px-3 py-1.5 rounded-xl border border-[#005c5b]/20">
            <MapPin className="w-3.5 h-3.5 text-[#005c5b]" />
            <span className="text-[11px] font-black text-[#005c5b] uppercase tracking-widest">
              {summary?.branchName || 'My Gym'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid (8 cards, 4-col) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <StatCard key={i} {...s} navigate={navigate} />
        ))}
      </div>

      {/* ── Main Content (3 columns) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1">

        {/* Plan Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
            <ClipboardList className="w-4 h-4 text-[#005c5b]" />
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Plan Distribution</h3>
            <span className="ml-auto text-[10px] font-black text-gray-300">
              {Object.values(memberCategories.plans).reduce((a,b)=>a+b,0)} members
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/40 sticky top-0">
                <tr>
                  <th className="px-5 py-2.5 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                  <th className="px-5 py-2.5 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Members</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {Object.entries(memberCategories.plans).length === 0 ? (
                  <tr><td colSpan={2} className="px-5 py-8 text-center text-gray-400 text-xs">No data yet</td></tr>
                ) : Object.entries(memberCategories.plans).map(([plan, count]) => (
                  <tr key={plan} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-5 py-3 font-bold text-gray-700 dark:text-gray-300">{plan}</td>
                    <td className="px-5 py-3 text-right font-black text-[#005c5b] dark:text-[#01a2a1]">{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Member Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
            <Users className="w-4 h-4 text-violet-500" />
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Member Stats</h3>
          </div>
          <div className="p-5 space-y-4 flex-1">
            {/* Gender breakdown */}
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">By Gender</p>
              <div className="space-y-2.5">
                {[
                  { label: 'Male',   count: memberCategories.gender.male,   color: 'bg-blue-500',  text: 'text-blue-600' },
                  { label: 'Female', count: memberCategories.gender.female, color: 'bg-pink-500',  text: 'text-pink-600' },
                  { label: 'Other',  count: memberCategories.gender.other,  color: 'bg-gray-400',  text: 'text-gray-500' },
                ].map(({ label, count, color, text }) => {
                  const total = memberCategories.gender.male + memberCategories.gender.female + memberCategories.gender.other;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-black ${text}`}>{label}</span>
                        <span className={`text-xs font-black ${text}`}>{count} <span className="text-gray-300 font-bold">({pct}%)</span></span>
                      </div>
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status breakdown */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">By Status</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Active',    value: summary?.activeMembers  || 0, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'Expiring',  value: expiringMembers.length || 0,  color: 'text-amber-600',   bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: 'Follow-ups',value: summary?.followUpsDue  || 0,  color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-900/20' },
                  { label: 'SLA Breach',value: summary?.slaBreached   || 0,  color: 'text-rose-600',    bg: 'bg-rose-50 dark:bg-rose-900/20' },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Expiring in 7 Days</h3>
            {expiringMembers.length > 0 && (
              <span className="ml-auto text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                {expiringMembers.length}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
            {expiringMembers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-5">
                <CheckCircle className="w-10 h-10 text-emerald-300 mb-3" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">All clear!</p>
                <p className="text-xs text-gray-300 mt-1">No memberships expiring in 7 days</p>
              </div>
            ) : expiringMembers.map(m => {
              const daysLeft = Math.ceil((new Date(m.plan_end_date) - new Date()) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/members/${m.id}`)}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#005c5b]/10 flex items-center justify-center text-[#005c5b] font-black text-sm shrink-0">
                    {m.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-gray-900 dark:text-white truncate">{m.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{m.phone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-black ${daysLeft <= 3 ? 'text-red-500' : 'text-amber-500'}`}>
                      {daysLeft}d left
                    </p>
                    <p className="text-[10px] text-gray-400">{m.plan_name || '—'}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500" />
                </div>
              );
            })}
          </div>
          {expiringMembers.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => navigate('/members')}
                className="w-full text-[10px] font-black uppercase tracking-widest text-[#005c5b] hover:underline"
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
        className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 bg-[#005c5b] hover:bg-[#004746] text-white rounded-2xl shadow-xl shadow-[#005c5b]/30 transition-all hover:scale-105 active:scale-95 z-[60] font-black text-xs uppercase tracking-widest"
      >
        <ClipboardList className="w-4 h-4" />
        Quick Check-in
      </button>
    </div>
  );
};

export default Dashboard;
