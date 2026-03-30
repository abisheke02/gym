import { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar,
  Search,
  CheckCircle,
  XCircle,
  MoreVertical,
  Filter,
  Users,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const Attendance = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Staff');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const handleDateChange = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-6 animate-fadeIn min-h-screen pb-24 dark:bg-[#0a0a0a]">
      {/* Header (Screenshot 4 style) */}
      <div className="bg-[#005c5b] text-white -mx-4 -mt-4 p-5 sticky top-0 z-[60] shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                <ChevronLeft className="w-6 h-6" />
             </button>
             <div>
                <h1 className="text-xl font-black uppercase tracking-tight leading-none">Record Attendance</h1>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mt-1">Daily Log System</p>
             </div>
          </div>
          <button className="p-2 hover:bg-white/10 rounded-full">
             <MoreVertical className="w-6 h-6" />
          </button>
        </div>

        {/* Attendance/Report Tabs (Screenshot 4) */}
        <div className="flex border-b border-white/10 px-4 -mx-4 gap-8">
           <button className="pb-3 border-b-4 border-white font-black text-[11px] tracking-[0.2em] uppercase">
              Attendance
           </button>
           <button onClick={() => navigate('/reports')} className="pb-3 text-white/40 font-black text-[11px] tracking-[0.2em] uppercase hover:text-white transition-all">
              Analytics
           </button>
        </div>
      </div>

      {/* Staff/Members Switch (Screenshot 4) */}
      <div className="px-1 max-w-2xl mx-auto">
         <div className="flex bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 shadow-inner border border-gray-200 dark:border-gray-700">
            {['Staff', 'Members'].map(tab => (
               <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-700 text-[#005c5b] dark:text-[#01a2a1] shadow-xl scale-[1.02]' : 'text-gray-500'}`}
               >
                  {tab}
               </button>
            ))}
         </div>
      </div>

      {/* Date Navigation (Screenshot 4) */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 sticky top-[138px] z-50 border-y border-gray-50 dark:border-gray-800 shadow-sm transition-all duration-300">
         <button onClick={() => handleDateChange(-1)} className="p-3 text-[#005c5b] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl">
            <ChevronLeft className="w-6 h-6" />
         </button>
         <div className="text-center group cursor-pointer">
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-[0.4em] mb-1">Select Date</p>
            <h3 className="text-[#005c5b] dark:text-[#01a2a1] font-black text-2xl tracking-tighter flex items-center justify-center gap-4">
               <span className="text-sm opacity-20 hidden md:block">{formattedDate}</span>
               <span className="px-6 py-1 bg-[#005c5b]/5 rounded-xl">{formattedDate}</span>
               <span className="text-sm opacity-20 hidden md:block">{formattedDate}</span>
            </h3>
         </div>
         <button onClick={() => handleDateChange(1)} className="p-3 text-[#005c5b] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-2xl">
            <ChevronRight className="w-6 h-6" />
         </button>
      </div>

      {/* Search & Tool Bar */}
      <div className="px-4 max-w-4xl mx-auto space-y-6">
         <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#005c5b] transition-colors" />
            <input 
               type="text"
               placeholder={`Search for ${activeTab.toLowerCase()}...`}
               value={search}
               onChange={(e) => setSearch(e.target.value)}
               className="w-full pl-14 pr-4 py-5 bg-white dark:bg-gray-800 border-none rounded-[2rem] shadow-xl font-bold dark:text-white outline-none ring-2 ring-transparent focus:ring-[#005c5b] transition-all"
            />
         </div>

         {/* Multi-Filter Dashboard Card */}
         {activeTab === 'Members' && (
            <div className="gym-card bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] border-none shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-24 h-24 text-[#005c5b]" />
               </div>
               
               <div className="flex items-center justify-around mb-8 relative z-10">
                  <div className="text-center">
                     <p className="text-[10px] uppercase font-black text-gray-400 tracking-widest mb-1">Base</p>
                     <p className="text-3xl font-black text-gray-900 dark:text-white">42</p>
                  </div>
                  <div className="w-px h-10 bg-gray-100 dark:bg-gray-700"></div>
                  <div className="text-center">
                     <p className="text-[10px] uppercase font-black text-[#005c5b] tracking-widest mb-1">Present</p>
                     <p className="text-3xl font-black text-[#005c5b] dark:text-[#01a2a1]">24</p>
                  </div>
                  <div className="w-px h-10 bg-gray-100 dark:bg-gray-700"></div>
                  <div className="text-center">
                     <p className="text-[10px] uppercase font-black text-rose-500 tracking-widest mb-1">Absent</p>
                     <p className="text-3xl font-black text-rose-500">18</p>
                  </div>
               </div>
               
               <div className="flex bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-1.5 gap-2 relative z-10">
                  {[
                    {id: 'all', label: 'All Log', color: 'text-gray-500', count: 42},
                    {id: 'active', label: 'Active', color: 'text-emerald-500', count: 28},
                    {id: 'expired', label: 'Expired', color: 'text-rose-500', count: 14}
                  ].map(btn => (
                     <button 
                        key={btn.id}
                        onClick={() => setFilter(btn.id)}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === btn.id ? 'bg-[#005c5b] text-white shadow-lg' : btn.color}`}
                     >
                        {btn.label} ({btn.count})
                     </button>
                  ))}
               </div>
            </div>
         )}

         {/* Empty State / List */}
         <div className="bg-white dark:bg-gray-800 rounded-[3rem] shadow-2xl p-16 flex flex-col items-center justify-center text-center group border border-gray-50 dark:border-gray-700">
            <div className="w-32 h-32 bg-[#005c5b]/5 dark:bg-[#005c5b]/10 rounded-[3rem] flex items-center justify-center mb-8 group-hover:rotate-6 transition-all ring-1 ring-[#005c5b]/10">
                <Clock className="w-16 h-16 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">No Check-ins Logged</h3>
            <p className="text-sm font-bold text-gray-400 dark:text-gray-500 max-w-xs mx-auto mb-8 uppercase tracking-widest leading-loose">
               There are no attendance records for {activeTab} on {formattedDate}.
            </p>
            <button className="flex items-center gap-3 px-10 py-5 bg-[#005c5b] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#005c5b]/20 hover:scale-105 active:scale-95 transition-all">
               <Zap className="w-5 h-5" />
               Manual Entry
            </button>
         </div>
      </div>
    </div>
  );
};

export default Attendance;
