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
  Lock,
  Info,
  Calendar,
  ChevronRight,
  BadgeCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { branchesAPI, subscriptionAPI } from '../services/api';

const Layout = () => {
  const { user, logout } = useAuth();
  useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchesExpanded, setBranchesExpanded] = useState(false);
  const [subStatus, setSubStatus] = useState('loading');

  useEffect(() => {
    if (user?.role === 'owner' || user?.role === 'manager') {
      fetchBranches();
    }
    if (user?.role === 'owner') {
      subscriptionAPI.getCurrent()
        .then(res => setSubStatus(res.data.subscription?.status === 'active' ? 'active' : 'expired'))
        .catch(() => setSubStatus('unknown'));
    } else {
      setSubStatus(null);
    }
  }, [user]);

  const fetchBranches = async () => {
    try {
      const response = await branchesAPI.getAll();
      setBranches(response.data.branches);
    } catch (error) {
      // branches unavailable — sidebar branch list will be empty
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
        { path: '/members', icon: Users, label: 'Members' },
        { path: '/attendance', icon: Calendar, label: 'Attendance' },
        { path: '/finance', icon: CreditCard, label: 'Finance', roles: ['owner', 'manager', 'accountant'] },
        { path: '/reports', icon: FileText, label: 'Reports', roles: ['owner', 'manager'] },
      ]
    },
    {
      title: 'Management',
      items: [
        { path: '/branches', icon: GitBranch, label: 'Branches', roles: ['owner', 'manager'] },
        { path: '/trainers', icon: Users, label: 'Trainers', roles: ['owner', 'manager'] },
        { path: '/manage-enquiry', icon: Info, label: 'Enquiry' },
        { path: '/manage-expense', icon: CreditCard, label: 'Expenses', roles: ['owner', 'manager', 'accountant'] },
        { path: '/download-report', icon: Download, label: 'Download Report', roles: ['owner', 'manager'] },
        { path: '/deleted-members', icon: Trash2, label: 'Deleted Members', roles: ['owner', 'manager'] },
      ]
    },
    {
      title: 'Platform',
      items: [
        { path: '/subscriptions', icon: BadgeCheck, label: 'Subscription', roles: ['owner'] },
        { path: '/manage-devices', icon: Smartphone, label: 'Devices', roles: ['owner', 'manager'] },
        { path: '/forgot-password', icon: Lock, label: 'Change Password' },
        { path: '/help', icon: HelpCircle, label: 'Help & Support' },
      ]
    },
  ];

  return (
    <div className="h-screen flex transition-colors duration-300 overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[90] w-52 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        transform transition-transform duration-300 ease-in-out overflow-y-auto shadow-2xl lg:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="bg-[#005c5b] px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white text-sm font-black border border-white/20">
                IF
              </div>
              <div className="text-white min-w-0">
                <h2 className="text-sm font-black tracking-tight truncate">Ironman Fitness</h2>
                <p className="text-[9px] opacity-70 font-black uppercase tracking-widest">{user?.role}</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          {subStatus && (
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border ${
              subStatus === 'active'
                ? 'bg-white/10 border-white/20'
                : subStatus === 'expired'
                ? 'bg-red-500/20 border-red-400/30'
                : 'bg-white/5 border-white/10'
            }`}>
              <Calendar className="w-2.5 h-2.5 text-white" />
              <span className="text-[8px] text-white font-black uppercase tracking-widest">
                Sub: {subStatus === 'loading' ? '...' : subStatus}
              </span>
            </div>
          )}
        </div>

        <nav className="p-2 py-4 space-y-4">
          {menuSections.map((section, sidx) => (
            <div key={sidx} className="space-y-0.5">
              <h3 className="px-3 pb-1 text-[9px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {section.title}
              </h3>
              {section.items.filter(item => !item.roles || item.roles.includes(user?.role)).map((item, iidx) => {
                if (item.label === 'Branches') {
                  return (
                    <div key={iidx}>
                      <button
                        onClick={() => setBranchesExpanded(!branchesExpanded)}
                        className={`flex items-center justify-between w-full px-3 py-2 rounded-lg transition-all group
                          ${branchesExpanded ? 'bg-[#005c5b]/5 text-[#005c5b]' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <item.icon className="w-3.5 h-3.5" />
                          <span className="text-[12px] font-bold">{item.label}</span>
                        </div>
                        <ChevronRight className={`w-3 h-3 transition-transform ${branchesExpanded ? 'rotate-90' : ''}`} />
                      </button>
                      {branchesExpanded && (
                        <div className="pl-8 space-y-0.5 pt-0.5">
                          {branches.map(branch => (
                            <NavLink
                              key={branch.id}
                              to={`/dashboard?branch_id=${branch.id}`}
                              className="block py-1.5 text-[11px] font-medium text-gray-400 hover:text-[#005c5b] transition-colors truncate"
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
                      flex items-center justify-between px-3 py-2 rounded-lg transition-all group
                      ${isActive
                        ? 'bg-[#005c5b]/10 text-[#005c5b] dark:bg-[#005c5b]/20 dark:text-[#01a2a1]'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}
                    `}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-[12px] font-bold truncate">{item.label}</span>
                    </div>
                    {item.path !== '#' && (
                      <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-60 shrink-0" />
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}

          {/* Logout */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all font-black text-[12px] group"
            >
              <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">
        {!sidebarOpen && (
          <header className="lg:hidden bg-[#005c5b] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-lg">
            <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-white/10">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-black tracking-tight">IRONMAN FITNESS</h1>
            <div className="w-8" />
          </header>
        )}

        {/* Page content */}
        <main className="flex-1 p-3 lg:p-5 overflow-y-auto">
          <div className="pb-20 lg:pb-5">
            <Outlet />
          </div>
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
