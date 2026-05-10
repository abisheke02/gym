import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { financeAPI, membersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, UserPlus, TrendingUp, Clock,
  ChevronRight, Wallet, ClipboardList, Activity,
  Zap, MapPin, DollarSign
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = useState(null);
  const [memberCategories, setMemberCategories] = useState({ plans: {}, gender: { male: 0, female: 0, other: 0 }, branch: {} });
  const [loading, setLoading] = useState(true);

  const branchId = searchParams.get('branch_id') || user?.branch_id;

  useEffect(() => { fetchDashboardData(); }, [branchId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const summaryRes = await financeAPI.getDashboardSummary(branchId);
      setSummary(summaryRes.data);

      const membersRes = await membersAPI.getAll({ branch_id: branchId });
      const members = membersRes.data.members || [];

      const plansCount = {};
      const genderCount = { male: 0, female: 0, other: 0 };
      const branchCount = {};

      members.forEach(m => {
        const pName = m.plan_name || 'Unassigned';
        plansCount[pName] = (plansCount[pName] || 0) + 1;
        const g = (m.gender || 'other').toLowerCase();
        genderCount[g] !== undefined ? genderCount[g]++ : genderCount.other++;
        const bn = m.branch_name || 'System Base';
        branchCount[bn] = (branchCount[bn] || 0) + 1;
      });

      setMemberCategories({ plans: plansCount, gender: genderCount, branch: branchCount });
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#005c5b]" />
      </div>
    );
  }

  const stats = [
    { label: "Today's Revenue",  value: `₹${(summary?.todayRevenue || 0).toLocaleString()}`,  icon: TrendingUp,    color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', link: '/finance' },
    { label: 'Weekly Revenue',   value: `₹${(summary?.weekRevenue || 0).toLocaleString()}`,    icon: Activity,      color: 'text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20', link: '/reports' },
    { label: 'MTD Revenue',      value: `₹${(summary?.monthRevenue || 0).toLocaleString()}`,   icon: DollarSign,    color: 'text-green-600',   bg: 'bg-green-50  dark:bg-green-900/20',   link: '/reports' },
    { label: "Today Net",        value: `₹${(summary?.todayNet || 0).toLocaleString()}`,        icon: Wallet,        color: 'text-amber-500',   bg: 'bg-amber-50  dark:bg-amber-900/20',   link: '/finance' },
    { label: 'New Leads (Today)',value: summary?.todayLeads || 0,                               icon: UserPlus,      color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-900/20',  link: '/leads' },
    { label: 'Weekly Leads',     value: summary?.weekLeads || 0,                                icon: Zap,           color: 'text-purple-400',  bg: 'bg-purple-50 dark:bg-purple-900/20',  link: '/leads' },
    { label: 'Active Members',   value: summary?.activeMembers || 0,                            icon: Users,         color: 'text-blue-500',    bg: 'bg-blue-50   dark:bg-blue-900/20',    link: '/members' },
    { label: 'Follow-ups Due',   value: summary?.followUpsDue || 0,                             icon: Clock,         color: 'text-red-500',     bg: 'bg-red-50    dark:bg-red-900/20',     link: '/manage-enquiry' },
  ];

  return (
    <div className="space-y-4 animate-fadeIn pb-20 max-w-6xl">
      {/* Branch header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tight">
            Branch Dashboard
          </h1>
          <p className="text-xs text-gray-400 font-bold">
            {summary?.branchName || 'All Branches'}
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-[#005c5b]/10 px-3 py-1.5 rounded-lg border border-[#005c5b]/20">
          <MapPin className="w-3.5 h-3.5 text-[#005c5b]" />
          <span className="text-[11px] font-black text-[#005c5b] uppercase tracking-widest">
            {summary?.branchName || 'Active'}
          </span>
        </div>
      </div>

      {/* Stats grid — compact 4-col */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              onClick={() => navigate(s.link)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 cursor-pointer hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${s.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
                <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500 transition-colors" />
              </div>
              <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 leading-tight">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
            <ClipboardList className="w-3.5 h-3.5 text-[#005c5b]" />
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Plan Distribution</h3>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-4 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                <th className="px-4 py-2 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Members</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              {Object.entries(memberCategories.plans).length === 0 ? (
                <tr><td colSpan={2} className="px-4 py-4 text-center text-gray-400">No data</td></tr>
              ) : Object.entries(memberCategories.plans).map(([plan, count]) => (
                <tr key={plan} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-2 font-bold text-gray-700 dark:text-gray-300">{plan}</td>
                  <td className="px-4 py-2 text-right font-black text-[#005c5b] dark:text-[#01a2a1]">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Member Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
            <Users className="w-3.5 h-3.5 text-purple-500" />
            <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Member Stats</h3>
          </div>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 dark:bg-gray-900/40">
              <tr>
                <th className="px-4 py-2 text-left text-[9px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                <th className="px-4 py-2 text-right text-[9px] font-black text-gray-400 uppercase tracking-widest">Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-2 font-bold text-blue-600 dark:text-blue-400">Male</td>
                <td className="px-4 py-2 text-right font-black text-blue-600 dark:text-blue-400">{memberCategories.gender.male}</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-2 font-bold text-pink-600 dark:text-pink-400">Female</td>
                <td className="px-4 py-2 text-right font-black text-pink-600 dark:text-pink-400">{memberCategories.gender.female}</td>
              </tr>
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-2 font-bold text-gray-500">Other</td>
                <td className="px-4 py-2 text-right font-black text-gray-500">{memberCategories.gender.other}</td>
              </tr>
              {Object.entries(memberCategories.branch).map(([bn, count]) => (
                <tr key={bn} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-2 font-bold text-gray-600 dark:text-gray-300">{bn}</td>
                  <td className="px-4 py-2 text-right font-black text-[#005c5b] dark:text-[#01a2a1]">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Check-in FAB */}
      <button
        onClick={() => navigate('/attendance')}
        className="fixed bottom-20 right-5 flex items-center gap-2 px-5 py-2.5 bg-[#005c5b] hover:bg-[#004746] text-white rounded-xl shadow-xl shadow-[#005c5b]/30 transition-all hover:scale-105 active:scale-95 z-[60]"
      >
        <ClipboardList className="w-4 h-4" />
        <span className="font-black uppercase tracking-widest text-xs">Quick Check-in</span>
      </button>
    </div>
  );
};

export default Dashboard;
