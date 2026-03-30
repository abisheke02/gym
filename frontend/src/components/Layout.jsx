import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Users, 
  Building2, 
  LogOut,
  Menu,
  X,
  HelpCircle,
  Trash2,
  Download,
  CreditCard,
  Smartphone,
  PieChart,
  FileText,
  GitBranch,
  SmartphoneNfc,
  Share2,
  Trash,
  RefreshCw,
  Lock,
  Star,
  Info,
  Calendar,
  Settings,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { branchesAPI } from '../services/api';

const Layout = () => {
  const { user, logout } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchesExpanded, setBranchesExpanded] = useState(false);

  useEffect(() => {
    if (user?.role === 'owner' || user?.role === 'manager') {
      fetchBranches();
    }
  }, [user]);

  const fetchBranches = async () => {
    try {
      const response = await branchesAPI.getAll();
      setBranches(response.data.branches);
    } catch (error) {
      console.error('Failed to fetch branches');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuSections = [
    {
      title: 'Main Menu',
      items: [
        { path: '/dashboard', icon: PieChart, label: 'Dashboard' },
        { path: '/members', icon: Users, label: 'Member Directory' },
      ]
    },
    {
      title: 'Management Tools',
      items: [
        { path: '/branches', icon: GitBranch, label: 'Manage Gym Branch', roles: ['owner', 'manager'] },
        { path: '/trainers', icon: Users, label: 'Personal Trainers', roles: ['owner', 'manager'] },
        { path: '/manage-enquiry', icon: Info, label: 'Manage Enquiry' },
        { path: '/manage-expense', icon: CreditCard, label: 'Expenses', roles: ['owner', 'manager', 'accountant'] },
        { path: '/download-report', icon: Download, label: 'Member Report Download', roles: ['owner', 'manager'] },
        { path: '/deleted-members', icon: Trash2, label: 'Deleted Members', roles: ['owner', 'manager'] },
      ]
    },
    {
      title: 'Other Products',
      items: [
        { path: '#', icon: SmartphoneNfc, label: 'GymBook Android App' },
        { path: '#', icon: Share2, label: 'Refer And Earn' },
      ]
    },
    {
      title: 'GymBook Account',
      items: [
        { path: '/manage-devices', icon: Smartphone, label: 'Manage Devices', roles: ['owner', 'manager'] },
        { path: '#', icon: Trash, label: 'Delete Account' },
        { path: '#', icon: RefreshCw, label: 'Check for update' },
        { path: '/forgot-password', icon: Lock, label: 'Forget Password' },
        { path: '/help', icon: HelpCircle, label: 'Help & Support' },
      ]
    },
    {
      title: 'Support',
      items: [
        { path: '#', icon: Star, label: 'Rate on App Store' },
        { path: '#', icon: Info, label: 'Version 8.6.2' },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex transition-colors duration-300">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[90] w-72 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 
        transform transition-transform duration-300 ease-in-out overflow-y-auto shadow-2xl lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="bg-[#005c5b] p-6 pt-8 space-y-4">
          <div className="flex items-start justify-between">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white text-2xl font-black border border-white/20">
                   IF
                </div>
                <div className="text-white">
                   <h2 className="text-lg font-black tracking-tight truncate max-w-[140px]">Ironman Fitness</h2>
                   <p className="text-[10px] opacity-70 truncate max-w-[140px] font-black uppercase tracking-widest">{user?.role}</p>
                </div>
             </div>
             <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white transition-colors">
                <X className="w-6 h-6" />
             </button>
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full border border-white/20">
             <Calendar className="w-3.5 h-3.5 text-white" />
             <span className="text-[9px] text-white font-black uppercase tracking-widest">Expires: 22 Mar 2026</span>
          </div>
        </div>

        <nav className="p-4 py-8 space-y-8">
          {menuSections.map((section, sidx) => (
            <div key={sidx} className="space-y-4">
              <h3 className="px-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.filter(item => !item.roles || item.roles.includes(user?.role)).map((item, iidx) => {
                  if (item.label === 'Manage Gym Branch') {
                    return (
                      <div key={iidx} className="space-y-1">
                        <button
                          onClick={() => setBranchesExpanded(!branchesExpanded)}
                          className={`
                            flex items-center justify-between w-full px-4 py-3.5 rounded-xl transition-all duration-200 group
                            ${branchesExpanded ? 'bg-[#005c5b]/5 text-[#005c5b]' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}
                          `}
                        >
                          <div className="flex items-center gap-4">
                             <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                             <span className="text-[14px] font-bold tracking-tight">{item.label}</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 transition-transform ${branchesExpanded ? 'rotate-90' : ''}`} />
                        </button>
                        
                        {branchesExpanded && (
                          <div className="pl-12 space-y-1 animate-slideDown">
                            {branches.map(branch => (
                              <NavLink
                                key={branch.id}
                                to={`/dashboard?branch_id=${branch.id}`}
                                className="block py-2 text-[13px] font-medium text-gray-400 hover:text-[#005c5b] transition-colors truncate"
                              >
                                {branch.name}
                              </NavLink>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={iidx}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) => `
                        flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group
                        ${isActive 
                          ? 'bg-[#005c5b]/10 text-[#005c5b] dark:bg-[#005c5b]/20 dark:text-[#01a2a1]' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-4">
                         <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                         <span className="text-[14px] font-bold tracking-tight">{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 opacity-0 transition-opacity group-hover:opacity-100 ${item.path === '#' ? 'hidden' : ''}`} />
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Logout button */}
          <div className="pt-6 border-t border-gray-50 dark:border-gray-800">
             <button 
                onClick={handleLogout}
                className="flex items-center gap-4 px-4 py-3.5 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all font-black text-[14px] group"
             >
                <LogOut className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span>Logout Session</span>
             </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen bg-gray-50 dark:bg-[#0a0a0a]">
        {/* Top bar (Optional for mobile only when sidebar is closed) */}
        {!sidebarOpen && (
          <header className="lg:hidden bg-[#005c5b] text-white p-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
            <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-black tracking-tight">IRONMAN FITNESS</h1>
            <div className="w-10" />
          </header>
        )}
        
        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </main>

        {/* Bottom Tab Bar (Local Mobile) */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-around py-3 px-4 shadow-2xl z-[70] backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
          <NavLink to="/members">
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#005c5b] dark:text-[#01a2a1] scale-110' : 'text-gray-400'}`}>
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-[#005c5b]/10 text-[#005c5b] dark:bg-[#005c5b]/20 dark:text-[#01a2a1]' : 'text-gray-400'}`}>
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">Members</span>
              </div>
            )}
          </NavLink>
          
          <NavLink to="/dashboard">
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#005c5b] dark:text-[#01a2a1] scale-110' : 'text-gray-400'}`}>
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-[#005c5b]/10 text-[#005c5b] dark:bg-[#005c5b]/20 dark:text-[#01a2a1]' : 'text-gray-400'}`}>
                  <PieChart className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">Dash</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/reports">
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#005c5b] dark:text-[#01a2a1] scale-110' : 'text-gray-400'}`}>
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-[#005c5b]/10 text-[#005c5b] dark:bg-[#005c5b]/20 dark:text-[#01a2a1]' : 'text-gray-400'}`}>
                   <FileText className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">Reports</span>
              </div>
            )}
          </NavLink>

          <NavLink to="/gym">
            {({ isActive }) => (
              <div className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-[#005c5b] dark:text-[#01a2a1] scale-110' : 'text-gray-400'}`}>
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-[#005c5b]/10 text-[#005c5b] dark:bg-[#005c5b]/20 dark:text-[#01a2a1]' : 'text-gray-400'}`}>
                   <Building2 className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tighter">Gym</span>
              </div>
            )}
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default Layout;
