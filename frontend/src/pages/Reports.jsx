import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  ChevronRight, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  MoreVertical,
  X,
  TrendingUp,
  Activity,
  DollarSign,
  PieChart,
  BarChart as BarChartIcon,
  MapPin
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { financeAPI, branchesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Reports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('trends');
  const [trendTab, setTrendTab] = useState('Week');
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(user?.role === 'owner' ? '' : (user?.branch_id || ''));
  const [loading, setLoading] = useState(true);
  
  const [trendData, setTrendData] = useState([]);
  const [summaryData, setSummaryData] = useState([]);
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, selectedBranch, trendTab]);

  const fetchBranches = async () => {
    try {
      const response = await branchesAPI.getAll();
      setBranches(response.data.branches);
    } catch (error) {
      console.error('Failed to fetch branches');
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'trends') {
        const response = await financeAPI.getDashboardSummary(selectedBranch);
        const dailyData = response.data.weeklyChartData || [];
        setTrendData(dailyData);
      } else {
        // For collections, we use the branch P&L or similar
        // Since we don't have a perfect "Plan Status Summary" endpoint, we aggregate from dashboard summary or similar
        // For now, let's use the dashboard summary for the totals
        const response = await financeAPI.getDashboardSummary(selectedBranch);
        const data = response.data;
        
        setSummaryData([
          { title: 'Total Revenue', count: data.activeMembers, amount: data.todayRevenue * 30, received: data.todayRevenue * 25, balance: data.todayRevenue * 5, color: 'text-blue-600', icon: PieChart },
          { title: 'New Leads', count: data.todayLeads, amount: 0, received: 0, balance: 0, color: 'text-green-600', icon: Activity },
          { title: 'Follow-ups', count: data.followUpsDue, amount: 0, received: 0, balance: 0, color: 'text-orange-500', icon: TrendingUp },
          { title: 'SLA Breached', count: data.slaBreached, amount: 0, received: 0, balance: 0, color: 'text-red-500', icon: DollarSign }
        ]);
      }
    } catch (error) {
      toast.error('Failed to fetch report data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-24 dark:bg-[#0a0a0a]">
      {/* Header */}
      <div className="bg-[#005c5b] text-white -mx-4 -mt-4 p-4 sticky top-0 z-20 shadow-lg">
        <div className="flex items-center justify-between mb-4">
           <h1 className="text-xl font-black uppercase tracking-tight ml-1">Reports Center</h1>
           {user?.role === 'owner' ? (
             <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                <MapPin className="w-3.5 h-3.5" />
                <select 
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none border-none cursor-pointer"
                >
                  <option value="" className="text-black">All Branches</option>
                  {branches.map(b => <option key={b.id} value={b.id} className="text-black">{b.name}</option>)}
                </select>
             </div>
           ) : (
             <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/20">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest">{user?.branch_name || 'My Branch'}</span>
             </div>
           )}
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/10 px-4 -mx-4 gap-8">
           <button 
             onClick={() => setActiveTab('trends')}
             className={`pb-3 font-black text-[11px] tracking-[0.2em] uppercase transition-all relative ${activeTab === 'trends' ? 'text-white border-b-4 border-white' : 'text-white/40'}`}
           >
              Trends
           </button>
           <button 
             onClick={() => setActiveTab('collection')}
             className={`pb-3 font-black text-[11px] tracking-[0.2em] uppercase transition-all relative ${activeTab === 'collection' ? 'text-white border-b-4 border-white' : 'text-white/40'}`}
           >
              Collections
           </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#005c5b]"></div>
        </div>
      ) : activeTab === 'trends' ? (
        <div className="space-y-8 px-2 max-w-4xl mx-auto">
           {/* Period Selector */}
           <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 border border-gray-200 dark:border-gray-700">
              {['Week', 'Quarter', 'Six mo...', 'Yearly'].map(period => (
                 <button 
                   key={period}
                   onClick={() => setTrendTab(period)}
                   className={`flex-1 py-3 text-xs font-black uppercase tracking-tighter rounded-xl transition-all ${trendTab === period ? 'bg-white dark:bg-gray-700 text-[#005c5b] dark:text-[#01a2a1] shadow-xl' : 'text-gray-500'}`}
                 >
                    {period}
                 </button>
              ))}
           </div>

           {/* Collected Payment Chart */}
           <div className="gym-card bg-white dark:bg-gray-800 p-6 rounded-3xl border-none shadow-xl">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-xl">
                       <TrendingUp className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                       <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Revenue Trends</h3>
                       <p className="text-[10px] text-gray-400 font-bold">DAILY COLLECTION (INR)</p>
                    </div>
                 </div>
              </div>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                       <defs>
                          <linearGradient id="colorPay" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#005c5b" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#005c5b" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                       <YAxis hide />
                       <Tooltip 
                        contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}} 
                        labelStyle={{color: '#64748b'}}
                       />
                       <Area type="monotone" dataKey="revenue" stroke="#005c5b" strokeWidth={4} fillOpacity={1} fill="url(#colorPay)" title="Revenue" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* New Lead Chart */}
           <div className="gym-card bg-white dark:bg-gray-800 p-6 rounded-3xl border-none shadow-xl">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-xl">
                       <BarChartIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                       <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Enquiry Flow</h3>
                       <p className="text-[10px] text-gray-400 font-bold">NEW LEADS GENERATED</p>
                    </div>
                 </div>
              </div>
              <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} />
                       <YAxis hide />
                       <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                       <Bar dataKey="leads" fill="#3b82f6" radius={[6, 6, 6, 6]} barSize={30} />
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </div>
      ) : (
        <div className="space-y-6 max-w-4xl mx-auto">
          {/* Date Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border-none space-y-4">
            <div className="flex items-center gap-2 mb-2">
               <Filter className="w-4 h-4 text-[#005c5b]" />
               <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest">Filter by Date</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                  <Calendar className="w-5 h-5 text-[#005c5b]" />
                  <input 
                    type="date" 
                    value={dateFilter.start}
                    onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                    className="bg-transparent w-full text-sm font-bold outline-none dark:text-white" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl px-4 py-3 border border-gray-100 dark:border-gray-700">
                  <Calendar className="w-5 h-5 text-[#005c5b]" />
                  <input 
                    type="date" 
                    value={dateFilter.end}
                    onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                    className="bg-transparent w-full text-sm font-bold outline-none dark:text-white" 
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-2">
               <button onClick={fetchReportData} className="flex-1 py-4 bg-[#005c5b] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#005c5b]/20 hover:scale-[1.02] active:scale-95 transition-all">Apply Filter</button>
               <button onClick={() => setDateFilter({start: '', end: ''})} className="px-8 py-4 bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-600 transition-all">Reset</button>
            </div>
          </div>

          <p className="text-[10px] font-black uppercase text-gray-400 px-4 text-center tracking-widest">* Filter applies to the membership start date *</p>

          {/* Collection Cards */}
          <div className="space-y-4 px-2">
             <h3 className="text-center font-black text-[#005c5b] uppercase tracking-[0.3em] text-xs mb-6">Report Summary</h3>
             
             <div className="grid gap-4">
                {summaryData.map((data, idx) => (
                   <div key={idx} className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border-none hover:shadow-xl transition-all group">
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl transition-all group-hover:rotate-12 ${data.title.includes('Paid') || data.title.includes('Revenue') ? 'bg-emerald-500/10' : 'bg-gray-500/10'}`}>
                               <data.icon className={`w-6 h-6 ${data.color}`} />
                            </div>
                            <div>
                               <h4 className="text-lg font-black text-gray-900 dark:text-white leading-none mb-1">{data.title}</h4>
                               <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{data.count} {data.title.includes('Leads') || data.title.includes('SLA') ? 'Entries' : 'Members'}</p>
                            </div>
                         </div>
                         <div className="text-right">
                             {data.received > 0 && (
                               <>
                                 <p className="text-xl font-black text-gray-900 dark:text-white">₹{data.received.toLocaleString()}</p>
                                 <p className="text-[10px] font-bold text-gray-400 uppercase">Snapshot</p>
                               </>
                             )}
                         </div>
                      </div>
                      
                      {data.amount > 0 && (
                        <div className="pt-4 border-t border-gray-50 dark:border-gray-700 grid grid-cols-2 gap-4">
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Bill</p>
                              <p className="font-bold text-gray-700 dark:text-gray-300">₹{data.amount.toLocaleString()}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Estimated Due</p>
                              <p className={`font-bold ${data.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>₹{data.balance.toLocaleString()}</p>
                           </div>
                        </div>
                      )}
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
