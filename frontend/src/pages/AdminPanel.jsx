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
  ChevronRight,
  RefreshCw,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [systemInfo, setSystemInfo] = useState(null);

  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin-login');
      return;
    }
    fetchSystemInfo();
  }, [navigate]);

  const fetchSystemInfo = async () => {
    try {
      const res = await api.get('/health');
      setSystemInfo({
        status: res.data.status === 'ok' ? 'Online' : 'Degraded',
        timestamp: new Date(res.data.timestamp).toLocaleTimeString('en-IN'),
        environment: import.meta.env.MODE || 'production',
        version: '1.0.0',
      });
    } catch {
      setSystemInfo({
        status: 'Unreachable',
        timestamp: '—',
        environment: import.meta.env.MODE || 'production',
        version: '1.0.0',
      });
    }
  };

  const handleSync = async () => {
    setLoading(true);
    try {
      const response = await api.post('/auth/admin/sync', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      toast.success(response.data.message || 'Sync triggered successfully');
      fetchSystemInfo();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to sync');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` },
      });
      setUsers(response.data.users);
      setShowUsers(true);
    } catch {
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
    if (moduleTitle === 'User Permissions') {
      fetchUsers();
    } else if (moduleTitle === 'System Settings') {
      navigate('/settings');
    } else {
      toast.info(`${moduleTitle} is under development`);
    }
  };

  const adminModules = [
    { title: 'System Settings',  icon: Settings,   desc: 'Configure global parameters',     color: 'text-purple-400' },
    { title: 'User Permissions', icon: ShieldCheck, desc: 'Audit role-based access control', color: 'text-gym-accent' },
    { title: 'Database Info',    icon: Database,    desc: 'Schema and table status',          color: 'text-blue-400' },
    { title: 'Audit Logs',       icon: Activity,    desc: 'View system activity history',     color: 'text-green-400' },
  ];

  const statCards = systemInfo
    ? [
        { key: 'API Status',    value: systemInfo.status },
        { key: 'Last Checked',  value: systemInfo.timestamp },
        { key: 'Environment',   value: systemInfo.environment },
        { key: 'Version',       value: systemInfo.version },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-gym-accent/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gym-accent/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-gym-accent to-yellow-600 p-3 rounded-2xl shadow-xl shadow-gym-accent/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                Admin Console
              </h1>
              <p className="text-gray-500 text-sm font-medium">IRONMAN FITNESS — System Management</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2.5 bg-gray-800 hover:bg-red-500/20 border border-gray-700 hover:border-red-500/50 rounded-xl transition-all text-sm font-semibold text-gray-400 hover:text-red-400"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </header>

        {/* System Stats */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {statCards.length === 0 ? (
            <div className="col-span-4 flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gym-accent" />
            </div>
          ) : statCards.map((s, idx) => (
            <div
              key={s.key}
              className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-6 rounded-2xl hover:border-gym-accent/30 transition-all group"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">{s.key}</p>
              <p className={`text-xl font-bold group-hover:text-gym-accent transition-colors ${
                s.value === 'Online' ? 'text-green-400' :
                s.value === 'Unreachable' ? 'text-red-400' : 'text-white'
              }`}>
                {s.value}
              </p>
            </div>
          ))}
        </section>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Layout className="w-5 h-5 text-gym-accent" />
            Management Modules
          </h2>
          <button
            onClick={fetchSystemInfo}
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors px-3 py-1.5 bg-gray-800 rounded-lg"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>

        {/* Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminModules.map((module, idx) => (
            <button
              key={idx}
              onClick={() => handleModuleClick(module.title)}
              className="group text-left bg-gray-800/40 backdrop-blur-md border border-gray-700/50 hover:bg-gray-800/60 p-8 rounded-3xl hover:border-gym-accent shadow-lg transition-all flex items-center justify-between"
            >
              <div className="flex items-start gap-6">
                <div className="p-4 rounded-2xl bg-gray-900 group-hover:scale-110 transition-transform">
                  <module.icon className={`w-8 h-8 ${module.color}`} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-gym-accent transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-gray-500 text-sm font-medium">{module.desc}</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-600 group-hover:text-gym-accent transform group-hover:translate-x-2 transition-all" />
            </button>
          ))}
        </div>

        {/* Sync */}
        <div className="mt-12 bg-[#005c5b]/10 border border-[#005c5b]/30 p-6 rounded-3xl flex items-center gap-6">
          <div className="bg-[#005c5b] p-3 rounded-2xl shrink-0">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-[#01a2a1] font-bold mb-0.5">System Sync</h4>
            <p className="text-gray-400 text-sm">Trigger a manual sync of scheduler and cached data.</p>
          </div>
          <button
            onClick={handleSync}
            disabled={loading}
            className="px-6 py-2 bg-[#005c5b] hover:bg-[#004746] text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        {/* Users Modal */}
        {showUsers && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-800 border border-gray-700 rounded-3xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Users className="text-gym-accent" /> System Users
                </h3>
                <button onClick={() => setShowUsers(false)} className="p-2 hover:bg-gray-700 rounded-xl">
                  <X className="w-5 h-5" />
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
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-4 font-medium">{u.full_name}</td>
                        <td className="py-4 text-gray-400">{u.email}</td>
                        <td className="py-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase ${
                            u.role === 'owner' ? 'bg-orange-600/20 text-orange-400' :
                            u.role === 'manager' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-4 text-gray-400">{u.branch_name || 'Global'}</td>
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
