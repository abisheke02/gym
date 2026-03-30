import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { financeAPI, membersAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  UserPlus, 
  DollarSign, 
  TrendingUp, 
  Clock,
  AlertTriangle,
  Calendar,
  ChevronRight,
  Cake,
  FileText,
  Wallet,
  PiggyBank,
  ClipboardList,
  ChevronLeft,
  Activity,
  Zap,
  Star,
  MapPin
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = useState(null);
  const [memberCategories, setMemberCategories] = useState({ plans: {}, gender: { male: 0, female: 0, other: 0 }, branch: {} });
  const [loading, setLoading] = useState(true);
  
  const branchId = searchParams.get('branch_id') || user?.branch_id;

  useEffect(() => {
    fetchDashboardData();
  }, [branchId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const summaryRes = await financeAPI.getDashboardSummary(branchId);
      setSummary(summaryRes.data);

      // Fetch member categories
      const membersRes = await membersAPI.getAll({ branch_id: branchId });
      const members = membersRes.data.members || [];
      
      const plansCount = {};
      const genderCount = { male: 0, female: 0, other: 0 };
      const branchCount = {};
      
      members.forEach(m => {
        // Group by Plan
        if (m.plan_name) {
          plansCount[m.plan_name] = (plansCount[m.plan_name] || 0) + 1;
        } else {
          plansCount['Unassigned'] = (plansCount['Unassigned'] || 0) + 1;
        }
        
        // Group by Gender
        const gender = (m.gender || 'other').toLowerCase();
        if (genderCount[gender] !== undefined) {
          genderCount[gender] += 1;
        } else {
          genderCount.other += 1;
        }

        // Group by Branch
        const bname = m.branch_name || 'System Base';
        branchCount[bname] = (branchCount[bname] || 0) + 1;
      });
      
      setMemberCategories({ plans: plansCount, gender: genderCount, branch: branchCount });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const todayStr = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const thisMonthStr = new Date().toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005c5b]"></div>
      </div>
    );
  }

  const Card = ({ title, value, icon: Icon, color, prefix = '', onClick, variant = "default" }) => (
    <div 
      onClick={onClick}
      className={`gym-card relative group p-5 overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all cursor-pointer ${
        variant === 'vibrant' ? 'bg-[#005c5b] text-white shadow-[#005c5b]/20 hover:scale-[1.02]' : 'bg-white dark:bg-gray-800'
      }`}
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-2 rounded-xl scale-110 ${variant === 'vibrant' ? 'bg-white/20' : 'bg-gray-50 dark:bg-gray-700/50'}`}>
           <Icon className={`w-6 h-6 ${variant === 'vibrant' ? 'text-white' : 'text-gray-500Group-hover:text-gray-900 group-hover:rotate-6 transition-all'}`} />
        </div>
        <ChevronRight className={`w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all ${variant === 'vibrant' ? 'text-white' : 'text-gray-400'}`} />
      </div>
      <div className="relative z-10">
        <div className="flex items-baseline gap-1 mt-2">
           <span className={`text-[12px] font-black uppercase tracking-widest ${variant === 'vibrant' ? 'text-white/60' : 'text-gray-400'}`}>
              {prefix}
           </span>
           <span className={`text-4xl font-black ${variant === 'vibrant' ? 'text-white' : (color || 'text-[#005c5b] dark:text-[#01a2a1]')}`}>
             {value}
           </span>
        </div>
        <p className={`text-[11px] font-black uppercase tracking-[0.2em] mt-2 mb-1 ${variant === 'vibrant' ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
           {title}
        </p>
      </div>
      
      {/* Subtle BG Glow */}
      <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full opacity-10 group-hover:opacity-20 transition-opacity ${color === 'text-red-500' ? 'bg-red-500' : 'bg-emerald-500'}`} />
    </div>
  );

  return (
    <div className="space-y-10 animate-fadeIn pb-24 dark:bg-[#0a0a0a] max-w-7xl mx-auto">
      {/* Branch Header */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
         <div className="flex-1">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-2">
              Branch Dashboard
            </h1>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500">Real-time performance for {summary?.branchName || 'your branch'}.</p>
         </div>
         <div className="flex items-center gap-3 bg-[#005c5b]/10 px-4 py-2 rounded-2xl border border-[#005c5b]/20">
            <MapPin className="w-5 h-5 text-[#005c5b]" />
            <span className="text-sm font-black text-[#005c5b] uppercase tracking-widest">{summary?.branchName || 'Active Branch'}</span>
         </div>
      </div>

      {/* Primary Metrics: Revenue & Collections (1d, 1w, 1m) */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
           <h2 className="text-[12px] font-black tracking-[0.2em] text-[#005c5b] uppercase border-b-2 border-[#005c5b] h-6 flex items-center gap-2">
             <DollarSign className="w-3.5 h-3.5" /> Financial Performance
           </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card 
            title="Today Collection" 
            value={summary?.todayRevenue.toLocaleString() || '0'} 
            prefix="₹" 
            icon={TrendingUp} 
            color="text-emerald-500"
            onClick={() => navigate('/finance')} 
          />
          <Card 
            title="Weekly Revenue" 
            value={summary?.weekRevenue?.toLocaleString() || '0'} 
            prefix="₹" 
            icon={Activity} 
            color="text-emerald-400"
            onClick={() => navigate('/reports')} 
          />
          <Card 
            title="MTD Revenue" 
            value={summary?.monthRevenue?.toLocaleString() || '0'} 
            prefix="₹" 
            icon={DollarSign} 
            color="text-emerald-600 font-bold"
            onClick={() => navigate('/reports')} 
          />
          <Card 
            title="Net Daily" 
            value={summary?.todayNet?.toLocaleString() || '0'} 
            prefix="₹" 
            icon={Star} 
            color="text-amber-400" 
          />
        </div>
      </section>

      {/* Lead Management (1d, 1w, 1m) */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
           <h2 className="text-[12px] font-black tracking-[0.2em] text-[#005c5b] uppercase border-b-2 border-[#005c5b] h-6 flex items-center gap-2">
             <UserPlus className="w-3.5 h-3.5" /> Lead Management
           </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card 
            title="New Leads (1d)" 
            value={summary?.todayLeads || '0'} 
            icon={UserPlus} 
            color="text-purple-500"
            onClick={() => navigate('/leads')} 
          />
          <Card 
            title="Weekly Leads" 
            value={summary?.weekLeads || '0'} 
            icon={Zap} 
            color="text-purple-400"
            onClick={() => navigate('/leads')} 
          />
          <Card 
            title="Monthly Leads" 
            value={summary?.monthLeads || '0'} 
            icon={Users} 
            color="text-purple-600"
            onClick={() => navigate('/leads')} 
          />
          <Card 
            title="Follow-ups" 
            value={summary?.followUpsDue || '0'} 
            icon={Clock} 
            color="text-amber-500" 
            onClick={() => navigate('/manage-enquiry')}
          />
        </div>
      </section>

      {/* Demographics & Demographics */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
          {/* Branch Plan Types */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-[#005c5b]" /> Branch membership distribution
            </h3>
            {Object.entries(memberCategories.plans).map(([planName, count]) => (
              <div key={planName} className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 py-3 last:border-0">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{planName}</span>
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-[#005c5b] dark:text-[#01a2a1] rounded-lg font-black text-sm">{count} Clients</span>
              </div>
            ))}
          </div>

          {/* Branch Demographics */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-gray-700 h-fit">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-1">
              <Users className="w-5 h-5 text-purple-500" /> Member stats
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-center">
                <p className="text-[10px] font-black text-blue-500 uppercase">Male</p>
                <p className="text-3xl font-black text-blue-600">{memberCategories.gender.male}</p>
              </div>
              <div className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-2xl text-center">
                <p className="text-[10px] font-black text-pink-500 uppercase">Female</p>
                <p className="text-3xl font-black text-pink-600">{memberCategories.gender.female}</p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl text-center">
                <p className="text-[10px] font-black text-gray-500 uppercase">Other</p>
                <p className="text-3xl font-black text-gray-600">{memberCategories.gender.other}</p>
              </div>
            </div>
          </div>
      </section>

      {/* Action FAB */}
      <div className="fixed bottom-24 right-8 z-[60]">
        <button 
          onClick={() => navigate('/attendance')}
          className="flex items-center gap-3 px-8 py-5 bg-[#005c5b] hover:bg-[#004746] text-white rounded-3xl shadow-2xl shadow-[#005c5b]/40 transition-all hover:scale-105 active:scale-95 group"
        >
          <div className="bg-white/20 p-2 rounded-2xl group-hover:rotate-12 transition-transform">
             <ClipboardList className="w-6 h-6 text-white" />
          </div>
          <span className="font-black uppercase tracking-widest text-sm">Quick Check-in</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
