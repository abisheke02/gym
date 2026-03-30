import { useState } from 'react';
import { 
  Fingerprint, 
  QrCode, 
  UserCog, 
  Receipt, 
  MapPin, 
  Languages, 
  Banknote, 
  MessageCircle, 
  HelpCircle, 
  Info,
  ChevronRight,
  ChevronLeft,
  Camera,
  Edit2,
  AlertCircle,
  CreditCard,
  Users,
  Layout as LayoutIcon,
  Layers,
  MessageSquare,
  Bell,
  Activity,
  Sun,
  Moon,
  Smartphone,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Gym = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const MenuItem = ({ icon: Icon, label, onClick, subtext, count, color = "bg-[#005c5b]" }) => (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 first:rounded-t-2xl last:rounded-b-2xl"
    >
      <div className="flex items-center gap-4">
        <div className={`p-2 ${color} rounded-full`}>
           <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-left">
           <p className="text-[15px] font-bold text-gray-800 dark:text-gray-200 tracking-tight">
             {label} {count !== undefined && `(${count})`}
           </p>
           {subtext && <p className="text-[11px] text-gray-400 font-bold uppercase">{subtext}</p>}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
    </button>
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-24">
      {/* Header */}
      <div className="bg-[#005c5b] text-white -mx-4 -mt-4 p-4 sticky top-0 z-20 flex items-center gap-4">
        <h1 className="text-xl font-bold ml-1">Gym</h1>
      </div>

      {/* Profile Card */}
      <div className="px-1">
         <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-700 relative group">
            <div className="flex items-start gap-6">
               <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-50 dark:border-gray-600">
                     <Users className="w-10 h-10 text-gray-300 dark:text-gray-500" />
                  </div>
                  <button className="absolute bottom-0 right-0 p-1.5 bg-[#005c5b] text-white rounded-full border-2 border-white dark:border-gray-800 shadow-md">
                     <Camera className="w-3.5 h-3.5" />
                  </button>
               </div>
               <div className="space-y-1 py-1">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">Ironman Fitness</h2>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-300">{user?.full_name}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{user?.email}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">+91 {user?.phone || '7094607869'}</p>
               </div>
               <button className="absolute top-4 right-4 p-2 bg-[#f0f9f9] dark:bg-[#005c5b]/10 text-[#005c5b] rounded-full hover:bg-[#e0f2f2] transition-colors border border-[#005c5b]/10 shadow-sm">
                  <Edit2 className="w-3.5 h-3.5" />
               </button>
            </div>
         </div>
      </div>

      {/* Subscription Status */}
      <div className="px-1">
         <button className="w-full bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            <div className="flex items-center gap-4">
               <div className="p-2 bg-orange-500 rounded-xl">
                  <AlertCircle className="w-6 h-6 text-white" />
               </div>
               <div className="text-left">
                  <h3 className="text-[15px] font-black text-gray-900 dark:text-white">Subscription Expired</h3>
                  <p className="text-xs font-bold text-gray-400">Expires on 22 Mar 2026</p>
               </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 dark:text-gray-600" />
         </button>
      </div>

      {/* Business Controls Section (Unique Styling) */}
      <div className="space-y-4">
        <h3 className="px-5 text-sm font-black text-gray-400 uppercase tracking-widest leading-none">Business Configuration</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mx-1">
          <MenuItem icon={LayoutIcon} label="Dashboard Settings" color="bg-blue-600" subtext="Layout & Widgets" />
          <MenuItem icon={Smartphone} label="Manage Devices" color="bg-purple-600" onClick={() => navigate('/manage-devices')} subtext="Active Sessions" />
          <MenuItem icon={ShieldCheck} label="Biometric Access" color="bg-indigo-600" subtext="Security controls" />
        </div>
      </div>

      {/* Manage Plans Section */}
      <div className="space-y-4">
        <h3 className="px-5 text-sm font-black text-gray-400 uppercase tracking-widest leading-none">Product Management</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mx-1">
          <MenuItem icon={CreditCard} label="Membership Plans" count={0} onClick={() => navigate('/plans')} color="bg-emerald-600" />
          <MenuItem icon={UserCog} label="Personal Training" count={0} color="bg-cyan-600" />
          <MenuItem icon={Layers} label="Gym Services" count={0} color="bg-teal-600" />
          <MenuItem icon={Zap} label="Batch Management" color="bg-amber-600" />
        </div>
      </div>

      {/* Gym Settings Section */}
      <div className="space-y-4">
        <h3 className="px-5 text-sm font-black text-gray-400 uppercase tracking-widest leading-none">Communication</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mx-1">
          <MenuItem icon={MessageSquare} label="WhatsApp Template" color="bg-green-600" />
          <MenuItem icon={Bell} label="Auto Reminders" color="bg-rose-600" />
        </div>
      </div>

      {/* App Preferences */}
      <div className="space-y-4">
        <h3 className="px-5 text-sm font-black text-gray-400 uppercase tracking-widest leading-none">App Preferences</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mx-1">
          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center gap-4">
               <div className={`p-2 ${isDarkMode ? 'bg-indigo-600' : 'bg-amber-500'} rounded-full transition-colors`}>
                  {isDarkMode ? <Moon className="w-5 h-5 text-white" /> : <Sun className="w-5 h-5 text-white" />}
               </div>
               <div className="text-left py-1">
                  <p className="text-[15px] font-bold text-gray-800 dark:text-gray-200">
                     App Appearance
                  </p>
                  <p className="text-[11px] text-gray-400 font-black uppercase tracking-tighter">Current: {isDarkMode ? 'Dark' : 'Light'} Mode</p>
               </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors ${isDarkMode ? 'bg-[#005c5b]' : 'bg-gray-200'}`}>
               <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isDarkMode ? 'left-7' : 'left-1'}`} />
            </div>
          </button>
          <MenuItem icon={Languages} label="Language Settings" subtext="English | Hindi" color="bg-gray-500" />
          <MenuItem icon={Banknote} label="Currency Settings" subtext="INR (₹)" color="bg-gray-500" />
        </div>
      </div>

      {/* Support Section */}
      <div className="space-y-4 pb-12">
        <h3 className="px-5 text-sm font-black text-gray-400 uppercase tracking-widest leading-none">Support & Info</h3>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mx-1">
          <MenuItem icon={MessageCircle} label="Contact Support" onClick={() => navigate('/help')} color="bg-[#005c5b]" />
          <MenuItem icon={HelpCircle} label="Help Center" onClick={() => navigate('/help')} color="bg-[#005c5b]" />
          <MenuItem icon={Info} label="About GymBook" color="bg-[#005c5b]" />
        </div>
      </div>
    </div>
  );
};

export default Gym;
