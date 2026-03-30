import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  LogOut, 
  Settings, 
  Layout, 
  Database, 
  Users, 
  Activity,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    sanityStatus: 'Online',
    apiLatency: '42ms',
    activeSessions: '3',
    lastBackup: '2 hours ago'
  });

  useEffect(() => {
    const adminStatus = localStorage.getItem('isAdmin');
    if (adminStatus !== 'true') {
      navigate('/admin-login');
    } else {
      setIsAdmin(true);
    }
  }, [navigate]);

  const handleSync = async () => {
    setLoading(true);
    try {
      // Use the actual backend URL from config or environment
      const response = await axios.post('http://localhost:5000/api/auth/admin/sync', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      toast.success(response.data.message || 'Sync triggered successfully');
      setStats(prev => ({ ...prev, lastBackup: 'Just now' }));
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to sync data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
      });
      setUsers(response.data.users);
      setShowUsers(true);
    } catch (error) {
      toast.error('Failed to fetch user list');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('isAdmin');
    toast.success('Logged out from admin panel');
    navigate('/admin-login');
  };

  const handleModuleClick = (moduleTitle) => {
    if (moduleTitle === 'Sanity Content') {
      window.open('https://ironman-fitness.sanity.studio', '_blank');
    } else if (moduleTitle === 'User Permissions') {
      fetchUsers();
    } else {
      toast.info(`${moduleTitle} module is under maintenance`);
    }
  };

  const adminModules = [
    { title: 'Sanity Content', icon: Database, desc: 'Manage CMS content and media', color: 'text-blue-400' },
    { title: 'System Settings', icon: Settings, desc: 'Configure global parameters', color: 'text-purple-400' },
    { title: 'User Permissions', icon: ShieldCheck, desc: 'Audit role-based access', color: 'text-gym-accent' },
    { title: 'Audit Logs', icon: Activity, desc: 'View system activity history', color: 'text-green-400' }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-gym-accent/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gym-accent/5 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-12 animate-slideDown">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-gym-accent to-yellow-600 p-3 rounded-2xl shadow-xl shadow-gym-accent/20">
              <ShieldCheck className="w-8 h-8 text-white font-bold" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Admin Console
              </h1>
              <p className="text-gray-500 font-medium text-sm">Welcome back, Administrator</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-yellow-500/20 border border-gray-700 hover:border-yellow-500/50 rounded-xl transition-all duration-300 text-sm font-semibold text-gray-400 hover:text-yellow-400 group"
          >
            <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            Logout
          </button>
        </header>

        {/* System Stats Overview */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {Object.entries(stats).map(([key, value], idx) => (
            <div 
              key={key} 
              className="gym-card bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-6 rounded-2xl hover:border-gym-accent/30 transition-all group animate-fadeIn"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-xl font-bold text-white group-hover:text-gym-accent transition-colors">{value}</p>
            </div>
          ))}
        </section>

        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Layout className="w-5 h-5 text-gym-accent" />
          Management Modules
        </h2>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminModules.map((module, idx) => (
            <button 
              key={idx}
              onClick={() => handleModuleClick(module.title)}
              className="group text-left bg-gray-800/40 backdrop-blur-md border border-gray-700/50 hover:bg-gray-800/60 p-8 rounded-3xl hover:border-gym-accent shadow-lg transition-all duration-300 flex items-center justify-between"
              style={{ animationDelay: `${(idx + 4) * 100}ms` }}
            >
              <div className="flex items-start gap-6">
                <div className={`p-4 rounded-2xl bg-gray-900 group-hover:scale-110 transition-transform`}>
                  <module.icon className={`w-8 h-8 ${module.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-gym-accent transition-colors">{module.title}</h3>
                  <p className="text-gray-500 text-sm font-medium">{module.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-gym-accent transform group-hover:translate-x-2 transition-all" />
            </button>
          ))}
        </div>

        {/* Quick Config Alert */}
        <div className="mt-12 bg-indigo-500/10 border border-indigo-500/30 p-6 rounded-3xl flex items-center gap-6 animate-fadeIn">
          <div className="bg-indigo-500 p-3 rounded-2xl">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-indigo-300 font-bold mb-0.5">Sanity Integration Ready</h4>
            <p className="text-gray-400 text-sm">Your secure auth token is saved in the backend for content management.</p>
          </div>
          <button 
            onClick={handleSync}
            disabled={loading}
            className="ml-auto px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Syncing...' : 'Sync Data'}
          </button>
        </div>

        {/* Users Modal */}
        {showUsers && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-800/50">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Users className="text-gym-accent" /> System Users
                </h3>
                <button 
                  onClick={() => setShowUsers(false)}
                  className="p-2 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-gray-400 text-sm border-b border-gray-700">
                      <th className="pb-4 font-bold uppercase tracking-wider">Full Name</th>
                      <th className="pb-4 font-bold uppercase tracking-wider">Email</th>
                      <th className="pb-4 font-bold uppercase tracking-wider">Role</th>
                      <th className="pb-4 font-bold uppercase tracking-wider">Branch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 font-medium">{user.full_name}</td>
                        <td className="py-4 text-gray-400">{user.email}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                            user.role === 'owner' ? 'bg-orange-600/20 text-orange-400' : 
                            user.role === 'manager' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 text-gray-400">{user.branch_name || 'Global'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
