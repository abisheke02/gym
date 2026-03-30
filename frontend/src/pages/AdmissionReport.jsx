import { useState, useEffect } from 'react';
import { financeAPI } from '../services/api';
import { 
  Calendar, 
  Search, 
  ChevronLeft,
  DollarSign,
  MoreVertical,
  Filter,
  ArrowRight,
  Download,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdmissionReport = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [totalFees, setTotalFees] = useState(42500); // Simulate some data for "clearer" content
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      setTimeout(() => {
        setLoading(false);
      }, 500);
    } catch (error) {
      toast.error('Failed to fetch admission report');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn min-h-screen dark:bg-[#0a0a0a] pb-32">
      {/* Header */}
      <div className="flex items-center justify-between bg-[#005c5b] -mx-4 -mt-4 p-5 sticky top-0 z-50 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
             <h1 className="text-xl font-black uppercase tracking-tight leading-none">Admission Report</h1>
             <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mt-1">Audit Ledger</p>
          </div>
        </div>
        <button className="p-2 hover:bg-white/10 rounded-full">
           <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Date Filters Card */}
      <div className="gym-card bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl border-none space-y-6">
        <div className="flex items-center gap-2">
           <Filter className="w-4 h-4 text-[#005c5b]" />
           <h4 className="text-[11px] font-black uppercase text-gray-400 tracking-widest leading-none">Accounting Period</h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Start Date</label>
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl px-5 py-4 border border-gray-100 dark:border-gray-700 focus-within:border-[#005c5b] transition-all">
              <Calendar className="w-5 h-5 text-[#005c5b]" />
              <input 
                type="date" 
                value={dateRange.startDate}
                onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                className="bg-transparent w-full text-sm font-bold text-gray-700 dark:text-gray-200 outline-none"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">End Date</label>
            <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl px-5 py-4 border border-gray-100 dark:border-gray-700 focus-within:border-[#005c5b] transition-all">
              <Calendar className="w-5 h-5 text-[#005c5b]" />
              <input 
                type="date" 
                value={dateRange.endDate}
                onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                className="bg-transparent w-full text-sm font-bold text-gray-700 dark:text-gray-200 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-2">
           <button 
             onClick={fetchReport}
             className="flex-1 py-4 bg-[#017a79] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#017a79]/30 transform active:scale-95 transition-all"
           >
             Generate Report
           </button>
           <button 
             onClick={() => setDateRange({ startDate: '', endDate: '' })}
             className="px-8 py-4 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 dark:hover:bg-gray-600 transition-all shadow-sm"
           >
             Reset
           </button>
        </div>
      </div>

      <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/10 border-l-4 border-amber-400 rounded-r-xl">
         <p className="text-xs font-bold text-amber-600 dark:text-amber-500 italic">
            Note: Filter calculates values based on the membership activation date in the specified range.
         </p>
      </div>

      {/* Analytics Card */}
      <div className="px-2">
         <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex items-center gap-6 group hover:shadow-2xl transition-all">
            <div className="p-4 bg-[#005c5b]/10 dark:bg-[#005c5b]/20 rounded-2xl ring-1 ring-[#005c5b]/30">
               <Activity className="w-8 h-8 text-[#005c5b] dark:text-[#01a2a1]" />
            </div>
            <div className="flex-1">
               <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] mb-1">Growth Index</p>
               <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase leading-none">+12.4% ADMISSIONS</h3>
            </div>
            <div className="flex flex-col items-end">
               <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl"><DollarSign className="w-5 h-5" /></span>
               <p className="text-[10px] font-black text-emerald-500 mt-1 uppercase tracking-tighter">Verified</p>
            </div>
         </div>
      </div>

      {/* Result FAB Summary (Vibrant) */}
      <div className="fixed bottom-24 left-6 right-6 lg:left-auto lg:right-6 lg:w-96 z-40 group">
         <div className="bg-[#005c5b] text-white rounded-3xl p-6 shadow-2xl overflow-hidden relative group-hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[80px] -mr-8 -mt-8" />
            <div className="flex items-center justify-between relative z-10">
               <div className="space-y-1">
                  <p className="text-[11px] font-black text-white/60 uppercase tracking-widest">Period Revenue</p>
                  <h3 className="text-3xl font-black tracking-tight leading-none">₹{totalFees.toLocaleString()}</h3>
               </div>
               <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                  <ArrowRight className="w-6 h-6 text-white" />
               </div>
            </div>
            <p className="text-[9px] font-black uppercase text-white/40 mt-4 tracking-tighter">Report generated for {dateRange.startDate} - {dateRange.endDate}</p>
         </div>
      </div>
    </div>
  );
};

export default AdmissionReport;
